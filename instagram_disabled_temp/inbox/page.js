/**
 * Instagram Inbox - Main Page
 * 3-panel layout for managing DM conversations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ConversationList from '@/components/instagram/ConversationList';
import ConversationThread from '@/components/instagram/ConversationThread';
import LeadInfoSidebar from '@/components/instagram/LeadInfoSidebar';
import { Instagram } from 'lucide-react';

export default function InstagramInboxPage() {
    const searchParams = useSearchParams();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Check for lead ID in URL params
    useEffect(() => {
        const leadId = searchParams.get('lead');
        if (leadId) {
            // Find conversation for this lead
            const conv = conversations.find(c => c.lead?.id === leadId);
            if (conv) {
                setSelectedConversation(conv);
            }
        }
    }, [searchParams, conversations]);

    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
    };

    const handleConversationUpdate = (updatedConversation) => {
        // Update conversation in list
        setConversations(prev =>
            prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        );

        // Update selected if it's the same conversation
        if (selectedConversation?.id === updatedConversation.id) {
            setSelectedConversation(updatedConversation);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
                    <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Instagram Inbox</h1>
                    <p className="text-sm text-gray-500">Manage DM conversations</p>
                </div>
            </div>

            {/* 3-Panel Layout */}
            <div className="flex-1 grid grid-cols-[320px_1fr_300px] overflow-hidden">
                {/* Left Panel - Conversation List */}
                <div className="border-r bg-white h-full overflow-hidden">
                    <ConversationList
                        selectedConversation={selectedConversation}
                        onSelect={handleConversationSelect}
                        onConversationsLoad={setConversations}
                    />
                </div>

                {/* Center Panel - Message Thread */}
                <div className="bg-gray-50 h-full">
                    <ConversationThread
                        conversation={selectedConversation}
                        onConversationUpdate={handleConversationUpdate}
                    />
                </div>

                {/* Right Panel - Lead Info */}
                <div className="border-l bg-white h-full overflow-y-auto">
                    {selectedConversation && (
                        <LeadInfoSidebar
                            conversation={selectedConversation}
                            onUpdate={handleConversationUpdate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
