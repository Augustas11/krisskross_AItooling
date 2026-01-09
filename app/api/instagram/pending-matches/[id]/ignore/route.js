import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/pending-matches/[id]/ignore
 * Mark a pending match as ignored
 */
export async function POST(request, { params }) {
    try {
        const { id: matchId } = params;

        if (!matchId) {
            return NextResponse.json({
                success: false,
                error: 'Match ID is required'
            }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Update instagram_pending_matches table
        const { error: updateError } = await supabase
            .from('instagram_pending_matches')
            .update({
                match_status: 'ignored'
            })
            .eq('id', matchId);

        if (updateError) {
            console.error('Error ignoring match:', updateError);
            return NextResponse.json({
                success: false,
                error: updateError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Match ignored'
        });

    } catch (error) {
        console.error('Error in ignore-match API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
