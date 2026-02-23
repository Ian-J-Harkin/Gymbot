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
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Widget Embed Code</h3>
                        <p className="text-sm text-gray-500 mb-4">Copy and paste this code into your website's &lt;body&gt; tag.</p>
                        <div className="bg-gray-900 rounded-xl p-4 relative group">
                            <code className="text-xs text-gray-300 font-mono break-all block">
                                {`<script src="${window.location.origin}/widget/loader.js" data-gym-id="${apiKey}"></script>`}
                            </code>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(`<script src="${window.location.origin}/widget/loader.js" data-gym-id="${apiKey}"></script>`)}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Copy
                            </button>
                        </div>
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
