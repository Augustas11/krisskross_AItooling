/**
 * Lead Comments API Route
 * GET /api/instagram/lead-comments/:leadId
 * 
 * Fetches all Instagram comments made by a specific lead
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

        // Get lead info
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, name, instagram, instagram_handle')
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
                comments: [],
                summary: {
                    total_comments: 0,
                    recent_comments: 0,
                    response_rate: 0
                }
            });
        }

        // Fetch all comments from this lead
        const { data: comments, error: commentsError } = await supabase
            .from('instagram_interactions')
            .select('*')
            .eq('lead_id', leadId)
            .eq('interaction_type', 'comment')
            .order('instagram_timestamp', { ascending: false });

        if (commentsError) {
            console.error('Failed to fetch comments:', commentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch comments'
            }, { status: 500 });
        }

        // Calculate summary metrics
        const totalComments = comments?.length || 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentComments = comments?.filter(c =>
            new Date(c.instagram_timestamp) > sevenDaysAgo
        ).length || 0;

        const respondedComments = comments?.filter(c => c.responded_at).length || 0;
        const responseRate = totalComments > 0 ? respondedComments / totalComments : 0;

        return NextResponse.json({
            success: true,
            has_instagram: true,
            lead: {
                id: lead.id,
                name: lead.name,
                instagram_handle: instagramHandle
            },
            comments: comments || [],
            summary: {
                total_comments: totalComments,
                recent_comments: recentComments,
                responded_count: respondedComments,
                response_rate: Math.round(responseRate * 100) / 100
            }
        });

    } catch (error) {
        console.error('Lead comments API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
