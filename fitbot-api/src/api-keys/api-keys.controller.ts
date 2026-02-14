import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Post()
    createApiKey(@Request() req) {
        const userId = req.user.id || req.user.userId;
        return this.apiKeysService.createApiKey(userId);
    }
}
