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

## � Epic 5: Admin Portal & Explanation Layer (Completed)
- [x] **5.1 Initialize Vite React Project**.
- [x] **5.2 Audit Logs UI**: Detailed list view and side-drawer for chat history.
- [x] **5.3 AI Reasoning Visibility**: Surfaced provider, model, and latency in Admin UI.
- [x] **5.4 Widget Explanation**: Added "Why did I say this?" toggle to the Preact widget.
- [x] **5.5 Mini-RAG Integration**: Keyword-based context retrieval implemented in `RagService`.
- [x] **5.6 Advanced Explanation UI**: Implemented "Source Cards" in the widget to cite specific documents used in AI responses.
- [ ] **5.7 Source Card Refinement**: (LOGGED BUG) Current display of source cards is unsatisfactory and needs layout/visibility improvements.

## 🟢 Epic 6: Knowledge Base & Security Hardening (Completed)
- [x] **6.1 Advanced Document Support**: Support for .pdf and .docx file uploads; automatic chunking and indexing.
- [x] **6.2 Security Hardening**: Restrict CORS, harden JWT, and finalize sanitization.
- [x] **6.3 Source Attribution**: API and Widget now support metadata tracking for cited documents.
- [ ] **6.4 Vector Search Evaluation**: Investigate `pgvector` in PostgreSQL (Neon) for semantic search vs. current basic keyword logic; assess alignment with MCP patterns.

## 🟡 Epic 7: Quality Assurance & Testing
- [ ] **7.1 Data Import Testing**: Comprehensive unit and integration tests for sales/customer import logic.
- [ ] **7.2 Security Integration Tests**: Verify CORS restrictions and JWT safety failure states.
- [ ] **7.3 End-to-End Widget Test**: Automated flow from widget chat to backend RAG response.
- [ ] **7.4 Security-First Code Review**: Comprehensive "Web-First" audit of frontend/API communication and data sanitization.
- [ ] **7.5 Cloud-First Architecture Review**: Evaluate system portability (Docker, secrets, statelessness) for Azure/AWS deployment vs. local-first bias.
- [ ] **7.6 Secret Sanitization & Hardening**: Audit codebase to ensure zero hardcoded secrets/sensitive values; verify `.gitignore` integrity for all env files.

## 🟡 Epic 8: UX Polish & Admin Features
- [ ] **8.1 Admin UX Improvements**: "Unsaved Changes" warnings and better save feedback.
- [ ] **8.2 Rate Limiting**: Implement per-API-key rate limiting for AI usage.
- [ ] **8.3 Dashboard Analytics**: Basic charts for chat volume and common inquiries.
- [ ] **8.4 Online Demo (Cloud-Ready)**: Deploy a "free demo" version using a HuggingFace/OpenRouter free model for zero-cost evaluation.

## 🟡 Epic 9: CI/CD & Deployment (Theo.gg Inspired)
- [ ] **9.1 CI/CD Pipeline Investigation**: Research GitHub Actions for automated deployment to Neon (DB) and Vercel/Railway/Render (API/Web).
- [ ] **9.2 Database Migration Automation**: Integrate Prisma migrations into the CI/CD flow with Neon.
- [ ] **9.3 Staging Environment**: Setup a "free-tier" preview environment for pull requests.

## 🟡 Epic 10: Ecosystem Integration & Pluggability
- [ ] **10.1 WP Onboarding Architecture Review**: Redesign registration/setup flow between WordPress Admin and GymBot Admin (API key exchange, "Setup Wizard" UI).
- [ ] **10.2 Multi-Platform Adapters**: Design wrappers for React, Next.js, and Angular to allow easy integration on non-WordPress sites.
- [ ] **10.3 Cross-Platform Delivery**: Finalize the "Universal JS" build that can be hosted on CDNs and dropped into any CMS (Wix, Squarespace, Shopify).
- [ ] **10.4 Universal React/Next.js Component**: Build a framework-agnostic "drop-in" component that mirrors the WP plugin functionality for modern web apps.

## 🟡 Epic 11: Developer SOP & Modularization (Meta-Development)
- [ ] **11.1 Project SOP Document**: Create a "Standard Operating Procedure" for going from idea to deployed app.
- [ ] **11.2 Modular Shelling**: Extract "Shells" and "Wizards" (Config screens, LLM Gateways) into reusable patterns for future projects.
- [ ] **11.3 Component Library Extraction**: Isolate core UI components (Chat, Audit Logs) into a internal "Kit".

## 🟡 Epic 12: Legal, Compliance & Cloud Terms
- [ ] **12.1 Cloud Hosting Research**: Analyze T&Cs for Azure Static Web Apps, Vercel, and HuggingFace free tiers.
- [ ] **12.2 End-User Terms (AUP)**: Draft "Acceptable Use Policies" based on cloud provider restrictions to protect the system from violation-driven shutdowns.
- [ ] **12.3 Subscription Guardrails**: Map cloud usage limits to Stripe subscription tiers (preventing overage).
