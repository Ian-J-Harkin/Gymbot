import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Eye } from 'lucide-react';
import { configurationApi } from '../services/configurationApi';
import { configurationSchema, ConfigurationFormData, GYM_COLOR_PRESETS, AI_PROVIDERS } from '../schemas/configurationSchema';
import { ChatbotPreview } from './ChatbotPreview';

export const ConfigurationForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState({
    primaryColor: '#2563EB',
    faqData: '',
    isActive: true,
  });
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isEditingOpenAi, setIsEditingOpenAi] = useState(true);
  const [isEditingOpenRouter, setIsEditingOpenRouter] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      primaryColor: '#2563EB',
      faqData: 'Welcome to our gym! Here are some frequently asked questions:\n\nQ: What are your opening hours?\nA: We are open Monday to Friday 6 AM - 10 PM, Saturday 8 AM - 8 PM, Sunday 9 AM - 6 PM.\n\nQ: Do you offer personal training?\nA: Yes, we have certified personal trainers available. Please ask at the front desk to schedule a session.\n\nQ: What equipment do you have?\nA: We have a full range of cardio equipment, free weights, resistance machines, and a functional training area.',
      aiProvider: 'openai',
      openaiApiKey: '',
      openRouterApiKey: '',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3',
    },
  });

  const selectedProvider = watch('aiProvider');

  // Watch form values for live preview using subscription
  useEffect(() => {
    const subscription = watch((values) => {
      setPreviewData({
        primaryColor: values.primaryColor || '#2563EB',
        faqData: values.faqData || '',
        isActive: true,
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const config = await configurationApi.getConfiguration();
      reset({
        primaryColor: config.widgetColor || '#2563EB',
        faqData: config.faqText || '',
        aiProvider: config.aiProvider || 'openai',
        openaiApiKey: config.openAiApiKey || '',
        openRouterApiKey: config.openRouterApiKey || '',
        ollamaUrl: config.ollamaUrl || 'http://localhost:11434',
        ollamaModel: config.ollamaModel || 'llama3',
      });
      if (config.apiKey) {
        setApiKey(config.apiKey.key);
      }
      setIsEditingOpenAi(!config.openAiApiKey);
      setIsEditingOpenRouter(!config.openRouterApiKey);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Failed to load configuration');
      }
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
        widgetColor: data.primaryColor,
        faqText: data.faqData,
        aiProvider: data.aiProvider,
        openAiApiKey: data.openaiApiKey,
        openRouterApiKey: data.openRouterApiKey,
        ollamaUrl: data.ollamaUrl,
        ollamaModel: data.ollamaModel,
      });
      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };


  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI Model' },
    { id: 'knowledge', label: 'Knowledge Base' },
    { id: 'installation', label: 'Installation' },
  ];

  const [activeTab, setActiveTab] = useState('general');

  const handleColorPresetClick = (color: string) => {
    setValue('primaryColor', color);
  };

  const handleGenerateApiKey = async () => {
    try {
      setIsLoading(true);
      const data = await configurationApi.generateApiKey();
      setApiKey(data.apiKey);
      setSuccess('New API Key generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to generate API Key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration Form */}
      <div className="space-y-6">
        {/* Tabs Header */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Success message moved to bottom */}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Primary Color */}
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-4 mb-3">
                  <input
                    {...register('primaryColor')}
                    type="color"
                    className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    {...register('primaryColor')}
                    type="text"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#2563EB"
                  />
                </div>

                {/* Color Presets */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {GYM_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleColorPresetClick(preset.value)}
                      className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 text-sm"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                {errors.primaryColor && (
                  <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
                )}
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Provider
                </label>
                <div className="space-y-2">
                  {AI_PROVIDERS.map((provider) => (
                    <label
                      key={provider.id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${selectedProvider === provider.id
                        ? 'border-primary-500 bg-blue-50 ring-1 ring-primary-500'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        value={provider.id}
                        {...register('aiProvider')}
                        className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="mr-2">{provider.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Provider-specific fields */}
              {selectedProvider === 'openai' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      OpenAI API Key
                    </label>
                    {!isEditingOpenAi && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingOpenAi(true);
                          setValue('openaiApiKey', ''); // Clear to force re-entry? Or keep value? Keeping value is better for small edits.
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Edit Key
                      </button>
                    )}
                  </div>
                  <input
                    {...register('openaiApiKey')}
                    type="password"
                    disabled={!isEditingOpenAi}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!isEditingOpenAi ? 'bg-gray-100 text-gray-500' : 'border-gray-300'}`}
                    placeholder={!isEditingOpenAi ? '••••••••••••••••••••••••' : 'sk-...'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your OpenAI API key is encrypted and securely stored.
                  </p>
                  {errors.openaiApiKey && (
                    <p className="mt-1 text-sm text-red-600">{errors.openaiApiKey.message}</p>
                  )}
                </div>
              )}

              {selectedProvider === 'openrouter' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      OpenRouter API Key
                    </label>
                    {!isEditingOpenRouter && (
                      <button
                        type="button"
                        onClick={() => setIsEditingOpenRouter(true)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Edit Key
                      </button>
                    )}
                  </div>
                  <input
                    {...register('openRouterApiKey')}
                    type="password"
                    disabled={!isEditingOpenRouter}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${!isEditingOpenRouter ? 'bg-gray-100 text-gray-500' : 'border-gray-300'}`}
                    placeholder={!isEditingOpenRouter ? '••••••••••••••••••••••••' : 'sk-or-...'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get your API key from{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      openrouter.ai/keys
                    </a>
                    . Great for testing with multiple models.
                  </p>
                  {errors.openRouterApiKey && (
                    <p className="mt-1 text-sm text-red-600">{errors.openRouterApiKey.message}</p>
                  )}
                </div>
              )}

              {selectedProvider === 'ollama' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ollama URL
                    </label>
                    <input
                      {...register('ollamaUrl')}
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="http://localhost:11434"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Default is http://localhost:11434. Make sure Ollama is running locally.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ollama Model
                    </label>
                    <input
                      {...register('ollamaModel')}
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="llama3"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Model name as listed in <code className="bg-gray-100 px-1 rounded">ollama list</code>. Popular: llama3, mistral, codellama.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label htmlFor="faqData" className="block text-sm font-medium text-gray-700 mb-2">
                  FAQ Data
                </label>
                <textarea
                  {...register('faqData')}
                  rows={12}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your gym's FAQ information, policies, class schedules, etc."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This information will be used to train your chatbot. Include details about hours, services, policies, and common questions.
                </p>
                {errors.faqData && (
                  <p className="mt-1 text-sm text-red-600">{errors.faqData.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Installation Tab */}
          {activeTab === 'installation' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-blue-800 font-medium mb-2">Widget Integration</h4>
                <p className="text-blue-700 text-sm mb-4">
                  To enable the chatbot on your website, you need a Public API Key. Add this key to your widget configuration.
                </p>

                {apiKey ? (
                  <div className="bg-white p-3 rounded border border-blue-100 flex items-center justify-between overflow-hidden">
                    <code className="text-sm font-mono text-gray-800 truncate mr-2 flex-1" title={apiKey}>{apiKey}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        setSuccess('Copied to clipboard!');
                        setTimeout(() => setSuccess(null), 2000);
                      }}
                      className="text-primary-600 text-xs font-medium hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No API Key generated yet.</div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleGenerateApiKey}
                    className="text-sm px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                  >
                    {apiKey ? 'Regenerate API Key' : 'Generate API Key'}
                  </button>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Test with Curl</h5>
                <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono">
                    {`curl -X POST http://localhost:3002/api/widget/chat \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{"message": "Hello, when are you open?", "history": []}'`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving || !!success}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <div className="sticky top-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Live Preview
          </h3>
          <ChatbotPreview
            primaryColor={previewData.primaryColor}
            isActive={previewData.isActive}
          />
        </div>
      </div>
    </div>
  );
};