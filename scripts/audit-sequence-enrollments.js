#!/usr/bin/env node
/**
 * Audit Script: Find Leads Affected by Sequence Enrollment Bug
 * 
 * This script identifies leads that:
 * 1. Were enrolled in a sequence but have last_email_sent_at = null
 * 2. Were auto-unenrolled despite not having replied
 * 3. Have email history but no sequence emails sent
 * 
 * Usage: node scripts/audit-sequence-enrollments.js
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

async function auditEnrollments() {
    console.log('\n🔍 AUDIT: Email Sequence Enrollments\n');
    console.log('='.repeat(70));

    const issues = [];

    // 1. Find enrollments with null last_email_sent_at but current_step > 1
    console.log('\n📋 Check 1: Enrollments with missing last_email_sent_at (step > 1)...');
    const { data: nullLastEmail, error: err1 } = await supabase
        .from('email_sequence_enrollments')
        .select(`
            id,
            lead_id,
            current_step,
            enrolled_at,
            last_email_sent_at,
            unenrolled_at,
            unenroll_reason
        `)
        .gt('current_step', 1)
        .is('last_email_sent_at', null);

    if (err1) {
        console.error('Error:', err1.message);
    } else if (nullLastEmail?.length > 0) {
        console.log(`   ⚠️  Found ${nullLastEmail.length} enrollments with null last_email_sent_at:`);
        for (const e of nullLastEmail) {
            const { data: lead } = await supabase
                .from('leads')
                .select('name, email')
                .eq('id', e.lead_id)
                .single();
            console.log(`   - ${lead?.name || e.lead_id} (step ${e.current_step}, enrolled ${new Date(e.enrolled_at).toLocaleDateString()})`);
            issues.push({
                type: 'missing_last_email_sent_at',
                lead_id: e.lead_id,
                lead_name: lead?.name,
                enrollment_id: e.id,
                current_step: e.current_step
            });
        }
    } else {
        console.log('   ✅ No issues found');
    }

    // 2. Find auto-unenrolled leads that haven't replied
    console.log('\n📋 Check 2: Auto-unenrolled leads that never replied...');
    const { data: autoUnenrolled, error: err2 } = await supabase
        .from('email_sequence_enrollments')
        .select(`
            id,
            lead_id,
            current_step,
            enrolled_at,
            unenrolled_at,
            unenroll_reason
        `)
        .eq('unenroll_reason', 'auto_unenroll')
        .not('unenrolled_at', 'is', null);

    if (err2) {
        console.error('Error:', err2.message);
    } else if (autoUnenrolled?.length > 0) {
        console.log(`   ⚠️  Found ${autoUnenrolled.length} auto-unenrolled leads:`);
        for (const e of autoUnenrolled) {
            const { data: lead } = await supabase
                .from('leads')
                .select('name, email, status, has_replied')
                .eq('id', e.lead_id)
                .single();

            if (lead && lead.status !== 'Replied' && !lead.has_replied) {
                console.log(`   - ${lead?.name || e.lead_id} (status: ${lead?.status}, unenrolled: ${new Date(e.unenrolled_at).toLocaleDateString()})`);
                issues.push({
                    type: 'auto_unenrolled_no_reply',
                    lead_id: e.lead_id,
                    lead_name: lead?.name,
                    lead_email: lead?.email,
                    enrollment_id: e.id,
                    current_step: e.current_step,
                    unenrolled_at: e.unenrolled_at
                });
            }
        }
        if (issues.filter(i => i.type === 'auto_unenrolled_no_reply').length === 0) {
            console.log('   ✅ All auto-unenrolled leads had replied');
        }
    } else {
        console.log('   ✅ No auto-unenrolled leads found');
    }

    // 3. Find leads with initial pitch but no sequence emails
    console.log('\n📋 Check 3: Leads with pitch sent but no sequence follow-ups...');
    const { data: emailedLeads, error: err3 } = await supabase
        .from('leads')
        .select('id, name, email, status, in_sequence')
        .eq('status', 'Emailed')
        .eq('in_sequence', false);

    if (err3) {
        console.error('Error:', err3.message);
    } else if (emailedLeads?.length > 0) {
        let potentialIssues = 0;
        for (const lead of emailedLeads) {
            // Check if they have any sequence emails
            const { data: seqEmails } = await supabase
                .from('email_history')
                .select('id')
                .eq('lead_id', lead.id)
                .not('sequence_step', 'is', null);

            // Check enrollment status
            const { data: enrollment } = await supabase
                .from('email_sequence_enrollments')
                .select('completed_at, unenrolled_at, current_step')
                .eq('lead_id', lead.id)
                .single();

            if ((!seqEmails || seqEmails.length === 0) && enrollment && !enrollment.completed_at) {
                potentialIssues++;
                console.log(`   - ${lead.name} (no sequence emails, was at step ${enrollment?.current_step || 'N/A'})`);
                issues.push({
                    type: 'no_sequence_emails_sent',
                    lead_id: lead.id,
                    lead_name: lead.name,
                    lead_email: lead.email
                });
            }
        }
        if (potentialIssues === 0) {
            console.log('   ✅ No issues found');
        }
    } else {
        console.log('   ✅ No emailed leads with in_sequence=false');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY\n');
    console.log(`Total issues found: ${issues.length}`);

    const byType = {};
    issues.forEach(i => {
        byType[i.type] = (byType[i.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
    });

    if (issues.length > 0) {
        console.log('\n📋 AFFECTED LEADS (for re-enrollment):');
        const uniqueLeads = [...new Map(issues.map(i => [i.lead_id, i])).values()];
        uniqueLeads.forEach(i => {
            console.log(`  - ${i.lead_name || i.lead_id} (${i.lead_email || 'no email'})`);
        });

        console.log('\n💡 To re-enroll these leads, run:');
        console.log('   node scripts/reenroll-leads.js');
    }

    return issues;
}

auditEnrollments();
