import { Injectable } from '@nestjs/common';
import { AiProvider, WidgetHistoryItem } from './ai-provider.interface';
import { Configuration } from '@prisma/client';
import { EncryptionService } from '../../common/services/encryption.service';
import OpenAI from 'openai';
import {
    DEFAULT_OPENROUTER_MODEL,
    OPENROUTER_BASE_URL,
    OPENROUTER_REFERER,
    OPENROUTER_TITLE
} from '../../common/constants';

@Injectable()
export class OpenRouterProvider implements AiProvider {
    constructor(private encryptionService: EncryptionService) { }

    async *generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string> {
        const apiKey = this.encryptionService.decrypt(configuration.openRouterApiKey!);
        const openai = new OpenAI({
            apiKey,
            baseURL: OPENROUTER_BASE_URL,
            defaultHeaders: {
                'HTTP-Referer': OPENROUTER_REFERER,
                'X-Title': OPENROUTER_TITLE,
            },
        });

        const stream = await openai.chat.completions.create({
            model: DEFAULT_OPENROUTER_MODEL,
            messages: messages as any,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }
}
