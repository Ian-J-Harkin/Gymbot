
import { Injectable } from '@nestjs/common';

import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ExplanationMetadata } from './explanation-metadata.interface';

import { ValidationService } from '../validation/validation.service';
import { RagService } from '../rag/rag.service';
import { PrismaService } from '../prisma/prisma.service';
import { Configuration, User } from '@prisma/client';
import {
    AI_PROVIDERS,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_OPENROUTER_MODEL,
    DEFAULT_OLLAMA_MODEL,
    RAG_TOP_K,
} from '../common/constants';
import { AiProviderService } from './providers/ai-provider.service';
import { ExplanationHelper } from './explanation.helper';
import { WidgetHistoryItem } from './providers/ai-provider.interface';

@Injectable()
export class WidgetService {
    constructor(
        private chatLogsService: ChatLogsService,
        private validationService: ValidationService,
        private ragService: RagService,
        private prisma: PrismaService,
        private aiProviderService: AiProviderService,
        private explanationHelper: ExplanationHelper,
    ) { }

    getPublicConfig(configuration: Configuration) {
        return {
            widgetColor: configuration.widgetColor,
            greetingMessage: configuration.greetingMessage || 'How can I help you?',
        };
    }

    async *processChat(
        configuration: Configuration & { user?: User },
        message: string,
        history: WidgetHistoryItem[]
    ): AsyncGenerator<string | { explanation: ExplanationMetadata }> {
        const startTime = Date.now();
        const providerName = configuration.aiProvider || AI_PROVIDERS.OPENAI;
        const model = configuration.ollamaModel || (providerName === AI_PROVIDERS.OLLAMA ? DEFAULT_OLLAMA_MODEL : (providerName === AI_PROVIDERS.OPENAI ? DEFAULT_OPENAI_MODEL : DEFAULT_OPENROUTER_MODEL));

        // --- Subscription Check ---
        if (configuration.requireSubscription && configuration.user?.subscriptionStatus !== 'active') {
            yield "Service unavailable, please check with admin.";
            return;
        }

        // --- Mini-RAG: Context Retrieval ---
        const faqChunks = this.ragService.chunkText(configuration.faqText);

        // Fetch document chunks from the database with document info
        const documentChunks = await this.prisma.documentChunk.findMany({
            where: {
                document: { configurationId: configuration.id },
            },
            include: {
                document: { select: { fileName: true } }
            }
        });

        const allChunks = [
            ...faqChunks.map((c, i) => ({
                id: `faq-${i}`,
                content: c.content,
                fileName: 'Gym FAQ'
            })),
            ...documentChunks.map(c => ({
                id: c.id,
                content: c.content,
                fileName: c.document.fileName
            })),
        ];

        const relevantChunks = this.ragService.search(message, allChunks as any, RAG_TOP_K);

        // Fallback or aggregate context
        const contextContent = relevantChunks.length > 0
            ? relevantChunks.map(c => c.content).join('\n\n')
            : (faqChunks.length > 0 ? faqChunks[0].content : 'No FAQ information available.');

        const contextUsedSummary = relevantChunks.length > 0
            ? `Retrieved ${relevantChunks.length} relevant sections`
            : "No specific match found (using general context)";

        const systemPrompt = `You are a helpful assistant for a gym. Use the following EXCERPT from the gym's FAQ to answer user questions:
---
${contextContent}
---
If the answer is not in this excerpt, politely say you don't know and suggest contacting support.`;

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
                    provider: providerName,
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

        const messages: WidgetHistoryItem[] = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
        ] as WidgetHistoryItem[];

        let fullResponse = '';
        let errorOccurred = false;

        try {
<<<<<<< HEAD
            let stream: AsyncIterable<any> | any;

            switch (provider) {
                case 'openai':
                    stream = await this.chatWithOpenAI(configuration, messages);
                    break;
                case 'openrouter':
                    stream = await this.chatWithOpenRouter(configuration, messages);
                    break;
                case 'ollama':
                    stream = await this.chatWithOllama(configuration, messages);
                    break;
                default:
                    throw new InternalServerErrorException(`Unknown AI provider: ${provider}`);
            }
=======
            const providerStrategy = this.aiProviderService.getProvider(providerName);
            const stream = providerStrategy.generateResponse(configuration, messages);
>>>>>>> feat/kb-uploads-and-security

            for await (const chunk of stream) {
                fullResponse += chunk;
                yield chunk;
            }

            // Stream completed successfully
            const responseTimeMs = Date.now() - startTime;

            const explanation = this.explanationHelper.build(
                providerName,
                model,
                contextContent,
                relevantChunks,
                allChunks.length,
                responseTimeMs,
                inputValidation.results
            );

            yield { explanation };

            // Log successful interaction
            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: fullResponse,
                    provider: providerName,
                    model,
                    contextLength: systemPrompt.length,
                    validationFlags: inputValidation.results.map(r => r.ruleId),
                    responseTimeMs
                });
            } catch (logError) {
                console.error('Failed to save chat log:', logError);
            }

        } catch (error) {
            console.error(`Error processing chat with ${providerName}:`, error);
            errorOccurred = true;

            const responseTimeMs = Date.now() - startTime;

            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: fullResponse + " [ERROR INTERRUPTED]",
                    provider: providerName,
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
<<<<<<< HEAD

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

    private async *chatWithOllama(configuration: any, messages: any[]) {
        const ollamaUrl = configuration.ollamaUrl || 'http://localhost:11434';
        const model = configuration.ollamaModel || 'llama3';

        // Ensure URL doesn't end with slash
        const baseUrl = ollamaUrl.replace(/\/$/, '');

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true, // Enable streaming
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('Ollama response has no body');
        }

        // Handle the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            yield {
                                choices: [{
                                    delta: { content: json.message.content }
                                }]
                            };
                        }
                    } catch (e) {
                        console.warn('Failed to parse Ollama chunk:', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
=======
>>>>>>> feat/kb-uploads-and-security
}
