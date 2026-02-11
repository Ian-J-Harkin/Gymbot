import React, { useState, useEffect } from 'react';
import { chatLogsApi, ChatLogResponse } from '../services/chatLogsApi';
import {
    History,
    Search,
    Info,
    ChevronRight,
    Clock,
    Cpu,
    CheckCircle,
    AlertTriangle,
    FileText
} from 'lucide-react';

export const AuditLogList: React.FC = () => {
    const [logs, setLogs] = useState<ChatLogResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<ChatLogResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const data = await chatLogsApi.getLogs();
            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.aiResponse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <History className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Conversation Audit Logs</h2>
                            <p className="text-sm text-gray-500">Monitor chatbot performance and reasoning</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 min-w-[240px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-4" />
                            <p>Loading interaction history...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No conversations found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User Message</th>
                                    <th className="px-6 py-4">Response</th>
                                    <th className="px-6 py-4 text-center">Outcome</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLogs.map((log) => {
                                    const hasErrors = log.validationFlags.includes('ERROR');
                                    const hasBlocked = log.validationFlags.some(f => f.includes('block'));

                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-gray-900 line-clamp-1">{log.userMessage}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm">
                                                <p className="text-sm text-gray-600 line-clamp-1">{log.aiResponse}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {hasErrors ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Error
                                                    </span>
                                                ) : hasBlocked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Blocked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" /> Passed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Detail Modal/Drawer */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end p-4 sm:p-6 lg:p-8 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-full shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Interaction Details</h3>
                                <p className="text-sm text-gray-500">{formatDate(selectedLog.createdAt)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Message Bubble View */}
                            <div className="space-y-4">
                                <div className="flex flex-col items-end">
                                    <div className="bg-primary-600 text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-sm">
                                        {selectedLog.userMessage}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">User</span>
                                </div>

                                <div className="flex flex-col items-start">
                                    <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm border border-gray-200 shadow-sm">
                                        {selectedLog.aiResponse}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">Assistant</span>
                                </div>
                            </div>

                            {/* Explanation Layer Metadata */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-6">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center">
                                    <Info className="h-4 w-4 mr-2 text-primary-600" />
                                    Reasoning Metadata
                                </h4>

                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center">
                                            <Cpu className="h-3 w-3 mr-1" /> AI Provider
                                        </p>
                                        <p className="text-sm font-medium text-gray-700 capitalize">{selectedLog.provider}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center">
                                            <FileText className="h-3 w-3 mr-1" /> Context Length
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">{selectedLog.contextLength} characters</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center">
                                            <Clock className="h-3 w-3 mr-1" /> Response Time
                                        </p>
                                        <p className="text-sm font-medium text-gray-700">{selectedLog.responseTimeMs}ms</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Model
                                        </p>
                                        <p className="text-sm font-medium text-gray-700 truncate">{selectedLog.model || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Validation Results */}
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Safety & Validation Results</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLog.validationFlags.length > 0 ? (
                                            selectedLog.validationFlags.map((flag, idx) => (
                                                <span key={idx} className={`px-2 py-1 rounded-md text-[10px] font-bold ${flag === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
                                                    }`}>
                                                    {flag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No validation flags triggered.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component for X icon
function X({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
