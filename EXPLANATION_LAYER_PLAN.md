# GymBot — Explanation Layer: Task List & Discussion Document

> **Created:** 2026-02-10  
> **Status:** Planning — Pending Design Decisions  
> **Goal:** Add transparency, validation, and auditability to the GymBot chat pipeline

---

## Overview

The Explanation Layer adds four capabilities to GymBot's existing chat pipeline:

1. **Show which context was retrieved** — surface what information the AI used to answer
2. **Structured explanation of the answer** — return metadata alongside the AI response
3. **Rule-based validation** — pre- and post-processing guardrails around the AI call
4. **Audit logging** — persist every interaction step for review

### Current Architecture (as of Epic 4 completion)

```
User Message → API Key Auth → Load Configuration → Build System Prompt (full FAQ) → AI Provider → SSE Stream → Client
```

The chat pipeline is fully functional across three providers (OpenAI, OpenRouter, Ollama). The entire `faqText` is injected into the system prompt wholesale — there is no retrieval or chunking step today.

---

## Phase 1: Audit Logging (Foundation)

**Why first:** Every subsequent feature benefits from having a log trail. This is the backbone.

### Tasks

- [x] **1.1** Add `ChatLog` model to Prisma schema
  ```prisma
  model ChatLog {
    id              String   @id @default(cuid())
    configurationId String
    userMessage     String   @db.Text
    aiResponse      String   @db.Text
    provider        String
    model           String
    contextLength   Int
    validationFlags String[]
    responseTimeMs  Int
    createdAt       DateTime @default(now())
    configuration   Configuration @relation(fields: [configurationId], references: [id])
  }
  ```
- [x] **1.2** Update `Configuration` model to add relation to `ChatLog[]`
- [x] **1.3** Run Prisma migration
- [x] **1.4** Create `ChatLogService` (or extend `WidgetService`) to persist logs
- [x] **1.5** Instrument `processChat` to capture timing, provider, model, and context length
- [ ] **1.6** Write unit tests for logging service
- [ ] **1.7** Verify logs are being written during manual chat test

### 🔵 Design Decisions Needed (Phase 1)

- **Separate module or part of Widget module?** A `ChatLogModule` keeps things clean, but adds wiring. Alternatively, keep it in `WidgetModule` for simplicity.
- **Retention policy?** Should logs auto-expire? If so, after how long? Or leave that for a future admin feature?
- **What to log on failure?** If the AI call throws, do we still log the attempt (with an error field)?
- **PII considerations:** User messages may contain personal info. Any masking or opt-out mechanism needed?

---

## Phase 2: Structured Explanation (Enrich Responses)

**Why second:** Lightweight, high-visibility feature. Gives immediate value to the admin/end-user.

### Tasks

- [x] **2.1** Define `ExplanationMetadata` interface
  ```typescript
  interface ExplanationMetadata {
    provider: string;           // "openai" | "openrouter" | "ollama"
    model: string;              // "gpt-3.5-turbo", "llama3", etc.
    contextUsed: string;        // summary or hash of FAQ text provided
    contextLength: number;      // character count of FAQ injected
    systemPromptSummary: string;
    responseTimeMs: number;
    timestamp: string;
  }
  ```
- [x] **2.2** Update `processChat` to return metadata alongside the AI response
- [x] **2.3** Update `widget.controller.ts` SSE stream to emit a final `explanation` event before `[DONE]`
  ```
  data: {"content": "..."}\n\n       ← normal streaming chunks
  data: {"explanation": {...}}\n\n   ← metadata event (new)
  data: [DONE]\n\n
  ```
- [ ] **2.4** Update widget client to parse and display the explanation (optional toggle)
- [x] **2.5** Write unit tests for explanation assembly
- [ ] **2.6** Decide on admin-side UI for viewing explanations (or defer to Phase 4 admin work)

### 🔵 Design Decisions Needed (Phase 2)

- **Who sees the explanation?** End-users in the widget? Only admins? Both with different detail levels?
- **SSE event format:** Separate event type (`event: explanation`) vs. inline JSON field? Separate event type is cleaner but requires client changes.
- **Model name resolution:** Hardcoded per provider today (`gpt-3.5-turbo`, `llama3`). Should the model be configurable in `Configuration`? (It probably should regardless of this feature.)

---

## Phase 3: Rule-Based Validation (Guardrails)

**Why third:** Requires the logging from Phase 1 to record which rules fired, and the explanation from Phase 2 to surface them.

### Proposed Architecture

```
User Message
    ↓
[INPUT VALIDATION RULES]   ← Pre-processing
    ↓
AI Provider Call
    ↓
[OUTPUT VALIDATION RULES]  ← Post-processing
    ↓
Response + Explanation + Validation Report
```

### Tasks

- [x] **3.1** Design rule engine interface
  ```typescript
  interface ValidationRule {
    id: string;
    name: string;
    type: 'input' | 'output';
    evaluate(content: string, context: RuleContext): ValidationResult;
  }

  interface ValidationResult {
    passed: boolean;
    ruleId: string;
    message?: string;
    severity: 'info' | 'warning' | 'block';
  }
  ```
- [x] **3.2** Implement built-in rules:
  - [x] Input: Max message length
  - [ ] Input: Banned content / profanity filter (basic)
  - [ ] Output: Response length sanity check
  - [ ] Output: "I don't know" detection (did the AI go off-FAQ?)
  - [ ] Output: Disclaimer injection (e.g., pricing mentions)
- [x] **3.3** Create `ValidationService` to orchestrate rule evaluation
- [x] **3.4** Integrate into `processChat` pipeline
- [x] **3.5** Log validation results to `ChatLog.validationFlags`
- [ ] **3.6** Surface triggered rules in the explanation metadata
- [x] **3.7** Write unit tests for each rule
- [ ] **3.8** Manual end-to-end test with intentional rule triggers

### 🔵 Design Decisions Needed (Phase 3)

- **Hardcoded vs. configurable rules?** Start with hardcoded built-ins, but should admins be able to add custom rules via the admin portal? (This is a significant scope increase.)
- **Blocking vs. advisory?** When a rule fires, does it block the response entirely, modify it, or just flag it in the logs?
- **Rule priority / ordering:** If multiple rules fire, which takes precedence?
- **Where do rules live?** In code only? In the database as part of `Configuration`? A hybrid approach?

---

## Phase 4: Retrieved Context Display (Mini-RAG)

**Why last:** This requires the most architectural change — moving from "inject entire FAQ" to "search and retrieve relevant chunks."

### Current State

Today, the **entire** `faqText` field is injected into the system prompt:

```typescript
const systemPrompt = `You are a helpful assistant for a gym. Use the following FAQ to answer user questions:
${configuration.faqText}
...`;
```

This works for small FAQs but doesn't scale, and there are no meaningful "retrieved pages" to display.

### What's Needed for Real Retrieval

- [ ] **4.1** Design FAQ chunking strategy (by paragraph? by Q&A pair? fixed token windows?)
- [ ] **4.2** Choose an embedding approach:
  - Option A: Use the configured AI provider's embedding API
  - Option B: Use a lightweight local model (e.g., via Ollama)
  - Option C: Use a simple keyword/TF-IDF approach (no embeddings, simpler)
- [ ] **4.3** Choose a vector store:
  - Option A: pgvector (extend existing PostgreSQL — keeps infra simple)
  - Option B: In-memory store (fine for small FAQ sets)
  - Option C: External service (Pinecone, Weaviate — probably overkill here)
- [ ] **4.4** Implement chunk ingestion pipeline (runs when FAQ is saved/updated)
- [ ] **4.5** Implement retrieval: given a user message, find top-K relevant chunks
- [ ] **4.6** Update `processChat` to inject only retrieved chunks (not entire FAQ)
- [ ] **4.7** Surface retrieved chunks in the explanation metadata
- [ ] **4.8** Update `ChatLog` to record which chunks were retrieved
- [ ] **4.9** Write tests for chunking, embedding, and retrieval
- [ ] **4.10** A/B testing or quality comparison: full FAQ vs. retrieved chunks

### Interim Option (Mini-RAG Implemented)

- [x] **4.A** Report `"context: retrieved chunks"` with block count and metadata
- [x] **4.B** Implement simple keyword-based partitioner and searcher
- [x] **4.C** Update `processChat` to inject only relevant chunks

### 🔵 Design Decisions Needed (Phase 4)

- **Is RAG worth it at this stage?** If most gym FAQs are under ~2,000 words, full-context injection may be fine and RAG adds complexity for little gain.
- **Chunking granularity:** This heavily depends on how gym owners structure their FAQ content.
- **Re-indexing trigger:** When FAQ text is updated, chunks and embeddings need to be regenerated. Synchronous or background job?
- **Cost implications:** Embedding API calls have costs (small, but non-zero for OpenAI). Relevant for the pricing model.

---

## Summary: Recommended Implementation Order

| Phase | Feature | Estimated Effort | Dependencies |
|-------|---------|-----------------|--------------|
| **1** | Audit Logging | 3–5 hours | None (foundational) |
| **2** | Structured Explanation | 2–4 hours | Benefits from Phase 1 |
| **3** | Rule-Based Validation | 4–8 hours | Uses Phase 1 for audit, Phase 2 for surfacing |
| **4** | Retrieved Context Display | 8–16+ hours | Requires chunking/RAG infrastructure |

**Total estimated effort (Phases 1–3):** ~9–17 hours  
**Phase 4 (RAG):** Separate epic, significantly more scope

---

## Open Questions for Discussion

1. Should the explanation data be visible to end-users, admins only, or both?
2. How should we handle logging of potentially sensitive user messages (PII)?
3. Are custom validation rules (admin-configurable) in scope, or just built-in rules?
4. Is pg-vector RAG worth pursuing now, or should we defer Phase 4 and focus on Phases 1–3?
5. Should the `model` field in `Configuration` be made configurable per-provider (currently hardcoded)?
6. Do we want a dedicated admin page for browsing chat logs and explanations?

---

*This document will be updated as design decisions are made.*
