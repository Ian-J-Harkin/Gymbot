/**
 * Shared constants for the FitBot API.
 * Centralises magic strings and numbers that were previously scattered across the codebase.
 */

// ─── AI Providers ────────────────────────────────────────────────────────────

export const AI_PROVIDERS = {
    OPENAI: 'openai',
    OPENROUTER: 'openrouter',
    OLLAMA: 'ollama',
} as const;

export const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-3.5-turbo';
export const DEFAULT_OLLAMA_MODEL = 'llama3';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_REFERER = 'https://fitbot.app';
export const OPENROUTER_TITLE = 'FitBot';

// ─── Widget / UI Defaults ────────────────────────────────────────────────────

export const DEFAULT_WIDGET_COLOR = '#2563EB';
export const DEFAULT_GREETING_MESSAGE = 'How can I help you?';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const BCRYPT_SALT_ROUNDS = 10;
export const JWT_EXPIRY = '60m';

// ─── RAG / Document Processing ───────────────────────────────────────────────

export const RAG_TOP_K = 4;
export const RAG_CHUNK_SIZE = 1000;
export const RAG_CHUNK_OVERLAP = 200;
export const MIN_EXTRACTED_CONTENT_LENGTH = 10;

// ─── File Upload ─────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_EXTENSIONS = ['pdf', 'docx', 'txt'] as const;
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    txt: ['text/plain'],
};

// ─── Chat / Validation ──────────────────────────────────────────────────────

export const MAX_CHAT_MESSAGE_LENGTH = 4000;

// ─── API Keys ────────────────────────────────────────────────────────────────

export const API_KEY_STATUS_ACTIVE = 'ACTIVE';
export const TOKEN_STORAGE_KEY = 'fb_token';

// ─── Pagination ──────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// ─── System Prompt ───────────────────────────────────────────────────────────

export const DEFAULT_SYSTEM_PROMPT_PREFIX =
    'You are a helpful gym assistant AI. Answer questions based on the following knowledge:';
