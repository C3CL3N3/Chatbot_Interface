'use client'; // Ensure this file is treated as a Client Component

import React from 'react';
import { ChatManagerProvider, useChatManager } from './components/ChatManager';
import Sidebar from './components/Sidebar';
import Chat from './components/ChatWindow';
import { SessionManager } from './components/SessionManager'; // Import SessionManager
import PreventPullToRefresh from './utils/PreventPullToRefresh'; // Import PreventPullToRefresh
import './components/css/app.css';

// Main application component that displays the sidebar and chat window
const App: React.FC = () => {
    // Get the active chat ID and createChat function from context
    const { activeChatId, createChat } = useChatManager();

    // Render the main layout: sidebar and either the chat window or a prompt to create a chat
    return (
        <div className="app-container">
            <SessionManager /> {/* Add SessionManager to monitor inactivity */}
            <Sidebar />
            {activeChatId ? (
                <Chat chatId={activeChatId} />
            ) : (
                <div className="no-chat-container">
                    <p>No chat available. Create a new chat to get started.</p>
                    <button onClick={createChat} className="create-chat-button">
                        Create Chat
                    </button>
                </div>
            )}
        </div>
    );
};

// Root component that wraps the App with the ChatManagerProvider context
const Root: React.FC = () => (
    <ChatManagerProvider>
        <App />
    </ChatManagerProvider>
);

export default Root;