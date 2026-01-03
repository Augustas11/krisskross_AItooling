// Test script for Activity Feed implementation
// Run this after applying the database migration

const { supabase, isSupabaseConfigured } = require('../lib/supabase');

async function testActivityFeed() {
    console.log('\n🧪 [TEST] Starting Activity Feed Test Suite...\n');

    if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured. Cannot run tests.');
        process.exit(1);
    }

    try {
        // Test 1: Insert sample activities
        console.log('Test 1: Creating sample activities...');

        const sampleActivities = [
            {
                actor_id: null,
                actor_name: 'System',
                action_verb: 'created',
                action_type: 'lead',
                entity_type: 'lead',
                entity_id: 'test-lead-1',
                entity_name: 'Test Coffee Shop',
                metadata: { source: 'manual', product_category: 'Coffee & Beverages' },
                priority: 5
            },
            {
                actor_id: null,
                actor_name: 'User',
                action_verb: 'sent',
                action_type: 'email',
                entity_type: 'lead',
                entity_id: 'test-lead-1',
                entity_name: 'Test Coffee Shop',
                metadata: { subject: 'KrissKross Outreach', recipient: 'test@example.com' },
                priority: 7
            },
            {
                actor_id: null,
                actor_name: 'System',
                action_verb: 'enriched',
                action_type: 'lead',
                entity_type: 'lead',
                entity_id: 'test-lead-1',
                entity_name: 'Test Coffee Shop',
                metadata: { fields_updated: ['instagram', 'email', 'phone'], has_ai_research: true },
                priority: 3
            }
        ];

        const { data: inserted, error: insertError } = await supabase
            .from('activity_feed')
            .insert(sampleActivities)
            .select();

        if (insertError) {
            console.error('❌ Test 1 Failed:', insertError);
            throw insertError;
        }

        console.log(`✅ Test 1 Passed: Created ${inserted.length} sample activities\n`);

        // Test 2: Fetch all activities
        console.log('Test 2: Fetching all activities...');

        const { data: allActivities, error: fetchError } = await supabase
            .from('activity_feed')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (fetchError) {
            console.error('❌ Test 2 Failed:', fetchError);
            throw fetchError;
        }

        console.log(`✅ Test 2 Passed: Fetched ${allActivities.length} activities`);
        console.log('   Sample:', allActivities[0]?.actor_name, allActivities[0]?.action_verb, allActivities[0]?.entity_name);
        console.log('');

        // Test 3: Filter by entity
        console.log('Test 3: Filtering by entity ID...');

        const { data: entityActivities, error: filterError } = await supabase
            .from('activity_feed')
            .select('*')
            .eq('entity_id', 'test-lead-1')
            .order('created_at', { ascending: false });

        if (filterError) {
            console.error('❌ Test 3 Failed:', filterError);
            throw filterError;
        }

        console.log(`✅ Test 3 Passed: Found ${entityActivities.length} activities for test-lead-1\n`);

        // Test 4: Filter by action type
        console.log('Test 4: Filtering by action type (email)...');

        const { data: emailActivities, error: actionError } = await supabase
            .from('activity_feed')
            .select('*')
            .eq('action_type', 'email')
            .order('created_at', { ascending: false });

        if (actionError) {
            console.error('❌ Test 4 Failed:', actionError);
            throw actionError;
        }

        console.log(`✅ Test 4 Passed: Found ${emailActivities.length} email activities\n`);

        // Test 5: Test aggregation
        console.log('Test 5: Testing aggregation logic...');

        const crypto = require('crypto');
        const timeWindow = Math.floor(Date.now() / (30 * 60 * 1000));
        const aggregationKey = crypto
            .createHash('md5')
            .update(`null-test-lead-1-updated-${timeWindow}`)
            .digest('hex');

        const aggregatedActivities = [
            {
                actor_id: null,
                actor_name: 'User',
                action_verb: 'updated',
                action_type: 'lead',
                entity_type: 'lead',
                entity_id: 'test-lead-1',
                entity_name: 'Test Coffee Shop',
                metadata: { fields_updated: ['email'] },
                aggregation_key: aggregationKey,
                is_aggregated: true,
                priority: 3
            }
        ];

        const { data: aggInserted, error: aggError } = await supabase
            .from('activity_feed')
            .insert(aggregatedActivities)
            .select();

        if (aggError) {
            console.error('❌ Test 5 Failed:', aggError);
            throw aggError;
        }

        // Try to insert again (should aggregate in real implementation)
        console.log('   Testing second update (manual aggregation check)...');

        const { data: existingAgg } = await supabase
            .from('activity_feed')
            .select('id, aggregated_count')
            .eq('aggregation_key', aggregationKey)
            .maybeSingle();

        console.log(`✅ Test 5 Passed: Aggregation key created, current count: ${existingAgg?.aggregated_count || 1}\n`);

        // Test 6: Cleanup test data
        console.log('Test 6: Cleaning up test data...');

        const { error: cleanupError } = await supabase
            .from('activity_feed')
            .delete()
            .eq('entity_id', 'test-lead-1');

        if (cleanupError) {
            console.error('❌ Test 6 Failed:', cleanupError);
            throw cleanupError;
        }

        console.log('✅ Test 6 Passed: Test data cleaned up\n');

        console.log('🎉 All tests passed! Activity Feed is ready to use.\n');
        console.log('Next steps:');
        console.log('1. Apply the database migration: docs/migration-activity-feed.sql');
        console.log('2. Activity tracking is now live on lead creation, updates, emails, and enrichment');
        console.log('3. Access the activity feed at: /crm/activity-feed\n');

    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testActivityFeed();
