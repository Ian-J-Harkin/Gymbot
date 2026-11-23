import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';

export interface SemanticSearchResult {
  id: string;
  content: string;
  fileName: string;
}

/**
 * Chunk-level semantic (vector) search, scoped to a single tenant's documents.
 * Split out of SemanticRouterService (which keeps only query-intent routing) per
 * the code review's SRP finding. See eval_implementation_plan.md Task 3.5.
 *
 * Scope note: this only searches persisted `DocumentChunk` rows (embedded at
 * ingestion, Task 3.4). FAQ text is not persisted as rows and has no embeddings,
 * so it is not covered here — it remains reachable only through the lexical
 * path in HybridRetrievalService.
 */
@Injectable()
export class SemanticSearchService {
  // pgvector's `<=>` operator is cosine DISTANCE (1 - cosine similarity).
  // Tuned via test/evaluation/distance-diagnostic.script.ts against the Iron
  // Oasis dataset: 0.75 achieves 100% recall on all 10 literal + paraphrase
  // queries (worst legitimate distance = 0.7442 for `cancellation_without_fee`)
  // while blocking truly out-of-scope queries (best out-of-scope distance =
  // 0.8098). See distance_analysis.md for the full threshold sweep.
  private static readonly MAX_DISTANCE = 0.80;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly prisma: PrismaService,
  ) {}

  async search(
    query: string,
    configurationId: string,
    topK: number,
  ): Promise<SemanticSearchResult[]> {
    const queryVector = await this.embeddingService.embed(query);
    if (!queryVector) return [];

    const vectorLiteral = `[${queryVector.join(',')}]`;

    return this.prisma.$queryRaw<SemanticSearchResult[]>`
            SELECT id, content, "fileName" FROM (
                SELECT dc.id, dc.content, d."fileName", dc.embedding <=> ${vectorLiteral}::vector AS distance
                FROM "DocumentChunk" dc
                JOIN "Document" d ON d.id = dc."documentId"
                WHERE d."configurationId" = ${configurationId} AND dc.embedding IS NOT NULL
            ) ranked
            WHERE distance <= ${SemanticSearchService.MAX_DISTANCE}
            ORDER BY distance
            LIMIT ${topK}
        `;
  }
}
