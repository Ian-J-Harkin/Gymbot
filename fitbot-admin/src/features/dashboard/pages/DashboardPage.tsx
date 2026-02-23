import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { AISettings } from '../components/AISettings';
import { WidgetSettings } from '../components/WidgetSettings';
import { AuditLogList } from '../components/AuditLogList';
import { OverviewTab } from '../components/OverviewTab';
import { Brain, Layout, History, CreditCard, Database, Home, AlertTriangle } from 'lucide-react';
import { BillingSettings } from '../components/BillingSettings';
import { KnowledgeBase } from '../components/KnowledgeBase';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';

type TabType = 'overview' | 'brain' | 'knowledge' | 'widget' | 'logs' | 'billing';

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Unsaved changes state
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);

  // Hook into browser 'beforeunload' event when forms are dirty
  useUnsavedChangesWarning(isDirty);

  // Handle intercepting the tab click
  const handleTabClick = (tab: TabType) => {
    if (tab === activeTab) return;

    if (isDirty) {
      setPendingTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const confirmTabSwitch = () => {
    if (pendingTab) {
      setIsDirty(false); // Reset dirty state since we're abandoning changes
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelTabSwitch = () => {
    setPendingTab(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Unsaved Changes Confirmation Modal */}
        {pendingTab && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 mb-4 text-amber-600">
                <div className="bg-amber-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Unsaved Changes</h3>
              </div>
              <p className="text-gray-600 mb-8">
                You have unsaved changes on this tab. Are you sure you want to leave? Your changes will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelTabSwitch}
                  className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Stay on Page
                </button>
                <button
                  onClick={confirmTabSwitch}
                  className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

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
            onClick={() => handleTabClick('overview')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Home className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleTabClick('brain')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'brain'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Brain className="h-4 w-4" />
            <span>AI Brain</span>
          </button>

          <button
            onClick={() => handleTabClick('knowledge')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'knowledge'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Database className="h-4 w-4" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => handleTabClick('widget')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'widget'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Layout className="h-4 w-4" />
            <span>Widget</span>
          </button>

          <button
            onClick={() => handleTabClick('logs')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'logs'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <History className="h-4 w-4" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => handleTabClick('billing')}
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
        <div className="animate-in fade-in duration-500 relative">
          {activeTab === 'overview' ? (
            <OverviewTab onNavigate={handleTabClick} />
          ) : activeTab === 'brain' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <AISettings onDirtyChange={setIsDirty} />
              </div>
            </div>
          ) : activeTab === 'knowledge' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <KnowledgeBase onDirtyChange={setIsDirty} />
              </div>
            </div>
          ) : activeTab === 'widget' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <WidgetSettings onDirtyChange={setIsDirty} />
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