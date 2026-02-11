# Integration Test Summary & Environment Setup

## Overview
This document summarizes the local integration testing environment created to validate the FitBot Widget, WordPress Plugin, and Backend API communication. A Docker-based environment was established to simulate a real-world deployment scenario with a WordPress site, a local widget build, and a mock backend server.

## 1. Environment Architecture

The setup consists of the following Docker services defined in `docker-compose.yml`:

| Service | Type | Port | Description |
| :--- | :--- | :--- | :--- |
| **wordpress** | WordPress | `8000` | The host site where the widget is embedded via the plugin. |
| **db** | MySQL 8.0 | - | Database for the WordPress installation. |
| **mock-api** | Node.js | `4000` | A lightweight Express server simulating the `fitbot-api` to test chat functionality without the full backend stack. |
| **phpmyadmin** | Tool | `8080` | DB administration interface. |
| **mailhog** | Tool | `8025` | Email testing tool. |

### Key Directories & Mounts
*   **Widget Build**: `./fitbot-widget/dist` is mounted to `/var/www/html/widget-dist` in the WordPress container. This allows the plugin to serve the local widget build directly.
*   **Plugin Source**: `./fitbot-wordpress-plugin` is mounted to `./wp-content/plugins/fitbot-wordpress-plugin`, allowing live code edits to the plugin to be reflected immediately.

## 2. Configuration & "Dev Mode"

To ensure the plugin works locally without hardcoding paths that would break production, a feature flag system was implemented:

1.  **Plugin Logic (`gymbot.php`)**:
    The plugin checks for a constant `FITBOT_DEV_MODE`:
    ```php
    if ( defined( 'FITBOT_DEV_MODE' ) && FITBOT_DEV_MODE ) {
         $script_url = '/widget-dist/gymbot.min.js'; // Local Docker Path
    } else {
         $script_url = 'https://cdn.fitbot.ai/gymbot.min.js'; // Production CDN
    }
    ```

2.  **Docker Injection**:
    The constant is injected via `WORDPRESS_CONFIG_EXTRA` in `docker-compose.yml`:
    ```yaml
    WORDPRESS_CONFIG_EXTRA: |
        define('FITBOT_DEV_MODE', true);
    ```

3.  **Widget API URL**:
    The widget is configured to point to the mock API (port 4000) instead of the default port 3000 to avoid conflicts with other local services. This is handled in `fitbot-widget/src/api/client.ts` or via build-time environment variables.

## 3. Mock API Server

A simple Node.js server was created in `tests/mock-server` to simulate the backend.
*   **Config Endpoint**: `GET /api/widget/config` - Returns standard widget styling/text configuration.
*   **Chat Endpoint**: `POST /api/widget/chat` - Streams a mock response ("This response is coming from the mock server...") using Server-Sent Events (SSE).

## 4. How to Run the Test Environment

1.  **Build the Widget**:
    ```bash
    cd fitbot-widget
    # Build pointing to the Mock API port (4000)
    # Windows PowerShell:
    $env:VITE_API_URL="http://localhost:4000/api"; npm run build
    ```

2.  **Start the Environment**:
    ```bash
    docker-compose up -d
    ```
    *(Note: Use `docker-compose up -d --build mock-api` if you modified the mock server)*

3.  **Verify**:
    *   Visit **http://localhost:8000**
    *   Click the blue chat launcher.
    *   Send a message ("Hello").
    *   Verify the streamed response and "Why did I say this?" link appear.

## 5. Troubleshooting Reference

*   **"An error occurred" in Chat**: Usually means the API is unreachable. Check if `mock-api` container is running (`docker ps`) and if the widget was built with the correct `VITE_API_URL`.
*   **Widget 404**: Ensure the `dist` folder exists (`npm run build`) and the volume mount in `docker-compose.yml` is correct.
*   **Port Conflicts**: The Mock API was moved to port `4000` to avoid conflicts with local services on port `3000`.

---
**Status**: COMPLETE. The integration test successfully validates the full loop from WordPress Plugin -> Widget -> API -> User Interface.
