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
        const queryTerms = Array.from(this.tokenize(query));
        if (queryTerms.length === 0) return [];

        const scoredChunks = chunks.map((chunk) => {
            const chunkText = chunk.content.toLowerCase();
            let score = 0;

            // Score based on term frequency and presence
            queryTerms.forEach(term => {
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                const matches = chunkText.match(regex);
                if (matches) {
                    // Give points for existence and extra for frequency
                    score += 1 + (matches.length * 0.2);
                }
            });

            // Bonus for exact phrase match if query has multiple words
            if (queryTerms.length > 1 && chunkText.includes(query.toLowerCase())) {
                score += 5;
            }

            return { ...chunk, score };
        });

        // Sort by score descending and filter out zero scores
        return scoredChunks
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .filter(chunk => (chunk.score || 0) > 0)
            .slice(0, topK);
    }

    private tokenize(text: string): Set<string> {
        const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'with', 'from', 'your', 'have', 'does', 'the', 'and', 'for']);
        return new Set(
            text
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2 && !stopWords.has(word))
        );
    }
}
