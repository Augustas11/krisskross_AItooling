'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Users, Mail, MessageSquare,
    DollarSign, AlertTriangle, CheckCircle, Clock, Target
} from 'lucide-react';
import { TIERS } from '../lib/scoring-constants';

export default function LeadLifecycleDashboard() {
    const [funnelData, setFunnelData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all');

    useEffect(() => {
        fetchFunnelData();
    }, [dateRange]);

    const fetchFunnelData = async () => {
        setIsLoading(true);
        try {
            let url = '/api/analytics/funnel';

            // Add date filters if not "all"
            if (dateRange !== 'all') {
                const now = new Date();
                const from = new Date();

                switch (dateRange) {
                    case '7d':
                        from.setDate(now.getDate() - 7);
                        break;
                    case '30d':
                        from.setDate(now.getDate() - 30);
                        break;
                    case '90d':
                        from.setDate(now.getDate() - 90);
                        break;
                }

                url += `?from=${from.toISOString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setFunnelData(data);
            }
        } catch (error) {
            console.error('Error fetching funnel data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        );
    }

    if (!funnelData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">No data available</div>
            </div>
        );
    }

    const { funnel, statusBreakdown, tierBreakdown, conversionRates, scoresByTier } = funnelData;

    // Identify bottleneck (lowest conversion rate)
    const bottleneck = Object.entries(conversionRates)
        .filter(([key]) => key !== 'overallConversion')
        .reduce((min, [key, value]) =>
            parseFloat(value) < parseFloat(min[1]) ? [key, value] : min
        );

    const getBottleneckLabel = (key) => {
        const labels = {
            newToContacted: 'New → Contacted',
            contactedToEngaged: 'Contacted → Engaged',
            engagedToConverted: 'Engaged → Converted'
        };
        return labels[key] || key;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Lifecycle Dashboard</h2>
                    <p className="text-gray-600">Track your lead funnel and conversion rates</p>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    {['all', '7d', '30d', '90d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {range === 'all' ? 'All Time' : `Last ${range}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <MetricCard
                    title="Total Leads"
                    value={funnel.total}
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Contacted"
                    value={funnel.contacted}
                    subtitle={`${conversionRates.newToContacted}% of total`}
                    icon={Mail}
                    color="indigo"
                />
                <MetricCard
                    title="Engaged"
                    value={funnel.engaged}
                    subtitle={`${conversionRates.contactedToEngaged}% of contacted`}
                    icon={MessageSquare}
                    color="purple"
                />
                <MetricCard
                    title="Converted"
                    value={funnel.converted}
                    subtitle={`${conversionRates.overallConversion}% overall`}
                    icon={DollarSign}
                    color="green"
                />
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>

                <div className="space-y-4">
                    <FunnelStage
                        label="New Leads"
                        count={funnel.total}
                        percentage={100}
                        color="bg-blue-500"
                        nextStageRate={conversionRates.newToContacted}
                    />
                    <FunnelStage
                        label="Contacted"
                        count={funnel.contacted}
                        percentage={(funnel.contacted / funnel.total * 100).toFixed(0)}
                        color="bg-indigo-500"
                        nextStageRate={conversionRates.contactedToEngaged}
                    />
                    <FunnelStage
                        label="Engaged (Replied)"
                        count={funnel.engaged}
                        percentage={(funnel.engaged / funnel.total * 100).toFixed(0)}
                        color="bg-purple-500"
                        nextStageRate={conversionRates.engagedToConverted}
                    />
                    <FunnelStage
                        label="Converted (Paid)"
                        count={funnel.converted}
                        percentage={(funnel.converted / funnel.total * 100).toFixed(0)}
                        color="bg-green-500"
                        isLast
                    />
                </div>
            </div>

            {/* Bottleneck Alert */}
            {parseFloat(bottleneck[1]) < 20 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Bottleneck Detected</h4>
                        <p className="text-sm text-amber-800">
                            <strong>{getBottleneckLabel(bottleneck[0])}</strong> has the lowest conversion rate at {bottleneck[1]}%.
                            This is your biggest opportunity for improvement.
                        </p>
                    </div>
                </div>
            )}

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(statusBreakdown).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{status}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(count / funnel.total * 100).toFixed(0)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                        {count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tier Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Quality (Tier)</h3>
                    <div className="space-y-3">
                        {Object.entries(tierBreakdown).map(([tier, count]) => {
                            const tierConfig = TIERS[tier];
                            return (
                                <div key={tier} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tierConfig?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {tier}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Avg: {scoresByTier[tier]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${tierConfig?.bgColor || 'bg-gray-400'}`}
                                                style={{ width: `${(count / funnel.total * 100).toFixed(0)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Key Insights
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            Overall conversion rate: <strong>{conversionRates.overallConversion}%</strong>
                            {parseFloat(conversionRates.overallConversion) < 1 && ' (Below industry benchmark of 2-5%)'}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            {tierBreakdown.GREEN > 0
                                ? `You have ${tierBreakdown.GREEN} high-quality (GREEN) leads - prioritize these for outreach`
                                : 'No GREEN tier leads yet - focus on lead quality improvement'}
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            {funnel.dead > 0 && `${funnel.dead} leads marked as Dead - consider re-engagement campaign`}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, subtitle, icon: Icon, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{title}</span>
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
    );
}

// Funnel Stage Component
function FunnelStage({ label, count, percentage, color, nextStageRate, isLast }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500">({percentage}% of total)</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{count}</span>
            </div>
            <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                        className={`${color} h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium transition-all`}
                        style={{ width: `${percentage}%` }}
                    >
                        {percentage}%
                    </div>
                </div>
            </div>
            {!isLast && nextStageRate && (
                <div className="flex items-center justify-center mt-2 mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-px h-4 bg-gray-300" />
                        <span className="font-medium">{nextStageRate}% convert to next stage</span>
                        <div className="w-px h-4 bg-gray-300" />
                    </div>
                </div>
            )}
        </div>
    );
}
