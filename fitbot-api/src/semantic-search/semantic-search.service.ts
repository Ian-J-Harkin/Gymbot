import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { SEMANTIC_MAX_DISTANCE } from '../common/constants';

export interface SemanticSearchResult {
  id: string;
  content: string;
  fileName: string;
  distance?: number;
}

/**
 * Chunk-level semantic (vector) search, scoped to a single tenant's documents.
 * Split out of SemanticRouterService (which keeps only query-intent routing).
 *
 * Scope note: this only searches persisted `DocumentChunk` rows (embedded at
 * ingestion). FAQ text is not persisted as rows and is scored in memory by
 * HybridRetrievalService using cached embeddings.
 */
@Injectable()
export class SemanticSearchService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly prisma: PrismaService,
  ) {}

  async hasEmbeddedChunks(configurationId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ exists: number }>>`
            SELECT 1 AS exists
            FROM "DocumentChunk" dc
            JOIN "Document" d ON d.id = dc."documentId"
            WHERE d."configurationId" = ${configurationId} AND dc.embedding IS NOT NULL
            LIMIT 1
        `;
    return rows.length > 0;
  }

  async search(
    query: string,
    configurationId: string,
    topK: number,
    maxDistance = SEMANTIC_MAX_DISTANCE,
  ): Promise<SemanticSearchResult[]> {
    const queryVector = await this.embeddingService.embedQuery(query);
    if (!queryVector) return [];

    const vectorLiteral = `[${queryVector.join(',')}]`;

    return this.prisma.$queryRaw<SemanticSearchResult[]>`
            SELECT id, content, "fileName", distance FROM (
                SELECT dc.id, dc.content, d."fileName", dc.embedding <=> ${vectorLiteral}::vector AS distance
                FROM "DocumentChunk" dc
                JOIN "Document" d ON d.id = dc."documentId"
                WHERE d."configurationId" = ${configurationId} AND dc.embedding IS NOT NULL
            ) ranked
            WHERE distance <= ${maxDistance}
            ORDER BY distance
            LIMIT ${topK}
        `;
  }
}
