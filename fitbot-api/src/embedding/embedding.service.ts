import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// Shared embedding model, reused by SemanticRouterService (query-intent routing),
// SemanticSearchService (query embeddings), and KnowledgeBaseService (chunk embeddings).
export const EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5';
export const EMBEDDING_DIMENSIONS = 384;
export const BGE_QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any;

  async onModuleInit() {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      this.extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        dtype: 'q8',
      });
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
   * model failed to initialize or embedding fails. Used for document chunks and
   * symmetric router comparisons.
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

  /**
   * Embeds a search query with the BGE asymmetric retrieval instruction prefix.
   */
  async embedQuery(query: string): Promise<number[] | null> {
    return this.embed(`${BGE_QUERY_PREFIX}${query}`);
  }
}
