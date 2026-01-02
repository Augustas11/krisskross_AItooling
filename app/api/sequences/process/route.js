import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { shouldSendNextEmail, replaceMergeTags, unenrollLeadFromSequence } from '@/lib/email-sequences';
import { sendEmail } from '@/email-automation/services/email-sender';

/**
 * GET /api/sequences/process
 * Cron job to process email sequences and send scheduled emails
 * 
 * This endpoint should be called daily (e.g., via Vercel Cron at 9am)
 */
export async function GET(req) {
    console.log('🔄 [CRON] Processing email sequences...');

    if (!isSupabaseConfigured()) {
        return NextResponse.json(
            { error: 'Supabase not configured' },
            { status: 500 }
        );
    }

    const results = {
        processed: 0,
        sent: 0,
        skipped: 0,
        completed: 0,
        unenrolled: 0,
        errors: []
    };

    try {
        // Find all active enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('email_sequence_enrollments')
            .select(`
                id,
                lead_id,
                sequence_id,
                current_step,
                enrolled_at,
                last_email_sent_at,
                email_sequences (
                    id,
                    name,
                    emails
                )
            `)
            .is('completed_at', null)
            .is('unenrolled_at', null);

        if (enrollmentsError) throw enrollmentsError;

        console.log(`📊 Found ${enrollments?.length || 0} active enrollments`);

        if (!enrollments || enrollments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active enrollments to process',
                results
            });
        }

        // Process each enrollment
        for (const enrollment of enrollments) {
            results.processed++;

            try {
                const sequence = enrollment.email_sequences;
                const emails = sequence.emails;
                const currentStep = enrollment.current_step;

                // Check if there are more emails to send
                if (currentStep > emails.length) {
                    // Sequence completed
                    await supabase
                        .from('email_sequence_enrollments')
                        .update({ completed_at: new Date().toISOString() })
                        .eq('id', enrollment.id);

                    await supabase
                        .from('leads')
                        .update({ in_sequence: false })
                        .eq('id', enrollment.lead_id);

                    results.completed++;
                    console.log(`✅ Completed sequence for lead ${enrollment.lead_id}`);
                    continue;
                }

                // Get current email template
                const currentEmail = emails.find(e => e.step === currentStep);
                if (!currentEmail) {
                    console.warn(`⚠️ No email found for step ${currentStep} in sequence ${sequence.id}`);
                    results.skipped++;
                    continue;
                }

                // Calculate if email is due
                const delayDays = currentEmail.delay_days || 0;
                const baseDate = enrollment.last_email_sent_at || enrollment.enrolled_at;
                const dueDate = new Date(baseDate);
                dueDate.setDate(dueDate.getDate() + delayDays);

                const now = new Date();
                const isDue = now >= dueDate;

                if (!isDue) {
                    console.log(`⏳ Email not due yet for lead ${enrollment.lead_id} (due: ${dueDate.toISOString()})`);
                    results.skipped++;
                    continue;
                }

                // Check if should send (reply detection, paused, etc.)
                const shouldSend = await shouldSendNextEmail(enrollment.lead_id);
                if (!shouldSend) {
                    // Unenroll lead (they replied or are paused/dead)
                    await unenrollLeadFromSequence(enrollment.lead_id, 'auto_unenroll');
                    results.unenrolled++;
                    console.log(`🚫 Unenrolled lead ${enrollment.lead_id} (replied or inactive)`);
                    continue;
                }

                // Fetch lead data for merge tags
                const { data: lead, error: leadError } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('id', enrollment.lead_id)
                    .single();

                if (leadError || !lead) {
                    console.error(`❌ Lead ${enrollment.lead_id} not found`);
                    results.errors.push({ leadId: enrollment.lead_id, error: 'Lead not found' });
                    continue;
                }

                if (!lead.email) {
                    console.warn(`⚠️ Lead ${enrollment.lead_id} has no email address`);
                    results.skipped++;
                    continue;
                }

                // Replace merge tags
                const subject = replaceMergeTags(currentEmail.subject, lead);
                const body = replaceMergeTags(currentEmail.body, lead);

                // Send email
                console.log(`📧 Sending email ${currentStep} to ${lead.email} (${lead.name})`);

                const emailResult = await sendEmail({
                    to: lead.email,
                    subject: subject,
                    text: body,
                    html: body.replace(/\n/g, '<br>')
                });

                // Log to email history
                await supabase.from('email_history').insert([{
                    recipient_email: lead.email,
                    subject: subject,
                    body: body,
                    lead_id: lead.id,
                    status: 'sent',
                    sequence_step: currentStep
                }]);

                // Update enrollment
                const nextStep = currentStep + 1;
                const updateData = {
                    current_step: nextStep,
                    last_email_sent_at: new Date().toISOString()
                };

                // If this was the last email, mark as completed
                if (nextStep > emails.length) {
                    updateData.completed_at = new Date().toISOString();
                }

                await supabase
                    .from('email_sequence_enrollments')
                    .update(updateData)
                    .eq('id', enrollment.id);

                // Update lead status if not already emailed
                if (lead.status === 'New' || lead.status === 'Pitched') {
                    await supabase
                        .from('leads')
                        .update({
                            status: 'Emailed',
                            last_interaction: new Date().toISOString()
                        })
                        .eq('id', lead.id);
                }

                results.sent++;
                console.log(`✅ Sent email ${currentStep}/${emails.length} to ${lead.name}`);

            } catch (error) {
                console.error(`❌ Error processing enrollment ${enrollment.id}:`, error);
                results.errors.push({
                    enrollmentId: enrollment.id,
                    leadId: enrollment.lead_id,
                    error: error.message
                });
            }
        }

        console.log('📊 Sequence processing complete:', results);

        return NextResponse.json({
            success: true,
            message: `Processed ${results.processed} enrollments, sent ${results.sent} emails`,
            results
        });

    } catch (error) {
        console.error('❌ [CRON] Error processing sequences:', error);
        return NextResponse.json(
            { error: error.message, results },
            { status: 500 }
        );
    }
}
