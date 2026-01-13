#!/usr/bin/env node
/**
 * Quick fix: Re-enroll all leads with missing last_email_sent_at
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reenrollAll() {
    const sequenceId = 1;
    const now = new Date().toISOString();

    // Get all enrollments with null last_email_sent_at that are at step > 1
    const { data: badEnrollments } = await supabase
        .from('email_sequence_enrollments')
        .select('id, lead_id')
        .gt('current_step', 1)
        .is('last_email_sent_at', null);

    if (!badEnrollments || badEnrollments.length === 0) {
        console.log('No enrollments to fix');
        return;
    }

    console.log(`Found ${badEnrollments.length} enrollments to fix:`);

    for (const e of badEnrollments) {
        // Get lead info
        const { data: lead } = await supabase
            .from('leads')
            .select('name, status')
            .eq('id', e.lead_id)
            .single();

        if (!lead) {
            console.log(`Skipping ${e.lead_id} - lead not found`);
            continue;
        }

        if (lead.status === 'Replied' || lead.status === 'Dead') {
            console.log(`Skipping ${lead.name} - status is ${lead.status}`);
            continue;
        }

        // Mark old enrollment as reset
        await supabase
            .from('email_sequence_enrollments')
            .update({
                unenrolled_at: now,
                unenroll_reason: 'bug_fix_reset'
            })
            .eq('id', e.id);

        // Create new enrollment with last_email_sent_at set
        const { error } = await supabase
            .from('email_sequence_enrollments')
            .insert({
                lead_id: e.lead_id,
                sequence_id: sequenceId,
                current_step: 2,
                enrolled_at: now,
                last_email_sent_at: now
            });

        // Update lead
        await supabase
            .from('leads')
            .update({ in_sequence: true })
            .eq('id', e.lead_id);

        if (error) {
            console.log(`Error for ${lead.name}: ${error.message}`);
        } else {
            console.log(`✅ Re-enrolled: ${lead.name}`);
        }
    }

    console.log('\nDone!');
}

reenrollAll();
