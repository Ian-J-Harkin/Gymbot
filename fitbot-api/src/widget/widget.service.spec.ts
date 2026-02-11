import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { EncryptionService } from '../common/services/encryption.service';
import OpenAI from 'openai';
import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ValidationService } from '../validation/validation.service';

jest.mock('openai');

describe('WidgetService', () => {
  let service: WidgetService;
  let encryptionService: Partial<EncryptionService>;
  let chatLogsService: Partial<ChatLogsService>;
  let validationService: Partial<ValidationService>;

  beforeEach(async () => {
    encryptionService = {
      encrypt: jest.fn((text) => `encrypted_${text}`),
      decrypt: jest.fn((text) => text.replace('encrypted_', '')),
    };

    chatLogsService = {
      createLog: jest.fn().mockResolvedValue({} as any),
    };

    validationService = {
      validate: jest.fn().mockResolvedValue({
        results: [],
        hasBlockingError: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        { provide: EncryptionService, useValue: encryptionService },
        { provide: ChatLogsService, useValue: chatLogsService },
        { provide: ValidationService, useValue: validationService },
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
    it('should call OpenAI for openai provider and log interaction', async () => {
      const mockStream = (async function* () {
        yield { choices: [{ delta: { content: 'chunk1' } }] };
        yield { choices: [{ delta: { content: 'chunk2' } }] };
      })();
      const mockCreate = jest.fn().mockResolvedValue(mockStream);
      (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const config = {
        id: 'config-1',
        aiProvider: 'openai',
        openAiApiKey: 'encrypted_sk-test',
        faqText: 'FAQ text',
      };

      const iterator = service.processChat(config, 'Hello', []);
      let result = '';
      let explanation;

      for await (const chunk of iterator) {
        if (typeof chunk === 'string') {
          result += chunk;
        } else {
          explanation = chunk.explanation;
        }
      }

      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-test');
      expect(result).toBe('chunk1chunk2');
      expect(explanation).toBeDefined();
      expect(explanation.provider).toBe('openai');
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'openai',
        aiResponse: 'chunk1chunk2',
      }));
    });

    it('should call OpenRouter for openrouter provider', async () => {
      const mockStream = (async function* () {
        yield { choices: [{ delta: { content: 'chunk' } }] };
      })();
      const mockCreate = jest.fn().mockResolvedValue(mockStream);
      (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        chat: { completions: { create: mockCreate } },
      }));

      const config = {
        id: 'config-2',
        aiProvider: 'openrouter',
        openRouterApiKey: 'encrypted_sk-or-test',
        faqText: 'FAQ text',
      };

      const iterator = service.processChat(config, 'Hello', []);
      for await (const chunk of iterator) {
        // consume stream
      }

      expect(encryptionService.decrypt).toHaveBeenCalledWith('encrypted_sk-or-test');
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'openrouter',
      }));
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
        id: 'config-3',
        aiProvider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        faqText: 'FAQ text',
      };

      const iterator = service.processChat(config, 'Hello', []);
      let result = '';
      for await (const chunk of iterator) {
        if (typeof chunk === 'string') {
          result += chunk;
        }
      }

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.any(Object),
      );
      expect(result).toBe('Hello from Ollama');
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'ollama',
      }));
    });
    it('should block chat if validation fails with blocking error', async () => {
      validationService.validate = jest.fn().mockResolvedValue({
        results: [{ passed: false, ruleId: 'rule-1', severity: 'block', message: 'Blocked' }],
        hasBlockingError: true,
        blockingMessage: 'Blocked',
      });

      const config = {
        id: 'config-4',
        aiProvider: 'openai',
        faqText: 'FAQ',
      };

      const iterator = service.processChat(config, 'Bad message', []);
      let result = '';
      for await (const chunk of iterator) {
        if (typeof chunk === 'string') {
          result += chunk;
        }
      }

      expect(validationService.validate).toHaveBeenCalled();
      expect(result).toBe('Blocked');
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        aiResponse: 'Blocked',
        validationFlags: ['rule-1'],
        contextLength: 0,
      }));
    });
  });
});
