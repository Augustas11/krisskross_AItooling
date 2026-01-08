/**
 * SMTP Connection Test Script
 * 
 * Usage: node scripts/test-smtp-connection.js
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

console.log('Testing SMTP connection...');
console.log('Host:', smtpConfig.host);
console.log('Port:', smtpConfig.port);
console.log('Secure:', smtpConfig.secure);
console.log('User:', smtpConfig.auth.user);
console.log('Password set:', smtpConfig.auth.pass ? 'Yes (' + smtpConfig.auth.pass.length + ' chars)' : 'NO - THIS IS THE PROBLEM');

const transporter = nodemailer.createTransport(smtpConfig);

transporter.verify()
    .then(() => {
        console.log('✅ SMTP connection successful!');
        process.exit(0);
    })
    .catch(err => {
        console.log('❌ SMTP connection failed:', err.message);
        process.exit(1);
    });
