import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/email/check-replies-auto
 * Automated cron job to check for email replies and update lead status
 * Should be called hourly via Vercel Cron
 */
export async function GET(req) {
    console.log('🔄 [CRON] Checking for email replies...');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    try {
        // Import the reply checker
        const { checkForReplies } = require('@/email-automation/reply-checker');

        // Run the reply check
        await checkForReplies();

        // After checking replies, unenroll any leads that replied from sequences
        const { data: repliedLeads, error: fetchError } = await supabase
            .from('leads')
            .select('id, name, email, in_sequence')
            .eq('status', 'Replied')
            .eq('in_sequence', true);

        if (fetchError) throw fetchError;

        let unenrolledCount = 0;

        if (repliedLeads && repliedLeads.length > 0) {
            console.log(`📧 Found ${repliedLeads.length} replied leads in sequences, unenrolling...`);

            for (const lead of repliedLeads) {
                try {
                    // Unenroll from sequence
                    const { error: unenrollError } = await supabase
                        .from('email_sequence_enrollments')
                        .update({
                            unenrolled_at: new Date().toISOString(),
                            unenroll_reason: 'auto_unenroll'
                        })
                        .eq('lead_id', lead.id)
                        .is('completed_at', null)
                        .is('unenrolled_at', null);

                    if (unenrollError) throw unenrollError;

                    // Update lead flag
                    const { error: updateError } = await supabase
                        .from('leads')
                        .update({ in_sequence: false })
                        .eq('id', lead.id);

                    if (updateError) throw updateError;

                    unenrolledCount++;
                    console.log(`✅ Unenrolled ${lead.name} from sequence (replied)`);

                } catch (err) {
                    console.error(`❌ Error unenrolling lead ${lead.id}:`, err);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Reply check complete. Unenrolled ${unenrolledCount} leads from sequences.`,
            unenrolledCount
        });

    } catch (error) {
        console.error('❌ [CRON] Error checking replies:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
