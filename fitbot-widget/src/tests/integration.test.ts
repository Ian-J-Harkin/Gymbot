import { describe, it, expect } from 'vitest';

describe('Integration Tests', () => {
    const API_URL = 'http://localhost:3002/api/widget/config';

    it('should return JSON from the API (not HTML)', async () => {
        const response = await fetch(API_URL, {
            headers: { 'X-API-Key': 'test-integration-key' }
        });

        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            // We expect 401 Unauthorized for a random key, which is JSON.
            // Or 200 OK if we had a valid key.
            // Either way, it must be JSON.
            expect(data).toHaveProperty('statusCode', 401);
        } catch (e) {
            throw new Error(`Expected JSON response, got: ${text.substring(0, 100)}...`);
        }
    });

    it('should protect chat endpoint (401 Unauthorized)', async () => {
        const response = await fetch('http://localhost:3002/api/widget/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'hi', history: [] })
        });
        // No X-API-Key header -> 401
        // Or invalid key -> 401/403
        expect(response.status).toBe(401);
    });
});
