import React, { useEffect, useState } from 'react';
import { useChatManager } from './ChatManager';
import { useCollapse } from '../hooks/collapseState';
import { archiveAllSessions } from '../utils/indexeddb';
import './css/sidebar.css';

const Sidebar: React.FC = () => {
    // Get chat management functions and state from context
    const { chatSessions, createChat, deleteChat, selectChat, activeChatId, updateChatName, archiveChat } = useChatManager();
    // Get sidebar collapse state and setter from context
    const { collapseButton, setCollapseButton } = useCollapse();
    // State for tracking which chat is being edited
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    // State for the new chat name input
    const [newChatName, setNewChatName] = useState<string>('');

    // Handles clicking the edit button for a chat
    const handleEditClick = (chatId: string, currentName: string) => {
        setEditingChatId(chatId);
        setNewChatName(currentName);
    };

    // Handles saving the new chat name
    const handleSaveClick = (chatId: string) => {
        updateChatName(chatId, newChatName.trim());
        setEditingChatId(null);
        setNewChatName('');
    };

    // List of active (not archived) chats, sorted by last modified
    const activeChats = Object.values(chatSessions)
        .filter(chat => !chat.archived)
        .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));

    // List of archived chats, sorted by last modified
    const archivedChats = Object.values(chatSessions)
        .filter(chat => chat.archived)
        .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));

    // Archives all sessions when the page is closed or refreshed
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            archiveAllSessions();
            event.preventDefault();
            event.returnValue = ''; // Necessary for some browsers to show a confirmation dialog
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <div className={`sidebar ${collapseButton ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {/* Button to create a new chat, only visible when sidebar is expanded */}
                {!collapseButton && <button onClick={createChat} className="new-chat-button">New Chat</button>}
                {/* Button to collapse the sidebar */}
                {!collapseButton && (
                    <button className="toggle-button" onClick={() => setCollapseButton(true)}>
                        <span className="material-symbols-outlined">right_panel_open</span>
                    </button>
                )}
            </div>
            {/* Sidebar content, only visible when not collapsed */}
            {!collapseButton && (
                <div className="sidebar-content">
                    {/* List of active chats */}
                    <ul className="active-chats">
                        {activeChats.map((chat) => (
                            <li key={chat.id} className={activeChatId === chat.id ? 'active' : ''}>
                                {/* If editing this chat, show input and save/cancel buttons */}
                                {editingChatId === chat.id ? (
                                    <div>
                                        <input
                                            type="text"
                                            value={newChatName}
                                            onChange={(e) => setNewChatName(e.target.value)}
                                            placeholder="Enter chat name"
                                            className="edit-chat-input"
                                        />
                                        <button onClick={() => handleSaveClick(chat.id)}>Save</button>
                                        <button onClick={() => setEditingChatId(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    // Otherwise, show chat name and action buttons
                                    <div className="chat-item">
                                        <span className="chat-name" onClick={() => selectChat(chat.id)}>
                                            {chat.name || `Chat ${chat.id}`}
                                        </span>
                                        {/* Show action buttons only for the active chat */}
                                        {activeChatId === chat.id && (
                                            <div className="chat-actions">
                                                <button
                                                    onClick={() =>
                                                        handleEditClick(
                                                            chat.id,
                                                            chat.name || `Chat ${chat.id}`
                                                        )
                                                    }
                                                    className="icon-button"
                                                >
                                                    <span className="material-symbols-outlined editbtn">edit_square</span>
                                                </button>
                                                <button onClick={() => deleteChat(chat.id)} className="icon-button">
                                                    <span className="material-symbols-outlined trashbtn">delete</span>
                                                </button>
                                                <button onClick={() => archiveChat(chat.id, true)} className="icon-button">
                                                    <span className="material-symbols-outlined archbtn">inventory_2</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                    {/* Archived chats section, only shown if there are archived chats */}
                    {archivedChats.length > 0 && (
                        <div className="archived-section">
                            <div className="archived-title">Archived Chats</div>
                            <ul className="archived-chats">
                                {archivedChats.map((chat) => (
                                    <li
                                        key={chat.id}
                                        className={`archived${activeChatId === chat.id ? ' active' : ''}`}
                                    >
                                        <div className="chat-item">
                                            <span className="chat-name" onClick={() => selectChat(chat.id)}>
                                                {chat.name || `Chat ${chat.id}`}
                                            </span>
                                            {/* Only show delete button for the active archived chat */}
                                            {activeChatId === chat.id && (
                                                <div className="chat-actions">
                                                    <button onClick={() => deleteChat(chat.id)} className="icon-button">
                                                        <span className="material-symbols-outlined trashbtn">delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;