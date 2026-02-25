import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from './client';

describe('ApiClient Unit Tests', () => {
    let client: ApiClient;

    beforeEach(() => {
        vi.resetAllMocks();
        client = new ApiClient('test-key', 'http://localhost:3000/api');
        global.fetch = vi.fn();
    });

    it('should parse valid JSON response', async () => {
        const mockConfig = { widgetColor: '#000', greetingMessage: 'Hi' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockConfig,
            text: async () => JSON.stringify(mockConfig),
        });

        const config = await client.getConfig();
        expect(config).toEqual(mockConfig);
    });

    it('should throw "Invalid JSON" when server returns HTML', async () => {
        const htmlResponse = '<!DOCTYPE html><html>...</html>';
        (global.fetch as any).mockResolvedValue({
            ok: true, // Server says 200 OK (common SPA fallback behavior)
            text: async () => htmlResponse,
            json: async () => { throw new Error('Invalid JSON'); }
        });

        await expect(client.getConfig()).rejects.toThrow('Invalid JSON response from server');
    });

    it('should throw "Failed to fetch" on 404/500 errors', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Not Found',
        });

        await expect(client.getConfig()).rejects.toThrow('Failed to fetch configuration: 404 Not Found');
    });

    describe('streamChat', () => {
        it('should yield content chunks from stream', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('data: {"content": "Hello"}\n\n'));
                    controller.enqueue(new TextEncoder().encode('data: {"content": " World"}\n\n'));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            (global.fetch as any).mockResolvedValue({
                ok: true,
                body: mockStream
            });

            const chunks = [];
            for await (const chunk of client.streamChat('hi', [])) {
                chunks.push(chunk);
            }

            expect(chunks).toEqual(['Hello', ' World']);
        });

        it('should handle "Invalid Model" error message from server', async () => {
            const errorMessage = "I'm sorry, I encountered an error: Configuration Error";
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(`data: {"content": "${errorMessage}"}\n\n`));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            (global.fetch as any).mockResolvedValue({
                ok: true,
                body: mockStream
            });

            const chunks = [];
            for await (const chunk of client.streamChat('hi', [])) {
                chunks.push(chunk);
            }

            expect(chunks).toContain(errorMessage);
        });

        it('should handle empty Knowledge Base (server fallback)', async () => {
            const fallbackMessage = "I don't know the answer.";
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(`data: {"content": "${fallbackMessage}"}\n\n`));
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            (global.fetch as any).mockResolvedValue({
                ok: true,
                body: mockStream
            });

            const chunks = [];
            for await (const chunk of client.streamChat('question', [])) {
                chunks.push(chunk);
            }

            expect(chunks).toContain(fallbackMessage);
        });
    });
});
