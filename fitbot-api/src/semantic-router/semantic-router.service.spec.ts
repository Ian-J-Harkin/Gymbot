import { Test, TestingModule } from '@nestjs/testing';
import { SemanticRouterService } from './semantic-router.service';
import { EmbeddingService } from '../embedding/embedding.service';

// Mock the route-anchors JSON
jest.mock('./route-anchors.json', () => [
    {
        name: 'rag_synthesis',
        embeddings: [[0.1, 0.2, 0.3]] // Perfect match for the dummy query
    },
    {
        name: 'standard_search',
        embeddings: [[0.9, 0.8, 0.7]]
    }
], { virtual: true });

describe('SemanticRouterService', () => {
    let service: SemanticRouterService;
    let embeddingService: Partial<EmbeddingService>;

    beforeEach(async () => {
        embeddingService = {
            embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SemanticRouterService,
                { provide: EmbeddingService, useValue: embeddingService },
            ],
        }).compile();

        service = module.get<SemanticRouterService>(SemanticRouterService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('routeQuery', () => {
        it('should correctly classify a query based on similarity', async () => {
            // The dummy query returns [0.1, 0.2, 0.3] which perfectly matches rag_synthesis
            const result = await service.routeQuery('some query');
            expect(result.route).toBe('rag_synthesis');
            expect(result.confidence).toBeGreaterThan(0.99); // Perfect match
        });

        it('should fallback to standard_search if the embedding model is not ready', async () => {
            (embeddingService.embed as jest.Mock).mockResolvedValue(null);
            const result = await service.routeQuery('some query');
            expect(result.route).toBe('standard_search');
            expect(result.confidence).toBe(0);
        });
    });
});
