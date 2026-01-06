import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/lists/[listId]/contacts - Add leads to a list
 * DELETE /api/lists/[listId]/contacts - Remove leads from a list
 */

export async function POST(request, { params }) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { listId } = params;
        const body = await request.json();
        const { lead_ids } = body;

        if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
            return NextResponse.json({ success: false, error: 'lead_ids array is required' }, { status: 400 });
        }

        // Add contacts to list (upsert to handle duplicates)
        const contacts = lead_ids.map(lead_id => ({
            list_id: listId,
            lead_id: lead_id,
            subscribed: true
        }));

        const { data, error } = await supabase
            .from('list_contacts')
            .upsert(contacts, { onConflict: 'list_id,lead_id' })
            .select();

        if (error) {
            console.error('Failed to add contacts:', error);
            return NextResponse.json({ success: false, error: 'Failed to add contacts' }, { status: 500 });
        }

        // Update contact count
        const { count } = await supabase
            .from('list_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            .eq('subscribed', true);

        await supabase
            .from('contact_lists')
            .update({ contact_count: count, updated_at: new Date().toISOString() })
            .eq('id', listId);

        return NextResponse.json({
            success: true,
            added: data.length,
            total_contacts: count
        });
    } catch (error) {
        console.error('Add contacts API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { listId } = params;
        const body = await request.json();
        const { lead_ids } = body;

        if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
            return NextResponse.json({ success: false, error: 'lead_ids array is required' }, { status: 400 });
        }

        // Remove contacts (soft delete by setting subscribed = false)
        const { error } = await supabase
            .from('list_contacts')
            .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
            .eq('list_id', listId)
            .in('lead_id', lead_ids);

        if (error) {
            console.error('Failed to remove contacts:', error);
            return NextResponse.json({ success: false, error: 'Failed to remove contacts' }, { status: 500 });
        }

        // Update contact count
        const { count } = await supabase
            .from('list_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId)
            .eq('subscribed', true);

        await supabase
            .from('contact_lists')
            .update({ contact_count: count, updated_at: new Date().toISOString() })
            .eq('id', listId);

        return NextResponse.json({
            success: true,
            removed: lead_ids.length,
            total_contacts: count
        });
    } catch (error) {
        console.error('Remove contacts API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
