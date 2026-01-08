/**
 * Test Instagram API Token
 * Quick script to verify the Instagram access token works
 */

require('dotenv').config({ path: '.env.local' });

const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v21.0';

async function testToken() {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ INSTAGRAM_ACCESS_TOKEN not found in .env.local');
        process.exit(1);
    }

    console.log('✓ Token found');
    console.log(`  Length: ${token.length} characters`);
    console.log(`  Starts with: ${token.substring(0, 15)}...`);
    console.log('');

    // Test the token
    console.log('🔍 Testing token with Instagram API...\n');

    const url = `${INSTAGRAM_API_BASE}/me?fields=id,username,account_type&access_token=${token}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Token is valid!');
            console.log(`   Account: @${data.username}`);
            console.log(`   Type: ${data.account_type}`);
            console.log(`   ID: ${data.id}`);
        } else {
            console.log('\n❌ Token validation failed!');
            console.log('   Error:', data.error?.message || 'Unknown error');
            console.log('   Error type:', data.error?.type);
            console.log('   Error code:', data.error?.code);

            if (data.error?.message?.includes('expired')) {
                console.log('\n⚠️  Token appears to be expired. You need to refresh it.');
            } else if (data.error?.message?.includes('Invalid')) {
                console.log('\n⚠️  Token appears to be invalid. Check the token value.');
            }
        }
    } catch (error) {
        console.error('\n❌ Network error:', error.message);
    }
}

testToken();
