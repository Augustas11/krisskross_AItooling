import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/funnel
 * Get lead funnel metrics and conversion rates
 */
export async function GET(req) {
    console.log('📊 [API] GET /api/analytics/funnel');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const dateFrom = searchParams.get('from');
        const dateTo = searchParams.get('to');

        // Build query
        let query = supabase.from('leads').select('status, created_at, tier, score');

        // Apply date filters if provided
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data: leads, error } = await query;

        if (error) throw error;

        // Calculate funnel metrics
        const statusCounts = {
            'New': 0,
            'Pitched': 0,
            'Emailed': 0,
            'Replied': 0,
            'Customer': 0,
            'Dead': 0
        };

        const tierCounts = {
            'GREEN': 0,
            'YELLOW': 0,
            'RED': 0,
            'GRAY': 0
        };

        leads.forEach(lead => {
            // Count by status
            const status = lead.status || 'New';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts['New']++;
            }

            // Count by tier
            const tier = lead.tier || 'GRAY';
            if (tierCounts.hasOwnProperty(tier)) {
                tierCounts[tier]++;
            }
        });

        // Calculate conversion rates
        const total = leads.length;
        const contacted = statusCounts['Pitched'] + statusCounts['Emailed'] + statusCounts['Replied'] + statusCounts['Customer'];
        const engaged = statusCounts['Replied'] + statusCounts['Customer'];
        const converted = statusCounts['Customer'];

        const conversionRates = {
            newToContacted: total > 0 ? (contacted / total * 100).toFixed(1) : 0,
            contactedToEngaged: contacted > 0 ? (engaged / contacted * 100).toFixed(1) : 0,
            engagedToConverted: engaged > 0 ? (converted / engaged * 100).toFixed(1) : 0,
            overallConversion: total > 0 ? (converted / total * 100).toFixed(1) : 0
        };

        // Calculate average scores by tier
        const scoresByTier = {};
        Object.keys(tierCounts).forEach(tier => {
            const tierLeads = leads.filter(l => (l.tier || 'GRAY') === tier);
            const avgScore = tierLeads.length > 0
                ? (tierLeads.reduce((sum, l) => sum + (l.score || 0), 0) / tierLeads.length).toFixed(1)
                : 0;
            scoresByTier[tier] = avgScore;
        });

        return NextResponse.json({
            success: true,
            funnel: {
                total,
                new: statusCounts['New'],
                contacted,
                engaged,
                converted,
                dead: statusCounts['Dead']
            },
            statusBreakdown: statusCounts,
            tierBreakdown: tierCounts,
            conversionRates,
            scoresByTier,
            dateRange: {
                from: dateFrom || 'all time',
                to: dateTo || 'now'
            }
        });

    } catch (error) {
        console.error('❌ [API] Error fetching funnel data:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
