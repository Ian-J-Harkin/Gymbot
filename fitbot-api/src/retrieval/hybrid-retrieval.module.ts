import { Module } from '@nestjs/common';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import { RagModule } from '../rag/rag.module';
import { SemanticSearchModule } from '../semantic-search/semantic-search.module';

@Module({
  imports: [RagModule, SemanticSearchModule],
  providers: [HybridRetrievalService],
  exports: [HybridRetrievalService],
})
export class HybridRetrievalModule {}
