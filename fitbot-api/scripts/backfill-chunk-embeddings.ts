/**
 * Idempotent backfill: computes and persists embeddings for DocumentChunk rows
 * where embedding IS NULL or embedded under an older embeddingModel.
 *
 * Usage: npm run backfill:chunk-embeddings
 *
 * Safe to re-run: already up-to-date chunks are skipped. Chunks whose embedding
 * call fails are logged and left for a future run rather than blocking the rest
 * of the backfill.
 */
import { PrismaService } from '../src/prisma/prisma.service';
import {
  EmbeddingService,
  EMBEDDING_MODEL,
} from '../src/embedding/embedding.service';
import { embedChunks } from '../src/embedding/chunk-embedding.util';

async function main() {
  const prisma = new PrismaService();
  const embeddingService = new EmbeddingService();

  await prisma.$connect();
  await embeddingService.onModuleInit();

  if (!embeddingService.isReady()) {
    console.error(
      'Embedding model failed to initialize; aborting backfill without changing any rows.',
    );
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  const chunks = await prisma.$queryRaw<{ id: string; content: string }[]>`
        SELECT id, content FROM "DocumentChunk"
        WHERE embedding IS NULL OR "embeddingModel" IS DISTINCT FROM ${EMBEDDING_MODEL}
    `;

  console.log(
    `Found ${chunks.length} chunk(s) needing embeddings for ${EMBEDDING_MODEL}.`,
  );

  const { embedded, failed } = await embedChunks(
    prisma,
    embeddingService,
    chunks,
  );

  console.log(
    `Backfill complete: ${embedded} embedded, ${failed} failed (left for a future run).`,
  );

  await prisma.$disconnect();
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});
