'use client';

import { useEffect } from 'react';
import { archiveAllSessions } from '../utils/indexeddb';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// React component to manage session inactivity and auto-archives all sessions
export const SessionManager: React.FC = () => {
    // useEffect sets up inactivity tracking and cleanup
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // Resets the inactivity timeout and sets a new one
        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                alert('Session expired due to inactivity. All chats will be archived and the page will reload.');
                await archiveAllSessions();
                window.location.reload();
            }, INACTIVITY_TIMEOUT);
        };

        // Handles any user activity by resetting the timeout
        const handleActivity = () => resetTimeout();

        // Add event listeners for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        // Start the initial timeout
        resetTimeout();

        // Cleanup: remove event listeners and clear timeout on unmount
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, []);

    // This component does not render anything
    return null;
};
