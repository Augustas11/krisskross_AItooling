import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/conversations/[conversationId]/mark-read
 * Mark all messages in a conversation as read
 */
export async function POST(request, { params }) {
    try {
        const { conversationId } = params;

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

        // Get lead_id from conversation
        const { data: conversation } = await supabase
            .from('instagram_conversations')
            .select('lead_id')
            .eq('id', conversationId)
            .single();

        // Reset unread count on conversation
        const { error: updateError } = await supabase
            .from('instagram_conversations')
            .update({
                unread_count: 0,
                status: 'active'
            })
            .eq('id', conversationId);

        if (updateError) {
            console.error('Error updating conversation:', updateError);
        }

        // Mark all inbound interactions as read for this lead
        if (conversation?.lead_id) {
            const { error: interactionError } = await supabase
                .from('instagram_interactions')
                .update({ read_at: new Date().toISOString() })
                .eq('lead_id', conversation.lead_id)
                .eq('interaction_type', 'dm')
                .eq('direction', 'inbound')
                .is('read_at', null);

            if (interactionError) {
                console.error('Error marking interactions as read:', interactionError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Conversation marked as read'
        });

    } catch (error) {
        console.error('Error in mark-read API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
