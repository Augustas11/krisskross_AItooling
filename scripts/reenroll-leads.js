#!/usr/bin/env node
/**
 * Re-enroll Leads Script
 * 
 * Re-enrolls specific leads or all affected leads back into email sequences.
 * 
 * Usage: 
 *   node scripts/reenroll-leads.js                    # Re-enroll all affected leads
 *   node scripts/reenroll-leads.js "Kirundo"          # Re-enroll specific lead by name
 *   node scripts/reenroll-leads.js --lead-id "xyz"    # Re-enroll by lead ID
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDefaultSequenceId() {
    const { data, error } = await supabase
        .from('email_sequences')
        .select('id')
        .eq('sequence_type', 'cold_outreach')
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error getting sequence:', error.message);
        return null;
    }
    return data?.id;
}

async function reenrollLead(leadId, leadName, sequenceId) {
    console.log(`\n🔄 Re-enrolling: ${leadName} (${leadId})`);

    // 1. Check current status
    const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('status, in_sequence, email')
        .eq('id', leadId)
        .single();

    if (leadErr || !lead) {
        console.log(`   ❌ Lead not found`);
        return false;
    }

    if (lead.in_sequence) {
        console.log(`   ⚠️  Already in sequence, skipping`);
        return false;
    }

    if (lead.status === 'Replied' || lead.status === 'Dead' || lead.status === 'Not Interested') {
        console.log(`   ⚠️  Lead status is "${lead.status}", skipping`);
        return false;
    }

    // 2. Clear old enrollment
    const { error: clearErr } = await supabase
        .from('email_sequence_enrollments')
        .update({
            unenrolled_at: new Date().toISOString(),
            unenroll_reason: 'manual_reset'
        })
        .eq('lead_id', leadId)
        .is('unenrolled_at', null)
        .is('completed_at', null);

    if (clearErr) {
        console.log(`   ⚠️  Could not clear old enrollment: ${clearErr.message}`);
    }

    // 3. Create new enrollment starting at step 2 (since initial pitch was sent)
    const now = new Date().toISOString();
    const { error: enrollErr } = await supabase
        .from('email_sequence_enrollments')
        .insert({
            lead_id: leadId,
            sequence_id: sequenceId,
            current_step: 2,
            enrolled_at: now,
            last_email_sent_at: now  // Key fix: set this to now so delays work correctly
        });

    if (enrollErr) {
        console.log(`   ❌ Enrollment failed: ${enrollErr.message}`);
        return false;
    }

    // 4. Update lead
    const { error: updateErr } = await supabase
        .from('leads')
        .update({ in_sequence: true })
        .eq('id', leadId);

    if (updateErr) {
        console.log(`   ⚠️  Could not update lead: ${updateErr.message}`);
    }

    console.log(`   ✅ Re-enrolled successfully at step 2`);
    return true;
}

async function main() {
    console.log('\n🚀 Lead Re-enrollment Tool\n');
    console.log('='.repeat(50));

    const args = process.argv.slice(2);
    const sequenceId = await getDefaultSequenceId();

    if (!sequenceId) {
        console.error('❌ Could not find active cold_outreach sequence');
        process.exit(1);
    }

    console.log(`📧 Using sequence ID: ${sequenceId}`);

    let leadsToReenroll = [];

    // Parse arguments
    if (args.includes('--lead-id')) {
        const idx = args.indexOf('--lead-id');
        const leadId = args[idx + 1];
        const { data: lead } = await supabase
            .from('leads')
            .select('id, name')
            .eq('id', leadId)
            .single();
        if (lead) {
            leadsToReenroll.push(lead);
        }
    } else if (args.length > 0 && !args[0].startsWith('--')) {
        // Search by name
        const searchTerm = args[0];
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name')
            .ilike('name', `%${searchTerm}%`);
        if (leads) {
            leadsToReenroll = leads;
        }
    } else {
        // Find all auto-unenrolled leads that should be re-enrolled
        console.log('\n🔍 Finding affected leads...');

        const { data: enrollments } = await supabase
            .from('email_sequence_enrollments')
            .select('lead_id')
            .eq('unenroll_reason', 'auto_unenroll')
            .not('unenrolled_at', 'is', null);

        if (enrollments) {
            for (const e of enrollments) {
                const { data: lead } = await supabase
                    .from('leads')
                    .select('id, name, status, has_replied, in_sequence')
                    .eq('id', e.lead_id)
                    .single();

                if (lead &&
                    lead.status !== 'Replied' &&
                    !lead.has_replied &&
                    !lead.in_sequence &&
                    lead.status !== 'Dead' &&
                    lead.status !== 'Not Interested') {
                    leadsToReenroll.push(lead);
                }
            }
        }
    }

    if (leadsToReenroll.length === 0) {
        console.log('\n✅ No leads to re-enroll');
        return;
    }

    console.log(`\n📋 Found ${leadsToReenroll.length} lead(s) to re-enroll:`);
    leadsToReenroll.forEach(l => console.log(`   - ${l.name}`));

    // Re-enroll each lead
    let successCount = 0;
    for (const lead of leadsToReenroll) {
        const success = await reenrollLead(lead.id, lead.name, sequenceId);
        if (success) successCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Re-enrolled ${successCount}/${leadsToReenroll.length} leads`);
    console.log('\n💡 The sequence processor will send follow-ups based on configured delays.');
}

main();
