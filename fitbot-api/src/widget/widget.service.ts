
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
            const providerStrategy = this.aiProviderService.getProvider(providerName);
            const stream = providerStrategy.generateResponse(configuration, messages);

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

}
