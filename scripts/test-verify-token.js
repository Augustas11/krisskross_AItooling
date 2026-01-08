/**
 * Test script to verify instagramAPI.verifyToken() works
 */
// CRITICAL: Load env vars BEFORE importing modules
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import instagramAPI from '../lib/instagram-api.js';

async function test() {
    console.log('🧪 Testing instagramAPI.verifyToken()...\n');

    try {
        console.log('Step 1: Calling verifyToken()...');
        const result = await instagramAPI.verifyToken();

        console.log('\nStep 2: Result received:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log(`   Username: @${result.account.username}`);
            console.log(`   Account ID: ${result.account.id}`);
        } else {
            console.log('\n❌ FAILED!');
            console.log(`   Error: ${result.error}`);
        }

    } catch (error) {
        console.error('\n❌ EXCEPTION:', error.message);
        console.error(error.stack);
    }
}

test();
