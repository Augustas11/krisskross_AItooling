/**
 * Conversation Thread Component
 * Center panel - Displays message history for selected conversation
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Instagram, ExternalLink } from 'lucide-react';
import MessageComposer from './MessageComposer';

export default function ConversationThread({ conversation, onConversationUpdate }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (conversation) {
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [conversation?.id]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/instagram/messages/${conversation.id}`);
            const data = await response.json();

            if (data.success) {
                setMessages(data.messages);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleMessageSent = (newMessage) => {
        // Add message to local state immediately
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();

        // Refresh conversation list if needed
        onConversationUpdate?.(conversation);
    };

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm mt-1">Choose a conversation from the list to view messages</p>
                </div>
            </div>
        );
    }

    const leadName = conversation.lead?.name || conversation.instagram_username;

    return (
        <div className="h-full flex flex-col">
            {/* Thread Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {leadName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{leadName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>@{conversation.instagram_username}</span>
                            {conversation.lead && (
                                <>
                                    <span>·</span>
                                    <span className="text-blue-600">Score: {conversation.lead.score}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <a
                        href={`https://instagram.com/${conversation.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Instagram Profile"
                    >
                        <Instagram className="w-4 h-4 text-pink-500" />
                    </a>
                    {conversation.lead && (
                        <button
                            onClick={() => window.open(`/?leadId=${conversation.lead.id}`, '_blank')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Lead in CRM"
                        >
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p>No messages yet</p>
                    </div>
                ) : (
                    messages.map((message, idx) => (
                        <MessageBubble key={message.id || idx} message={message} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <MessageComposer
                conversation={conversation}
                onMessageSent={handleMessageSent}
            />
        </div>
    );
}

function MessageBubble({ message }) {
    const isInbound = message.direction === 'inbound';
    const timestamp = new Date(message.sent_at);

    return (
        <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] ${isInbound ? 'order-1' : 'order-2'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl ${isInbound
                            ? 'bg-white border border-gray-200 text-gray-900'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        }`}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_text || '(Media message)'}
                    </p>
                </div>
                <div className={`mt-1 px-2 text-xs text-gray-400 ${isInbound ? 'text-left' : 'text-right'}`}>
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.read_at && !isInbound && ' · Read'}
                </div>
            </div>
        </div>
    );
}
