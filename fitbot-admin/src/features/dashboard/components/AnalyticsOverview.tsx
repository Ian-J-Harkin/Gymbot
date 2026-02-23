import React, { useEffect, useState } from 'react';
import { configurationApi } from '../services/configurationApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Clock } from 'lucide-react';

interface AnalyticsData {
    totalInteractions: number;
    averageResponseTime: number;
    dailyVolume: { date: string; count: number }[];
}

export const AnalyticsOverview: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const analytics = await configurationApi.getAnalytics();
                setData(analytics);
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl w-full"></div>;
    }

    if (!data || data.totalInteractions === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Analytics Yet</h3>
                <p className="text-gray-500">Analytics data will appear here once users start chatting with your bot.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-4 bg-primary-50 rounded-xl text-primary-600">
                        <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Interactions (30d)</p>
                        <p className="text-3xl font-bold text-gray-900">{data.totalInteractions}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
                        <Clock className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                        <p className="text-3xl font-bold text-gray-900">{data.averageResponseTime} ms</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Chat Volume (Last 30 Days)</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.dailyVolume} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" axisLine={false} tickLine={false} allowDecimals={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <Tooltip
                                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
