import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FitBotWidget } from './FitBotWidget';
import React from 'react';

describe('FitBotWidget', () => {
    const API_KEY = 'test-api-key';
    const API_URL = 'https://test-api.com';
    const CUSTOM_SCRIPT_URL = 'https://cdn.example.com/gymbot.min.js';

    beforeEach(() => {
        // Reset globals
        delete (window as any).FITBOT_API_KEY;
        delete (window as any).FITBOT_API_URL;
        document.body.innerHTML = '';
    });

    it('should inject the script tag into the body', () => {
        render(<FitBotWidget apiKey={API_KEY} />);

        const script = document.querySelector('script[src="https://cdn.fitbot.chat/widget/v1/gymbot.min.js"]');
        expect(script).toBeTruthy();
        expect(script?.getAttribute('data-api-key')).toBe(API_KEY);
    });

    it('should set global window variables', () => {
        render(<FitBotWidget apiKey={API_KEY} apiUrl={API_URL} />);

        expect(window.FITBOT_API_KEY).toBe(API_KEY);
        expect(window.FITBOT_API_URL).toBe(API_URL);
    });

    it('should use a custom script URL if provided', () => {
        render(<FitBotWidget apiKey={API_KEY} scriptUrl={CUSTOM_SCRIPT_URL} />);

        const script = document.querySelector(`script[src="${CUSTOM_SCRIPT_URL}"]`);
        expect(script).toBeTruthy();
    });

    it('should remove the script tag and widget root on unmount', () => {
        const { unmount } = render(<FitBotWidget apiKey={API_KEY} />);

        // Add a mock widget root to simulate what the script would do
        const root = document.createElement('div');
        root.id = 'fitbot-widget-root';
        document.body.appendChild(root);

        expect(document.querySelector('script')).toBeTruthy();
        expect(document.getElementById('fitbot-widget-root')).toBeTruthy();

        unmount();

        expect(document.querySelector('script')).toBeNull();
        expect(document.getElementById('fitbot-widget-root')).toBeNull();
    });

    it('should not inject the script twice if already present', () => {
        const script = document.createElement('script');
        script.src = 'https://cdn.fitbot.chat/widget/v1/gymbot.min.js';
        document.body.appendChild(script);

        render(<FitBotWidget apiKey={API_KEY} />);

        const scripts = document.querySelectorAll('script[src="https://cdn.fitbot.chat/widget/v1/gymbot.min.js"]');
        expect(scripts.length).toBe(1);
    });
});
