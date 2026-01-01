
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
        let handle = null;
        let handleSource = null;

        if (lead.instagram && lead.instagram !== 'N/A') {
            handle = SocialAnalyzer.extractInstagramHandle(lead.instagram);
            handleSource = 'instagram field';
            console.log(`📍 [Enrich] Extracted handle from instagram field: "${lead.instagram}" -> "${handle}"`);
        }
        if (!handle && lead.website && lead.website !== 'N/A') {
            handle = SocialAnalyzer.extractInstagramHandle(lead.website);
            handleSource = 'website field';
            console.log(`📍 [Enrich] Extracted handle from website field: "${lead.website}" -> "${handle}"`);
        }

        if (!handle) {
            console.warn(`⚠️ [Enrich] No Instagram handle found for lead ${leadId || 'unknown'}`);
            return NextResponse.json({
                error: 'No Instagram handle found to enrich',
                lead: lead
            }, { status: 422 });
        }

        console.log(`✅ [Enrich] Using Instagram handle: "${handle}" (from ${handleSource})`);

        // 3. Fetch Data from Apify
        console.log(`🤖 [Enrich] Fetching Instagram metrics for: @${handle}`);

        try {
            const metrics = await SocialAnalyzer.fetchInstagramMetrics(handle);

            console.log(`✅ [Enrich] Successfully fetched metrics for @${handle}`);
            console.log(`   Followers: ${metrics.followers}`);
            console.log(`   Engagement Rate: ${metrics.engagementRate}%`);

            // Continue with the rest of the enrichment process...
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
            console.error('❌ [Enrich] Enrichment failed:', error);
            console.error('   Error details:', {
                message: error.message,
                type: error.constructor.name,
                leadId: leadId || 'unknown',
                handle: handle || 'not extracted'
            });

            // Return a user-friendly error message with the actual error details
            return NextResponse.json({
                error: error.message || 'Enrichment failed unexpectedly',
                details: 'Check server logs for more information'
            }, { status: 500 });
        }
    } catch (outerError) {
        // This catches errors from the initial request parsing or lead fetching
        console.error('❌ [Enrich] Request processing error:', outerError);
        return NextResponse.json({
            error: 'Failed to process enrichment request',
            details: outerError.message
        }, { status: 500 });
    }
}
