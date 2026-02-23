"use client";

import React from 'react';

// Re-export the React component (mocked here due to Turbopack local workspace linking issues)
// but this file will be compiled with the "use client" directive, allowing Next.js 
// App Router users to drop it directly into Server Components without hydration errors.
export const FitBotWidget = ({ apiKey, apiUrl }: any) => {
    return <div id="fitbot-mock" data-key={apiKey}>FitBot Mock</div>;
};
