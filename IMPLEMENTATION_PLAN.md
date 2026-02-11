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

## 🟡 Epic 5: Admin Portal Setup (Frontend Partial)
- [x] **5.1 Initialize Vite React Project**.
- [x] **Components & UI**: Basic structures for Login, Register, and Dashboard exist.
- [x] **Integration**: Connect frontend forms to the backend API (Code Updated).
