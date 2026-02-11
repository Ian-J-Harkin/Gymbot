import { Module } from '@nestjs/common';
import { ChatLogsService } from './chat-logs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ChatLogsService],
    exports: [ChatLogsService],
})
export class ChatLogsModule { }
