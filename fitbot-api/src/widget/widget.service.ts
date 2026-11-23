
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
    RAG_SYNTHESIS_TOP_K,
    HYBRID_RETRIEVAL_ENABLED,
} from '../common/constants';
import { AiProviderService } from './providers/ai-provider.service';
import { ExplanationHelper } from './explanation.helper';
import { WidgetHistoryItem } from './providers/ai-provider.interface';

import { SemanticRouterService } from '../semantic-router/semantic-router.service';
import { HybridRetrievalService } from '../retrieval/hybrid-retrieval.service';

@Injectable()
export class WidgetService {
    constructor(
        private chatLogsService: ChatLogsService,
        private validationService: ValidationService,
        private ragService: RagService,
        private prisma: PrismaService,
        private aiProviderService: AiProviderService,
        private explanationHelper: ExplanationHelper,
        private semanticRouter: SemanticRouterService,
        private hybridRetrievalService: HybridRetrievalService,
    ) { }

    getPublicConfig(configuration: Configuration) {
        return {
            widgetColor: configuration.widgetColor,
            widgetTitle: configuration.widgetTitle || 'FitBot Assistant',
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

        // --- Input Validation ---
        // Runs before routing/retrieval so blocked messages don't pay for that work.
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

        // --- Mini-RAG: Context Retrieval ---
        // Semantic Routing (Classify the query). Chunk-level semantic search is intentionally
        // gated off by default in Phase 1 until Phase 2's evaluation gate passes; see
        // RAG_AND_ROUTING_DESIGN.md.
        let route: 'standard_search' | 'rag_synthesis' = 'standard_search';
        let confidence = 0;
        try {
            ({ route, confidence } = await this.semanticRouter.routeQuery(message));
        } catch (error) {
            console.error('Semantic route failed; using standard search fallback:', error);
        }

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

        const topK = route === 'rag_synthesis' ? RAG_SYNTHESIS_TOP_K : RAG_TOP_K;
        // Hybrid (lexical + semantic, RRF-fused) retrieval is built and tested but
        // gated off by default until Phase 2 passes; see RAG_AND_ROUTING_DESIGN.md.
        const relevantChunks = HYBRID_RETRIEVAL_ENABLED
            ? await this.hybridRetrievalService.search(message, configuration.id, allChunks as any, topK)
            : this.ragService.search(message, allChunks as any, topK);

        const retrievalMethod = HYBRID_RETRIEVAL_ENABLED ? 'hybrid' : 'lexical';
        const retrievalData = {
            route,
            routeConfidence: confidence,
            method: retrievalMethod,
            chunks: relevantChunks.map((c: any, index: number) => ({
                chunkId: c.id,
                lexicalRank: c.lexicalRank ?? index + 1,
                semanticRank: c.semanticRank ?? null,
                rrfScore: c.rrfScore ?? c.score ?? null,
            }))
        };

        // Fallback or aggregate context
        const contextContent = relevantChunks.map(c => c.content).join('\n\n');

        const contextUsedSummary = relevantChunks.length > 0
            ? `Retrieved ${relevantChunks.length} relevant sections`
            : "No specific match found (using general context)";

        const baseInstructions = configuration.systemInstructions || "You are a helpful assistant for a gym.";
        let systemPrompt = '';

        if (route === 'rag_synthesis') {
            systemPrompt = `${baseInstructions}\n\nUse the following EXCERPT from the gym's Knowledge Base to answer user questions:\n---\n${contextContent}\n---\nIf the answer is not in this excerpt, politely say you don't know and suggest contacting support. Provide a detailed, comprehensive answer synthesizing the available information.`;
        } else {
            // standard_search
            systemPrompt = `${baseInstructions}\n\nBased on the following facts:\n---\n${contextContent}\n---\nProvide a direct, concise, factual answer to the user's question. Do not provide extra unnecessary details.`;
        }

        if (relevantChunks.length === 0) {
            const abstentionMessage = 'I could not find relevant information in the knowledge base to answer your question.';

            try {
                await this.chatLogsService.createLog({
                    configurationId: configuration.id,
                    userMessage: message,
                    aiResponse: abstentionMessage,
                    provider: 'none',
                    model: 'abstention',
                    contextLength: 0,
                    validationFlags: inputValidation.results.map(r => r.ruleId),
                    responseTimeMs: Date.now() - startTime,
                    retrieval: retrievalData,
                });
            } catch (loggingError) {
                console.error('Failed to log abstained message:', loggingError);
            }

            yield abstentionMessage;
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
                inputValidation.results,
                route,
                confidence
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
                    responseTimeMs,
                    retrieval: retrievalData
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
                    responseTimeMs,
                    retrieval: retrievalData
                });
            } catch (loggingError) {
                console.error('Failed to log error state:', loggingError);
            }

            throw error;
        }
    }

}
