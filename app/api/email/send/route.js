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

                // Auto-enroll in cold outreach follow-up sequence (if not already enrolled)
                if (leadId && leadId !== 'manual') {
                    const { enrollLeadInSequence, getDefaultColdOutreachSequenceId } = require('@/lib/email-sequences');

                    const sequenceId = await getDefaultColdOutreachSequenceId();
                    if (sequenceId) {
                        const enrollResult = await enrollLeadInSequence(leadId, sequenceId);
                        if (enrollResult.success) {
                            console.log(`✅ Auto-enrolled lead ${leadId} in follow-up sequence`);
                        } else {
                            console.log(`ℹ️ Lead ${leadId} not enrolled: ${enrollResult.error}`);
                        }
                    }

                    // Create automated follow-up tasks
                    const { createFollowUpTasks } = require('@/app/api/tasks/route');
                    const { data: leadData } = await supabase
                        .from('leads')
                        .select('name')
                        .eq('id', leadId)
                        .single();

                    if (leadData) {
                        await createFollowUpTasks(leadId, leadData.name);
                        console.log(`✅ Created follow-up tasks for ${leadData.name}`);
                    }
                }
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
