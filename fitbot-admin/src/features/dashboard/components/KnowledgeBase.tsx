import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    Plus,
    File,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Database
} from 'lucide-react';
import { knowledgeBaseApi, DocumentResponse } from '../services/knowledgeBaseApi';

export const KnowledgeBase: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        try {
            setIsLoading(true);
            const data = await knowledgeBaseApi.getDocuments();
            setDocuments(data);
        } catch (err) {
            setError('Failed to load knowledge base documents.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        const allowedTypes = ['.pdf', '.docx', '.txt'];
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(extension)) {
            setError('Invalid file type. Please upload a .pdf, .docx, or .txt file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File is too large. Maximum size is 5MB.');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            setSuccess(null);
            await knowledgeBaseApi.uploadFile(file);
            setSuccess(`${file.name} uploaded and indexed successfully!`);
            fetchDocuments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload file.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, fileName: string) => {
        if (!confirm(`Are you sure you want to delete "${fileName}"? This will also remove all associated knowledge chunks.`)) {
            return;
        }

        try {
            await knowledgeBaseApi.deleteDocument(id);
            setSuccess(`Deleted ${fileName}`);
            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (err) {
            setError('Failed to delete document.');
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary-600" />
                        Knowledge Base
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload PDFs, DOCX, or TXT files to train your AI on specific gym rules, schedules, or pricing.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-200 transition-all disabled:opacity-50"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        Upload Document
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                    <button onClick={clearMessages} className="text-red-400 hover:text-red-600">×</button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-green-700 font-medium">{success}</p>
                    </div>
                    <button onClick={clearMessages} className="text-green-400 hover:text-green-600">×</button>
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="text-sm font-medium">Loading your knowledge base...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-6">
                            <FileText className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No documents yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            Your knowledge base is empty. Upload your first document to start training your AI assistant using the button above.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Knowledge Chunks</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Uploaded On</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    {doc.fileType === 'pdf' ? (
                                                        <File className="h-5 w-5 text-blue-500" />
                                                    ) : (
                                                        <FileText className="h-5 w-5 text-blue-500" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {doc.fileName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 uppercase">
                                                {doc.fileType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                                            {doc._count.chunks} chunks indexed
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(doc.id, doc.fileName)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete document"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
