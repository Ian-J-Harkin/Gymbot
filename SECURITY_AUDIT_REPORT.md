# FitBot Security Audit Report

This report evaluates the security posture of the FitBot system and identifies vulnerabilities, risks, and mitigation strategies.

---

## 1. Authentication & Session Management

### Findings
*   **JWT Protection**: The Admin Dashboard correctly uses JWT for all sensitive operations.
*   **API Key Guards**: The public widget endpoints are protected by `ApiKeyAuthGuard`, ensuring only legitimate integrations can call the backend.
*   **Decryption Integrity**: API keys for external providers (OpenAI/Ollama) are stored encrypted at rest and only decrypted in-memory during a request.

### Risks
*   **Exposed JWT Secrets**: If `JWT_SECRET` is not set correctly in production, it defaults to a weak value or crashes.
*   **Key Theft**: If a gym owner's API key is stolen, an attacker can usage the gym's AI quota.

### Mitigations
*   [x] **Rotate Keys**: Added ability to refresh API keys in the dashboard.
*   [ ] **Rate Limiting**: Implement rate limiting per API key to prevent brute-force or quota exhaustion.

---

## 2. Injection & Cross-Site Scripting (XSS)

### Findings
*   **Database**: Prisma automatically handles SQL Injection by using prepared statements.
*   **Widget Rendering**: The widget uses `snarkdown` to render Markdown but injects it via `dangerouslySetInnerHTML` without sanitization.

### Risks
*   **XSS**: An attacker (or a malicious AI response) could inject `<script>` tags or `onerror` handlers into the chat bubble.

### Mitigations
*   [x] **Sanitization**: Integrated `DOMPurify` and `snarkdown` in the widget to sanitize and render Markdown safely.
*   [x] **Input Validation**: Added `MaxMessageLengthRule` to prevent massive payload injection attempts.

---

## 3. Data Privacy & Multi-Tenancy

### Findings
*   **Log Isolation**: The `findByUserId` method correctly filters logs by the authenticated user's ID.
*   **Config Leakage**: The `getPublicConfig` method explicitly whitelists safe fields, preventing sensitive keys from being returned to the public widget.

### Risks
*   **CORS Over-permissiveness**: Currently, `app.enableCors()` allows any domain to call the API.

### Mitigations
*   [x] **Restrict CORS**: Updated `main.ts` to only allow whitelisted dashboard and widget origins.

---

## 4. Dependencies & Secrets

### Findings
*   **Secret Management**: Using `.env` for secrets.
*   **Exposed Tokens**: Scanned codebase for accidental hardcoded secrets (None found in core logic).

### Risks
*   **npm vulnerabilities**: Some older dependencies in the widget or admin may have known CVEs.

### Mitigations
*   [x] **CI Scan**: Added `npm ci` and build checks to the GitHub Action.

---

## 5. Planned Web-First Security Review
*   **Scope**: Full end-to-end audit of the Preact widget, API authentication flow, and data sanitization.
*   **Focus**: 
    *   Validation of `DOMPurify` implementation in edge cases.
    *   Verification of CORS enforcement across different gym subdomains.
    *   Audit of SSE (Server-Sent Events) stream for potential data leakage.
    *   CSRF protection review for the Admin Dashboard.
    *   **Secret Integrity**: Verification that no sensitive keys exist in source control and environmental secrets are purely injected.

---

## 🛡️ Immediate Fixes Required
1.  **Restrict CORS** in `fitbot-api/src/main.ts` (Done).
2.  **Harden JWT Config** to ensure it fails if no secret is provided (Done).
3.  **Implement Rate Limiting** to protect AI quotas (Phase 6).
