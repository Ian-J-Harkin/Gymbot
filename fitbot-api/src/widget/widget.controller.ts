import { Controller, Get, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { WidgetService } from './widget.service';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';

@Controller('widget')
@UseGuards(ApiKeyAuthGuard)
export class WidgetController {
    constructor(private readonly widgetService: WidgetService) { }

    @Get('config')
    getConfig(@Request() req) {
        return this.widgetService.getPublicConfig(req.configuration);
    }

    @Post('chat')
    async chat(@Request() req, @Body() body: { message: string; history: any[] }, @Res() res: Response) {
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
            // Optionally send an error event to the client
            res.write(`data: ${JSON.stringify({ content: "I'm sorry, I encountered an error." })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    }
}
