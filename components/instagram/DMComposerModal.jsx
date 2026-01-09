'use client';

/**
 * DM Composer Modal Component
 * Full-screen modal for composing and sending Instagram DMs
 * Used from Instagram Inbox and LeadIntelligenceCard
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Loader2,
    Instagram,
    MessageCircle,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';

export default function DMComposerModal({
    isOpen,
    onClose,
    lead,
    conversationId,
    contextMessage,
    onSuccess
}) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState(null);
    const textareaRef = useRef(null);

    // Focus textarea on open
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleSend = async () => {
        if (!message.trim() || !lead) return;

        if (message.length > 1000) {
            setError('Message exceeds 1000 character limit');
            return;
        }

        try {
            setSending(true);
            setError(null);

            const response = await fetch('/api/instagram/send-dm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_id: lead.lead_id,
                    instagram_username: lead.instagram_username,
                    conversation_id: conversationId,
                    message_text: message.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setMessage('');

                // Auto-close after success
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 1500);
            } else {
                if (data.rate_limit) {
                    setRateLimitInfo(data.rate_limit);
                }
                setError(data.error || 'Failed to send message');
            }
        } catch (err) {
            console.error('Send DM error:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    const charCount = message.length;
    const showCharCount = charCount > 800;
    const isOverLimit = charCount > 1000;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Send DM</h3>
                                <p className="text-sm text-white/80">
                                    to @{lead?.instagram_username || 'unknown'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Lead Info */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {lead?.lead_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{lead?.lead_name}</p>
                            <p className="text-sm text-pink-600">@{lead?.instagram_username}</p>
                        </div>
                    </div>
                </div>

                {/* Context Message (if replying) */}
                {contextMessage && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium mb-1">Replying to:</p>
                                <p className="text-sm text-gray-700 line-clamp-2">
                                    "{contextMessage}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">
                    {/* Success State */}
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                Message Sent!
                            </h4>
                            <p className="text-sm text-gray-500">
                                DM delivered to @{lead?.instagram_username}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-700">{error}</p>
                                        {rateLimitInfo && (
                                            <p className="text-xs text-red-500 mt-1">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {rateLimitInfo.sent_today}/50 DMs sent today. Limit resets at midnight.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Textarea */}
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    disabled={sending}
                                    className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm min-h-[120px] disabled:bg-gray-100 ${isOverLimit ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    rows={4}
                                />

                                {/* Character Count */}
                                {showCharCount && (
                                    <div className={`absolute bottom-3 right-3 text-xs font-mono ${isOverLimit ? 'text-red-600 font-bold' : 'text-gray-400'
                                        }`}>
                                        {charCount}/1000
                                    </div>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-gray-400 text-center">
                                Press Cmd/Ctrl + Enter to send
                            </p>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={sending}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || sending || isOverLimit}
                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
                )}
            </div>
        </div>
    );
}
