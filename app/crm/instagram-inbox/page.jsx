'use client';

/**
 * Instagram Inbox Page
 * Unified view for SDRs to manage all Instagram interactions from CRM leads
 * Three-panel layout: Filters/Leads | Interaction Feed | Lead Context
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Instagram,
    MessageCircle,
    MessageSquare,
    Search,
    Filter,
    RefreshCw,
    User,
    Clock,
    Send,
    Eye,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Inbox
} from 'lucide-react';
import DMComposerModal from '@/components/instagram/DMComposerModal';

// ============ LEAD LIST SIDEBAR ============
function LeadListSidebar({ leads, selectedLeadId, onSelectLead, filters, onFilterChange, searchQuery, onSearchChange, isLoading }) {
    return (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Instagram Inbox
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {leads.length} leads with activity
                </p>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2">
                <FilterButton
                    active={filters.unread}
                    onClick={() => onFilterChange('unread', !filters.unread)}
                    icon={<AlertCircle className="w-3 h-3" />}
                >
                    Unread
                </FilterButton>
                <FilterButton
                    active={filters.dms}
                    onClick={() => onFilterChange('dms', !filters.dms)}
                    icon={<MessageCircle className="w-3 h-3" />}
                >
                    DMs
                </FilterButton>
                <FilterButton
                    active={filters.comments}
                    onClick={() => onFilterChange('comments', !filters.comments)}
                    icon={<MessageSquare className="w-3 h-3" />}
                >
                    Comments
                </FilterButton>
            </div>

            {/* Lead List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading...
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No leads with Instagram activity
                    </div>
                ) : (
                    leads.map(lead => (
                        <LeadListItem
                            key={lead.lead_id}
                            lead={lead}
                            isSelected={selectedLeadId === lead.lead_id}
                            onClick={() => onSelectLead(lead)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${active
                ? 'bg-pink-100 text-pink-700 border border-pink-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

function LeadListItem({ lead, isSelected, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-pink-50 border-l-4 border-l-pink-500' : ''
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                            {lead.lead_name}
                        </span>
                        {lead.unread_count > 0 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                {lead.unread_count}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-pink-600 truncate">
                        @{lead.instagram_username}
                    </div>
                    {lead.last_message_preview && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                            {lead.last_message_preview}
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-400">
                        {formatRelativeTime(lead.last_interaction_at)}
                    </div>
                    <div className="flex gap-1 mt-1 justify-end">
                        {lead.interaction_types?.includes('dm') && (
                            <MessageCircle className="w-3 h-3 text-blue-500" />
                        )}
                        {lead.interaction_types?.includes('comment') && (
                            <MessageSquare className="w-3 h-3 text-green-500" />
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

// ============ INTERACTION FEED ============
function InteractionFeed({ lead, interactions, isLoading, onMarkRead, onReply }) {
    if (!lead) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Select a lead to view interactions</p>
                    <p className="text-sm">Choose from the list on the left</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Conversations with {lead.lead_name}
                        </h3>
                        <p className="text-sm text-pink-600">@{lead.instagram_username}</p>
                    </div>
                    <button
                        onClick={() => onReply(lead)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-sm font-medium"
                    >
                        <Send className="w-4 h-4" />
                        Send DM
                    </button>
                </div>
            </div>

            {/* Interactions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="text-center text-gray-500 py-8">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading interactions...
                    </div>
                ) : interactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No interactions yet
                    </div>
                ) : (
                    interactions.map(interaction => (
                        <InteractionCard
                            key={interaction.id}
                            interaction={interaction}
                            onMarkRead={() => onMarkRead(interaction.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function InteractionCard({ interaction, onMarkRead }) {
    const isUnread = !interaction.read_at && interaction.direction === 'inbound';
    const isDM = interaction.interaction_type === 'dm';

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-4 ${isUnread ? 'border-l-4 border-l-pink-500 border-pink-200' : 'border-gray-200'
            }`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDM ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                    {isDM ? <MessageCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDM ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {isDM ? 'DM' : 'Comment'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${interaction.direction === 'inbound'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-purple-100 text-purple-700'
                            }`}>
                            {interaction.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                        {isUnread && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                Unread
                            </span>
                        )}
                    </div>

                    <p className="text-gray-800 text-sm">{interaction.content_text}</p>

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatRelativeTime(interaction.instagram_timestamp)}
                        </span>

                        {isUnread && (
                            <button
                                onClick={onMarkRead}
                                className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                Mark as read
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============ LEAD CONTEXT PANEL ============
function LeadContextPanel({ lead, onSendDM }) {
    if (!lead) {
        return (
            <div className="w-72 border-l border-gray-200 bg-white p-4 hidden lg:block">
                <div className="text-center text-gray-400 mt-8">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Select a lead to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-72 border-l border-gray-200 bg-white p-4 hidden lg:block overflow-y-auto">
            {/* Lead Info */}
            <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                    {lead.lead_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                    {lead.lead_name}
                </h3>
                <p className="text-sm text-pink-600 text-center">@{lead.instagram_username}</p>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
                <StatRow label="Total Interactions" value={lead.total_interactions || 0} />
                <StatRow label="Unread Messages" value={lead.unread_count || 0} highlight={lead.unread_count > 0} />
                <StatRow label="Last Activity" value={formatRelativeTime(lead.last_interaction_at)} />
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
                <button
                    onClick={() => onSendDM?.(lead)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all text-sm font-medium"
                >
                    <Send className="w-4 h-4" />
                    Send DM
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm">
                    <Eye className="w-4 h-4" />
                    View Lead Profile
                </button>
            </div>
        </div>
    );
}

function StatRow({ label, value, highlight }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{label}</span>
            <span className={`text-sm font-medium ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
                {value}
            </span>
        </div>
    );
}

// ============ HELPER FUNCTIONS ============
function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
}

// ============ MAIN PAGE COMPONENT ============
export default function InstagramInboxPage() {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(true);
    const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        unread: false,
        dms: false,
        comments: false
    });

    // DM Composer Modal state
    const [dmModalOpen, setDmModalOpen] = useState(false);
    const [dmModalLead, setDmModalLead] = useState(null);
    const [dmContextMessage, setDmContextMessage] = useState(null);

    // Fetch leads with Instagram interactions
    const fetchLeads = useCallback(async () => {
        setIsLoadingLeads(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (filters.unread) params.set('filter', 'unread');
            if (filters.dms) params.set('type', 'dm');
            if (filters.comments) params.set('type', 'comment');

            const res = await fetch(`/api/instagram/leads-with-interactions?${params}`);
            const data = await res.json();

            if (data.success) {
                setLeads(data.leads || []);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setIsLoadingLeads(false);
        }
    }, [searchQuery, filters]);

    // Fetch interactions for selected lead
    const fetchInteractions = useCallback(async (leadId) => {
        if (!leadId) return;
        setIsLoadingInteractions(true);
        try {
            const res = await fetch(`/api/instagram/interactions/${leadId}`);
            const data = await res.json();

            if (data.success) {
                setInteractions(data.interactions || []);
            }
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        } finally {
            setIsLoadingInteractions(false);
        }
    }, []);

    // Handle marking interaction as read
    const handleMarkRead = async (interactionId) => {
        try {
            await fetch('/api/instagram/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interactionId })
            });
            // Refresh interactions
            if (selectedLead) {
                fetchInteractions(selectedLead.lead_id);
            }
            // Also refresh lead list to update unread counts
            fetchLeads();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Handle reply action - opens DM Composer modal
    const handleReply = (lead, contextMessage = null) => {
        setDmModalLead(lead);
        setDmContextMessage(contextMessage);
        setDmModalOpen(true);
    };

    // Handle DM sent successfully
    const handleDmSuccess = () => {
        // Refresh interactions to show the sent message
        if (selectedLead) {
            fetchInteractions(selectedLead.lead_id);
        }
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Handle lead selection
    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        fetchInteractions(lead.lead_id);
    };

    // Initial load
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Instagram className="w-6 h-6 text-white" />
                            </div>
                            Instagram Inbox
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Manage all Instagram interactions with your CRM leads
                        </p>
                    </div>
                    <button
                        onClick={fetchLeads}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Three-Panel Layout */}
            <div className="flex h-[calc(100vh-88px)]">
                <LeadListSidebar
                    leads={leads}
                    selectedLeadId={selectedLead?.lead_id}
                    onSelectLead={handleSelectLead}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    isLoading={isLoadingLeads}
                />

                <InteractionFeed
                    lead={selectedLead}
                    interactions={interactions}
                    isLoading={isLoadingInteractions}
                    onMarkRead={handleMarkRead}
                    onReply={handleReply}
                />

                <LeadContextPanel lead={selectedLead} onSendDM={handleReply} />
            </div>

            {/* DM Composer Modal */}
            <DMComposerModal
                isOpen={dmModalOpen}
                onClose={() => setDmModalOpen(false)}
                lead={dmModalLead}
                contextMessage={dmContextMessage}
                onSuccess={handleDmSuccess}
            />
        </div>
    );
}
