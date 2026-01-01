
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SocialAnalyzer } from '@/lib/social-analyzer';
import { enrichAndTagLead } from '@/lib/tags/enrichment.js';

export async function POST(req) {
    console.log('✨ [API] POST /api/enrich');

    try {
        const body = await req.json();
        const { leadId, leadData } = body;

        let lead = leadData;

        // 1. If leadId provided, fetch from DB first to ensure we have context
        if (leadId && isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (data) {
                // Map snake_case to camelCase for the enrichAndTagLead function
                lead = {
                    ...data,
                    id: data.id,
                    productCategory: data.product_category,
                    storeUrl: data.store_url,
                    briefDescription: data.brief_description,
                    businessAddress: data.business_address,
                    instagramFollowers: data.instagram_followers,
                    engagementRate: data.engagement_rate,
                    postingFrequency: data.posting_frequency,
                    scoreBreakdown: data.score_breakdown,
                    lastScoredAt: data.last_scored_at,
                    lastTaggedAt: data.last_tagged_at
                };
            }
        }

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found or provided' }, { status: 400 });
        }

        // 2. Perform Full Enrichment & Tagging (includes SocialAnalyzer + AI Analysis)
        try {
            console.log(`🤖 [Enrich] Starting deep enrichment for lead: ${lead.name || leadId}`);
            const enrichedLead = await enrichAndTagLead(lead);

            // 3. Map back to DB snake_case structure
            const dbUpdate = {
                instagram: enrichedLead.instagram,
                instagram_followers: enrichedLead.instagramFollowers,
                engagement_rate: enrichedLead.engagementRate,
                posting_frequency: enrichedLead.postingFrequency,
                enriched: true,
                score: enrichedLead.score,
                tier: enrichedLead.tier,
                tags: enrichedLead.tags,
                score_breakdown: enrichedLead.scoreBreakdown,
                last_scored_at: enrichedLead.lastScoredAt,
                last_tagged_at: new Date().toISOString()
            };

            // 4. Save to DB
            if (leadId && isSupabaseConfigured()) {
                const { error: updateError } = await supabase
                    .from('leads')
                    .update(dbUpdate)
                    .eq('id', leadId);

                if (updateError) throw updateError;
                console.log(`✅ [Enrich] Database updated for lead ${leadId}`);
            }

            return NextResponse.json({
                success: true,
                enrichedData: {
                    ...enrichedLead,
                    ...dbUpdate // Ensure returned data matches what UI expects
                }
            });

        } catch (error) {
            console.error('❌ [Enrich] Enrichment failed:', error);
            return NextResponse.json({
                error: error.message || 'Enrichment failed unexpectedly',
                details: error.stack
            }, { status: 500 });
        }
    } catch (outerError) {
        console.error('❌ [Enrich] Request processing error:', outerError);
        return NextResponse.json({
            error: 'Failed to process enrichment request',
            details: outerError.message
        }, { status: 500 });
    }
}

