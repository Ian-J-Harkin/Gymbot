
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationsService } from './configurations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

describe('ConfigurationsService', () => {
  let service: ConfigurationsService;
  let prismaService: any;
  let encryptionService: Partial<EncryptionService>;

  beforeEach(async () => {
    prismaService = {
      configuration: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    encryptionService = {
      encrypt: jest.fn((text) => `encrypted_${text}`),
      decrypt: jest.fn((text) => text.replace('encrypted_', '')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EncryptionService, useValue: encryptionService },
      ],
    }).compile();

    service = module.get<ConfigurationsService>(ConfigurationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return decrypted config with multiple provider keys', async () => {
      const config = {
        id: '1',
        userId: 'user1',
        openAiApiKey: 'encrypted_openaikey',
        openRouterApiKey: 'encrypted_routerkey',
        aiProvider: 'openai',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        faqText: 'faq',
        widgetColor: '#2563EB',
      };
      prismaService.configuration.findUnique.mockResolvedValue(config);

      const result = await service.getConfig('user1');
      expect(result.openAiApiKey).toEqual('openaikey');
      expect(result.openRouterApiKey).toEqual('routerkey');
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_openaikey');
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_routerkey');
    });

    it('should return defaults if config not found', async () => {
      prismaService.configuration.findUnique.mockResolvedValue(null);
      const result = await service.getConfig('user1');
      expect(result.aiProvider).toEqual('openai');
      expect(result.openAiApiKey).toEqual('');
      expect(result.ollamaUrl).toEqual('http://localhost:11434');
    });
  });

  describe('updateConfig', () => {
    it('should encrypt keys and update config', async () => {
      const dto = {
        faqText: 'faq',
        widgetColor: '#fff',
        aiProvider: 'openai',
        openAiApiKey: 'key123',
        openRouterApiKey: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
      };
      const upsertedConfig = { id: '1', userId: 'user1', ...dto };

      prismaService.configuration.upsert.mockResolvedValue(upsertedConfig);

      const result = await service.updateConfig('user1', dto);

      expect(encryptionService.encrypt).toHaveBeenCalledWith('key123');
      expect(prismaService.configuration.upsert).toHaveBeenCalled();
      expect(result.openAiApiKey).toEqual('key123');
    });
  });
});
