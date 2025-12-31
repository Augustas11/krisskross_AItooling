import nodemailer from 'nodemailer';
import { smtpConfig } from '../config/smtp-settings';

/**
 * Sends a personalized email using SMTP
 * @param {Object} options - Email options (to, subject, html, text)
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmail(options) {
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    try {
        await transporter.verify();
    } catch (error) {
        console.error('SMTP Connection Error:', error);
        throw new Error(`Failed to connect to SMTP server: ${error.message}`);
    }

    const mailOptions = {
        from: `"${process.env.EMAIL_NAME || 'KrissKross'}" <${smtpConfig.auth.user}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: smtpConfig.auth.user
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('Email Delivery Error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
}
