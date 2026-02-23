import { Injectable } from '@nestjs/common';
import { AiProvider, WidgetHistoryItem } from './ai-provider.interface';
import { Configuration } from '@prisma/client';
import { EncryptionService } from '../../common/services/encryption.service';
import OpenAI from 'openai';
import { DEFAULT_OPENAI_MODEL } from '../../common/constants';

@Injectable()
export class OpenAiProvider implements AiProvider {
    constructor(private encryptionService: EncryptionService) { }

    async *generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string> {
        const apiKey = this.encryptionService.decrypt(configuration.openAiApiKey!);
        const openai = new OpenAI({ apiKey });

        const stream = await openai.chat.completions.create({
            model: DEFAULT_OPENAI_MODEL,
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
