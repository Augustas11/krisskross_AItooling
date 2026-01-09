import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/instagram/pending-matches
 * Fetch Instagram users that haven't been matched to leads
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Query the instagram_pending_matches table (correct table name)
        let query = supabase
            .from('instagram_pending_matches')
            .select('*');

        // Use correct field name: match_status (not status)
        if (status !== 'all') {
            query = query.eq('match_status', status);
        }

        query = query.order('first_seen_at', { ascending: false });

        const { data: pending, error } = await query;

        if (error) {
            console.error('Error fetching pending matches:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Get stats from instagram_pending_matches
        const { count: totalCount } = await supabase
            .from('instagram_pending_matches')
            .select('*', { count: 'exact', head: true });

        const { count: pendingCount } = await supabase
            .from('instagram_pending_matches')
            .select('*', { count: 'exact', head: true })
            .eq('match_status', 'pending');

        // Format response with suggested leads based on username similarity
        const formattedPending = await Promise.all((pending || []).map(async (match) => {
            // Find similar leads by name/instagram_handle
            const { data: suggestedLeads } = await supabase
                .from('leads')
                .select('id, name, email, instagram_handle')
                .or(`name.ilike.%${match.instagram_username}%,instagram_handle.ilike.%${match.instagram_username}%`)
                .limit(3);

            // Calculate simple similarity scores
            const withScores = (suggestedLeads || []).map(lead => {
                const username = match.instagram_username?.toLowerCase() || '';
                const leadName = (lead.name || '').toLowerCase();
                const leadHandle = (lead.instagram_handle || '').toLowerCase();

                let similarity = 0;
                if (leadHandle.includes(username) || username.includes(leadHandle)) {
                    similarity = 90;
                } else if (leadName.includes(username) || username.includes(leadName)) {
                    similarity = 70;
                } else {
                    similarity = 50;
                }

                return { ...lead, similarity };
            });

            return {
                id: match.id,
                instagram_user_id: match.instagram_user_id,
                instagram_username: match.instagram_username,
                first_seen_at: match.first_seen_at,
                message_preview: match.message_preview,
                status: match.match_status || 'pending',
                suggested_leads: withScores.sort((a, b) => b.similarity - a.similarity)
            };
        }));

        return NextResponse.json({
            success: true,
            pending: formattedPending,
            stats: {
                total: totalCount || 0,
                pending: pendingCount || 0,
                linked: 0
            }
        });

    } catch (error) {
        console.error('Error in pending-matches API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
