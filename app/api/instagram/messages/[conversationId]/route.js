/**
 * Instagram Messages API Route
 * GET /api/instagram/messages/:conversationId
 * 
 * Fetches all messages for a specific conversation
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request, { params }) {
    try {
        const { conversationId } = params;

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Fetch conversation details
        const { data: conversation, error: convError } = await supabase
            .from('instagram_conversations')
            .select('*, lead:leads(id, name, score, instagram, instagram_handle)')
            .eq('id', conversationId)
            .single();

        if (convError || !conversation) {
            return NextResponse.json({
                success: false,
                error: 'Conversation not found'
            }, { status: 404 });
        }

        // Fetch all messages
        const { data: messages, error: msgError } = await supabase
            .from('instagram_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('sent_at', { ascending: true }); // Chronological order

        if (msgError) {
            console.error('Failed to fetch messages:', msgError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch messages'
            }, { status: 500 });
        }

        // Mark conversation as read
        await supabase
            .from('instagram_conversations')
            .update({ unread_count: 0 })
            .eq('id', conversationId);

        return NextResponse.json({
            success: true,
            conversation: conversation,
            messages: messages || []
        });

    } catch (error) {
        console.error('Messages API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
