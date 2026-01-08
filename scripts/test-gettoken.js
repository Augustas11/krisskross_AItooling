/**
 * Test getToken() from token-manager directly
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getToken } from '../lib/token-manager.js';

async function test() {
    console.log('🧪 Testing token-manager.getToken()...\n');

    try {
        const token = await getToken();

        if (token) {
            console.log('✅ SUCCESS!');
            console.log(`   Token: ${token.substring(0, 30)}...`);
            console.log(`   Length: ${token.length}`);
            console.log(`   Starts with EAAK: ${token.startsWith('EAAK')}`);
        } else {
            console.log('❌ getToken() returned null');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

test();
