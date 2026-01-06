/**
 * Message Composer Component
 * Text input with send button for composing DMs
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function MessageComposer({ conversation, onMessageSent }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const textareaRef = useRef(null);

    // Load draft from localStorage
    useEffect(() => {
        if (conversation?.id) {
            const draft = localStorage.getItem(`instagram_draft_${conversation.id}`);
            if (draft) setMessage(draft);
        }
    }, [conversation?.id]);

    // Save draft to localStorage
    useEffect(() => {
        if (conversation?.id && message) {
            localStorage.setItem(`instagram_draft_${conversation.id}`, message);
        }
    }, [message, conversation?.id]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleSend = async () => {
        if (!message.trim() || !conversation) return;

        if (message.length > 1000) {
            setError('Message exceeds 1000 character limit');
            return;
        }

        try {
            setSending(true);
            setError(null);

            const response = await fetch('/api/instagram/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversation.id,
                    recipient_id: conversation.instagram_user_id,
                    message_text: message.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                // Clear message and draft
                setMessage('');
                localStorage.removeItem(`instagram_draft_${conversation.id}`);

                // Notify parent
                onMessageSent?.(data.message);
            } else {
                setError(data.error || 'Failed to send message');
            }
        } catch (err) {
            console.error('Send message error:', err);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        // Send on Cmd/Ctrl + Enter
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    const charCount = message.length;
    const showCharCount = charCount > 900;
    const isOverLimit = charCount > 1000;

    if (!conversation) {
        return (
            <div className="p-4 text-center text-gray-400 text-sm">
                Select a conversation to send a message
            </div>
        );
    }

    return (
        <div className="border-t bg-white p-4">
            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-2 items-end">
                {/* Text Area */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm max-h-32 disabled:bg-gray-100"
                        rows={1}
                    />

                    {/* Character Count */}
                    {showCharCount && (
                        <div className={`absolute bottom-2 right-2 text-xs font-mono ${isOverLimit ? 'text-red-600 font-bold' : 'text-gray-400'
                            }`}>
                            {charCount}/1000
                        </div>
                    )}
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending || isOverLimit}
                    className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    {sending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Send
                        </>
                    )}
                </button>
            </div>

            {/* Keyboard Hint */}
            <p className="mt-2 text-xs text-gray-400 text-center">
                Press Cmd/Ctrl + Enter to send
            </p>
        </div>
    );
}
