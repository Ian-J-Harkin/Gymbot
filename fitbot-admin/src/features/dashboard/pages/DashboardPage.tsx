import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfigurationForm } from '../components/ConfigurationForm';
import { AuditLogList } from '../components/AuditLogList';
import { Settings, History } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Gym Management Portal
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Configure your AI assistant and review recent member interactions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit mb-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'config'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
          >
            <Settings className="h-4 w-4" />
            <span>AI Configuration</span>
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
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'config' ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8">
                <ConfigurationForm />
              </div>
            </div>
          ) : (
            <AuditLogList />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;