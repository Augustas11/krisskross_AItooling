import { NextResponse } from 'next/server';
import { sendPersonalizedEmail } from '@/email-automation/index';

export async function POST(req) {
    try {
        const body = await req.json();
        const { leadId, leadEmail, leadContext, emailBody, emailSubject } = body;

        if (!leadEmail || !leadId) {
            return NextResponse.json(
                { error: 'Missing required fields: leadId and leadEmail' },
                { status: 400 }
            );
        }

        const result = await sendPersonalizedEmail({
            leadId,
            leadEmail,
            leadContext: leadContext || {},
            emailContentOverride: emailBody ? {
                subject: emailSubject,
                bodyPlainText: emailBody
            } : null
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
