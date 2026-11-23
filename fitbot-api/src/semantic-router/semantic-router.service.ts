import { Injectable, Logger } from '@nestjs/common';
import { cosineSimilarity } from '../common/utils/math';
import { EmbeddingService } from '../embedding/embedding.service';
import * as routeAnchors from './route-anchors.json';

export type RouteName = 'standard_search' | 'rag_synthesis';

@Injectable()
export class SemanticRouterService {
  private readonly logger = new Logger(SemanticRouterService.name);
  private readonly threshold = 0.80;

  constructor(private readonly embeddingService: EmbeddingService) {}

  async routeQuery(query: string): Promise<{ route: RouteName; confidence: number }> {
    const queryVector = await this.embeddingService.embed(query);
    if (!queryVector) return { route: 'standard_search', confidence: 0 };

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

