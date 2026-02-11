
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from '../common/services/encryption.service';
import OpenAI from 'openai';

import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ExplanationMetadata } from './explanation-metadata.interface';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class WidgetService {
    constructor(
        private encryptionService: EncryptionService,
        private chatLogsService: ChatLogsService,
        private validationService: ValidationService,
    ) { }

    getPublicConfig(configuration: any) {
        return {
            widgetColor: configuration.widgetColor,
            greetingMessage: configuration.greetingMessage || 'How can I help you?',
        };
    }

    async *processChat(configuration: any, message: string, history: any[]): AsyncGenerator<string | { explanation: ExplanationMetadata }> {
        const startTime = Date.now();
        const provider = configuration.aiProvider || 'openai';
        const model = configuration.ollamaModel || (provider === 'openai' ? 'gpt-3.5-turbo' : 'openai/gpt-3.5-turbo');

        const systemPrompt = `You are a helpful assistant for a gym. Use the following FAQ to answer user questions:
${configuration.faqText}

If the answer is not in the FAQ, politely say you don't know and suggest contacting support.`;

        // --- Input Validation ---
        const inputValidation = await this.validationService.validate('input', message, { configuration, userMessage: message });

        if (inputValidation.hasBlockingError) {
            const blockingMsg = inputValidation.blockingMessage || "Your message triggered a safety rule.";

            // Log the blocked attempt
            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: blockingMsg,
                    provider,
                    model,
                    contextLength: 0,
                    validationFlags: inputValidation.results.map(r => r.ruleId),
                    responseTimeMs: Date.now() - startTime
                });
            } catch (loggingError) {
                console.error('Failed to log blocked message:', loggingError);
            }

            yield blockingMsg;
            return;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
        ];

        let fullResponse = '';
        let errorOccurred = false;

        try {
            let stream: AsyncIterable<any> | any;

            switch (provider) {
                case 'openai':
                    stream = await this.chatWithOpenAI(configuration, messages);
                    break;
                case 'openrouter':
                    stream = await this.chatWithOpenRouter(configuration, messages);
                    break;
                case 'ollama':
                    const response = await this.chatWithOllama(configuration, messages);
                    // Standardize Ollama response to behave like a stream chunk
                    stream = [{ choices: [{ delta: { content: response.choices[0].message.content } }] }];
                    break;
                default:
                    throw new InternalServerErrorException(`Unknown AI provider: ${provider}`);
            }

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    yield content;
                }
            }

            // Stream completed successfully
            const endTime = Date.now();
            const responseTimeMs = endTime - startTime;

            const explanation: ExplanationMetadata = {
                provider,
                model,
                contextUsed: "Entire FAQ",
                contextLength: systemPrompt.length,
                systemPromptSummary: `Used entire FAQ (${configuration.faqText.length} chars)`,
                responseTimeMs,
                timestamp: new Date().toISOString()
            };

            yield { explanation };

            // Log successful interaction
            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: fullResponse,
                    provider,
                    model,
                    contextLength: systemPrompt.length,
                    validationFlags: inputValidation.results.map(r => r.ruleId),
                    responseTimeMs
                });
            } catch (logError) {
                console.error('Failed to save chat log:', logError);
            }

        } catch (error) {
            console.error(`Error processing chat with ${provider}:`, error);
            errorOccurred = true;

            const responseTimeMs = Date.now() - startTime;

            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: fullResponse + " [ERROR INTERRUPTED]",
                    provider,
                    model,
                    contextLength: systemPrompt.length,
                    validationFlags: ['ERROR'],
                    responseTimeMs
                });
            } catch (loggingError) {
                console.error('Failed to log error state:', loggingError);
            }

            throw error;
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
