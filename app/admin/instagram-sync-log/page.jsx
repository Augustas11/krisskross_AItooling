'use client';

/**
 * Instagram Sync Log Admin Page
 * Monitor sync jobs, view history, and trigger manual syncs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Instagram,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Play,
    Activity,
    MessageCircle,
    Users
} from 'lucide-react';

// ============ SYNC LOG ROW ============
function SyncLogRow({ log }) {
    const isSuccess = log.status === 'success';
    const isRunning = log.status === 'running';

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    {isSuccess ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : isRunning ? (
                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${isSuccess ? 'text-green-700' : isRunning ? 'text-blue-700' : 'text-red-700'
                        }`}>
                        {log.status?.charAt(0).toUpperCase() + log.status?.slice(1)}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">
                {formatDateTime(log.started_at)}
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">
                {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-blue-600">
                        <MessageCircle className="w-3 h-3" />
                        {log.conversations_synced || 0}
                    </span>
                    <span className="flex items-center gap-1 text-purple-600">
                        <Activity className="w-3 h-3" />
                        {log.messages_synced || 0}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                        <Users className="w-3 h-3" />
                        {log.leads_matched || 0}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                {log.error_message || '-'}
            </td>
        </tr>
    );
}

// ============ HELPER FUNCTIONS ============
function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ MAIN PAGE COMPONENT ============
export default function SyncLogPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const [stats, setStats] = useState({
        totalSyncs: 0,
        successRate: 0,
        lastSync: null,
        avgDuration: 0
    });

    // Fetch sync logs
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/instagram/sync-logs');
            const data = await res.json();

            if (data.success) {
                setLogs(data.logs || []);
                setStats(data.stats || {});
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Trigger manual sync
    const handleTriggerSync = async () => {
        if (isTriggering) return;

        setIsTriggering(true);
        try {
            const res = await fetch('/api/instagram/sync', {
                method: 'POST'
            });
            const data = await res.json();

            if (data.success) {
                // Refresh logs after a delay
                setTimeout(fetchLogs, 2000);
            } else {
                alert(data.error || 'Failed to trigger sync');
            }
        } catch (error) {
            console.error('Trigger sync failed:', error);
            alert('Failed to trigger sync');
        } finally {
            setIsTriggering(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Instagram className="w-6 h-6 text-white" />
                            </div>
                            Sync Monitoring
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Monitor Instagram sync jobs and performance
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleTriggerSync}
                            disabled={isTriggering}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {isTriggering ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Trigger Sync
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label="Total Syncs"
                        value={stats.totalSyncs}
                        icon={<Activity className="w-5 h-5" />}
                        color="blue"
                    />
                    <StatCard
                        label="Success Rate"
                        value={`${stats.successRate}%`}
                        icon={<CheckCircle className="w-5 h-5" />}
                        color={stats.successRate >= 90 ? 'green' : stats.successRate >= 70 ? 'yellow' : 'red'}
                    />
                    <StatCard
                        label="Last Sync"
                        value={stats.lastSync ? formatDateTime(stats.lastSync) : 'Never'}
                        icon={<Clock className="w-5 h-5" />}
                        color="purple"
                    />
                    <StatCard
                        label="Avg Duration"
                        value={`${stats.avgDuration}s`}
                        icon={<RefreshCw className="w-5 h-5" />}
                        color="gray"
                    />
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Sync History</h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-pink-500 mx-auto mb-3" />
                            <p className="text-gray-500">Loading sync logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No sync logs found</p>
                            <p className="text-sm text-gray-400">Trigger a sync to get started</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Started</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Results</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <SyncLogRow key={log.id} log={log} />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-amber-100 text-amber-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
        gray: 'bg-gray-100 text-gray-600'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
