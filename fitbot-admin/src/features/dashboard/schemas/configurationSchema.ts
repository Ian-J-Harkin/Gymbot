import { z } from 'zod';

export const configurationSchema = z.object({
  primaryColor: z
    .string()
    .min(1, 'Primary color is required')
    .regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color (e.g., #FF5733)'),
  faqData: z
    .string()
    .optional()
    .or(z.string().min(0)),
  aiProvider: z.enum(['openai', 'openrouter', 'ollama']),
  openaiApiKey: z.string().optional(),
  openRouterApiKey: z.string().optional(),
  ollamaUrl: z.string().optional(),
  ollamaModel: z.string().optional(),
}).refine((data) => {
  if (data.aiProvider === 'openai' && (!data.openaiApiKey || data.openaiApiKey.length === 0)) {
    return false;
  }
  if (data.aiProvider === 'openrouter' && (!data.openRouterApiKey || data.openRouterApiKey.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'API key is required for the selected provider',
  path: ['openaiApiKey'],
});

export type ConfigurationFormData = z.infer<typeof configurationSchema>;

// Preset colors for gym themes
export const GYM_COLOR_PRESETS = [
  { name: 'Bold Red', value: '#DC2626' },
  { name: 'Electric Blue', value: '#2563EB' },
  { name: 'Slate Gray', value: '#475569' },
  { name: 'Orange Energy', value: '#EA580C' },
  { name: 'Green Power', value: '#16A34A' },
  { name: 'Purple Strength', value: '#9333EA' },
];

export const AI_PROVIDERS = [
  {
    id: 'openai' as const,
    name: 'OpenAI',
    description: 'Use OpenAI GPT models (requires API key)',
    icon: '🤖',
  },
  {
    id: 'openrouter' as const,
    name: 'OpenRouter',
    description: 'Access multiple AI models via OpenRouter (great for testing)',
    icon: '🔀',
  },
  {
    id: 'ollama' as const,
    name: 'Ollama',
    description: 'Run models locally with Ollama (free, no API key needed)',
    icon: '🦙',
  },
];