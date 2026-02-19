
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

  it('should get configuration', async () => {
    const mockConfig = {
      id: 'conf-1',
      userId: 'user-1',
      openAiApiKey: 'sk-test',
      faqText: 'Test FAQ',
      systemPrompt: 'You are a helpful bot',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (service.getConfig as jest.Mock).mockResolvedValue(mockConfig);

    const result = await controller.getConfig('user-1');
    expect(result).toEqual(mockConfig);
    expect(service.getConfig).toHaveBeenCalledWith('user-1');
  });

  it('should update configuration including FAQ text', async () => {
    const updateDto = {
      faqText: 'New FAQ Data',
      widgetColor: '#000000',
      aiProvider: 'openai'
    };
    const mockUpdatedConfig = {
      id: 'conf-1',
      userId: 'user-1',
      faqText: 'New FAQ Data',
      widgetColor: '#000000',
      aiProvider: 'openai',
      updatedAt: new Date(),
    };

    // We need to mock getConfig first as updateConfig usually fetches it or needs ID
    // Assuming controller implementation: async updateConfig(@Request() req, @Body() updateData: UpdateConfigurationDto)
    (service.updateConfig as jest.Mock).mockResolvedValue(mockUpdatedConfig);

    const result = await controller.updateConfig(
      'user-1',
      updateDto
    );

    expect(result).toEqual(mockUpdatedConfig);
    expect(service.updateConfig).toHaveBeenCalledWith('user-1', updateDto);
  });
});
