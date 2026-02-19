import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';

@Controller('configurations')
@UseGuards(JwtAuthGuard)
export class ConfigurationsController {
    constructor(private readonly configurationsService: ConfigurationsService) { }

    @Get('me')
    getConfig(@CurrentUserId() userId: string) {
        return this.configurationsService.getConfig(userId);
    }

    @Put('me')
    updateConfig(@CurrentUserId() userId: string, @Body() updateConfigDto: UpdateConfigurationDto) {
        return this.configurationsService.updateConfig(userId, updateConfigDto);
    }
}

