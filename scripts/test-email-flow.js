/**
 * Full Email Sending Test
 * 
 * Tests the exact same flow as the /api/email/send route
 * Usage: node scripts/test-email-flow.js
 */
require('dotenv').config({ path: '.env.local' });

console.log('=== Email Flow Test ===\n');

// Step 1: Test SendGrid module loading
console.log('1. Testing SendGrid module loading...');
let sendViaSendGrid = null;
try {
    const sendgridModule = require('../lib/sendgrid-sender');
    sendViaSendGrid = sendgridModule.sendEmail;
    console.log('   ✅ SendGrid sender loaded successfully');
} catch (e) {
    console.log('   ❌ SendGrid sender FAILED:', e.message);
    console.log('   → Will fall back to SMTP\n');
}

// Step 2: Test SMTP
console.log('2. Testing SMTP connection...');
const { sendEmail: sendViaSMTP } = require('../email-automation/services/email-sender');
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

async function runTest() {
    try {
        await transporter.verify();
        console.log('   ✅ SMTP connection successful\n');
    } catch (err) {
        console.log('   ❌ SMTP connection FAILED:', err.message);
        return;
    }

    // Step 3: Try the actual sendPersonalizedEmail function
    console.log('3. Testing sendPersonalizedEmail (dry run)...');
    try {
        const { sendPersonalizedEmail } = require('../email-automation/index');
        console.log('   ✅ email-automation/index.js loaded successfully');
        console.log('   → sendPersonalizedEmail function available:', typeof sendPersonalizedEmail);
    } catch (e) {
        console.log('   ❌ Failed to load email-automation:', e.message);
    }

    console.log('\n=== Summary ===');
    console.log('SendGrid available:', !!sendViaSendGrid);
    console.log('SMTP available: true (verified above)');
    console.log('SENDGRID_API_KEY set:', !!process.env.SENDGRID_API_KEY);
    console.log('EMAIL_PASSWORD set:', !!process.env.EMAIL_PASSWORD);

    if (!sendViaSendGrid && process.env.SENDGRID_API_KEY) {
        console.log('\n⚠️  ISSUE FOUND: SENDGRID_API_KEY is set but SendGrid module cannot load!');
        console.log('   This is likely an ES module vs CommonJS compatibility issue.');
        console.log('   The email should fall back to SMTP, but check if SMTP credentials are correct.');
    }
}

runTest();
