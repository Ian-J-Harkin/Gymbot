import { Controller, Get, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { WidgetService } from './widget.service';
import { WidgetHistoryItem } from './providers/ai-provider.interface';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';
import { ApiKeyThrottlerGuard } from '../common/guards/api-key-throttler.guard';
import { ApiKeyRequest } from '../common/interfaces/auth.interfaces';
import { Throttle } from '@nestjs/throttler';
import { IsString, MaxLength, IsArray, IsOptional } from 'class-validator';
import { MAX_CHAT_MESSAGE_LENGTH } from '../common/constants';

class ChatMessageDto {
    @IsString()
    @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
    message: string;

    @IsOptional()
    @IsArray()
    history: WidgetHistoryItem[];
}

@Controller('widget')
@UseGuards(ApiKeyAuthGuard)
export class WidgetController {
    constructor(private readonly widgetService: WidgetService) { }

    @Get('config')
    getConfig(@Request() req: ApiKeyRequest) {
        return this.widgetService.getPublicConfig(req.configuration);
    }

    @Throttle({ default: { limit: 20, ttl: 60000 } })
    @UseGuards(ApiKeyAuthGuard, ApiKeyThrottlerGuard)
    @Post('chat')
    async chat(@Request() req: ApiKeyRequest, @Body() body: ChatMessageDto, @Res() res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            const result = this.widgetService.processChat(req.configuration, body.message, body.history || []);

            for await (const chunk of result) {
                if (typeof chunk === 'string') {
                    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
                } else if (chunk && typeof chunk === 'object' && 'explanation' in chunk) {
                    res.write(`data: ${JSON.stringify({ explanation: chunk.explanation })}\n\n`);
                }
            }
        } catch (error) {
            console.error('Error in chat stream:', error);
            let errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (errorMessage.includes('Invalid encrypted string')) {
                errorMessage = 'Configuration Error: AI Provider settings are invalid. Please check and re-save your configuration in the Admin Dashboard.';
            }

            res.write(`data: ${JSON.stringify({ content: `I'm sorry, I encountered an error: ${errorMessage}` })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    }
}
