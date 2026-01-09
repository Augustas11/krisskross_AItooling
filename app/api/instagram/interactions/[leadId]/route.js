import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/instagram/interactions/[leadId]
 * Fetch all Instagram interactions (DMs + comments) for a specific lead
 */
export async function GET(request, { params }) {
    try {
        const { leadId } = params;

        if (!leadId) {
            return NextResponse.json({
                success: false,
                error: 'Lead ID is required'
            }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch all interactions for this lead
        const { data: interactions, error } = await supabase
            .from('instagram_interactions')
            .select(`
                id,
                lead_id,
                interaction_type,
                message_content,
                instagram_timestamp,
                direction,
                read_at,
                responded_at,
                post_url,
                instagram_username,
                leads (
                    name,
                    instagram_handle
                )
            `)
            .eq('lead_id', leadId)
            .order('instagram_timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching interactions:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Format interactions for response
        const formattedInteractions = (interactions || []).map(interaction => ({
            id: interaction.id,
            lead_id: interaction.lead_id,
            lead_name: interaction.leads?.name,
            instagram_username: interaction.instagram_username || interaction.leads?.instagram_handle,
            interaction_type: interaction.interaction_type,
            content_text: interaction.message_content,
            instagram_timestamp: interaction.instagram_timestamp,
            direction: interaction.direction || 'inbound',
            read_at: interaction.read_at,
            responded_at: interaction.responded_at,
            post_url: interaction.post_url
        }));

        return NextResponse.json({
            success: true,
            interactions: formattedInteractions,
            total: formattedInteractions.length
        });

    } catch (error) {
        console.error('Error in interactions API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
