# Knowledge Base Manual Testing Plan

This document outlines the steps for manually verifying the core functionality of the Knowledge Base (RAG) feature.

For proposed retrieval and answer-model upgrades, see [Evaluation_upgrade.md](Evaluation_upgrade.md). The ingestion, retrieval, deletion, and handbook-question scenarios below are the starting cases for that evaluation; they need expected source passages and repeatable scoring before they can be treated as a retrieval benchmark.

## 1. Environment Verification
- **API**: Running on `http://localhost:3000`
- **Admin UI**: Running on `http://localhost:3001`
- **WordPress/Widget**: Running on `http://localhost:8000`
- **User**: `ijharkin@gmail.com`

## 2. Test Cases

### Test Case 1: PDF Ingestion & Chunking
- **Action**: In the Admin Dashboard -> Knowledge Base, upload a PDF file (e.g., gym rules or schedules).
- **Verification**:
    - [ ] Success message appears: "Uploaded and indexed successfully".
    - [ ] New row appears in the document table.
    - [ ] "Knowledge Chunks" column shows a non-zero count.

### Test Case 2: Multi-Format Support (.docx, .txt)
- **Action**: Upload a `.docx` file and a `.txt` file with different fitness-related content.
- **Verification**:
    - [ ] Both files are processed without error.
    - [ ] Both files appear in the table with correct chunk counts.

### Test Case 3: RAG Retrieval (AI Answer)
- **Action**: Open the Widget on the WordPress site. Ask a specific question found only in one of the uploaded documents.
- **Verification**:
    - [ ] AI provides a correct answer derived from the document.
    - [ ] (Optional) Toggle "Why did I say this?" to verify the source and context used.

### Test Case 3a: No Relevant Evidence (Deterministic Abstention)
- **Action**: Keep at least one FAQ/document chunk that is unrelated to the question, then ask about information absent from the entire Knowledge Base.
- **Verification**:
    - [ ] The widget responds: "I could not find relevant information in the knowledge base to answer your question."
    - [ ] No unrelated FAQ/document content is presented as evidence.
    - [ ] The API does not call the configured answer provider for this request.

### Test Case 4: Knowledge Purge (Deletion)
- **Action**: In the Admin Dashboard, delete one of the uploaded documents using the trash icon.
- **Verification**:
    - [ ] Document is removed from the list.
    - [ ] Ask the same question in the widget again.
    - [ ] AI should no longer be able to answer specifically about that document (unless the information exists elsewhere).

### Test Case 5: Conflict Handling
- **Action**: Attempt to upload a file type that is not supported (e.g., an image or .zip).
- **Verification**:
    - [ ] UI shows an error message: "Invalid file type".

## 3. Iron Oasis Handbook Test Suite

This suite uses the checked-in Iron Oasis handbook DOCX to verify Knowledge Base retrieval. The bundled PDF currently produces only whitespace through the production parser, so use the DOCX fixture for these cases; OCR and PDF extraction diagnosis are outside this evaluation v1.

### Setup: Upload the DOCX Fixture
1. Select `tests/iron_oasis_handbook.docx` from the repository.
2. Upload it in the **Knowledge Base** tab.
3. Confirm the uploaded filename is `iron_oasis_handbook.docx` and that the document has indexed chunks.

### Verification Challenges
Ask the Bot these specific questions to verify it is reading the document accurately:

| Question | Expected Knowledge Point |
| :--- | :--- |
| **"What happens if I forget my sweat towel?"** | Should mention you can't work out OR you can rent a blue towel for $2. |
| **"What is the code for the secret sauna?"** | Should provide the keypad code `8822#`. |
| **"When are the low impact hours?"** | Should mention `2:00 PM to 4:00 PM` daily. |
| **"Who teaches Midnight Yoga?"** | Should identify **Master Zen**. |
| **"How do I cancel without a fee?"** | Should mention the `29-day` notice period and the `15-mile` relocation waiver. |

### Offline Retrieval Evaluation

From `fitbot-api`, run `npm run test:eval:retrieval`. This uses the versioned Iron Oasis dataset and frozen normalized DOCX text, applies the production chunk splitter, and calls the lexical `RagService.search()` directly. It does not connect to PostgreSQL or exercise tenant isolation, document deletion, semantic routing, or answer generation.

The generated report is `fitbot-api/test/evaluation/reports/iron_oasis_v1.latest.json`. It includes evidence hits at K=4 and K=6, hits at each case's target K, and the separately scored unanswerable query. Production enables hybrid retrieval by default (`HYBRID_RETRIEVAL_ENABLED !== 'false'`) after passing all 5 Phase 2 evaluation gate criteria in [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md); use `npm run test:eval:phase2-gate` to re-run the multi-document + FAQ hybrid gate against disposable PostgreSQL. This small Iron Oasis smoke baseline is not evidence of broad retrieval quality; database-backed tenant-isolation and deletion tests remain separate.

### Database-Backed Isolation and Deletion Regression

From `fitbot-api`, run `npm run test:eval:integration`. The command starts a disposable PostgreSQL container on port `55432`, applies the Prisma migrations, runs the isolated integration suite, and removes the container and volume afterward. It verifies that two configuration-scoped tenants cannot retrieve one another's chunks using multiple query formulations, and that `deleteDocument` removes both the document and its chunks from subsequent widget retrieval. It uses no production database, AI provider, HTTP server, or embedding model.

### Phase 2 Retrieval Decision

Production enables `HybridRetrievalService` by default (`Xenova/bge-small-en-v1.5`, newline-preserving `350/60` chunking, cached FAQ embeddings, and `SEMANTIC_MAX_DISTANCE=0.52` without a Semantic Veto). On the expanded `gym_eval_v2` gate, hybrid retrieval achieved `100%` (8/8) on literals, `100%` (3/3) on FAQ-only queries, `87.5%` (7/8) on hard paraphrases (+25pp over lexical's `62.5%`), `100%` (3/3) out-of-scope abstention, `17.32 ms` p95 latency, and `264.4 MB` peak RSS. See [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md) for details.

---
*Updated on: 2026-11-24*

## 4. Semantic Routing Validation (New Implementation)

The on-device `SemanticRouterService` pre-classifies queries before triggering LLM interactions. Its latency has not yet been benchmarked; measure cold-start/model-load time separately from warmed per-query latency.

### Current Automated Testing
The routing logic is verified in `widget.service.spec.ts`:
- **`standard_search` test:** Verifies `topK` uses `RAG_TOP_K` (4) and the prompt enforces direct factual answers.
- **`rag_synthesis` test:** Verifies `topK` uses `RAG_SYNTHESIS_TOP_K` (6) and the prompt enforces comprehensive synthesis.

### Recommended Manual Testing Scenarios

#### Scenario 1: standard_search vs rag_synthesis
- **Action**: Ask a direct question like "What is the wifi password?". Then ask a complex question like "Can you explain the membership tiers?".
- **Verification**:
  - Check the Docker API logs to ensure the routing correctly identifies "What is the wifi password?" as `standard_search` and the other as `rag_synthesis`.
    - Measure cold-start and warmed routing/query latency separately; the router uses local embeddings, but its speed has not yet been validated against a target.

#### Scenario 2: Fallback / LLM Search Regression
- **Action**: Force the router to fail (e.g., provide garbage text like "asdfghjkl") or fall below confidence thresholds (if configured).
- **Verification**: The system should cleanly bypass RAG document lookup and use general instructions without throwing unhandled exceptions.

#### Scenario 3: No Matching Context
- **Action**: Retain FAQ/document content that does not answer the question, then submit an unanswerable query.
- **Verification**: The API returns the deterministic abstention response and does not inject the first FAQ chunk or call the answer provider.

#### Scenario 4: Routing Blocked by Validation
- **Action**: Ask a prohibited question (e.g., explicit content) that *also* triggers a valid route.
- **Verification**: The `validationService` should correctly intercept and return a safety response *before* any prompt is passed to the AI provider, preventing wasted LLM compute.

## 5. UI/UX Feedback & Known Issues
- [ ] **Identical/Buggy Source Cards**: The display of citation cards is currently unsatisfactory. Issues include layout squashing, name truncation, and potential duplicate cards despite deduplication efforts. Needs a visual overhaul and more robust testing across different browsers.
