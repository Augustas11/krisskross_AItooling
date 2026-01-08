/**
 * Mark Comment Responded API Route
 * POST /api/instagram/mark-comment-responded
 * 
 * Marks an Instagram comment as responded to track engagement
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
    try {
        const body = await request.json();
        const { interaction_id, response_text } = body;

        if (!interaction_id) {
            return NextResponse.json({
                success: false,
                error: 'Missing interaction_id'
            }, { status: 400 });
        }

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Update interaction with response metadata
        const { data, error } = await supabase
            .from('instagram_interactions')
            .update({
                responded_at: new Date().toISOString(),
                response_metadata: {
                    response_text: response_text || null,
                    responded_by: 'SDR', // TODO: Add actual user tracking
                    responded_via: 'crm_ui'
                }
            })
            .eq('id', interaction_id)
            .select()
            .single();

        if (error) {
            console.error('Failed to mark comment as responded:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to update comment'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            interaction: data
        });

    } catch (error) {
        console.error('Mark comment responded error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
