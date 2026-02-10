
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from '../common/services/encryption.service';
import OpenAI from 'openai';

@Injectable()
export class WidgetService {
    constructor(private encryptionService: EncryptionService) { }

    getPublicConfig(configuration: any) {
        return {
            widgetColor: configuration.widgetColor,
            greetingMessage: configuration.greetingMessage || 'How can I help you?',
        };
    }

    async processChat(configuration: any, message: string, history: any[]): Promise<any> {
        const provider = configuration.aiProvider || 'openai';

        const systemPrompt = `You are a helpful assistant for a gym. Use the following FAQ to answer user questions:
${configuration.faqText}

If the answer is not in the FAQ, politely say you don't know and suggest contacting support.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
        ];

        try {
            switch (provider) {
                case 'openai':
                    return this.chatWithOpenAI(configuration, messages);
                case 'openrouter':
                    return this.chatWithOpenRouter(configuration, messages);
                case 'ollama':
                    return this.chatWithOllama(configuration, messages);
                default:
                    throw new InternalServerErrorException(`Unknown AI provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error processing chat with ${provider}:`, error);
            throw new InternalServerErrorException('Failed to process chat message');
        }
    }

    private async chatWithOpenAI(configuration: any, messages: any[]) {
        const apiKey = this.encryptionService.decrypt(configuration.openAiApiKey);
        const openai = new OpenAI({ apiKey });

        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages as any,
            stream: true,
        });

        return stream;
    }

    private async chatWithOpenRouter(configuration: any, messages: any[]) {
        const apiKey = this.encryptionService.decrypt(configuration.openRouterApiKey);
        const openai = new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': 'https://fitbot.app',
                'X-Title': 'FitBot',
            },
        });

        const stream = await openai.chat.completions.create({
            model: 'openai/gpt-3.5-turbo',
            messages: messages as any,
            stream: true,
        });

        return stream;
    }

    private async chatWithOllama(configuration: any, messages: any[]) {
        const ollamaUrl = configuration.ollamaUrl || 'http://localhost:11434';
        const model = configuration.ollamaModel || 'llama3';

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Return a simple object matching what the controller expects
        return {
            choices: [{
                message: {
                    role: 'assistant',
                    content: data.message?.content || 'No response from Ollama',
                },
            }],
        };
    }
}
