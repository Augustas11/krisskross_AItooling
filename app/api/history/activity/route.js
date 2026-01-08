
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'pitch', 'email', 'all', or 'lead'
    const leadId = searchParams.get('leadId');

    if (!isSupabaseConfigured()) {
        return NextResponse.json({ data: [] });
    }

    try {
        let results = [];

        // CASE 1: Fetch Specific Lead Activity (Timeline)
        if (leadId) {
            // 1. Logs
            const { data: logs, error: logsError } = await supabase
                .from('user_activity_logs')
                .select('*')
                .eq('resource_id', leadId)
                .order('created_at', { ascending: false });

            if (logsError && logsError.code !== '42P01') console.error('Logs fetch error:', logsError); // Ignore if table missing

            // 2. Emails (History)
            const { data: emails, error: emailError } = await supabase
                .from('email_history')
                .select('*')
                .eq('lead_id', leadId)
                .order('sent_at', { ascending: false });

            // 3. Activity Feed (New System)
            const { data: activityFeed, error: activityError } = await supabase
                .from('activity_feed')
                .select('*')
                .eq('entity_id', leadId)
                .order('first_occurred_at', { ascending: false });

            // Normalize and Merge
            const normalizedLogs = (logs || []).map(l => ({
                id: `log-${l.id}`,
                type: 'log',
                action: l.action_type,
                details: l.details,
                timestamp: l.created_at
            }));

            const normalizedEmails = (emails || []).map(e => ({
                id: `email-${e.id}`,
                type: 'email',
                action: 'Email Sent',
                details: { subject: e.subject, to: e.recipient_email, status: e.status, body: e.body },
                timestamp: e.sent_at
            }));

            const normalizedActivities = (activityFeed || []).map(a => ({
                id: `activity-${a.id}`,
                type: a.action_type === 'email' && a.action_verb === 'detected reply' ? 'reply' : 'activity',
                action: a.action_verb,
                details: a.metadata,
                timestamp: a.first_occurred_at
            }));

            results = [...normalizedLogs, ...normalizedEmails, ...normalizedActivities]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));



            return NextResponse.json({ data: results });
        }

        // CASE 2: Global Recent History (Legacy / Dashboard)
        let dashboardResults = {};

        if (type === 'pitch' || type === 'all' || !type) {
            const { data, error } = await supabase
                .from('pitch_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error && error.code !== '42P01') throw error;
            dashboardResults.pushes = data || [];
        }

        if (type === 'email' || type === 'all' || !type) {
            const { data, error } = await supabase
                .from('email_history')
                .select('*')
                .order('sent_at', { ascending: false })
                .limit(20);

            if (error && error.code !== '42P01') throw error;
            dashboardResults.emails = data || [];
        }

        if (type === 'pitch') return NextResponse.json({ data: dashboardResults.pushes });
        if (type === 'email') return NextResponse.json({ data: dashboardResults.emails });

        return NextResponse.json(dashboardResults);

    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
