export interface Source {
    id: string;
    fileName: string;
    content: string;
}

export interface ExplanationMetadata {
    provider: string;
    model: string;
    contextUsed: string;
    contextLength: number;
    systemPromptSummary: string;
    responseTimeMs: number;
    timestamp: string;
    sources?: Source[];
}

export interface WidgetConfig {
    widgetColor: string;
    widgetTitle?: string;
    greetingMessage?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    explanation?: ExplanationMetadata;
    isStreaming?: boolean;
}
