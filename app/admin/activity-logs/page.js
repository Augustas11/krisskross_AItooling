'use client';

import { useState, useEffect } from 'react';

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchLogs();

        // Poll for new logs every 10s
        const interval = setInterval(() => {
            fetchLogs(true);
        }, 10000);

        return () => clearInterval(interval);
    }, [page]);

    const fetchLogs = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch(`/api/admin/activity-logs?limit=50&offset=${page * 50}`);
            const data = await res.json();
            if (res.ok) {
                setLogs(data.logs);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error(err);
            if (!silent) setError('Failed to fetch logs');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getActionColor = (actionType) => {
        if (actionType.includes('login') || actionType.includes('view')) return 'text-blue-600 bg-blue-100';
        if (actionType.includes('create') || actionType.includes('add')) return 'text-green-600 bg-green-100';
        if (actionType.includes('edit') || actionType.includes('update')) return 'text-yellow-600 bg-yellow-100';
        if (actionType.includes('delete') || actionType.includes('remove')) return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="py-6 px-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
                    <p className="mt-1 text-sm text-gray-500">Monitor access and changes within the CRM</p>
                </div>
                <button
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    onClick={() => alert('CSV Export - To Be Implemented')}
                >
                    Export to CSV
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Resource
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Timestamp
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details (JSON)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {log.users?.full_name || 'Unknown'} <span className="text-xs text-gray-500">({log.users?.email})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                                                        {log.action_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.resource_type ? `${log.resource_type} #${log.resource_id?.slice(0, 8)}...` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {JSON.stringify(log.details)}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && !loading && (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No activity logs found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
