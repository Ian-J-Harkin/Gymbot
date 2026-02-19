import { Configuration } from '@prisma/client';

export interface WidgetHistoryItem {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AiProvider {
    generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string>;
}
