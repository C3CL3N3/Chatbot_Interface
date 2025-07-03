"use client";

import React, { useState, useEffect, useRef, use } from 'react';
import { askQuestion } from '../utils/router';
import { useChatManager } from './ChatManager';
import { useCollapse } from '../hooks/collapseState';
import './css/chat.css';

interface ChatProps {
    chatId: string;
}

const Chat: React.FC<ChatProps> = ({ chatId }) => {
    const { chatSessions, updateChatMessages } = useChatManager();
    const { collapseButton, setCollapseButton } = useCollapse();
    const [question, setQuestion] = useState<string>(''); // State for the user's question
    const [loading, setLoading] = useState<boolean>(false); // State for loading indicator
    const [error, setError] = useState<string | null>(null); // State for any errors
    const [typingDots, setTypingDots] = useState<string>('.'); // State for the "Typing..." dots animation
    const isArchived = chatSessions[chatId]?.archived || false; // Check if the chat is archived

    const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref to track the bottom of the chat

    // Get the messages for the current chat session
    const messages = chatSessions[chatId]?.messages || [];

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll to the bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Typing dots animation for loading state
    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setTypingDots((prev) => (prev === '' ? '.' : prev === '.' ? '..' : prev === '..' ? '...' : ''));
            }, 500); // Update every 500ms
            return () => clearInterval(interval); // Cleanup interval on unmount or when loading stops
        }
    }, [loading]);

    // Collapse the sidebar when the input field is clicked
    useEffect(() => {
        const inputField = document.querySelector('.chat-input-form input');
        const handleFocus = () => { setCollapseButton(true); };

        if (inputField) {
            inputField.addEventListener('focus', handleFocus);
        }

        return () => {
            if (inputField) {
                inputField.removeEventListener('focus', handleFocus);
            }
        };
    }, []);

    // Listen for Enter key to send request
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                collapseButton
            ) {
                console.log('Enter key pressed');
                event.preventDefault(); // Prevent default form submission

                const sendButton = document.getElementById('sendbtn') as HTMLButtonElement | null;
                console.log('Send button:', sendButton); 
                if (sendButton && !sendButton.disabled) {
                    console.log('Button clicked'); 
                    sendButton.click();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [collapseButton]);

    // Handles sending a message to the backend and updating chat state
    const handleSendMessage = async () => {
        if (isArchived) return;
        if (!question.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const apiResponse = await askQuestion(chatId, question);

            updateChatMessages(chatId, [
                ...messages,
                { type: 'question', text: question },
                { type: 'answer', text: apiResponse.text },
            ]);
            setQuestion(''); // Clear input on success

        } catch (err: any) {
            setError(err.message);
            // Keep the question in the input field if there's an error
        } finally {
            setLoading(false);
        }
    };
      
    return (
        <div className="chat-container">
            {collapseButton && (
                <button
                    className="collapse-sidebar-button"
                    onClick={() => setCollapseButton(false)}
                >
                    <span className="material-symbols-outlined">left_panel_open</span>
                </button>
            )}
            <div className="chat-messages" style={{ whiteSpace: 'pre-line' }}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat-bubble ${message.type === 'question' ? 'question' : 'answer'}`}
                    >
                        {message.text}
                    </div>
                ))}
                {loading && <div className="chat-bubble loading">Thinking{typingDots}</div>}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={(e) => e.preventDefault()}>
                <textarea
                    value={question}
                    onChange={(e) => {
                        setQuestion(e.target.value);
                        setError(null); // Clear the error when the user types
                    }}
                    placeholder={isArchived ? "Chat is archived" : "Type your question..."}
                    disabled={loading}
                    rows={1} // Start with one row
                    onClick={() => setCollapseButton(true)}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto'; // Reset height to auto to calculate new height
                        target.style.height = `${target.scrollHeight}px`; // Set height based on scrollHeight
                    }}
                    style={{
                        resize: 'none', // Prevent manual resizing
                        overflow: 'hidden', // Hide scrollbars
                    }}
                />
                <div className="error-and-button">
                    {error ? <div className="error">{error}</div> : <div></div>}
                    <button
                        id="sendbtn"
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isArchived || loading || !question.trim()}
                        style={{ fontWeight: 'bold' }}
                    >
                        <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
