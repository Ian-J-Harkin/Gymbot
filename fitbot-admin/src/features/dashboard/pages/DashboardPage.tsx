import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { AISettings } from '../components/AISettings';
import { WidgetSettings } from '../components/WidgetSettings';
import { AuditLogList } from '../components/AuditLogList';
import { OverviewTab } from '../components/OverviewTab';
import { Brain, Layout, History, CreditCard, Database, Home } from 'lucide-react';
import { BillingSettings } from '../components/BillingSettings';
import { KnowledgeBase } from '../components/KnowledgeBase';

type TabType = 'overview' | 'brain' | 'knowledge' | 'widget' | 'logs' | 'billing';

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Gym Management Portal
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Configure your AI assistant, manage knowledge, and review interactions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Home className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('brain')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'brain'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Brain className="h-4 w-4" />
            <span>AI Brain</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'knowledge'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Database className="h-4 w-4" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => setActiveTab('widget')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'widget'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Layout className="h-4 w-4" />
            <span>Widget</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'logs'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <History className="h-4 w-4" />
            <span>Audit Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'billing'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Subscription</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'overview' ? (
            <OverviewTab onNavigate={(tab: TabType) => setActiveTab(tab)} />
          ) : activeTab === 'brain' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <AISettings />
              </div>
            </div>
          ) : activeTab === 'knowledge' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <KnowledgeBase />
              </div>
            </div>
          ) : activeTab === 'widget' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <WidgetSettings />
              </div>
            </div>
          ) : activeTab === 'logs' ? (
            <AuditLogList />
          ) : (
            <BillingSettings />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;