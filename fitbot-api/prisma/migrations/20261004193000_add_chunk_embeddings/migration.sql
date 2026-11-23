-- Enable pgvector for persisted chunk embeddings (Task 3.4).
-- Confirmed available (not yet installed) on the production Neon project
-- "gymbot" (dry-frog-68710873) via pg_available_extensions.
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "embedding" vector(384),
ADD COLUMN     "embeddingModel" TEXT,
ADD COLUMN     "embeddedAt" TIMESTAMP(3);
