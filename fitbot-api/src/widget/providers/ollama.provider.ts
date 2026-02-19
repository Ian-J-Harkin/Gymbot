import { Injectable } from '@nestjs/common';
import { AiProvider, WidgetHistoryItem } from './ai-provider.interface';
import { Configuration } from '@prisma/client';
import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL } from '../../common/constants';

@Injectable()
export class OllamaProvider implements AiProvider {
    async *generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string> {
        const ollamaUrl = configuration.ollamaUrl || DEFAULT_OLLAMA_URL;
        const model = configuration.ollamaModel || DEFAULT_OLLAMA_MODEL;

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false, // Currently non-streaming
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.message?.content || 'No response from Ollama';

        yield content;
    }
}
