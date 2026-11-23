import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { RAG_CHUNK_OVERLAP, RAG_CHUNK_SIZE } from '../../../src/common/constants';
import { RagChunk, RagService } from '../../../src/rag/rag.service';

interface EvaluationCase {
  id: string;
  category: string;
  paraphrase_of?: string;
  query: string;
  target_top_k: number | null;
  expected_document_name: string | null;
  expected_text_contains: string[];
  expected_answer_facts: string[];
  allow_abstention: boolean;
}

interface EvaluationDataset {
  version: string;
  dataset_name: string;
  source_fixture: {
    file_name: string;
    repository_path: string;
    sha256: string;
    extractor: string;
    extractor_version: string;
    normalization: string;
    normalized_text_fixture: string;
    normalized_text_sha256: string;
    splitter: {
      name: string;
      chunk_size: number;
      chunk_overlap: number;
      observed_chunk_count: number;
    };
  };
  scoring: {
    answerable_case_count: number;
    paraphrase_case_count: number;
    retrieval_hit: string;
    reported_k_values: number[];
    unanswerable_scored_separately: boolean;
  };
  test_cases: EvaluationCase[];
}

const apiRoot = path.resolve(__dirname, '../../..');
const repositoryRoot = path.resolve(apiRoot, '..');
const datasetPath = path.resolve(__dirname, '../datasets/iron_oasis_v1.json');
const reportPath = path.resolve(apiRoot, 'test/evaluation/reports/iron_oasis_v1.latest.json');

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function matchingAnchors(chunk: RagChunk, anchors: string[]): string[] {
  return anchors.filter((anchor) => chunk.content.includes(anchor));
}

describe('offline Iron Oasis retrieval evaluation v1', () => {
  let dataset: EvaluationDataset;
  let chunks: RagChunk[];

  beforeAll(async () => {
    dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as EvaluationDataset;

    const sourcePath = path.resolve(repositoryRoot, dataset.source_fixture.repository_path);
    const sourceHash = sha256(readFileSync(sourcePath));
    expect(sourceHash).toBe(dataset.source_fixture.sha256);

    const mammothPackagePath = path.resolve(apiRoot, 'node_modules/mammoth/package.json');
    const mammothPackage = JSON.parse(readFileSync(mammothPackagePath, 'utf8')) as { version: string };
    expect(mammothPackage.version).toBe(dataset.source_fixture.extractor_version);

    const normalizedTextPath = path.resolve(apiRoot, dataset.source_fixture.normalized_text_fixture);
    const normalizedText = readFileSync(normalizedTextPath, 'utf8').trimEnd();
    expect(sha256(normalizedText)).toBe(dataset.source_fixture.normalized_text_sha256);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CHUNK_SIZE,
      chunkOverlap: RAG_CHUNK_OVERLAP,
    });
    const documents = await splitter.createDocuments([normalizedText]);
    chunks = documents.map((document, index) => ({
      id: index,
      content: document.pageContent,
    }));

    expect(dataset.source_fixture.splitter.chunk_size).toBe(RAG_CHUNK_SIZE);
    expect(dataset.source_fixture.splitter.chunk_overlap).toBe(RAG_CHUNK_OVERLAP);
    expect(chunks).toHaveLength(dataset.source_fixture.splitter.observed_chunk_count);
    expect(
      dataset.test_cases.filter((testCase) => testCase.target_top_k !== null && testCase.category !== 'paraphrase'),
    ).toHaveLength(dataset.scoring.answerable_case_count);
    expect(dataset.test_cases.filter((testCase) => testCase.category === 'paraphrase')).toHaveLength(
      dataset.scoring.paraphrase_case_count,
    );
  });

  it('reports binary evidence hits at K=4 and K=6 and abstains on the unanswerable query', () => {
    const ragService = new RagService();
    const reportedKValues = dataset.scoring.reported_k_values;
    const answerableCases = dataset.test_cases.filter(
      (testCase) => testCase.target_top_k !== null && testCase.category !== 'paraphrase',
    );
    const paraphraseCases = dataset.test_cases.filter((testCase) => testCase.category === 'paraphrase');
    const unanswerableCase = dataset.test_cases.find(
      (testCase) => testCase.category === 'unanswerable' && testCase.allow_abstention,
    );

    expect(unanswerableCase).toBeDefined();

    const caseResults = dataset.test_cases.map((testCase) => {
      const byK = Object.fromEntries(
        reportedKValues.map((topK) => {
          const retrieved = ragService.search(testCase.query, chunks, topK);
          const matchedAnchors = Array.from(
            new Set(retrieved.flatMap((chunk) => matchingAnchors(chunk, testCase.expected_text_contains))),
          );

          return [
            topK,
            {
              hit: testCase.expected_text_contains.length > 0 && matchedAnchors.length > 0,
              matched_anchors: matchedAnchors,
              retrieved_chunk_indexes: retrieved.map((chunk) => chunk.id),
              scores: retrieved.map((chunk) => chunk.score ?? 0),
            },
          ];
        }),
      );

      const targetTopK = testCase.target_top_k;
      const targetHit = targetTopK === null ? null : byK[targetTopK as keyof typeof byK].hit;

      return {
        id: testCase.id,
        category: testCase.category,
        paraphrase_of: testCase.paraphrase_of ?? null,
        query: testCase.query,
        target_top_k: targetTopK,
        target_hit: targetHit,
        by_k: byK,
      };
    });

    const hitRateFor = (cases: typeof caseResults) =>
      Object.fromEntries(
        reportedKValues.map((topK) => {
          const hits = cases.filter((result) => result.by_k[topK as keyof typeof result.by_k].hit).length;
          return [topK, { hits, total: cases.length, percentage: cases.length > 0 ? (hits / cases.length) * 100 : 0 }];
        }),
      );

    const literalResults = caseResults.filter((result) => result.target_top_k !== null && result.category !== 'paraphrase');
    const paraphraseResults = caseResults.filter((result) => result.category === 'paraphrase');
    const hitsAtK = hitRateFor(literalResults);
    const paraphraseHitsAtK = hitRateFor(paraphraseResults);

    const targetHits = literalResults.filter((result) => result.target_hit === true).length;
    const paraphraseTargetHits = paraphraseResults.filter((result) => result.target_hit === true).length;
    const unanswerableResults = ragService.search(unanswerableCase!.query, chunks, 6);
    const report = {
      dataset_name: dataset.dataset_name,
      dataset_version: dataset.version,
      source_fixture: {
        file_name: dataset.source_fixture.file_name,
        sha256: dataset.source_fixture.sha256,
        normalized_text_sha256: dataset.source_fixture.normalized_text_sha256,
        extractor: dataset.source_fixture.extractor,
        extractor_version: dataset.source_fixture.extractor_version,
      },
      splitter: {
        chunk_size: RAG_CHUNK_SIZE,
        chunk_overlap: RAG_CHUNK_OVERLAP,
        chunk_count: chunks.length,
      },
      metrics: {
        hits_at_k: hitsAtK,
        target_k_hits: { hits: targetHits, total: answerableCases.length },
        provisional_upgrade_rule: targetHits < 4 ? 'investigate_retrieval_upgrade' : 'baseline_meets_rule_of_thumb',
        paraphrase_hits_at_k: paraphraseHitsAtK,
        paraphrase_target_k_hits: { hits: paraphraseTargetHits, total: paraphraseCases.length },
        unanswerable: {
          case_id: unanswerableCase!.id,
          retrieved_chunk_count: unanswerableResults.length,
          abstention_expected: true,
          no_retrieval_match: unanswerableResults.length === 0,
        },
      },
      cases: caseResults,
    };

    mkdirSync(path.dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Iron Oasis retrieval report written to ${path.relative(apiRoot, reportPath)}`);
    console.log(JSON.stringify(report.metrics, null, 2));

    expect(unanswerableResults).toHaveLength(0);
  });
});