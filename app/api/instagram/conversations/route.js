/**
 * Instagram Conversations API Route
 * GET /api/instagram/conversations
 * 
 * Fetches all Instagram conversations with filtering and search
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // active, needs_response, archived
        const assignedTo = searchParams.get('assigned_to');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        let query = supabase
            .from('instagram_conversations')
            .select(`
        *,
        lead:leads(id, name, score, email, instagram, instagram_handle)
      `)
            .order('last_message_at', { ascending: false })
            .limit(limit);

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (assignedTo) {
            query = query.eq('assigned_to', assignedTo);
        }

        if (search) {
            // Search by Instagram username or lead name
            query = query.or(`instagram_username.ilike.%${search}%,lead.name.ilike.%${search}%`);
        }

        const { data: conversations, error } = await query;

        if (error) {
            console.error('Failed to fetch conversations:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch conversations'
            }, { status: 500 });
        }

        // Fetch last message for each conversation
        const conversationsWithMessages = await Promise.all(
            conversations.map(async (conv) => {
                const { data: lastMessage } = await supabase
                    .from('instagram_messages')
                    .select('message_text, sent_at, direction')
                    .eq('conversation_id', conv.id)
                    .order('sent_at', { ascending: false })
                    .limit(1)
                    .single();

                // Get message count
                const { count: messageCount } = await supabase
                    .from('instagram_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id);

                return {
                    ...conv,
                    last_message: lastMessage || null,
                    message_count: messageCount || 0
                };
            })
        );

        return NextResponse.json({
            success: true,
            conversations: conversationsWithMessages
        });

    } catch (error) {
        console.error('Conversations API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
