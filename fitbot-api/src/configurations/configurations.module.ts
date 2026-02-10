
import { Module } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { ConfigurationsController } from './configurations.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [ConfigurationsService],
  controllers: [ConfigurationsController],
})
export class ConfigurationsModule { }
