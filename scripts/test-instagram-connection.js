/**
 * Instagram API Connection Test
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { fetch } from 'undici';

dotenv.config({ path: '.env.local' });

async function testInstagramAPI() {
    console.log('🧪 Instagram API Connection Test\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // 1. Check Environment
        console.log('1️⃣  Checking Environment Variables...');
        const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY', 'FACEBOOK_APP_ID'];
        const missing = required.filter(v => !process.env[v]);

        if (missing.length > 0) {
            console.error(`   ❌ Missing: ${missing.join(', ')}\n`);
            return false;
        }
        console.log('   ✅ All environment variables present\n');

        // 2. Test Database & Token
        console.log('2️⃣  Retrieving Token from Database...');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: cred, error } = await supabase
            .from('instagram_credentials')
            .select('access_token, token_expires_at, app_id')
            .eq('id', '550e8400-e29b-41d4-a716-446655440000')
            .single();

        if (error) {
            console.error(`   ❌ Database error: ${error.message}\n`);
            return false;
        }

        if (!cred) {
            console.error('   ❌ No credentials found\n');
            return false;
        }

        console.log('   ✅ Credentials found in database');

        // Decrypt token
        const [ivHex, encData] = cred.access_token.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let token = decipher.update(encData, 'hex', 'utf8');
        token += decipher.final('utf8');

        console.log(`   🔑 Token format: ${token.substring(0, 20)}...`);
        console.log(`   📅 Expires: ${new Date(cred.token_expires_at).toLocaleString()}`);

        const daysLeft = Math.ceil((new Date(cred.token_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   ⏰ Days remaining: ${daysLeft}\n`);

        // 3. Test API Call
        console.log('3️⃣  Testing Facebook Graph API...');

        const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`;
        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json();

        if (debugData.error) {
            console.error(`   ❌ API Error: ${debugData.error.message}\n`);
            return false;
        }

        const tokenInfo = debugData.data;
        console.log(`   ✅ Token is VALID`);
        console.log(`   📱 App ID: ${tokenInfo.app_id}`);
        console.log(`   👤 User ID: ${tokenInfo.user_id}`);
        console.log(`   🔐 Scopes: ${(tokenInfo.scopes || []).slice(0, 3).join(', ')}...\n`);

        // 4. Get Instagram Account
        console.log('4️⃣  Fetching Instagram Account...');

        const meUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`;
        const meRes = await fetch(meUrl);
        const meData = await meRes.json();

        if (!meData.data || meData.data.length === 0) {
            console.error('   ❌ No Facebook Pages found\n');
            return false;
        }

        console.log(`   📄 Found ${meData.data.length} Facebook Page(s)`);

        // Check for Instagram
        for (const page of meData.data) {
            const igUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${token}`;
            const igRes = await fetch(igUrl);
            const igData = await igRes.json();

            if (igData.instagram_business_account) {
                const igId = igData.instagram_business_account.id;

                const usernameUrl = `https://graph.facebook.com/v21.0/${igId}?fields=username&access_token=${token}`;
                const usernameRes = await fetch(usernameUrl);
                const usernameData = await usernameRes.json();

                console.log(`   ✅ Instagram Account: @${usernameData.username}`);
                console.log(`   🆔 Account ID: ${igId}\n`);

                console.log('═══════════════════════════════════════════════════');
                console.log('✅ ALL TESTS PASSED - Instagram API Ready!\n');
                return true;
            }
        }

        console.error('   ❌ No Instagram Business Account linked\n');
        return false;

    } catch (error) {
        console.error(`\n❌ Test failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

testInstagramAPI().then(success => {
    process.exit(success ? 0 : 1);
});
