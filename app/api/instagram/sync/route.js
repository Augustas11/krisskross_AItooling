import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/instagram/sync
 * Trigger the Instagram sync Edge Function
 */
export async function POST(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Call the Edge Function
        const { data, error } = await supabase.functions.invoke('instagram-sync');

        if (error) {
            console.error('Sync function error:', error);
            return NextResponse.json({
                success: false,
                error: error.message || 'Failed to trigger sync'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sync triggered successfully',
            data
        });

    } catch (error) {
        console.error('Error triggering sync:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/instagram/sync
 * Check sync status
 */
export async function GET(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get the most recent sync log
        const { data: lastSync, error } = await supabase
            .from('instagram_sync_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching sync status:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            lastSync: lastSync || null
        });

    } catch (error) {
        console.error('Error getting sync status:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
