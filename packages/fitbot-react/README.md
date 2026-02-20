# @fitbot/react

The official React component for integrating the **FitBot AI Chat Widget** into your React applications.

This package provides a drop-in component that mirrors the functionality of the official FitBot WordPress plugin, but designed specifically for modern React environments (Next.js, Vite, CRA, etc.).

**Zero Code Shared**: This is a pure React implementation that injects the vanilla FitBot runtime. It does *not* contain or rely on any WordPress/PHP code.

## Installation

```bash
npm install @fitbot/react
# or
yarn add @fitbot/react
# or
pnpm add @fitbot/react
```

## Usage

Import the widget and place it anywhere in your app (typically near the root, e.g., in `App.tsx` or `layout.tsx`).

```tsx
import { FitBotWidget } from '@fitbot/react';

function App() {
  return (
    <>
      <YourAppContent />
      
      <FitBotWidget
        apiKey="YOUR_API_KEY_HERE"
        // Optional: Override backend config
        theme={{
          primaryColor: '#ff4757', 
          position: 'bottom-right',
          greeting: 'Hello! Ask me anything about our gym.'
        }}
      />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **Required** | Your project's API key from the FitBot Admin Dashboard. |
| `apiUrl` | `string` | `undefined` | (Optional) Override the API endpoint. Useful for self-hosted instances. |
| `scriptUrl` | `string` | CDN URL | (Advanced) Point to a custom version of the `gymbot.min.js` runtime. |

> [!NOTE]
> **Theme Customization**: Support for runtime theme overrides (e.g., custom colors, positioning) is currently **deferred** to maintain strict functional parity with the WordPress plugin. This will be added in a future release once the global Styling API is finalized.

## How it Works

This component acts as a lightweight wrapper. When mounted, it:
1.  Injects the hosted `gymbot.min.js` script tag into the document `body`.
2.  Passes your configuration (API Key, Theme) to the global window scope where the widget runtime can read it.
3.  Ensures only one instance of the script is loaded, even if the component re-renders.

This ensures your React app always loads the latest version of the chat logic without needing to update this package.
