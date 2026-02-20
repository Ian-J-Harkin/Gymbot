import React, { useEffect, useRef } from 'react';

export interface FitBotWidgetProps {
    /** The API key for your FitBot project */
    apiKey: string;
    /** Optional override for the backend API URL. Defaults to 'https://api.fitbot.chat' (placeholder) */
    apiUrl?: string;
    /** URL to the hosted widget script (gymbot.min.js) */
    scriptUrl?: string;
}

const DEFAULT_SCRIPT_URL = 'https://cdn.fitbot.chat/widget/v1/gymbot.min.js'; // Placeholder URL

declare global {
    interface Window {
        FITBOT_API_KEY?: string;
        FITBOT_API_URL?: string;
        // TODO: FITBOT_THEME?: FitBotTheme; (Deferred enhancement for parity sync)
    }
}

export const FitBotWidget: React.FC<FitBotWidgetProps> = ({
    apiKey,
    apiUrl,
    scriptUrl = DEFAULT_SCRIPT_URL,
}) => {
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        // 1. Set global configuration for the script to pick up
        window.FITBOT_API_KEY = apiKey;
        if (apiUrl) window.FITBOT_API_URL = apiUrl;

        // 2. Check if script is already present
        const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.async = true;
            script.setAttribute('data-api-key', apiKey); // Redundant but good for static analyzers
            if (apiUrl) script.setAttribute('data-api-url', apiUrl);

            document.body.appendChild(script);
            scriptRef.current = script;
        }

        return () => {
            // Cleanup
            if (scriptRef.current && scriptRef.current.parentNode) {
                scriptRef.current.parentNode.removeChild(scriptRef.current);
            }

            const widgetRoot = document.getElementById('fitbot-widget-root');
            if (widgetRoot && widgetRoot.parentNode) {
                widgetRoot.parentNode.removeChild(widgetRoot);
            }
        };
    }, [apiKey, apiUrl, scriptUrl]);

    return null;
};
