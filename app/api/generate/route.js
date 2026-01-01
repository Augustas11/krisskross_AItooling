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

        const { targetType, customName, context } = await req.json();

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
${context ? `Additional Context: ${context}` : ''}

CRITICAL: If context is provided (like a profile link, bio, or product details), weave it into the hook or value prop to make the pitch feel deeply personalized and not robotic.

Keep it under 100 words. Be conversational but professional. Use line breaks for readability.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 300,
            system: systemPrompt,
            messages: [
                { role: "user", content: `Generate a KrissKross pitch for ${customName ? customName : 'a ' + targetType}.${context ? ` Use this context to personalize it: ${context}` : ''}` }
            ],
        });

        const pitchText = response.content[0].text;

        // Auto-save to history (Fire & Forget for speed)
        try {
            const { supabase, isSupabaseConfigured } = require('@/lib/supabase');
            if (isSupabaseConfigured()) {
                supabase
                    .from('pitch_history')
                    .insert([{
                        lead_name: customName || 'Unknown',
                        target_type: targetType,
                        context: context,
                        generated_pitch: pitchText,
                        was_ai_generated: true
                    }])
                    .then(res => {
                        if (res.error) console.error('Error saving pitch history:', res.error);
                    });
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
