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
}
