import { Module } from '@nestjs/common';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import { RagModule } from '../rag/rag.module';
import { SemanticSearchModule } from '../semantic-search/semantic-search.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [RagModule, SemanticSearchModule, EmbeddingModule],
  providers: [HybridRetrievalService],
  exports: [HybridRetrievalService],
})
export class HybridRetrievalModule {}
