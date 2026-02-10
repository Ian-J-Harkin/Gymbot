
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ConfigurationsController', () => {
  let controller: ConfigurationsController;
  let service: Partial<ConfigurationsService>;

  beforeEach(async () => {
    service = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigurationsController],
      providers: [{ provide: ConfigurationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConfigurationsController>(ConfigurationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
