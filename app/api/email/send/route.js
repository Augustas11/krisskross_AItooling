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


        // Log to history
        try {
            const { supabase, isSupabaseConfigured } = require('@/lib/supabase');
            if (isSupabaseConfigured()) {
                await supabase.from('email_history').insert([{
                    recipient_email: leadEmail,
                    subject: emailSubject,
                    body: emailBody,
                    lead_id: leadId !== 'manual' ? leadId : null,
                    status: 'sent'
                }]);
            }
        } catch (e) {
            console.error('Email history save failed:', e);
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
