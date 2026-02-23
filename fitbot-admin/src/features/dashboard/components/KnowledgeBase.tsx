import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Trash2,
    Plus,
    File,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Database,
    Wand2,
    Save,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { knowledgeBaseApi, DocumentResponse } from '../services/knowledgeBaseApi';
import { configurationApi } from '../services/configurationApi';

export interface KnowledgeBaseProps {
    onDirtyChange?: (isDirty: boolean) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onDirtyChange }) => {
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isSavingQuickData, setIsSavingQuickData] = useState(false);
    const [isQuickStartOpen, setIsQuickStartOpen] = useState(true);
    const [quickStartData, setQuickStartData] = useState('');
    const [originalQuickStartData, setOriginalQuickStartData] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [docs, config] = await Promise.all([
                knowledgeBaseApi.getDocuments(),
                configurationApi.getConfiguration()
            ]);
            setDocuments(docs);
            setIsQuickStartOpen(docs.length === 0);
            const initialText = config.faqText || '';
            setQuickStartData(initialText);
            setOriginalQuickStartData(initialText);
        } catch (err) {
            setError('Failed to load knowledge base data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sync dirty state to parent based on text changes
    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(quickStartData !== originalQuickStartData);
        }
    }, [quickStartData, originalQuickStartData, onDirtyChange]);

    const handleSaveQuickData = async () => {
        try {
            setIsSavingQuickData(true);
            setError(null);
            setSuccess(null);

            // We need to fetch current config first to avoid overwriting other fields with defaults/nulls
            // Ideally backend handles PATCH or we have a more robust state management, 
            // but for now we read-modify-write.
            const currentConfig = await configurationApi.getConfiguration();

            await configurationApi.updateConfiguration({
                ...currentConfig,
                faqText: quickStartData,
                // Ensure required fields are present if updateConfiguration type demands them
                aiProvider: currentConfig.aiProvider || 'openai',
                widgetColor: currentConfig.widgetColor || '#2563EB'
            });

            setOriginalQuickStartData(quickStartData); // Reset dirty tracking after successful save
            setSuccess('Quick Start Data saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Failed to save Quick Start Data.');
        } finally {
            setIsSavingQuickData(false);
        }
    };

    const handleLoadDummyData = () => {
        const dummyFAQ = `Welcome to our Gym! (Example Data)

Q: What are your opening hours?
A: We are open Mon-Fri 6AM-10PM, Sat-Sun 8AM-8PM.

Q: Do you offer personal training?
A: Yes, we have certified trainers. Ask at the front desk.

Q: Membership cancellation policy?
A: You can cancel anytime with 30 days notice.`;
        setQuickStartData(dummyFAQ);
    };

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
            fetchData();
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
        <div className="space-y-8">
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

            {/* Quick Start Data Section (Accordion) */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all overflow-hidden ${documents.length > 0 ? 'opacity-75' : ''}`}>

                {/* Accordion Header */}
                <div
                    onClick={() => setIsQuickStartOpen(!isQuickStartOpen)}
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors select-none"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${documents.length > 0 ? 'bg-gray-100 text-gray-600' : 'bg-primary-50 text-primary-600'}`}>
                            <Wand2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold flex items-center gap-3 ${documents.length > 0 ? 'text-gray-800' : 'text-gray-900'}`}>
                                Quick Start Data
                                {documents.length > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                        Disabled (Files Uploaded)
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600">
                                Simple text fallback for when no documents are uploaded.
                            </p>
                        </div>
                    </div>
                    {isQuickStartOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
                </div>

                {/* Accordion Content */}
                {isQuickStartOpen && (
                    <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                        {documents.length > 0 && (
                            <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-xl flex items-start gap-3">
                                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold">Quick Start Disabled</p>
                                    <p className="text-xs mt-1 text-blue-700">
                                        This field is locked because you have uploaded documents. The bot will now ignore this text and answer strictly based on your uploaded files.
                                    </p>
                                    <p className="text-xs mt-1 text-blue-700">Delete all documents below to re-enable this mode.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 mb-3">
                            <button
                                type="button"
                                onClick={handleLoadDummyData}
                                disabled={documents.length > 0 || isSavingQuickData}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium bg-primary-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Load Example FAQ
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveQuickData}
                                disabled={documents.length > 0 || isSavingQuickData}
                                className="flex items-center text-sm bg-primary-600 text-white hover:bg-primary-700 font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingQuickData ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                Save Text
                            </button>
                        </div>

                        <textarea
                            value={quickStartData}
                            onChange={(e) => setQuickStartData(e.target.value)}
                            rows={6}
                            disabled={documents.length > 0}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-primary-500 focus:border-primary-500 font-mono bg-gray-50 mb-0 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                            placeholder="Q: ... A: ..."
                        />
                    </div>
                )}
            </div>

            {/* Document Upload Section */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Uploaded Documents</h3>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                Upload File
                            </button>
                        </div>
                    </div>
                </div>

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
                            Upload your first document to start training your AI assistant.
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
            </div >
        </div >
    );
};
