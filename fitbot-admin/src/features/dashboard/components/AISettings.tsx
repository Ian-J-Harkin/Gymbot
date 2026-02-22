import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Brain, Info } from 'lucide-react';
import { configurationApi } from '../services/configurationApi';
import { configurationSchema, ConfigurationFormData, AI_PROVIDERS } from '../schemas/configurationSchema';

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
                        {AI_PROVIDERS.map((provider) => (
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
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">OpenRouter API Key</label>
                            <input {...register('openRouterApiKey')} type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="sk-or-..." />
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
