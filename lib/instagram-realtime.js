/**
 * Instagram Realtime Subscriptions
 * Supabase Realtime helpers for live updates
 */

import { supabase } from './supabase';

/**
 * Subscribe to new messages in a conversation
 * @param {string} conversationId - Conversation ID to monitor
 * @param {function} callback - Function to call when new message arrives
 * @returns {object} Subscription object (call .unsubscribe() to cleanup)
 */
export function subscribeToNewMessages(conversationId, callback) {
    const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'instagram_messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                console.log('📨 New message received:', payload.new);
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
}

/**
 * Subscribe to conversation updates (status, unread count, etc)
 * @param {function} callback - Function to call when conversations update
 * @returns {object} Subscription object
 */
export function subscribeToConversationUpdates(callback) {
    const channel = supabase
        .channel('all-conversations')
        .on(
            'postgres_changes',
            {
                event: '*', // INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'instagram_conversations'
            },
            (payload) => {
                console.log('💬 Conversation updated:', payload);
                callback(payload);
            }
        )
        .subscribe();

    return channel;
}

/**
 * Subscribe to new Instagram interactions (DMs, comments, mentions)
 * @param {string} leadId - Optional: filter by specific lead
 * @param {function} callback - Function to call when new interaction arrives
 * @returns {object} Subscription object
 */
export function subscribeToNewInteractions(leadId, callback) {
    const channelName = leadId ? `lead-${leadId}-interactions` : 'all-interactions';

    const config = {
        event: 'INSERT',
        schema: 'public',
        table: 'instagram_interactions'
    };

    if (leadId) {
        config.filter = `lead_id=eq.${leadId}`;
    }

    const channel = supabase
        .channel(channelName)
        .on('postgres_changes', config, (payload) => {
            console.log('⚡ New interaction:', payload.new);
            callback(payload.new);
        })
        .subscribe();

    return channel;
}

/**
 * Unsubscribe from a channel
 * @param {object} subscription - Subscription object from subscribe functions
 */
export async function unsubscribe(subscription) {
    if (subscription) {
        await supabase.removeChannel(subscription);
        console.log('🔌 Unsubscribed from channel');
    }
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll() {
    await supabase.removeAllChannels();
    console.log('🔌 Unsubscribed from all channels');
}

export default {
    subscribeToNewMessages,
    subscribeToConversationUpdates,
    subscribeToNewInteractions,
    unsubscribe,
    unsubscribeAll
};
