import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
    constructor(private prisma: PrismaService) { }

    async createApiKey(userId: string) {
        // 1. Ensure configuration exists for the user
        let config = await this.prisma.configuration.findUnique({
            where: { userId },
        });

        if (!config) {
            // Create default configuration if it doesn't exist
            config = await this.prisma.configuration.create({
                data: {
                    userId,
                    faqText: '',
                    openAiApiKey: '', // Empty initially
                },
            });
        }

        // 2. Generate new API Key
        const newKey = crypto.randomBytes(32).toString('hex');

        // 3. Upsert the API Key (Replace old if exists)
        const apiKey = await this.prisma.apiKey.upsert({
            where: { configurationId: config.id },
            update: {
                key: newKey,
                status: 'ACTIVE',
            },
            create: {
                key: newKey,
                configurationId: config.id,
                status: 'ACTIVE',
            },
        });

        return { apiKey: apiKey.key };
    }
}
