import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const BillingSettings: React.FC = () => {
    // This would typically come from an API call
    const [isSubscribed] = useState(false);
    const [requireSubscription, setRequireSubscription] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleRequirement = () => {
        // Mock update to backend
        setRequireSubscription(!requireSubscription);
    };

    const handleUpgrade = () => {
        setIsLoading(true);
        // In reality, this would call our Stripe service to get a checkout session URL
        setTimeout(() => {
            alert("Redirecting to Stripe Checkout (Simulated)...");
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                                <CreditCard className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Subscription Status</h2>
                                <p className="text-sm text-gray-500">Manage your gym's chatbot plan</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isSubscribed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isSubscribed ? 'Active Subscriber' : 'Free Trial / Internal Testing'}
                        </span>
                    </div>

                    {!isSubscribed && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Pro</h3>
                            <p className="text-gray-600 mb-6">
                                Unlock unlimited chat interactions and priority AI processing for your members.
                            </p>
                            <button
                                onClick={handleUpgrade}
                                disabled={isLoading}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                            >
                                {isLoading ? 'Processing...' : 'Start Subscription'}
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Guardrail Settings (Internal Only)</h3>
                                <p className="text-sm text-gray-600">
                                    Enforce subscription check for the public widget. Disable this for primary testing.
                                </p>
                            </div>
                            <button
                                onClick={handleToggleRequirement}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${requireSubscription ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${requireSubscription ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-sm text-blue-700 leading-normal">
                                <strong>Safety Mode:</strong> When enabled, the widget will display a "Service unavailable" message to users if your subscription is not active. This is perfect for production guardrails.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-100 rounded-xl p-6 bg-white">
                        <h4 className="font-bold text-gray-900 mb-1">Standard</h4>
                        <p className="text-2xl font-black text-primary-600 mb-4">$29<span className="text-sm font-normal text-gray-500">/mo</span></p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> 500 Messages / mo</li>
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> OpenAI GPT-3.5</li>
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> RAG-Lite Context</li>
                        </ul>
                    </div>
                    <div className="border-2 border-primary-600 rounded-xl p-6 bg-primary-50 relative">
                        <span className="absolute -top-3 right-4 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Popular</span>
                        <h4 className="font-bold text-gray-900 mb-1">Performance</h4>
                        <p className="text-2xl font-black text-primary-600 mb-4">$59<span className="text-sm font-normal text-gray-500">/mo</span></p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Unlimited Messages</li>
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> OpenAI GPT-4o</li>
                            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Premium Support</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
