# FitBot Implementation Plan

This document tracks the progress of the FitBot project implementation against the defined user stories.

## 🟢 Epic 1: Project Setup & Database (Completed)
- [x] **1.1 Initialize NestJS Project**: Project creation, ConfigModule setup.
- [x] **1.2 Integrate Prisma**: Prisma initialization, PostgreSQL connection.
- [x] **1.3 Core Data Models**: User, Configuration, and ApiKey models defined in `schema.prisma`.

## 🟢 Epic 2: Authentication & Configuration (Backend Completed)
### Story 2.1: Basic Authentication
- [x] Install dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` (and types).
- [x] Generate `UsersModule` and `UsersService`.
    - [x] Implement `findOne` by email.
    - [x] Implement `create` user method.
- [x] Generate `AuthModule`, `AuthService`, and `AuthController`.
    - [x] Implement `validateUser` (password comparison).
    - [x] Implement `login` (return JWT).
    - [x] Implement `register` (hash password, create user).
- [x] Implement `JwtStrategy` and `JwtAuthGuard`.

### Story 2.2: Encryption Service
- [x] Create `EncryptionService` in `common/services`.
    - [x] Implement `encrypt(text)` using AES-256-GCM.
    - [x] Implement `decrypt(hash)` using AES-256-GCM.
- [x] Configure `ENCRYPTION_KEY` and `IV_SECRET` in environment variables.

### Story 2.3: User Configurations CRUD
- [x] Generate `ConfigurationsModule`, `ConfigurationsService`, `ConfigurationsController`.
- [x] Implement `GET /configurations/me`.
    - [x] Retrieve config for logged-in user.
    - [x] Decrypt `openAiApiKey` before returning.
- [x] Implement `PUT /configurations/me`.
    - [x] Upsert configuration for logged-in user.
    - [x] Encrypt `openAiApiKey` before saving.

## 🟢 Epic 3: API Key Management (Backend Completed)
### Story 3.1: API Key Generation
- [x] Generate `ApiKeysModule`, `ApiKeysService`, `ApiKeysController`.
- [x] Implement `POST /api-keys`.
    - [x] Generate secure random string.
    - [x] Invalidate old keys for user's configuration.
    - [x] Save new key to database.

## 🟢 Epic 4: Public Widget API (Backend Completed)
### Story 4.1: Public Widget Configuration
- [x] Generate `WidgetModule`, `WidgetService`, `WidgetController`.
- [x] Create `ApiKeyAuthGuard`.
    - [x] Validate `X-API-Key` header against database.
    - [x] Attach configuration to request object.
- [x] Implement `GET /widget/config`.
    - [x] Return public fields only (`widgetColor`, no sensitive data).

### Story 4.2: Chat Proxy
- [x] Install OpenAI SDK.
- [x] Implement `POST /widget/chat`.
    - [x] Decrypt `openAiApiKey` from configuration.
    - [x] Construct prompt with `faqText` context.
    - [x] Forward request to OpenAI API.
    - [x] Stream response back to client (SSE).

## 🟢 Epic 5: Admin Portal & Explanation Layer (Completed)
- [x] **5.1 Initialize Vite React Project**.
- [x] **5.2 Audit Logs UI**: Detailed list view and side-drawer for chat history.
- [x] **5.3 AI Reasoning Visibility**: Surfaced provider, model, and latency in Admin UI.
- [x] **5.4 Widget Explanation**: Added "Why did I say this?" toggle to the Preact widget.
- [x] **5.5 Mini-RAG Integration**: Keyword-based context retrieval implemented in `RagService`.
- [x] **5.6 Advanced Explanation UI**: Implemented "Source Cards" in the widget to cite specific documents used in AI responses.
- [ ] **5.7 Source Card Refinement**: (DEFERRED) Layout/visibility improvements deferred in favor of billing features.

## 🟡 Epic 6: Knowledge Base & Security Hardening (Partially Complete)
- [x] **6.1 Advanced Document Support**: Support for .pdf and .docx file uploads; automatic chunking and indexing.
- [ ] **6.2 Security Hardening** *(reopened — see Epic 14)*: CORS is still hardcoded to `localhost` origins in `main.ts`; no `helmet` middleware; file-type validation relies on user-supplied extension not MIME type.
- [x] **6.3 Source Attribution**: API and Widget now support metadata tracking for cited documents.
- [x] **6.4 Quick Start Data**: "System Prompt" fallback UI with "Binary Choice" logic (disabled when docs exist).
- [ ] **6.5 Vector Search Evaluation**: Investigate `pgvector` in PostgreSQL (Neon) for semantic search vs. current basic keyword logic.

## 🟡 Epic 8: Quality Assurance & Testing (NEXT PRIORITY)
- [x] **8.0 Frontend Unit Testing**: Configured Vitest + React Testing Library; implemented `KnowledgeBase` logic tests.
- [x] **8.1 Backend Unit Testing**: Verified Configuration controller logic for new fields.
- [ ] **8.2 End-to-End Widget Test**: Automated flow from widget chat to backend RAG response.
- [ ] **8.3 Security Integration Tests**: Verify CORS restrictions and JWT safety failure states.
- [x] **8.4 Security-First Code Review**: Comprehensive audit completed 2026-02-18 — findings captured in Epic 14 below.
- [ ] **8.5 Cloud-First Architecture Review**: Evaluate system portability (Docker, secrets, statelessness).

## 🟡 Epic 9: UX Polish & Admin Features (Pending Epic 8)
- [ ] **9.1 Dashboard Analytics**: Basic charts for chat volume and common inquiries (Show Value).
- [ ] **9.2 Rate Limiting**: Install `@nestjs/throttler`; apply to `/auth/login`, `/auth/register`, `/widget/chat`, `/api-keys`; per-API-key limits for AI usage.
- [ ] **9.3 Admin UX Improvements**: "Unsaved Changes" warnings and better save feedback.
- [ ] **9.4 Online Demo (Cloud-Ready)**: Deploy a "free demo" version using a HuggingFace/OpenRouter free model.

## 🟡 Epic 10: CI/CD & Deployment (Pending Epic 9)
- [ ] **10.1 CI/CD Pipeline Investigation**: Research GitHub Actions for automated deployment.
- [ ] **10.2 Database Migration Automation**: Integrate Prisma migrations into the CI/CD flow.
- [ ] **10.3 Staging Environment**: Setup a "free-tier" preview environment for pull requests.

## 🟡 Epic 11: Ecosystem Integration & Pluggability
- [ ] **11.1 WP Onboarding Architecture Review**: Redesign registration/setup flow between WordPress Admin and GymBot Admin (API key exchange, "Setup Wizard" UI).
- [ ] **11.2 Multi-Platform Adapters**: Design wrappers for React, Next.js, and Angular to allow easy integration on non-WordPress sites.
- [ ] **11.3 Cross-Platform Delivery**: Finalize the "Universal JS" build that can be hosted on CDNs and dropped into any CMS (Wix, Squarespace, Shopify).
- [ ] **11.4 Universal React/Next.js Component**: Build a framework-agnostic "drop-in" component that mirrors the WP plugin functionality for modern web apps.

## 🟡 Epic 12: Developer SOP & Modularization (Meta-Development)
- [ ] **12.1 Project SOP Document**: Create a "Standard Operating Procedure" for going from idea to deployed app.
- [ ] **12.2 Modular Shelling**: Extract "Shells" and "Wizards" (Config screens, LLM Gateways) into reusable patterns for future projects.
- [ ] **12.3 Component Library Extraction**: Isolate core UI components (Chat, Audit Logs) into a internal "Kit".

## 🟡 Epic 13: Legal, Compliance & Cloud Terms
- [ ] **13.1 Cloud Hosting Research**: Analyze T&Cs for Azure Static Web Apps, Vercel, and HuggingFace free tiers.
- [ ] **13.2 End-User Terms (AUP)**: Draft "Acceptable Use Policies" based on cloud provider restrictions to protect the system from violation-driven shutdowns.
- [ ] **13.3 Subscription Guardrails**: Map cloud usage limits to Stripe subscription tiers (preventing overage).

## 🔴 Epic 14: Code Quality & Security Remediation (from 2026-02-18 Code Review)

> Items below were identified during the comprehensive code review (8.4) and are not covered by any other epic. Grouped by priority.

### P0 — Critical / Immediate

- [x] **14.1 Remove Secrets from Git History**: Deleted `check-key.ts`, `fix-db.js`, `db-check.js`. Git history scrub (BFG) deferred.
- [x] **14.2 Fix `.gitignore`**: Added `.env*`, `dist/`, `*.exe`, `*.log`, IDE folders, and debug scripts. Removed `stripe.exe` reference.
- [x] **14.3 Stop Returning Decrypted API Keys**: `getConfig()` now returns masked values (e.g. `sk-12...abc`). `updateConfig()` detects masked vs new keys and preserves existing encrypted values.
- [x] **14.4 Stripe Mock-Key Guard**: `StripeService` now uses `getStripeClient()` — returns `ServiceUnavailableException` when `STRIPE_SECRET_KEY` is unset. No more `'mock_key'` fallback.

### P1 — Important

- [x] **14.5 Extract Magic Strings/Numbers to Constants**: Created `constants.ts` with ~30 named values. Applied across `widget.service.ts`, `configurations.service.ts`, `knowledge-base.service.ts`, `auth.module.ts`, `users.service.ts`.
- [x] **14.6 Fix Default Widget Colour Mismatch**: Prisma schema changed from `#007bff` to `#2563EB` to match service layer and frontend.
- [x] **14.7 Add Helmet Middleware**: Installed `helmet` and applied as global middleware in `main.ts`.
- [x] **14.8 Environment-Driven CORS**: `ALLOWED_ORIGINS` env var (comma-separated) replaces hardcoded localhost array. Falls back to `localhost:5173` in dev.
- [x] **14.9 Chat Message Length Validation**: Added `ChatMessageDto` with `@MaxLength(4000)` in `widget.controller.ts`.
- [x] **14.10 Validate File Upload by MIME Type**: Added MIME check against `ALLOWED_MIME_TYPES` map before processing in `knowledge-base.controller.ts`.
- [ ] **14.11 Open Registration Protection**:
    - [x] **14.11a [NEXT] Add Google reCAPTCHA**: Required `recaptchaToken` added to registration and verified against Google's API.
    - [ ] **14.11b Email Verification**: [DEFERRED] Require email confirmation before account activation.
    - [ ] **14.11c Admin Approval**: [DEFERRED] deeply restictive mode for private Beta.

### P2 — Improvement

- [x] **14.12 Replace `any` Types with Interfaces**: Created `AuthenticatedRequest`, `ApiKeyRequest`, and `WidgetHistoryItem`. Removed `any` from `WidgetService`, `AuthService`, `JwtStrategy`, `WidgetController`, and `StripeController`.
- [x] **14.13 Refactor WidgetService**: Extract AI provider calls into an `AiProviderService` (Strategy pattern); move explanation assembly into a helper.
- [x] **14.14 Create `@CurrentUserId()` Decorator**: Created `current-user-id.decorator.ts` and refactored all 5 controllers (9 methods) to use it.
- [x] **14.15 Add Pagination to Chat Logs**: `findByUserId()` now accepts `page`/`pageSize` params, returns `{ data, total }`. Controller reads `?page=&pageSize=` query params.
- [ ] **14.16 Register Validation Rules**: `ValidationService.registerRule()` exists but is never called — no rules are active. Register at least basic rules (profanity filter, prompt-injection guard).
- [x] **14.17 Use NestJS Exceptions Consistently**: Replaced all generic `throw new Error()` in `StripeService` (→ `NotFoundException`, `BadRequestException`) and `KnowledgeBaseService` (→ `NotFoundException`, `BadRequestException`).
- [x] **14.18 Fix Swallowed Errors**: `ConfigurationsService` now logs a `Logger.warn()` with the error message on decryption failures instead of silently swallowing.
- [ ] **14.19 Docker Secrets**: Move plaintext MySQL credentials out of `docker-compose.yml` into `env_file` or Docker secrets.
- [ ] **14.20 Widget `API_BASE_URL` from Config**: `fitbot-widget/src/api/client.ts` hardcodes `http://localhost:3000/api`. Read from a build-time env var or the script tag's `data-*` attribute.
- [ ] **14.21 Write Unit Tests for All Services**: Zero `.spec.ts` files exist. Write tests for `AuthService`, `WidgetService`, `StripeService`, `ConfigurationsService`, `KnowledgeBaseService`, `RagService`, `ApiKeysService`.

### P3 — Housekeeping

- [x] **14.22 Remove Dead Code**: Deleted unused `EncryptionService.ivSecret` field, unused `RagService.calculateOverlap()` method, Vite scaffold files (`counter.ts`, `main.ts` in widget).
- [ ] **14.23 Harmonise Naming Conventions**: Frontend uses `openaiApiKey` (camelCase) while backend/Prisma uses `openAiApiKey`. Pick one and align.
- [x] **14.24 Remove Stale Comments**: Deleted `// Final Restart for Stripe Linking Fix` from `main.ts`.
- [x] **14.25 Webhook Error Leakage**: `StripeController` now returns generic `'Webhook processing failed'` instead of `err.message`.

## ❓ Future Queries & Clarifications
- [ ] **Data Import Logic**: Do we need to test Sales/customer import logic — is this in the context of bulk testing more customers for Stripe integration?
