import { Injectable } from '@nestjs/common';
import { AiProvider, WidgetHistoryItem } from './ai-provider.interface';
import { Configuration } from '@prisma/client';
import { EncryptionService } from '../../common/services/encryption.service';
import OpenAI from 'openai';
import {
    DEFAULT_HUGGINGFACE_MODEL,
    HUGGINGFACE_BASE_URL,
} from '../../common/constants';

@Injectable()
export class HuggingFaceProvider implements AiProvider {
    constructor(private encryptionService: EncryptionService) { }

    async *generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string> {
        const apiKey = this.encryptionService.decrypt(configuration.huggingFaceApiKey!);
        const openai = new OpenAI({
            apiKey,
            baseURL: HUGGINGFACE_BASE_URL,
        });

        const stream = await openai.chat.completions.create({
            model: DEFAULT_HUGGINGFACE_MODEL,
            messages: messages as any,
            stream: true,
            max_tokens: 500, // HF often responds better with explicit max_tokens
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                yield content;
            }
        }
    }
}
