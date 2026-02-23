import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseService } from './knowledge-base.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock dependencies
const mockPrisma = {
    configuration: {
        findUnique: jest.fn(),
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
        findMany: jest.fn(),
    },
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
            ],
        }).compile();

        service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
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

        it('should throw error if config missing', async () => {
            mockPrisma.configuration.findUnique.mockResolvedValue(null);
            const mockFile = { originalname: 'test.txt', buffer: Buffer.from('') } as any;

            await expect(service.processFile(mockUserId, mockFile)).rejects.toThrow('User configuration not found');
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
