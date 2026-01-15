import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllRecentEmails, markEmailAsSeen } from '../../../../email-automation/services/imap-client';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Extract email address from various formats like "Name <email@domain.com>" or just "email@domain.com"
 */
function extractEmailAddress(fromString) {
    if (!fromString) return null;

    // Try to match email in angle brackets first: "Name <email@domain.com>"
    const angleMatch = fromString.match(/<([^>]+)>/);
    if (angleMatch) {
        return angleMatch[1].toLowerCase().trim();
    }

    // Otherwise, check if it's already a plain email
    const emailMatch = fromString.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
        return emailMatch[0].toLowerCase().trim();
    }

    return null;
}

export async function GET() {
    console.log('🔄 [CRON] Checking for email replies via IMAP (all recent emails)...');
    const logs = [];

    try {
        // 1. Fetch ALL recent emails from IMAP (last 7 days, not just unread)
        let allEmails = [];
        try {
            allEmails = await getAllRecentEmails(7);
        } catch (imapError) {
            console.error('IMAP Connection Failed:', imapError);
            return NextResponse.json({
                success: false,
                error: 'IMAP Check Failed',
                details: imapError.message
            }, { status: 500 });
        }

        if (!allEmails || allEmails.length === 0) {
            console.log('📭 No emails found in the last 7 days.');
            return NextResponse.json({
                success: true,
                message: 'No emails found in inbox (last 7 days)',
                processed: 0,
                matched: 0,
                scanned: 0
            });
        }

        logs.push(`Found ${allEmails.length} emails from the last 7 days`);
        console.log(`📨 Scanning ${allEmails.length} emails for replies...`);

        // 2. Get all leads with their emails for matching
        const { data: allLeads, error: leadsError } = await supabase
            .from('leads')
            .select('id, name, email, status, in_sequence')
            .not('email', 'is', null);

        if (leadsError) {
            console.error('Error fetching leads:', leadsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch leads',
                details: leadsError.message
            }, { status: 500 });
        }

        // Create a map for fast email lookup
        const leadsByEmail = new Map();
        allLeads?.forEach(lead => {
            if (lead.email) {
                leadsByEmail.set(lead.email.toLowerCase().trim(), lead);
            }
        });

        logs.push(`Loaded ${leadsByEmail.size} leads with emails for matching`);

        // 3. Get already processed message IDs from activity feed to avoid duplicates
        const { data: processedReplies } = await supabase
            .from('activity_feed')
            .select('metadata')
            .eq('action_verb', 'detected reply')
            .eq('action_type', 'email');

        const processedMessageIds = new Set();
        processedReplies?.forEach(item => {
            if (item.metadata?.messageId) {
                processedMessageIds.add(item.metadata.messageId);
            }
        });

        logs.push(`Found ${processedMessageIds.size} already processed replies`);

        let processedCount = 0;
        let matchedCount = 0;
        let skippedCount = 0;

        // 4. Process each email
        for (const email of allEmails) {
            try {
                // Skip if we've already processed this message
                if (email.messageId && processedMessageIds.has(email.messageId)) {
                    skippedCount++;
                    continue;
                }

                // Extract clean email address
                const senderEmail = email.fromAddress || extractEmailAddress(email.from);
                if (!senderEmail) {
                    continue;
                }

                // Search for matching lead
                const lead = leadsByEmail.get(senderEmail);

                if (lead) {
                    // Skip if lead is already marked as Replied
                    if (lead.status === 'Replied') {
                        skippedCount++;
                        continue;
                    }

                    matchedCount++;
                    logs.push(`🎯 Matched lead: ${lead.name} (${lead.email}) - Subject: "${email.subject?.substring(0, 50)}"`);

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
                                messageId: email.messageId,
                                emailDate: email.date,
                                wasUnread: !email.isRead,
                                previously_in_sequence: lead.in_sequence
                            },
                            priority: 8,
                            first_occurred_at: new Date().toISOString()
                        });
                        logs.push(`Logged activity for ${lead.name}`);
                    } catch (actErr) {
                        console.error('Error logging activity:', actErr);
                    }

                    // A. Mark lead as Replied
                    await supabase
                        .from('leads')
                        .update({
                            status: 'Replied',
                            last_interaction: new Date().toISOString(),
                            in_sequence: false
                        })
                        .eq('id', lead.id);

                    logs.push(`Updated status to Replied for ${lead.name}`);

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

                    // C. Mark email as seen in IMAP (if not already)
                    if (!email.isRead) {
                        await markEmailAsSeen(email.uid);
                    }

                    processedCount++;
                }

            } catch (err) {
                console.error(`Error processing email ${email.uid}:`, err);
                logs.push(`Error processing email ${email.uid}: ${err.message}`);
            }
        }

        const message = matchedCount > 0
            ? `Found ${matchedCount} new reply(ies) and updated lead status`
            : 'No new replies from leads found';

        return NextResponse.json({
            success: true,
            message,
            scanned: allEmails.length,
            processed: processedCount,
            matched: matchedCount,
            skipped: skippedCount,
            logs
        });

    } catch (error) {
        console.error('❌ [CRON] Fatal error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
