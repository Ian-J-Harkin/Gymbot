import { Test, TestingModule } from '@nestjs/testing';
import { SemanticSearchService } from './semantic-search.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SemanticSearchService', () => {
  let service: SemanticSearchService;
  let embeddingService: Partial<EmbeddingService>;
  let prismaService: Partial<PrismaService>;

  beforeEach(async () => {
    embeddingService = {
      embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    };
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'chunk-1',
          content: 'The sauna code is 8822#.',
          fileName: 'handbook.docx',
          distance: 0.33,
        },
      ]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticSearchService,
        { provide: EmbeddingService, useValue: embeddingService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get(SemanticSearchService);
  });

  it('returns an empty array when the embedding model is not ready', async () => {
    (embeddingService.embedQuery as jest.Mock).mockResolvedValue(null);

    const result = await service.search('sauna code', 'config-1', 4);

    expect(result).toEqual([]);
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
  });

  it('queries DocumentChunk scoped to the given configurationId and applies the BGE distance threshold', async () => {
    const result = await service.search('sauna code', 'config-1', 4);

    expect(embeddingService.embedQuery).toHaveBeenCalledWith('sauna code');
    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    const [strings, ...values] = (prismaService.$queryRaw as jest.Mock).mock
      .calls[0];
    // Prisma.sql tagged-template: strings array joined with the interpolated values.
    expect(strings.join('')).toContain('WHERE d."configurationId" =');
    expect(strings.join('')).toContain('WHERE distance <=');
    expect(values).toContain('config-1');
    expect(values).toContain(0.52);
    expect(values).toContain(4);
    expect(result).toEqual([
      {
        id: 'chunk-1',
        content: 'The sauna code is 8822#.',
        fileName: 'handbook.docx',
        distance: 0.33,
      },
    ]);
  });

  it('checks whether a configuration has any embedded document chunks', async () => {
    (prismaService.$queryRaw as jest.Mock).mockResolvedValueOnce([{ exists: 1 }]);
    expect(await service.hasEmbeddedChunks('config-1')).toBe(true);

    (prismaService.$queryRaw as jest.Mock).mockResolvedValueOnce([]);
    expect(await service.hasEmbeddedChunks('config-2')).toBe(false);
  });
});
