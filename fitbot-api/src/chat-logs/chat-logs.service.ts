import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatLog } from '@prisma/client';

export type CreateChatLogDto = {
    configurationId: string;
    userMessage: string;
    aiResponse: string;
    provider: string;
    model: string;
    contextLength: number;
    validationFlags: string[];
    responseTimeMs: number;
};

@Injectable()
export class ChatLogsService {
    constructor(private prisma: PrismaService) { }

    async createLog(data: CreateChatLogDto): Promise<ChatLog> {
        return this.prisma.chatLog.create({
            data: {
                configuration: { connect: { id: data.configurationId } },
                userMessage: data.userMessage,
                aiResponse: data.aiResponse,
                provider: data.provider,
                model: data.model,
                contextLength: data.contextLength,
                validationFlags: data.validationFlags,
                responseTimeMs: data.responseTimeMs,
            },
        });
    }

    async findByUserId(userId: string, page = 1, pageSize = 50): Promise<{ data: ChatLog[]; total: number }> {
        const where = {
            configuration: { userId },
        };

        const [data, total] = await Promise.all([
            this.prisma.chatLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.chatLog.count({ where }),
        ]);

        return { data, total };
    }
}

