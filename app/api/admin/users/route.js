// ... imports
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hashPassword, validatePasswordStrength } from '@/lib/auth';

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

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, fullName, role } = body;

        // Validation
        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { valid, message } = validatePasswordStrength(password);
        if (!valid) {
            return NextResponse.json({ error: message }, { status: 400 });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert
        const { data, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: passwordHash,
                full_name: fullName,
                role: role || 'user',
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }
            throw error;
        }

        // Log activity
        await supabase.from('user_activity_logs').insert({
            user_id: session.userId,
            action_type: 'create_user',
            resource_type: 'user',
            resource_id: data.id,
            details: { email, role: role || 'user' }
        });

        return NextResponse.json({ success: true, user: data });

    } catch (error) {
        console.error('Create user error:', error);
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
