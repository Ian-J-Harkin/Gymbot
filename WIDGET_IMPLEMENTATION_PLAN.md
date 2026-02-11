---
description: Build the FitBot Frontend Chat Widget (Vanilla JS)
---

# Feature: Frontend Chat Widget Implementation

## Goal
Create a standalone, framework-agnostic JavaScript widget (`widget.js`) that gym owners can embed on their websites. This widget will handle the chat UI, communication with the `fitbot-api`, and displaying responses (including the new explanation layer).

## Requirements (from PRD & Explanation Layer)
1.  **Tech Stack**: Vanilla JavaScript (no heavy frameworks like React/Vue to keep bundle size low).
2.  **CSS**: Scoped CSS or Shadow DOM to prevent style bleeding from the host site.
3.  **Authentication**: Uses the `X-API-Key` header (GymBot API Key) to fetch config and send messages.
4.  **Configuration**: Fetches colors and initial settings from `GET /widget/config`.
5.  **Chat Interface**:
    - Floating launcher button (bottom-right).
    - Chat window with history.
    - Input field and send button.
    - Markdown rendering for AI responses (optional but recommended for links/lists).
6.  **Streaming Support**: Must handle Server-Sent Events (SSE) for real-time typing effects.
7.  **Explanation Layer**:
    - Parse the final SSE event containing `{ explanation: ... }`.
    - Display a "Why did I say this?" toggle or icon.
    - Render the explanation metadata (context used, confidence, etc.) when requested.

## Implementation Steps

1.  **Project Setup**:
    - Create a new directory `fitbot-widget` adjacent to `fitbot-api`.
    - Initialize with `package.json` for tooling (Vite/Webpack for bundling).

2.  **Development Workflow**:
    - `src/main.js`: Entry point.
    - `src/ui.js`: DOM manipulation class (Chat window, bubbles).
    - `src/api.js`: Fetch wrapper for `fitbot-api`.
    - `src/styles.css`: CSS variables based on config.

3.  **Core Logic**:
    - **Initialization**:
        - Read `data-api-key` from the script tag.
        - Call `GET /widget/config`.
        - Apply `widgetColor` to CSS variables.
        - Render the launcher button.
    - **Messaging**:
        - On send, append user message to DOM.
        - Call `POST /widget/chat` with history.
        - Handle `EventSource` or `fetch` stream reader.
        - Append AI chunks as they arrive.
    - **Explanation Handling**:
        - Listen for specific event type or parse JSON chunks.
        - Store explanation object.
        - Append "Show Explanation" button to the AI message.

4.  **Build Pipeline**:
    - Configure bundler to output a single `gymbot.min.js`.
    - ensure assets (icons/styles) are inlined or strictly managed.

## Directory Structure Proposal
```
/fitbot-widget
  /src
    main.ts       # Entry point, setup
    chat-ui.ts    # Class to manage DOM elements
    api-client.ts # Handles API calls & streaming
    styles.css    # Widget styling
  package.json
  vite.config.ts  # Build configuration
```

## User Story Mapping
- **Story 4.1**: Floating Icon -> `ChatUI.renderLauncher()` (Done)
- **Story 4.2**: Frontend UI -> `ChatUI.renderWindow()` (Done)
- **Story 4.3**: Chat API -> `ApiClient.sendMessage()` (Done)
- **Story 4.6**: Streaming Responses -> `ApiClient.streamResponse()` (Done)
- **Story 6.1**: Explanation Metadata Display -> `ExplanationItem` component (Done)
- **Story 7.1**: Standalone Bundle -> `Vite` build (Done)
- **Story 7.2**: User Documentation -> `WIDGET_INSTALLATION_GUIDE.md` (Done)

## Next Step
- Phase 4: Retrieved Context Tracking (Backend)
- Phase 5: Audit Log Explorer (fitbot-admin)

