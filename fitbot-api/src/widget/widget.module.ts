import { Module } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';
import { CommonModule } from '../common/common.module';
import { ChatLogsModule } from '../chat-logs/chat-logs.module';
import { ValidationModule } from '../validation/validation.module';
import { RagModule } from '../rag/rag.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CommonModule, ChatLogsModule, ValidationModule, RagModule, PrismaModule],
  providers: [WidgetService],
  controllers: [WidgetController],
})
export class WidgetModule { }
