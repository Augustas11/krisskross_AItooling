#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigate() {
    console.log('🔍 INVESTIGATING: Why leads have in_sequence=false but active enrollment\n');

    // Get the active enrollments
    const { data: activeEnrollments } = await supabase
        .from('email_sequence_enrollments')
        .select('lead_id, current_step, enrolled_at, last_email_sent_at, unenrolled_at, unenroll_reason')
        .is('completed_at', null)
        .is('unenrolled_at', null);

    console.log('Total active enrollments:', activeEnrollments?.length || 0);

    // Get leads for those enrollments
    const leadIds = activeEnrollments?.map(e => e.lead_id) || [];

    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, in_sequence, status')
        .in('id', leadIds);

    // Find mismatches - leads with active enrollment but in_sequence=false
    const mismatchedLeads = [];
    for (const lead of leads || []) {
        if (!lead.in_sequence) {
            mismatchedLeads.push(lead);
        }
    }

    console.log('Leads with in_sequence=false but active enrollment:', mismatchedLeads.length);
    console.log('\n📋 MISMATCH DETAILS:\n');

    for (let i = 0; i < Math.min(5, mismatchedLeads.length); i++) {
        const lead = mismatchedLeads[i];
        const enrollment = activeEnrollments.find(e => e.lead_id === lead.id);
        console.log('Lead:', lead.name);
        console.log('  Status:', lead.status);
        console.log('  in_sequence:', lead.in_sequence);
        console.log('  Enrollment step:', enrollment?.current_step);
        console.log('  Enrolled at:', enrollment?.enrolled_at);
        console.log('  Last email sent:', enrollment?.last_email_sent_at || 'NEVER');
        console.log('');
    }

    // Check how many have status=Replied
    let repliedCount = 0;
    let otherStatusLeads = [];
    for (const lead of mismatchedLeads) {
        if (lead.status === 'Replied') {
            repliedCount++;
        } else {
            otherStatusLeads.push(lead);
        }
    }

    console.log('\n📊 Of the', mismatchedLeads.length, 'mismatched leads:');
    console.log('   -', repliedCount, 'have status=Replied (makes sense - reply detection set in_sequence=false)');
    console.log('   -', otherStatusLeads.length, 'have other status (unexpected)');

    if (otherStatusLeads.length > 0) {
        console.log('\n⚠️ LEADS WITH OTHER STATUS (these are the real problem):');
        for (const l of otherStatusLeads) {
            console.log('   -', l.name + ':', l.status);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 ROOT CAUSE ANALYSIS:\n');
    console.log('The reply detection code sets in_sequence=false when a reply is detected,');
    console.log('but it doesn\'t always properly unenroll from email_sequence_enrollments.');
    console.log('');
    console.log('This creates a data mismatch where:');
    console.log('  - leads.in_sequence = false (correct, they replied)');
    console.log('  - email_sequence_enrollments still shows active (incorrect)');
    console.log('');
    console.log('The fix-all-enrollments.js script would:');
    console.log('  1. Find these mismatched records');
    console.log('  2. Mark the enrollment as unenrolled_at = now()');
    console.log('  3. Set unenroll_reason = "sync_fix"');
    console.log('');

    if (repliedCount === mismatchedLeads.length) {
        console.log('✅ GOOD NEWS: All', mismatchedLeads.length, 'mismatched leads have status=Replied');
        console.log('   This is expected behavior - the enrollments just need cleanup.');
        console.log('   The sequence processor will skip them anyway.');
    }
}

investigate().catch(console.error);
