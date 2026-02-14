import React, { useEffect, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    ExternalLink,
    Settings,
    Database,
    CreditCard,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { configurationApi } from '../services/configurationApi';
import { knowledgeBaseApi } from '../services/knowledgeBaseApi';

interface SystemStatus {
    aiConfigured: boolean;
    documentsCount: number;
    subscriptionActive: boolean;
}

interface OverviewTabProps {
    onNavigate: (tab: 'brain' | 'knowledge' | 'billing' | 'widget' | 'logs') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<SystemStatus>({
        aiConfigured: false,
        documentsCount: 0,
        subscriptionActive: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const [config, docs] = await Promise.all([
                    configurationApi.getConfiguration().catch(() => null),
                    knowledgeBaseApi.getDocuments().catch(() => [])
                ]);

                setStatus({
                    aiConfigured: !!(config?.openAiApiKey || config?.openRouterApiKey || (config?.aiProvider === 'ollama' && config?.ollamaUrl)),
                    documentsCount: Array.isArray(docs) ? docs.length : 0,
                    subscriptionActive: user?.subscriptionStatus === 'active',
                });
            } catch (err) {
                console.error("Failed to load overview status", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadStatus();
    }, [user]);

    const StatCard = ({ title, value, icon: Icon, status, onClick, actionText }: any) => (
        <div
            onClick={onClick}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${status === 'good' ? 'bg-green-50 text-green-600' : status === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className={`h-2 w-2 rounded-full ${status === 'good' ? 'bg-green-500' : status === 'warn' ? 'bg-amber-500' : 'bg-gray-300'}`} />
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <span className="text-sm font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    {actionText} <ExternalLink className="ml-1 h-3 w-3" />
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section */}
            {/* Welcome Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-primary-50 rounded-full blur-3xl opacity-50" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900">Welcome back, {user?.gymName || 'Admin'}!</h2>
                    <p className="text-gray-600 max-w-xl text-lg">
                        Your AI assistant is currently <span className={`font-bold ${status.aiConfigured ? 'text-green-600' : 'text-amber-600'}`}>
                            {status.aiConfigured ? 'Active & Ready' : 'Needs Configuration'}
                        </span>.
                        Here is what's happening today.
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="AI Connection"
                    value={status.aiConfigured ? "Connected" : "Setup Needed"}
                    icon={Activity}
                    status={status.aiConfigured ? 'good' : 'warn'}
                    onClick={() => onNavigate('brain')}
                    actionText="Configure"
                />
                <StatCard
                    title="Knowledge Base"
                    value={`${status.documentsCount} Documents`}
                    icon={Database}
                    status={status.documentsCount > 0 ? 'good' : 'warn'}
                    onClick={() => onNavigate('knowledge')}
                    actionText="Manage"
                />
                <StatCard
                    title="Subscription"
                    value={status.subscriptionActive ? "Pro Plan" : "Free Trial"}
                    icon={CreditCard}
                    status={status.subscriptionActive ? 'good' : 'warn'}
                    onClick={() => onNavigate('billing')}
                    actionText="Upgrade"
                />
            </div>

            {/* Setup Checklist / Next Steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Setup Checklist</h3>
                <div className="space-y-4">
                    <div
                        onClick={() => !status.aiConfigured && onNavigate('brain')}
                        className={`flex items-center p-4 rounded-xl border transition-all ${status.aiConfigured
                            ? 'bg-green-50 border-green-100 opacity-75'
                            : 'bg-white border-primary-100 hover:border-primary-300 cursor-pointer hover:shadow-sm'
                            }`}
                    >
                        <div className={`flex-shrink-0 mr-4 ${status.aiConfigured ? 'text-green-500' : 'text-primary-600'}`}>
                            {status.aiConfigured ? <CheckCircle2 className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold ${status.aiConfigured ? 'text-green-900' : 'text-gray-900'}`}>
                                1. Configure AI Provider
                            </h4>
                            <p className="text-sm text-gray-500">
                                {status.aiConfigured
                                    ? "Great! Your AI provider is connected."
                                    : "Connect OpenAI, OpenRouter, or Ollama to power your bot."}
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => status.documentsCount === 0 && onNavigate('knowledge')}
                        className={`flex items-center p-4 rounded-xl border transition-all ${status.documentsCount > 0
                            ? 'bg-green-50 border-green-100 opacity-75'
                            : 'bg-white border-primary-100 hover:border-primary-300 cursor-pointer hover:shadow-sm'
                            }`}
                    >
                        <div className={`flex-shrink-0 mr-4 ${status.documentsCount > 0 ? 'text-green-500' : 'text-primary-600'}`}>
                            {status.documentsCount > 0 ? <CheckCircle2 className="h-6 w-6" /> : <Database className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold ${status.documentsCount > 0 ? 'text-green-900' : 'text-gray-900'}`}>
                                2. Train Knowledge Base
                            </h4>
                            <p className="text-sm text-gray-500">
                                {status.documentsCount > 0
                                    ? `${status.documentsCount} documents indexed and ready for retrieval.`
                                    : "Upload PDFs or text files to teach the bot about your gym."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center p-4 rounded-xl border bg-gray-50 border-gray-100 opacity-50">
                        <div className="flex-shrink-0 mr-4 text-gray-400">
                            <ExternalLink className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">
                                3. Embed Widget
                            </h4>
                            <p className="text-sm text-gray-500">
                                Add the widget script to your website (Coming Soon).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
