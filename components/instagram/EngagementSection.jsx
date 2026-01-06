/**
 * Instagram Engagement Section Component
 * Displays Instagram interaction summary in LeadIntelligenceCard
 */

import React, { useState, useEffect } from 'react';
import { Instagram, MessageCircle, MessageSquare, AtSign, TrendingUp, Send, Eye } from 'lucide-react';

export function InstagramEngagementSection({ leadId, instagramHandle }) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (leadId) {
            fetchInstagramSummary();
        }
    }, [leadId]);

    const fetchInstagramSummary = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/instagram/lead-summary/${leadId}`);
            const data = await response.json();

            if (data.success) {
                setSummary(data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('Failed to fetch Instagram summary:', err);
            setError('Failed to load Instagram data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
            </div>
        );
    }

    if (error || !summary?.has_instagram) {
        return null; // Don't show section if no Instagram data
    }

    const { summary: stats, recent_interactions, active_conversation } = summary;

    // Engagement level colors
    const engagementColors = {
        hot: 'bg-red-50 border-red-200 text-red-700',
        warm: 'bg-orange-50 border-orange-200 text-orange-700',
        cold: 'bg-blue-50 border-blue-200 text-blue-700'
    };

    const engagementBadgeColor = engagementColors[stats.engagement_level] || engagementColors.cold;

    return (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
                        <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Instagram Activity</h3>
                        <p className="text-xs text-gray-500">@{instagramHandle || summary.instagram_handle}</p>
                    </div>
                </div>

                {/* Engagement Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${engagementBadgeColor} flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" />
                    {stats.engagement_level.toUpperCase()}
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard
                    icon={<MessageCircle className="w-4 h-4 text-pink-500" />}
                    label="DMs"
                    value={stats.dm_count}
                />
                <StatCard
                    icon={<MessageSquare className="w-4 h-4 text-purple-500" />}
                    label="Comments"
                    value={stats.comment_count}
                />
                <StatCard
                    icon={<AtSign className="w-4 h-4 text-blue-500" />}
                    label="Mentions"
                    value={stats.mention_count}
                />
            </div>

            {/* Engagement Score */}
            <div className="bg-white rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Engagement Score</span>
                    <span className="text-lg font-bold text-gray-900">{stats.engagement_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.engagement_score}%` }}
                    />
                </div>
            </div>

            {/* Active Conversation Alert */}
            {active_conversation && active_conversation.unread_count > 0 && (
                <div className="bg-pink-100 border border-pink-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-pink-600" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-pink-800">
                                {active_conversation.unread_count} unread message{active_conversation.unread_count > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-pink-600">
                                Last message: {new Date(active_conversation.last_message_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Interactions */}
            {recent_interactions && recent_interactions.length > 0 && (
                <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Recent Activity</p>
                    {recent_interactions.slice(0, 3).map((interaction, idx) => (
                        <InteractionItem key={idx} interaction={interaction} />
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => window.open(`/instagram/inbox?lead=${leadId}`, '_blank')}
                    className="px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                    disabled={!active_conversation}
                >
                    <Eye className="w-4 h-4" />
                    View Conversation
                </button>
                <button
                    onClick={() => {
                        // TODO: Open DM composer modal
                        alert('Send DM feature coming in Phase 4!');
                    }}
                    className="px-3 py-2 bg-white border border-pink-300 text-pink-600 text-sm font-medium rounded-lg hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Send DM
                </button>
            </div>
        </div>
    );
}

// Helper Components
function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white rounded-lg p-2 text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}

function InteractionItem({ interaction }) {
    const icons = {
        dm: <MessageCircle className="w-3 h-3 text-pink-500" />,
        comment: <MessageSquare className="w-3 h-3 text-purple-500" />,
        mention: <AtSign className="w-3 h-3 text-blue-500" />
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="flex items-start gap-2 bg-white rounded-lg p-2 text-xs">
            <div className="mt-0.5">{icons[interaction.interaction_type]}</div>
            <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate">
                    {interaction.message_content || `${interaction.interaction_type} interaction`}
                </p>
                <p className="text-gray-400 text-xs">{formatDate(interaction.instagram_timestamp)}</p>
            </div>
        </div>
    );
}

export default InstagramEngagementSection;
