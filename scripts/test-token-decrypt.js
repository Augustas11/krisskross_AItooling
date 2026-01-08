/**
 * Direct token decryption test
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDecryption() {
    console.log('🔍 Testing token decryption...\n');

    // Get encrypted token from database
    const { data, error } = await supabase
        .from('instagram_credentials')
        .select('access_token')
        .eq('id', '550e8400-e29b-41d4-a716-446655440000')
        .single();

    if (error) {
        console.error('❌ Database error:', error);
        return;
    }

    console.log('✅ Retrieved encrypted token from database');
    console.log(`   Format: ${data.access_token.substring(0, 40)}...`);

    // Decrypt
    try {
        const [ivHex, encData] = data.access_token.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let token = decipher.update(encData, 'hex', 'utf8');
        token += decipher.final('utf8');

        console.log('\n✅ Token decrypted successfully!');
        console.log(`   Decrypted token: ${token.substring(0, 30)}...`);
        console.log(`   Length: ${token.length}`);
        console.log(`   Starts with EAAK: ${token.startsWith('EAAK')}`);

    } catch (error) {
        console.error('\n❌ Decryption failed:', error.message);
    }
}

testDecryption();
