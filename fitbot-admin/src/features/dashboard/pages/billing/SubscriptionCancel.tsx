import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw } from 'lucide-react';

export const SubscriptionCancel: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="bg-amber-100 p-4 rounded-full">
                        <XCircle className="h-12 w-12 text-amber-600" />
                    </div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Cancelled</h1>
                <p className="text-gray-600 mb-8">
                    The checkout process was cancelled. No charges were made to your account.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                    >
                        Try Again
                        <RefreshCw className="ml-2 h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-gray-500 font-medium hover:text-gray-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
