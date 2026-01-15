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

            // Parse error for user-friendly messaging
            let userFriendlyError = `SendGrid error (${response.status})`;
            try {
                const errorJson = JSON.parse(errorBody);
                const errorMessage = errorJson.errors?.[0]?.message || '';

                if (errorMessage.includes('Maximum credits exceeded')) {
                    userFriendlyError = '⚠️ SendGrid credits exhausted. Please add credits to your SendGrid account or wait for monthly reset.';
                } else if (errorMessage.includes('verified') || response.status === 403) {
                    userFriendlyError = '⚠️ Sender email not verified in SendGrid. Please verify hello@krisskross.ai in your SendGrid account.';
                } else if (response.status === 429) {
                    userFriendlyError = '⚠️ SendGrid rate limit reached. Please wait a few minutes before sending more emails.';
                } else if (response.status === 401) {
                    userFriendlyError = '⚠️ SendGrid API key invalid or expired. Please check your SENDGRID_API_KEY.';
                } else {
                    userFriendlyError = `SendGrid error: ${errorMessage || errorBody}`;
                }
            } catch (e) {
                userFriendlyError = `SendGrid error: ${errorBody}`;
            }

            return { success: false, error: userFriendlyError, isSendGridError: true };
        }
    } catch (error) {
        console.error('SendGrid fetch error:', error.message);
        return { success: false, error: `SendGrid connection failed: ${error.message}`, isSendGridError: true };
    }
}

/**
 * Send email with SendGrid as primary, SMTP as fallback
 */
async function sendEmail(options) {
    let sendGridError = null;

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

        // Store SendGrid error
        sendGridError = result.error;

        // For account/billing issues, don't fall back to SMTP - surface the error
        if (result.isSendGridError && (
            sendGridError.includes('credits exhausted') ||
            sendGridError.includes('API key invalid') ||
            sendGridError.includes('not verified')
        )) {
            console.error('SendGrid account issue - not falling back to SMTP:', sendGridError);
            throw new Error(sendGridError);
        }

        // For transient errors, try SMTP fallback
        console.warn('SendGrid send failed, falling back to SMTP:', sendGridError);
    }

    // Fallback to SMTP
    console.log('📧 Sending via SMTP...');
    try {
        return await sendViaSMTP(options);
    } catch (smtpError) {
        // If both fail, provide a comprehensive error message
        const combinedError = sendGridError
            ? `Email sending failed. SendGrid: ${sendGridError}. SMTP fallback: ${smtpError.message}`
            : `SMTP sending failed: ${smtpError.message}`;
        throw new Error(combinedError);
    }
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
