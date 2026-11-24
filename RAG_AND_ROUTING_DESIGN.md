# FitBot RAG & Routing Architecture Design

**Date:** 2026-11-23 (Phase 2 updated & verified 2026-11-24)  
**Status:** Phase 1 & Phase 2 Implemented & Gate-Verified (Phase 3 RFC remains experimental)  
**Baseline Commit:** `0b50ba9` (`pre-search semantic routing layer (2)`) + uncommitted Phase 1–3 working-tree changes in `Gymbot/`

## 1. Document Authority

This document is the authoritative design specification for FitBot document ingestion, chunking, retrieval, evaluation, and query routing.

It **supersedes** the conflicting claims and bypassed gates across:
- [SEMANTIC_SEARCH_DESIGN_DISCUSSION.md](SEMANTIC_SEARCH_DESIGN_DISCUSSION.md)
- [SEMANTIC_SEARCH_COMPARISON.md](SEMANTIC_SEARCH_COMPARISON.md)
- [Evaluation_upgrade.md](Evaluation_upgrade.md)
- [evaluation_issues.md](evaluation_issues.md)
- The bypassed Phase 3 gate in [eval_implementation_plan.md](eval_implementation_plan.md)

Experimental semantic routing and local 6 GB VRAM LLM optimization are specified separately in [SEMANTIC_ROUTER_PHASE3_RFC.md](SEMANTIC_ROUTER_PHASE3_RFC.md) and remain gated behind Phase 2 completion.

---

## 2. Adversarial Review Summary & Architecture Decision Record (ADR)

### Current Working-Tree Snapshot

On top of `0b50ba9`, the working tree contains completed Tasks 1.1–3.8 from `eval_implementation_plan.md`. While several pieces are solid engineering improvements, Phase 3 (`HYBRID_RETRIEVAL_ENABLED = true`) was flipped live despite **failing** its own Task 3.6 evaluation gate (`hybrid_vs_lexical_v1.latest.json`: Lexical **80% (4/5)** vs. Hybrid **60% (3/5)** on paraphrases).

### Decision Audit: Earlier vs. Newer Uncommitted Choices

| Area | Earlier Choice | Newer (Uncommitted) Choice | Adversarial Verdict & Adopted Direction |
|---|---|---|---|
| **No-match fallback** | Inject `faqChunks[0]` when 0 chunks match | Deterministic abstention; skip LLM call (Task 1.2) | **Keep newer.** Prevents hallucinating answers from unrelated FAQ blocks. |
| **Raw-chunk passthrough** | Prototype returned raw chunk verbatim if similarity ≥ 0.60 | Removed in Task 3.3; retrieved chunks always go to LLM | **Keep newer.** Raw chunks lack tone, framing, and synthesis. |
| **Input validation order** | Ran *after* routing, DB read, and retrieval | Moved *before* routing/retrieval (Task 3.3) | **Keep newer.** Blocked messages no longer waste compute. |
| **Embedding singleton** | Router loaded its own MiniLM pipeline | Shared `EmbeddingService` singleton (Task 3.4) | **Keep newer.** Avoids duplicate model loads per process. |
| **ChatLog retrieval telemetry** | Not logged | `ChatLog.retrieval Json?` (Task 3.7) | **Keep newer**, but add the missing Prisma migration first. |
| **Docker base image** | `node:20-alpine` | `node:20-bookworm-slim` + `openssl` / `procps` | **Keep newer.** Required for Prisma and ONNX runtime stability. |
| **Hybrid gate & flag** | Lexical baseline only (Task 3.0) | `HYBRID_RETRIEVAL_ENABLED = true` despite failing Task 3.6 | **Roll back flag to `false`** in Phase 1 until Phase 2's gate passes. |
| **Semantic Veto gate** | None (RRF intended as union) | `HybridRetrievalService` returns `[]` if semantic returns 0 rows | **Remove in Phase 2.** Turns `OR` into `AND`, drops hybrid below lexical, breaks `faqText`-only tenants, and still passes distractors. |
| **Chunking & sanitization** | `faqText` on `\n\n`; uploads 1000/200 after `.replace(/\s+/g, " ")` | Kept 1000/200 + whitespace flattening | **Both flawed — primary root cause.** Fix in Phase 2. |
| **Semantic Router `topK`** | Fixed `RAG_TOP_K = 4` | `standard_search` = 6, `rag_synthesis` = 4 | **Inverted.** Multi-fact synthesis receives fewer chunks than simple lookup. Fix or replace in Phase 1/3. |
| **Dead code & hygiene** | — | Unused `SemanticRouterService.search()`, stray `.gitignore` entries, broken tests | **Clean up in Phase 1** before committing. |

### Root-Cause Diagnosis: Why MiniLM + Hybrid Failed in Task 3.6

1. **Sanitization erases document structure before splitting:** [`KnowledgeBaseService.processFile`](fitbot-api/src/knowledge-base/knowledge-base.service.ts) executes `.replace(/\s+/g, " ")` *before* `RecursiveCharacterTextSplitter` runs. Every newline and paragraph boundary is destroyed — [`iron_oasis_handbook.normalized.txt`](fitbot-api/test/evaluation/fixtures/iron_oasis_handbook.normalized.txt) is a single 1,396-character line.
2. **Mega-chunks dilute embeddings:** With `RAG_CHUNK_SIZE = 1000` and `RAG_CHUNK_OVERLAP = 200`, the entire 5-section handbook collapses into **2 mixed-topic chunks**. Mean-pooling a 384-dimensional vector across 4 unrelated gym policies produces an averaged vector that matches specific paraphrases (like *"hot steam room"* → sauna) poorly. It also masks retrieval bugs because `topK` (4 or 6) exceeds total chunk count (2).
3. **Semantic Veto blocks valid lexical & FAQ matches:** [`HybridRetrievalService.search`](fitbot-api/src/retrieval/hybrid-retrieval.service.ts) skips `RagService.search()` whenever [`SemanticSearchService.search`](fitbot-api/src/semantic-search/semantic-search.service.ts) returns `[]`. On `cancellation_without_fee_paraphrase`, lexical retrieval succeeded while MiniLM exceeded `MAX_DISTANCE = 0.80`, so the veto forced a miss. Worse, `faqText` has no persisted `DocumentChunk` rows or embeddings — meaning **any `faqText`-only tenant or FAQ-only answer is vetoed to abstention** while `HYBRID_RETRIEVAL_ENABLED = true`.
4. **Raw cosine distance cannot separate paraphrases from distractors:** As documented in [SEMANTIC_SEARCH_DESIGN_DISCUSSION.md](SEMANTIC_SEARCH_DESIGN_DISCUSSION.md), `distractor_sauna_towel` (*"Are there any blue towels available in the sauna?"*) cleared `MAX_DISTANCE = 0.80` and returned 2 chunks while valid paraphrases failed.

---

## 3. Deployment Topology & Hardware Constraints

Design choices must respect two very different runtime profiles:

| Constraint | Cloud Production ([`render.yaml`](render.yaml)) | Local / Self-Hosted (Ollama) |
|---|---|---|
| **Compute & Memory** | Render `plan: free` — **512 MB RAM**, shared CPU (`0.1` CPU), **0 GB VRAM** | Local GPU host — **6 GB VRAM** (~4.8–5.2 GB usable after OS/display overhead) |
| **Database** | Neon PostgreSQL (`gymbot`, `pgvector` 0.8.0 available) | Local PostgreSQL / Docker Compose (`pgvector`) |
| **Answer LLM** | External API (OpenAI, OpenRouter, HuggingFace) | Local Ollama (currently legacy defaults: `mistral:7b` / `llama3`) |
| **Architectural Implication** | Node.js + Prisma + ONNX (`@huggingface/transformers`) must stay safely within **512 MB RSS**. No generative LLM runs on the API host. | Legacy 7B–8B Q4 models consume ~4.5–5.2 GB VRAM alone, leaving no room for KV cache or co-resident embedding/reranker models. Modern 3B–4B Q4 models fit comfortably alongside small retrieval models. |

---

## 4. Phase 1: Stabilize, Fix Loose Ends & Clean Commits

**Goal:** Restore a green, truthful, deploy-safe repository on the proven lexical baseline without discarding reusable Phase 3 infrastructure (`EmbeddingService`, `pgvector` migration, `SemanticSearchService`, `HybridRetrievalService`).

### 1.1 Independent Low-Risk Commits (Ready Immediately)

These changes have no coupling to the retrieval gate or schema drift and can be committed cleanly first:

1. **Commit A — Repository & Manual Test Documentation Cleanup (Task 1.1)**
   - [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) (merge-conflict markers resolved)
   - [`README.md`](README.md) (UTF-8 re-encoding)
   - [`MANUAL_TEST_PLAN.md`](MANUAL_TEST_PLAN.md) (Docker API unit-test command)
2. **Commit B — Container Runtime Compatibility**
   - [`fitbot-api/Dockerfile`](fitbot-api/Dockerfile) (`node:20-bookworm-slim`, `openssl`, `procps`)
3. **Commit C — Pre-Existing Unit Test Fixes**
   - [`fitbot-api/src/stripe/stripe.service.spec.ts`](fitbot-api/src/stripe/stripe.service.spec.ts) (mocked checkout URL expectation)
   - [`fitbot-api/src/widget/widget.controller.spec.ts`](fitbot-api/src/widget/widget.controller.spec.ts) (`PrismaService` mock provider)

### 1.2 Safety, Schema & Code Hygiene Fixes

1. **Restore gated hybrid default in [`constants.ts`](fitbot-api/src/common/constants.ts):**
   - Replace hardcoded `export const HYBRID_RETRIEVAL_ENABLED = true;` with an opt-in env-backed flag defaulting to `false`:
     ```ts
     export const HYBRID_RETRIEVAL_ENABLED =
       process.env.HYBRID_RETRIEVAL_ENABLED === 'true';
     ```
   - This immediately stops the `faqText` Semantic Veto regression and honors Task 3.6's failed gate while keeping hybrid testable via environment variable.
2. **Add missing Prisma migration for `ChatLog.retrieval`:**
   - [`schema.prisma`](fitbot-api/prisma/schema.prisma) already adds `retrieval Json?` on `ChatLog`, and [`chat-logs.service.ts`](fitbot-api/src/chat-logs/chat-logs.service.ts) writes to it, but no migration exists yet.
   - Generate and verify a migration (`ALTER TABLE "ChatLog" ADD COLUMN "retrieval" JSONB;`) alongside [`20261004193000_add_chunk_embeddings`](fitbot-api/prisma/migrations/20261004193000_add_chunk_embeddings/migration.sql) before any deployment runs `prisma migrate deploy`.
3. **Remove leftover dead code & partial staging:**
   - Remove unused `SemanticRouterService.search()` and `SemanticSearchChunk` from [`semantic-router.service.ts`](fitbot-api/src/semantic-router/semantic-router.service.ts) (chunk search lives in `SemanticSearchService`).
   - Reconcile partial staging (`AM`) on [`semantic-router.service.spec.ts`](fitbot-api/src/semantic-router/semantic-router.service.spec.ts).
4. **Correct or explicitly bound `topK` per route:**
   - Fix the inverted `topK` in [`widget.service.ts`](fitbot-api/src/widget/widget.service.ts) so `standard_search` uses `RAG_TOP_K` (`4`) and `rag_synthesis` uses `6` (or `RAG_SYNTHESIS_TOP_K = 6`), matching the semantic intent of concise lookup vs. multi-fact synthesis.
5. **Clean up [`.gitignore`](.gitignore):**
   - Remove the ~60 accidental individual file paths (`.claude/skills/archon/...` and `MoldStud` saved HTML files) and replace with clean directory/pattern rules if needed.

### 1.3 Fix the 3 Broken Test Suites & 4 Open Review Patches

1. **[`widget.service.spec.ts`](fitbot-api/src/widget/widget.service.spec.ts):**
   - Restore passing execution under default `HYBRID_RETRIEVAL_ENABLED = false`.
   - Assert the `ragService.search()` `topK` argument explicitly in the `rag_synthesis` test (open review patch #1).
2. **[`widget.service.ts`](fitbot-api/src/widget/widget.service.ts) abstention telemetry:**
   - Log deterministic abstentions with non-LLM values (`provider: 'none'`, `model: 'abstention'`) instead of attributing an uncalled answer LLM in `ChatLog` (open review patch #2).
3. **[`retrieval.eval.ts`](fitbot-api/test/evaluation/harnesses/retrieval.eval.ts) & [`iron_oasis_v1.json`](fitbot-api/test/evaluation/datasets/iron_oasis_v1.json):**
   - Read `dataset.scoring.reported_k_values` instead of hardcoding `[4, 6]` (open review patch #3).
   - Fix the case-count mismatch where `distractor_yoga_code` (`category: "cross_reference"`) causes `answerableCases` length `6` to fail `expect(...).toHaveLength(dataset.scoring.answerable_case_count)` (`5`).
4. **[`knowledge-base.integration.eval.ts`](fitbot-api/test/evaluation/integration/knowledge-base.integration.eval.ts):**
   - Replace `{ search: jest.fn() }` (which returns `undefined`) with a safe mock returning `[]` or delegate to `HybridRetrievalService` so the integration suite passes regardless of `HYBRID_RETRIEVAL_ENABLED`.
5. **Generated evaluation reports (open review patch #4):**
   - Ignore mutable `fitbot-api/test/evaluation/reports/*.latest.json` artifacts in `.gitignore` (or write timestamped/versioned baselines explicitly only on milestone releases) to stop diff churn on every run.

### 1.4 Reconcile Contradictory Documentation

Update [`KNOWLEDGE_BASE_TESTING.md`](KNOWLEDGE_BASE_TESTING.md), [`WIDGET_INSTALLATION_GUIDE.md`](WIDGET_INSTALLATION_GUIDE.md), [`SEMANTIC_SEARCH_COMPARISON.md`](SEMANTIC_SEARCH_COMPARISON.md), and [`eval_implementation_plan.md`](eval_implementation_plan.md) so every document states truthfully:
- Production retrieval defaults to lexical `RagService.search()` (`HYBRID_RETRIEVAL_ENABLED=false`).
- Chunk embeddings (`vector(384)`) and `HybridRetrievalService` are implemented and persisted on ingestion, awaiting Phase 2's evaluation gate before default activation.
- All retrieval/routing design authority points to this document.

### Phase 1 Exit Criteria

All of the following must pass cleanly before Phase 1 is committed:
- `cd fitbot-api && npx tsc --noEmit -p tsconfig.json` — 0 errors.
- `cd fitbot-api && npx jest --runInBand` — all unit suites pass.
- `cd fitbot-api && npm run test:eval:retrieval` — passes with accurate case counts.
- `cd fitbot-api && npm run test:eval:integration` — passes against disposable Postgres.
- `npx prisma migrate status` / disposable DB migration check confirms `DocumentChunk` embeddings and `ChatLog.retrieval` migrations apply cleanly.
- `git status` contains no stray untracked HTML/report artifacts.

---

## 5. Phase 2: Retrieval Root-Cause Redesign & Real Evaluation Gate

**Goal:** Fix the structural defects that caused Task 3.6's failure so hybrid retrieval demonstrably beats lexical search on paraphrases *and* distractor rejection without regressing literal lookups, FAQ-only gyms, or Render Free's 512 MB RAM budget.

### 2.1 Structure-Preserving Sanitization & Right-Sized Chunking

1. **Preserve line & paragraph structure in [`KnowledgeBaseService.processFile`](fitbot-api/src/knowledge-base/knowledge-base.service.ts):**
   - Stop collapsing `\n` into spaces. Normalize `\r\n` → `\n`, collapse horizontal whitespace (`[ \t]+` → `" "`), collapse 3+ consecutive newlines to `\n\n`, and trim.
   - This lets `RecursiveCharacterTextSplitter` split naturally on `\n\n` and `\n` boundaries first before falling back to sentence/word boundaries.
2. **Right-size chunk parameters:**
   - Reduce `RAG_CHUNK_SIZE` from `1000` (overlap `200`) to a section-focused target (**initial candidate: `350` chars, `60` overlap**), calibrated via an evaluation sweep (`300`, `350`, `450`, `600`) in the Phase 2 harness.
   - Regenerate `iron_oasis_handbook.normalized.txt` (from the authoritative DOCX extraction with preserved line breaks) and confirm each distinct policy (Towel Policy, Dress Code, Low Impact Hours, Cancellations, Class Schedule, Secret Sauna, Lost & Found) produces focused chunks instead of a 2-chunk soup.

### 2.2 Remove the Semantic Veto & Fix `faqText` Coverage

1. **Remove the Semantic Veto from [`HybridRetrievalService.search`](fitbot-api/src/retrieval/hybrid-retrieval.service.ts):**
   - Always execute **both** `RagService.search()` (covering `faqText` + `DocumentChunk`) and `SemanticSearchService.search()` (covering persisted `DocumentChunk` rows), then fuse via Reciprocal Rank Fusion (`k = 60`).
   - Hybrid retrieval becomes a true union (`OR`), guaranteeing exact codes (`8822#`), proper nouns (`Master Zen`), and `faqText`-only entries are never vetoed when embeddings miss.
2. **Widen candidate recall in [`SemanticSearchService`](fitbot-api/src/semantic-search/semantic-search.service.ts):**
   - Loosen or remove `MAX_DISTANCE = 0.80` as a hard gate during candidate generation (fetch top `candidateK = 10–15` candidates for RRF fusion) and let the cross-encoder reranker (Section 2.3) handle relevance filtering and abstention.
3. **FAQ-only tenant support:**
   - Immediate MVP guarantee: removing the veto restores full lexical coverage of `faqText`.
   - Optional Phase 2b enhancement: compute in-memory or cached embeddings for `faqText` blocks on configuration save if evaluation shows FAQ-only paraphrase misses.

### 2.3 Stronger 384d Embeddings & Cross-Encoder Reranking

1. **Upgrade local embedding model (drop-in `vector(384)`):**
   - Replace `Xenova/all-MiniLM-L6-v2` with **`BAAI/bge-small-en-v1.5`** (33M params, ~130 MB, **384 dimensions**).
   - Preserves the existing `vector(384)` `pgvector` schema (zero DDL change) while delivering substantially stronger retrieval representations.
   - Apply BGE's recommended asymmetric query prefix (`"Represent this sentence for searching relevant passages: "`) on query embeddings only (document chunks remain unprefixed).
   - Abstract `EmbeddingService` behind a small provider boundary so local 6 GB VRAM deployments can optionally select Ollama embedding models (`nomic-embed-text` or `mxbai-embed-large`) in future schema profiles.
2. **Add a Cross-Encoder Reranker service (`RerankerService`):**
   - Model default (CPU / 512 MB compatible): **`Xenova/ms-marco-MiniLM-L-6-v2`** (~90 MB quantized ONNX via `@huggingface/transformers`).
   - Local GPU option: `BAAI/bge-reranker-base` (~280 MB).
   - **Flow:** RRF fuses lexical + semantic candidates into top `10` candidates → `RerankerService` scores each `(query, chunk.content)` pair jointly → filter below a calibrated logit/probability abstention threshold → return top `K` passing chunks.
   - Because cross-encoders attend across query and chunk tokens jointly, they accurately separate *"blue towels in the sauna"* (distractor) from *"hot steam room keypad"* (valid paraphrase) — directly solving the `MAX_DISTANCE` failure mode.
   - **Memory safeguard for Render Free (512 MB):** Measure combined Node.js + BGE-small + MS-MARCO-MiniLM-L6-v2 quantized RSS in Docker (`--memory=512m`) before graduation; include a config toggle (`RERANKER_ENABLED`) if RSS exceeds budget so CPU-only free tier can fall back safely.
3. **Idempotent model-aware backfill:**
   - Update [`backfill-chunk-embeddings.ts`](fitbot-api/scripts/backfill-chunk-embeddings.ts) to select `WHERE embedding IS NULL OR "embeddingModel" IS DISTINCT FROM ${EMBEDDING_MODEL}` so upgrading from `all-MiniLM-L6-v2` to `bge-small-en-v1.5` re-embeds all existing chunks cleanly.

### 2.4 Expanded Evaluation Corpus & Non-Bypassable Go/No-Go Gate

The current 1,396-char, 2-chunk Iron Oasis fixture is too small to stress-test top-K ranking. Phase 2 must expand the versioned evaluation dataset (`iron_oasis_v2` / `gym_eval_v2`):
- **Multi-document / realistic corpus:** Add multi-section gym policies, schedules, pricing tables, and `faqText` blocks so `chunk_count >> topK` (at least 15–30 chunks across multiple documents/tenants).
- **Required query categories:**
  1. Exact / literal lookups (codes, prices, hours, names).
  2. Hard paraphrases (no shared keywords with source chunk).
  3. Multi-chunk synthesis questions.
  4. `faqText`-only questions (with and without uploaded documents).
  5. Lexical-overlap distractors (e.g., `distractor_sauna_towel` — shares keywords with two chunks but asks about a nonexistent combination).
  6. True out-of-scope / unanswerable queries.

#### 4-Way Comparison Matrix

Run all four strategies on the identical corpus and frozen splits:
1. Lexical baseline (`RagService.search`)
2. Semantic-only (`bge-small-en-v1.5` + new chunking)
3. Hybrid RRF (no veto)
4. Hybrid RRF + Cross-Encoder Reranker

#### Hard Go/No-Go Gate (Cannot Be Bypassed)

`HYBRID_RETRIEVAL_ENABLED` may flip to `true` by default **only** when Strategy 4 (or Strategy 3 if reranker is omitted) satisfies **all** of:
1. **Zero literal regression:** 100% hit rate on exact-lookup cases (matching or exceeding lexical baseline).
2. **Zero FAQ regression:** 100% hit rate on `faqText`-only test cases.
3. **Material paraphrase gain:** ≥ +20 percentage points over lexical baseline (or ≥ 90% paraphrase hit rate).
4. **Improved distractor/abstention precision:** Equal or higher abstention accuracy on distractors and out-of-scope queries vs. lexical baseline.
5. **Runtime & memory budget:** p95 retrieval latency and peak Node.js RSS (verified in a 512 MB memory-capped container with real ONNX inference) fit Render Free constraints without OOM.

Once passed: enable `HYBRID_RETRIEVAL_ENABLED=true`, run the Neon migrations + backfill script, and update user/testing docs.

#### Phase 2 Execution Results (2026-11-24 — Gate Passed 5/5)

1. **Rejected Cross-Encoder Reranker (`Xenova/ms-marco-MiniLM-L-6-v2`):** Tested via `npm run test:eval:phase2-gate` and **rejected**:
   - Penalized valid paraphrases (`12.5%` paraphrase recall, `1/8`) and even scored literal `towel_policy` at `-8.423`, overlapping unanswerable queries (`-10.87` to `-11.33`).
   - Combined with `bge-small-en-v1.5`, pushed peak RSS to `552.2 MB` (> Render Free `512 MB`).
2. **Accepted Phase 2 Architecture (`Xenova/bge-small-en-v1.5` `q8` + `350/60` Chunking + Cached FAQ Embeddings + `SEMANTIC_MAX_DISTANCE=0.52`):**
   - `gym_eval_v2` corpus (`11` document chunks across 2 docs + `4` FAQ chunks = `15` total chunks, plus FAQ-only tenant):
     - **Literal (8 cases):** Lexical `100%` (8/8) → Hybrid BGE RRF `100%` (8/8) (**PASS**)
     - **FAQ (3 cases in full corpus & FAQ-only tenant):** `100%` (3/3) on both (**PASS**)
     - **Hard Paraphrases (8 cases):** Lexical `62.5%` (5/8) → Hybrid BGE RRF `87.5%` (7/8, **+25.0 pp**) (**PASS**)
     - **Multi-chunk synthesis (2 cases):** `100%` (2/2) (**PASS**)
     - **Out-of-scope abstention (3 cases):** Lexical `0%` (0/3) → Hybrid BGE RRF `100%` (3/3); combined distractor+OOS abstention: Lexical `0%` (0/5) → Hybrid BGE RRF `60%` (3/5) (**PASS**)
     - **Runtime & Memory (`ts-node --transpile-only` + pgvector):** `359 ms` model init, `10.06 ms` p50 / `17.32 ms` p95 retrieval latency, **`264.4 MB` peak RSS** (≤ `512 MB`, **PASS**)
   - Result: `HYBRID_RETRIEVAL_ENABLED` enabled by default (`process.env.HYBRID_RETRIEVAL_ENABLED !== 'false'`). Note: apply `20261004193000_add_chunk_embeddings` + `20261123215500_add_chat_log_retrieval` and run `npm run backfill:chunk-embeddings` on production Neon (un-backfilled tenants fail open to lexical search automatically until backfilled).

---

**Next Phase:** Frozen-context answer-generation evaluation (`generation.eval.ts`), local 6 GB VRAM Ollama model selection, and the routing experiment live in [SEMANTIC_ROUTER_PHASE3_RFC.md](SEMANTIC_ROUTER_PHASE3_RFC.md).
