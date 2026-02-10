import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfigurationForm } from '../components/ConfigurationForm';

const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg">
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Chatbot Configuration
              </h1>
              <p className="text-gray-600 mb-8">
                Customize your FitBot to match your gym's branding and provide personalized assistance to your members.
              </p>
              <ConfigurationForm />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;