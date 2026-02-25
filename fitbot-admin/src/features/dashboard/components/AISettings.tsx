import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Brain, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { configurationApi } from '../services/configurationApi';
import { configurationSchema, ConfigurationFormData, AI_PROVIDERS } from '../schemas/configurationSchema';

const FREE_OPENROUTER_MODELS = [
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Fast & lightweight, great for simple Q&A' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', description: 'Balanced performance for most use cases' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', description: 'Strong reasoning, ideal for gym FAQs' },
    {
        id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B (Free)', description: "Google's compact open model"
    },
    { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5 7B (Free)', description: 'Excellent instruction-following' },
];

export interface AISettingsProps {
    onDirtyChange?: (isDirty: boolean) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ onDirtyChange }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { isDirty },
    } = useForm<ConfigurationFormData>({
        resolver: zodResolver(configurationSchema),
        defaultValues: {
            aiProvider: 'openai',
            openaiApiKey: '',
            openRouterApiKey: '',
            huggingFaceApiKey: '',
            ollamaUrl: 'http://localhost:11434',
            ollamaModel: 'llama3',
            faqData: '', // Legacy field still required by API
        },
    });

    const selectedProvider = watch('aiProvider');

    useEffect(() => {
        loadConfiguration();
    }, []);

    // Sync dirty state to parent dashboard
    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(isDirty);
        }
    }, [isDirty, onDirtyChange]);

    const loadConfiguration = async () => {
        setIsLoading(true);
        try {
            const config = await configurationApi.getConfiguration();
            reset({
                primaryColor: config.widgetColor || '#2563EB', // Preserve widget color
                faqData: config.faqText || '',
                aiProvider: config.aiProvider || 'openai',
                openaiApiKey: config.openAiApiKey || '',
                openRouterApiKey: config.openRouterApiKey || '',
                huggingFaceApiKey: config.huggingFaceApiKey || '',
                ollamaUrl: config.ollamaUrl || 'http://localhost:11434',
                ollamaModel: config.ollamaModel || 'llama3',
            });
        } catch (err: any) {
            setError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: ConfigurationFormData) => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await configurationApi.updateConfiguration({
                ...data,
                // Ensure we pass widgetColor so back-end doesn't wipe it, though useForm default does this usually
                widgetColor: data.primaryColor,
                faqText: data.faqData || '',
            });
            setSuccess('AI Brain updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Failed to save AI settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary-600" /></div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Configure the "Brain" of your assistant here. To customize visuals, visit the <strong>Widget</strong> tab.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">

                {/* AI Provider Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-primary-600" />
                        AI Provider
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {AI_PROVIDERS.filter(p => p.id !== 'ollama' || import.meta.env.DEV).map((provider) => (
                            <label
                                key={provider.id}
                                className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all aspect-video ${selectedProvider === provider.id
                                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    value={provider.id}
                                    {...register('aiProvider')}
                                    className="sr-only"
                                />
                                <span className="text-2xl mb-2">{provider.icon}</span>
                                <span className="text-sm font-bold text-gray-900">{provider.name}</span>
                                <span className="text-xs text-center text-gray-500 mt-1">{provider.description}</span>
                            </label>
                        ))}
                    </div>

                    {/* Dynamic API Key Fields */}
                    {selectedProvider === 'openai' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
                            <input {...register('openaiApiKey')} type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="sk-..." />
                        </div>
                    )}

                    {selectedProvider === 'openrouter' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">OpenRouter API Key</label>
                                <input {...register('openRouterApiKey')} type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="sk-or-..." />
                                <p className="text-xs text-gray-500 mt-1">
                                    Get a free key at{' '}
                                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1">
                                        openrouter.ai/keys <ExternalLink className="h-3 w-3" />
                                    </a>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                                <input
                                    {...register('ollamaModel')}
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                    placeholder="e.g. meta-llama/llama-3.2-3b-instruct:free"
                                />
                                <p className="text-xs text-gray-500 mt-1 mb-3">Pick a free model below or enter any model ID from <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">openrouter.ai/models</a>.</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {FREE_OPENROUTER_MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => {
                                                const input = document.querySelector('input[name="ollamaModel"]') as HTMLInputElement;
                                                if (input) { input.value = model.id; input.dispatchEvent(new Event('input', { bubbles: true })); }
                                            }}
                                            className="flex items-center justify-between text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors group"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">{model.name}</p>
                                                <p className="text-xs text-gray-500">{model.description}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono ml-4 shrink-0 group-hover:text-primary-500">{model.id.split('/')[1]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedProvider === 'huggingface' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    <strong>Note:</strong> Hugging Face has deprecated their free Serverless API. We recommend switching to <strong>OpenRouter</strong> which offers free models with no credit card required.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hugging Face API Token</label>
                                <input {...register('huggingFaceApiKey')} type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="hf_..." />
                                <p className="text-xs text-gray-500 mt-2">Get your API token from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Hugging Face Settings</a>.</p>
                            </div>
                        </div>
                    )}

                    {selectedProvider === 'ollama' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ollama URL</label>
                                <input {...register('ollamaUrl')} type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="http://localhost:11434" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
                                <input {...register('ollamaModel')} type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="llama3" />
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Status Messages */}
                <div>
                    {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium text-center animate-in fade-in">{success}</div>}
                    {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium text-center animate-in fade-in">{error}</div>}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-200 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Brain Configuration
                    </button>
                </div>
            </form>
        </div>
    );
};
