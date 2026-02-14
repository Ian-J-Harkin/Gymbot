import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const SubscriptionSuccess: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // You could verify the session here with an API call if desired
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-8">
                    Thank you for upgrading to GymBot Pro. Your subscription is now active, and all features has been unlocked.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                >
                    Back to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                </button>
            </div>
        </div>
    );
};
