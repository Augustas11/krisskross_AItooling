#!/usr/bin/env node
/**
 * QA Check Script: Email Sequence Status for cold_outreach
 * 
 * This script checks:
 * 1. How many emails are sent/pending for step 2 in cold_outreach sequence
 * 2. Overall sequence enrollment status
 * 3. IMAP connection for reply detection
 * 
 * Usage: node scripts/check-sequence-status.js
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

async function checkSequenceStatus() {
    console.log('\n📊 EMAIL SEQUENCE STATUS CHECK (cold_outreach)\n');
    console.log('='.repeat(70));

    // 1. Find the cold_outreach sequence
    console.log('\n🔍 Finding cold_outreach sequence...');
    const { data: sequences, error: seqError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('sequence_type', 'cold_outreach');

    if (seqError) {
        console.error('Error fetching sequences:', seqError.message);
        return;
    }

    if (!sequences || sequences.length === 0) {
        console.log('❌ No cold_outreach sequence found');
        return;
    }

    const sequence = sequences[0];
    console.log(`✅ Found sequence: "${sequence.name}" (ID: ${sequence.id})`);
    console.log(`   Active: ${sequence.active ? 'Yes' : 'No'}`);
    console.log(`   Emails in sequence: ${sequence.emails?.length || 0}`);

    // 2. Get all enrollments for this sequence
    console.log('\n📋 Fetching enrollments...');
    const { data: enrollments, error: enrollError } = await supabase
        .from('email_sequence_enrollments')
        .select(`
            id,
            lead_id,
            sequence_id,
            current_step,
            enrolled_at,
            last_email_sent_at,
            completed_at,
            unenrolled_at,
            unenroll_reason
        `)
        .eq('sequence_id', sequence.id);

    if (enrollError) {
        console.error('Error fetching enrollments:', enrollError.message);
        return;
    }

    console.log(`\n📊 ENROLLMENT SUMMARY (Total: ${enrollments?.length || 0})`);
    console.log('-'.repeat(50));

    // Categorize enrollments
    const active = enrollments?.filter(e => !e.completed_at && !e.unenrolled_at) || [];
    const completed = enrollments?.filter(e => e.completed_at) || [];
    const unenrolled = enrollments?.filter(e => e.unenrolled_at && !e.completed_at) || [];

    console.log(`   Active enrollments: ${active.length}`);
    console.log(`   Completed: ${completed.length}`);
    console.log(`   Unenrolled: ${unenrolled.length}`);

    // 3. Breakdown by step (for active only)
    console.log('\n📍 ACTIVE ENROLLMENTS BY STEP:');
    console.log('-'.repeat(50));

    const stepCounts = {};
    for (const e of active) {
        const step = e.current_step || 1;
        stepCounts[step] = (stepCounts[step] || 0) + 1;
    }

    if (Object.keys(stepCounts).length === 0) {
        console.log('   No active enrollments');
    } else {
        Object.entries(stepCounts).sort((a, b) => a[0] - b[0]).forEach(([step, count]) => {
            console.log(`   Step ${step}: ${count} leads`);
        });
    }

    // 4. Step 2 specific analysis
    console.log('\n📧 STEP 2 DETAILED ANALYSIS (Second Email in Sequence):');
    console.log('-'.repeat(50));

    const step2Active = active.filter(e => e.current_step === 2);
    const step2Pending = active.filter(e => e.current_step === 1); // Step 1 = pending for step 2
    const step2Sent = enrollments?.filter(e => e.current_step >= 2) || [];

    console.log(`   Currently AT step 2 (awaiting send): ${step2Active.length}`);
    console.log(`   Currently AT step 1 (pending step 2): ${step2Pending.length}`);
    console.log(`   Already past step 2 (step 2+ sent): ${step2Sent.length}`);

    // 5. Check for leads that should receive step 2
    console.log('\n⏰ LEADS READY FOR STEP 2:');
    console.log('-'.repeat(50));

    // Leads at step 1 who have last_email_sent_at older than 2 days
    const now = new Date();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);

    let readyForStep2 = 0;
    for (const e of step2Pending) {
        if (e.last_email_sent_at && new Date(e.last_email_sent_at) < twoDaysAgo) {
            readyForStep2++;

            // Get lead details
            const { data: lead } = await supabase
                .from('leads')
                .select('name, email, status')
                .eq('id', e.lead_id)
                .single();

            if (lead) {
                const daysSinceLast = Math.floor((now - new Date(e.last_email_sent_at)) / (1000 * 60 * 60 * 24));
                console.log(`   - ${lead.name} (${lead.email}) - ${daysSinceLast} days since step 1`);
            }
        }
    }

    if (readyForStep2 === 0) {
        console.log('   No leads ready for step 2 (either already sent or not 2+ days since step 1)');
    } else {
        console.log(`\n   📌 ${readyForStep2} lead(s) should receive step 2 soon`);
    }

    // 6. Check in_sequence flag consistency
    console.log('\n🔄 IN_SEQUENCE FLAG CONSISTENCY:');
    console.log('-'.repeat(50));

    const activeLeadIds = active.map(e => e.lead_id);
    if (activeLeadIds.length > 0) {
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, in_sequence')
            .in('id', activeLeadIds);

        const inconsistent = leads?.filter(l => !l.in_sequence) || [];
        if (inconsistent.length > 0) {
            console.log(`   ⚠️ ${inconsistent.length} leads with active enrollment but in_sequence=false:`);
            inconsistent.forEach(l => console.log(`      - ${l.name}`));
        } else {
            console.log('   ✅ All active enrollments have in_sequence=true');
        }
    } else {
        console.log('   No active enrollments to check');
    }

    // 7. Email history for sequence emails
    console.log('\n📧 SEQUENCE EMAIL HISTORY:');
    console.log('-'.repeat(50));

    const { data: emailHistory, error: histError } = await supabase
        .from('email_history')
        .select('id, lead_id, sequence_step, sent_at')
        .not('sequence_step', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(50);

    if (histError) {
        console.error('   Error fetching email history:', histError.message);
    } else {
        const stepEmailCounts = {};
        emailHistory?.forEach(e => {
            const step = e.sequence_step;
            stepEmailCounts[step] = (stepEmailCounts[step] || 0) + 1;
        });

        if (Object.keys(stepEmailCounts).length === 0) {
            console.log('   No sequence emails found in email_history');
        } else {
            console.log('   Emails sent by sequence step (from history):');
            Object.entries(stepEmailCounts).sort((a, b) => a[0] - b[0]).forEach(([step, count]) => {
                console.log(`      Step ${step}: ${count} emails sent`);
            });
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Sequence status check complete\n');
}

async function checkImapConfig() {
    console.log('\n📬 IMAP CONFIGURATION CHECK (Reply Detection):');
    console.log('='.repeat(70));

    const imapUser = process.env.IMAP_USER || process.env.EMAIL_ADDRESS;
    const imapHost = process.env.IMAP_HOST || 'imap.titan.email';
    const imapPort = process.env.IMAP_PORT || '993';
    const imapPassword = process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD;

    console.log(`   IMAP_USER: ${imapUser ? '✅ Set' : '❌ NOT SET'}`);
    console.log(`   IMAP_HOST: ${imapHost}`);
    console.log(`   IMAP_PORT: ${imapPort}`);
    console.log(`   IMAP_PASSWORD: ${imapPassword ? '✅ Set' : '❌ NOT SET'}`);

    if (!imapUser || !imapPassword) {
        console.log('\n   ❌ IMAP credentials not configured. Reply detection will fail.');
        console.log('   Required environment variables:');
        console.log('     - IMAP_USER or EMAIL_ADDRESS');
        console.log('     - IMAP_PASSWORD or EMAIL_PASSWORD');
        console.log('     - IMAP_HOST (optional, defaults to imap.titan.email)');
        return false;
    }

    console.log('\n   ⚡ Testing IMAP connection...');
    try {
        const imaps = require('imap-simple');
        const config = {
            imap: {
                user: imapUser,
                password: imapPassword,
                host: imapHost,
                port: parseInt(imapPort),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Quick search for unread emails
        const messages = await connection.search(['UNSEEN'], { bodies: [], markSeen: false });
        console.log(`   ✅ IMAP connection successful!`);
        console.log(`   📥 Unread emails in INBOX: ${messages.length}`);

        connection.end();
        return true;
    } catch (error) {
        console.log(`   ❌ IMAP connection failed: ${error.message}`);
        console.log('\n   Possible causes:');
        console.log('     1. Wrong username/password');
        console.log('     2. Wrong IMAP host/port');
        console.log('     3. IMAP not enabled for email account');
        console.log('     4. Firewall blocking connection');
        return false;
    }
}

async function main() {
    await checkSequenceStatus();
    await checkImapConfig();
}

main().catch(console.error);
