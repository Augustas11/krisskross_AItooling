import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { enrollLeadInSequence, getSequenceIdByType } from '@/lib/email-sequences';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/posthog
 * Webhook endpoint for PostHog events to detect high-intent actions
 * Triggers Discord alerts for hot leads
 */
export async function POST(req) {
    console.log('🎯 [WEBHOOK] PostHog event received');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { event, properties, distinct_id } = body;

        console.log(`📊 [WEBHOOK] Event: ${event}, User: ${distinct_id}`);

        // High-intent events to track
        const highIntentEvents = {
            // Generic high-intent events
            'pricing_page_viewed': { score: 20, alert: true },
            'demo_video_watched': { score: 25, alert: true },
            'pricing_page_visited_multiple': { score: 30, alert: true },
            'trial_video_generated': { score: 20, alert: false },
            'trial_video_shared': { score: 25, alert: true },
            'feature_page_visited': { score: 10, alert: false },

            // KrissKross-specific events (from your PostHog)
            'insufficient_credits_shown': { score: 25, alert: true }, // User hit limit - upsell!
            'subscription_plan_selected': { score: 35, alert: true }, // HOT! Selecting plan
            'credits_purchased': { score: 40, alert: true }, // CONVERSION!
            'billing_success_viewed': { score: 40, alert: true }, // Payment successful!
            'video_generated': { score: 15, alert: false }, // User engaged
            'upgrade_clicked': { score: 30, alert: true }, // High intent to upgrade
        };

        if (!highIntentEvents[event]) {
            console.log(`ℹ️ [WEBHOOK] Event ${event} not tracked for intent scoring`);
            return NextResponse.json({ message: 'Event not tracked' });
        }

        const { score: intentBoost, alert: shouldAlert } = highIntentEvents[event];

        // Find lead by email or user ID
        const userEmail = properties?.email || properties?.$user_email || distinct_id;

        if (!userEmail) {
            console.log('⚠️ [WEBHOOK] No email found in event');
            return NextResponse.json({ message: 'No email found' });
        }

        // Look up lead in CRM
        const { data: leads, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('email', userEmail)
            .limit(1);

        if (fetchError) throw fetchError;

        if (!leads || leads.length === 0) {
            console.log(`👻 [WEBHOOK] Lead not found for ${userEmail}`);
            return NextResponse.json({ message: 'Lead not found in CRM' });
        }

        const lead = leads[0];

        // Update intent score and last_activity_at
        const newIntentScore = Math.min(100, (lead.intent_score || 50) + intentBoost);
        const newPriorityScore = (lead.fit_score || 50) * newIntentScore;

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                intent_score: newIntentScore,
                priority_score: newPriorityScore,
                last_activity_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) throw updateError;

        console.log(`✅ [WEBHOOK] Updated ${lead.name}: intent ${lead.intent_score} → ${newIntentScore}`);

        // --- BEHAVIORAL TRIGGERS ---
        // Trigger specific email sequences based on actions
        if (event === 'pricing_page_viewed' || event === 'pricing_page_visited_multiple') {
            // Check if we should nudge (only if intent is high enough or explicit action)
            // For now, let's be aggressive: View Pricing -> Get Help

            try {
                const pricingSeqId = await getSequenceIdByType('pricing_nudge');
                if (pricingSeqId) {
                    const result = await enrollLeadInSequence(lead.id, pricingSeqId);
                    if (result.success) {
                        console.log(`📧 [WEBHOOK] Enrolled ${lead.name} in Pricing Nudge`);
                    } else {
                        console.log(`ℹ️ [WEBHOOK] ${lead.name} already in sequence or errored: ${result.message}`);
                    }
                }
            } catch (seqErr) {
                console.error('❌ [WEBHOOK] Failed to enroll in pricing nudge:', seqErr);
            }
        }
        // ---------------------------

        // Send Discord alert for high-intent actions
        if (shouldAlert && process.env.DISCORD_WEBHOOK_URL) {
            await sendDiscordAlert({
                event,
                lead: {
                    ...lead,
                    intent_score: newIntentScore,
                    priority_score: newPriorityScore
                },
                properties
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Intent score updated',
            leadId: lead.id,
            newIntentScore,
            newPriorityScore
        });

    } catch (error) {
        console.error('❌ [WEBHOOK] Error processing PostHog event:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Send Discord alert for high-intent lead
 */
async function sendDiscordAlert({ event, lead, properties }) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('⚠️ [DISCORD] No webhook URL configured');
        return;
    }

    const eventLabels = {
        'pricing_page_viewed': '💰 Pricing Page Visit',
        'demo_video_watched': '🎥 Demo Video Watched',
        'pricing_page_visited_multiple': '🔥 Multiple Pricing Visits',
        'trial_video_shared': '📤 Video Shared on Social',
        'insufficient_credits_shown': '⚠️ Credits Depleted',
        'subscription_plan_selected': '🎯 Plan Selected',
        'credits_purchased': '💳 Credits Purchased',
        'billing_success_viewed': '✅ Payment Successful',
        'upgrade_clicked': '⬆️ Upgrade Clicked',
    };

    const embed = {
        title: `🚨 High-Intent Lead Alert: ${eventLabels[event] || event}`,
        description: `**${lead.name}** just showed high purchase intent!`,
        color: 0xFF6B00, // Orange
        fields: [
            {
                name: '👤 Lead',
                value: lead.name,
                inline: true
            },
            {
                name: '📧 Email',
                value: lead.email || 'N/A',
                inline: true
            },
            {
                name: '📊 Priority Score',
                value: `${lead.priority_score} (Fit: ${lead.fit_score}, Intent: ${lead.intent_score})`,
                inline: false
            },
            {
                name: '🎯 Action',
                value: eventLabels[event] || event,
                inline: true
            },
            {
                name: '⏰ Time',
                value: new Date().toLocaleString(),
                inline: true
            }
        ],
        footer: {
            text: '⚡ Contact this lead within 30 minutes for best results!'
        }
    };

    // Add CRM link if available
    if (process.env.NEXT_PUBLIC_APP_URL) {
        embed.fields.push({
            name: '🔗 CRM Link',
            value: `${process.env.NEXT_PUBLIC_APP_URL}/?leadId=${lead.id}`,
            inline: false
        });
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `@here 🚨 **HOT LEAD ALERT** - ${lead.name} is showing high purchase intent!`,
                embeds: [embed]
            })
        });

        if (response.ok) {
            console.log(`✅ [DISCORD] Alert sent for ${lead.name}`);
        } else {
            console.error('❌ [DISCORD] Failed to send alert:', await response.text());
        }
    } catch (error) {
        console.error('❌ [DISCORD] Error sending alert:', error);
    }
}
