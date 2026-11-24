import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as mammoth from 'mammoth';
import { RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP, MIN_EXTRACTED_CONTENT_LENGTH } from '../common/constants';
import { EmbeddingService } from '../embedding/embedding.service';
import { embedChunks } from '../embedding/chunk-embedding.util';

/**
 * Normalizes extracted document text while preserving line and paragraph breaks
 * so RecursiveCharacterTextSplitter can split along section boundaries.
 */
export function sanitizeDocumentText(raw: string): string {
    return raw
        .replace(/\r\n?/g, '\n')
        .replace(/[^\x20-\x7E\n\t\u00A0-\u00FF\u2010-\u201F\u2022]/g, ' ')
        .replace(/[ \t\u00A0]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

@Injectable()
export class KnowledgeBaseService {
    private readonly logger = new Logger(KnowledgeBaseService.name);
    private readonly splitter = new RecursiveCharacterTextSplitter({
        chunkSize: RAG_CHUNK_SIZE,
        chunkOverlap: RAG_CHUNK_OVERLAP,
    });

    constructor(private prisma: PrismaService, private embeddingService: EmbeddingService) { }

    async processFile(userId: string, file: Express.Multer.File): Promise<any> {
        let config = await this.prisma.configuration.findUnique({
            where: { userId },
        });

        if (!config) {
            this.logger.log(`No configuration found for user ${userId}. Creating default configuration.`);
            config = await this.prisma.configuration.create({
                data: {
                    userId,
                    widgetColor: '#2563EB',
                    aiProvider: 'openai',
                    faqText: '',
                    apiKey: {
                        create: {
                            key: `fb_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
                        }
                    }
                },
            });
        }

        let content = '';
        const fileType = file.originalname.split('.').pop()?.toLowerCase();

        if (fileType === 'pdf') {
            // Conditionally require to handle commonjs/esm interop
            const pdfParser = require('pdf-parse');
            this.logger.debug(`Type of pdfParser: ${typeof pdfParser}`);

            let parser: any = pdfParser;
            if (typeof pdfParser !== 'function' && pdfParser && typeof pdfParser.default === 'function') {
                parser = pdfParser.default;
            }

            if (typeof parser !== 'function') {
                throw new BadRequestException(`PDF parser initialization failed. Type: ${typeof parser}`);
            }

            const data = await parser(file.buffer);
            content = data.text;
        } else if (fileType === 'docx') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            content = result.value;
        } else if (fileType === 'txt') {
            content = file.buffer.toString('utf-8');
        } else {
            throw new BadRequestException('Unsupported file type');
        }

        // Sanitize content: preserve line/paragraph structure while normalizing spaces and NBSPs
        const originalLength = content.length;
        content = sanitizeDocumentText(content);

        this.logger.log(`Extracted content from ${file.originalname}: ${originalLength} chars (Sanitized to ${content.length} chars)`);

        if (content.length < MIN_EXTRACTED_CONTENT_LENGTH && originalLength > 0) {
            this.logger.warn(`PDF extraction for ${file.originalname} seems poor. Only ${content.length} chars found.`);
        }

        // 1. Create Document
        const document = await this.prisma.document.create({
            data: {
                fileName: file.originalname,
                fileType: fileType || 'unknown',
                content: content,
                configurationId: config.id,
            },
        });

        // 2. Chunk and Save Chunks
        const chunks = await this.splitter.createDocuments([content]);

        const chunkData = chunks.map((chunk) => ({
            content: chunk.pageContent,
            documentId: document.id,
        }));

        await this.prisma.documentChunk.createMany({
            data: chunkData,
        });

        // 3. Embed each new chunk synchronously (local MiniLM, no external API).
        // Embedding failures degrade gracefully: the chunk keeps content-only lexical
        // search; see eval_implementation_plan.md Task 3.4.
        const createdChunks = await this.prisma.documentChunk.findMany({
            where: { documentId: document.id },
            select: { id: true, content: true },
        });
        const { embedded, failed } = await embedChunks(this.prisma, this.embeddingService, createdChunks);
        if (failed > 0) {
            this.logger.warn(`${failed} of ${createdChunks.length} chunks for ${file.originalname} could not be embedded.`);
        }

        this.logger.log(`Processed document ${file.originalname}: ${chunks.length} chunks created, ${embedded} embedded.`);

        return {
            documentId: document.id,
            chunksCount: chunks.length,
        };
    }

    async getDocuments(userId: string) {
        return this.prisma.document.findMany({
            where: {
                configuration: {
                    userId,
                },
            },
            include: {
                _count: {
                    select: { chunks: true },
                },
            },
        });
    }

    async deleteDocument(userId: string, documentId: string) {
        // Ensure document belongs to user
        const doc = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                configuration: {
                    userId,
                },
            },
        });

        if (!doc) throw new NotFoundException('Document not found');

        // Delete chunks first
        await this.prisma.documentChunk.deleteMany({
            where: { documentId },
        });

        return this.prisma.document.delete({
            where: { id: documentId },
        });
    }
}
