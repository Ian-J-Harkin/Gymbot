# Experimental Phase 3 RFC: Semantic Router & 6 GB VRAM Local Stack

**Date:** 2026-11-23  
**Status:** Experimental RFC — **Do not implement until Phase 2's evaluation gate in [RAG_AND_ROUTING_DESIGN.md](RAG_AND_ROUTING_DESIGN.md) passes.**

---

## 1. Purpose & Scope

This RFC re-evaluates the role of [`SemanticRouterService`](fitbot-api/src/semantic-router/semantic-router.service.ts) after Phase 2 stabilizes document chunking and hybrid retrieval. It also defines an empirical architecture for running FitBot's full local AI stack (routing, embeddings, reranking, and answer generation) comfortably within a **6 GB VRAM** GPU budget via Ollama while maintaining portability to CPU-only cloud hosting ([`render.yaml`](render.yaml), 512 MB RAM).

---

## 2. Critique of the Existing Semantic Router

Inspecting the current implementation in [`semantic-router.service.ts`](fitbot-api/src/semantic-router/semantic-router.service.ts), [`generate-route-embeddings.ts`](fitbot-api/scripts/generate-route-embeddings.ts), and [`widget.service.ts`](fitbot-api/src/widget/widget.service.ts) reveals four structural flaws:

1. **Under-specified, brittle anchors:** [`route-anchors.json`](fitbot-api/src/semantic-router/route-anchors.json) is generated from just **4** `rag_synthesis` utterances and **5** `standard_search` utterances.
2. **Unrealistic cosine threshold (`0.80`):** With `all-MiniLM-L6-v2`, queries that are not near-paraphrases of one of those 4 `rag_synthesis` sentences rarely score `>= 0.80`, so most traffic silently falls back to `standard_search`.
3. **Inverted `topK` and identical cost:**
   - [`widget.service.ts`](fitbot-api/src/widget/widget.service.ts#L126) assigns `topK = 6` to `standard_search` and `RAG_TOP_K` (`4`) to `rag_synthesis` — giving complex synthesis queries *fewer* chunks than simple lookups.
   - Both routes still execute the full database chunk query, retrieval pipeline, and answer LLM call. The router adds model/inference complexity only to swap two sentences in the system prompt.
4. **Zero real-inference evaluation:** Existing unit tests mock `EmbeddingService` and `SemanticRouterService`; neither routing accuracy nor cold/warm inference latency has ever been measured.

---

## 3. Two Competing Experimental Hypotheses

Phase 3 will run a head-to-head experiment between two clean designs rather than preserving the status quo:

### Hypothesis A — Simplify / Remove the Router
- **Premise:** Once Phase 2 provides clean, focused chunks (`~350` chars, reranked) and a modern answer LLM (cloud or 3B–4B local model), a single well-engineered system prompt handles both short factual questions and multi-fact synthesis naturally without an upstream classifier.
- **Benefit:** Eliminates a failure-prone classification step, removes `route-anchors.json` maintenance, and simplifies `WidgetService.processChat` and `ExplanationMetadata`.

### Hypothesis B — Actionable Multi-Intent Router
- **Premise:** Routing is worthwhile **only** when different routes trigger genuinely different system actions that save latency, cost, or prevent bad retrievals:

| Route | Example Queries | System Action |
|---|---|---|
| `chitchat_greeting` | *"Hi"*, *"Thanks!"*, *"Who are you?"* | Respond directly with a lightweight greeting/persona prompt; **skip PostgreSQL chunk fetch, embedding, and reranking**. |
| `kb_question` | *"What's the sauna code?"*, *"Compare annual vs monthly cancellation rules"* | Run the full Phase 2 hybrid + reranker RAG pipeline and grounded answer LLM. |
| `out_of_scope` | *"Write me a Python script"*, *"Who won the World Cup?"* | Deterministic polite gym-scope refusal before retrieval or answer LLM (saves compute, reduces hallucination surface). |
| `human_handoff` *(optional)* | *"Chargeback on my card"*, *"I want to speak to a manager"* | Surface gym contact/escalation policy cleanly without guessing. |

---

## 4. Local 6 GB VRAM Model Stack (Ollama Architecture)

### Why Current Defaults Fail on 6 GB VRAM

Currently, [`constants.ts`](fitbot-api/src/common/constants.ts#L19) defaults Ollama to `mistral:7b` and [`schema.prisma`](fitbot-api/prisma/schema.prisma#L41) defaults `ollamaModel` to `llama3`. A 7B–8B Q4_K_M model consumes **4.5–5.2 GB VRAM** on its own, leaving almost zero headroom on a 6 GB card (~4.8–5.2 GB usable after display/OS overhead) for KV cache or co-resident embedding/reranker models — triggering slow PCIe/CPU layer offloading.

### Recommended Co-Resident 6 GB VRAM Budgets

Modern 3B–4B models outperform legacy 7B models on RAG groundedness and structured instructions while fitting comfortably alongside retrieval models:

| Role | Recommended Model(s) | Approx. VRAM | Notes |
|---|---|---|---|
| **Answer LLM (Primary)** | `qwen3:4b` (~2.6 GB), `qwen2.5:3b` (~2.0 GB), `phi4-mini` (~2.5 GB), or `gemma3:4b` (~3.3 GB) | **2.0 – 3.3 GB** | Leaves ~1.8–3.0 GB for context KV cache + auxiliary models. |
| **Intent Router / Query Rewriter *(Hyp. B only)*** | `qwen3:1.7b` or `qwen2.5:1.5b` (Q4) | **0.8 – 1.2 GB** | Structured JSON intent classification (and optional multi-query expansion) in ~50–150 ms on GPU; far more accurate than static cosine anchors. |
| **Embeddings** | `BAAI/bge-small-en-v1.5` (~130 MB, CPU or GPU) or Ollama `nomic-embed-text` (~275 MB) / `mxbai-embed-large` (~670 MB) | **0.13 – 0.67 GB** | `bge-small-en-v1.5` matches `vector(384)` directly; Ollama embeddings require matching DB vector dimensions if swapped. |
| **Cross-Encoder Reranker** | `Xenova/ms-marco-MiniLM-L-6-v2` (~90 MB) or `BAAI/bge-reranker-base` (~280 MB) | **0.1 – 0.3 GB** | Can stay on CPU (`~30–60 ms` for 10 chunks) if GPU headroom is tight. |
| **Total Co-Resident Footprint** | — | **~3.3 – 5.0 GB** | Fits inside 6 GB VRAM without swapping/CPU offload on the answer LLM. |

**Ollama UX gap to address during Phase 3:** [`OllamaProvider.generateResponse`](fitbot-api/src/widget/providers/ollama.provider.ts#L18) currently sets `stream: false` and yields the entire response at once. Enabling Ollama NDJSON streaming brings local GPU UX to parity with OpenAI/OpenRouter.

---

## 5. Cloud Portability (Render Free 512 MB Fallback)

Because [`render.yaml`](render.yaml) runs on Render's free tier (512 MB RAM, CPU-only, no Ollama GPU), Phase 3 must keep routing behind a clean `IntentRouter` interface selected via config (e.g. `ROUTER_BACKEND`):

- `ROUTER_BACKEND=none` — Hypothesis A (no router; Phase 2 RAG + single prompt). Zero extra RAM/CPU overhead on Render Free.
- `ROUTER_BACKEND=embedding` — Lightweight heuristic + expanded `bge-small-en-v1.5` centroid/anchor classifier (reusing the already-loaded Phase 2 embedding model, zero additional model RAM).
- `ROUTER_BACKEND=ollama` — Local/self-hosted GPU profile calling a dedicated small Ollama model (`qwen2.5:1.5b` / `qwen3:1.7b`) with JSON schema output and automatic timeout fallback to `kb_question` (fail-open to RAG, never silently drop a valid gym question).

---

## 6. Experimental Evaluation Protocol & Kill Criteria

### Benchmark Dataset (`router_intent_v1.json`)
Create a labeled evaluation dataset of **≥ 50 queries** across all target classes:
- 10+ `chitchat_greeting` (short greetings, thanks, meta-questions, plus tricky cases like *"Hi, what are your hours?"* which **must** route to `kb_question`, not `chitchat_greeting`).
- 25+ `kb_question` (literal lookups, paraphrases, multi-part synthesis, complaints about gym rules).
- 15+ `out_of_scope` (coding requests, general trivia, non-gym tasks, adversarial prompt-injection attempts).

### Real-Inference Comparison Matrix
Run **real inference (no mocks)** across three arms:
1. **No Router (Hypothesis A)** — Phase 2 RAG + `qwen2.5:3b` / `qwen3:4b` (and cloud baseline).
2. **Calibrated Embedding Router** — `bge-small-en-v1.5` with expanded anchors (≥ 15 per class) + tuned threshold sweep.
3. **Small Local LLM Router** — `qwen2.5:1.5b` / `qwen3:1.7b` via Ollama JSON classification.

### Metrics Recorded
- Per-class Precision / Recall and Macro F1.
- **False-Refusal / False-Skip Rate:** percentage of valid `kb_question` queries misrouted to `chitchat_greeting` or `out_of_scope` (most dangerous user-facing failure).
- Cold-start load time and p50 / p95 routing latency (ms).
- Peak VRAM (local GPU via `nvidia-smi` / Ollama `ps`) and Node.js RSS memory.
- End-to-end answer quality on mixed queries (e.g., *"Hey! When is midnight yoga?"*).

### Graduation & Kill Criteria

Hypothesis B graduates into the codebase **only if**:
1. False-refusal / false-skip rate on valid `kb_question` queries is **< 2%** (and mixed greeting+question queries route to `kb_question`).
2. `chitchat_greeting` + `out_of_scope` fast-paths measurably reduce p50/p95 latency or LLM/DB work on non-KB traffic.
3. End-to-end answer accuracy/groundedness is **at least equal to Hypothesis A** (no regressions from misrouting).
4. Memory/VRAM fits the respective target budget (`≤ 512 MB` RSS for cloud `embedding`/`none` modes; `≤ 5.2 GB` VRAM for local 6 GB stack).

**Kill Switch:** If Hypothesis B fails to beat Hypothesis A cleanly on these criteria, **adopt Hypothesis A permanently** and delete `SemanticRouterService`, `route-anchors.json`, and `generate-route-embeddings.ts`.
