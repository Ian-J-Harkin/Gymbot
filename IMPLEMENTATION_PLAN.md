# FitBot Implementation Plan

This document tracks the progress of the FitBot project implementation against the defined user stories.

## 🚨 Priority Sprint: Pre-Production Quality Gate (Immediate Focus)

> **Goal**: Harden the system before containerization. Ensure the API is secure before deploying to the public internet.

- [/] **9.2 Rate Limiting**: Install `@nestjs/throttler`; apply to `/auth/login`, `/auth/register`, `/widget/chat`, `/api-keys`.
- [ ] **15.3 Cloud Deployment Configs**: Set up Render/Azure hosting configs (Next task after Rate Limiting).
- [ ] **8.2 End-to-End Widget Test**: Automated flow from widget chat to backend RAG response.
- [ ] **8.3 Security Integration Tests**: Verify CORS restrictions and JWT safety failure states.
- [x] **[BLOCKER] Database Connectivity Gate**: Fixed `PrismaClientInitializationError` via Docker compose.

---

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

## 🟡 Epic 8: Quality Assurance & Testing (IN PROGRESS)
- [x] **8.0 Frontend Unit Testing**: Configured Vitest + React Testing Library; implemented `KnowledgeBase` logic tests.
- [x] **8.1 Backend Unit Testing**: Verified Configuration controller logic for new fields.
- [x] **8.4 Security-First Code Review**: Comprehensive audit completed 2026-02-18 — findings captured in Epic 14 below.
- [ ] **8.5 Cloud-First Architecture Review**: Evaluate system portability (Docker, secrets, statelessness).
- *(Note: 8.2 and 8.3 moved to Priority Sprint above)*

## 🟡 Epic 9: UX Polish & Admin Features (Pending Epic 8)
- [ ] **9.1 Dashboard Analytics**: Basic charts for chat volume and common inquiries (Show Value).
- [ ] **9.3 Admin UX Improvements**: "Unsaved Changes" warnings and better save feedback.
- [ ] **9.4 Online Demo (Cloud-Ready)**: Deploy a "free demo" version using a HuggingFace/OpenRouter free model.
- *(Note: 9.2 Rate Limiting moved to Priority Sprint above)*

## 🟡 Epic 10: CI/CD & Deployment (Pending Epic 9)
- [ ] **10.1 CI/CD Pipeline Investigation**: Research GitHub Actions for automated deployment.
- [ ] **10.2 Database Migration Automation**: Integrate Prisma migrations into the CI/CD flow.
- [ ] **10.3 Staging Environment**: Setup a "free-tier" preview environment for pull requests.

## 🟡 Epic 11: Ecosystem Integration & Pluggability
- [ ] **11.1 WP Onboarding Architecture Review**: Redesign registration/setup flow between WordPress Admin and GymBot Admin (API key exchange, "Setup Wizard" UI).
- [ ] **11.2 Multi-Platform Adapters**: Design wrappers for React, Next.js, and Angular to allow easy integration on non-WordPress sites.
- [ ] **11.3 Cross-Platform Delivery**: Finalize the "Universal JS" build that can be hosted on CDNs and dropped into any CMS (Wix, Squarespace, Shopify).
- [x] **11.4 Universal React Component ("React Plugin Equivalent")**: Build and publish a distributable `@fitbot/react` component that mirrors the WordPress plugin experience for non-WP sites. This is the **core deliverable** validated by the React Demo Site in Epic 15.
    - [x] **11.4a Component Architecture**: Define the component API — `<FitBotWidget apiKey={...} apiUrl={...} theme={...} />` — wrapping the Universal Loader script.
    - [x] **11.4b npm Package**: Package configured with `tsup` for CJS/ESM/d.ts output.
    - [x] **11.4c Documentation**: README with install instructions, prop reference, and code sandbox example.
    - [/] **11.4d Theme/Style API**: (DEFERRED) Support for runtime theme overrides (parity sync). Exposes customisation props equivalent to the WP plugin settings screen.

## 🟡 Epic 12: Developer SOP & Modularization (Meta-Development)
- [ ] **12.1 Project SOP Document**: Create a "Standard Operating Procedure" for going from idea to deployed app.
- [ ] **12.2 Modular Shelling**: Extract "Shells" and "Wizards" (Config screens, LLM Gateways) into reusable patterns for future projects.
- [ ] **12.3 Component Library Extraction**: Isolate core UI components (Chat, Audit Logs) into a internal "Kit".

## 🟡 Epic 13: Legal, Compliance & Cloud Terms
- [ ] **13.1 Cloud Hosting Research**: Analyze T&Cs for Azure Static Web Apps, Vercel, and HuggingFace free tiers.
- [ ] **13.2 End-User Terms (AUP)**: Draft "Acceptable Use Policies" based on cloud provider restrictions to protect the system from violation-driven shutdowns.
- [ ] **13.3 Subscription Guardrails**: Map cloud usage limits to Stripe subscription tiers (preventing overage).

## 🟢 Epic 14: Code Quality & Security Remediation (Completed)

> All P0/P1/P2 items complete. Passed items listed below.

- [x] **14.1 Remove Secrets from Git History**
- [x] **14.2 Fix `.gitignore`**
- [x] **14.3 Stop Returning Decrypted API Keys**
- [x] **14.4 Stripe Mock-Key Guard**
- [x] **14.5 Extract Magic Strings/Numbers to Constants**
- [x] **14.6 Fix Default Widget Colour Mismatch**
- [x] **14.7 Add Helmet Middleware**
- [x] **14.8 Environment-Driven CORS**
- [x] **14.9 Chat Message Length Validation**
- [x] **14.10 Validate File Upload by MIME Type**
- [x] **14.11a [NEXT] Add Google reCAPTCHA**
- [x] **14.12 Replace `any` Types with Interfaces**
- [x] **14.13 Refactor WidgetService**
- [x] **14.14 Create `@CurrentUserId()` Decorator**
- [x] **14.15 Add Pagination to Chat Logs**
- [x] **14.16 Register Validation Rules**
- [x] **14.17 Use NestJS Exceptions Consistently**
- [x] **14.18 Fix Swallowed Errors**
- [x] **14.19 Docker Secrets**
- [x] **14.20 Configurable Widget API URL**
- [x] **14.21 Write Unit Tests for All Services**
- [x] **14.25 Webhook Error Leakage**

## 🔴 Epic 15: Production Readiness & Demo Ecosystem (NEW)

> **Strategy**: Zero-Infrastructure. Deploy-Anywhere. Free-tier cloud (Render, Azure Static Web Apps, Neon) — no Docker or VPS required.
> **Prerequisite**: Completion of Priority Sprint (8.2, 8.3, 9.2).

> [!IMPORTANT]
> **External Demo Site Projects** — Both demo sites are *separate projects* outside this repo, exactly as the WordPress Demo Site is a standalone WP installation hosting the WP plugin:
> - **`fitbot-react-demo`**: A standalone React website (separate repo/project) that installs and demonstrates `@fitbot/react`. Validates that Task 11.4 works in the real world.
> - **WordPress Demo Site**: A hosted WordPress installation with the FitBot WP plugin installed. Validates the full plugin experience.
> These projects are the *consumers* of this repo's outputs, not part of the codebase itself.

- [x] **15.1 `@fitbot/react` Component (Task 11.4)**: Implement and package the Universal React component (see Epic 11.4). This is the primary deliverable of this phase.
- [x] **15.1a `fitbot-react-demo` Site**: Created standalone Vite+React app in `demos/fitbot-react-demo` that consumes the local package.
- [x] **15.2 Functional Parity Audit**: Verified `@fitbot/react` matches the WP plugin feature set (API key injection, RAG functionality verified). theme overrides deferred.
- [ ] **15.3 Cloud Deployment Configs**:
    - [ ] **15.3a Provider Configs**: `render.yaml` for the NestJS API; `staticwebapp.config.json` for the Admin panel on Azure.
    - [ ] **15.3b Demo Site Projects**: *(External)* `fitbot-react-demo` repo deployed to Azure Static Web Apps; WP Demo Site live on WordPress.com. Both consume API on Render.
    - [ ] **15.3c Database Migrations**: Use **Neon branching** to test schema changes safely before applying to demo DB. `prisma migrate deploy` runs on provider startup hook.
        - [ ] Configure GitHub Actions to create a temporary Neon DB branch per PR, run `prisma migrate deploy` against it, then delete the branch after the PR merges.
    - [ ] **15.3d Structured Logging**: Configure NestJS to output structured JSON to stdout (compatible with Render/Railway log aggregation).
    - [ ] **15.3e Env Validation (Pre-flight)**: Implement `Joi` schema validation in `ConfigModule` — app fails loudly at boot if required secrets are missing.
- [ ] **15.4 Deployment SOP**: Step-by-step guide to deploy admin, API, and both demo sites to free-tier cloud with zero server management.
- [ ] **15.5 Live Smoke Test**: React demo on `*.azurestaticapps.net` (using `@fitbot/react`) successfully chats with API on Render. WP Demo Site confirmed working. Zero Docker involved.
- [ ] **15.6 Connectivity Smoke Test**: Before every deployment, ping the `/api/health` endpoint from each demo site's origin to confirm cross-service connectivity. Catches URL typos and trailing-slash CORS mismatches that static hosts commonly produce.

## ❓ Future Queries & Clarifications
- [ ] **Data Import Logic**: Do we need to test Sales/customer import logic — is this in the context of bulk testing more customers for Stripe integration?
- [ ] **System Prompt Strategy**: Decide whether the system prompt should be centralized in `constants.ts` (for developer-driven consistency) or moved to the database via the `Configuration` model (to allow gyms to customize their bot's "personality" and instructions).
