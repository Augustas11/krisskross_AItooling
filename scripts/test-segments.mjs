import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Dynamic import to ensure env vars are loaded before lib/supabase initializes
dotenv.config({ path: '.env.local' });
const { enrollLeadInSequence, getSequenceIdByType } = await import('../lib/email-sequences.js');

async function testSegments() {
    console.log('🧪 Testing Segment Logic (Affiliate)...');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Get IDs
    const fashionId = await getSequenceIdByType('fashion_owner');
    const affiliateId = await getSequenceIdByType('affiliate');
    console.log('👗 Fashion ID:', fashionId);
    console.log('🤝 Affiliate ID:', affiliateId);

    if (!fashionId || !affiliateId) {
        console.error('❌ Sequneces missing');
        // List sequences for debugging
        {
            const { data: allSeqs } = await supabase.from('email_sequences').select('*');
            console.log('Available Sequences:', allSeqs?.map(s => ({ type: s.sequence_type, active: s.is_active })));
        }
        return;
    }

    // 2. Prepare Test Data
    const testLeadFashion = {
        id: `test_fashion_${Date.now()}`,
        product_category: 'Women\'s Boutique Clothing',
        tags: ['instagram_growth']
    };

    // Updated to Affiliate Persona
    const testLeadAffiliate = {
        id: `test_affiliate_${Date.now()}`,
        product_category: 'UGC Creator',
        tags: ['affiliate_marketing', 'commission']
    };

    // Insert dummy leads
    await supabase.from('leads').insert([
        { ...testLeadFashion, name: 'Fashion Tester' },
        { ...testLeadAffiliate, name: 'Affiliate Tester' }
    ]);
    console.log('👤 Created test leads');

    // 3. Simulate Logic Matching (Replicating API Logic)
    const checkMatch = async (lead) => {
        const category = (lead.product_category || '').toLowerCase();
        const tags = (lead.tags || []).join(' ').toLowerCase();
        const combined = `${category} ${tags}`;

        if (combined.includes('fashion') || combined.includes('clothing')) {
            return enrollLeadInSequence(lead.id, fashionId);
        }
        if (combined.includes('affiliate') || combined.includes('commission') || combined.includes('ugc')) {
            return enrollLeadInSequence(lead.id, affiliateId);
        }
    };

    console.log('🔄 Running matching logic...');
    await checkMatch(testLeadFashion);
    await checkMatch(testLeadAffiliate);

    // 4. Verify Enrollments
    const { data: enrollments } = await supabase
        .from('email_sequence_enrollments')
        .select('*')
        .in('lead_id', [testLeadFashion.id, testLeadAffiliate.id]);

    const fashionEnrollment = enrollments.find(e => e.lead_id === testLeadFashion.id);
    const affiliateEnrollment = enrollments.find(e => e.lead_id === testLeadAffiliate.id);

    console.log('👗 Fashion Enrollment:', fashionEnrollment?.sequence_id === fashionId ? '✅ Correct' : '❌ Failed');
    console.log('🤝 Affiliate Enrollment:', affiliateEnrollment?.sequence_id === affiliateId ? '✅ Correct' : '❌ Failed');

    // 5. Cleanup
    await supabase.from('leads').delete().in('id', [testLeadFashion.id, testLeadAffiliate.id]);
    console.log('cleanup done');
}

testSegments();
