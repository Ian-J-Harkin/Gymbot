# Manual Test Plan: Dashboard Navigation & Knowledge Base

> [!IMPORTANT]
> **Which path are you testing?**
> - **Full Application (Admin Dashboard)**: Start at **Step 0** and proceed through **Step 4**. (Requires full WordPress/Nest local stack).
> - **React Integration Demo (Dockerized)**: Skip to **Step 5**. (Requires only the Dockerized Setup in Option B).

## 0. Daily Start / Quick Health Check
**Objective**: Ensure the local environment is healthy before starting manual testing.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 0.1 | Run React Component Unit Tests: `cd packages/fitbot-react && npm test` | All 5 tests should pass. |
| 0.2 | (Optional) Start Docker Environment: `docker compose -f docker-compose.react-test.yml up --build` | All containers (postgres, api, react-demo) should start without errors. |

---

## 1. Dashboard Navigation & Structure
**Objective**: Verify the new tab structure and navigation.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Navigate to the Admin Dashboard. | The default landing tab should be **"Overview"**. |
| 1.2 | Verify the sidebar/tab navigation links. | You should see: **Overview**, **AI Brain**, **Knowledge Base**, **Widget**, **Audit Logs**, **Subscription**. |
| 1.3 | Click on **"AI Brain"**. | The view should switch to the AI Provider configuration (API Keys, Model selection). |
| 1.4 | Click on **"Widget"**. | The view should switch to the Widget configuration (Color picker, Embed code). |
| 1.5 | Click on **"Knowledge Base"**. | The view should switch to the Document Upload & Quick Start Data screen. |

---

## 2. "AI Brain" Tab
**Objective**: Verify that AI provider settings are isolated and save correctly.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Select an AI Provider (e.g., OpenAI). | The corresponding API Key field should appear. |
| 2.2 | Enter a valid API Key. | The input should accept text. |
| 2.3 | Click **"Save Brain Configuration"**. | A success message ("AI Brain updated successfully!") should appear. |
| 2.4 | Refresh the page. | The settings (Provider, API Key) should persist. |

---

## 3. "Widget" Tab
**Objective**: Verify that widget styling and embed code are isolated and functional.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Change the **Primary Brand Color** using the color picker. | The "Live Preview" chat bubble should immediately update to the new color. |
| 3.2 | Click **"Save Design Settings"**. | A success message ("Widget settings updated successfully!") should appear. |
| 3.3 | Refresh the page. | The selected color should persist. |
| 3.4 | Locate the **Embed Code** section. | A code snippet (`<script src="...">`) should be visible. |

---

## 4. "Knowledge Base" Tab - Quick Start Logic
**Objective**: Verify the "Binary Choice" logic between Quick Start Data and Document Uploads.

### Scenario A: Empty State (No Documents)
*Pre-condition*: Ensure no documents are uploaded in the "Uploaded Documents" list.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Navigate to **"Knowledge Base"**. | The "Quick Start Data" accordion should be **Expanded** by default. |
| 4.2 | Verify the "Quick Start Data" section availability. | The text area and "Save Text" button should be **Enabled** (fully opaque, clickable). |
| 4.3 | Enter text into the "Quick Start Data" field. | You should be able to type freely. |
| 4.4 | Click **"Save Text"**. | A success message should appear, and the text should be saved. |

### Scenario B: Documents Exist (Disabled State)
*Pre-condition*: Upload at least one document (PDF, TXT, DOCX).

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.5 | Upload a file via the "Upload File" button. | The file should appear in the list. The "Quick Start Data" section should **automatically collapse** (optional but good UX) or update its state. |
| 4.6 | Expand the "Quick Start Data" accordion (if collapsed). | The header should say **"Quick Start Data - Disabled (Files Uploaded)"**. |
| 4.7 | Verify the header styling. | The text and icons should be **Dark Gray** (high contrast). |
| 4.8 | Check the "Quick Start Data" content. | 1. An **Info Banner** should appear explaining why it's disabled.<br>2. The text area and buttons should be **Disabled** (grayed out background, unclickable).<br>3. The text area should be read-only. |

### Scenario C: Re-enabling Quick Start
*Pre-condition*: You have at least one document uploaded.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.9 | Delete **ALL** uploaded documents from the list. | As soon as the last document is removed, the "Quick Start Data" section should become **Enabled** again. |
| 4.10 | Verify the "Quick Start Data" section. | The banner should disappear, and the text area should become editable again. |

---

## 5. React Demo App (Task 15.1)
**Objective**: Verify the standalone `fitbot-react-demo` successfully loads the widget via the `@fitbot/react` package.

- **Option A: Local Manual Setup** (Requires local Postgres/Node)
  - **API Server**: Running on port 3000.
    ```bash
    cd fitbot-api
    npm run start:dev
    ```
  - **Demo App**: Running on port 5173.
    ```bash
    cd demos/fitbot-react-demo
    npm run dev
    ```
  - **Widget Build**: Ensure the widget is built and available (if serving locally).
    ```bash
    cd fitbot-widget
    npm run build
    ```

- **Option B: Dockerized Setup** (Recommended for clean environment)
  1. **Clean Start**:
     ```bash
     docker compose -f docker-compose.react-test.yml down -v
     ```
  2. **Start Services**:
     ```bash
     docker compose -f docker-compose.react-test.yml up -d --build
     ```
  3. **Initialize Database** (Required first time):
     ```bash
     docker compose -f docker-compose.react-test.yml exec api npx prisma db push --accept-data-loss
     docker compose -f docker-compose.react-test.yml exec api npx ts-node seed-test.ts
     ```
  - **Ports**: API (3005), Demo (5173), Postgres (5434).
  - **Test API Key**: `demo-api-key-123`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Open `http://localhost:5173` in your browser. | The "FitBot React Integration Demo" landing page should load. |
| 5.2 | Observe the bottom-right corner. | The FitBot launcher bubble should appear after a brief delay. |
| 5.3 | Click the launcher bubble. | The chat window should open. |
| 5.4 | Verify the greeting message. | It should match the default or configured greeting ("Welcome to the React Demo!"). |

---

## 6. Functional Parity (Task 15.2)
**Objective**: Ensure the React component offers the same capabilities as the WordPress plugin.

### 6.1 Configuration Injection
| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1.1 | In the Demo App UI, change the "Primary Color" input to a distinct color (e.g., `#00FF00` Lime Green). | The chat bubble and window header should **immediately** update to reflect the new color. |
| 6.1.2 | Change the "Position" dropdown to "Bottom Left". | The widget should move to the bottom-left corner of the screen. |
| 6.1.3 | Enter a custom API Key in the input field. | The widget should reload/re-initialize (check console for `[FitBot] Initialized` logs if available). |

### 6.2 Chat Functionality
| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.2.1 | Send a message: "Hello, testing". | The message should appear in the chat history. |
| 6.2.2 | Wait for response. | Parameters: <br>1. Typing indicator appears.<br>2. AI response is received.<br>3. If RAG is active, "Sources" should be expandable. |

### 6.3 State Retention
| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.3.1 | Close the chat window. | The window should minimize to the launcher bubble. |
| 6.3.2 | Re-open the chat window. | The previous conversation history ("Hello, testing") should still be visible. |

---

## Appendix: Troubleshooting & Integration Notes

This section documents key architectural decisions, edge cases, and hard-won lessons from testing the React Demo and AI integrations.

### 1. Docker to Host Communication (Ollama)
**How it works**: By default, applications running inside a Docker container cannot access services running on your local Windows PC (like a locally installed Ollama instance) via `localhost`, because in Docker, `localhost` means the container itself.
**The Solution**: Docker Desktop for Windows provides the special DNS name `host.docker.internal`.
- When the `fitbot-api` container tries to reach `http://host.docker.internal:11434`, Docker explicitly routes that request out of the container's isolated network bridge and back to your Windows host machine on port 11434, where Ollama is listening. 

### 2. Parameter Passing: `docker exec` vs `docker compose exec`
When passing inline environment variables to a running container, there is a critical distinction:
- **`docker compose exec`**: Explicitly *drops* inline environment variables (like `-e AI_PROVIDER=ollama`) unless they are also predefined in the original `docker-compose.yml` file. This can silently cause scripts to fall back to hardcoded defaults (like OpenAI).
- **`docker exec`**: Respects inline environment variables dynamically.
- **Rule of Thumb**: When dynamically switching variables during local testing (like changing AI providers on the fly in `seed-test.ts`), always use standard `docker exec`.

### 3. React Strict Mode & 3rd-Party Scripts
When testing the widget inside a React Demo (`fitbot-react`), you may encounter the error: `SyntaxError: Identifier 'go' has already been declared`.
- **Cause**: React Strict Mode intentionally mounts, unmounts, and re-mounts components in development to catch side effects. If the React component removes the `<script src="gymbot.min.js">` tag on unmount, the DOM node is deleted, but the JavaScript variables it declared remain in the browser's memory. When the script is injected a second time on the immediate re-mount, the browser hits a redeclaration conflict.
- **Resolution**: The `FitBotWidget.tsx` component intentionally leaves the `<script>` tag in the `<head>` on unmount. It relies on a pre-existing element check to prevent duplicate injection. The actual UI `<div>` is still removed, ensuring visual cleanliness while preventing memory conflicts. This is the industry-standard approach for non-idempotent 3rd-party widget integrations.

### 4. Prisma P2021 Errors on Fresh Builds
If you encounter `PrismaClientInitializationError: P2021` (Table does not exist) when running the E2E tests or starting the API:
- **Cause**: The PostgreSQL container successfully started and bound to the port, but the Prisma schema tables have not been generated inside it yet.
- **Resolution**: You must explicitly push the schema before running dependent scripts:
  `docker exec fitbot-api npx prisma db push --accept-data-loss`

### 5. API Prefix Routing (404s)
If the React Demo receives `404 Not Found` for endpoints like `/widget/config`:
- **Cause**: NestJS applies global routing prefixes (`app.setGlobalPrefix('api');`).
- **Resolution**: Ensure the `.env` or Docker `environment` variables explicitly append `/api` to the root URL (e.g., `VITE_FITBOT_API_URL=http://localhost:3005/api`).
