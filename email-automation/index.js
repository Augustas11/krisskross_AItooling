const { sendEmail: sendViaSMTP } = require('./services/email-sender');
const { generatePitchFromAPI } = require('./services/pitch-generator-client');
const { logEmailActivity } = require('./services/crm-logger');
const { checkForReplies } = require('./reply-checker');

/**
 * Send email directly via SendGrid API (CommonJS compatible)
 * This replaces the ES module sendgrid-sender.js that couldn't be require()'d
 */
async function sendViaSendGridDirect(options) {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.EMAIL_ADDRESS || 'hello@krisskross.ai';
    const FROM_NAME = process.env.EMAIL_NAME || 'KrissKross';

    if (!SENDGRID_API_KEY) {
        return { success: false, error: 'SENDGRID_API_KEY not configured' };
    }

    const payload = {
        personalizations: [{
            to: [{ email: options.to }]
        }],
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME
        },
        subject: options.subject,
        content: [],
        tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true }
        }
    };

    // Add content
    if (options.text) {
        payload.content.push({ type: 'text/plain', value: options.text });
    }
    if (options.html) {
        payload.content.push({ type: 'text/html', value: options.html });
    }
    if (payload.content.length === 0) {
        payload.content.push({ type: 'text/plain', value: options.subject });
    }

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const messageId = response.headers.get('X-Message-Id');
            console.log(`✅ SendGrid: Email sent, message ID: ${messageId}`);
            return {
                success: true,
                message_id: messageId,
                response: 'Sent via SendGrid'
            };
        } else {
            const errorBody = await response.text();
            console.error('SendGrid API error:', response.status, errorBody);
            return { success: false, error: `SendGrid ${response.status}: ${errorBody}` };
        }
    } catch (error) {
        console.error('SendGrid fetch error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send email with SendGrid as primary, SMTP as fallback
 */
async function sendEmail(options) {
    // Try SendGrid first (if API key is configured)
    if (process.env.SENDGRID_API_KEY) {
        console.log('📧 Sending via SendGrid...');
        const result = await sendViaSendGridDirect(options);

        if (result.success) {
            return {
                success: true,
                messageId: result.message_id,
                response: 'Sent via SendGrid'
            };
        }

        // SendGrid failed, fall through to SMTP
        console.warn('SendGrid send failed, falling back to SMTP:', result.error);
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
