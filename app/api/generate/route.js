import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req) {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY in environment variables' }, { status: 500 });
        }

        const anthropic = new Anthropic({
            apiKey: apiKey,
        });

        const { targetType, customName, context, leadId } = await req.json();

        // Auto-populate context from CRM if leadId provided
        let enrichedContext = context;
        let leadData = null;

        if (leadId) {
            try {
                const { supabase, isSupabaseConfigured } = require('@/lib/supabase');
                if (isSupabaseConfigured()) {
                    const { data: lead, error } = await supabase
                        .from('leads')
                        .select('*')
                        .eq('id', leadId)
                        .single();

                    if (!error && lead) {
                        leadData = lead;
                        // Auto-populate context from enriched CRM data
                        const contextParts = [];

                        if (lead.product_category) contextParts.push(`Business Category: ${lead.product_category}`);
                        if (lead.instagram_followers) contextParts.push(`Instagram: ${lead.instagram_followers.toLocaleString()} followers`);
                        if (lead.engagement_rate) contextParts.push(`Engagement Rate: ${lead.engagement_rate}%`);
                        if (lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0) {
                            const tagNames = lead.tags.map(t => t.name || t).slice(0, 5).join(', ');
                            contextParts.push(`Key Insights: ${tagNames}`);
                        }
                        if (lead.ai_research_summary) {
                            // Extract first 200 chars of summary
                            const summary = lead.ai_research_summary.substring(0, 200).trim();
                            contextParts.push(`AI Research: ${summary}...`);
                        }

                        enrichedContext = contextParts.join('\n');
                    }
                }
            } catch (e) {
                console.error('Error fetching lead data:', e);
                // Continue with manual context if fetch fails
            }
        }

        const systemPrompt = `You are the KrissKross AI Brand Voice Expert. Your goal is to generate high-converting outreach pitches for SDRs.

Voice Guidelines:
1. Direct & Punchy: Start with a problem that hurts (e.g., wasted hours, high costs).
2. Benefit-Focused: We turn product photos into TikTok videos in minutes.
3. Specific Proof: Mention $20.99 for 50 videos and savings of 10+ hours/week.
4. No Tech Jargon: Avoid "AI models" or "rendering". Use "scroll-stopping videos".
5. No False Promises: Don't promise "going viral". Promise professional consistency.
6. Structure: Problem (Hook) -> Solution (Value) -> Proof (Evidence) -> CTA (Action).

Target: ${targetType}
Recipient Name: ${customName || 'Prospect'}
${enrichedContext ? `Additional Context: ${enrichedContext}` : ''}

CRITICAL: If context is provided (like a profile link, bio, or product details), weave it into the hook or value prop to make the pitch feel deeply personalized and not robotic.

Keep it under 100 words. Be conversational but professional. Use line breaks for readability.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 300,
            system: systemPrompt,
            messages: [
                { role: "user", content: `Generate a KrissKross pitch for ${customName ? customName : 'a ' + targetType}.${enrichedContext ? ` Use this context to personalize it: ${enrichedContext}` : ''}` }
            ],
        });

        const pitchText = response.content[0].text;

        // Auto-save to history (Fire & Forget for speed)
        try {
            const { supabase, isSupabaseConfigured } = require('@/lib/supabase');
            if (isSupabaseConfigured()) {
                const { error: historyError } = await supabase
                    .from('pitch_history')
                    .insert([{
                        lead_id: leadId || null,
                        lead_name: customName || leadData?.name || 'Unknown',
                        target_type: targetType,
                        context: enrichedContext || context,
                        generated_pitch: pitchText,
                        was_ai_generated: true
                    }]);

                if (historyError) console.error('Error saving pitch history:', historyError);
            }
        } catch (e) { console.error('History save failed', e); }

        return NextResponse.json({ pitch: pitchText });
    } catch (error) {
        console.error('Claude API Error Details:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error occurred during generation',
            details: error.stack
        }, { status: 500 });
    }
}
