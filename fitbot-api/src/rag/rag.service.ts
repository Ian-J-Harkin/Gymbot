import { Injectable } from '@nestjs/common';

export interface RagChunk {
    id: number;
    content: string;
    score?: number;
}

@Injectable()
export class RagService {
    /**
     * Simple chunking strategy: split by double newlines (typical Q&A blocks)
     */
    chunkText(text: string): RagChunk[] {
        if (!text) return [];

        return text
            .split(/\n\s*\n/)
            .map((block, index) => ({
                id: index,
                content: block.trim(),
            }))
            .filter((chunk) => chunk.content.length > 0);
    }

    /**
     * Mini-RAG search: Keyword overlap / Jaccard similarity
     * This is a placeholder for a more advanced vector search (Phase 4.2+)
     */
    search(query: string, chunks: RagChunk[], topK: number = 2): RagChunk[] {
        const queryTerms = this.tokenize(query);

        const scoredChunks = chunks.map((chunk) => {
            const chunkTerms = this.tokenize(chunk.content);
            const score = this.calculateOverlap(queryTerms, chunkTerms);
            return { ...chunk, score };
        });

        // Sort by score descending and take top K
        return scoredChunks
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .filter(chunk => (chunk.score || 0) > 0)
            .slice(0, topK);
    }

    private tokenize(text: string): Set<string> {
        return new Set(
            text
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3) // Basic stopword filter
        );
    }

    private calculateOverlap(setA: Set<string>, setB: Set<string>): number {
        if (setA.size === 0) return 0;

        let intersection = 0;
        for (const term of setA) {
            if (setB.has(term)) {
                intersection++;
            }
        }

        // Simple intersection count normalized by query terms
        return intersection / setA.size;
    }
}
