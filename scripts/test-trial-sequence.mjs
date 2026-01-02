import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Dynamic import to ensure env vars are loaded before lib/supabase initializes
const { enrollLeadInSequence, getSequenceIdByType } = await import('../lib/email-sequences.js');

async function testTrialSequence() {
    console.log('🧪 Testing Trial Sequence Logic...');

    // 1. Check if Sequence Exists
    console.log('Env Check:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL Set' : 'URL Missing');

    // Debug: List all sequences
    {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: allSeqs, error: seqError } = await supabase.from('email_sequences').select('*');
        if (seqError) console.error('DB Error:', seqError);
        else console.log('Current Sequences:', allSeqs?.map(s => ({ id: s.id, type: s.sequence_type, active: s.is_active })));
    }

    const trialSeqId = await getSequenceIdByType('trial_onboarding');
    console.log('📋 Trial Sequence ID:', trialSeqId);

    if (!trialSeqId) {
        console.error('❌ Trial sequence not found! isValid: false');
        return;
    }
    console.log('✅ Trial sequence found.');

    // 2. Create a dummy lead directly in DB
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const testLeadId = `test_trial_${Date.now()}`;
    const { error: insertError } = await supabase.from('leads').insert({
        id: testLeadId,
        name: 'Trial Tester',
        email: `trial_${Date.now()}@test.com`,
        status: 'New'
    });

    if (insertError) {
        console.error('❌ Failed to insert test lead:', insertError);
        return;
    }
    console.log('👤 Created test lead:', testLeadId);

    // 3. Test Enroll Helper
    console.log('🔄 Attempting enrollment...');
    const result = await enrollLeadInSequence(testLeadId, trialSeqId);

    if (result.success) {
        console.log('✅ Enrollment successful:', result.enrollment);
    } else {
        console.error('❌ Enrollment failed:', result.error);
    }

    // 4. Verification Check
    const { data: check } = await supabase
        .from('email_sequence_enrollments')
        .select('*')
        .eq('lead_id', testLeadId)
        .single();

    if (check && check.sequence_id === trialSeqId) {
        console.log('✅ DATABASE VERIFICATION PASSED');
    } else {
        console.error('❌ DATABASE VERIFICATION FAILED');
    }

    // 5. Cleanup
    await supabase.from('leads').delete().eq('id', testLeadId);
    console.log('🧹 Cleanup done');
}

testTrialSequence();
