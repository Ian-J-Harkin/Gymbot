# Evaluation and Upgrade Options

The current [evaluation_issues.md](evaluation_issues.md) reads like notes from the discussion rather than a structured list of measured failures. Based on those themes and the current implementation, the following upgrades are proposed in priority order.

The existing [Knowledge Base testing guide](KNOWLEDGE_BASE_TESTING.md) is the starting point for the evaluation cases: it already covers file ingestion, retrieval, deletion, and five handbook questions. Those are useful smoke-test scenarios, but they are not yet a retrieval benchmark because expected source chunks and ranking metrics are not recorded.

| Problem | Low-risk workaround | Further upgrade |
|---|---|---|
| The right document passage is not retrieved | Improve exact-term ranking and add a small synonym list for gym vocabulary. | Compare PostgreSQL full-text search with hybrid keyword and vector retrieval. Embed chunks once at upload, then embed each question at query time. |
| No chunk matches, but the bot still gets context | Do not silently use the first FAQ chunk; have the bot say it could not find supporting information. | Add a calibrated "no relevant evidence" threshold and test abstention behavior. This is especially relevant in [widget.service.ts](fitbot-api/src/widget/widget.service.ts). |
| PDF/DOCX text is missing or garbled | Show extracted-text previews and flag unusually short extractions. | Add OCR for scanned PDFs and structure-aware extraction for tables and headings. This is separate from semantic search. |
| The right evidence reaches the model, but its answer is poor | Tighten instructions to answer only from the supplied evidence and include source references. | Compare answer models using identical retrieved passages and prompts. Upgrade only if correctness or groundedness improves enough to justify cost and latency. |
| Search slows as document collections grow | Stop loading every chunk for every chat; measure current corpus size and request latency. | Push candidate retrieval into the database and index it. Confirm production `pgvector` support before choosing vector storage; PostgreSQL full-text search is a fallback if it is unavailable. |

## Suggested Immediate MVP

Extend the handbook questions in [KNOWLEDGE_BASE_TESTING.md](KNOWLEDGE_BASE_TESTING.md) into a small benchmark by recording expected source passages and answer facts, then measure the existing keyword baseline first. Add paraphrases, exact-value lookups, multi-chunk questions, and unanswerable questions. Test the cheapest retrieval change against this baseline, and keep answer-model evaluation separate so a retrieval improvement is not confused with a generation change.

One caution: the existing router's MiniLM embeddings classify query intent; they do not demonstrate that the same model will retrieve document passages well. Test that directly before adopting it for document search.