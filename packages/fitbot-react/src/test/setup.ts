import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
    cleanup();
    // Manually clean up any scripts or root elements added to the body during tests
    document.body.innerHTML = '';
    delete (window as any).FITBOT_API_KEY;
    delete (window as any).FITBOT_API_URL;
});
