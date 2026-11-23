/**
 * Diagnostic: prints the raw cosine distance from each test query to each
 * document chunk. This tells us exactly where to set MAX_DISTANCE so that
 * legitimate queries pass and distractors are rejected.
 *
 * Usage: same docker-compose plumbing as the hybrid gate script.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP } from '../../src/common/constants';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmbeddingService } from '../../src/embedding/embedding.service';
import { embedChunks } from '../../src/embedding/chunk-embedding.util';

interface TestCase {
  id: string;
  category: string;
  query: string;
  allow_abstention: boolean;
}

const apiRoot = path.resolve(__dirname, '..', '..');
const datasetPath = path.resolve(__dirname, 'datasets/iron_oasis_v1.json');

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  if (!process.env.DATABASE_URL?.includes('fitbot_eval')) {
    throw new Error('Requires fitbot_eval database.');
  }

  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8'));
  const prisma = new PrismaService();
  await prisma.$connect();

  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();

  const normalizedTextPath = path.resolve(apiRoot, dataset.source_fixture.normalized_text_fixture);
  const normalizedText = readFileSync(normalizedTextPath, 'utf8').trimEnd();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: RAG_CHUNK_SIZE,
    chunkOverlap: RAG_CHUNK_OVERLAP,
  });
  const splitDocs = await splitter.createDocuments([normalizedText]);

  // Seed tenant
  const email = `distance-diag-${Date.now()}@eval.test`;
  const user = await prisma.user.create({ data: { email, password: 'eval' } });
  const configuration = await prisma.configuration.create({
    data: { userId: user.id, faqText: '', aiProvider: 'openai' },
  });
  const document = await prisma.document.create({
    data: {
      fileName: 'iron_oasis_handbook.docx',
      fileType: 'docx',
      content: normalizedText,
      configurationId: configuration.id,
    },
  });

  await prisma.documentChunk.createMany({
    data: splitDocs.map((d) => ({ content: d.pageContent, documentId: document.id })),
  });
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId: document.id },
    select: { id: true, content: true },
  });
  await embedChunks(prisma, embeddingService, chunks);

  // For each test case, get the raw distances to every chunk
  const testCases: TestCase[] = dataset.test_cases;

  console.log('\n=== RAW COSINE DISTANCES (lower = more similar) ===\n');
  console.log('Category | Case ID | Min Distance | Chunk Distances');
  console.log('---------|---------|-------------|----------------');

  for (const tc of testCases) {
    const queryVector = await embeddingService.embed(tc.query);
    if (!queryVector) {
      console.log(`${tc.category} | ${tc.id} | EMBED_FAIL | -`);
      continue;
    }
    const vectorLiteral = `[${queryVector.join(',')}]`;

    const rows = await prisma.$queryRaw<{ id: string; distance: number; content_preview: string }[]>`
      SELECT dc.id,
             dc.embedding <=> ${vectorLiteral}::vector AS distance,
             LEFT(dc.content, 60) AS content_preview
      FROM "DocumentChunk" dc
      JOIN "Document" d ON d.id = dc."documentId"
      WHERE d."configurationId" = ${configuration.id} AND dc.embedding IS NOT NULL
      ORDER BY distance
    `;

    const minDist = rows.length > 0 ? Number(rows[0].distance).toFixed(4) : 'N/A';
    const allDists = rows.map((r) => Number(r.distance).toFixed(4)).join(', ');
    const shouldAbstain = tc.allow_abstention ? '(SHOULD ABSTAIN)' : '';
    console.log(`${tc.category.padEnd(14)} | ${tc.id.padEnd(40)} | ${minDist.padStart(6)} | [${allDists}] ${shouldAbstain}`);
  }

  // Cleanup
  await prisma.documentChunk.deleteMany({ where: { documentId: document.id } });
  await prisma.document.deleteMany({ where: { id: document.id } });
  await prisma.configuration.deleteMany({ where: { id: configuration.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Diagnostic failed:', err);
  process.exitCode = 1;
});
