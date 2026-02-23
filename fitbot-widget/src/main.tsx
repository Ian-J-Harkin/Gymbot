import { render } from 'preact';
import { ChatWidget } from './components/ChatWidget';
import './style.css';

function init() {
    const scriptTag = document.currentScript as HTMLScriptElement;
    const apiKey = scriptTag?.getAttribute('data-api-key') || (window as any).FITBOT_API_KEY;
    const apiUrl = scriptTag?.getAttribute('data-api-url')
        || (window as any).FITBOT_API_URL
        || import.meta.env.VITE_API_URL
        || 'http://localhost:3000/api';

    if (!apiKey) {
        console.error('FitBot: API key missing. Please provide data-api-key attribute.');
        return;
    }

    const container = document.createElement('div');
    container.id = 'fitbot-widget-root';
    document.body.appendChild(container);

    render(<ChatWidget apiKey={apiKey} apiUrl={apiUrl} />, container);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
