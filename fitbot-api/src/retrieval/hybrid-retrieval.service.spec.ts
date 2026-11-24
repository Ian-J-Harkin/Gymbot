import { Test, TestingModule } from '@nestjs/testing';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import { RagService } from '../rag/rag.service';
import { SemanticSearchService } from '../semantic-search/semantic-search.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { SEMANTIC_MAX_DISTANCE } from '../common/constants';

describe('HybridRetrievalService', () => {
  let service: HybridRetrievalService;
  let ragService: Partial<RagService>;
  let semanticSearchService: Partial<SemanticSearchService>;
  let embeddingService: Partial<EmbeddingService>;

  beforeEach(async () => {
    ragService = {
      search: jest.fn().mockReturnValue([
        { id: 'a', content: 'lexical-a' },
        { id: 'b', content: 'lexical-b' },
      ]),
    };
    semanticSearchService = {
      search: jest.fn().mockResolvedValue([
        { id: 'b', content: 'lexical-b', fileName: 'doc.docx', distance: 0.25 },
        { id: 'c', content: 'semantic-c', fileName: 'doc.docx', distance: 0.35 },
      ]),
      hasEmbeddedChunks: jest.fn().mockResolvedValue(true),
    };
    embeddingService = {
      isReady: jest.fn().mockReturnValue(true),
      embed: jest.fn().mockResolvedValue([1, 0, 0]),
      embedQuery: jest.fn().mockResolvedValue([1, 0, 0]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridRetrievalService,
        { provide: RagService, useValue: ragService },
        { provide: SemanticSearchService, useValue: semanticSearchService },
        { provide: EmbeddingService, useValue: embeddingService },
      ],
    }).compile();

    service = module.get(HybridRetrievalService);
  });

  it('fuses lexical and semantic candidates with candidateK >= 10 and respects topK', async () => {
    const chunks = [
      { id: 'a', content: 'lexical-a' },
      { id: 'b', content: 'lexical-b' },
      { id: 'c', content: 'semantic-c' },
    ];

    const result = await service.search('query', 'config-1', chunks, 2);

    expect(ragService.search).toHaveBeenCalledWith('query', chunks, 10);
    expect(semanticSearchService.search).toHaveBeenCalledWith(
      'query',
      'config-1',
      10,
      SEMANTIC_MAX_DISTANCE,
    );
    expect(result).toHaveLength(2);
    // 'b' appears in both lists, so it must rank first.
    expect(result[0].id).toBe('b');
  });

  it('supports FAQ-only tenants via cached in-memory FAQ embeddings + lexical fusion', async () => {
    (semanticSearchService.search as jest.Mock).mockResolvedValue([]);
    const faqChunks = [
      { id: 'faq-0', content: 'WiFi password is IronLift2026', fileName: 'Gym FAQ' },
    ];
    (ragService.search as jest.Mock).mockReturnValue([faqChunks[0]]);

    const first = await service.search('What is the WiFi password?', 'config-faq', faqChunks, 4);
    const second = await service.search('What is the network password?', 'config-faq', faqChunks, 4);

    expect(semanticSearchService.search).not.toHaveBeenCalled();
    expect(embeddingService.embed).toHaveBeenCalledTimes(1); // cached across queries
    expect(first).toHaveLength(1);
    expect(first[0].id).toBe('faq-0');
    expect(second).toHaveLength(1);
    expect(second[0].id).toBe('faq-0');
  });

  it('returns [] for deterministic abstention when neither docs nor FAQs pass SEMANTIC_MAX_DISTANCE', async () => {
    (semanticSearchService.search as jest.Mock).mockResolvedValue([]);
    (embeddingService.embed as jest.Mock).mockResolvedValue([0, 1, 0]);
    (embeddingService.embedQuery as jest.Mock).mockResolvedValue([1, 0, 0]);

    const chunks = [
      { id: 'faq-0', content: 'WiFi password is IronLift2026', fileName: 'Gym FAQ' },
      { id: 'doc-1', content: 'Towel policy: bring a towel.', fileName: 'handbook.docx' },
    ];

    const result = await service.search('Can you give me car insurance quotes?', 'config-1', chunks, 4);

    expect(result).toEqual([]);
  });

  it('falls back to lexical retrieval for un-backfilled tenants with zero embedded doc chunks', async () => {
    (semanticSearchService.search as jest.Mock).mockResolvedValue([]);
    (semanticSearchService.hasEmbeddedChunks as jest.Mock).mockResolvedValue(false);

    const chunks = [
      { id: 'doc-1', content: 'Towel policy: bring a towel.', fileName: 'handbook.docx' },
    ];
    (ragService.search as jest.Mock).mockReturnValue(chunks);

    const result = await service.search('towel', 'config-legacy', chunks, 4);

    expect(semanticSearchService.hasEmbeddedChunks).toHaveBeenCalledWith('config-legacy');
    expect(result).toEqual(chunks);
  });

  it('falls back cleanly to lexical retrieval when the embedding model is not ready', async () => {
    (embeddingService.isReady as jest.Mock).mockReturnValue(false);

    const chunks = [{ id: 'doc-1', content: 'Sauna code is 8822#.' }];
    (ragService.search as jest.Mock).mockReturnValue(chunks);

    const result = await service.search('sauna code', 'config-1', chunks, 4);

    expect(semanticSearchService.search).not.toHaveBeenCalled();
    expect(result).toEqual(chunks);
  });
});
