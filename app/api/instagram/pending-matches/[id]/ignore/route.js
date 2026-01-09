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

        // Check if we have a pending_instagram_matches table
        // If not, we can add metadata to the conversation
        const { error: updateError } = await supabase
            .from('instagram_conversations')
            .update({
                status: 'ignored',
                metadata: { ignored_at: new Date().toISOString() }
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
