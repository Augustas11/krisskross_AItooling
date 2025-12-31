const { getUnreadReplies, markEmailAsSeen } = require('./services/imap-client');
const { findLeadByEmail, updateLeadStatus, logEmailActivity } = require('./services/crm-logger');

/**
 * Main function to check for replies and update CRM
 */
async function checkForReplies() {
    console.log('🤖 Starting Email Reply Check...');

    try {
        // 1. Get unread emails from Inbox
        const unreadEmails = await getUnreadReplies();

        if (unreadEmails.length === 0) {
            console.log('📭 No new unread replies.');
            return;
        }

        console.log(`📨 Processing ${unreadEmails.length} unread emails...`);

        // 2. Process each email
        for (const email of unreadEmails) {
            try {
                // A. Check if sender exists in CRM
                const lead = await findLeadByEmail(email.from);

                if (lead) {
                    // Match found!
                    console.log(`🎯 Match found for lead: ${lead.name} (${email.from})`);

                    // B. Update Status to "Replied"
                    // Only update if not already replied or closed (optional logic)
                    if (lead.status !== 'Replied') {
                        await updateLeadStatus(lead.id, 'Replied');
                    }

                    // C. Log Activity
                    await logEmailActivity(lead.id, {
                        type: 'reply_received',
                        subject: email.subject,
                        snippet: email.preview,
                        receivedAt: new Date().toISOString(),
                        messageId: email.messageId
                    });

                    // D. Mark as Seen (processed)
                    await markEmailAsSeen(email.uid);

                } else {
                    console.log(`👻 Source email ${email.from} not found in CRM. Skipping.`);
                    // Optional: Mark non-lead emails as seen too? 
                    // For now, leave them unseen so humans can handle them.
                }

            } catch (err) {
                console.error(`❌ Error processing email from ${email.from}:`, err);
            }
        }

    } catch (error) {
        console.error('❌ Critical Error in Reply Checker:', error);
    }

    console.log('🏁 Reply Check Complete.');
}

// Allow running this file directly
if (require.main === module) {
    // Load env vars if running directly
    require('dotenv').config({ path: '.env.local' });
    checkForReplies();
}

module.exports = { checkForReplies };
