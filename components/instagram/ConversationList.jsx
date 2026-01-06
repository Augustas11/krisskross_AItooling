/**
 * Conversation List Component
 * Left panel - Shows all Instagram conversations with search and filters
 */

import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, AlertCircle } from 'lucide-react';

export default function ConversationList({ selectedConversation, onSelect, onConversationsLoad }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, needs_response, active, archived

    useEffect(() => {
        fetchConversations();
    }, [statusFilter]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/instagram/conversations?${params}`);
            const data = await response.json();

            if (data.success) {
                setConversations(data.conversations);
                onConversationsLoad?.(data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            conv.instagram_username?.toLowerCase().includes(search) ||
            conv.lead?.name?.toLowerCase().includes(search)
        );
    });

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Status Filters */}
            <div className="px-4 py-2 border-b bg-gray-50 flex gap-2">
                {['all', 'needs_response', 'active', 'archived'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === status
                                ? 'bg-pink-500 text-white'
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {status.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No conversations found</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredConversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isSelected={selectedConversation?.id === conv.id}
                                onClick={() => onSelect(conv)}
                                formatTimestamp={formatTimestamp}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConversationItem({ conversation, isSelected, onClick, formatTimestamp }) {
    const leadName = conversation.lead?.name || conversation.instagram_username;
    const hasUnread = conversation.unread_count > 0;
    const needsResponse = conversation.status === 'needs_response';

    return (
        <div
            onClick={onClick}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {leadName.substring(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {leadName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTimestamp(conversation.last_message_at)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500">@{conversation.instagram_username}</span>
                        {conversation.assigned_to && (
                            <span className="text-xs text-blue-600 ml-auto">· {conversation.assigned_to}</span>
                        )}
                    </div>

                    {conversation.last_message && (
                        <p className={`text-xs truncate ${hasUnread ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                            {conversation.last_message.direction === 'outbound' && 'You: '}
                            {conversation.last_message.message_text || '(Media)'}
                        </p>
                    )}

                    {/* Status Indicators */}
                    <div className="flex items-center gap-2 mt-2">
                        {hasUnread && (
                            <span className="px-2 py-0.5 bg-pink-500 text-white rounded-full text-xs font-bold">
                                {conversation.unread_count}
                            </span>
                        )}
                        {needsResponse && (
                            <span className="flex items-center gap-1 text-xs text-orange-600">
                                <AlertCircle className="w-3 h-3" />
                                Needs Response
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
