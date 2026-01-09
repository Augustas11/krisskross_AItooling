import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/instagram/sync-logs
 * Fetch sync job history with stats
 */
export async function GET(request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch recent sync logs
        const { data: logs, error } = await supabase
            .from('instagram_sync_log')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching sync logs:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Calculate stats
        const totalSyncs = logs?.length || 0;
        const successCount = logs?.filter(l => l.status === 'success').length || 0;
        const successRate = totalSyncs > 0 ? Math.round((successCount / totalSyncs) * 100) : 0;

        const lastSync = logs?.[0]?.started_at || null;

        const durations = logs?.filter(l => l.duration_ms).map(l => l.duration_ms / 1000) || [];
        const avgDuration = durations.length > 0
            ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
            : 0;

        return NextResponse.json({
            success: true,
            logs: logs || [],
            stats: {
                totalSyncs,
                successRate,
                lastSync,
                avgDuration
            }
        });

    } catch (error) {
        console.error('Error in sync-logs API:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
