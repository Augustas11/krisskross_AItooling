
import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_ADDRESS || 'hello@krisskross.ai';

    // Mask key for safety
    const maskedKey = apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'MISSING';

    console.log(`🔍 [DEBUG] Testing SendGrid Config`);
    console.log(`🔑 API Key: ${maskedKey}`);
    console.log(`📧 From: ${fromEmail}`);

    if (!apiKey) {
        return NextResponse.json({ error: 'SENDGRID_API_KEY is missing in environment' }, { status: 500 });
    }

    try {
        const payload = {
            personalizations: [{
                to: [{ email: 'hello@krisskross.ai' }] // Send to hello@krisskross.ai as requested
            }],
            from: {
                email: fromEmail,
                name: 'KrissKross Debugger'
            },
            subject: 'KrissKross SendGrid Configuration Test',
            content: [{ type: 'text/plain', value: 'This is a test email to verify SendGrid configuration on Vercel.' }]
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const messageId = response.headers.get('X-Message-Id');
            return NextResponse.json({
                success: true,
                message: 'Email sent successfully via SendGrid API',
                messageId
            });
        } else {
            const errorBody = await response.text();
            console.error('❌ SendGrid Error:', errorBody);
            return NextResponse.json({
                success: false,
                status: response.status,
                error: errorBody
            }, { status: response.status });
        }

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
