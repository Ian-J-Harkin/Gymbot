import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ChatLogsService } from './chat-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../common/constants';

@Controller('chat-logs')
@UseGuards(JwtAuthGuard)
export class ChatLogsController {
    constructor(private readonly chatLogsService: ChatLogsService) { }

    @Get()
    async getLogs(
        @CurrentUserId() userId: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        const p = Math.max(1, parseInt(page || '1', 10) || 1);
        const ps = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize || `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE));
        return this.chatLogsService.findByUserId(userId, p, ps);
    }
}

