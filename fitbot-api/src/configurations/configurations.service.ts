
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@Injectable()
export class ConfigurationsService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) { }

    async getConfig(userId: string) {
        const config = await this.prisma.configuration.findUnique({
            where: { userId },
            include: { apiKey: true },
        });

        if (!config) {
            return {
                userId,
                widgetColor: '#2563EB',
                faqText: '',
                openAiApiKey: '',
                aiProvider: 'openai',
                openRouterApiKey: '',
                ollamaUrl: 'http://localhost:11434',
                ollamaModel: 'llama3',
            };
        }

        let decryptedOpenAiKey = '';
        let decryptedOpenRouterKey = '';

        try {
            if (config.openAiApiKey) {
                decryptedOpenAiKey = this.encryptionService.decrypt(config.openAiApiKey);
            }
        } catch {
            decryptedOpenAiKey = '';
        }

        try {
            if (config.openRouterApiKey) {
                decryptedOpenRouterKey = this.encryptionService.decrypt(config.openRouterApiKey);
            }
        } catch {
            decryptedOpenRouterKey = '';
        }

        return {
            ...config,
            openAiApiKey: decryptedOpenAiKey,
            openRouterApiKey: decryptedOpenRouterKey,
        };
    }

    async updateConfig(userId: string, dto: UpdateConfigurationDto) {
        const encryptedOpenAiKey = dto.openAiApiKey
            ? this.encryptionService.encrypt(dto.openAiApiKey)
            : null;

        const encryptedOpenRouterKey = dto.openRouterApiKey
            ? this.encryptionService.encrypt(dto.openRouterApiKey)
            : null;

        const data = {
            faqText: dto.faqText,
            widgetColor: dto.widgetColor,
            aiProvider: dto.aiProvider,
            openAiApiKey: encryptedOpenAiKey,
            openRouterApiKey: encryptedOpenRouterKey,
            ollamaUrl: dto.ollamaUrl || 'http://localhost:11434',
            ollamaModel: dto.ollamaModel || 'llama3',
        };

        const config = await this.prisma.configuration.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });

        return {
            ...config,
            openAiApiKey: dto.openAiApiKey || '',
            openRouterApiKey: dto.openRouterApiKey || '',
        };
    }
}
