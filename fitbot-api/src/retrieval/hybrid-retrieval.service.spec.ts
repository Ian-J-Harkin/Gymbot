import { Test, TestingModule } from '@nestjs/testing';
import { HybridRetrievalService } from './hybrid-retrieval.service';
import { RagService } from '../rag/rag.service';
import { SemanticSearchService } from '../semantic-search/semantic-search.service';

describe('HybridRetrievalService', () => {
  let service: HybridRetrievalService;
  let ragService: Partial<RagService>;
  let semanticSearchService: Partial<SemanticSearchService>;

  beforeEach(async () => {
    ragService = {
      search: jest.fn().mockReturnValue([
        { id: 'a', content: 'lexical-a' },
        { id: 'b', content: 'lexical-b' },
      ]),
    };
    semanticSearchService = {
      search: jest.fn().mockResolvedValue([
        { id: 'b', content: 'lexical-b', fileName: 'doc.docx' },
        { id: 'c', content: 'semantic-c', fileName: 'doc.docx' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridRetrievalService,
        { provide: RagService, useValue: ragService },
        { provide: SemanticSearchService, useValue: semanticSearchService },
      ],
    }).compile();

    service = module.get(HybridRetrievalService);
  });

  it('fuses lexical and semantic candidates and respects topK', async () => {
    const chunks = [
      { id: 'a', content: 'lexical-a' },
      { id: 'b', content: 'lexical-b' },
      { id: 'c', content: 'semantic-c' },
    ];

    const result = await service.search('query', 'config-1', chunks, 2);

    expect(ragService.search).toHaveBeenCalledWith('query', chunks, 2);
    expect(semanticSearchService.search).toHaveBeenCalledWith(
      'query',
      'config-1',
      2,
    );
    expect(result).toHaveLength(2);
    // 'b' appears in both lists, so it must rank first.
    expect(result[0].id).toBe('b');
  });
});
