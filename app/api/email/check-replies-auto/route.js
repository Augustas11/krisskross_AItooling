import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnreadReplies, markEmailAsSeen } from '../../../../email-automation/services/imap-client';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
    console.log('🔄 [CRON] Checking for email replies via IMAP...');
    const logs = [];

    try {
        // 1. Fetch unread emails from IMAP
        let unreadEmails = [];
        try {
            unreadEmails = await getUnreadReplies();
        } catch (imapError) {
            console.error('IMAP Connection Failed:', imapError);
            return NextResponse.json({ error: 'IMAP Check Failed', details: imapError.message }, { status: 500 });
        }

        if (!unreadEmails || unreadEmails.length === 0) {
            console.log('📭 No new unread replies.');
            return NextResponse.json({
                success: true,
                message: 'No new replies found in inbox',
                processed: 0,
                matched: 0
            });
        }

        logs.push(`Found ${unreadEmails.length} unread emails`);
        console.log(`📨 Processing ${unreadEmails.length} emails...`);

        let processedCount = 0;
        let matchedCount = 0;

        // 2. Process each email
        for (const email of unreadEmails) {
            try {
                const fromEmail = email.from;
                const normalizedEmail = fromEmail.trim().toLowerCase();

                // Search for lead by email
                // Using maybe 'ilike' or just direct match.
                // Note: email.from might contain name "Name <email>". `imap-client` parses it.

                const { data: leads, error: searchError } = await supabase
                    .from('leads')
                    .select('id, name, status, email, in_sequence')
                    .ilike('email', normalizedEmail)
                    .limit(1);

                if (searchError) {
                    logs.push(`Error searching for ${normalizedEmail}: ${searchError.message}`);
                    continue;
                }

                if (leads && leads.length > 0) {
                    const lead = leads[0];
                    matchedCount++;
                    logs.push(`🎯 Matched lead: ${lead.name} (${lead.email})`);

                    // Log Activity Feed Event
                    try {
                        await supabase.from('activity_feed').insert({
                            actor_name: 'System',
                            action_verb: 'detected reply',
                            action_type: 'email',
                            entity_type: 'lead',
                            entity_id: lead.id,
                            entity_name: lead.name,
                            metadata: {
                                subject: email.subject,
                                from: email.from,
                                preview: email.preview,
                                previously_in_sequence: lead.in_sequence
                            },
                            priority: 8,
                            first_occurred_at: new Date().toISOString()
                        });
                        logs.push(`Logged activity for ${lead.name}`);
                    } catch (actErr) {
                        console.error('Error logging activity:', actErr);
                    }

                    // A. Mark as Replied
                    if (lead.status !== 'Replied') {
                        await supabase
                            .from('leads')
                            .update({
                                status: 'Replied',
                                last_interaction: new Date().toISOString(),
                                // Auto-pause sequence if replied
                                in_sequence: false
                            })
                            .eq('id', lead.id);

                        logs.push(`Updated status to Replied for ${lead.name}`);
                    }

                    // B. Stop Sequence Enrollment
                    if (lead.in_sequence) {
                        await supabase
                            .from('email_sequence_enrollments')
                            .update({
                                completed_at: new Date().toISOString(),
                                unenrolled_at: new Date().toISOString(),
                                unenroll_reason: 'reply_received'
                            })
                            .eq('lead_id', lead.id)
                            .is('completed_at', null)
                            .is('unenrolled_at', null);

                        logs.push(`Unenrolled ${lead.name} from sequence`);
                    }

                    // C. Mark email as seen in IMAP
                    await markEmailAsSeen(email.uid);
                    processedCount++;

                } else {
                    logs.push(`👻 No lead matched for ${normalizedEmail}`);
                }

            } catch (err) {
                console.error(`Error processing email ${email.uid}:`, err);
                logs.push(`Error processing email ${email.uid}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            matched: matchedCount,
            logs
        });

    } catch (error) {
        console.error('❌ [CRON] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
