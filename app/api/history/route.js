
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper to validate leads data size isn't massive before storing? 
// Supabase JSONB limit is 255MB, so we should be fine for typical searches (20-100 leads).

export async function GET() {
    console.log('📜 [API] GET /api/history');

    if (!isSupabaseConfigured()) {
        return NextResponse.json({ history: [] }); // Fallback for local-only? Or just empty.
    }

    try {
        const { data, error } = await supabase
            .from('search_history')
            .select('id, created_at, search_url, provider, leads_count, leads_data')
            .order('created_at', { ascending: false })
            .limit(20); // Last 20 searches

        if (error) throw error;

        return NextResponse.json({ history: data });
    } catch (error) {
        console.error('❌ [API] History fetch failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    console.log('💾 [API] POST /api/history');

    if (!isSupabaseConfigured()) {
        return NextResponse.json({ message: 'History skipped (Supabase not configured)' });
    }

    try {
        const { searchUrl, provider, leads } = await req.json();

        // Validate
        if (!searchUrl || !leads) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('search_history')
            .insert([{
                search_url: searchUrl,
                provider: provider,
                leads_count: leads.length,
                leads_data: leads
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, entry: data });

    } catch (error) {
        console.error('❌ [API] History save failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
