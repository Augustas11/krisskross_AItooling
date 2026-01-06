/**
 * Update Conversation API Route  
 * PATCH /api/instagram/conversations/:conversationId
 * 
 * Updates conversation metadata (status, assignment, etc)
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function PATCH(request, { params }) {
    try {
        const { conversationId } = params;
        const body = await request.json();

        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured'
            }, { status: 500 });
        }

        // Build update object from allowed fields
        const updates = {};
        if (body.status) updates.status = body.status;
        if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
        if (body.unread_count !== undefined) updates.unread_count = body.unread_count;

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('instagram_conversations')
            .update(updates)
            .eq('id', conversationId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update conversation:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to update conversation'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            conversation: data
        });

    } catch (error) {
        console.error('Update conversation error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
