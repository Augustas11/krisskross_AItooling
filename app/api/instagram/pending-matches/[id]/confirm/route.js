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

        // 1. Get the pending match details
        const { data: match, error: matchError } = await supabase
            .from('instagram_pending_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            console.error('Error fetching match:', matchError);
            return NextResponse.json({
                success: false,
                error: 'Match not found'
            }, { status: 404 });
        }

        const { instagram_username, instagram_user_id } = match;

        // 2. Update instagram_pending_matches status
        const { error: updateMatchError } = await supabase
            .from('instagram_pending_matches')
            .update({
                match_status: 'matched',
                matched_lead_id: lead_id,
                matched_at: new Date().toISOString()
            })
            .eq('id', matchId);

        if (updateMatchError) {
            console.error('Error updating match status:', updateMatchError);
            return NextResponse.json({
                success: false,
                error: updateMatchError.message
            }, { status: 500 });
        }

        // 3. Update the lead with the instagram_handle
        if (instagram_username) {
            const { error: updateLeadError } = await supabase
                .from('leads')
                .update({ instagram_handle: instagram_username })
                .eq('id', lead_id);

            if (updateLeadError) {
                console.error('Error updating lead:', updateLeadError);
                // Non-fatal
            }
        }

        // 4. Link conversations to lead
        // Match by instagram_user_id if available, otherwise username
        let convQuery = supabase.from('instagram_conversations').update({ lead_id: lead_id });

        if (instagram_user_id) {
            convQuery = convQuery.eq('instagram_user_id', instagram_user_id);
        } else {
            convQuery = convQuery.eq('instagram_username', instagram_username);
        }

        const { error: updateConvError } = await convQuery;
        if (updateConvError) {
            console.error('Error linking conversations:', updateConvError);
        }

        // 5. Link interactions/messages/comments/media if they have lead_id column
        // Check instagram_interactions
        const { error: updateInteractionsError } = await supabase
            .from('instagram_interactions')
            .update({ lead_id: lead_id })
            .eq('instagram_username', instagram_username);

        if (updateInteractionsError) {
            console.error('Error linking interactions:', updateInteractionsError);
        }

        // Check instagram_comments
        const { error: updateCommentsError } = await supabase
            .from('instagram_comments')
            .update({ lead_id: lead_id })
            .eq('instagram_username', instagram_username);

        if (updateCommentsError) {
            console.error('Error linking comments:', updateCommentsError);
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
