# FitBot: Explanation Layer & RAG-Lite Feature Guide

This guide provides an overview of the transparency, safety, and retrieval features added to the FitBot ecosystem.

---

## 1. Transparency: The Explanation Layer
FitBot no longer just gives an answer; it explains *why* and *how* it arrived at that answer.

### "Why did I say this?" (Widget)
Every AI response in the chat widget now includes a small info link. Clicking it reveals:
*   **Provider & Model**: Know exactly which AI (OpenAI, OpenRouter, or Ollama) generated the response.
*   **Latency**: See exactly how many milliseconds the AI took to respond.
*   **Context Summary**: A report on what information from the gym's FAQ was used.
*   **Safety Results**: Any validation rules that were triggered (e.g., "Input Length Check").

### Audit Log Explorer (Admin Dashboard)
As a gym owner, you can view the complete history of all conversations.
*   **Full History**: Every user message and AI response is logged.
*   **Reasoning Drill-down**: Clicking a log entry opens a detailed view showing the exact metadata associated with that interaction.
*   **Safety Status**: Identify interactions that were blocked or flagged by the safety system.

---

## 2. Intelligence: RAG-Lite (Context Retrieval)
To ensure the AI stays focused and cost-effective, FitBot uses a "Retrieval Augmented Generation" (RAG) approach.

### How it Works
1.  **Partitioning**: Your FAQ is automatically broken down into logical blocks (chunks).
2.  **Keyword Search**: When a user asks a question, FitBot searches for the top 3 most relevant segments of your FAQ.
3.  **Targeted Prompting**: Instead of "reading" your entire FAQ for every single message, the AI only reviews the relevant segments.

### Benefits
*   **Accuracy**: Reduces "hallucinations" by focusing the AI on specific facts.
*   **Efficiency**: Saves on token usage/costs for large FAQs.
*   **Scalability**: Allows you to have an FAQ of any size without slowing down the bot.

---

## 3. Safety: Rule-Based Validation
FitBot includes a guardrail system that monitors messages before they are sent to the AI.

*   **Input Blocking**: Messages that are too long (e.g., > 500 characters) are automatically blocked to prevent abuse.
*   **Error Handling**: If an AI provider fails, the system logs the error and gracefully informs the user, instead of crashing.
*   **Audit Trail**: Every validation result is recorded in the Audit Logs for administrative review.

---

## 4. Testing & Verification
Refer to the `WIDGET_INSTALLATION_GUIDE.md` for a step-by-step checklist on how to verify these features on your own website.
