/**
 * Instagram Summary API Route
 * GET /api/instagram/lead-summary/:leadId
 * 
 * Fetches Instagram interaction summary for a specific lead
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request, { params }) {
    try {
        const { leadId } = params;

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Get lead's Instagram handle
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('instagram_handle, instagram')
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json({
                success: false,
                error: 'Lead not found'
            }, { status: 404 });
        }

        const instagramHandle = lead.instagram_handle || lead.instagram;

        if (!instagramHandle) {
            return NextResponse.json({
                success: true,
                has_instagram: false,
                message: 'No Instagram account linked to this lead'
            });
        }

        // Fetch interaction summary
        const { data: interactions, error: intError } = await supabase
            .from('instagram_interactions')
            .select('*')
            .eq('lead_id', leadId)
            .order('instagram_timestamp', { ascending: false });

        if (intError) {
            console.error('Failed to fetch interactions:', intError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch Instagram interactions'
            }, { status: 500 });
        }

        // Get active conversation
        const { data: conversation, error: convError } = await supabase
            .from('instagram_conversations')
            .select('*, instagram_messages(count)')
            .eq('lead_id', leadId)
            .eq('status', 'active')
            .order('last_message_at', { ascending: false })
            .limit(1)
            .single();

        // Calculate engagement metrics
        const totalInteractions = interactions?.length || 0;
        const dmCount = interactions?.filter(i => i.interaction_type === 'dm').length || 0;
        const commentCount = interactions?.filter(i => i.interaction_type === 'comment').length || 0;
        const mentionCount = interactions?.filter(i => i.interaction_type === 'mention').length || 0;

        // Get most recent interactions
        const recentInteractions = interactions?.slice(0, 5) || [];

        // Calculate engagement score (0-100)
        const engagementScore = Math.min(100, (dmCount * 10) + (commentCount * 5) + (mentionCount * 3));

        // Determine engagement level
        let engagementLevel = 'cold';
        if (engagementScore > 50) engagementLevel = 'hot';
        else if (engagementScore > 20) engagementLevel = 'warm';

        return NextResponse.json({
            success: true,
            has_instagram: true,
            instagram_handle: instagramHandle,
            summary: {
                total_interactions: totalInteractions,
                dm_count: dmCount,
                comment_count: commentCount,
                mention_count: mentionCount,
                engagement_score: engagementScore,
                engagement_level: engagementLevel,
                has_active_conversation: !!conversation,
                unread_messages: conversation?.unread_count || 0,
                last_interaction_at: interactions?.[0]?.instagram_timestamp || null
            },
            recent_interactions: recentInteractions,
            active_conversation: conversation ? {
                id: conversation.id,
                thread_id: conversation.instagram_thread_id,
                last_message_at: conversation.last_message_at,
                unread_count: conversation.unread_count,
                status: conversation.status,
                assigned_to: conversation.assigned_to
            } : null
        });

    } catch (error) {
        console.error('Instagram summary error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
