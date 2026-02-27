export type AiProvider = 'openai' | 'openrouter' | 'ollama' | 'huggingface';

export interface ChatbotConfiguration {
  id: string;
  userId: string;
  widgetColor: string;
  faqText: string;
  aiProvider: AiProvider;
  openAiApiKey: string;
  openRouterApiKey: string;
  huggingFaceApiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  widgetTitle?: string;
  systemInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationRequest {
  widgetColor: string;
  faqText: string;
  aiProvider: AiProvider;
  openAiApiKey?: string;
  openRouterApiKey?: string;
  huggingFaceApiKey?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  widgetTitle?: string;
  systemInstructions?: string;
}

export interface ConfigurationResponse {
  userId: string;
  widgetColor: string;
  faqText: string;
  aiProvider: AiProvider;
  openAiApiKey: string;
  openRouterApiKey: string;
  huggingFaceApiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
  widgetTitle?: string;
  systemInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
  apiKey?: {
    key: string;
  };
}