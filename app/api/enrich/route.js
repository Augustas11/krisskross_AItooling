
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SocialAnalyzer } from '@/lib/social-analyzer';
import { calculateLeadScore } from '@/lib/scoring-constants';

export async function POST(req) {
    console.log('✨ [API] POST /api/enrich');

    try {
        const body = await req.json();
        const { leadId, leadData } = body;

        let lead = leadData;

        // 1. If leadId provided, fetch from DB first to get latest state
        if (leadId && isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (data) {
                // Map DB keys to camelCase if needed, or just work with what we have
                // For simplicity, let's look at how we want to process it. 
                // Our calculateLeadScore handles snake_case properties if they exist?
                // Actually `calculateLeadScore` assumes `instagram_followers` (snake_case) or standard JS object?
                // Let's check `lib/scoring-constants.js`... it checks `lead.instagram_followers`
                // So if we fetch from DB, we have snake_case.
                lead = data;
            }
        }

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found or provided' }, { status: 400 });
        }

        // 2. Identify Instagram Handle
        // Prefer explicit handle, then try to extract from valid URLs
        const handle = lead.instagram || SocialAnalyzer.extractInstagramHandle(lead.website) || SocialAnalyzer.extractInstagramHandle(lead.instagram);

        if (!handle) {
            return NextResponse.json({
                error: 'No Instagram handle found to enrich',
                lead: lead
            }, { status: 422 });
        }

        // 3. Fetch Data from Apify
        console.log(`🤖 [Enrich] Analyzing handle: ${handle}`);
        const metrics = await SocialAnalyzer.fetchInstagramMetrics(handle);

        if (!metrics) {
            return NextResponse.json({ error: 'Failed to fetch metrics from Instagram' }, { status: 502 });
        }

        // 4. Merge Data
        // Helper to merge metrics into standard DB format
        const leadsUpdate = {
            instagram: handle, // Normalized handle
            instagram_followers: metrics.followers, // DB column: instagram_followers
            engagement_rate: metrics.engagementRate,
            avg_video_views: metrics.avgLikes, // Using avgLikes as proxy for now if views not avail
            // posting_frequency: 'calc_later', 
            last_scored_at: new Date().toISOString(),
            enriched: true
        };

        // 5. Calculate Score
        // We need to pass a merged object to the calculator
        // The calculator expects keys like `instagram_followers` (snake_case) or similar.
        // Let's ensure the object passed has the right keys.
        const leadForScoring = {
            ...lead,
            ...leadsUpdate
        };

        const { score, tier, tags, breakdown } = calculateLeadScore(leadForScoring);

        const finalUpdate = {
            ...leadsUpdate,
            score,
            tier,
            tags,
            score_breakdown: breakdown
        };

        // 6. Save to DB (if ID exists)
        if (leadId && isSupabaseConfigured()) {
            const { error: updateError } = await supabase
                .from('leads')
                .update(finalUpdate)
                .eq('id', leadId);

            if (updateError) throw updateError;
            console.log(`✅ [Enrich] Database updated for lead ${leadId}`);
        }

        return NextResponse.json({
            success: true,
            enrichedData: finalUpdate,
            metrics: metrics
        });

    } catch (error) {
        console.error('❌ [Enrich] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
