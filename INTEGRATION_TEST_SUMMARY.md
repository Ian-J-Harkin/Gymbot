# Manual Integration Test Guide

This guide outlines the steps to verify the FitBot integration end-to-end, connecting the local Dockerized WordPress environment to the local FitBot Backend running on the host machine.

**Prerequisites:**
- `fitbot-api` running on port 3000 (Host).
- `fitbot-admin` running on port 3001 (Host).
- Docker containers (`wordpress`, `db`) running via `docker-compose up`.
- `fitbot-widget` rebuilt for local api (Completed).

## Step 1: Configure Backend & Get API Key
1.  Open [FitBot Admin Dashboard](http://localhost:3001).
2.  **Login/Register** if needed.
3.  Navigate to **Configuration**.
4.  **Knowledge Base Tab**: Enter test data (e.g., "Our gym is open 24/7. Membership is $50/month.").
5.  **AI Model Tab**: Select "Ollama" (ensure Ollama is running locally).
6.  **Installation Tab**: 
    - Click **Generate API Key**.
    - **Copy** the generated key to your clipboard.

## Step 2: Configure WordPress Plugin
1.  Open [WordPress Admin](http://localhost:8000/wp-admin).
2.  Login with your WordPress credentials (if prompted to install, follow the setup).
3.  Go to **Settings > FitBot**.
4.  **Paste** the API Key from Step 1 into the "FitBot API Key" field.
5.  Click **Save Changes**.

## Step 3: Test the Chatbot
1.  Visit the [WordPress Homepage](http://localhost:8000).
2.  Click the blue **FitBot Chat Bubble** in the bottom-right corner.
3.  Type a message: *"How much is membership?"*
4.  **Verify**:
    - The bot responds with context from your Knowledge Base ("$50/month").
    - The response streams in real-time.

## Troubleshooting
- **Connection Failed?** Ensure `fitbot-api` is running on port 3000.
- **Wrong Response?** Check your Knowledge Base data and ensure "Ollama" is selected.
- **Widget Not Loading?** Ensure `npm run build` was run in `fitbot-widget` directory (already completed).
- **Docker Errors?** If you see `error during connect`, ensure **Docker Desktop** is running. Restart it if necessary, then run `docker-compose up -d`.

---
*Note: The widget is loaded from local `fitbot-widget/dist` mounted into the WordPress container via Docker volumes. Rebuilding the widget updates the WordPress site instantly.*
