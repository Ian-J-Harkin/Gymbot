# Manual Test Plan: Dashboard Navigation & Knowledge Base

## Overview
This document references the recent changes to the GymBot Dashboard, specifically the restructuring of the "AI Brain" / "Widget" tabs and the new "Quick Start Data" behavior in the "Knowledge Base" tab.

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
  - **Single Command**: Starts Postgres, API, and the React Demo.
    ```bash
    docker compose -f docker-compose.react-test.yml up --build
    ```
  - **Ports**: API (3000), Demo (5173), Postgres (5433).

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
