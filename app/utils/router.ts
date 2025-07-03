import axios from 'axios';
import { API_BASE_URL } from '../config';

// Structure of the FastAPI server response
export interface AskBotResponse {
    session_id: number;
    text: string;
}

/**
 * Sends a question to the FastAPI API and returns the response.
 * @param {number} session_id - The session identifier (integer).
 * @param {string} query - The question to ask.
 * @returns {Promise<AskBotResponse>} - The server's response.
 */
export async function askQuestion(session_id: number, query: string): Promise<AskBotResponse> {
    try {
        const response = await axios.get<AskBotResponse>(
            `${API_BASE_URL}/`,
            {
                params: { session_id, query },
                timeout: 100000,
            }
        );
        console.log('Server response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error(
            'Error during the request:',
            error.response?.data || error.message
        );
        throw new Error(
            error.response?.data?.detail || 'Unable to get a response from the server'
        );
    }
}

/**
 * Closes a session on the FastAPI server side.
 * @param {number} session_id - The session identifier to close.
 * @returns {Promise<{ msg: string }>} - The server's response.
 */
export async function closeSession(session_id: number): Promise<{ msg: string }> {
    try {
        const response = await axios.get<{ msg: string }>(`${API_BASE_URL}/close_session`, {
            params: { session_id },
            timeout: 10000,
        });
        return response.data;
    } catch (error: any) {
        console.error(
            'Error while closing the session:',
            error.response?.data || error.message
        );
        throw new Error(
            error.response?.data?.detail || 'Unable to close the session'
        );
    }
}