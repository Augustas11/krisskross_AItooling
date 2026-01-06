import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/analytics/email - Get email analytics summary
 * 
 * Query params:
 * - period: '7d', '30d', '90d' (default: '30d')
 * - lead_id: optional, filter by specific lead
 * - campaign_id: optional, filter by campaign
 */

export async function GET(request) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d';
        const leadId = searchParams.get('lead_id');
        const campaignId = searchParams.get('campaign_id');

        // Calculate date range
        const days = parseInt(period) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build query for email sends
        let sendsQuery = supabase
            .from('email_sends')
            .select('*')
            .gte('created_at', startDate.toISOString());

        if (leadId) {
            sendsQuery = sendsQuery.eq('lead_id', leadId);
        }
        if (campaignId) {
            sendsQuery = sendsQuery.eq('campaign_id', campaignId);
        }

        const { data: sends, error: sendsError } = await sendsQuery;

        if (sendsError) {
            console.error('Failed to fetch email sends:', sendsError);
            return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
        }

        // Calculate summary metrics
        const totalSent = sends.length;
        const delivered = sends.filter(s => s.status === 'delivered' || s.delivered_at).length;
        const opened = sends.filter(s => s.opened_at).length;
        const clicked = sends.filter(s => s.first_clicked_at).length;
        const bounced = sends.filter(s => s.bounced_at || s.status === 'failed').length;
        const unsubscribed = sends.filter(s => s.unsubscribed_at).length;

        // Calculate rates
        const deliveryRate = totalSent > 0 ? (delivered / totalSent * 100).toFixed(1) : 0;
        const openRate = delivered > 0 ? (opened / delivered * 100).toFixed(1) : 0;
        const clickRate = opened > 0 ? (clicked / opened * 100).toFixed(1) : 0;
        const bounceRate = totalSent > 0 ? (bounced / totalSent * 100).toFixed(1) : 0;

        // Get daily breakdown
        const dailyStats = {};
        sends.forEach(send => {
            const date = send.created_at.split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
            }
            dailyStats[date].sent++;
            if (send.delivered_at || send.status === 'delivered') dailyStats[date].delivered++;
            if (send.opened_at) dailyStats[date].opened++;
            if (send.first_clicked_at) dailyStats[date].clicked++;
        });

        // Convert to array sorted by date
        const dailyBreakdown = Object.entries(dailyStats)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Get top performing leads (most engaged)
        const leadEngagement = {};
        sends.forEach(send => {
            if (!send.lead_id) return;
            if (!leadEngagement[send.lead_id]) {
                leadEngagement[send.lead_id] = { opens: 0, clicks: 0, emails: 0 };
            }
            leadEngagement[send.lead_id].emails++;
            if (send.opened_at) leadEngagement[send.lead_id].opens++;
            if (send.first_clicked_at) leadEngagement[send.lead_id].clicks++;
        });

        // Get lead names for top performers
        const topLeadIds = Object.entries(leadEngagement)
            .sort((a, b) => (b[1].opens + b[1].clicks * 2) - (a[1].opens + a[1].clicks * 2))
            .slice(0, 10)
            .map(([id]) => id);

        let topLeads = [];
        if (topLeadIds.length > 0) {
            const { data: leadData } = await supabase
                .from('leads')
                .select('id, name, email, business_category')
                .in('id', topLeadIds);

            topLeads = topLeadIds.map(id => ({
                lead: leadData?.find(l => l.id === id) || { id },
                ...leadEngagement[id],
                engagement_score: leadEngagement[id].opens + leadEngagement[id].clicks * 2
            }));
        }

        // Get recent events
        const { data: recentEvents } = await supabase
            .from('email_events')
            .select('*, email_sends(subject_line, sent_to_email, lead_id)')
            .order('created_at', { ascending: false })
            .limit(50);

        return NextResponse.json({
            success: true,
            period: `${days} days`,
            summary: {
                total_sent: totalSent,
                delivered: delivered,
                opened: opened,
                clicked: clicked,
                bounced: bounced,
                unsubscribed: unsubscribed,
                delivery_rate: parseFloat(deliveryRate),
                open_rate: parseFloat(openRate),
                click_rate: parseFloat(clickRate),
                bounce_rate: parseFloat(bounceRate)
            },
            daily_breakdown: dailyBreakdown,
            top_engaged_leads: topLeads,
            recent_events: recentEvents?.slice(0, 20) || []
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
