I take “the final paragraph” to mean the last decision item: evaluate an answer-model upgrade separately, only if answers fail despite the correct evidence being in context.

The chat pipeline has distinct stages: extract document t text, retrieve relevant chunks, then ask the answer model to respond using those chunks. The point is to identify which stage is failing before changing technology:

The useful passage wasn’t retrieved: that’s a retrieval problem. Improve extraction, chunking, or search. A stronger answer model can’t reliably use evidence it never receives.
The passage was retrieved but isn’t actually in the model’s prompt, or got truncated: that’s a context assembly problem. Verify exactly what reaches the provider.
The right passage is in the prompt, but the answer is still wrong, incomplete, or poorly grounded:
then generation is a plausible problem. Compare answer models using the same questions, retrieved text, and prompt so the model is the only variable.
For example, if the handbook says classes start at 6 p.m. but the retrieved chunks don’t contain the schedule, switching LLMs won’t address the underlying miss. If the schedule is clearly in the prompt and the model  still gives the wrong time, a controlled model comparison could be worthwhile. Compare correctness and groundedness alongside latency and cost before upgrading.

Not explicitly. IMPLEMENTATION_PLAN.md mentions evaluating pgvector and adding vector search when context size becomes a problem, but it doesn’t capture the diagnostic distinction we discussed: first verify whether the right evidence was retrieved and actually reached the model; consider an LLM upgrade only if the model answers poorly despite having that evidence.

Also, the plan currently contains unresolved merge-conflict markers, so its entries should be treated as historical context rather than a clean, authoritative decision record.