# FitBot Implementation Plan

This document tracks the progress of the FitBot project implementation against the defined user stories.

<<<<<<< HEAD
## 📌 Next Steps / Parking Lot (To Do)
- [x] **Option A (Epic 6): Knowledge Base File Uploads** - Allow uploading PDF/DOCX files instead of just pasting text.
- [x] **Option B (Story 8.1): Admin UX Polish** - Implement "Unsaved Changes" warning and better visual save feedback.
- [ ] **Option C (Story 7.5): Email Integration** - Create workflow to email API Key & Instructions to a web developer.
- [ ] **Deferred**: Move AI system instructions to the database and expose them in the Admin UI for customization.
- [ ] **Deferred**: Create a "Allowed Domains" whitelist in the Configuration database model to dynamically serve CORS headers instead of hardcoding domains in `main.ts` environment variables.
- [ ] **Maintenance**: Resolve git conflicts by merging/rebasing `main` into the `feat/kb-uploads-and-security` branch to keep it up to date.
=======
## 🚨 Priority Sprint: Core Development (Local Ecosystem)

> **Goal**: Complete all outstanding system features and tests within the local Dockerized ecosystem before pushing to the cloud.

- [x] **8.2 End-to-End Widget Test**: Automated flow from widget chat to backend RAG response.
- [x] **8.3 Security Integration Tests**: Verify CORS restrictions and JWT safety failure states.
- [x] **9.1 Dashboard Analytics**: Basic charts for chat volume and common inquiries (Show Value).
- [x] **9.3 Admin UX Improvements**: "Unsaved Changes" warnings and better save feedback.
- [x] **11.1 WP Onboarding Architecture Review**: Redesign registration/setup flow between WordPress Admin and GymBot Admin (API key exchange, "Setup Wizard" UI).
- [x] **11.2 Multi-Platform Adapters**: Design wrappers for React, Next.js, and Angular to allow easy integration on non-WordPress sites.

## 🚨 Priority Sprint 2: Post-MVP Architecture & Security Hardening
> **Goal**: Address critical architectural flaws and security vulnerabilities identified in expert review before scaling production traffic.

**Immediate Priorities:**
- [ ] **Vector Search Scalability (Story 6.3)**: Implement `pgvector` in PostgreSQL for semantic retrieval of PDF/DOCX uploads. Replaces raw text appending to prevent LLM token limit exhaustion as the Knowledge Base grows.
- [ ] **Database-Driven CORS**: Move "Allowed Domains" from environment variables to the `Configuration` database model to securely manage multi-tenant cross-origin requests.
- [ ] **WordPress Input Sanitization**: Update `register_setting` in the WordPress plugin (`gymbot.php`) to use `sanitize_text_field` and `sanitize_url` callbacks, preventing XSS/script injection via the WP Admin area.
- [ ] **Universal Core Package**: Consolidate redundant widget logic spanning React, Next.js, and vanilla HTML into a single shared `@fitbot/core` package to eliminate behavioral drift.

**Post-MVP (Deferred & Scaling):**
- [ ] **Shared Types/DTOs**: Extract Prisma-generated types into a shared package to ensure strict type parity between the React Admin frontend and NestJS backend.
- [ ] **API Key Rotation Strategy**: Enhance `EncryptionService` to support AES-256-GCM key rotation, preventing catastrophic exposure if the primary `ENCRYPTION_KEY` is compromised.
- [ ] **Robust SSE Handling**: Enhance the client-side Widget SSE streaming logic to gracefully handle connection drops and reconnects (especially given custom header limitations with native `EventSource`).
- [ ] **Zero-Downtime Migrations**: Define a safe, zero-downtime database migration strategy for production CI/CD (e.g., expand-and-contract pattern) to handle Prisma schema drift.

---
>>>>>>> feat/kb-uploads-and-security

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

### Story 2.4: Stripe Integration (Backend Completed)
- [x] Create `StripeService`.
    - [x] Handle missing API keys gracefully (Dev/Test Mode).
    - [x] Mock checkout session creation in local dev.
    - [x] Bypass subscription checks if Stripe is not configured.
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

## 🟢 Epic 3.5: Advanced LLM Configuration (Completed)
### Story 3.5.1: Configuration UI Refactor
- [x] Split single configuration form into tabs: **General**, **AI Model**, **Knowledge Base**.
- [x] Move API Keys and Provider selection to the **AI Model** tab.

### Story 3.5.2: Local LLM Support (Ollama)
- [x] Implement backend proxy for local Ollama instance (Docker networking not needed for local dev).
- [x] Add `ollamaBaseUrl` field to Configuration model (default `http://localhost:11434`).
- [x] Update `WidgetService` to route chat requests to Ollama when selected.

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
<<<<<<< HEAD
- [x] **Components & UI**: Basic structures for Login, Register, and Dashboard exist.
- [x] **Integration**: Connect frontend forms to the backend API (Code Updated).

## 🟢 Epic 6: Advanced Knowledge Base (Completed)
### Story 6.1: File Upload Support (Text/Markdown)
- [x] Backend: Create `UploadsModule` or extend `ConfigurationsModule`.
- [x] Backend: Implement `POST /configurations/knowledge/upload` for `.txt` and `.md`.
- [x] Frontend: Add file picker to **Knowledge Base** tab.
- [x] Logic: Append file content to `faqText` context.

### Story 6.2: Rich Document Processing (PDF/Word)
- [x] Research & Select parsing libraries (e.g., `pdf-parse`, `mammoth`).
- [x] Backend: Extend upload endpoint to handle `.pdf` and `.docx`.
- [x] Backend: Extract text content from binary formats.
- [x] Frontend: Display uploaded file list and status.

### Story 6.3: Vector Search (RAG)
- [ ] *Detailed planning needed for vector database integration when context size exceeds token limits.*

## 🔴 Gap Analysis: User Onboarding & Client Integration
**Identified Gaps:**
1.  **Manual Key Transfer**: Users must manually copy/paste API keys from Gymbot Admin to WP Plugin. Error-prone.
2.  **No Feedback Loop**: After pasting the key in WP, there is no validation that it works until the widget loads (or fails) on the frontend.
3.  **Missing "Get Started"**: New users land on the Dashboard without clear steps on *what* to do next (Configure -> Add Data -> Get Key -> Install).
4.  **Developer/User Disconnect**: The current process assumes technical knowledge (editing files, understanding keys).

## 🟡 Epic 7: Onboarding & Integration Experience (Planned)
### Story 7.1: Guided Onboarding Wizard (Gymbot Admin)
- [ ] Create a "Getting Started" checklist on the main Dashboard.
    - [ ] Step 1: Customize your Bot (Theme/Color).
    - [ ] Step 2: Add Gym Info (Hours, Pricing).
    - [ ] Step 3: Install Widget (Instructions + Key).
- [ ] Show progress bar % complete.

### Story 7.2: WordPress Plugin "One-Click" Connect (Client Side)
- [x] Implement a "Connect to Gymbot" button in WP Admin using OAuth or simple Key exchange.
    - *Alternative (MVP)*: Improved Key Input with "Verify Connection" button.
- [x] Add status indicator: 🟢 Connected / 🔴 Disconnected.
- [x] Display basic bot stats in WP Admin (e.g., "Bot is active", "Last chat: 2m ago").

### Story 7.3: Connection Verification (End-to-End Test)
- [x] **Backend**: Add `HEAD /api/widget/health` endpoint that validates API Key.
- [x] **Frontend (WP)**: In plugin settings, AJAX call to check key validity before saving.
- [x] **Frontend (Widget)**: Display a friendly "Setup Needed" screen if key is invalid (Already implemented in Widget UI).

### Story 7.4: Developer Experience (Local Dev)
- [ ] Improve local dev setup to require fewer manual steps (e.g., auto-inject test keys or mock mode).
- [ ] Completed: Added "Input API Key" screen to Widget for easier testing without code changes.

### Story 7.5: Email Integration & Key Sharing
- [ ] Implement "Email Setup Instructions" feature in Installation tab.
- [ ] Allow sending API Key + Plugin Link + Setup Guide to a specified email address (e.g., to the gym's web developer).
- [ ] **Goal**: seamless handoff between Gym Owner (Gymbot Admin) and Web Admin.

## 🟣 Epic 8: Testing & Quality Assurance (Added based on feedback)
- [x] **Widget Unit Tests**: Add Vitest to `fitbot-widget` to test `ApiClient` logic and component rendering.
- [x] **E2E Testing**: Set up Playwright/Cypress for full end-to-end testing of the Widget -> API flow.
- [x] **CI/CD Integration**: Run tests automatically on build.

### Story 8.1: Admin UX Polish (Completed via 9.3)
- [x] **Unsaved Changes Indicator**: Show a warning if user tries to navigate away with unsaved changes.
- [x] **Save Feedback**: Change "Save" button to "Saved!" (green) temporarily on success.
## 🟡 Epic 6: Knowledge Base & Security Hardening (Partially Complete)
- [x] **6.1 Advanced Document Support**: Support for .pdf and .docx file uploads; automatic chunking and indexing.
- [x] **6.2 Security Hardening** *(completed in Epic 14)*: CORS is now environment-driven; added `helmet` middleware; file-type validation uses MIME type.
- [x] **6.3 Source Attribution**: API and Widget now support metadata tracking for cited documents.
- [x] **6.4 Quick Start Data**: "System Prompt" fallback UI with "Binary Choice" logic (disabled when docs exist).
- [ ] **6.5 Vector Search Evaluation**: Investigate `pgvector` in PostgreSQL (Neon) for semantic search vs. current basic keyword logic.

## 🟡 Epic 8: Quality Assurance & Testing (IN PROGRESS)
- [x] **8.0 Frontend Unit Testing**: Configured Vitest + React Testing Library; implemented `KnowledgeBase` logic tests.
- [x] **8.1 Backend Unit Testing**: Verified Configuration controller logic for new fields.
- [x] **8.4 Security-First Code Review**: Comprehensive audit completed 2026-02-18 — findings captured in Epic 14 below.
- [ ] **8.5 Cloud-First Architecture Review**: Evaluate system portability (Docker, secrets, statelessness).
- *(Note: 8.2 and 8.3 moved to Priority Sprint above)*

## 🟡 Epic 9: UX Polish & Admin Features (IN PROGRESS)
- [x] **9.2 Rate Limiting**: Install `@nestjs/throttler`; apply to `/auth/login`, `/auth/register`, `/widget/chat`, `/api-keys`.
- [x] **9.4 Online Demo (Cloud-Ready)**: Deployed a "free demo" version (`gymbot-react-demo.vercel.app`) using OpenRouter free models via Render API.
- *(Note: 9.1 and 9.3 moved to Priority Sprint above)*

## 🟡 Epic 10: CI/CD & Deployment (Pending Epic 9)

### 10.1 CI/CD Pipeline Investigation
To ensure GymBot's monorepo architecture scales efficiently, we need a robust CI/CD pipeline. We will use **GitHub Actions** to automate our testing and deployment processes. The investigation and implementation strategy is as follows:

#### Technical Implementation Strategy

1.  **Monorepo Workflow Architecture (`.github/workflows/`)**:
    *   **CI Pipeline (`ci.yml`)**: Triggered on `push` and `pull_request` to the `main` branch.
        *   **Job 1: Lint & Format**: Run ESLint and Prettier across all workspaces to enforce code quality.
        *   **Job 2: Unit Tests**: Execute Jest suites for `fitbot-api`, `fitbot-react`, `fitbot-admin`, and adapters.
        *   **Job 3: E2E Tests (Playwright)**: Spin up the required services (API, Postgres, Demo App) using Docker Compose within the GitHub Actions runner, execute Playwright tests, and upload artifacts (traces/videos) on failure.
    *   **CD Pipeline (`cd.yml`)**: Triggered on `push` to `main` (after CI succeeds) or on release tags.
        *   **Job 1: Build Packages**: Compile `@fitbot/react`, `@fitbot/angular`, and `@fitbot/nextjs` using `tsup` and custom build scripts. (Packages remain private/internal for now).
        *   **Job 2: Deploy Backend (fitbot-api)**: Deploy the NestJS application directly to **Render** using a `render.yaml` blueprint or API hooks.
        *   **Job 3: Deploy Frontends (fitbot-admin & demos)**: Build the React admin dashboard and demo sites, deploying static assets to **Vercel**.

2.  **Tooling & Caching Strategy**:
    *   Use `actions/cache` to aggressively cache `node_modules`, Next.js build cache, and Prisma engine binaries to drastically reduce workflow execution time.
    *   Utilize standard GitHub Actions runners (Ubuntu) as they provide pre-installed Node.js and Docker environments.

### 10.2 Database Migration Automation
Integrating database schema changes safely into the deployment flow.

#### Technical Implementation Strategy
1.  **CI Validation**: The CI pipeline will run `npx prisma migrate dev` against a disposable Postgres container to generate the initial schema and ensure migrations are valid.
2.  **CD Deployment**: During the CD pipeline deployment phase, run `npx prisma migrate deploy` against the production staging database before the new API image is rolled out to ensure schema compatibility.

### 10.3 Staging Environment
Creating a zero-risk environment for reviewing changes before production.

#### Technical Implementation Strategy
1.  **Preview Deployments**: Leverage Vercel/Netlify's built-in preview environments for the `fitbot-admin` and demo deployments on every Pull Request.
2.  **Ephemeral Backend**: (Optional Phase 2) Investigate spinning up ephemeral backend databases and API instances per PR using Railway or Render's preview environment features. If cost-prohibitive, route all PR previews to a shared, isolated staging database.

### 10.4 Public Package Distribution (Future)
Publishing the universal adapters to npm.

#### Technical Implementation Strategy
1.  **NPM Automation**: Later down the road, set up GitHub Actions with `Changesets` to automate semver bumping and publishing `@fitbot/*` packages to the public NPM registry.

## Verification Plan (Epic 10)
1.  **CI Validation**: Create a test PR that intentionally breaks a unit test or formatting rule and verify that GitHub Actions correctly blocks merging.
2.  **CD Validation**: Merge a passing PR and monitor the GitHub Actions UI to trace the successful build and deployment of the backend API and frontend dashboards to their respective staging URLs.

## 🟡 Epic 11: Ecosystem Integration & Pluggability (IN PROGRESS)
- [x] **11.3 Cross-Platform Delivery**: Finalized the raw HTML `<script>` embed code in the Admin Dashboard that can be dropped into any CMS (Wix, Squarespace, Shopify).
- [x] **11.4 Universal React Component ("React Plugin Equivalent")**: Build and publish a distributable `@fitbot/react` component that mirrors the WordPress plugin experience for non-WP sites. This is the **core deliverable** validated by the React Demo Site in Epic 15.
    - [x] **11.4a Component Architecture**: Define the component API — `<FitBotWidget apiKey={...} apiUrl={...} theme={...} />` — wrapping the Universal Loader script.
    - [x] **11.4b npm Package**: Package configured with `tsup` for CJS/ESM/d.ts output.
    - [x] **11.4c Documentation**: README with install instructions, prop reference, and code sandbox example.
    - [/] **11.4d Theme/Style API**: (DEFERRED) Support for runtime theme overrides (parity sync). Exposes customisation props equivalent to the WP plugin settings screen.
- *(Note: 11.1 and 11.2 moved to Priority Sprint above)*

### Multi-Platform Adapters (Epic 11.2 Expansion)
To allow gym owners and agencies to drop the FitBot widget into any tech stack, we need native wrappers for the most popular modern frameworks: Next.js and Angular. 

#### 1. Next.js Adapter (`@fitbot/nextjs`)
Next.js 13+ (App Router) defaults to Server Components. Since the widget interacts with the DOM, it must be a Client Component.
*   **[NEW] `packages/fitbot-nextjs`**: Create a lightweight package that applies the `"use client";` directive and re-exports the `<FitBotWidget>` from `@fitbot/react`.
*   This provides a zero-config experience for Next.js developers.

#### 2. Angular Adapter (`@fitbot/angular`)
*   **[NEW] `packages/fitbot-angular`**: Initialize a generic Angular library workspace using the Angular CLI.
*   Implement a standalone `FitbotWidgetComponent` that accepts `@Input() apiKey: string` and `@Input() apiUrl?: string`.
*   Use Angular's lifecycle hooks (`ngOnInit` or `ngAfterViewInit`) alongside `Renderer2` to safely inject the `gymbot.min.js` script into the DOM without violating Angular's strict DOM sanitization rules.

## Verification Plan (11.2)
1.  **Next.js Validation**: Spin up a minimal Next.js app in `demos/fitbot-nextjs-demo`, import `@fitbot/nextjs` into the `app/layout.tsx` (a Server Component), and verify the widget renders correctly without throwing hydration or Server Component errors.
2.  **Angular Validation**: Spin up a minimal `demos/fitbot-angular-demo`, import the module/component, and verify the widget renders correctly.

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

## 🔴 Epic 15: Production Readiness & Demo Ecosystem (IN PROGRESS)

> **Strategy**: Zero-Infrastructure. Deploy-Anywhere. Free-tier cloud (Render, Vercel, Neon) — no Docker or VPS required.
> **Prerequisite**: Completion of Priority Sprint tasks.

> [!IMPORTANT]
> **External Demo Site Projects** — Both demo sites are *separate projects* outside this repo, exactly as the WordPress Demo Site is a standalone WP installation hosting the WP plugin:
> - **`fitbot-react-demo`**: A standalone React website (separate repo/project) that installs and demonstrates `@fitbot/react`. Validates that Task 11.4 works in the real world.
> - **WordPress Demo Site**: A hosted WordPress installation with the FitBot WP plugin installed. Validates the full plugin experience. **Decision**: We will build this using a **Custom Simple Theme (PHP + Tailwind)** to perfectly mirror the React demo site without page builder bloat.
> These projects are the *consumers* of this repo's outputs, not part of the codebase itself.

- [x] **15.1 `@fitbot/react` Component (Task 11.4)**: Implement and package the Universal React component (see Epic 11.4). This is the primary deliverable of this phase.
- [x] **15.1a `fitbot-react-demo` Site**: Created standalone Vite+React app in `demos/fitbot-react-demo` that consumes the local package.
- [x] **15.2 Functional Parity Audit**: Verified `@fitbot/react` matches the WP plugin feature set (API key injection, RAG functionality verified). theme overrides deferred.
- [x] **15.3 Cloud Deployment Configs** *(Configurations complete, awaiting final deployment)*:
    - [x] **15.3a Provider Configs**: `render.yaml` for the NestJS API; Continuous Deployment via GitHub Actions to Vercel for Admin/Demos.
    - [x] **15.3c Database Migrations**: Use **Neon branching** to test schema changes safely before applying to demo DB. `prisma migrate deploy` runs on provider startup hook.
        - [ ] Configure GitHub Actions to create a temporary Neon DB branch per PR, run `prisma migrate deploy` against it, then delete the branch after the PR merges.
    - [x] **15.3d Structured Logging**: Configure NestJS to output structured JSON to stdout (compatible with Render/Railway log aggregation).
    - [x] **15.3e Env Validation (Pre-flight)**: Implement `Joi` schema validation in `ConfigModule` — app fails loudly at boot if required secrets are missing.
- [x] **15.4 Deployment SOP**: Step-by-step guide to deploy admin, API, and both demo sites to free-tier cloud with zero server management.
- [x] **15.7 Free Cloud LLM Support**: Integrate a free online LLM provider (OpenRouter) to ensure the cloud demo can operate without OpenAI costs. (Implemented via `OpenRouterProvider`).

> ⏳ **The following tasks are strictly dependent on pushing code to GitHub and creating the actual cloud resources.**

- [x] **15.3b Demo Site Projects**: *(External)* React Demo live on Vercel; WP Demo Site securely connected on live host. Both consume API on Render.
- [x] **15.5 Live Smoke Test**: React demo and WP Demo Site confirmed chatting successfully with the live API on Render. Zero Docker involved.
- [x] **15.6 Connectivity Smoke Test**: Before every deployment, ping the `/api/health` endpoint from each demo site's origin to confirm cross-service connectivity. Catches URL typos and trailing-slash CORS mismatches that static hosts commonly produce.

## ❓ Future Queries & Clarifications
- [ ] **WordPress Plugin UX**: Can we make the FitBot settings more prominent in the WP Admin menu (e.g., using `add_menu_page()` instead of `add_options_page()`) so it appears as a top-level icon rather than hidden inside the Settings dropdown?
- [ ] **Widget Customization**: Add configuration options to the Admin Dashboard (and reflect them in the WP plugin/React widget) to allow gym owners to customize the chatbot's title (e.g., "Gym Name Assistant") and UI styling (colors, font) to better match their underlying website.
- [ ] **Data Import Logic**: Do we need to test Sales/customer import logic — is this in the context of bulk testing more customers for Stripe integration?
- [ ] **System Prompt Strategy**: Decide whether the system prompt should be centralized in `constants.ts` (for developer-driven consistency) or moved to the database via the `Configuration` model (to allow gyms to customize their bot's "personality" and instructions).
- [ ] **Infrastructure as Code (IaC) Evolution**: While the current deployment creates GitHub Actions automatically or uses Vercel's deep native integrations, we should eventually implement Terraform scripts in an `/infrastructure` directory to allow 100% automated, reproducible deployments.
>>>>>>> feat/kb-uploads-and-security
