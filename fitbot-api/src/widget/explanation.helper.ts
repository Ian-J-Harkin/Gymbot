import { Injectable } from '@nestjs/common';
import { ExplanationMetadata } from './explanation-metadata.interface';
import { ValidationResult } from '../validation/validation.models';

@Injectable()
export class ExplanationHelper {
    build(
        provider: string,
        model: string,
        contextContent: string,
        relevantChunks: any[],
        allChunksCount: number,
        responseTimeMs: number,
        validationResults?: ValidationResult[]
    ): ExplanationMetadata {
        const uniqueSources = new Map(relevantChunks.map(c => [c.fileName, {
            id: c.id,
            fileName: c.fileName,
            content: c.content
        }]));

        return {
            provider,
            model,
            contextUsed: relevantChunks.length > 0
                ? `Retrieved ${relevantChunks.length} relevant sections`
                : "No specific match found (using general context)",
            contextLength: contextContent.length,
            systemPromptSummary: `Retrieved ${relevantChunks.length} chunks from ${allChunksCount} total blocks.`,
            responseTimeMs,
            timestamp: new Date().toISOString(),
            validationResults,
            sources: Array.from(uniqueSources.values())
        };
    }
}
