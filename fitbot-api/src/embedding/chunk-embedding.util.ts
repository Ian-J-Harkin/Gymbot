import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService, EMBEDDING_MODEL } from './embedding.service';

const logger = new Logger('ChunkEmbedding');

export interface EmbeddableChunk {
  id: string;
  content: string;
}

export interface EmbedChunksResult {
  embedded: number;
  failed: number;
}

/**
 * Computes and persists embeddings for the given chunks via raw SQL, since Prisma
 * Client has no native read/write support for the `Unsupported("vector")` column
 * type. Chunks whose embedding call fails are left unembedded (null) and skipped
 * rather than blocking the caller. Shared by KnowledgeBaseService.processFile()
 * (new uploads) and the one-time backfill script (pre-existing chunks) — see
 * eval_implementation_plan.md Task 3.4.
 */
export async function embedChunks(
  prisma: PrismaService,
  embeddingService: EmbeddingService,
  chunks: EmbeddableChunk[],
): Promise<EmbedChunksResult> {
  let embedded = 0;
  let failed = 0;

  for (const chunk of chunks) {
    const vector = await embeddingService.embed(chunk.content);
    if (!vector) {
      failed++;
      logger.warn(
        `Embedding failed for chunk ${chunk.id}; leaving it unembedded.`,
      );
      continue;
    }

    const vectorLiteral = `[${vector.join(',')}]`;
    await prisma.$executeRaw`UPDATE "DocumentChunk" SET "embedding" = ${vectorLiteral}::vector, "embeddingModel" = ${EMBEDDING_MODEL}, "embeddedAt" = ${new Date()} WHERE id = ${chunk.id}`;
    embedded++;
  }

  return { embedded, failed };
}
