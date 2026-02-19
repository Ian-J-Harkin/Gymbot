import { Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { CommonModule } from '../common/common.module';
import { ChatLogsModule } from '../chat-logs/chat-logs.module';
import { ValidationModule } from '../validation/validation.module';
import { RagModule } from '../rag/rag.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiProviderService } from './providers/ai-provider.service';
import { OpenAiProvider } from './providers/openai.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { ExplanationHelper } from './explanation.helper';

@Module({
  imports: [CommonModule, ChatLogsModule, ValidationModule, RagModule, PrismaModule],
  providers: [
    WidgetService,
    AiProviderService,
    OpenAiProvider,
    OpenRouterProvider,
    OllamaProvider,
    ExplanationHelper,
  ],
  controllers: [WidgetController],
})
export class WidgetModule { }
