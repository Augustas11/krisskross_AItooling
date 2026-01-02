const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Need fetch for API call simulation or use local logic?
// We can't use node-fetch against Next.js API easily without the server running.
// We should test by calling the API POST handler directly? Or just direct DB insertion?
// The logic is in the API route, so we need to invoke the API route code or run the server.

// Since I cannot run the server in background easily and query it, 
// I will simulate the API logic by importing the same functions if possible,
// OR just trust the code review and verify the DB state after I manually insert via Supabase client?
// Wait, the logic is in the API route `POST` handler, so direct DB insert won't trigger it.
// I need to trigger the API route.

// Alternative: I can use the existing "run_command" to start the server in background? 
// No, that's complex.
// Better: Refactor the logic to a service function I can call?
// For now, I'll rely on looking at my code implementation matching the requirement.
// BUT, I can simulate the internal logic in a script by copying the snippet? No that defeats the purpose.

// Let's create a script that uses the Supabase client to *check* if the sequence exists first.
// Then I will manually insert a lead via Supabase and THEN manually call `enrollLeadInSequence` to verify the helper works.
// This validates the components, even if it doesn't validate the API Trigger end-to-end.
// For the API Trigger, I'd need to mock the Request object and call the POST function exported from `route.js`.

const { enrollLeadInSequence, getSequenceIdByType } = require('../lib/email-sequences');
require('dotenv').config({ path: '.env.local' });

// Mock supabase if needed, but we use the real one from lib/supabase if environment is set
// However, `lib/email-sequences` imports from `./supabase` which uses `.env.local`?
// I need to ensure `lib/supabase.js` can pick up env vars.

async function testTrialSequence() {
    console.log('🧪 Testing Trial Sequence Logic...');

    // 1. Check if Sequence Exists
    const trialSeqId = await getSequenceIdByType('trial_onboarding');
    console.log('📋 Trial Sequence ID:', trialSeqId);

    if (!trialSeqId) {
        console.error('❌ Trial sequence not found! isValid: false');
        return;
    }
    console.log('✅ Trial sequence found.');

    // 2. Create a dummy lead directly in DB (skipping API trigger for this unit test)
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
