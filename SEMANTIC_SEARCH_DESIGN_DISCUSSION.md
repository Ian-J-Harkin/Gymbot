# Semantic Document Search: Design Discussion

**Status:** Discussion draft; no implementation or product decision is approved by this document.

**Terminology:** This document assumes “MPV” meant “MVP” (minimum viable product).

## Executive Recommendation

Keep the current keyword-based retrieval and configured answer LLM as the baseline MVP. The repository does not yet provide evidence that semantic retrieval or a different answer model is required for users. First create a small, repeatable retrieval-and-answer evaluation set and compare the current baseline against a semantic/hybrid candidate.

If that evaluation shows meaningful paraphrase-retrieval failures, a narrowly scoped **hybrid retrieval MVP** is reasonable: embed document chunks and questions, combine vector candidates with exact keyword matches, and keep the existing answer LLM unchanged. Do not bundle an answer-model upgrade or LLM-based query rewriting/reranking into that release. They address different failure modes and would make results harder to attribute.

The existing keyword + LLM flow is already an MVP for small, fact-oriented gym knowledge bases. A hybrid semantic document search is now implemented, merging both semantic retrieval and lexical retrieval methods.

## Current System

- **File ingestion:** The API extracts text from PDF, DOCX, and TXT, sanitizes it, splits it into chunks (currently 1,000 characters with 200-character overlap), and stores the source document and chunk text. There is no document embedding or OCR pipeline in this path. See [knowledge-base.service.ts](fitbot-api/src/knowledge-base/knowledge-base.service.ts) and [schema.prisma](fitbot-api/prisma/schema.prisma).
- **Retrieval:** Each chat loads all chunks belonging to the gym configuration, ranks them by term frequency and exact-phrase overlap, filters out zero-score chunks, and passes a limited number to the answer model. The current limit is 6 for `standard_search` and 4 for `rag_synthesis`. The database read and scoring work grow with the number of chunks, although only selected chunks are added to the LLM context. See [rag.service.ts](fitbot-api/src/rag/rag.service.ts), [widget.service.ts](fitbot-api/src/widget/widget.service.ts), and [constants.ts](fitbot-api/src/common/constants.ts).
- **Semantic routing:** The local `Xenova/all-MiniLM-L6-v2` model embeds the question and compares it with fixed route-anchor vectors. This chooses the answer style; it does not search document vectors. If model initialization fails, the router falls back to `standard_search`. See [semantic-router.service.ts](fitbot-api/src/semantic-router/semantic-router.service.ts).
- **Answer generation:** The configured provider (OpenAI, OpenRouter, or Ollama) receives the selected excerpts, chat history, and route-specific instructions. It does not receive or independently index the full uploaded files.
- **Persistence/deployment:** Local Compose uses PostgreSQL 15. Production receives externally configured database URLs through Render; the deployment configuration does not establish that the production database has `pgvector` enabled. See [docker-compose.react-test.yml](docker-compose.react-test.yml), [render.yaml](render.yaml), and [schema.prisma](fitbot-api/prisma/schema.prisma).

## Existing Product Decisions

The [explanation-layer plan](EXPLANATION_LAYER_PLAN.md) explicitly chose keyword “RAG-Lite” for the MVP, citing small FAQ sets, latency/cost, and infrastructure simplicity. It defers pgvector to a later phase. The [implementation plan](IMPLEMENTATION_PLAN.md) also lists vector search as post-MVP work and calls for evaluation. This proposal should be treated as a revisit of those decisions, not evidence that they were already reversed.

The implementation plan currently contains unresolved merge-conflict markers near its opening. Treat its entries as historical context, not as a reliable approval record, until that document is reconciled.

Some original reasoning needs revalidation. In particular, the prior estimate assumes an external embedding API call; the current router already runs a local embedding model, although its startup, memory, and per-query CPU costs still need measurement. File uploads also change the scale and document-shape assumptions compared with fewer than 100 FAQ pairs.

## Options

| Option | What changes | Benefits | Costs and limitations | MVP assessment |
|---|---|---|---|---|
| Keep and measure keyword RAG | Preserve ingestion, lexical ranking, and answer LLM; add a representative evaluation set and baseline metrics. | Lowest risk; isolates whether there is a user-visible retrieval problem. | Paraphrases and vocabulary mismatch can still produce no useful chunk; current all-chunk reads and scoring scale linearly. | **Recommended now.** This is a valid MVP while it meets user needs. |
| Semantic-only retrieval | Embed chunks and questions; rank by vector similarity. | Finds related wording without shared keywords. | Can miss exact identifiers and values; requires model/version management, persisted vectors, backfill, and database support. | Not recommended as the first production change. |
| Hybrid retrieval | Retrieve lexical and vector candidates, merge/rerank them, then pass selected chunks to the existing LLM. | Balances paraphrase matching with exact gym facts. | More indexing, query, test, and operational complexity than the baseline. Scores need calibrated fusion. | **Candidate semantic-search MVP** only if evaluation demonstrates improvement. |
| Upgrade the answer LLM | Keep retrieval fixed and use a different answer model/provider. | May improve synthesis, instruction following, or refusal behavior when the right evidence is present. | Does not fix missed evidence; can increase cost/latency and change answer behavior. | Defer unless answer-quality evaluation isolates this as the bottleneck. |
| LLM-assisted query rewrite/reranking | Ask an LLM to expand/rewrite queries or rerank retrieved chunks. | May help complex or ambiguous questions after basic retrieval is sound. | Added model call, cost, latency, nondeterminism, and risk of rewriting prices/codes/names incorrectly. | Not part of the initial MVP. Evaluate only if hybrid retrieval remains inadequate. |

## Candidate Semantic-Search MVP

If the evaluation supports moving forward, keep the existing answer model and add the smallest retrieval change that can be measured:

1. Reuse the local MiniLM model as the first embedding candidate for both stored chunks and incoming queries. Validate retrieval quality on the gym corpus before committing to that model; route-classification quality does not establish document-retrieval quality.
2. Persist an embedding for each chunk and record the embedding model/version. Make ingestion idempotent and provide a backfill/reindex path for existing chunks. Keep the original text and source metadata as the authoritative answer context.
3. Prototype PostgreSQL `pgvector` before selecting it for production. Use a vector query scoped to the configuration/tenant in the database. Local PostgreSQL 15 is available, but the Render production database and its extension support are not specified here. Confirm both before choosing schema or migration details. Avoid adding a separate vector database for the first MVP unless this check rules out the existing database.
4. Use hybrid candidate retrieval: retain exact-term/phrase matching, add vector candidates, deduplicate, and combine rankings with a method such as reciprocal-rank fusion. Do not add raw keyword and cosine scores without calibration.
5. Preserve tenant isolation, document deletion semantics, source citations, and a lexical fallback. Define a no-match policy explicitly; the current fallback to the first FAQ chunk can provide unrelated context when no chunk matches.
6. Keep retrieval behind a small service boundary so lexical, hybrid, and future retrieval strategies can be compared without coupling them to answer-model selection.

An exact vector scan may be adequate for a small evaluation corpus; an approximate index should be justified by measured scale/latency rather than added preemptively. The decision between vector-column storage and a separate embedding table, and the exact index type, should follow the production database compatibility check and a prototype migration.

## Known Limitations: Distance Thresholding

During the evaluation of the hybrid retrieval MVP, it was discovered that using a raw cosine distance threshold (e.g., `MAX_DISTANCE`) with the `MiniLM` embeddings is insufficient as a standalone gatekeeper. 

Valid queries (especially paraphrased ones) often have higher distances than some tricky distractors or out-of-scope queries. As a result, there is no clean cutoff that accepts all valid queries while rejecting all distractors. 

For now, this feature is marked as completed with this known flaw. 

**Future Enhancements to Consider:**
1. **LLM-Based Filtering:** Pass a larger number of candidate chunks to the LLM and rely on the LLM's prompt/abstention capabilities to act as the final filter, deciding if the chunk actually contains the answer.
2. **Secondary Reranking Step:** Implement a dedicated reranker (e.g., a cross-encoder) after the initial retrieval to more accurately score semantic relevance before applying a threshold.

## Evaluation Before Implementation

Build a versioned set of representative gym questions with expected source chunks and answer facts. Include:

- Literal lookups: prices, hours, codes, names, dates, and membership rules.
- Paraphrases that do not reuse the document’s wording.
- Questions requiring more than one chunk.
- Ambiguous and unanswerable questions.
- Extraction edge cases, including tables, punctuation, and scanned PDFs (to determine whether OCR is a separate requirement).

For each query, compare the current lexical baseline and candidate retrieval using the same documents, prompt, and answer model. Record:

- Retrieval `Recall@k`/hit rate and reciprocal rank against labeled relevant chunks.
- Exact-fact retrieval and answer correctness/groundedness, with human review for the initial small set.
- No-answer behavior and whether unrelated chunks are supplied as context.
- Retrieval and end-to-end latency (including model warm-up separately), model load/memory cost, and embedding failures.
- Tenant isolation and behavior after document deletion or reindexing.

Proposed decision gates, to be agreed before implementation:

- Semantic/hybrid retrieval shows a material improvement on paraphrase queries over the keyword baseline.
- Exact lookups do not regress, especially for prices, dates, class names, and access codes.
- Answer groundedness and no-answer behavior are at least as good as the baseline.
- Added p95 latency, memory use, and deployment requirements fit an explicit product budget on the target deployment platform.
- Existing chunks can be backfilled safely, and the production database supports the selected vector strategy.

If these gates are not met, keep keyword retrieval and improve chunking, extraction, ranking, or evaluation instead. If the correct evidence is retrieved but the answer remains poor, run a separate answer-model comparison with identical contexts; that is the point at which an LLM upgrade is justified.

## What Is and Is Not an MVP

**MVP today:** Hybrid retrieval combining semantic search (MiniLM embeddings) with lexical search.

**Evaluation MVP:** a curated retrieval/answer test set and a baseline report. This is the recommended immediate step because the current tests primarily check wiring and mocked behavior, not retrieval quality. The semantic-router unit tests mock the model and route anchors; they do not establish semantic search effectiveness.

**Potential semantic-search MVP:** per-chunk embeddings, persistent vector retrieval, hybrid ranking, safe backfill, tenant-scoped retrieval, citations, lexical fallback, and measured acceptance gates. It is not just switching on the existing semantic router.

**Not an MVP without evidence:** changing the answer model at the same time, LLM query rewriting/reranking, a new standalone vector service, model fine-tuning, or a large-scale indexing platform.

## Documentation and Decision Gaps

- [KNOWLEDGE_BASE_TESTING.md](KNOWLEDGE_BASE_TESTING.md) describes five manual handbook questions but has no labeled retrieval metrics. It also says the `rag_synthesis` top-K is 3; current code sets `RAG_TOP_K` to 4. Correct this before treating the guide as a baseline.
- The same guide claims semantic routing classifies in under 5 ms, but the reviewed router tests mock inference and do not benchmark latency. Measure cold-start/model-load and warmed query latency separately before using that figure.
- Confirm real document counts, chunk counts, common user query patterns, and examples of missed answers. The repository does not provide production query-quality evidence to justify a vector or LLM upgrade on its own.
- Confirm the production database provider/plan and `pgvector` extension support before selecting a migration path.

## Decision Requested

1. Approve or revise the recommendation to build the evaluation set before changing retrieval.
2. Define what constitutes a material retrieval improvement and acceptable p95 latency/cost for the target deployment.
3. If the evaluation passes, approve a hybrid-retrieval MVP using PostgreSQL only after production `pgvector` compatibility is verified.
4. Evaluate an answer-model upgrade separately, only if answers fail with the correct evidence already in context.