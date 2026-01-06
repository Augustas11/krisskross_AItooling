import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/lists - Get all contact lists
 * POST /api/lists - Create a new contact list
 */

export async function GET(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const includeContacts = searchParams.get('include_contacts') === 'true';

        let query = supabase
            .from('contact_lists')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: lists, error } = await query;

        if (error) {
            console.error('Failed to fetch lists:', error);
            return NextResponse.json({ success: false, error: 'Failed to fetch lists' }, { status: 500 });
        }

        // If requested, include contact counts
        if (includeContacts && lists.length > 0) {
            for (const list of lists) {
                const { count } = await supabase
                    .from('list_contacts')
                    .select('*', { count: 'exact', head: true })
                    .eq('list_id', list.id)
                    .eq('subscribed', true);
                list.contact_count = count || 0;
            }
        }

        return NextResponse.json({ success: true, lists });
    } catch (error) {
        console.error('Lists API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { name, description, is_dynamic, filter_criteria } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'List name is required' }, { status: 400 });
        }

        const { data: list, error } = await supabase
            .from('contact_lists')
            .insert({
                name,
                description: description || null,
                is_dynamic: is_dynamic || false,
                filter_criteria: filter_criteria || null,
                contact_count: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create list:', error);
            return NextResponse.json({ success: false, error: 'Failed to create list' }, { status: 500 });
        }

        return NextResponse.json({ success: true, list });
    } catch (error) {
        console.error('Lists API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
