import { Module } from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';
import { EmbeddingModule } from '../embedding/embedding.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmbeddingModule, PrismaModule],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
