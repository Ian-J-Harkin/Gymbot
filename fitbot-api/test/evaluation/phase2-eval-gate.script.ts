import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import {
  HYBRID_CANDIDATE_K,
  RAG_CHUNK_OVERLAP,
  RAG_CHUNK_SIZE,
  SEMANTIC_MAX_DISTANCE,
} from '../../src/common/constants';
import { cosineSimilarity } from '../../src/common/utils/math';
import { RagChunk, RagService } from '../../src/rag/rag.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmbeddingService } from '../../src/embedding/embedding.service';
import { embedChunks } from '../../src/embedding/chunk-embedding.util';
import { SemanticSearchService } from '../../src/semantic-search/semantic-search.service';
import { HybridRetrievalService } from '../../src/retrieval/hybrid-retrieval.service';
import { RetrievalCandidate } from '../../src/retrieval/rrf.util';

interface EvalFixtureSpec {
  file_name: string;
  file_type: string;
  normalized_text_fixture: string;
}

interface EvalCase {
  id: string;
  category: 'literal' | 'paraphrase' | 'multi_chunk' | 'faq_only' | 'distractor' | 'unanswerable';
  query: string;
  target_top_k: number | null;
  expected_anchor_groups: string[][];
  allow_abstention: boolean;
}

interface EvalDatasetV2 {
  version: string;
  dataset_name: string;
  fixtures: EvalFixtureSpec[];
  faq_text: string;
  scoring: {
    reported_k_values: number[];
  };
  test_cases: EvalCase[];
}

const apiRoot = path.resolve(__dirname, '..', '..');
const datasetPath = path.resolve(__dirname, 'datasets/gym_eval_v2.json');
const reportPath = path.resolve(apiRoot, 'test/evaluation/reports/phase2_gate_v2.latest.json');

function matchesAllAnchorGroups(contents: string[], groups: string[][]): boolean {
  if (groups.length === 0) return false;
  return groups.every((group) =>
    group.some((anchor) => contents.some((text) => text.includes(anchor))),
  );
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[idx].toFixed(2));
}

async function main() {
  if (!process.env.DATABASE_URL?.includes('fitbot_eval')) {
    throw new Error('Requires disposable fitbot_eval database. Use npm run test:eval:phase2-gate.');
  }

  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as EvalDatasetV2;
  const prisma = new PrismaService();
  await prisma.$connect();

  let peakRssMb = 0;
  const sampleRss = () => {
    const rssMb = process.memoryUsage().rss / (1024 * 1024);
    if (rssMb > peakRssMb) peakRssMb = rssMb;
  };
  sampleRss();

  const tEmbedStart = Date.now();
  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();
  const embeddingInitMs = Date.now() - tEmbedStart;
  sampleRss();
  if (!embeddingService.isReady()) {
    throw new Error('EmbeddingService failed to initialize.');
  }

  const ragService = new RagService();
  const semanticSearchService = new SemanticSearchService(embeddingService, prisma);
  const hybridService = new HybridRetrievalService(
    ragService,
    semanticSearchService,
    embeddingService,
  );

  const createdUserIds: string[] = [];

  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CHUNK_SIZE,
      chunkOverlap: RAG_CHUNK_OVERLAP,
    });

    // Tenant 1: Multi-document + FAQ corpus
    const t1User = await prisma.user.create({
      data: { email: `p2-full-${Date.now()}@eval.test`, password: 'eval' },
    });
    createdUserIds.push(t1User.id);
    const t1Config = await prisma.configuration.create({
      data: { userId: t1User.id, faqText: dataset.faq_text, aiProvider: 'openai' },
    });

    const docChunksForTenant1: RetrievalCandidate[] = [];
    for (const fixture of dataset.fixtures) {
      const textPath = path.resolve(apiRoot, fixture.normalized_text_fixture);
      const text = readFileSync(textPath, 'utf8').trimEnd();
      const splitDocs = await splitter.createDocuments([text]);

      const doc = await prisma.document.create({
        data: {
          fileName: fixture.file_name,
          fileType: fixture.file_type,
          content: text,
          configurationId: t1Config.id,
        },
      });
      await prisma.documentChunk.createMany({
        data: splitDocs.map((d) => ({ content: d.pageContent, documentId: doc.id })),
      });
      const created = await prisma.documentChunk.findMany({
        where: { documentId: doc.id },
        select: { id: true, content: true },
      });
      const { embedded, failed } = await embedChunks(prisma, embeddingService, created);
      if (failed > 0 || embedded !== created.length) {
        throw new Error(`Embedding failed for ${fixture.file_name}: ${embedded}/${created.length}`);
      }
      docChunksForTenant1.push(
        ...created.map((c) => ({ id: c.id, content: c.content, fileName: fixture.file_name })),
      );
    }

    const faqChunks = ragService.chunkText(dataset.faq_text).map((c, i) => ({
      id: `faq-${i}`,
      content: c.content,
      fileName: 'Gym FAQ',
    }));
    const faqVectors = await Promise.all(
      faqChunks.map(async (c) => ({
        ...c,
        vector: (await embeddingService.embed(c.content))!,
      })),
    );
    const t1AllChunks: RetrievalCandidate[] = [...faqChunks, ...docChunksForTenant1];

    // Tenant 2: FAQ-only corpus (0 DocumentChunk rows)
    const t2User = await prisma.user.create({
      data: { email: `p2-faq-${Date.now()}@eval.test`, password: 'eval' },
    });
    createdUserIds.push(t2User.id);
    const t2Config = await prisma.configuration.create({
      data: { userId: t2User.id, faqText: dataset.faq_text, aiProvider: 'openai' },
    });
    const t2AllChunks: RetrievalCandidate[] = [...faqChunks];

    console.log(
      `\nCorpus seeded: ${docChunksForTenant1.length} document chunks + ${faqChunks.length} FAQ chunks = ${t1AllChunks.length} total chunks (size=${RAG_CHUNK_SIZE}, overlap=${RAG_CHUNK_OVERLAP}, maxDist=${SEMANTIC_MAX_DISTANCE}).\n`,
    );

    const caseResults: Array<{
      id: string;
      category: EvalCase['category'];
      target_top_k: number | null;
      allow_abstention: boolean;
      min_distance: number | null;
      lexical: boolean;
      semantic_only: boolean;
      hybrid_bge_rrf: boolean;
      hybrid_count: number;
    }> = [];
    const latenciesMs: number[] = [];

    console.log(`=== BGE-SMALL COSINE DISTANCE DIAGNOSTIC (SEMANTIC_MAX_DISTANCE=${SEMANTIC_MAX_DISTANCE}) ===`);
    console.log('Category     | Case ID                             | Min Dist | Lex | Sem | Hybrid');
    console.log('-------------|-------------------------------------|----------|-----|-----|-------');

    for (const tc of dataset.test_cases) {
      const evalK = tc.target_top_k ?? 6;
      const qv = await embeddingService.embedQuery(tc.query);
      const vectorLiteral = `[${qv!.join(',')}]`;

      // Unfiltered min distance across persisted DocumentChunks + FAQ chunks for diagnostics
      const docRows = await prisma.$queryRaw<Array<{ distance: number }>>`
        SELECT dc.embedding <=> ${vectorLiteral}::vector AS distance
        FROM "DocumentChunk" dc
        JOIN "Document" d ON d.id = dc."documentId"
        WHERE d."configurationId" = ${t1Config.id} AND dc.embedding IS NOT NULL
        ORDER BY distance
        LIMIT 1
      `;
      const minDocDist = docRows.length > 0 ? Number(docRows[0].distance) : 1;
      const minFaqDist = faqVectors.reduce(
        (best, f) => Math.min(best, 1 - cosineSimilarity(qv!, f.vector)),
        1,
      );
      const minDistance = Number(Math.min(minDocDist, minFaqDist).toFixed(4));

      const lexRes = ragService.search(tc.query, t1AllChunks as unknown as RagChunk[], evalK);
      const semRes = await semanticSearchService.search(tc.query, t1Config.id, evalK);

      const t0 = performance.now();
      const hybridRes = await hybridService.search(tc.query, t1Config.id, t1AllChunks, evalK);
      latenciesMs.push(performance.now() - t0);
      sampleRss();

      const scoreCase = (items: Array<{ content: string }>) =>
        tc.allow_abstention
          ? items.length === 0
          : matchesAllAnchorGroups(items.map((i) => i.content), tc.expected_anchor_groups);

      const row = {
        id: tc.id,
        category: tc.category,
        target_top_k: tc.target_top_k,
        allow_abstention: tc.allow_abstention,
        min_distance: minDistance,
        lexical: scoreCase(lexRes),
        semantic_only: scoreCase(semRes),
        hybrid_bge_rrf: scoreCase(hybridRes),
        hybrid_count: hybridRes.length,
      };
      caseResults.push(row);

      console.log(
        `${tc.category.padEnd(12)} | ${tc.id.padEnd(35)} |   ${minDistance.toFixed(4)} |  ${row.lexical ? 'Y' : 'N'}  |  ${row.semantic_only ? 'Y' : 'N'}  |   ${row.hybrid_bge_rrf ? 'Y' : 'N'}`,
      );
    }

    // Tenant 2 (FAQ-only) verification
    const faqOnlyCases = dataset.test_cases.filter((c) => c.category === 'faq_only');
    const faqOnlyResults = await Promise.all(
      faqOnlyCases.map(async (tc) => {
        const res = await hybridService.search(tc.query, t2Config.id, t2AllChunks, tc.target_top_k ?? 4);
        return {
          id: tc.id,
          hit: matchesAllAnchorGroups(res.map((r) => r.content), tc.expected_anchor_groups),
        };
      }),
    );

    const rateFor = (
      cats: EvalCase['category'][],
      method: 'lexical' | 'semantic_only' | 'hybrid_bge_rrf',
    ) => {
      const subset = caseResults.filter((r) => cats.includes(r.category));
      const hits = subset.filter((r) => r[method]).length;
      return {
        hits,
        total: subset.length,
        percentage: subset.length > 0 ? Number(((hits / subset.length) * 100).toFixed(1)) : 0,
      };
    };

    const summary = {
      literal: {
        lexical: rateFor(['literal'], 'lexical'),
        semantic_only: rateFor(['literal'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['literal'], 'hybrid_bge_rrf'),
      },
      paraphrase: {
        lexical: rateFor(['paraphrase'], 'lexical'),
        semantic_only: rateFor(['paraphrase'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['paraphrase'], 'hybrid_bge_rrf'),
      },
      multi_chunk: {
        lexical: rateFor(['multi_chunk'], 'lexical'),
        semantic_only: rateFor(['multi_chunk'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['multi_chunk'], 'hybrid_bge_rrf'),
      },
      faq_in_full_corpus: {
        lexical: rateFor(['faq_only'], 'lexical'),
        semantic_only: rateFor(['faq_only'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['faq_only'], 'hybrid_bge_rrf'),
      },
      faq_only_tenant: {
        hits: faqOnlyResults.filter((r) => r.hit).length,
        total: faqOnlyResults.length,
        percentage: Number(((faqOnlyResults.filter((r) => r.hit).length / faqOnlyResults.length) * 100).toFixed(1)),
      },
      abstention_out_of_scope: {
        lexical: rateFor(['unanswerable'], 'lexical'),
        semantic_only: rateFor(['unanswerable'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['unanswerable'], 'hybrid_bge_rrf'),
      },
      abstention_distractor_and_oos: {
        lexical: rateFor(['distractor', 'unanswerable'], 'lexical'),
        semantic_only: rateFor(['distractor', 'unanswerable'], 'semantic_only'),
        hybrid_bge_rrf: rateFor(['distractor', 'unanswerable'], 'hybrid_bge_rrf'),
      },
    };

    const sortedLatencies = [...latenciesMs].sort((a, b) => a - b);
    const runtime = {
      embedding_init_ms: embeddingInitMs,
      retrieval_p50_ms: percentile(sortedLatencies, 50),
      retrieval_p95_ms: percentile(sortedLatencies, 95),
      peak_rss_mb: Number(peakRssMb.toFixed(1)),
    };

    const gate = {
      criterion_1_literal_no_regression:
        summary.literal.hybrid_bge_rrf.percentage === 100 &&
        summary.literal.hybrid_bge_rrf.percentage >= summary.literal.lexical.percentage,
      criterion_2_faq_no_regression:
        summary.faq_in_full_corpus.hybrid_bge_rrf.percentage === 100 &&
        summary.faq_only_tenant.percentage === 100,
      criterion_3_paraphrase_material_gain:
        summary.paraphrase.hybrid_bge_rrf.percentage >= summary.paraphrase.lexical.percentage + 20 ||
        summary.paraphrase.hybrid_bge_rrf.percentage >= 90,
      criterion_4_abstention_ge_lexical:
        summary.abstention_distractor_and_oos.hybrid_bge_rrf.percentage >=
        summary.abstention_distractor_and_oos.lexical.percentage,
      criterion_5_rss_within_512mb: runtime.peak_rss_mb <= 512,
    };

    const allPassed = Object.values(gate).every(Boolean);

    const report = {
      dataset_name: dataset.dataset_name,
      dataset_version: dataset.version,
      measured_at: new Date().toISOString(),
      config: {
        chunk_size: RAG_CHUNK_SIZE,
        chunk_overlap: RAG_CHUNK_OVERLAP,
        semantic_max_distance: SEMANTIC_MAX_DISTANCE,
        candidate_k: HYBRID_CANDIDATE_K,
        total_chunks: t1AllChunks.length,
      },
      runtime,
      summary,
      gate: { ...gate, all_passed: allPassed },
      cases: caseResults,
    };

    mkdirSync(path.dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log('\n=== SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n=== RUNTIME ===');
    console.log(JSON.stringify(runtime, null, 2));
    console.log('\n=== PHASE 2 GO/NO-GO GATE ===');
    console.log(JSON.stringify({ ...gate, all_passed: allPassed }, null, 2));

    if (!allPassed) {
      process.exitCode = 1;
    }
  } finally {
    const configs = await prisma.configuration.findMany({
      where: { userId: { in: createdUserIds } },
      select: { id: true },
    });
    const configIds = configs.map((c) => c.id);
    const docs = await prisma.document.findMany({
      where: { configurationId: { in: configIds } },
      select: { id: true },
    });
    const docIds = docs.map((d) => d.id);
    if (docIds.length > 0) {
      await prisma.documentChunk.deleteMany({ where: { documentId: { in: docIds } } });
      await prisma.document.deleteMany({ where: { id: { in: docIds } } });
    }
    if (configIds.length > 0) {
      await prisma.configuration.deleteMany({ where: { id: { in: configIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Phase 2 evaluation gate failed:', err);
  process.exitCode = 1;
});
