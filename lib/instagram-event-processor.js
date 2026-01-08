/**
 * Instagram Event Processor
 * 
 * Processes Instagram webhook events and stores them in the database
 * Handles DMs, comments, and mentions with automatic lead matching
 */

import { supabase } from './supabase.js';
import { matchInstagramToLead } from './instagram-lead-matching.js';

/**
 * Process incoming Instagram DM event
 * @param {object} event - Message event from webhook
 * @returns {object} - Processing result
 */
export async function processMessageEvent(event) {
    try {
        const { senderId, message, timestamp } = event;

        if (!senderId || !message) {
            return { success: false, error: 'Missing required fields' };
        }

        // Get sender info (we'll need to call Instagram API to get username)
        // For now, use senderId as placeholder
        const instagramUsername = senderId; // TODO: Fetch actual username from API

        // Try to match Instagram user to lead
        const matchResult = await matchInstagramToLead(instagramUsername, {
            instagramUserId: senderId,
            interactionType: 'dm',
            messagePreview: message.text?.substring(0, 100)
        });

        // Store interaction
        const { data: interaction, error: interactionError } = await supabase
            .from('instagram_interactions')
            .insert({
                lead_id: matchResult.lead?.id || null,
                interaction_type: 'dm',
                instagram_user_id: senderId,
                instagram_username: instagramUsername,
                message_content: message.text || null,
                media_url: message.attachments?.[0]?.payload?.url || null,
                instagram_timestamp: new Date(timestamp).toISOString(),
                metadata: {
                    message_id: message.mid,
                    attachments: message.attachments || []
                }
            })
            .select()
            .single();

        if (interactionError) {
            console.error('Failed to store interaction:', interactionError);
            return { success: false, error: interactionError.message };
        }

        // If matched to lead, update or create conversation
        if (matchResult.lead) {
            await upsertConversation(senderId, instagramUsername, matchResult.lead.id, timestamp);
        }

        console.log(`✓ Processed DM from ${instagramUsername}`);
        return { success: true, interaction, matched: !!matchResult.lead };

    } catch (error) {
        console.error('Error processing message event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Process incoming Instagram comment event
 * @param {object} event - Comment event from webhook
 * @returns {object} - Processing result
 */
export async function processCommentEvent(event) {
    try {
        const { value } = event;

        if (!value || !value.from) {
            return { success: false, error: 'Missing required fields' };
        }

        const instagramUsername = value.from.username;
        const commentText = value.text;

        // Try to match Instagram user to lead
        const matchResult = await matchInstagramToLead(instagramUsername, {
            instagramUserId: value.from.id,
            interactionType: 'comment',
            messagePreview: commentText?.substring(0, 100)
        });

        // Store interaction
        const { data: interaction, error: interactionError } = await supabase
            .from('instagram_interactions')
            .insert({
                lead_id: matchResult.lead?.id || null,
                interaction_type: 'comment',
                instagram_user_id: value.from.id,
                instagram_username: instagramUsername,
                message_content: commentText,
                media_url: null,
                instagram_timestamp: new Date(value.created_time * 1000).toISOString(),
                metadata: {
                    comment_id: value.id,
                    media_id: value.media?.id,
                    parent_id: value.parent_id
                }
            })
            .select()
            .single();

        if (interactionError) {
            console.error('Failed to store comment:', interactionError);
            return { success: false, error: interactionError.message };
        }

        console.log(`✓ Processed comment from @${instagramUsername}`);
        return { success: true, interaction, matched: !!matchResult.lead };

    } catch (error) {
        console.error('Error processing comment event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Process incoming Instagram mention event
 * @param {object} event - Mention event from webhook
 * @returns {object} - Processing result
 */
export async function processMentionEvent(event) {
    try {
        const { value } = event;

        if (!value) {
            return { success: false, error: 'Missing event value' };
        }

        const instagramUsername = value.username;

        // Try to match Instagram user to lead
        const matchResult = await matchInstagramToLead(instagramUsername, {
            interactionType: 'mention',
            messagePreview: `Mentioned in ${value.media_type}`
        });

        // Store interaction
        const { data: interaction, error: interactionError } = await supabase
            .from('instagram_interactions')
            .insert({
                lead_id: matchResult.lead?.id || null,
                interaction_type: 'mention',
                instagram_user_id: value.user_id,
                instagram_username: instagramUsername,
                message_content: `Mentioned in ${value.media_type}`,
                media_url: value.media_url || null,
                instagram_timestamp: new Date().toISOString(),
                metadata: {
                    media_type: value.media_type,
                    media_id: value.media_id
                }
            })
            .select()
            .single();

        if (interactionError) {
            console.error('Failed to store mention:', interactionError);
            return { success: false, error: interactionError.message };
        }

        console.log(`✓ Processed mention from @${instagramUsername}`);
        return { success: true, interaction, matched: !!matchResult.lead };

    } catch (error) {
        console.error('Error processing mention event:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create or update conversation thread
 * @param {string} threadId - Instagram thread ID
 * @param {string} username - Instagram username
 * @param {string} leadId - Matched lead ID
 * @param {number} timestamp - Message timestamp
 */
async function upsertConversation(threadId, username, leadId, timestamp) {
    const { data, error } = await supabase
        .from('instagram_conversations')
        .upsert({
            instagram_thread_id: threadId,
            instagram_username: username,
            instagram_user_id: threadId, // Using threadId as user ID for now
            lead_id: leadId,
            last_message_at: new Date(timestamp).toISOString(),
            status: 'needs_response',
            unread_count: 1 // Will be handled by trigger in real implementation
        }, {
            onConflict: 'instagram_thread_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to upsert conversation:', error);
    }

    return data;
}

export default {
    processMessageEvent,
    processCommentEvent,
    processMentionEvent
};
