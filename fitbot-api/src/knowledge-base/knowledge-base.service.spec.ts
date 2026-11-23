import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseService } from './knowledge-base.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';

// Mock dependencies
const mockPrisma = {
    configuration: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
    },
    documentChunk: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
    },
    $executeRaw: jest.fn(),
};

const mockEmbeddingService = {
    embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    isReady: jest.fn().mockReturnValue(true),
};

// Mock external libraries
jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'extracted pdf text' }));
jest.mock('mammoth', () => ({
    extractRawText: jest.fn().mockResolvedValue({ value: 'extracted docx text' }),
}));

describe('KnowledgeBaseService', () => {
    let service: KnowledgeBaseService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KnowledgeBaseService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EmbeddingService, useValue: mockEmbeddingService },
            ],
        }).compile();

        service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
        mockPrisma.documentChunk.findMany.mockResolvedValue([]);
        mockEmbeddingService.embed.mockResolvedValue([0.1, 0.2, 0.3]);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processFile', () => {
        const mockUserId = 'user-1';
        const mockConfig = { id: 'config-1', userId: mockUserId };

        it('should process a TXT file correctly', async () => {
            const mockFile = {
                originalname: 'test.txt',
                buffer: Buffer.from('hello world'),
            } as Express.Multer.File;

            mockPrisma.configuration.findUnique.mockResolvedValue(mockConfig);
            mockPrisma.document.create.mockResolvedValue({ id: 'doc-1' });

            const result = await service.processFile(mockUserId, mockFile);

            expect(mockPrisma.document.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    fileName: 'test.txt',
                    fileType: 'txt',
                    content: 'hello world',
                }),
            });
            expect(mockPrisma.documentChunk.createMany).toHaveBeenCalled();
            expect(result.documentId).toBe('doc-1');
        });

        it('should embed created chunks and persist via raw SQL', async () => {
            const mockFile = {
                originalname: 'test.txt',
                buffer: Buffer.from('hello world'),
            } as Express.Multer.File;

            mockPrisma.configuration.findUnique.mockResolvedValue(mockConfig);
            mockPrisma.document.create.mockResolvedValue({ id: 'doc-1' });
            mockPrisma.documentChunk.findMany.mockResolvedValue([
                { id: 'chunk-1', content: 'hello world' },
            ]);

            await service.processFile(mockUserId, mockFile);

            expect(mockEmbeddingService.embed).toHaveBeenCalledWith('hello world');
            expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
            const rawSqlArgs = (mockPrisma.$executeRaw as jest.Mock).mock.calls[0];
            // Tagged-template call: [strings, vectorLiteral, embeddingModel, embeddedAt, chunkId]
            expect(rawSqlArgs[1]).toBe('[0.1,0.2,0.3]');
            expect(rawSqlArgs[4]).toBe('chunk-1');
        });

        it('should leave a chunk unembedded when the embedding call fails, without blocking ingestion', async () => {
            const mockFile = {
                originalname: 'test.txt',
                buffer: Buffer.from('hello world'),
            } as Express.Multer.File;

            mockPrisma.configuration.findUnique.mockResolvedValue(mockConfig);
            mockPrisma.document.create.mockResolvedValue({ id: 'doc-1' });
            mockPrisma.documentChunk.findMany.mockResolvedValue([
                { id: 'chunk-1', content: 'hello world' },
            ]);
            mockEmbeddingService.embed.mockResolvedValue(null);

            const result = await service.processFile(mockUserId, mockFile);

            expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
            expect(result.documentId).toBe('doc-1');
        });

        it('should process a PDF file correctly', async () => {
            const mockFile = {
                originalname: 'document.pdf',
                buffer: Buffer.from('pdf data'),
            } as Express.Multer.File;

            mockPrisma.configuration.findUnique.mockResolvedValue(mockConfig);
            mockPrisma.document.create.mockResolvedValue({ id: 'doc-2' });

            const result = await service.processFile(mockUserId, mockFile);

            expect(mockPrisma.document.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    fileType: 'pdf',
                    content: 'extracted pdf text',
                }),
            });
            expect(result.chunksCount).toBeDefined();
        });

        it('should create a default configuration if one is missing', async () => {
            mockPrisma.configuration.findUnique.mockResolvedValue(null);
            mockPrisma.configuration.create.mockResolvedValue(mockConfig);
            mockPrisma.document.create.mockResolvedValue({ id: 'doc-3' });
            const mockFile = {
                originalname: 'test.txt',
                buffer: Buffer.from('hello world'),
            } as any;

            const result = await service.processFile(mockUserId, mockFile);

            expect(mockPrisma.configuration.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUserId,
                    widgetColor: '#2563EB',
                    aiProvider: 'openai',
                }),
            });
            expect(result.documentId).toBe('doc-3');
        });
    });

    describe('getDocuments', () => {
        it('should return documents for a user', async () => {
            mockPrisma.document.findMany.mockResolvedValue([{ id: 'doc-1', fileName: 'test.pdf' }]);

            const result = await service.getDocuments('user-1');

            expect(mockPrisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { configuration: { userId: 'user-1' } }
            }));
            expect(result).toHaveLength(1);
        });
    });

    describe('deleteDocument', () => {
        it('should delete document and its chunks', async () => {
            mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });

            await service.deleteDocument('user-1', 'doc-1');

            expect(mockPrisma.documentChunk.deleteMany).toHaveBeenCalledWith({
                where: { documentId: 'doc-1' }
            });
            expect(mockPrisma.document.delete).toHaveBeenCalledWith({
                where: { id: 'doc-1' }
            });
        });

        it('should throw error if document not found or unauthorized', async () => {
            mockPrisma.document.findFirst.mockResolvedValue(null);

            await expect(service.deleteDocument('user-1', 'doc-1')).rejects.toThrow('Document not found');
        });
    });
});
