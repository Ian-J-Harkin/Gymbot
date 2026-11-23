# Semantic Search and Document Retrieval

> **Authoritative Spec:** See [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md) (Phases 1–2) and [SEMANTIC_ROUTER_PHASE3_RFC.md](SEMANTIC_ROUTER_PHASE3_RFC.md) (Experimental Phase 3).

## Short Version

Document chunk embeddings (`pgvector` `vector(384)`) and `HybridRetrievalService` are implemented in the codebase, but **production retrieval currently defaults to keyword-based search (`HYBRID_RETRIEVAL_ENABLED=false`)** while the Phase 2 chunking/reranker redesign and evaluation gate are pending. `SemanticRouterService` classifies query intent only (`standard_search` vs. `rag_synthesis`).

## Current Flow

- **Ingestion:** The backend extracts text from PDF, DOCX, or TXT files, sanitizes it, splits it into overlapping chunks, stores the chunk text, and computes/persists `vector(384)` MiniLM embeddings on `DocumentChunk` (gracefully skipping if embedding fails). It does not have an LLM read and index the files. See [knowledge-base.service.ts](fitbot-api/src/knowledge-base/knowledge-base.service.ts) and the [Prisma schema](fitbot-api/prisma/schema.prisma).
- **Retrieval (Default — Phase 1):** For each chat when `HYBRID_RETRIEVAL_ENABLED` is `false` (default), the app loads that configuration's FAQ and document chunks and ranks them by lexical term/phrase matching (`RagService.search`), selecting up to 4 chunks (`RAG_TOP_K`) for `standard_search` or 6 (`RAG_SYNTHESIS_TOP_K`) for `rag_synthesis`.
- **Retrieval (Opt-In — Gated Behind Phase 2):** When `HYBRID_RETRIEVAL_ENABLED=true`, [hybrid-retrieval.service.ts](fitbot-api/src/retrieval/hybrid-retrieval.service.ts) combines lexical matches and [semantic-search.service.ts](fitbot-api/src/semantic-search/semantic-search.service.ts) `pgvector` matches using reciprocal rank fusion (`k=60`). This path remains disabled by default until Phase 2 resolves chunking, the Semantic Veto, and the paraphrase evaluation gate.
- **Semantic routing:** MiniLM embeds the question and compares it with fixed route-anchor embeddings to choose between concise `standard_search` and detailed `rag_synthesis` prompting. See [semantic-router.service.ts](fitbot-api/src/semantic-router/semantic-router.service.ts).
- **LLM answering:** The selected text excerpts are passed to the configured answer model. The LLM sees retrieved chunks, not the full uploaded files. When zero chunks match, the API deterministically abstains without calling the answer model.

## Why Hybrid Retrieval Is Gated Off Until Phase 2

In the Task 3.6 evaluation, the initial hybrid retriever scored `60% (3/5)` on paraphrases vs. `80% (4/5)` for lexical search because whitespace-flattened 1,000-character chunks diluted MiniLM embeddings and the Semantic Veto blocked valid lexical matches. Phase 2 in [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md) addresses these root causes before re-evaluating hybrid activation.