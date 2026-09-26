import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { cosineSimilarity } from '../common/utils/math';
import * as routeAnchors from './route-anchors.json';

export type RouteName = 'standard_search' | 'rag_synthesis';

@Injectable()
export class SemanticRouterService implements OnModuleInit {
  private readonly logger = new Logger(SemanticRouterService.name);
  private extractor: any;
  private readonly threshold = 0.80;

  async onModuleInit() {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      // Load model on server startup
      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.logger.log('Semantic router initialized on backend.');
    } catch (err) {
      this.logger.error('Failed to initialize local router:', err);
    }
  }

  async routeQuery(query: string): Promise<{ route: RouteName; confidence: number }> {
    if (!this.extractor) return { route: 'standard_search', confidence: 0 };

    // Embed query on the backend
    const output = await this.extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = output.data;

    let bestRoute: RouteName = 'standard_search';
    let highestScore = 0;

    for (const route of routeAnchors as any) {
      for (const anchorVector of route.embeddings) {
        const score = cosineSimilarity(queryVector, anchorVector);
        if (score > highestScore) {
          highestScore = score;
          bestRoute = route.name as RouteName;
        }
      }
    }

    return {
      route: highestScore >= this.threshold ? bestRoute : 'standard_search',
      confidence: highestScore,
    };
  }
}
