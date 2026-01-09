'use client';

/**
 * Instagram Pending Matches Admin Page
 * Manage unmatched Instagram users and link them to CRM leads
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Instagram,
    User,
    Link2,
    Search,
    RefreshCw,
    Check,
    X,
    AlertCircle,
    MessageCircle,
    UserPlus,
    Trash2,
    ChevronRight,
    Clock
} from 'lucide-react';

// ============ PENDING MATCH CARD ============
function PendingMatchCard({ match, onLink, onIgnore, onCreate, isProcessing }) {
    const [showLeadSearch, setShowLeadSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newLeadName, setNewLeadName] = useState(match.instagram_username || '');

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`/api/leads?search=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await res.json();
            setSearchResults(data.leads || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {match.instagram_username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            @{match.instagram_username}
                        </h3>
                        <p className="text-sm text-gray-500">
                            First seen: {formatDate(match.first_seen_at)}
                        </p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${match.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : match.status === 'ignored'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                    {match.status || 'Pending'}
                </span>
            </div>

            {/* Message Preview */}
            {match.message_preview && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>Last message</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                        "{match.message_preview}"
                    </p>
                </div>
            )}

            {/* Suggested Matches */}
            {match.suggested_leads && match.suggested_leads.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Suggested matches:</p>
                    <div className="space-y-2">
                        {match.suggested_leads.slice(0, 3).map(lead => (
                            <button
                                key={lead.id}
                                onClick={() => onLink(match.id, lead.id)}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left disabled:opacity-50"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">{lead.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">{lead.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-600 font-medium">
                                        {lead.similarity}% match
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-blue-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Manual Search */}
            {showLeadSearch && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search leads by name or email..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                        >
                            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="space-y-1">
                            {searchResults.map(lead => (
                                <button
                                    key={lead.id}
                                    onClick={() => onLink(match.id, lead.id)}
                                    disabled={isProcessing}
                                    className="w-full flex items-center justify-between p-2 hover:bg-white rounded transition-colors text-left disabled:opacity-50"
                                >
                                    <span className="text-sm">{lead.name}</span>
                                    <span className="text-xs text-gray-500">{lead.email}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Create New Lead */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Create New Lead
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-700">Lead Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newLeadName}
                                        onChange={(e) => setNewLeadName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                                        placeholder="Enter lead name"
                                    />
                                    <button
                                        onClick={() => onCreate(match.id, newLeadName)}
                                        disabled={isProcessing || !newLeadName.trim()}
                                        className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 text-xs font-medium"
                                    >
                                        Create
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowLeadSearch(!showLeadSearch)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                    <Link2 className="w-4 h-4" />
                    Link to Lead
                </button>
                <button
                    onClick={() => onIgnore(match.id)}
                    disabled={isProcessing}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ============ HELPER FUNCTIONS ============
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ============ MAIN PAGE COMPONENT ============
export default function PendingMatchesPage() {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filter, setFilter] = useState('pending'); // pending, ignored, all
    const [stats, setStats] = useState({ total: 0, pending: 0, linked: 0 });

    // Fetch pending matches
    const fetchMatches = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/instagram/pending-matches?status=${filter}`);
            const data = await res.json();

            if (data.success) {
                setMatches(data.pending || []);
                setStats(data.stats || { total: 0, pending: 0, linked: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch matches:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    // Link match to lead
    const handleLink = async (matchId, leadId) => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/instagram/pending-matches/${matchId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_id: leadId })
            });

            const data = await res.json();
            if (data.success) {
                fetchMatches();
            } else {
                alert(data.error || 'Failed to link match');
            }
        } catch (error) {
            console.error('Link failed:', error);
            alert('Failed to link match');
        } finally {
            setIsProcessing(false);
        }
    };

    // Create new lead
    const handleCreate = async (matchId, name) => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/instagram/pending-matches/${matchId}/create-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            const data = await res.json();
            if (data.success) {
                fetchMatches();
            } else {
                alert(data.error || 'Failed to create lead');
            }
        } catch (error) {
            console.error('Create failed:', error);
            alert('Failed to create lead');
        } finally {
            setIsProcessing(false);
        }
    };

    // Ignore match
    const handleIgnore = async (matchId) => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/instagram/pending-matches/${matchId}/ignore`, {
                method: 'POST'
            });

            const data = await res.json();
            if (data.success) {
                fetchMatches();
            }
        } catch (error) {
            console.error('Ignore failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

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
                            Pending Matches
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Link unmatched Instagram users to CRM leads
                        </p>
                    </div>
                    <button
                        onClick={fetchMatches}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label="Total Unmatched" value={stats.total} icon={<AlertCircle className="w-5 h-5" />} color="amber" />
                    <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="blue" />
                    <StatCard label="Linked Today" value={stats.linked} icon={<Check className="w-5 h-5" />} color="green" />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {['pending', 'ignored', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-pink-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Matches Grid */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
                        <p className="text-gray-500">Loading pending matches...</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">All Caught Up!</h3>
                        <p className="text-gray-500">No pending matches to review</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matches.map(match => (
                            <PendingMatchCard
                                key={match.id}
                                match={match}
                                onLink={handleLink}
                                onCreate={handleCreate}
                                onIgnore={handleIgnore}
                                isProcessing={isProcessing}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    const colors = {
        amber: 'bg-amber-100 text-amber-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
