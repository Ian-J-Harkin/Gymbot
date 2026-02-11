export interface ExplanationMetadata {
    provider: string;
    model: string;
    contextUsed: string;
    contextLength: number;
    systemPromptSummary: string;
    responseTimeMs: number;
    timestamp: string;
}

export interface WidgetConfig {
    widgetColor: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    explanation?: ExplanationMetadata;
    isStreaming?: boolean;
}
