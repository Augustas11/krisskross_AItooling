/**
 * Instagram Send Message API Route
 * POST /api/instagram/send-message
 * 
 * Sends a DM via Instagram Graph API and stores in database
 */

import { NextResponse } from 'next/server';
import instagramAPI from '@/lib/instagram-api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
    try {
        const body = await request.json();
        const { conversation_id, recipient_id, message_text } = body;

        if (!message_text || !conversation_id || !recipient_id) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
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

        // Get Instagram account ID
        const { data: credentials } = await supabase
            .from('instagram_credentials')
            .select('instagram_account_id')
            .eq('connection_status', 'connected')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!credentials?.instagram_account_id) {
            return NextResponse.json({
                success: false,
                error: 'No connected Instagram account'
            }, { status: 400 });
        }

        // Send message via Instagram API
        const sendResult = await instagramAPI.sendMessage(
            credentials.instagram_account_id,
            recipient_id,
            message_text
        );

        if (!sendResult.success) {
            console.error('Failed to send Instagram message:', sendResult.error);
            return NextResponse.json({
                success: false,
                error: sendResult.error || 'Failed to send message'
            }, { status: 400 });
        }

        // Store outbound message in database
        const { data: message, error: msgError } = await supabase
            .from('instagram_messages')
            .insert({
                conversation_id: conversation_id,
                instagram_message_id: sendResult.data?.id || `sent_${Date.now()}`,
                direction: 'outbound',
                sender_instagram_id: credentials.instagram_account_id,
                message_text: message_text,
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (msgError) {
            console.error('Failed to store message:', msgError);
            // Message sent but not stored - log for debugging
        }

        // Update conversation timestamp
        await supabase
            .from('instagram_conversations')
            .update({
                last_message_at: new Date().toISOString(),
                status: 'active' // Reset status when we reply
            })
            .eq('id', conversation_id);

        return NextResponse.json({
            success: true,
            message: message
        });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
