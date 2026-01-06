/**
 * Comment List Component
 * Displays Instagram comments from a lead with response tracking
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Send, ExternalLink, Clock } from 'lucide-react';
import InviteToDMModal from './InviteToDMModal';

export default function CommentList({ leadId, onUpdate }) {
    const [comments, setComments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);

    useEffect(() => {
        if (leadId) {
            fetchComments();
        }
    }, [leadId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/instagram/lead-comments/${leadId}`);
            const data = await response.json();

            if (data.success && data.has_instagram) {
                setComments(data.comments);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResponded = async (commentId) => {
        try {
            const response = await fetch('/api/instagram/mark-comment-responded', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interaction_id: commentId })
            });

            const data = await response.json();
            if (data.success) {
                // Update local state
                setComments(prev =>
                    prev.map(c => c.id === commentId ? { ...c, responded_at: new Date().toISOString() } : c)
                );

                // Update summary
                setSummary(prev => ({
                    ...prev,
                    responded_count: (prev.responded_count || 0) + 1,
                    response_rate: ((prev.responded_count || 0) + 1) / prev.total_comments
                }));

                onUpdate?.();
            }
        } catch (error) {
            console.error('Failed to mark comment:', error);
        }
    };

    const handleInviteToDM = (comment) => {
        setSelectedComment(comment);
        setShowInviteModal(true);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-100 rounded-lg h-24"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!summary || summary.total_comments === 0) {
        return (
            <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No Instagram comments yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-purple-600">{summary.total_comments}</div>
                        <div className="text-xs text-purple-600 font-medium">Total</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-pink-600">{summary.recent_comments}</div>
                        <div className="text-xs text-pink-600 font-medium">Last 7 Days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-indigo-600">
                            {Math.round(summary.response_rate * 100)}%
                        </div>
                        <div className="text-xs text-indigo-600 font-medium">Responded</div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.map(comment => (
                    <CommentCard
                        key={comment.id}
                        comment={comment}
                        onMarkResponded={handleMarkResponded}
                        onInviteToDM={handleInviteToDM}
                        formatTimestamp={formatTimestamp}
                    />
                ))}
            </div>

            {/* Invite to DM Modal */}
            {showInviteModal && selectedComment && (
                <InviteToDMModal
                    comment={selectedComment}
                    leadId={leadId}
                    onClose={() => {
                        setShowInviteModal(false);
                        setSelectedComment(null);
                    }}
                    onSuccess={() => {
                        fetchComments();
                        onUpdate?.();
                    }}
                />
            )}
        </div>
    );
}

function CommentCard({ comment, onMarkResponded, onInviteToDM, formatTimestamp }) {
    const isResponded = !!comment.responded_at;

    return (
        <div className={`bg-white rounded-lg border p-4 ${isResponded ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
            }`}>
            <div className="flex items-start gap-3">
                {/* Comment Content */}
                <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-2">{comment.message_content}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(comment.instagram_timestamp)}
                        </span>

                        {isResponded && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Responded
                            </span>
                        )}
                    </div>

                    {/* Metadata */}
                    {comment.metadata?.media_id && (
                        <a
                            href={`https://www.instagram.com/p/${comment.metadata.media_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-pink-600 hover:underline"
                        >
                            <ExternalLink className="w-3 h-3" />
                            View Post
                        </a>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    {!isResponded && (
                        <>
                            <button
                                onClick={() => onMarkResponded(comment.id)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Mark Responded
                            </button>
                            <button
                                onClick={() => onInviteToDM(comment)}
                                className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded text-xs font-medium hover:from-pink-600 hover:to-purple-700 transition-all flex items-center gap-1"
                            >
                                <Send className="w-3 h-3" />
                                Invite to DM
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
