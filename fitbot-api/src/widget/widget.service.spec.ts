import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ValidationService } from '../validation/validation.service';
import { RagService } from '../rag/rag.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from './providers/ai-provider.service';
import { ExplanationHelper } from './explanation.helper';
import { AiProvider } from './providers/ai-provider.interface';

describe('WidgetService', () => {
  let service: WidgetService;
  let chatLogsService: Partial<ChatLogsService>;
  let validationService: Partial<ValidationService>;
  let ragService: Partial<RagService>;
  let prismaService: Partial<PrismaService>;
  let aiProviderService: Partial<AiProviderService>;
  let explanationHelper: Partial<ExplanationHelper>;

  beforeEach(async () => {
    chatLogsService = {
      createLog: jest.fn().mockResolvedValue({} as any),
    };

    validationService = {
      validate: jest.fn().mockResolvedValue({
        results: [],
        hasBlockingError: false,
      }),
    };

    ragService = {
      chunkText: jest.fn().mockReturnValue([]),
      search: jest.fn().mockImplementation((q, chunks) => chunks.slice(0, 2)),
    };

    prismaService = {
      documentChunk: {
        findMany: jest.fn().mockResolvedValue([]),
      } as any,
    };

    aiProviderService = {
      getProvider: jest.fn().mockReturnValue({
        generateResponse: jest.fn(),
      }),
    };

    explanationHelper = {
      build: jest.fn().mockReturnValue({} as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        { provide: ChatLogsService, useValue: chatLogsService },
        { provide: ValidationService, useValue: validationService },
        { provide: RagService, useValue: ragService },
        { provide: PrismaService, useValue: prismaService },
        { provide: AiProviderService, useValue: aiProviderService },
        { provide: ExplanationHelper, useValue: explanationHelper },
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
      } as any;
      const result = service.getPublicConfig(config);
      expect(result.widgetColor).toEqual('#ff0000');
      expect(result).not.toHaveProperty('openAiApiKey');
      expect(result).not.toHaveProperty('faqText');
    });
  });

  describe('processChat', () => {
    it('should delegate to the correct AI provider and log interaction', async () => {
      const mockStream = (async function* () {
        yield 'chunk1';
        yield 'chunk2';
      })();

      const mockProvider: AiProvider = {
        generateResponse: jest.fn().mockReturnValue(mockStream),
      };
      (aiProviderService.getProvider as jest.Mock).mockReturnValue(mockProvider);

      const config = {
        id: 'config-1',
        aiProvider: 'openai',
        faqText: 'FAQ text',
      } as any;

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

      expect(aiProviderService.getProvider).toHaveBeenCalledWith('openai');
      expect(mockProvider.generateResponse).toHaveBeenCalled();
      expect(result).toBe('chunk1chunk2');
      expect(explanationHelper.build).toHaveBeenCalled();
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'openai',
        aiResponse: 'chunk1chunk2',
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
      } as any;

      const iterator = service.processChat(config, 'Bad message', []);
      let result = '';
      for await (const chunk of iterator) {
        if (typeof chunk === 'string') {
          result += chunk;
        }
      }

      expect(validationService.validate).toHaveBeenCalled();
      expect(result).toBe('Blocked');
      expect(aiProviderService.getProvider).not.toHaveBeenCalled();
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        aiResponse: 'Blocked',
        validationFlags: ['rule-1'],
        contextLength: 0,
      }));
    });
  });
});
