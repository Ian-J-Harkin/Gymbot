import { createHash } from 'node:crypto';
import { Injectable, Optional } from '@nestjs/common';
import { RagService, RagChunk } from '../rag/rag.service';
import { SemanticSearchService } from '../semantic-search/semantic-search.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { cosineSimilarity } from '../common/utils/math';
import {
  HYBRID_CANDIDATE_K,
  SEMANTIC_MAX_DISTANCE,
} from '../common/constants';
import {
  fuseWithReciprocalRankFusion,
  FusedCandidate,
  RetrievalCandidate,
} from './rrf.util';

interface CachedFaqEntry {
  hash: string;
  items: Array<{
    id: string | number;
    content: string;
    fileName?: string;
    vector: number[];
  }>;
}

/**
 * Combines lexical retrieval (`RagService.search` over both `faqText` and
 * `DocumentChunk`) with dense vector retrieval (`SemanticSearchService.search`
 * over `DocumentChunk` + cached in-memory embeddings for `faqText`) via
 * reciprocal rank fusion (k=60). See RAG_AND_ROUTING_DESIGN.md Phase 2.
 */
@Injectable()
export class HybridRetrievalService {
  private readonly faqEmbeddingCache = new Map<string, CachedFaqEntry>();

  constructor(
    private readonly ragService: RagService,
    private readonly semanticSearchService: SemanticSearchService,
    @Optional() private readonly embeddingService?: EmbeddingService,
  ) {}

  async search(
    query: string,
    configurationId: string,
    chunks: RetrievalCandidate[],
    topK: number,
  ): Promise<FusedCandidate[]> {
    const candidateK = Math.max(topK * 2, HYBRID_CANDIDATE_K);

    const faqChunks = chunks.filter((c) => String(c.id).startsWith('faq-'));
    const docChunks = chunks.filter((c) => !String(c.id).startsWith('faq-'));

    const lexicalRanked = this.ragService.search(
      query,
      chunks as unknown as RagChunk[],
      candidateK,
    ) as unknown as RetrievalCandidate[];

    // Fail open to lexical retrieval if the local embedding model is not ready.
    if (!this.embeddingService?.isReady()) {
      return lexicalRanked.slice(0, topK) as unknown as FusedCandidate[];
    }

    const docSemantic =
      docChunks.length > 0
        ? await this.semanticSearchService.search(
            query,
            configurationId,
            candidateK,
            SEMANTIC_MAX_DISTANCE,
          )
        : [];

    const faqSemantic =
      faqChunks.length > 0
        ? await this.searchFaqSemantic(
            query,
            configurationId,
            faqChunks,
            candidateK,
          )
        : [];

    const semanticRanked = [...docSemantic, ...faqSemantic]
      .sort((a, b) => (a.distance ?? 1) - (b.distance ?? 1))
      .slice(0, candidateK);

    if (semanticRanked.length === 0) {
      // Protect un-backfilled tenants (all document chunks have embedding IS NULL)
      // from false abstention by falling back to lexical retrieval.
      if (
        docChunks.length > 0 &&
        faqChunks.length === 0 &&
        !(await this.semanticSearchService.hasEmbeddedChunks(configurationId))
      ) {
        return lexicalRanked.slice(0, topK) as unknown as FusedCandidate[];
      }
      return [];
    }

    return fuseWithReciprocalRankFusion(lexicalRanked, semanticRanked).slice(
      0,
      topK,
    );
  }

  private async searchFaqSemantic(
    query: string,
    configurationId: string,
    faqChunks: RetrievalCandidate[],
    topK: number,
  ): Promise<Array<RetrievalCandidate & { distance: number }>> {
    if (!this.embeddingService) return [];

    const queryVector = await this.embeddingService.embedQuery(query);
    if (!queryVector) return [];

    const cached = await this.getOrBuildFaqEmbeddings(
      configurationId,
      faqChunks,
    );

    return cached
      .map((item) => ({
        id: item.id,
        content: item.content,
        fileName: item.fileName,
        distance: 1 - cosineSimilarity(queryVector, item.vector),
      }))
      .filter((item) => item.distance <= SEMANTIC_MAX_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, topK);
  }

  private async getOrBuildFaqEmbeddings(
    configurationId: string,
    faqChunks: RetrievalCandidate[],
  ) {
    const hash = createHash('sha256')
      .update(faqChunks.map((c) => `${c.id}:${c.content}`).join('\n'))
      .digest('hex');

    const existing = this.faqEmbeddingCache.get(configurationId);
    if (existing && existing.hash === hash) {
      return existing.items;
    }

    const items: CachedFaqEntry['items'] = [];
    for (const chunk of faqChunks) {
      const vector = await this.embeddingService?.embed(chunk.content);
      if (vector) {
        items.push({
          id: chunk.id,
          content: chunk.content,
          fileName: chunk.fileName,
          vector,
        });
      }
    }

    this.faqEmbeddingCache.set(configurationId, { hash, items });
    return items;
  }
}
