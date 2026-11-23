import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// Shared embedding model, reused by SemanticRouterService (query-intent routing)
// and KnowledgeBaseService (chunk embeddings at ingestion) so the model is only
// loaded once per process. See eval_implementation_plan.md Task 3.4.
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSIONS = 384;

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any;

  async onModuleInit() {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);
      this.logger.log(`Embedding model (${EMBEDDING_MODEL}) initialized.`);
    } catch (err) {
      this.logger.error('Failed to initialize embedding model:', err);
    }
  }

  isReady(): boolean {
    return !!this.extractor;
  }

  /**
   * Returns the mean-pooled, L2-normalized embedding for `text`, or null if the
   * model failed to initialize or embedding fails. Callers should fall back to
   * non-semantic behavior (lexical search, skip-embedding-at-ingestion) on null.
   */
  async embed(text: string): Promise<number[] | null> {
    if (!this.extractor) return null;

    try {
      const output = await this.extractor(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data as Float32Array);
    } catch (err) {
      this.logger.error('Embedding call failed:', err);
      return null;
    }
  }
}
