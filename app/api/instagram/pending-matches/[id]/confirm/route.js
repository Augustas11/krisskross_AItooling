import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/pending-matches/[id]/confirm
 * Link an Instagram user to a lead
 */
export async function POST(request, { params }) {
    try {
        const { id: matchId } = params;
        const body = await request.json();
        const { lead_id } = body;

        if (!matchId || !lead_id) {
            return NextResponse.json({
                success: false,
                error: 'Match ID and Lead ID are required'
            }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get the conversation details
        const { data: conversation, error: convError } = await supabase
            .from('instagram_conversations')
            .select('instagram_username')
            .eq('id', matchId)
            .single();

        if (convError) {
            console.error('Error fetching conversation:', convError);
            return NextResponse.json({
                success: false,
                error: 'Match not found'
            }, { status: 404 });
        }

        // Update the conversation with the lead_id
        const { error: updateConvError } = await supabase
            .from('instagram_conversations')
            .update({ lead_id: lead_id })
            .eq('id', matchId);

        if (updateConvError) {
            console.error('Error updating conversation:', updateConvError);
            return NextResponse.json({
                success: false,
                error: updateConvError.message
            }, { status: 500 });
        }

        // Update the lead with the instagram_handle
        if (conversation.instagram_username) {
            const { error: updateLeadError } = await supabase
                .from('leads')
                .update({ instagram_handle: conversation.instagram_username })
                .eq('id', lead_id);

            if (updateLeadError) {
                console.error('Error updating lead:', updateLeadError);
                // Non-fatal - conversation is already linked
            }
        }

        // Update any interactions with this instagram_username to link to the lead
        const { error: updateInteractionsError } = await supabase
            .from('instagram_interactions')
            .update({ lead_id: lead_id })
            .eq('instagram_username', conversation.instagram_username);

        if (updateInteractionsError) {
            console.error('Error updating interactions:', updateInteractionsError);
            // Non-fatal
        }

        return NextResponse.json({
            success: true,
            message: 'Match confirmed and linked to lead'
        });

    } catch (error) {
        console.error('Error in confirm-match API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
