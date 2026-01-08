/**
 * Test the fixed SendGrid integration
 * 
 * Usage: node scripts/test-sendgrid-fixed.js
 */
require('dotenv').config({ path: '.env.local' });

const { sendEmail } = require('../email-automation/index');

async function testSendGrid() {
    console.log('=== Testing Fixed SendGrid Integration ===\n');
    console.log('SENDGRID_API_KEY set:', !!process.env.SENDGRID_API_KEY);
    console.log('EMAIL_ADDRESS:', process.env.EMAIL_ADDRESS);
    console.log('');

    try {
        console.log('Sending test email via sendEmail()...');
        const result = await sendEmail({
            to: 'aug@krisskross.ai', // Test recipient
            subject: 'SendGrid Fix Test - ' + new Date().toISOString(),
            text: 'If you received this, the SendGrid fix is working!',
            html: '<h1>SendGrid Fix Test</h1><p>If you received this, the SendGrid fix is working!</p>'
        });

        console.log('\n=== Result ===');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ SUCCESS! Email sent via:', result.response);
            console.log('   Message ID:', result.messageId);
        } else {
            console.log('\n❌ FAILED:', result.error);
        }
    } catch (error) {
        console.error('\n❌ Exception:', error.message);
    }
}

testSendGrid();
