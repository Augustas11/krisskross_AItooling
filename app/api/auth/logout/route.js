import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST() {
    try {
        // Optional: Log logout activity
        const session = await getSession();
        if (session) {
            await supabase.from('user_activity_logs').insert({
                user_id: session.userId,
                action_type: 'logout',
                details: {}
            });
        }

        await clearSessionCookie();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
