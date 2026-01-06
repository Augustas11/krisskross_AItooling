/**
 * SendGrid Integration Test Script
 * 
 * Usage: 
 * 1. First verify a sender in SendGrid dashboard
 * 2. Ensure SENDGRID_API_KEY is set in .env.local
 * 3. Run: node scripts/test-sendgrid.js
 */

require('dotenv').config({ path: '.env.local' });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not found in environment. Add it to .env.local');
    process.exit(1);
}

// ⚠️ UPDATE THIS with your verified sender email from SendGrid
const VERIFIED_SENDER = 'hello@krisskross.ai';

// Where to send the test email
const TEST_RECIPIENT = 'aug@krisskross.ai';

async function testSendGrid() {
    console.log('📧 Testing SendGrid Integration...\n');

    const payload = {
        personalizations: [{
            to: [{ email: TEST_RECIPIENT }]
        }],
        from: {
            email: VERIFIED_SENDER,
            name: 'KrissKross'
        },
        subject: '✅ SendGrid Integration Test - Success!',
        content: [
            {
                type: 'text/plain',
                value: 'If you received this email, your SendGrid integration is working perfectly!'
            },
            {
                type: 'text/html',
                value: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h1 style="color: #4F46E5;">🎉 SendGrid Integration Working!</h1>
                        <p>Congratulations! Your KrissKross CRM is now connected to SendGrid.</p>
                        <p><strong>What's next:</strong></p>
                        <ul>
                            <li>Deploy edge functions to Supabase</li>
                            <li>Configure webhook for tracking</li>
                            <li>Start sending campaigns!</li>
                        </ul>
                        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
                    </div>
                `
            }
        ],
        tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true }
        }
    };

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
            console.log('✅ SUCCESS! Email sent.');
            console.log(`   Message ID: ${messageId}`);
            console.log(`   From: ${VERIFIED_SENDER}`);
            console.log(`   To: ${TEST_RECIPIENT}`);
            console.log('\n🎉 Your SendGrid integration is working! Click "Verify Integration" in SendGrid.');
            return true;
        } else {
            const error = await response.json();
            console.error('❌ SendGrid Error:');
            console.error(JSON.stringify(error, null, 2));

            if (error.errors?.[0]?.message?.includes('verified Sender Identity')) {
                console.log('\n⚠️  You need to verify your sender email first:');
                console.log('   1. Go to: https://app.sendgrid.com/settings/sender_auth');
                console.log('   2. Click "Verify a Single Sender"');
                console.log(`   3. Add and verify: ${VERIFIED_SENDER}`);
                console.log('   4. Run this script again');
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        return false;
    }
}

testSendGrid();
