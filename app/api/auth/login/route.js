import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // 1. Fetch user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Return generic error to prevent enumeration, but log internal error
            console.error('Login error:', error);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. Verify password
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.status !== 'active') {
            return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
        }

        // 3. Create session token
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.full_name
        };

        const token = await createSessionToken(payload);

        // 4. Set cookie
        await setSessionCookie(token);

        // 5. Log activity
        await supabase.from('user_activity_logs').insert({
            user_id: user.id,
            action_type: 'login',
            details: { method: 'email_password' }
        });

        // Update last login
        await supabase.from('users').update({ last_login: new Date() }).eq('id', user.id);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            }
        });

    } catch (err) {
        console.error('Login implementation error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
