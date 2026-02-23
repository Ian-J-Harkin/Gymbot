import React, { useEffect } from 'react';

export const PortalReturn: React.FC = () => {
    useEffect(() => {
        // 1. Try to notify the main window to refresh
        if (window.opener) {
            try {
                // Refresh parent to show new subscription status
                window.opener.location.reload();
            } catch (e) {
                console.error("Could not refresh parent window", e);
            }

            // Close the popup window
            window.close();
        } else {
            // If somehow opened in the main tab, go to dashboard
            window.location.replace('/dashboard?tab=billing');
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="animate-pulse text-primary-600 font-bold">
                Updating your subscription status...
            </div>
            <p className="text-gray-500 mt-2">This window will close automatically.</p>
        </div>
    );
};
