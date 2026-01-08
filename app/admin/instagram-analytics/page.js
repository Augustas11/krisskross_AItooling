/**
 * Instagram Analytics Dashboard
 * Admin page for viewing Instagram integration metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Instagram, TrendingUp, MessageCircle, MessageSquare, AtSign, Users, Activity } from 'lucide-react';

export default function InstagramAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/instagram/analytics?period=${period}`);
            const data = await response.json();

            if (data.success) {
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    const { overview, engagement, timeline, top_leads, breakdown } = analytics;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                            <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Instagram Analytics</h1>
                            <p className="text-sm text-gray-500">Track engagement and performance metrics</p>
                        </div>
                    </div>

                    {/* Period Selector */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        icon={<Activity className="w-5 h-5 text-purple-500" />}
                        label="Total Interactions"
                        value={overview.total_interactions}
                        color="purple"
                    />
                    <MetricCard
                        icon={<MessageCircle className="w-5 h-5 text-pink-500" />}
                        label="DMs"
                        value={overview.total_dms}
                        color="pink"
                    />
                    <MetricCard
                        icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
                        label="Comments"
                        value={overview.total_comments}
                        color="blue"
                    />
                    <MetricCard
                        icon={<AtSign className="w-5 h-5 text-indigo-500" />}
                        label="Mentions"
                        value={overview.total_mentions}
                        color="indigo"
                    />
                </div>

                {/* Engagement & Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Engagement Metrics */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Engagement
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-600">Response Rate</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {Math.round(engagement.response_rate * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${engagement.response_rate * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-600">Match Rate</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {Math.round(engagement.match_rate * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${engagement.match_rate * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="text-sm text-gray-600">Responded</div>
                                <div className="text-2xl font-bold text-gray-900">{engagement.responded_count}</div>
                            </div>
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            Status
                        </h3>
                        <div className="space-y-3">
                            <StatusItem label="Active Conversations" value={overview.active_conversations} color="green" />
                            <StatusItem label="Matched Leads" value={overview.matched_leads} color="blue" />
                            <StatusItem label="Pending Matches" value={overview.pending_matches} color="orange" />
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Interaction Types</h3>
                        <div className="space-y-3">
                            <TypeBar label="DMs" value={breakdown.by_type.dms} total={overview.total_interactions} color="pink" />
                            <TypeBar label="Comments" value={breakdown.by_type.comments} total={overview.total_interactions} color="purple" />
                            <TypeBar label="Mentions" value={breakdown.by_type.mentions} total={overview.total_interactions} color="blue" />
                        </div>
                    </div>
                </div>

                {/* Top Engaged Leads */}
                {top_leads && top_leads.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Top Engaged Leads</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-500 border-b">
                                        <th className="pb-3">Rank</th>
                                        <th className="pb-3">Lead</th>
                                        <th className="pb-3">Score</th>
                                        <th className="pb-3">Interactions</th>
                                        <th className="pb-3">DMs</th>
                                        <th className="pb-3">Comments</th>
                                        <th className="pb-3">Mentions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {top_leads.map((lead, idx) => (
                                        <tr key={lead.lead_id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 font-medium text-gray-900">{lead.name}</td>
                                            <td className="py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{lead.score}</span></td>
                                            <td className="py-3 font-bold text-purple-600">{lead.interactions}</td>
                                            <td className="py-3 text-gray-600">{lead.dms}</td>
                                            <td className="py-3 text-gray-600">{lead.comments}</td>
                                            <td className="py-3 text-gray-600">{lead.mentions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, color }) {
    const colorClasses = {
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
        blue: 'from-blue-500 to-blue-600',
        indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg`}>
                    {React.cloneElement(icon, { className: 'w-5 h-5 text-white' })}
                </div>
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{value.toLocaleString()}</div>
        </div>
    );
}

function StatusItem({ label, value, color }) {
    const colors = {
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700'
    };

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors[color]}`}>
                {value}
            </span>
        </div>
    );
}

function TypeBar({ label, value, total, color }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const colors = {
        pink: 'bg-pink-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500'
    };

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-500">{value} ({Math.round(percentage)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`${colors[color]} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
