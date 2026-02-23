import { useEffect } from 'react';

/**
 * Hook to warn users about unsaved changes when they try to navigate away from the page
 * or close the browser tab natively.
 * 
 * @param isDirty boolean indicating if the form has unsaved changes
 */
export const useUnsavedChangesWarning = (isDirty: boolean) => {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                // Standard way to trigger the native browser confirmation dialog
                e.preventDefault();
                e.returnValue = ''; // Chrome requires this to be set
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);
};
