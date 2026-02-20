# Implementation Plan: @fitbot/react Component

This plan details the steps to create and publish the `@fitbot/react` component, which serves as the "React Plugin Equivalent" for the FitBot ecosystem.

## Goal
Create a distributable React component that allows developers to easily integrate the FitBot widget into their React applications through a standard npm package, mirroring the simplicity of the WordPress plugin.

## Package Architecture

**Directory**: `packages/fitbot-react` (New workspace or standalone package)

**Component API**:
```tsx
import { FitBotWidget } from '@fitbot/react';

function App() {
  return (
    <FitBotWidget
      apiKey="your_api_key_here"
      apiUrl="https://your-api-url.com/api" // Optional, defaults to production URL if set
      theme={{
        primaryColor: '#2563EB', // Overrides backend config if needed
        position: 'bottom-right'
      }}
    />
  );
}
```

## Implementation Steps

### 1. Package scaffolding
- [ ] Create `packages/fitbot-react` directory.
- [ ] Initialize `package.json` with `react` and `react-dom` as peer dependencies.
- [ ] Configure `tsup` or `vite` for library mode bundling (creating `.js` and `.d.ts` files).

### 2. Component Implementation
- [ ] Create `src/FitBotWidget.tsx`.
- [ ] Implement `useScript` hook or logic to inject the widget script from the CDN/hosted URL.
    - *Crucial*: This component acts as a **wrapper** around the vanilla JS widget, ensuring they talk to the same global instance.
- [ ] Pass props (`apiKey`, `apiUrl`) to the underlying widget instance via `window.FITBOT_CONFIG` or data attributes on the script tag.

### 3. Build & Publish Configuration
- [ ] Configure `tsconfig.json` for type generation.
- [ ] Set up `npm publish` workflow (simulated for now with local linking).

### 4. Integration Verification
- [ ] Link locally to `fitbot-react-demo` (to be created in Epic 15) to verify it works.

## Technical Considerations
- **Script Loading**: The component must handle script loading states (loading, loaded, error) gracefully. It should not inject the script multiple times if the component re-renders.
- **Cleanup**: On unmount, should it remove the widget? Typically widgets persist, but for a React SPA, navigating away might require hiding/showing or destroying the instance.
- **Type Safety**: distribute TypeScript definitions (`.d.ts`) so consumers get autocomplete for props.
