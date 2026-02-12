import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as mammoth from 'mammoth';

@Injectable()
export class KnowledgeBaseService {
    private readonly logger = new Logger(KnowledgeBaseService.name);
    private readonly splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    constructor(private prisma: PrismaService) { }

    async processFile(userId: string, file: Express.Multer.File): Promise<any> {
        const config = await this.prisma.configuration.findUnique({
            where: { userId },
        });

        if (!config) {
            throw new Error('User configuration not found');
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
                throw new Error(`PDF parser initialization failed. Type: ${typeof parser}`);
            }

            const data = await parser(file.buffer);
            content = data.text;
        } else if (fileType === 'docx') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            content = result.value;
        } else if (fileType === 'txt') {
            content = file.buffer.toString('utf-8');
        } else {
            throw new Error('Unsupported file type');
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

        this.logger.log(`Processed document ${file.originalname}: ${chunks.length} chunks created.`);

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

        if (!doc) throw new Error('Document not found');

        // Delete chunks first
        await this.prisma.documentChunk.deleteMany({
            where: { documentId },
        });

        return this.prisma.document.delete({
            where: { id: documentId },
        });
    }
}
