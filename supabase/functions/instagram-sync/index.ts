/**
 * Instagram Sync Edge Function
 * 
 * Automatically syncs Instagram conversations, messages, and comments
 * Runs every 15 minutes via pg_cron
 * 
 * Process:
 * 1. Fetch recent conversations (last 24 hours)
 * 2. Fetch messages for each conversation
 * 3. Match Instagram users to CRM leads
 * 4. Store matched interactions in database
 * 5. Add unmatched users to pending queue
 * 6. Fetch recent post comments
 * 7. Log sync results
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v21.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        console.log('🔄 Starting Instagram sync...');

        // Create sync log entry
        const { data: syncLog, error: logError } = await supabase
            .from('instagram_sync_log')
            .insert({
                sync_type: 'full',
                status: 'running',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (logError) {
            console.error('Failed to create sync log:', logError);
            return new Response(JSON.stringify({ success: false, error: 'Failed to create sync log' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const syncId = syncLog.id;
        let totalProcessed = 0;
        let totalMatched = 0;
        let totalPending = 0;

        try {
            // Get Instagram credentials
            const { data: credentials, error: credError } = await supabase
                .from('instagram_credentials')
                .select('instagram_account_id, access_token')
                .eq('connection_status', 'connected')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (credError || !credentials) {
                throw new Error('No connected Instagram account found');
            }

            const { instagram_account_id, access_token } = credentials;

            // Sync conversations and messages
            console.log('📥 Syncing conversations...');
            const conversationResults = await syncConversations(instagram_account_id, access_token);
            totalProcessed += conversationResults.processed;
            totalMatched += conversationResults.matched;
            totalPending += conversationResults.pending;

            // Sync comments
            console.log('💬 Syncing comments...');
            const commentResults = await syncComments(instagram_account_id, access_token);
            totalProcessed += commentResults.processed;
            totalMatched += commentResults.matched;
            totalPending += commentResults.pending;

            // Update sync log as completed
            await supabase
                .from('instagram_sync_log')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    items_processed: totalProcessed,
                    items_matched: totalMatched,
                    items_pending: totalPending
                })
                .eq('id', syncId);

            console.log(`✅ Sync completed: ${totalProcessed} processed, ${totalMatched} matched, ${totalPending} pending`);

            return new Response(JSON.stringify({
                success: true,
                sync_id: syncId,
                stats: {
                    processed: totalProcessed,
                    matched: totalMatched,
                    pending: totalPending
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('❌ Sync failed:', error);

            // Update sync log as failed
            await supabase
                .from('instagram_sync_log')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: error.message,
                    items_processed: totalProcessed,
                    items_matched: totalMatched,
                    items_pending: totalPending
                })
                .eq('id', syncId);

            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('❌ Fatal sync error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Sync conversations and messages
 */
async function syncConversations(accountId: string, accessToken: string) {
    let processed = 0;
    let matched = 0;
    let pending = 0;

    try {
        // Fetch conversations from last 24 hours
        const conversationsUrl = `${INSTAGRAM_API_BASE}/${accountId}/conversations?fields=id,participants,updated_time&limit=50&access_token=${accessToken}`;
        const conversationsResponse = await fetch(conversationsUrl);

        if (!conversationsResponse.ok) {
            const error = await conversationsResponse.json();
            throw new Error(`Instagram API error: ${error.error?.message || 'Unknown error'}`);
        }

        const conversationsData = await conversationsResponse.json();
        const conversations = conversationsData.data || [];

        console.log(`Found ${conversations.length} conversations`);

        for (const conversation of conversations) {
            processed++;

            try {
                // Get conversation participants
                const participants = conversation.participants?.data || [];
                if (participants.length === 0) continue;

                // Find the participant (not the business account)
                const participant = participants.find((p: any) => p.id !== accountId);
                if (!participant) continue;

                const instagramUserId = participant.id;
                const instagramUsername = participant.username;

                // Match to lead
                const matchResult = await matchInstagramToLead(instagramUsername, instagramUserId);

                if (matchResult.matched) {
                    matched++;

                    // Fetch messages for this conversation
                    await syncMessagesForConversation(
                        conversation.id,
                        matchResult.leadId,
                        instagramUserId,
                        instagramUsername,
                        accessToken
                    );
                } else {
                    pending++;
                }

            } catch (error) {
                console.error(`Error processing conversation ${conversation.id}:`, error);
            }
        }

    } catch (error) {
        console.error('Error syncing conversations:', error);
        throw error;
    }

    return { processed, matched, pending };
}

/**
 * Sync messages for a specific conversation
 */
async function syncMessagesForConversation(
    conversationId: string,
    leadId: string,
    instagramUserId: string,
    instagramUsername: string,
    accessToken: string
) {
    try {
        // Check if conversation exists in database
        const { data: existingConv } = await supabase
            .from('instagram_conversations')
            .select('id')
            .eq('instagram_thread_id', conversationId)
            .single();

        let dbConversationId = existingConv?.id;

        // Fetch messages
        const messagesUrl = `${INSTAGRAM_API_BASE}/${conversationId}/messages?fields=id,from,message,created_time&limit=50&access_token=${accessToken}`;
        const messagesResponse = await fetch(messagesUrl);

        if (!messagesResponse.ok) {
            console.error(`Failed to fetch messages for conversation ${conversationId}`);
            return;
        }

        const messagesData = await messagesResponse.json();
        const messages = messagesData.data || [];

        if (messages.length === 0) return;

        // Create or update conversation
        const lastMessage = messages[0];
        const lastMessagePreview = lastMessage.message?.substring(0, 100) || '';

        if (!dbConversationId) {
            const { data: newConv } = await supabase
                .from('instagram_conversations')
                .insert({
                    lead_id: leadId,
                    instagram_thread_id: conversationId,
                    instagram_user_id: instagramUserId,
                    instagram_username: instagramUsername,
                    last_message_at: lastMessage.created_time,
                    last_message_preview: lastMessagePreview,
                    status: 'active'
                })
                .select()
                .single();

            dbConversationId = newConv?.id;
        } else {
            await supabase
                .from('instagram_conversations')
                .update({
                    last_message_at: lastMessage.created_time,
                    last_message_preview: lastMessagePreview
                })
                .eq('id', dbConversationId);
        }

        // Store messages
        for (const message of messages) {
            // Check if message already exists
            const { data: existingMsg } = await supabase
                .from('instagram_messages')
                .select('id')
                .eq('instagram_message_id', message.id)
                .single();

            if (existingMsg) continue; // Skip if already stored

            const direction = message.from.id === instagramUserId ? 'inbound' : 'outbound';

            // Insert into instagram_messages
            await supabase
                .from('instagram_messages')
                .insert({
                    conversation_id: dbConversationId,
                    instagram_message_id: message.id,
                    direction: direction,
                    sender_instagram_id: message.from.id,
                    message_text: message.message || '',
                    sent_at: message.created_time
                });

            // Also insert into instagram_interactions for unified tracking
            await supabase
                .from('instagram_interactions')
                .insert({
                    lead_id: leadId,
                    interaction_type: 'dm',
                    instagram_user_id: instagramUserId,
                    instagram_username: instagramUsername,
                    instagram_message_id: message.id,
                    message_content: message.message || '',
                    instagram_timestamp: message.created_time,
                    direction: direction
                });
        }

    } catch (error) {
        console.error(`Error syncing messages for conversation ${conversationId}:`, error);
    }
}

/**
 * Sync comments from recent posts
 */
async function syncComments(accountId: string, accessToken: string) {
    let processed = 0;
    let matched = 0;
    let pending = 0;

    try {
        // Fetch recent media posts (last 7 days)
        const mediaUrl = `${INSTAGRAM_API_BASE}/${accountId}/media?fields=id,caption,timestamp,media_url,permalink&limit=20&access_token=${accessToken}`;
        const mediaResponse = await fetch(mediaUrl);

        if (!mediaResponse.ok) {
            console.error('Failed to fetch media posts');
            return { processed, matched, pending };
        }

        const mediaData = await mediaResponse.json();
        const posts = mediaData.data || [];

        console.log(`Found ${posts.length} recent posts`);

        for (const post of posts) {
            try {
                // Fetch comments for this post
                const commentsUrl = `${INSTAGRAM_API_BASE}/${post.id}/comments?fields=id,from,text,timestamp,username&limit=50&access_token=${accessToken}`;
                const commentsResponse = await fetch(commentsUrl);

                if (!commentsResponse.ok) continue;

                const commentsData = await commentsResponse.json();
                const comments = commentsData.data || [];

                for (const comment of comments) {
                    processed++;

                    const instagramUserId = comment.from?.id;
                    const instagramUsername = comment.username || comment.from?.username;

                    if (!instagramUsername) continue;

                    // Match to lead
                    const matchResult = await matchInstagramToLead(instagramUsername, instagramUserId);

                    if (matchResult.matched) {
                        matched++;

                        // Check if comment already exists
                        const { data: existingComment } = await supabase
                            .from('instagram_interactions')
                            .select('id')
                            .eq('instagram_comment_id', comment.id)
                            .single();

                        if (!existingComment) {
                            // Insert comment interaction
                            await supabase
                                .from('instagram_interactions')
                                .insert({
                                    lead_id: matchResult.leadId,
                                    interaction_type: 'comment',
                                    instagram_user_id: instagramUserId,
                                    instagram_username: instagramUsername,
                                    instagram_comment_id: comment.id,
                                    message_content: comment.text || '',
                                    instagram_timestamp: comment.timestamp,
                                    direction: 'inbound',
                                    post_url: post.permalink,
                                    post_thumbnail: post.media_url
                                });
                        }
                    } else {
                        pending++;
                    }
                }

            } catch (error) {
                console.error(`Error processing comments for post ${post.id}:`, error);
            }
        }

    } catch (error) {
        console.error('Error syncing comments:', error);
    }

    return { processed, matched, pending };
}

/**
 * Match Instagram username to CRM lead
 */
async function matchInstagramToLead(instagramUsername: string, instagramUserId: string) {
    const cleanUsername = instagramUsername.replace('@', '').toLowerCase();

    // Try exact match on instagram_handle
    const { data: exactMatch } = await supabase
        .from('leads')
        .select('id')
        .ilike('instagram_handle', cleanUsername)
        .single();

    if (exactMatch) {
        return { matched: true, leadId: exactMatch.id };
    }

    // Try partial match
    const { data: partialMatches } = await supabase
        .from('leads')
        .select('id')
        .ilike('instagram_handle', `%${cleanUsername}%`)
        .limit(5);

    if (partialMatches && partialMatches.length === 1) {
        return { matched: true, leadId: partialMatches[0].id };
    }

    // No match - add to pending
    await createPendingMatch(instagramUsername, instagramUserId);
    return { matched: false };
}

/**
 * Create pending match for manual review
 */
async function createPendingMatch(instagramUsername: string, instagramUserId: string) {
    const cleanUsername = instagramUsername.replace('@', '');

    // Check if already exists
    const { data: existing } = await supabase
        .from('instagram_pending_matches')
        .select('id')
        .eq('instagram_username', cleanUsername)
        .eq('match_status', 'pending')
        .single();

    if (existing) return;

    // Create new pending match
    await supabase
        .from('instagram_pending_matches')
        .insert({
            instagram_user_id: instagramUserId,
            instagram_username: cleanUsername,
            interaction_type: 'dm',
            match_status: 'pending'
        });
}
