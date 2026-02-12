export interface Source {
    id: string;
    fileName: string;
    content: string; // The text snippet used
}

export interface ExplanationMetadata {
    provider: string;           // "openai" | "openrouter" | "ollama"
    model: string;              // "gpt-3.5-turbo", "llama3", etc.
    contextUsed: string;        // summary or hash of FAQ text provided
    contextLength: number;      // character count of FAQ injected
    systemPromptSummary: string;
    responseTimeMs: number;
    timestamp: string;
    validationResults?: any[];  // Flags or results from validation service
    sources?: Source[];         // Document snippets retrieved
}
