/**
 * Instagram Send DM API Route
 * POST /api/instagram/send-dm
 * 
 * Sends a DM via Instagram Graph API with rate limiting
 * Stores message in database and logs as interaction
 */

import { NextResponse } from 'next/server';
import instagramAPI from '@/lib/instagram-api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Daily DM limit per SDR
const DAILY_DM_LIMIT = 50;

export async function POST(request) {
    try {
        const body = await request.json();
        const { lead_id, instagram_username, conversation_id, message_text } = body;

        if (!message_text) {
            return NextResponse.json({
                success: false,
                error: 'Message text is required'
            }, { status: 400 });
        }

        if (!lead_id && !instagram_username) {
            return NextResponse.json({
                success: false,
                error: 'Either lead_id or instagram_username is required'
            }, { status: 400 });
        }

        // Validate message length
        if (message_text.length > 1000) {
            return NextResponse.json({
                success: false,
                error: 'Message exceeds 1000 character limit'
            }, { status: 400 });
        }

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Get Instagram credentials
        const { data: credentials, error: credError } = await supabase
            .from('instagram_credentials')
            .select('instagram_account_id, access_token')
            .eq('connection_status', 'connected')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (credError || !credentials?.instagram_account_id) {
            return NextResponse.json({
                success: false,
                error: 'No connected Instagram account'
            }, { status: 400 });
        }

        // Check rate limit
        const today = new Date().toISOString().split('T')[0];
        const { count: sentToday, error: countError } = await supabase
            .from('instagram_interactions')
            .select('*', { count: 'exact', head: true })
            .eq('direction', 'outbound')
            .eq('interaction_type', 'dm')
            .gte('created_at', `${today}T00:00:00.000Z`);

        if (countError) {
            console.error('Rate limit check error:', countError);
        }

        if (sentToday >= DAILY_DM_LIMIT) {
            return NextResponse.json({
                success: false,
                error: `Daily DM limit reached (${DAILY_DM_LIMIT}/day)`,
                rate_limit: {
                    limit: DAILY_DM_LIMIT,
                    sent_today: sentToday,
                    resets_at: `${today}T23:59:59.999Z`
                }
            }, { status: 429 });
        }

        // Get lead info if we have lead_id
        let recipientId = null;
        let leadData = null;

        if (lead_id) {
            const { data: lead } = await supabase
                .from('leads')
                .select('id, name, instagram_handle')
                .eq('id', lead_id)
                .single();

            leadData = lead;
        }

        // Get conversation/recipient info
        if (conversation_id) {
            const { data: conversation } = await supabase
                .from('instagram_conversations')
                .select('instagram_user_id, thread_id')
                .eq('id', conversation_id)
                .single();

            if (conversation?.instagram_user_id) {
                recipientId = conversation.instagram_user_id;
            }
        }

        // If we still don't have recipient ID, try to find or create conversation
        if (!recipientId && instagram_username) {
            // Look up existing conversation by username
            const { data: existingConv } = await supabase
                .from('instagram_conversations')
                .select('instagram_user_id')
                .eq('instagram_username', instagram_username)
                .limit(1)
                .single();

            if (existingConv?.instagram_user_id) {
                recipientId = existingConv.instagram_user_id;
            }
        }

        // For now, we need a recipient ID to send
        // In a full implementation, we'd use Instagram's user search API
        if (!recipientId) {
            return NextResponse.json({
                success: false,
                error: 'Unable to determine recipient. Please ensure a conversation exists with this user.'
            }, { status: 400 });
        }

        // Send message via Instagram API
        const sendResult = await instagramAPI.sendMessage(
            credentials.instagram_account_id,
            recipientId,
            message_text
        );

        if (!sendResult.success) {
            console.error('Failed to send Instagram DM:', sendResult.error);
            return NextResponse.json({
                success: false,
                error: sendResult.error || 'Failed to send message via Instagram'
            }, { status: 400 });
        }

        // Store in instagram_messages if we have conversation_id
        if (conversation_id) {
            await supabase
                .from('instagram_messages')
                .insert({
                    conversation_id: conversation_id,
                    instagram_message_id: sendResult.data?.id || `sent_${Date.now()}`,
                    direction: 'outbound',
                    sender_instagram_id: credentials.instagram_account_id,
                    message_text: message_text,
                    sent_at: new Date().toISOString()
                });

            // Update conversation timestamp
            await supabase
                .from('instagram_conversations')
                .update({
                    last_message_at: new Date().toISOString(),
                    last_message_preview: message_text.slice(0, 50),
                    status: 'active'
                })
                .eq('id', conversation_id);
        }

        // Store in instagram_interactions for tracking
        const interactionData = {
            lead_id: lead_id || null,
            instagram_username: instagram_username || leadData?.instagram_handle,
            interaction_type: 'dm',
            message_content: message_text,
            direction: 'outbound',
            instagram_timestamp: new Date().toISOString()
        };

        await supabase
            .from('instagram_interactions')
            .insert(interactionData);

        return NextResponse.json({
            success: true,
            message: {
                id: sendResult.data?.id,
                text: message_text,
                sent_at: new Date().toISOString(),
                recipient: instagram_username
            },
            rate_limit: {
                limit: DAILY_DM_LIMIT,
                sent_today: (sentToday || 0) + 1,
                remaining: DAILY_DM_LIMIT - (sentToday || 0) - 1
            }
        });

    } catch (error) {
        console.error('Send DM error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
