import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { ChatLogsService } from '../chat-logs/chat-logs.service';
import { ValidationService } from '../validation/validation.service';
import { RagService } from '../rag/rag.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from './providers/ai-provider.service';
import { ExplanationHelper } from './explanation.helper';
import { AiProvider } from './providers/ai-provider.interface';
import { SemanticRouterService } from '../semantic-router/semantic-router.service';
import { HybridRetrievalService } from '../retrieval/hybrid-retrieval.service';

describe('WidgetService', () => {
  let service: WidgetService;
  let chatLogsService: Partial<ChatLogsService>;
  let validationService: Partial<ValidationService>;
  let ragService: Partial<RagService>;
  let prismaService: Partial<PrismaService>;
  let aiProviderService: Partial<AiProviderService>;
  let explanationHelper: Partial<ExplanationHelper>;
  let semanticRouterService: Partial<SemanticRouterService>;
  let hybridRetrievalService: Partial<HybridRetrievalService>;

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
      chunkText: jest.fn().mockReturnValue([{ id: 0, content: 'FAQ text' }]),
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

    semanticRouterService = {
      routeQuery: jest.fn().mockResolvedValue({ route: 'standard_search', confidence: 0.9 }),
    };

    hybridRetrievalService = {
      search: jest.fn(),
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
        { provide: SemanticRouterService, useValue: semanticRouterService },
        { provide: HybridRetrievalService, useValue: hybridRetrievalService },
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
        retrieval: expect.objectContaining({
          route: 'standard_search',
          method: 'lexical',
          chunks: expect.arrayContaining([
            expect.objectContaining({
              chunkId: expect.anything(),
              lexicalRank: expect.any(Number),
            })
          ]),
        }),
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

    it('should deterministically abstain without calling the answer provider when no chunks match', async () => {
      ragService.search = jest.fn().mockReturnValue([]);

      const config = {
        id: 'config-no-match',
        aiProvider: 'openai',
        faqText: 'Unrelated FAQ content about membership prices.',
      } as any;

      const chunks: string[] = [];
      for await (const chunk of service.processChat(config, 'What is the sauna code?', [])) {
        if (typeof chunk === 'string') chunks.push(chunk);
      }

      const abstention = 'I could not find relevant information in the knowledge base to answer your question.';
      expect(chunks).toEqual([abstention]);
      expect(aiProviderService.getProvider).not.toHaveBeenCalled();
      expect(explanationHelper.build).not.toHaveBeenCalled();
      expect(chatLogsService.createLog).toHaveBeenCalledWith(expect.objectContaining({
        configurationId: 'config-no-match',
        provider: 'none',
        model: 'abstention',
        aiResponse: abstention,
        contextLength: 0,
      }));
    });

    it('should configure prompt and retrieval for standard_search', async () => {
      (semanticRouterService.routeQuery as jest.Mock).mockResolvedValue({ route: 'standard_search', confidence: 0.9 });
      
      const mockStream = (async function* () { yield 'result'; })();
      const mockProvider: AiProvider = { generateResponse: jest.fn().mockReturnValue(mockStream) };
      (aiProviderService.getProvider as jest.Mock).mockReturnValue(mockProvider);
      
      const config = { id: 'config-1', aiProvider: 'openai', faqText: 'FAQ' } as any;
      const iterator = service.processChat(config, 'Hi', []);
      for await (const chunk of iterator) {}
      
      expect(ragService.search).toHaveBeenCalledWith('Hi', expect.any(Array), 4);
      
      const calls = (mockProvider.generateResponse as jest.Mock).mock.calls[0];
      const messages = calls[1];
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('Provide a direct, concise, factual answer');
    });

    it('should configure prompt and retrieval for rag_synthesis', async () => {
      (semanticRouterService.routeQuery as jest.Mock).mockResolvedValue({ route: 'rag_synthesis', confidence: 0.9 });
      
      const mockStream = (async function* () { yield 'result'; })();
      const mockProvider: AiProvider = { generateResponse: jest.fn().mockReturnValue(mockStream) };
      (aiProviderService.getProvider as jest.Mock).mockReturnValue(mockProvider);
      
      const config = { id: 'config-1', aiProvider: 'openai', faqText: 'FAQ' } as any;
      const iterator = service.processChat(config, 'Hi', []);
      for await (const chunk of iterator) {}
      
      expect(ragService.search).toHaveBeenCalledWith('Hi', expect.any(Array), 6);

      const calls = (mockProvider.generateResponse as jest.Mock).mock.calls[0];
      const messages = calls[1];
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('Provide a detailed, comprehensive answer synthesizing');
    });
  });

  describe('hybrid retrieval gating (Task 3.5)', () => {
    it('never calls HybridRetrievalService while HYBRID_RETRIEVAL_ENABLED is false (default)', async () => {
      const mockStream = (async function* () { yield 'result'; })();
      (aiProviderService.getProvider as jest.Mock).mockReturnValue({ generateResponse: jest.fn().mockReturnValue(mockStream) });

      const config = { id: 'config-1', aiProvider: 'openai', faqText: 'FAQ' } as any;
      for await (const _chunk of service.processChat(config, 'Hi', [])) { /* drain */ }

      expect(hybridRetrievalService.search).not.toHaveBeenCalled();
      expect(ragService.search).toHaveBeenCalled();
    });

    it('routes hybrid-fused results through the LLM provider, never as a raw passthrough, when enabled', async () => {
      let IsolatedWidgetService!: typeof WidgetService;
      jest.isolateModules(() => {
        jest.doMock('../common/constants', () => ({
          ...jest.requireActual('../common/constants'),
          HYBRID_RETRIEVAL_ENABLED: true,
        }));
        IsolatedWidgetService = require('./widget.service').WidgetService;
      });

      const fusedChunk = {
        id: 'doc-1',
        content: 'The sauna access code is 8822#.',
        fileName: 'handbook.docx',
        lexicalRank: 1,
        semanticRank: 1,
        rrfScore: 1 / 61 + 1 / 61,
      };
      const localHybridRetrievalService = { search: jest.fn().mockResolvedValue([fusedChunk]) };

      const isolatedService = new IsolatedWidgetService(
        chatLogsService as any,
        validationService as any,
        ragService as any,
        prismaService as any,
        aiProviderService as any,
        explanationHelper as any,
        semanticRouterService as any,
        localHybridRetrievalService as any,
      );

      const mockStream = (async function* () { yield 'synthesized answer'; })();
      (aiProviderService.getProvider as jest.Mock).mockReturnValue({ generateResponse: jest.fn().mockReturnValue(mockStream) });

      const config = { id: 'config-1', aiProvider: 'openai', faqText: 'FAQ' } as any;
      const values: (string | { explanation: unknown })[] = [];
      for await (const chunk of isolatedService.processChat(config, 'What is the sauna code?', [])) {
        values.push(chunk);
      }

      expect(localHybridRetrievalService.search).toHaveBeenCalledWith(
        'What is the sauna code?',
        'config-1',
        expect.any(Array),
        expect.any(Number),
      );
      // The fused result must flow through the LLM, never be returned verbatim.
      expect(values.filter((v) => typeof v === 'string')).toEqual(['synthesized answer']);
      expect(values.some((v) => typeof v === 'string' && v === fusedChunk.content)).toBe(false);
    });
  });
});
