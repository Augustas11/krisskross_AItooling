import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/lists/[listId] - Get list details with contacts
 * PUT /api/lists/[listId] - Update list
 * DELETE /api/lists/[listId] - Delete list
 */

export async function GET(request, { params }) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { listId } = params;

        // Get list details
        const { data: list, error: listError } = await supabase
            .from('contact_lists')
            .select('*')
            .eq('id', listId)
            .single();

        if (listError || !list) {
            return NextResponse.json({ success: false, error: 'List not found' }, { status: 404 });
        }

        // Get contacts in this list
        const { data: contacts, error: contactsError } = await supabase
            .from('list_contacts')
            .select('lead_id, subscribed, created_at')
            .eq('list_id', listId)
            .eq('subscribed', true);

        if (contactsError) {
            console.error('Failed to fetch contacts:', contactsError);
        }

        // Get lead details for each contact
        if (contacts && contacts.length > 0) {
            const leadIds = contacts.map(c => c.lead_id);
            const { data: leads } = await supabase
                .from('leads')
                .select('id, name, email, business_category, instagram')
                .in('id', leadIds);

            list.contacts = contacts.map(c => ({
                ...c,
                lead: leads?.find(l => l.id === c.lead_id) || null
            }));
        } else {
            list.contacts = [];
        }

        list.contact_count = list.contacts.length;

        return NextResponse.json({ success: true, list });
    } catch (error) {
        console.error('List detail API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { listId } = params;
        const body = await request.json();

        const updates = {};
        if (body.name) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.filter_criteria !== undefined) updates.filter_criteria = body.filter_criteria;
        updates.updated_at = new Date().toISOString();

        const { data: list, error } = await supabase
            .from('contact_lists')
            .update(updates)
            .eq('id', listId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: 'Failed to update list' }, { status: 500 });
        }

        return NextResponse.json({ success: true, list });
    } catch (error) {
        console.error('List update API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { listId } = params;

        // Delete list (cascade will handle list_contacts)
        const { error } = await supabase
            .from('contact_lists')
            .delete()
            .eq('id', listId);

        if (error) {
            return NextResponse.json({ success: false, error: 'Failed to delete list' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('List delete API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
