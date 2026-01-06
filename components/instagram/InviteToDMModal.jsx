/**
 * Invite to DM Modal Component
 * Modal for inviting a commenter to start a DM conversation
 */

import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

export default function InviteToDMModal({ comment, leadId, onClose, onSuccess }) {
    const [message, setMessage] = useState(generateTemplate(comment));
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const handleSend = async () => {
        if (!message.trim()) return;

        try {
            setSending(true);
            setError(null);

            // First, create/get conversation
            // Note: This assumes we have the Instagram user ID from the comment
            // In real implementation, you'd need to fetch or have this available

            const response = await fetch('/api/instagram/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: null, // Will create new conversation if needed
                    recipient_id: comment.instagram_user_id,
                    message_text: message.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                // Mark comment as responded
                await fetch('/api/instagram/mark-comment-responded', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        interaction_id: comment.id,
                        response_text: 'Invited to DM'
                    })
                });

                onSuccess?.();
                onClose();
            } else {
                setError(data.error || 'Failed to send DM invitation');
            }
        } catch (err) {
            console.error('Send DM invitation error:', err);
            setError('Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Invite to DM</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Comment Context */}
                <div className="p-6 bg-gray-50 border-b">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Their Comment:</p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-700 italic">"{comment.message_content}"</p>
                    </div>
                </div>

                {/* Message Editor */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Message:
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={sending}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm disabled:bg-gray-100"
                        rows={6}
                        placeholder="Type your message..."
                    />

                    <p className="mt-2 text-xs text-gray-400">
                        {message.length}/1000 characters
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={sending}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || sending || message.length > 1000}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send DM
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function generateTemplate(comment) {
    const commentPreview = comment.message_content.length > 50
        ? comment.message_content.substring(0, 50) + '...'
        : comment.message_content;

    return `Hi ${comment.instagram_username}! 👋

I saw your comment: "${commentPreview}"

I'd love to chat more about this! Feel free to send me a message if you have any questions or want to learn more.

Looking forward to connecting!`;
}
