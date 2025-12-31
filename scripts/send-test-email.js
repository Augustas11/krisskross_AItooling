require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.krisskross.ai',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_ADDRESS || 'hello@krisskross.ai',
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
};

async function sendTestEmail() {
    try {
        console.log('📧 Sending test email to hello@krisskross.ai...');
        const transporter = nodemailer.createTransport(smtpConfig);

        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_NAME || 'KrissKross'}" <${smtpConfig.auth.user}>`,
            to: 'hello@krisskross.ai',
            subject: 'Test Email for Reply Verification ' + Date.now(),
            html: '<p>This is a test email to verify the reply detection system. Please reply to this email.</p>',
            text: 'This is a test email to verify the reply detection system. Please reply to this email.'
        });

        console.log('✅ Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending test email:', error);
    }
}

sendTestEmail();
