# Semantic Search and Document Retrieval

> **Authoritative Spec:** See [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md) (Phases 1–2) and [SEMANTIC_ROUTER_PHASE3_RFC.md](SEMANTIC_ROUTER_PHASE3_RFC.md) (Experimental Phase 3).

## Short Version

Document chunk embeddings (`pgvector` `vector(384)` using `Xenova/bge-small-en-v1.5`) and `HybridRetrievalService` are **live by default** (`HYBRID_RETRIEVAL_ENABLED !== 'false'`) after passing all 5 Phase 2 evaluation gate criteria. `SemanticRouterService` classifies query intent only (`standard_search` vs. `rag_synthesis`).

## Current Flow

- **Ingestion:** The backend extracts text from PDF, DOCX, or TXT files, sanitizes it while preserving line/paragraph breaks (`sanitizeDocumentText`), splits it into `350`-character chunks (`60`-character overlap), stores the chunk text, and computes/persists `vector(384)` `Xenova/bge-small-en-v1.5` embeddings on `DocumentChunk` (gracefully skipping if embedding fails). It does not have an LLM read and index the files. See [knowledge-base.service.ts](fitbot-api/src/knowledge-base/knowledge-base.service.ts) and the [Prisma schema](fitbot-api/prisma/schema.prisma).
- **Retrieval (Default — Phase 2):** [hybrid-retrieval.service.ts](fitbot-api/src/retrieval/hybrid-retrieval.service.ts) runs both lexical matching (`RagService.search` over `faqText` + `DocumentChunk`) and semantic vector search (`pgvector` over `DocumentChunk` + cached in-memory embeddings for `faqText`, gated by `SEMANTIC_MAX_DISTANCE=0.52`), fuses both lists with reciprocal rank fusion (`k=60`), and selects up to 4 chunks (`RAG_TOP_K`) for `standard_search` or 6 (`RAG_SYNTHESIS_TOP_K`) for `rag_synthesis`. Un-backfilled tenants and failed embedding loads fail open to lexical search (`HYBRID_RETRIEVAL_ENABLED=false` opt-out also remains available).
- **Semantic routing:** `Xenova/bge-small-en-v1.5` embeds the question and compares it with fixed route-anchor embeddings to choose between concise `standard_search` and detailed `rag_synthesis` prompting. See [semantic-router.service.ts](fitbot-api/src/semantic-router/semantic-router.service.ts).
- **LLM answering:** The selected text excerpts are passed to the configured answer model. The LLM sees retrieved chunks, not the full uploaded files. When zero chunks match, the API deterministically abstains without calling the answer model.

## Why Phase 2 Uses `bge-small-en-v1.5` + Distance Gate (Without a Cross-Encoder Reranker)

Phase 2 tested `Xenova/ms-marco-MiniLM-L-6-v2` alongside `Xenova/bge-small-en-v1.5` and rejected the cross-encoder because it penalized valid paraphrases (`12.5%` paraphrase recall) and pushed peak RSS to `552.2 MB` (> Render Free's `512 MB` limit). Switching to `bge-small-en-v1.5` with `350/60` structure-preserving chunks, cached FAQ embeddings, and `SEMANTIC_MAX_DISTANCE=0.52` achieved `100%` literal (8/8), `100%` FAQ (3/3), `87.5%` paraphrase (7/8), `100%` out-of-scope abstention (3/3), and `264.4 MB` peak RSS. See [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md).