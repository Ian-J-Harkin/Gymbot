import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @UseGuards(ThrottlerGuard)
    @Post()
    createApiKey(@CurrentUserId() userId: string) {
        return this.apiKeysService.createApiKey(userId);
    }
}

