
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from '../common/services/encryption.service';
import OpenAI from 'openai';

import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ExplanationMetadata } from './explanation-metadata.interface';

import { ValidationService } from '../validation/validation.service';
import { RagService } from '../rag/rag.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    AI_PROVIDERS,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_OPENROUTER_MODEL,
    DEFAULT_OLLAMA_MODEL,
    DEFAULT_OLLAMA_URL,
    OPENROUTER_BASE_URL,
    OPENROUTER_REFERER,
    OPENROUTER_TITLE,
    RAG_TOP_K,
} from '../common/constants';

@Injectable()
export class WidgetService {
    constructor(
        private encryptionService: EncryptionService,
        private chatLogsService: ChatLogsService,
        private validationService: ValidationService,
        private ragService: RagService,
        private prisma: PrismaService,
    ) { }

    getPublicConfig(configuration: any) {
        return {
            widgetColor: configuration.widgetColor,
            greetingMessage: configuration.greetingMessage || 'How can I help you?',
        };
    }

    async *processChat(configuration: any, message: string, history: any[]): AsyncGenerator<string | { explanation: ExplanationMetadata }> {
        const startTime = Date.now();
        const provider = configuration.aiProvider || AI_PROVIDERS.OPENAI;
        const model = configuration.ollamaModel || (provider === AI_PROVIDERS.OLLAMA ? DEFAULT_OLLAMA_MODEL : (provider === AI_PROVIDERS.OPENAI ? DEFAULT_OPENAI_MODEL : DEFAULT_OPENROUTER_MODEL));

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
                document: {
                    configurationId: configuration.id,
                },
            },
            include: {
                document: {
                    select: { fileName: true }
                }
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
                contextUsed: contextUsedSummary,
                contextLength: contextContent.length,
                systemPromptSummary: `Retrieved ${relevantChunks.length} chunks from ${allChunks.length} total blocks.`,
                responseTimeMs,
                timestamp: new Date().toISOString(),
                validationResults: inputValidation.results,
                sources: Array.from(
                    new Map((relevantChunks as any).map(c => [c.fileName, {
                        id: c.id,
                        fileName: c.fileName,
                        content: c.content
                    }])).values()
                ) as any[]
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
            model: DEFAULT_OPENAI_MODEL,
            messages: messages as any,
            stream: true,
        });

        return stream;
    }

    private async chatWithOpenRouter(configuration: any, messages: any[]) {
        const apiKey = this.encryptionService.decrypt(configuration.openRouterApiKey);
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

        return stream;
    }

    private async chatWithOllama(configuration: any, messages: any[]) {
        const ollamaUrl = configuration.ollamaUrl || DEFAULT_OLLAMA_URL;
        const model = configuration.ollamaModel || DEFAULT_OLLAMA_MODEL;

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
