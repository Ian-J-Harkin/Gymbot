import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ChatLogsService } from './chat-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat-logs')
@UseGuards(JwtAuthGuard)
export class ChatLogsController {
    constructor(private readonly chatLogsService: ChatLogsService) { }

    @Get()
    async getLogs(@Req() req) {
        return this.chatLogsService.findByUserId(req.user.userId);
    }
}
