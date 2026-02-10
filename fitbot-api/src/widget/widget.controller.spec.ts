
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';
import { ApiKeyAuthGuard } from '../common/guards/api-key-auth.guard';

describe('WidgetController', () => {
  let controller: WidgetController;
  let service: Partial<WidgetService>;

  beforeEach(async () => {
    service = {
      getPublicConfig: jest.fn(),
      processChat: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetController],
      providers: [{ provide: WidgetService, useValue: service }],
    })
      .overrideGuard(ApiKeyAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WidgetController>(WidgetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
