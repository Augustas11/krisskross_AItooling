'use client';

/**
 * Conversation Thread Page
 * Full-screen chat interface showing complete DM conversation history
 * Chat-style bubbles with inline message composer
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft,
    Send,
    Loader2,
    Instagram,
    MessageCircle,
    Clock,
    CheckCircle2,
    User,
    RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============ MESSAGE BUBBLE ============
function MessageBubble({ message, isOutbound }) {
    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[70%] ${isOutbound ? 'order-2' : 'order-1'}`}>
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 ${isOutbound
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_content || message.content_text}
                    </p>
                </div>

                {/* Timestamp & Status */}
                <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'
                    }`}>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                        {formatTime(message.instagram_timestamp || message.sent_at)}
                    </span>
                    {isOutbound && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ INLINE MESSAGE COMPOSER ============
function InlineComposer({ conversationId, recipientId, onMessageSent, disabled }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const textareaRef = useRef(null);

    const handleSend = async () => {
        if (!message.trim() || sending) return;

        if (message.length > 1000) {
            alert('Message exceeds 1000 character limit');
            return;
        }

        try {
            setSending(true);

            const response = await fetch('/api/instagram/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    recipient_id: recipientId,
                    message_text: message.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage('');
                onMessageSent?.(data.message);
            } else {
                alert(data.error || 'Failed to send message');
            }
        } catch (err) {
            console.error('Send error:', err);
            alert('Failed to send message');
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

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [message]);

    const charCount = message.length;
    const showCharCount = charCount > 900;
    const isOverLimit = charCount > 1000;

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={sending || disabled}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm disabled:bg-gray-100"
                        rows={1}
                    />
                    {showCharCount && (
                        <div className={`absolute bottom-2 right-3 text-xs font-mono ${isOverLimit ? 'text-red-600' : 'text-gray-400'
                            }`}>
                            {charCount}/1000
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending || isOverLimit || disabled}
                    className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
                Press Cmd/Ctrl + Enter to send
            </p>
        </div>
    );
}

// ============ HELPER FUNCTIONS ============
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============ MAIN PAGE COMPONENT ============
export default function ConversationThreadPage({ params }) {
    const router = useRouter();
    const { id: conversationId } = params;

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch conversation and messages
    const fetchConversation = useCallback(async () => {
        if (!conversationId) return;

        try {
            setIsLoading(true);
            setError(null);

            const res = await fetch(`/api/instagram/conversations/${conversationId}/messages`);
            const data = await res.json();

            if (data.success) {
                setConversation(data.conversation);
                setMessages(data.messages || []);

                // Mark as read
                await fetch(`/api/instagram/conversations/${conversationId}/mark-read`, {
                    method: 'POST'
                });
            } else {
                setError(data.error || 'Failed to load conversation');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    // Initial load
    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle new message sent
    const handleMessageSent = (newMessage) => {
        setMessages(prev => [...prev, {
            id: newMessage.id || `temp_${Date.now()}`,
            message_content: newMessage.message_text || newMessage.text,
            direction: 'outbound',
            instagram_timestamp: new Date().toISOString()
        }]);
    };

    const handleBack = () => {
        router.push('/crm/instagram-inbox');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversation</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                        Back to Inbox
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {conversation?.lead_name?.charAt(0)?.toUpperCase() ||
                            conversation?.instagram_username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900">
                            {conversation?.lead_name || 'Instagram User'}
                        </h1>
                        <p className="text-sm text-pink-600">
                            @{conversation?.instagram_username || 'unknown'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchConversation}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                ) : (
                    <>
                        {/* Date Separator - Today */}
                        <div className="flex justify-center mb-4">
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                Conversation History
                            </span>
                        </div>

                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message.id || index}
                                message={message}
                                isOutbound={message.direction === 'outbound'}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Inline Composer */}
            <InlineComposer
                conversationId={conversationId}
                recipientId={conversation?.instagram_user_id}
                onMessageSent={handleMessageSent}
                disabled={!conversation}
            />
        </div>
    );
}
