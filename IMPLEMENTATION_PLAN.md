# FitBot Implementation Plan

This document tracks the progress of the FitBot project implementation against the defined user stories.

## 📌 Next Steps / Parking Lot (To Do)
- [ ] **Option A (Epic 6): Knowledge Base File Uploads** - Allow uploading PDF/DOCX files instead of just pasting text.
- [ ] **Option B (Story 8.1): Admin UX Polish** - Implement "Unsaved Changes" warning and better visual save feedback.
- [ ] **Option C (Story 7.5): Email Integration** - Create workflow to email API Key & Instructions to a web developer.

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

## ⚪ Epic 6: Advanced Knowledge Base (Planned)
### Story 6.1: File Upload Support (Text/Markdown)
- [ ] Backend: Create `UploadsModule` or extend `ConfigurationsModule`.
- [ ] Backend: Implement `POST /configurations/knowledge/upload` for `.txt` and `.md`.
- [ ] Frontend: Add file picker to **Knowledge Base** tab.
- [ ] Logic: Append file content to `faqText` context.

### Story 6.2: Rich Document Processing (PDF/Word)
- [ ] Research & Select parsing libraries (e.g., `pdf-parse`, `mammoth`).
- [ ] Backend: Extend upload endpoint to handle `.pdf` and `.docx`.
- [ ] Backend: Extract text content from binary formats.
- [ ] Frontend: Display uploaded file list and status.

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
- [ ] Implement a "Connect to Gymbot" button in WP Admin using OAuth or simple Key exchange.
    - *Alternative (MVP)*: Improved Key Input with "Verify Connection" button.
- [ ] Add status indicator: 🟢 Connected / 🔴 Disconnected.
- [ ] Display basic bot stats in WP Admin (e.g., "Bot is active", "Last chat: 2m ago").

### Story 7.3: Connection Verification (End-to-End Test)
- [ ] **Backend**: Add `HEAD /api/widget/health` endpoint that validates API Key.
- [ ] **Frontend (WP)**: In plugin settings, AJAX call to check key validity before saving.
- [ ] **Frontend (Widget)**: Display a friendly "Setup Needed" screen if key is invalid (Already implemented in Widget UI).

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

### Story 8.1: Admin UX Polish (Added based on feedback)
- [ ] **Unsaved Changes Indicator**: Show a warning if user tries to navigate away with unsaved changes.
- [ ] **Save Feedback**: Change "Save" button to "Saved!" (green) temporarily on success.
- [ ] **Validation Feedback**: Improve error visibility for fields like "Knowledge Base" (min length).
