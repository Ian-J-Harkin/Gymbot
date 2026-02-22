
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { DEFAULT_WIDGET_COLOR, DEFAULT_OLLAMA_URL, DEFAULT_OLLAMA_MODEL, AI_PROVIDERS } from '../common/constants';

@Injectable()
export class ConfigurationsService {
    private readonly logger = new Logger(ConfigurationsService.name);

    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) { }

    /**
     * Masks a key for safe display, e.g. "sk-abc...xyz".
     * Returns empty string for empty/null keys.
     */
    private maskKey(key: string): string {
        if (!key || key.length < 8) return key ? '••••••••' : '';
        return `${key.substring(0, 5)}...${key.substring(key.length - 3)}`;
    }

    /**
     * Returns true if the value looks like a masked key (from maskKey()).
     */
    private isMaskedValue(value: string): boolean {
        if (!value) return false;
        return value === '••••••••' || /^.{5}\.\.\..{3}$/.test(value);
    }

    async getConfig(userId: string) {
        const config = await this.prisma.configuration.findUnique({
            where: { userId },
        });

        if (!config) {
            return {
                userId,
                widgetColor: DEFAULT_WIDGET_COLOR,
                faqText: '',
                openAiApiKey: '',
                aiProvider: AI_PROVIDERS.OPENAI,
                openRouterApiKey: '',
                ollamaUrl: DEFAULT_OLLAMA_URL,
                ollamaModel: DEFAULT_OLLAMA_MODEL,
            };
        }

        let decryptedOpenAiKey = '';
        let decryptedOpenRouterKey = '';

        try {
            if (config.openAiApiKey) {
                decryptedOpenAiKey = this.encryptionService.decrypt(config.openAiApiKey);
            }
        } catch (err) {
            this.logger.warn(`Failed to decrypt OpenAI key for user ${userId}: ${err.message}`);
            decryptedOpenAiKey = '';
        }

        try {
            if (config.openRouterApiKey) {
                decryptedOpenRouterKey = this.encryptionService.decrypt(config.openRouterApiKey);
            }
        } catch (err) {
            this.logger.warn(`Failed to decrypt OpenRouter key for user ${userId}: ${err.message}`);
            decryptedOpenRouterKey = '';
        }

        return {
            ...config,
            openAiApiKey: this.maskKey(decryptedOpenAiKey),
            openRouterApiKey: this.maskKey(decryptedOpenRouterKey),
        };
    }

    async updateConfig(userId: string, dto: UpdateConfigurationDto) {
        // If user submitted a masked value, preserve the existing encrypted key
        let encryptedOpenAiKey: string | null = null;
        let encryptedOpenRouterKey: string | null = null;

        if (dto.openAiApiKey && !this.isMaskedValue(dto.openAiApiKey)) {
            // New key submitted — encrypt it
            encryptedOpenAiKey = this.encryptionService.encrypt(dto.openAiApiKey);
        } else if (dto.openAiApiKey && this.isMaskedValue(dto.openAiApiKey)) {
            // Masked value — keep existing encrypted key
            const existing = await this.prisma.configuration.findUnique({
                where: { userId },
                select: { openAiApiKey: true },
            });
            encryptedOpenAiKey = existing?.openAiApiKey || null;
        }

        if (dto.openRouterApiKey && !this.isMaskedValue(dto.openRouterApiKey)) {
            encryptedOpenRouterKey = this.encryptionService.encrypt(dto.openRouterApiKey);
        } else if (dto.openRouterApiKey && this.isMaskedValue(dto.openRouterApiKey)) {
            const existing = await this.prisma.configuration.findUnique({
                where: { userId },
                select: { openRouterApiKey: true },
            });
            encryptedOpenRouterKey = existing?.openRouterApiKey || null;
        }

        const data = {
            faqText: dto.faqText || '',
            widgetColor: dto.widgetColor,
            aiProvider: dto.aiProvider,
            openAiApiKey: encryptedOpenAiKey,
            openRouterApiKey: encryptedOpenRouterKey,
            ollamaUrl: dto.ollamaUrl || DEFAULT_OLLAMA_URL,
            ollamaModel: dto.ollamaModel || DEFAULT_OLLAMA_MODEL,
        };

        const config = await this.prisma.configuration.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });

        return {
            ...config,
            openAiApiKey: this.maskKey(dto.openAiApiKey || ''),
            openRouterApiKey: this.maskKey(dto.openRouterApiKey || ''),
        };
    }

    async getAnalytics(userId: string) {
        const config = await this.prisma.configuration.findUnique({
            where: { userId },
            select: { id: true }
        });

        if (!config) {
            return {
                totalInteractions: 0,
                averageResponseTime: 0,
                dailyVolume: [],
            };
        }

        // Get logs for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = await this.prisma.chatLog.findMany({
            where: {
                configurationId: config.id,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                createdAt: true,
                responseTimeMs: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const totalInteractions = logs.length;
        const averageResponseTime =
            totalInteractions > 0
                ? Math.round(logs.reduce((acc, log) => acc + log.responseTimeMs, 0) / totalInteractions)
                : 0;

        // Group by day for the chart
        const dailyVolumeMap = new Map<string, number>();
        logs.forEach(log => {
            // YYYY-MM-DD string format
            const dateStr = log.createdAt.toISOString().split('T')[0];
            dailyVolumeMap.set(dateStr, (dailyVolumeMap.get(dateStr) || 0) + 1);
        });

        const dailyVolume = Array.from(dailyVolumeMap.entries()).map(([date, count]) => ({
            date,
            count
        }));

        return {
            totalInteractions,
            averageResponseTime,
            dailyVolume
        };
    }
}

