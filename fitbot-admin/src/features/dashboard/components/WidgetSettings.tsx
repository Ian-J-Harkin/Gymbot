import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Eye } from 'lucide-react';
import { configurationApi } from '../services/configurationApi';
import { configurationSchema, ConfigurationFormData, GYM_COLOR_PRESETS } from '../schemas/configurationSchema';
import { ChatbotPreview } from './ChatbotPreview';

export interface WidgetSettingsProps {
    onDirtyChange?: (isDirty: boolean) => void;
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({ onDirtyChange }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [previewColor, setPreviewColor] = useState('#2563EB');
    const [apiKey, setApiKey] = useState('YOUR_GYM_ID');
    const [integrationType, setIntegrationType] = useState<'wordpress' | 'html'>('html');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
        reset,
    } = useForm<ConfigurationFormData>({
        resolver: zodResolver(configurationSchema),
        defaultValues: {
            primaryColor: '#2563EB',
        },
    });

    const primaryColor = watch('primaryColor');

    useEffect(() => {
        if (primaryColor) setPreviewColor(primaryColor);
    }, [primaryColor]);

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
            if (config.apiKey?.key) {
                setApiKey(config.apiKey.key);
            }
            reset({
                primaryColor: config.widgetColor || '#2563EB',
                // Preserve other fields
                aiProvider: config.aiProvider || 'openai',
                faqData: config.faqText || '',
                openaiApiKey: config.openAiApiKey || '',
                openRouterApiKey: config.openRouterApiKey || '',
                ollamaUrl: config.ollamaUrl || 'http://localhost:11434',
                ollamaModel: config.ollamaModel || 'llama3',
            });
        } catch (err) {
            console.error("Failed to load widget settings", err);
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
                ...data, // Send all data including hidden fields to avoid overwriting with null
                widgetColor: data.primaryColor,
                faqText: data.faqData || '',
            });
            setSuccess('Widget settings saved!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Failed to save widget settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorPresetClick = (color: string) => setValue('primaryColor', color);

    if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary-600" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Brand Customization</h3>
                        <p className="text-sm text-gray-500 mb-6">Match the chatbot to your gym's brand identity.</p>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div className="flex items-center space-x-4 mb-4">
                            <input {...register('primaryColor')} type="color" className="h-12 w-12 border border-gray-200 rounded-lg cursor-pointer" />
                            <input {...register('primaryColor')} type="text" className="flex-1 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm uppercase" />
                        </div>

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {GYM_COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleColorPresetClick(preset.value)}
                                    className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: preset.value }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                        {errors.primaryColor && <p className="text-sm text-red-600">{errors.primaryColor.message}</p>}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Installation Instructions</h3>
                        <p className="text-sm text-gray-500 mb-4">Choose your platform to get the correct setup details.</p>

                        <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setIntegrationType('html')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${integrationType === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                React / Any Website
                            </button>
                            <button
                                type="button"
                                onClick={() => setIntegrationType('wordpress')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${integrationType === 'wordpress' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                WordPress
                            </button>
                        </div>

                        {integrationType === 'html' ? (
                            <div className="bg-gray-900 rounded-xl p-4 relative group">
                                <code className="text-xs text-gray-300 font-mono break-all block whitespace-pre-wrap">
                                    {`<script \n  src="https://fitbot-demo.vercel.app/gymbot.min.js" \n  data-api-key="${apiKey}" \n  data-api-url="https://gymbot-api.onrender.com/api" \n  async>\n</script>`}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(`<script src="https://fitbot-demo.vercel.app/gymbot.min.js" data-api-key="${apiKey}" data-api-url="https://gymbot-api.onrender.com/api" async></script>`)}
                                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <ol className="list-decimal pl-4 space-y-3 text-sm text-gray-700">
                                    <li>Install the <strong>FitBot</strong> plugin in your WordPress Admin dashboard.</li>
                                    <li>Navigate to the <strong>FitBot Setup</strong> tab.</li>
                                    <li>Paste the following configurations into the settings screen:
                                        <div className="mt-3 space-y-3 bg-white p-4 border border-gray-100 rounded-lg shadow-sm">
                                            <div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">1. API Key</div>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-mono text-xs select-all">{apiKey}</code>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">2. Backend API URL</div>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-mono text-xs select-all">https://gymbot-api.onrender.com/api</code>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">3. Frontend Script URL</div>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-900 font-mono text-xs select-all">https://fitbot-demo.vercel.app/gymbot.min.js</code>
                                            </div>
                                        </div>
                                    </li>
                                    <li>Click <strong>Save & Connect</strong>. The bot will instantly appear on your live site!</li>
                                </ol>

                                <div className="mt-6 pt-5 border-t border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">Fast Setup (Recommended)</h4>
                                    <p className="text-xs text-gray-500 mb-3">Copy this combined configuration block and paste it directly into the <strong>API Key</strong> field in WordPress. It will automatically fill out all three fields for you!</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const settings = {
                                                apiKey: apiKey,
                                                apiUrl: 'https://gymbot-api.onrender.com/api',
                                                scriptUrl: 'https://fitbot-demo.vercel.app/gymbot.min.js'
                                            };
                                            navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                                            alert('Settings copied! Paste them into the API Key field in WordPress.');
                                        }}
                                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                    >
                                        Copy All Settings Block
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>}
                        {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            <div className="sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-gray-400" />
                    Live Preview
                </h3>
                <ChatbotPreview primaryColor={previewColor} isActive={true} />
            </div>
        </div>
    );
};
