import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        // 1. Check permission
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Fetch users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, status, last_login, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Implement POST (create), PATCH (update), DELETE (deactivate) as needed
export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, role, status } = body;

        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const updates = {};
        if (role) updates.role = role;
        if (status) updates.status = status;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;

        // Log activity
        await supabase.from('user_activity_logs').insert({
            user_id: session.userId,
            action_type: 'update_user',
            resource_type: 'user',
            resource_id: id,
            details: updates
        });

        return NextResponse.json({ success: true, user: data[0] });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
