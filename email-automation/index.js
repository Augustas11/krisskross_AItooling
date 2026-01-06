const { sendEmail: sendViaSMTP } = require('./services/email-sender');
const { generatePitchFromAPI } = require('./services/pitch-generator-client');
const { logEmailActivity } = require('./services/crm-logger');
const { checkForReplies } = require('./reply-checker');

// Try to load SendGrid sender (may fail if supabase not configured)
let sendViaSendGrid = null;
try {
    const sendgridModule = require('../lib/sendgrid-sender');
    sendViaSendGrid = sendgridModule.sendEmail;
} catch (e) {
    console.log('SendGrid sender not available, will use SMTP fallback');
}

/**
 * Send email with SendGrid as primary, SMTP as fallback
 */
async function sendEmail(options) {
    // Try SendGrid first (if available and configured)
    if (sendViaSendGrid && process.env.SENDGRID_API_KEY) {
        try {
            console.log('📧 Sending via SendGrid...');
            const result = await sendViaSendGrid({
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                lead_id: options.lead_id,
            });

            if (result.success) {
                return {
                    success: true,
                    messageId: result.message_id,
                    response: 'Sent via SendGrid'
                };
            }

            // SendGrid failed, fall through to SMTP
            console.warn('SendGrid send failed, falling back to SMTP:', result.error);
        } catch (error) {
            console.warn('SendGrid error, falling back to SMTP:', error.message);
        }
    }

    // Fallback to SMTP
    console.log('📧 Sending via SMTP...');
    return await sendViaSMTP(options);
}

/**
 * Main orchestrator for sending personalized emails
 */
async function sendPersonalizedEmail({ leadId, leadEmail, leadContext, emailContentOverride }) {
    console.log(`Starting email automation for lead: ${leadId} (${leadEmail})`);

    try {
        let pitchContent;

        // 1. Determine content: use override if provided, otherwise generate
        if (emailContentOverride && (emailContentOverride.bodyPlainText || emailContentOverride.html)) {
            console.log('Using provided email content override');
            pitchContent = {
                subject: emailContentOverride.subject || 'KrissKross Outreach',
                bodyPlainText: emailContentOverride.bodyPlainText,
                bodyHtml: emailContentOverride.bodyHtml || emailContentOverride.bodyPlainText.replace(/\n/g, '<br>')
            };
        } else {
            console.log('Generating new pitch content via API');
            pitchContent = await generatePitchFromAPI(leadContext);
        }

        // 2. Format email options
        const emailOptions = {
            to: leadEmail,
            subject: pitchContent.subject,
            text: pitchContent.bodyPlainText,
            html: pitchContent.bodyHtml,
            lead_id: leadId // For SendGrid tracking
        };

        // 3. Send email (SendGrid with SMTP fallback)
        const sendResult = await sendEmail(emailOptions);

        // 4. Log activity back to CRM
        await logEmailActivity(leadId, {
            sentAt: new Date().toISOString(),
            subject: pitchContent.subject,
            status: 'sent',
            messageId: sendResult.messageId
        });

        return {
            success: true,
            messageId: sendResult.messageId,
            sentAt: new Date().toISOString(),
            response: sendResult.response
        };
    } catch (error) {
        console.error('Personalized Email Automation Failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendPersonalizedEmail,
    sendEmail,
    checkForReplies
};
