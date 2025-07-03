import { openDB } from 'idb';
import type { ChatSession } from '../components/ChatManager';

const DB_NAME = 'chatbot-db';
const STORE_NAME = 'sessions';

// Retrieves all chat sessions from IndexedDB and returns them as an object
export async function getAllSessions(): Promise<Record<string, ChatSession>> {
    const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME);
        },
    });
    const allKeys = await db.getAllKeys(STORE_NAME);
    const sessions: Record<string, ChatSession> = {};
    for (const key of allKeys) {
        const session = await db.get(STORE_NAME, key as string);
        if (session) sessions[key as string] = session;
    }
    return sessions;
}

// Saves or updates a chat session in IndexedDB by its ID
export async function saveSession(id: string, session: ChatSession) {
    const db = await openDB(DB_NAME, 1);
    await db.put(STORE_NAME, session, id);
}

// Deletes a chat session from IndexedDB by its ID
export async function deleteSession(id: string) {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, id);
}

// Archives all sessions by setting their 'archived' property to true in IndexedDB
export async function archiveAllSessions() {
    const db = await openDB(DB_NAME, 1);
    const keys = await db.getAllKeys(STORE_NAME);
    for (const key of keys) {
        const session = await db.get(STORE_NAME, key as string);
        if (session && !session.archived) {
            session.archived = true;
            await db.put(STORE_NAME, session, key as string);
        }
    }
}