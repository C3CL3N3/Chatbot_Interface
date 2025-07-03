'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { closeSession } from '../utils/router';
import { getAllSessions, saveSession, deleteSession } from '../utils/indexeddb';

// Interface for a chat session object
export interface ChatSession {
    id: string;
    name?: string;
    messages: { type: 'question' | 'answer'; text: string }[];
    archived?: boolean; 
    lastModified?: number; 
}

// Interface for the context value
interface ChatManagerContextProps {
    chatSessions: Record<string, ChatSession>; // key = chatId
    activeChatId: string | null;
    createChat: () => void;
    deleteChat: (chatId: string) => void;
    selectChat: (chatId: string) => void;
    updateChatMessages: (chatId: string, messages: ChatSession['messages']) => void;
    updateChatName: (chatId: string, name: string) => void;
    archiveChat: (chatId: string, archived?: boolean) => void;
}

const ChatManagerContext = createContext<ChatManagerContextProps | undefined>(undefined);

// Generates a unique session ID using crypto for near-zero collision probability
function generateSessionId(): string {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(n => n.toString().padStart(10, '0'))
        .join('');
}

// Provider component that manages chat sessions and exposes context functions
export const ChatManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Loads all chat sessions from IndexedDB on mount and sets the most recent as active
    useEffect(() => {
        getAllSessions().then((sessions) => {
            setChatSessions(sessions);
            const chats = Object.values(sessions);
            if (chats.length > 0) {
                // Sort by lastModified and set the most recent chat as active
                const mostRecent = chats.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0))[0];
                setActiveChatId(mostRecent.id);
            }
        });
    }, []);

    // Creates a new chat session and sets it as active
    const createChat = () => {
        const newChatId = generateSessionId();
        const chatCount = Object.keys(chatSessions).length + 1;
        const defaultName = `Chat ${chatCount}`;
        const newSession = { id: newChatId, name: defaultName, messages: [], archived: false, lastModified: Date.now() };

        setChatSessions((prev) => {
            const updated = { ...prev, [newChatId]: newSession };
            saveSession(newChatId, newSession); // Save in IndexedDB
            return updated;
        });
        setActiveChatId(newChatId);
    };

    // Updates the messages for a chat session and saves to IndexedDB
    const updateChatMessages = (chatId: string, messages: ChatSession['messages']) => {
        setChatSessions((prev) => {
            const updated = { ...prev, [chatId]: { ...prev[chatId], messages, lastModified: Date.now() } };
            saveSession(chatId, updated[chatId]); // Save in IndexedDB
            return updated;
        });
    };

    // Deletes a chat session, optionally closing it on the server first
    const deleteChat = async (chatId: string) => {
        const archived = chatSessions[chatId]?.archived || false;
        if (!archived && // If chat is not archived
            Object.keys(chatSessions[chatId]?.messages || {}).length > 0) {
            try {
                const response = await closeSession(chatId) || false;
                if (response) {
                    setChatSessions((prev) => {
                        const updated = { ...prev };
                        delete updated[chatId];
                        deleteSession(chatId); // Delete from IndexedDB
                        return updated;
                    });
                    if (activeChatId === chatId) setActiveChatId(null);
                } else {
                    alert("This chat could not be closed by the server.");
                }
            } catch (error) {
                alert("Error while closing the chat.");
            }
        } else {
            setChatSessions((prev) => {
                const updated = { ...prev };
                delete updated[chatId];
                deleteSession(chatId);
                return updated;
            });
            if (activeChatId === chatId) setActiveChatId(null);
        }
    };

    // Sets the active chat session by ID
    const selectChat = (chatId: string) => {
        setActiveChatId(chatId);
    };

    // Updates the name of a chat session
    const updateChatName = (chatId: string, name: string) => {
        setChatSessions((prev) => ({
            ...prev,
            [chatId]: { ...prev[chatId], name },
        }));
    };

    // Archives a chat session, closing it on the server
    const archiveChat = async (chatId: string, archived: boolean = true) => {
        try {
            if (archived) {
                const response = await closeSession(chatId);
                if (!response) {
                    alert("This chat could not be closed by the server, archive failed.");
                    return;
                }
            }
            setChatSessions((prev) => {
                const updated = {
                    ...prev,
                    [chatId]: { ...prev[chatId], archived, lastModified: Date.now() },
                };
                saveSession(chatId, updated[chatId]);
                return updated;
            });
        } catch (error) {
            alert("Error while closing the chat.");
        }
    };

    // Provides context value to children
    return (
        <ChatManagerContext.Provider
            value={{
                chatSessions,
                activeChatId,
                createChat,
                deleteChat,
                selectChat,
                updateChatMessages,
                updateChatName,
                archiveChat,
            }}
        >
            {children}
        </ChatManagerContext.Provider>
    );
};

// Custom hook to use the ChatManager context
export const useChatManager = () => {
    const context = useContext(ChatManagerContext);
    if (!context) {
        throw new Error('useChatManager must be used within a ChatManagerProvider');
    }
    return context;
};

