
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { EncryptionService } from '../common/services/encryption.service';
import OpenAI from 'openai';

jest.mock('openai');

describe('WidgetService', () => {
  let service: WidgetService;
  let encryptionService: Partial<EncryptionService>;

  beforeEach(async () => {
    encryptionService = {
      encrypt: jest.fn((text) => `encrypted_${text}`),
      decrypt: jest.fn((text) => text.replace('encrypted_', '')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        { provide: EncryptionService, useValue: encryptionService },
      ],
    }).compile();

    service = module.get<WidgetService>(WidgetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicConfig', () => {
    it('should return only public fields', () => {
      const config = {
        widgetColor: '#ff0000',
        openAiApiKey: 'encrypted_secret',
        faqText: 'some faq',
      };
      const result = service.getPublicConfig(config);
      expect(result.widgetColor).toEqual('#ff0000');
      expect(result).not.toHaveProperty('openAiApiKey');
      expect(result).not.toHaveProperty('faqText');
    });
  });

  describe('processChat', () => {
    it('should call OpenAI for openai provider', async () => {
      const mockStream = { id: 'mock-stream' };
      const mockCreate = jest.fn().mockResolvedValue(mockStream);
      (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const config = {
        aiProvider: 'openai',
        openAiApiKey: 'encrypted_sk-test',
        faqText: 'FAQ text',
      };

      const result = await service.processChat(config, 'Hello', []);
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-test');
      expect(result).toEqual(mockStream);
    });

    it('should call OpenRouter for openrouter provider', async () => {
      const mockStream = { id: 'mock-stream' };
      const mockCreate = jest.fn().mockResolvedValue(mockStream);
      (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const config = {
        aiProvider: 'openrouter',
        openRouterApiKey: 'encrypted_sk-or-test',
        faqText: 'FAQ text',
      };

      const result = await service.processChat(config, 'Hello', []);
      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-or-test');
      expect(result).toEqual(mockStream);
    });

    it('should call Ollama for ollama provider', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'Hello from Ollama' },
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const config = {
        aiProvider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        faqText: 'FAQ text',
      };

      const result = await service.processChat(config, 'Hello', []);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.any(Object),
      );
      expect(result.choices[0].message.content).toEqual('Hello from Ollama');
    });
  });
});
