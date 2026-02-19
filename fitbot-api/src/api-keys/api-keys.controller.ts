import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Post()
    createApiKey(@CurrentUserId() userId: string) {
        return this.apiKeysService.createApiKey(userId);
    }
}

