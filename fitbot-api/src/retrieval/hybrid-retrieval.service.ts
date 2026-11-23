import { Injectable, Logger } from '@nestjs/common';
import { RagService, RagChunk } from '../rag/rag.service';
import { SemanticSearchService } from '../semantic-search/semantic-search.service';
import {
  fuseWithReciprocalRankFusion,
  FusedCandidate,
  RetrievalCandidate,
} from './rrf.util';

/**
 * Combines the existing lexical retriever with the new semantic-search service
 * via reciprocal rank fusion. See eval_implementation_plan.md Task 3.5.
 *
 * **Semantic veto gate (Option A):** for small documents where chunk_count ≤
 * topK, lexical search returns every chunk regardless of relevance (any single
 * keyword overlap scores > 0). To prevent these false positives from wasting
 * LLM calls, the semantic retriever acts as a relevance gate: if it returns 0
 * chunks (i.e. no chunk is within MAX_DISTANCE of the query embedding), the
 * hybrid retriever returns [] — triggering deterministic abstention in
 * WidgetService.processChat without ever calling the LLM.
 *
 * Gated behind HYBRID_RETRIEVAL_ENABLED (common/constants.ts) until Task 3.8.
 */
@Injectable()
export class HybridRetrievalService {
  private readonly logger = new Logger(HybridRetrievalService.name);

  constructor(
    private readonly ragService: RagService,
    private readonly semanticSearchService: SemanticSearchService,
  ) {}

  async search(
    query: string,
    configurationId: string,
    chunks: RetrievalCandidate[],
    topK: number,
  ): Promise<FusedCandidate[]> {
    // Semantic search first — acts as a relevance veto gate.
    const semanticRanked = await this.semanticSearchService.search(
      query,
      configurationId,
      topK,
    );

    if (semanticRanked.length === 0) {
      this.logger.debug(
        `Semantic veto: no chunks within distance threshold for query "${query.slice(0, 80)}"; skipping lexical search and returning [].`,
      );
      return [];
    }

    const lexicalRanked = this.ragService.search(
      query,
      chunks as unknown as RagChunk[],
      topK,
    ) as unknown as RetrievalCandidate[];

    return fuseWithReciprocalRankFusion(lexicalRanked, semanticRanked).slice(
      0,
      topK,
    );
  }
}
