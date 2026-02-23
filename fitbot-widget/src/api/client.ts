import type { WidgetConfig } from '../types';

<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:3002/api';
console.log('FitBot Widget API URL:', API_BASE_URL);


=======
>>>>>>> feat/kb-uploads-and-security
export class ApiClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    async getConfig(): Promise<WidgetConfig> {
        const response = await fetch(`${this.baseUrl}/widget/config`, {
            headers: {
                'X-API-Key': this.apiKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Failed to fetch configuration: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Invalid JSON received from server:', responseText.substring(0, 200));
            throw new Error('Invalid JSON response from server');
        }
    }

    async *streamChat(message: string, history: any[]): AsyncGenerator<string | { explanation: any }> {
        const response = await fetch(`${this.baseUrl}/widget/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
            body: JSON.stringify({ message, history }),
        });

        if (!response.ok) {
            const error = await response.json();
            yield error.message || 'An error occurred';
            return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataText = line.substring(6).trim();
                    if (!dataText) continue;

                    if (dataText === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(dataText);
                        if (parsed.content) {
                            yield parsed.content;
                        } else if (parsed.explanation) {
                            yield { explanation: parsed.explanation };
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
    }
}
