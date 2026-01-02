import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { enrollLeadInSequence, getSequenceIdByType } = await import('../lib/email-sequences.js');

async function testBehavioralTriggers() {
    console.log('🧪 Testing Behavioral Triggers (Pricing Nudge)...');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Verify Sequence Exists
    const pricingSeqId = await getSequenceIdByType('pricing_nudge');
    console.log('💰 Pricing Nudge Sequence ID:', pricingSeqId);

    if (!pricingSeqId) {
        console.error('❌ Pricing sequence missing');
        return;
    }

    // 2. Create Dummy Lead
    const testLead = {
        id: `test_behavior_${Date.now()}`,
        name: 'Behavioral Tester',
        email: `behavior_${Date.now()}@test.com`
    };

    await supabase.from('leads').insert([testLead]);
    console.log('👤 Created test lead');

    // 3. Simulate Webhook Trigger Logic
    console.log('🔄 Simulating "pricing_page_viewed" event enrollment...');

    const result = await enrollLeadInSequence(testLead.id, pricingSeqId);

    if (result.success) {
        console.log('✅ Successfully enrolled in Pricing Nudge');
    } else {
        console.log('⚠️ Failed to enroll:', result.message);
    }

    // 4. Verify in DB
    const { data: enrollment } = await supabase
        .from('email_sequence_enrollments')
        .select('*')
        .eq('lead_id', testLead.id)
        .eq('sequence_id', pricingSeqId)
        .single();

    if (enrollment) {
        console.log('✅ DB Verification Passed: Enrollment found');
    } else {
        console.error('❌ DB Verification Failed: No enrollment record');
    }

    // 5. Cleanup
    await supabase.from('leads').delete().eq('id', testLead.id);
    console.log('cleanup done');
}

testBehavioralTriggers();
