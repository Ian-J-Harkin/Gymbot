# GymBot — Explanation Layer: Roadmap & Status

> **Status:** Phase 1-5 Implemented (Core MVP Complete)  
> **Goal:** Safety, Transparency, and Retrieval for the FitBot pipeline

---

## ✅ Completed Milestones

### Phase 1: Audit Logging
- [x] Prisma `ChatLog` model and migrations
- [x] `ChatLogsService` for persistence
- [x] Backend instrumentation for timing and metadata
- [x] Multi-tenant filtering (Gym Owners see only their logs)

### Phase 2: Structured Explanation
- [x] Defined `ExplanationMetadata` contract
- [x] Pipeline yields JSON metadata chunks via SSE
- [x] Widget parser for metadata segments

### Phase 3: Rule-Based Validation (Guardrails)
- [x] Pluggable `ValidationService` architecture
- [x] `MaxMessageLengthRule` (Active blocking)
- [x] Safety results integrated into logs and explanations

### Phase 4: RAG-Lite (Retrieval)
- [x] `RagService` for keyword-based search
- [x] Intelligent FAQ chunking strategy
- [x] Dynamic context injection (top-K chunks)

### Phase 5: Admin UI
- [x] Dashboard "Audit Logs" tab with tab-navigation
- [x] Responsive log list with status badges
- [x] Interactive side-drawer for reasoning drill-down

---

## � Key Design Decisions & Conclusions

### RAG-Lite vs. Full Vector Search
**Decision:** We have opted to stick with Keyword-based "RAG-Lite" retrieval for the MVP.
**Reasoning:**
- **Overkill for FAQ Scale:** Most gyms have <100 Q&A pairs. Vector search (embeddings) adds significant latency and overhead for negligible gain at this scale.
- **Latency & Cost:** Vector search requires an additional API call to an embedding model (e.g., OpenAI `text-embedding-3-small`), adding ~200ms lag.
- **Infrastructure Simplicity:** Keyword search runs entirely in memory without requiring `pgvector` or complex background indexing jobs.
- **Future-Proofing:** The architecture is built as a tech demonstration; we can swap out the keyword search for a vector-based one in the future if the FAQ sets grow into the thousands.

---

## �🚀 Outstanding Work (Future Roadmap)

### Phase 3.X: Advanced Safety Rules
- [ ] **Profanity Filter**: Add a basic rule to flag/block offensive input.
- [ ] **Disclaimer Injection**: Rule to append "Prices subject to change" if pricing is discussed.
- [ ] **"I don't know" threshold**: Flag responses where the search score is very low.

### Phase 4.X: Vector Search (Full RAG)
- [ ] **pgvector Integration**: Move from keyword search to semantic (embedding) search.
- [ ] **Ollama Embeddings**: Use local models for privacy-preserving search.
- [ ] **Source Citations**: Record exactly which chunk ID was used and display clickable sources.

### Phase 6: Security & Reliability
- [x] **CI/CD Pipeline**: GitHub Actions for automated testing and builds.
- [x] **CORS Hardened**: Strict origin policy (MVP level).
- [x] **XSS Sanitization**: Integrated DOMPurify in the widget.
- [ ] **Rate Limiting**: Add `throttler` to the backend for API protection.
- [ ] **Secret Scanning**: Integrate `trufflehog` or similar in CI.

### Phase 7: Distribution & Polish
- [ ] **CDN Deployment**: Finalize public script URL for `gymbot.min.js`.
- [ ] **Markdown Sanitization**: Deep audit of `snarkdown` output for XSS prevention.
- [ ] **Theme Persistence**: Let gym owners toggle themes (Dark/Light) in the dashboard.

### Phase 8: Extra Features (Later)
- [ ] **Advanced Markdown Support**: Add code syntax highlighting and complex table rendering.
- [ ] **Voice Interaction**: Integrate browser-based speech-to-text for members.
- [ ] **Analytics Dashboard**: Aggregate metrics on most-asked questions and user satisfaction.

---

## Reference Documents
*   `EXPLANATION_LAYER_FEATURES.md`: Comprehensive guide to current capabilities.
*   `WIDGET_INSTALLATION_GUIDE.md`: Step-by-step for end-users.
*   `EXPLANATION_LAYER_PROGRESS.md`: Chronological implementation log.
