import api from '../../../services/api';

export interface DocumentResponse {
    id: string;
    fileName: string;
    fileType: string;
    createdAt: string;
    _count: {
        chunks: number;
    };
}

export const knowledgeBaseApi = {
    getDocuments: async (): Promise<DocumentResponse[]> => {
        const response = await api.get('/knowledge-base');
        return response.data;
    },

    uploadFile: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/knowledge-base/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteDocument: async (id: string): Promise<any> => {
        const response = await api.delete(`/knowledge-base/${id}`);
        return response.data;
    },
};
