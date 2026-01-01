
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'pitch', 'email', or 'all'

    if (!isSupabaseConfigured()) {
        return NextResponse.json({ data: [] });
    }

    try {
        let results = {};

        if (type === 'pitch' || type === 'all' || !type) {
            const { data, error } = await supabase
                .from('pitch_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            results.pushes = data;
        }

        if (type === 'email' || type === 'all' || !type) {
            const { data, error } = await supabase
                .from('email_history')
                .select('*')
                .order('sent_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            results.emails = data;
        }

        // If specific type requested, flatten
        if (type === 'pitch') return NextResponse.json({ data: results.pushes });
        if (type === 'email') return NextResponse.json({ data: results.emails });

        return NextResponse.json(results);

    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
