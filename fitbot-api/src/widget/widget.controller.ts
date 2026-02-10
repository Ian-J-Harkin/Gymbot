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
        const result = await this.widgetService.processChat(req.configuration, body.message, body.history || []);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Check if result is an async iterable (streaming response from OpenAI/OpenRouter)
        if (result && typeof result[Symbol.asyncIterator] === 'function') {
            for await (const chunk of result) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
        } else {
            // Non-streaming response (Ollama)
            const content = result.choices?.[0]?.message?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    }
}
