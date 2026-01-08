import { NextResponse } from 'next/server';
import { sendPersonalizedEmail } from '@/email-automation/index';
import { emitActivity } from '@/lib/activity-emitter';

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
            console.log(`📧 [DEBUG] Supabase configured: ${isSupabaseConfigured()}`);
            console.log(`📧 [DEBUG] leadId: ${leadId}, leadEmail: ${leadEmail}`);

            if (isSupabaseConfigured()) {
                // Insert email history
                const { data: historyData, error: historyError } = await supabase.from('email_history').insert([{
                    recipient_email: leadEmail,
                    subject: emailSubject,
                    body: emailBody,
                    lead_id: leadId !== 'manual' ? leadId : null,
                    status: 'sent'
                }]).select();

                if (historyError) {
                    console.error('❌ [DEBUG] email_history insert error:', historyError);
                } else {
                    console.log('✅ [DEBUG] email_history insert success:', historyData);
                }

                // Auto-enroll in cold outreach follow-up sequence (if not already enrolled)
                if (leadId && leadId !== 'manual') {
                    console.log(`📧 [DEBUG] Processing leadId=${leadId} (not manual)`);

                    const { enrollLeadInSequence, getDefaultColdOutreachSequenceId } = require('@/lib/email-sequences');

                    const sequenceId = await getDefaultColdOutreachSequenceId();
                    console.log(`📧 [DEBUG] Cold outreach sequence ID: ${sequenceId}`);

                    if (sequenceId) {
                        // Start at Step 2 because we just sent Step 1 manually
                        const enrollResult = await enrollLeadInSequence(leadId, sequenceId, 2);
                        if (enrollResult.success) {
                            console.log(`✅ Auto-enrolled lead ${leadId} in follow-up sequence`);
                        } else {
                            console.log(`ℹ️ Lead ${leadId} not enrolled: ${enrollResult.error}`);
                        }
                    }

                    // Create automated follow-up tasks
                    const { createFollowUpTasks } = require('@/app/api/tasks/route');
                    const { data: leadData, error: leadError } = await supabase
                        .from('leads')
                        .select('name')
                        .eq('id', leadId)
                        .single();

                    console.log(`📧 [DEBUG] Lead query result:`, { leadData, leadError });

                    if (leadData) {
                        await createFollowUpTasks(leadId, leadData.name);
                        console.log(`✅ Created follow-up tasks for ${leadData.name}`);

                        // Emit to Activity Feed
                        await emitActivity({
                            actorId: null, // TODO: Extract from auth context
                            actorName: 'User', // TODO: Get actual user name
                            actionVerb: 'sent',
                            actionType: 'email',
                            entityType: 'lead',
                            entityId: leadId,
                            entityName: leadData.name,
                            metadata: {
                                subject: emailSubject,
                                recipient: leadEmail
                            },
                            priority: 7
                        });
                        console.log('✅ [DEBUG] Activity emitted');
                    } else {
                        console.error(`❌ [DEBUG] Lead ${leadId} not found in database for activity/tasks!`);
                    }
                } else {
                    console.log(`📧 [DEBUG] Skipping sequence/activity - leadId is 'manual' or empty`);
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
