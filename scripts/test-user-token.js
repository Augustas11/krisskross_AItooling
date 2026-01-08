/**
 * Test the User-Provided Token
 * 
 * Tests the token provided by the user in the request
 * 
 * Usage: node scripts/test-user-token.js
 */

// Use the token provided by the user
const USER_PROVIDED_TOKEN = 'EAAKpznEzYZAUBQe0AeHaXXmStfwvzLdu28Sb8c1Oo770Uvyhv2FZB5Sj1aRJxIDKJGg89gVGWTbmTkjOnx0ezmDWyHSYIgZAMeGxdsjpzgFea8563OxFllsZB1KgN3YyOygmAlmtYSdiUQe2dijixHWYiKW6EnAtfQIG8RvL3cX0ADl5onPTe6Mroy745Gsx6zAlZCFpmFqv2slnRZB4mt7xEnpZBW4S1dRH3iZAGKGe3ZA3SOp4duUzZAaxwrqkLZBbqvsU5VZAZBSmmudonXxRbYA6d9OZARfwZDZD';

async function testToken() {
    console.log('🔍 Testing User-Provided Access Token...\n');
    console.log(`Token (first 20 chars): ${USER_PROVIDED_TOKEN.substring(0, 20)}...\n`);

    try {
        // Debug the token
        const debugUrl = `https://graph.facebook.com/debug_token?input_token=${USER_PROVIDED_TOKEN}&access_token=${USER_PROVIDED_TOKEN}`;

        console.log('📡 Step 1: Calling Facebook Debug Token API...\n');

        const response = await fetch(debugUrl);
        const result = await response.json();

        if (result.error) {
            console.error('❌ Token Debug Failed:');
            console.error(`   Error: ${result.error.message}`);
            console.error(`   Code: ${result.error.code}`);
            console.error(`   Type: ${result.error.type}\n`);

            if (result.error.code === 190) {
                console.log('💡 This means the token is INVALID or EXPIRED.');
                console.log('   Possible reasons:');
                console.log('   1. Token has expired');
                console.log('   2. User logged out');
                console.log('   3. Token was revoked');
                console.log('   4. Token format is incorrect\n');
            }

            console.log('🔧 Next Steps:');
            console.log('   1. Generate a new access token from Facebook Graph API Explorer');
            console.log('   2. Make sure to select the correct App ID');
            console.log('   3. Request all required permissions');
            console.log('   4. Exchange for long-lived token\n');

            return;
        }

        const data = result.data;

        console.log('✅ Token is VALID!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Token Information:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🆔 App ID:           ${data.app_id}`);
        console.log(`📱 Application:      ${data.application || 'N/A'}`);
        console.log(`👤 User ID:          ${data.user_id || 'N/A'}`);
        console.log(`📅 Issued At:        ${new Date(data.issued_at * 1000).toLocaleString()}`);
        console.log(`⏰ Expires At:       ${data.expires_at ? new Date(data.expires_at * 1000).toLocaleString() : 'Never (long-lived)'}`);
        console.log(`✓  Valid:            ${data.is_valid ? '✅ Yes' : '❌ No'}`);
        console.log(`🔐 Type:             ${data.type || 'N/A'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Check scopes
        if (data.scopes && data.scopes.length > 0) {
            console.log('🔑 Granted Permissions:');
            data.scopes.forEach(scope => {
                console.log(`   ✓ ${scope}`);
            });
            console.log('');
        }

        // Check required permissions
        const requiredPermissions = [
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'pages_manage_metadata',
            'pages_read_engagement'
        ];

        const grantedScopes = data.scopes || [];
        const missingPermissions = requiredPermissions.filter(p => !grantedScopes.includes(p));

        if (missingPermissions.length > 0) {
            console.log('⚠️  Missing Required Permissions:');
            missingPermissions.forEach(p => {
                console.log(`   ✗ ${p}`);
            });
            console.log('');
        } else {
            console.log('✅ All required permissions granted!\n');
        }

        // Identify which app this is
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 App Identification:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const validAppId = '749654080971157'; // KrissKross.ai

        if (data.app_id === validAppId) {
            console.log(`✅ Token belongs to: KrissKross.ai (${validAppId})`);
            console.log('✅ App ID matches configuration!\n');
        } else {
            console.log(`⚠️  Token belongs to: Unknown App (${data.app_id})`);
            console.log(`   Expected: ${validAppId}\n`);
        }

        // Test Instagram access
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 Step 2: Testing Instagram Account Access...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username}}&access_token=${USER_PROVIDED_TOKEN}`;
        const meResponse = await fetch(meUrl);
        const meResult = await meResponse.json();

        if (meResult.error) {
            console.error('❌ Cannot access user info:');
            console.error(`   ${meResult.error.message}\n`);
        } else {
            console.log(`✅ Facebook User: ${meResult.name} (ID: ${meResult.id})\n`);

            if (meResult.accounts && meResult.accounts.data && meResult.accounts.data.length > 0) {
                console.log('📄 Connected Facebook Pages:');
                let hasInstagram = false;

                meResult.accounts.data.forEach((page, index) => {
                    console.log(`\n   ${index + 1}. ${page.name}`);
                    console.log(`      Page ID: ${page.id}`);

                    if (page.instagram_business_account) {
                        hasInstagram = true;
                        console.log(`      ✅ Instagram: @${page.instagram_business_account.username}`);
                        console.log(`      Instagram ID: ${page.instagram_business_account.id}`);
                    } else {
                        console.log(`      ❌ No Instagram account linked to this page`);
                    }
                });

                if (hasInstagram) {
                    console.log('\n✅ SUCCESS: Instagram Business Account found and accessible!\n');
                } else {
                    console.log('\n❌ PROBLEM: No Instagram Business Account linked to any Facebook Page\n');
                    console.log('🔧 To fix:');
                    console.log('   1. Go to your Facebook Page settings');
                    console.log('   2. Link your Instagram Business Account');
                    console.log('   3. Generate a new token with page access\n');
                }
            } else {
                console.log('⚠️  No Facebook Pages found\n');
                console.log('Possible reasons:');
                console.log('   1. Token lacks pages_read_engagement permission');
                console.log('   2. User has no Facebook Pages');
                console.log('   3. Pages are not accessible with this token\n');
            }
        }

        // Final summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Summary & Next Steps:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log(`1. Token App ID: ${data.app_id}`);
        console.log(`2. Token Valid: ${data.is_valid ? 'Yes ✅' : 'No ❌'}`);
        console.log(`3. Required Permissions: ${missingPermissions.length === 0 ? 'All granted ✅' : `Missing ${missingPermissions.length} ❌`}`);
        console.log('');

    } catch (error) {
        console.error('❌ Script Error:', error.message);
        console.error(error.stack);
    }
}

testToken();
