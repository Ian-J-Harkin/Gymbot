import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';

describe('RagService', () => {
    let service: RagService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RagService],
        }).compile();

        service = module.get<RagService>(RagService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('chunkText', () => {
        it('should split text by double newlines', () => {
            const text = "Question 1\nAnswer 1\n\nQuestion 2\nAnswer 2";
            const chunks = service.chunkText(text);
            expect(chunks).toHaveLength(2);
            expect(chunks[0].content).toBe("Question 1\nAnswer 1");
            expect(chunks[1].content).toBe("Question 2\nAnswer 2");
        });

        it('should return empty array for empty text', () => {
            expect(service.chunkText('')).toHaveLength(0);
        });
    });

    describe('search', () => {
        const chunks = [
            { id: 0, content: "We have a swimming pool and sauna." },
            { id: 1, content: "Our gym has lifting weights and cardio machines." },
            { id: 2, content: "Personal training is available on request." }
        ];

        it('should find relevant chunks based on keywords', () => {
            const results = service.search("Do you have a pool?", chunks);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(0);
        });

        it('should find relevant chunks for lifting', () => {
            const results = service.search("tell me about lifting weights", chunks);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(1);
        });

        it('should return empty array if no matches', () => {
            const results = service.search("unrelated query terms here", chunks);
            expect(results).toHaveLength(0);
        });

        it('should limit results to topK', () => {
            const results = service.search("gym swimming personal training", chunks, 1);
            expect(results).toHaveLength(1);
        });
    });
});
