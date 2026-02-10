# FitBot Implementation Plan

This document tracks the progress of the FitBot project implementation against the defined user stories.

## 🟢 Epic 1: Project Setup & Database (Completed)
- [x] **1.1 Initialize NestJS Project**: Project creation, ConfigModule setup.
- [x] **1.2 Integrate Prisma**: Prisma initialization, PostgreSQL connection.
- [x] **1.3 Core Data Models**: User, Configuration, and ApiKey models defined in `schema.prisma`.

## 🔴 Epic 2: Authentication & Configuration (Backend Missing)
### Story 2.1: Basic Authentication
- [ ] Install dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt` (and types).
- [ ] Generate `UsersModule` and `UsersService`.
    - [ ] Implement `findOne` by email.
    - [ ] Implement `create` user method.
- [ ] Generate `AuthModule`, `AuthService`, and `AuthController`.
    - [ ] Implement `validateUser` (password comparison).
    - [ ] Implement `login` (return JWT).
    - [ ] Implement `register` (hash password, create user).
- [ ] Implement `JwtStrategy` and `JwtAuthGuard`.

### Story 2.2: Encryption Service
- [ ] Create `EncryptionService` in `common/services`.
    - [ ] Implement `encrypt(text)` using AES-256-GCM.
    - [ ] Implement `decrypt(hash)` using AES-256-GCM.
- [ ] Configure `ENCRYPTION_KEY` and `IV_SECRET` in environment variables.

### Story 2.3: User Configurations CRUD
- [ ] Generate `ConfigurationsModule`, `ConfigurationsService`, `ConfigurationsController`.
- [ ] Implement `GET /configurations/me`.
    - [ ] Retrieve config for logged-in user.
    - [ ] Decrypt `openAiApiKey` before returning.
- [ ] Implement `PUT /configurations/me`.
    - [ ] Upsert configuration for logged-in user.
    - [ ] Encrypt `openAiApiKey` before saving.

## 🔴 Epic 3: API Key Management (Backend Missing)
### Story 3.1: API Key Generation
- [ ] Generate `ApiKeysModule`, `ApiKeysService`, `ApiKeysController`.
- [ ] Implement `POST /api-keys`.
    - [ ] Generate secure random string.
    - [ ] Invalidate old keys for user's configuration.
    - [ ] Save new key to database.

## 🔴 Epic 4: Public Widget API (Backend Missing)
### Story 4.1: Public Widget Configuration
- [ ] Generate `WidgetModule`, `WidgetService`, `WidgetController`.
- [ ] Create `ApiKeyAuthGuard`.
    - [ ] Validate `X-API-Key` header against database.
    - [ ] Attach configuration to request object.
- [ ] Implement `GET /widget/config`.
    - [ ] Return public fields only (`widgetColor`, no sensitive data).

### Story 4.2: Chat Proxy
- [ ] Install OpenAI SDK.
- [ ] Implement `POST /widget/chat`.
    - [ ] Decrypt `openAiApiKey` from configuration.
    - [ ] Construct prompt with `faqText` context.
    - [ ] Forward request to OpenAI API.
    - [ ] Stream response back to client (SSE).

## 🟡 Epic 5: Admin Portal Setup (Frontend Partial)
- [x] **5.1 Initialize Vite React Project**.
- [x] **Components & UI**: Basic structures for Login, Register, and Dashboard exist.
- [ ] **Integration**: Connect frontend forms to the backend API once Epic 2 is built.
