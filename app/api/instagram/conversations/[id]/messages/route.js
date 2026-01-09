import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/instagram/conversations/[id]/messages
 * Fetch full message history for a conversation
 */
export async function GET(request, { params }) {
    try {
        const { id: conversationId } = params;

        if (!conversationId) {
            return NextResponse.json({
                success: false,
                error: 'Conversation ID is required'
            }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch conversation details
        const { data: conversation, error: convError } = await supabase
            .from('instagram_conversations')
            .select(`
                id,
                lead_id,
                instagram_thread_id,
                instagram_user_id,
                instagram_username,
                last_message_at,
                last_message_preview,
                unread_count,
                status,
                leads (
                    id,
                    name,
                    email,
                    instagram_handle
                )
            `)
            .eq('id', conversationId)
            .single();

        if (convError) {
            console.error('Error fetching conversation:', convError);
            return NextResponse.json({
                success: false,
                error: 'Conversation not found'
            }, { status: 404 });
        }

        // Fetch messages for this conversation
        const { data: messages, error: msgError } = await supabase
            .from('instagram_messages')
            .select(`
                id,
                instagram_message_id,
                direction,
                sender_instagram_id,
                message_text,
                sent_at,
                created_at
            `)
            .eq('conversation_id', conversationId)
            .order('sent_at', { ascending: true });

        if (msgError) {
            console.error('Error fetching messages:', msgError);
        }

        // Format response
        const formattedConversation = {
            id: conversation.id,
            lead_id: conversation.lead_id,
            lead_name: conversation.leads?.name,
            lead_email: conversation.leads?.email,
            instagram_username: conversation.instagram_username || conversation.leads?.instagram_handle,
            instagram_user_id: conversation.instagram_user_id,
            thread_id: conversation.instagram_thread_id,
            last_message_at: conversation.last_message_at,
            unread_count: conversation.unread_count,
            status: conversation.status
        };

        const formattedMessages = (messages || []).map(msg => ({
            id: msg.id,
            instagram_message_id: msg.instagram_message_id,
            direction: msg.direction,
            message_content: msg.message_text,
            instagram_timestamp: msg.sent_at || msg.created_at,
            sender_id: msg.sender_instagram_id
        }));

        return NextResponse.json({
            success: true,
            conversation: formattedConversation,
            messages: formattedMessages,
            total: formattedMessages.length
        });

    } catch (error) {
        console.error('Error in conversation messages API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
