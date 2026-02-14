import React, { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { X, ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeEmbeddedModalProps {
    clientSecret: string;
    onClose: () => void;
}

export const StripeEmbeddedModal: React.FC<StripeEmbeddedModalProps> = ({ clientSecret, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">

                {/* MODAL HEADER */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <button
                        onClick={onClose}
                        className="flex items-center text-primary-600 font-bold hover:text-primary-700 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-1" />
                        Back to GymBot
                    </button>

                    <div className="text-center flex-1 pr-10">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Secure Checkout</h3>
                    </div>
                </div>

                {/* EMBEDDED CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                </div>
            </div>
        </div>
    );
};
