/**
 * Instagram Analytics API Route
 * GET /api/instagram/analytics
 * 
 * Returns aggregated analytics data for Instagram integration
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Calculate date range
        const periodDays = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            'all': 365 * 10 // 10 years
        };
        const days = periodDays[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all interactions in period
        const { data: interactions, error: intError } = await supabase
            .from('instagram_interactions')
            .select('*, lead:leads(id, name, score)')
            .gte('instagram_timestamp', startDate.toISOString())
            .order('instagram_timestamp', { ascending: true });

        if (intError) {
            console.error('Failed to fetch interactions:', intError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch analytics data'
            }, { status: 500 });
        }

        // Fetch conversations
        const { data: conversations } = await supabase
            .from('instagram_conversations')
            .select('*')
            .eq('status', 'active');

        // Fetch pending matches
        const { data: pendingMatches } = await supabase
            .from('instagram_pending_matches')
            .select('*')
            .eq('match_status', 'pending');

        // Calculate overview metrics
        const totalInteractions = interactions?.length || 0;
        const dmCount = interactions?.filter(i => i.interaction_type === 'dm').length || 0;
        const commentCount = interactions?.filter(i => i.interaction_type === 'comment').length || 0;
        const mentionCount = interactions?.filter(i => i.interaction_type === 'mention').length || 0;

        const matchedCount = interactions?.filter(i => i.lead_id).length || 0;
        const respondedCount = interactions?.filter(i => i.responded_at).length || 0;

        // Calculate engagement metrics
        const responseRate = totalInteractions > 0 ? respondedCount / totalInteractions : 0;

        // Calculate top engaged leads
        const leadEngagement = {};
        interactions?.forEach(int => {
            if (int.lead_id) {
                if (!leadEngagement[int.lead_id]) {
                    leadEngagement[int.lead_id] = {
                        lead_id: int.lead_id,
                        name: int.lead?.name || 'Unknown',
                        score: int.lead?.score || 0,
                        interactions: 0,
                        dms: 0,
                        comments: 0,
                        mentions: 0
                    };
                }
                leadEngagement[int.lead_id].interactions++;
                leadEngagement[int.lead_id][`${int.interaction_type}s`]++;
            }
        });

        const topLeads = Object.values(leadEngagement)
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 10);

        // Create timeline data (daily aggregation)
        const timelineMap = {};
        interactions?.forEach(int => {
            const date = new Date(int.instagram_timestamp).toISOString().split('T')[0];
            if (!timelineMap[date]) {
                timelineMap[date] = { date, dms: 0, comments: 0, mentions: 0, total: 0 };
            }
            timelineMap[date][`${int.interaction_type}s`]++;
            timelineMap[date].total++;
        });

        const timeline = Object.values(timelineMap).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        return NextResponse.json({
            success: true,
            period,
            overview: {
                total_interactions: totalInteractions,
                total_dms: dmCount,
                total_comments: commentCount,
                total_mentions: mentionCount,
                active_conversations: conversations?.length || 0,
                matched_leads: new Set(interactions?.filter(i => i.lead_id).map(i => i.lead_id)).size,
                pending_matches: pendingMatches?.length || 0
            },
            engagement: {
                response_rate: Math.round(responseRate * 100) / 100,
                responded_count: respondedCount,
                match_rate: totalInteractions > 0 ? Math.round((matchedCount / totalInteractions) * 100) / 100 : 0
            },
            timeline,
            top_leads: topLeads,
            breakdown: {
                by_type: {
                    dms: dmCount,
                    comments: commentCount,
                    mentions: mentionCount
                }
            }
        });

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
