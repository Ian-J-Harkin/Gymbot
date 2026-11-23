import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { RAG_CHUNK_OVERLAP, RAG_CHUNK_SIZE } from '../../src/common/constants';
import { RagService, RagChunk } from '../../src/rag/rag.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmbeddingService } from '../../src/embedding/embedding.service';
import { embedChunks } from '../../src/embedding/chunk-embedding.util';
import { SemanticSearchService } from '../../src/semantic-search/semantic-search.service';
import { HybridRetrievalService } from '../../src/retrieval/hybrid-retrieval.service';
import { RetrievalCandidate } from '../../src/retrieval/rrf.util';

/**
 * Task 3.6 go/no-go gate: measures the REAL lexical, semantic-only, and hybrid
 * (RRF-fused) retrievers against the literal + paraphrase Iron Oasis cases,
 * using the actual production code paths (RagService, SemanticSearchService,
 * HybridRetrievalService) against a real embedding model and a real pgvector
 * database.
 *
 * This is a plain script, NOT a Jest test: onnxruntime-node's tensor creation
 * runs via setImmediate in a different VM realm than Jest's test context, so
 * `data instanceof Float32Array` fails inside Jest even for a trivial single
 * embed call (reproduced independently of this harness). Jest is not a viable
 * host for real-model inference here; this mirrors why
 * scripts/backfill-chunk-embeddings.ts is also a plain script.
 *
 * Usage: npm run test:eval:hybrid-gate (starts/stops the disposable
 * fitbot_eval Postgres via docker compose, same as test:eval:integration).
 */

interface EvaluationCase {
  id: string;
  category: string;
  paraphrase_of?: string;
  query: string;
  target_top_k: number | null;
  expected_text_contains: string[];
  allow_abstention: boolean;
}

interface EvaluationDataset {
  version: string;
  dataset_name: string;
  source_fixture: {
    normalized_text_fixture: string;
    normalized_text_sha256: string;
  };
  scoring: {
    reported_k_values: number[];
  };
  test_cases: EvaluationCase[];
}

const apiRoot = path.resolve(__dirname, '..', '..');
const datasetPath = path.resolve(__dirname, 'datasets/iron_oasis_v1.json');
const reportPath = path.resolve(apiRoot, 'test/evaluation/reports/hybrid_vs_lexical_v1.latest.json');

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function anyAnchorPresent(content: string, anchors: string[]): boolean {
  return anchors.some((anchor) => content.includes(anchor));
}

async function main() {
  if (!process.env.DATABASE_URL?.includes('fitbot_eval')) {
    throw new Error('This script requires the disposable fitbot_eval database. Use npm run test:eval:hybrid-gate.');
  }

  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as EvaluationDataset;

  const prisma = new PrismaService();
  await prisma.$connect();

  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();
  if (!embeddingService.isReady()) {
    throw new Error('Embedding model failed to initialize; cannot measure the hybrid retrieval gate.');
  }

  const semanticSearchService = new SemanticSearchService(embeddingService, prisma);
  const ragService = new RagService();
  const hybridRetrievalService = new HybridRetrievalService(ragService, semanticSearchService);

  let userId = '';
  let configurationId = '';
  let documentId = '';

  try {
    // Seed one tenant with the frozen, production-identical Iron Oasis chunks.
    const normalizedTextPath = path.resolve(apiRoot, dataset.source_fixture.normalized_text_fixture);
    const normalizedText = readFileSync(normalizedTextPath, 'utf8').trimEnd();
    if (sha256(normalizedText) !== dataset.source_fixture.normalized_text_sha256) {
      throw new Error('Normalized text fixture hash mismatch; aborting to avoid measuring against drifted content.');
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CHUNK_SIZE,
      chunkOverlap: RAG_CHUNK_OVERLAP,
    });
    const splitDocs = await splitter.createDocuments([normalizedText]);

    const email = `hybrid-gate-${Date.now()}@eval.test`;
    const user = await prisma.user.create({ data: { email, password: 'evaluation-only' } });
    userId = user.id;
    const configuration = await prisma.configuration.create({
      data: { userId, faqText: '', aiProvider: 'openai' },
    });
    configurationId = configuration.id;
    const document = await prisma.document.create({
      data: {
        fileName: 'iron_oasis_handbook.docx',
        fileType: 'docx',
        content: normalizedText,
        configurationId,
      },
    });
    documentId = document.id;

    await prisma.documentChunk.createMany({
      data: splitDocs.map((d) => ({ content: d.pageContent, documentId })),
    });
    const createdChunks = await prisma.documentChunk.findMany({
      where: { documentId },
      select: { id: true, content: true },
    });
    const { embedded, failed } = await embedChunks(prisma, embeddingService, createdChunks);
    if (failed > 0 || embedded !== createdChunks.length) {
      throw new Error(`Embedding setup incomplete: ${embedded} embedded, ${failed} failed, of ${createdChunks.length} chunks.`);
    }

    const chunks: RetrievalCandidate[] = createdChunks.map((c) => ({ id: c.id, content: c.content }));

    const kValues = dataset.scoring.reported_k_values;
    const answerableCases = dataset.test_cases.filter((c) => c.category !== 'unanswerable' && c.target_top_k !== null);
    const literalCases = answerableCases.filter((c) => c.category !== 'paraphrase');
    const paraphraseCases = answerableCases.filter((c) => c.category === 'paraphrase');
    const unanswerableCases = dataset.test_cases.filter((c) => c.allow_abstention);

    const caseResults: Record<string, Record<number, { lexical: boolean; semantic: boolean; hybrid: boolean }>> = {};

    for (const testCase of answerableCases) {
      caseResults[testCase.id] = {};
      for (const topK of kValues) {
        const lexical = ragService.search(testCase.query, chunks as unknown as RagChunk[], topK);
        const semantic = await semanticSearchService.search(testCase.query, configurationId, topK);
        const hybrid = await hybridRetrievalService.search(testCase.query, configurationId, chunks, topK);

        caseResults[testCase.id][topK] = {
          lexical: lexical.some((c) => anyAnchorPresent(c.content, testCase.expected_text_contains)),
          semantic: semantic.some((c) => anyAnchorPresent(c.content, testCase.expected_text_contains)),
          hybrid: hybrid.some((c) => anyAnchorPresent(c.content, testCase.expected_text_contains)),
        };
      }
      console.log(`Measured: ${testCase.id}`);
    }

    const hitRateFor = (cases: EvaluationCase[], method: 'lexical' | 'semantic' | 'hybrid') =>
      Object.fromEntries(
        kValues.map((topK) => {
          const hits = cases.filter((c) => caseResults[c.id][topK][method]).length;
          return [topK, { hits, total: cases.length, percentage: cases.length > 0 ? (hits / cases.length) * 100 : 0 }];
        }),
      );

    const unanswerable_results = Object.fromEntries(
      await Promise.all(
        unanswerableCases.map(async (c) => [
          c.id,
          {
            lexical_retrieved_count: ragService.search(c.query, chunks as unknown as RagChunk[], 6).length,
            semantic_only_retrieved_count: (await semanticSearchService.search(c.query, configurationId, 6)).length,
            hybrid_retrieved_count: (await hybridRetrievalService.search(c.query, configurationId, chunks, 6)).length,
          }
        ])
      )
    );

    const report = {
      dataset_name: dataset.dataset_name,
      dataset_version: dataset.version,
      measured_at: new Date().toISOString(),
      literal: {
        lexical: hitRateFor(literalCases, 'lexical'),
        semantic_only: hitRateFor(literalCases, 'semantic'),
        hybrid: hitRateFor(literalCases, 'hybrid'),
      },
      paraphrase: {
        lexical: hitRateFor(paraphraseCases, 'lexical'),
        semantic_only: hitRateFor(paraphraseCases, 'semantic'),
        hybrid: hitRateFor(paraphraseCases, 'hybrid'),
      },
      unanswerable_abstention_check: unanswerable_results,
      case_results: caseResults,
    };

    mkdirSync(path.dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Hybrid-vs-lexical gate report written to ${path.relative(apiRoot, reportPath)}`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (documentId) await prisma.documentChunk.deleteMany({ where: { documentId } });
    if (documentId) await prisma.document.deleteMany({ where: { id: documentId } });
    if (configurationId) await prisma.configuration.deleteMany({ where: { id: configurationId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Hybrid gate measurement failed:', err);
  process.exitCode = 1;
});
