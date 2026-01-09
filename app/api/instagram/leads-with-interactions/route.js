import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/instagram/leads-with-interactions
 * Fetch list of leads that have Instagram interactions with unread counts
 * 
 * Query Parameters:
 * - filter: 'unread' | 'needs_response'
 * - type: 'dm' | 'comment'
 * - search: Search term for lead name or Instagram username
 * - sort: 'recent' | 'oldest' | 'unread_first'
 */
export async function GET(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'recent';

        // Build the query to get leads with Instagram interactions
        // Using a combination of leads and instagram_interactions tables
        let query = supabase
            .from('instagram_interactions')
            .select(`
                lead_id,
                interaction_type,
                message_content,
                instagram_timestamp,
                direction,
                read_at,
                leads!inner (
                    id,
                    name,
                    instagram_handle,
                    email
                )
            `)
            .not('lead_id', 'is', null);

        // Apply type filter
        if (type === 'dm') {
            query = query.eq('interaction_type', 'dm');
        } else if (type === 'comment') {
            query = query.eq('interaction_type', 'comment');
        }

        // Apply unread filter
        if (filter === 'unread') {
            query = query.is('read_at', null).eq('direction', 'inbound');
        }

        // Apply search filter
        if (search) {
            query = query.or(`leads.name.ilike.%${search}%,leads.instagram_handle.ilike.%${search}%`);
        }

        // Execute query
        const { data: interactions, error } = await query.order('instagram_timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching interactions:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Aggregate interactions by lead
        const leadsMap = new Map();

        for (const interaction of interactions || []) {
            const leadId = interaction.lead_id;
            const lead = interaction.leads;

            if (!lead) continue;

            if (!leadsMap.has(leadId)) {
                leadsMap.set(leadId, {
                    lead_id: leadId,
                    lead_name: lead.name,
                    instagram_username: lead.instagram_handle,
                    email: lead.email,
                    unread_count: 0,
                    total_interactions: 0,
                    last_interaction_at: null,
                    last_message_preview: null,
                    interaction_types: new Set()
                });
            }

            const leadData = leadsMap.get(leadId);
            leadData.total_interactions++;
            leadData.interaction_types.add(interaction.interaction_type);

            // Update last interaction
            if (!leadData.last_interaction_at || new Date(interaction.instagram_timestamp) > new Date(leadData.last_interaction_at)) {
                leadData.last_interaction_at = interaction.instagram_timestamp;
                leadData.last_message_preview = interaction.message_content?.slice(0, 50) + (interaction.message_content?.length > 50 ? '...' : '');
            }

            // Count unread inbound messages
            if (interaction.direction === 'inbound' && !interaction.read_at) {
                leadData.unread_count++;
            }
        }

        // Convert to array and sort
        let leads = Array.from(leadsMap.values()).map(lead => ({
            ...lead,
            interaction_types: Array.from(lead.interaction_types)
        }));

        // Apply sorting
        if (sort === 'recent') {
            leads.sort((a, b) => new Date(b.last_interaction_at) - new Date(a.last_interaction_at));
        } else if (sort === 'oldest') {
            leads.sort((a, b) => new Date(a.last_interaction_at) - new Date(b.last_interaction_at));
        } else if (sort === 'unread_first') {
            leads.sort((a, b) => b.unread_count - a.unread_count);
        }

        // Apply unread filter at lead level if needed
        if (filter === 'unread') {
            leads = leads.filter(lead => lead.unread_count > 0);
        }

        return NextResponse.json({
            success: true,
            leads,
            total: leads.length
        });

    } catch (error) {
        console.error('Error in leads-with-interactions:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
