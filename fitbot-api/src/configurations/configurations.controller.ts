import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('configurations')
@UseGuards(JwtAuthGuard)
export class ConfigurationsController {
    constructor(private readonly configurationsService: ConfigurationsService) { }

    @Get('me')
    getConfig(@Request() req) {
        return this.configurationsService.getConfig(req.user.userId);
    }

    @Put('me')
    updateConfig(@Request() req, @Body() updateConfigDto: UpdateConfigurationDto) {
        return this.configurationsService.updateConfig(req.user.userId, updateConfigDto);
    }
}
