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

## 🚀 Outstanding Work (Future Roadmap)

### Phase 3.X: Advanced Safety Rules
- [ ] **Profanity Filter**: Add a basic rule to flag/block offensive input.
- [ ] **Disclaimer Injection**: Rule to append "Prices subject to change" if pricing is discussed.
- [ ] **"I don't know" threshold**: Flag responses where the search score is very low.

### Phase 4.X: Vector Search (Full RAG)
- [ ] **pgvector Integration**: Move from keyword search to semantic (embedding) search.
- [ ] **Ollama Embeddings**: Use local models for privacy-preserving search.
- [ ] **Source Citations**: Record exactly which chunk ID was used and display clickable sources.

### Phase 6: Distribution & Polish
- [ ] **CDN Deployment**: Finalize public script URL for `gymbot.min.js`.
- [ ] **Markdown Sanitization**: Deep audit of `snarkdown` output for XSS prevention.
- [ ] **Theme Persistence**: Let gym owners toggle themes (Dark/Light) in the dashboard.

---

## Reference Documents
*   `EXPLANATION_LAYER_FEATURES.md`: Comprehensive guide to current capabilities.
*   `WIDGET_INSTALLATION_GUIDE.md`: Step-by-step for end-users.
*   `EXPLANATION_LAYER_PROGRESS.md`: Chronological implementation log.
