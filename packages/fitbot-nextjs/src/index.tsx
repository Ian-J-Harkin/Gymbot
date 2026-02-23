"use client";

import { FitBotWidget } from '@fitbot/react';

// Re-export the React component but this file will be compiled with 
// the "use client" directive, allowing Next.js App Router users to
// drop it directly into Server Components without hydration errors.
export { FitBotWidget };
