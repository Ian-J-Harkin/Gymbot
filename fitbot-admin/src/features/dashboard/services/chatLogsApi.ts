import api from '../../../services/api';

export interface ChatLogResponse {
    id: string;
    userMessage: string;
    aiResponse: string;
    provider: string;
    model: string;
    contextLength: number;
    validationFlags: string[];
    responseTimeMs: number;
    createdAt: string;
}

export const chatLogsApi = {
    getLogs: async (): Promise<ChatLogResponse[]> => {
        const response = await api.get('/chat-logs');
        return response.data;
    },
};
