
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
    it('should return MASKED config keys (not full decrypted values)', async () => {
      const config = {
        id: '1',
        userId: 'user1',
        openAiApiKey: 'encrypted_sk-1234567890abcdef',
        openRouterApiKey: 'encrypted_sk-or-abcdefghijklmno',
        aiProvider: 'openai',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        faqText: 'faq',
        widgetColor: '#2563EB',
      };
      prismaService.configuration.findUnique.mockResolvedValue(config);

      const result = await service.getConfig('user1');

      // Keys should be masked, NOT full decrypted values
      expect(result.openAiApiKey).not.toEqual('sk-1234567890abcdef');
      expect(result.openRouterApiKey).not.toEqual('sk-or-abcdefghijklmno');

      // Should contain masking pattern (first 5 chars ... last 3 chars)
      expect(result.openAiApiKey).toMatch(/^.{5}\.\.\..{3}$/);
      expect(result.openRouterApiKey).toMatch(/^.{5}\.\.\..{3}$/);

      // Decryption should still have been called (masking happens after)
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-1234567890abcdef');
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-or-abcdefghijklmno');
    });

    it('should return defaults if config not found', async () => {
      prismaService.configuration.findUnique.mockResolvedValue(null);
      const result = await service.getConfig('user1');
      expect(result.aiProvider).toEqual('openai');
      expect(result.openAiApiKey).toEqual('');
      expect(result.ollamaUrl).toEqual('http://localhost:11434');
    });

    it('should return empty string for empty keys', async () => {
      const config = {
        id: '1',
        userId: 'user1',
        openAiApiKey: null,
        openRouterApiKey: null,
        aiProvider: 'openai',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        faqText: '',
        widgetColor: '#2563EB',
      };
      prismaService.configuration.findUnique.mockResolvedValue(config);

      const result = await service.getConfig('user1');
      expect(result.openAiApiKey).toEqual('');
      expect(result.openRouterApiKey).toEqual('');
    });
  });

  describe('updateConfig', () => {
    it('should encrypt NEW keys and update config', async () => {
      const dto = {
        faqText: 'faq',
        widgetColor: '#fff',
        aiProvider: 'openai',
        openAiApiKey: 'sk-brand-new-key-12345',
        openRouterApiKey: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
      };
      const upsertedConfig = { id: '1', userId: 'user1', ...dto };

      prismaService.configuration.upsert.mockResolvedValue(upsertedConfig);

      const result = await service.updateConfig('user1', dto);

      expect(encryptionService.encrypt).toHaveBeenCalledWith('sk-brand-new-key-12345');
      expect(prismaService.configuration.upsert).toHaveBeenCalled();
      // Response should return masked version of the new key
      expect(result.openAiApiKey).toMatch(/^sk-br\.\.\.345$/);
    });

    it('should preserve existing encrypted key when masked value is submitted', async () => {
      // Simulate a masked value being sent back (user didn't change the key)
      const dto = {
        faqText: 'faq',
        widgetColor: '#fff',
        aiProvider: 'openai',
        openAiApiKey: 'sk-12...def',  // This is a masked value (5 chars + ... + 3 chars)
        openRouterApiKey: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
      };

      // The existing encrypted key in the database
      prismaService.configuration.findUnique.mockResolvedValue({
        openAiApiKey: 'encrypted_sk-1234567890abcdef',
      });

      prismaService.configuration.upsert.mockResolvedValue({ id: '1', userId: 'user1' });

      await service.updateConfig('user1', dto);

      // Should NOT have encrypted the masked value
      expect(encryptionService.encrypt).not.toHaveBeenCalled();

      // Should have preserved the existing encrypted key
      const upsertCall = prismaService.configuration.upsert.mock.calls[0][0];
      expect(upsertCall.update.openAiApiKey).toEqual('encrypted_sk-1234567890abcdef');
    });
  });
});
