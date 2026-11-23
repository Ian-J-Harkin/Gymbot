import { Module } from '@nestjs/common';
import { SemanticRouterService } from './semantic-router.service';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [EmbeddingModule],
  providers: [SemanticRouterService],
  exports: [SemanticRouterService],
})
export class SemanticRouterModule {}
