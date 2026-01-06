/**
 * SendGrid Email Sender - Client-side wrapper for edge function
 * 
 * Drop-in replacement for nodemailer's sendEmail function.
 * Calls the sendgrid-send-email edge function.
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * @typedef {Object} SendEmailOptions
 * @property {string|string[]} to - Recipient email(s)
 * @property {string} subject - Email subject
 * @property {string} [html] - HTML content
 * @property {string} [text] - Plain text content
 * @property {string} [template_id] - SendGrid dynamic template ID
 * @property {Object} [template_data] - Data for template personalization
 * @property {Object} [from] - Sender info { email, name }
 * @property {string} [reply_to] - Reply-to email
 * @property {string} [lead_id] - CRM lead ID for tracking
 * @property {string} [campaign_id] - Campaign ID for tracking
 * @property {number} [sequence_step] - Sequence step number
 */

/**
 * Send an email through SendGrid via edge function
 * @param {SendEmailOptions} options 
 * @returns {Promise<{success: boolean, message_id?: string, error?: string}>}
 */
export async function sendEmail(options) {
    if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot send via SendGrid');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase.functions.invoke('sendgrid-send-email', {
            body: {
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                template_id: options.template_id,
                template_data: options.template_data,
                from: options.from,
                reply_to: options.reply_to,
                lead_id: options.lead_id,
                campaign_id: options.campaign_id,
                sequence_step: options.sequence_step,
            },
        });

        if (error) {
            console.error('Edge function error:', error);
            return { success: false, error: error.message };
        }

        if (!data.success) {
            return { success: false, error: data.error || 'Unknown error' };
        }

        return {
            success: true,
            message_id: data.message_id,
            email_send_id: data.email_send_id,
        };

    } catch (error) {
        console.error('SendGrid sender error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send email with personalization from lead data
 * Convenience wrapper that matches the old sendPersonalizedEmail signature
 * @param {Object} params
 * @param {string} params.leadId - Lead ID
 * @param {string} params.leadEmail - Recipient email
 * @param {Object} params.leadContext - Lead context data for personalization
 * @param {Object} [params.emailContentOverride] - Override content { subject, bodyPlainText }
 */
export async function sendPersonalizedEmail({ leadId, leadEmail, leadContext = {}, emailContentOverride = null }) {
    const subject = emailContentOverride?.subject || 'Message from KrissKross';
    const body = emailContentOverride?.bodyPlainText || '';

    return sendEmail({
        to: leadEmail,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        lead_id: leadId,
        template_data: leadContext,
    });
}

export default { sendEmail, sendPersonalizedEmail };
