/**
 * Actual Email Sending Test via SMTP
 * 
 * Usage: node scripts/test-send-email-smtp.js
 */
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.titan.email',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_ADDRESS || 'hello@krisskross.ai',
        pass: process.env.EMAIL_PASSWORD
    }
};

const transporter = nodemailer.createTransport(smtpConfig);

async function sendTestEmail() {
    console.log('Testing SMTP email send...');
    console.log('From:', smtpConfig.auth.user);

    const mailOptions = {
        from: `"KrissKross Test" <${smtpConfig.auth.user}>`,
        to: 'aug@krisskross.ai', // Change to valid test address
        subject: 'Test Email from SMTP - ' + new Date().toISOString(),
        text: 'If you receive this email, SMTP sending is working correctly!',
        html: '<h1>SMTP Test</h1><p>If you receive this email, SMTP sending is working correctly!</p>'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
    } catch (error) {
        console.log('❌ Email sending failed:', error.message);
        console.log('   Full error:', error);
    }
}

sendTestEmail();
