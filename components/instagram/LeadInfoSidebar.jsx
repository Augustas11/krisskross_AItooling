/**
 * Lead Info Sidebar Component
 * Right panel - Shows lead context and conversation management
 */

import React from 'react';
import { User, Instagram, TrendingUp, Archive, Calendar, ExternalLink, MessageSquare } from 'lucide-react';

export default function LeadInfoSidebar({ conversation, onUpdate }) {
    const lead = conversation?.lead;

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await fetch(`/api/instagram/conversations/${conversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (data.success) {
                onUpdate?.(data.conversation);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleAssignmentChange = async (assignee) => {
        try {
            const response = await fetch(`/api/instagram/conversations/${conversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: assignee || null })
            });

            const data = await response.json();
            if (data.success) {
                onUpdate?.(data.conversation);
            }
        } catch (error) {
            console.error('Failed to update assignment:', error);
        }
    };

    if (!conversation) {
        return null;
    }

    return (
        <div className="p-4 space-y-6">
            {/* Lead Profile */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Lead Profile
                </h3>

                {lead ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {lead.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                <p className="text-sm text-gray-500">@{lead.instagram_handle || lead.instagram}</p>
                            </div>
                        </div>

                        {/* Lead Score */}
                        {lead.score !== null && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600">Match Score</span>
                                    <span className="text-2xl font-black text-indigo-600">{lead.score}</span>
                                </div>
                            </div>
                        )}

                        {/* View in CRM */}
                        <button
                            onClick={() => window.open(`/?leadId=${lead.id}`, '_blank')}
                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Full Profile
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="font-medium text-yellow-800 mb-1">Not Matched to Lead</p>
                        <p className="text-xs text-yellow-700">
                            This Instagram user hasn't been matched to a CRM lead yet.
                        </p>
                    </div>
                )}
            </div>

            {/* Instagram Profile */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <Instagram className="w-3 h-3" />
                    Instagram
                </h3>

                <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">Username</span>
                        <a
                            href={`https://instagram.com/${conversation.instagram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-pink-600 hover:underline"
                        >
                            @{conversation.instagram_username}
                        </a>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">Messages</span>
                        <span className="text-sm font-semibold text-gray-900">
                            {conversation.message_count || 0}
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">Started</span>
                        <span className="text-sm text-gray-700">
                            {new Date(conversation.created_at || conversation.last_message_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Conversation Management */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Management
                </h3>

                <div className="space-y-3">
                    {/* Status Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                        <select
                            value={conversation.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="active">Active</option>
                            <option value="needs_response">Needs Response</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    {/* Assign To */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned To</label>
                        <select
                            value={conversation.assigned_to || ''}
                            onChange={(e) => handleAssignmentChange(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                        >
                            <option value="">Unassigned</option>
                            <option value="Aug">Aug</option>
                            <option value="Reda">Reda</option>
                            <option value="Paulius">Paulius</option>
                        </select>
                    </div>

                    {/* Archive Button */}
                    {conversation.status !== 'archived' && (
                        <button
                            onClick={() => handleStatusChange('archived')}
                            className="w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Archive className="w-4 h-4" />
                            Archive Conversation
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            {lead && (
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Quick Stats
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-gray-900">{conversation.unread_count || 0}</div>
                            <div className="text-xs text-gray-500">Unread</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-gray-900">{conversation.message_count || 0}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
