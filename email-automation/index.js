import { sendEmail } from './services/email-sender';
import { generatePitchFromAPI } from './services/pitch-generator-client';
import { logEmailActivity } from './services/crm-logger';
import { checkForReplies } from './reply-checker';

/**
 * Main orchestrator for sending personalized emails
 */
export async function sendPersonalizedEmail({ leadId, leadEmail, leadContext, emailContentOverride }) {
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
            html: pitchContent.bodyHtml
        };

        // 3. Send email via SMTP
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

export { checkForReplies };
