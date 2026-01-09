import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/pending-matches/[id]/create-lead
 * Create a new lead and link it to the pending match
 */
export async function POST(request, { params }) {
    try {
        const { id: matchId } = params;
        const body = await request.json();
        const { name } = body;

        if (!matchId || !name) {
            return NextResponse.json({ success: false, error: 'Match ID and Name required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Get match details
        const { data: match, error: matchError } = await supabase
            .from('instagram_pending_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        }

        // 2. Create Lead
        const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
                name: name,
                instagram_handle: match.instagram_username,
                source: 'instagram',
                status: 'new'
            })
            .select()
            .single();

        if (leadError) {
            return NextResponse.json({ success: false, error: 'Failed to create lead: ' + leadError.message }, { status: 500 });
        }

        const leadId = newLead.id;
        const { instagram_username, instagram_user_id } = match;

        // 3. Update pending match status
        await supabase
            .from('instagram_pending_matches')
            .update({
                match_status: 'matched',
                matched_lead_id: leadId,
                matched_at: new Date().toISOString()
            })
            .eq('id', matchId);

        // 4. Update conversations/interactions
        if (instagram_user_id) {
            await supabase.from('instagram_conversations').update({ lead_id: leadId }).eq('instagram_user_id', instagram_user_id);
        }
        if (instagram_username) {
            await supabase.from('instagram_conversations').update({ lead_id: leadId }).eq('instagram_username', instagram_username);
            await supabase.from('instagram_interactions').update({ lead_id: leadId }).eq('instagram_username', instagram_username);
            await supabase.from('instagram_comments').update({ lead_id: leadId }).eq('instagram_username', instagram_username);
        }

        return NextResponse.json({ success: true, lead: newLead });

    } catch (error) {
        console.error('Create lead error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
