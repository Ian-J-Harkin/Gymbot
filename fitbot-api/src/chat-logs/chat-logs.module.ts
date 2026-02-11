import { Module } from '@nestjs/common';
import { ChatLogsService } from './chat-logs.service';
import { ChatLogsController } from './chat-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ChatLogsService],
    controllers: [ChatLogsController],
    exports: [ChatLogsService],
})
export class ChatLogsModule { }
