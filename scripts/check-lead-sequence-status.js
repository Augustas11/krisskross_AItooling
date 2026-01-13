#!/usr/bin/env node
/**
 * QA Script: Check Lead Sequence Status
 * 
 * Usage: node scripts/check-lead-sequence-status.js "Kirundo"
 * 
 * This script queries all relevant tables to diagnose why sequence emails
 * might not be showing in a lead's Activity History.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadStatus(searchTerm) {
    console.log(`\n🔍 Searching for lead matching: "${searchTerm}"\n`);
    console.log('='.repeat(60));

    // 1. Find the lead
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, name, email, status, in_sequence, sequence_paused, created_at, last_interaction')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5);

    if (leadError) {
        console.error('❌ Error fetching leads:', leadError.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('❌ No leads found matching that search term.');
        return;
    }

    console.log(`\n📋 LEADS FOUND (${leads.length}):\n`);
    leads.forEach((lead, i) => {
        console.log(`  ${i + 1}. ${lead.name} (${lead.email || 'no email'})`);
        console.log(`     Status: ${lead.status} | In Sequence: ${lead.in_sequence ? '✅ YES' : '❌ NO'} | Paused: ${lead.sequence_paused ? '⏸️ YES' : '▶️ NO'}`);
        console.log(`     Created: ${new Date(lead.created_at).toLocaleDateString()} | Last Interaction: ${lead.last_interaction ? new Date(lead.last_interaction).toLocaleDateString() : 'N/A'}`);
        console.log('');
    });

    // Process each lead found
    for (const lead of leads) {
        console.log('='.repeat(60));
        console.log(`\n📊 DETAILED STATUS FOR: ${lead.name} (ID: ${lead.id})\n`);

        // 2. Check sequence enrollment
        console.log('📌 SEQUENCE ENROLLMENT:');
        const { data: enrollments, error: enrollError } = await supabase
            .from('email_sequence_enrollments')
            .select(`
                id,
                sequence_id,
                current_step,
                enrolled_at,
                last_email_sent_at,
                completed_at,
                unenrolled_at,
                unenroll_reason,
                email_sequences (name, emails)
            `)
            .eq('lead_id', lead.id);

        if (enrollError && enrollError.code !== '42P01') {
            console.log(`   ❌ Error: ${enrollError.message}`);
        } else if (!enrollments || enrollments.length === 0) {
            console.log('   ⚠️  No sequence enrollments found for this lead.');
            console.log('   → The lead may not have been enrolled in an email sequence.');
        } else {
            enrollments.forEach(e => {
                const seq = e.email_sequences;
                const totalSteps = seq?.emails?.length || 0;
                console.log(`   Sequence: ${seq?.name || 'Unknown'}`);
                console.log(`   Current Step: ${e.current_step} of ${totalSteps}`);
                console.log(`   Enrolled: ${new Date(e.enrolled_at).toLocaleString()}`);
                console.log(`   Last Email Sent: ${e.last_email_sent_at ? new Date(e.last_email_sent_at).toLocaleString() : 'Never'}`);
                console.log(`   Completed: ${e.completed_at ? new Date(e.completed_at).toLocaleString() : 'Not yet'}`);
                console.log(`   Unenrolled: ${e.unenrolled_at ? `${new Date(e.unenrolled_at).toLocaleString()} (${e.unenroll_reason})` : 'No'}`);
            });
        }

        // 3. Check email history
        console.log('\n📧 EMAIL HISTORY:');
        const { data: emails, error: emailError } = await supabase
            .from('email_history')
            .select('id, subject, recipient_email, status, sequence_step, sent_at')
            .eq('lead_id', lead.id)
            .order('sent_at', { ascending: false })
            .limit(10);

        if (emailError && emailError.code !== '42P01') {
            console.log(`   ❌ Error: ${emailError.message}`);
        } else if (!emails || emails.length === 0) {
            console.log('   ⚠️  No emails found in email_history for this lead.');
            console.log('   → This means NO emails (manual or sequence) were logged to this lead.');
        } else {
            console.log(`   Found ${emails.length} email(s):\n`);
            emails.forEach((email, i) => {
                const stepLabel = email.sequence_step ? `[Step ${email.sequence_step}]` : '[Manual]';
                console.log(`   ${i + 1}. ${stepLabel} "${email.subject}"`);
                console.log(`      To: ${email.recipient_email} | Status: ${email.status} | Sent: ${new Date(email.sent_at).toLocaleString()}`);
            });
        }

        // 4. Check activity feed
        console.log('\n📰 ACTIVITY FEED:');
        const { data: activities, error: actError } = await supabase
            .from('activity_feed')
            .select('id, action_type, action_verb, metadata, first_occurred_at')
            .eq('entity_id', lead.id)
            .order('first_occurred_at', { ascending: false })
            .limit(10);

        if (actError && actError.code !== '42P01') {
            console.log(`   ❌ Error: ${actError.message}`);
        } else if (!activities || activities.length === 0) {
            console.log('   ⚠️  No entries in activity_feed for this lead.');
        } else {
            console.log(`   Found ${activities.length} activity entries:\n`);
            activities.forEach((a, i) => {
                console.log(`   ${i + 1}. ${a.action_type}: ${a.action_verb} (${new Date(a.first_occurred_at).toLocaleString()})`);
            });
        }

        // 5. Check pitch history
        console.log('\n🎯 PITCH HISTORY:');
        const { data: pitches, error: pitchError } = await supabase
            .from('pitch_history')
            .select('id, lead_name, subject, sent_at, created_at')
            .or(`lead_id.eq.${lead.id},lead_name.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(5);

        if (pitchError && pitchError.code !== '42P01') {
            console.log(`   ❌ Error: ${pitchError.message}`);
        } else if (!pitches || pitches.length === 0) {
            console.log('   ⚠️  No pitches found for this lead.');
        } else {
            console.log(`   Found ${pitches.length} pitch(es):\n`);
            pitches.forEach((p, i) => {
                console.log(`   ${i + 1}. "${p.subject}" to ${p.lead_name}`);
                console.log(`      Created: ${new Date(p.created_at).toLocaleString()} | Sent: ${p.sent_at ? new Date(p.sent_at).toLocaleString() : 'Not sent'}`);
            });
        }

        console.log('\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('\n📋 DIAGNOSIS SUMMARY:\n');
    console.log('If emails are NOT in email_history:');
    console.log('  → Emails were never sent (cron not running, lead not enrolled, etc.)');
    console.log('\nIf emails ARE in email_history but NOT in Activity History UI:');
    console.log('  → This is a UI/API bug - the activity endpoint may not be fetching correctly.');
    console.log('\nNext Steps:');
    console.log('  1. Check if lead.in_sequence = true');
    console.log('  2. Check email_sequence_enrollments for active enrollment');
    console.log('  3. Verify cron job /api/sequences/process is running (check Vercel logs)');
    console.log('');
}

// Run with search term from command line
const searchTerm = process.argv[2] || 'Kirundo';
checkLeadStatus(searchTerm);
