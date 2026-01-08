/**
 * Verify Which App the Access Token Belongs To
 * 
 * This script decodes the access token to determine:
 * 1. Which App ID it was generated for
 * 2. Token expiration
 * 3. Granted permissions
 * 4. Associated user/page
 * 
 * Usage: node scripts/verify-token-app.js
 */

require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'EAAKpznEzYZAUBQe0AeHaXXmStfwvzLdu28Sb8c1Oo770Uvyhv2FZB5Sj1aRJxIDKJGg89gVGWTbmTkjOnx0ezmDWyHSYIgZAMeGxdsjpzgFea8563OxFllsZB1KgN3YyOygmAlmtYSdiUQe2dijixHWYiKW6EnAtfQIG8RvL3cX0ADl5onPTe6Mroy745Gsx6zAlZCFpmFqv2slnRZB4mt7xEnpZBW4S1dRH3iZAGKGe3ZA3SOp4duUzZAaxwrqkLZBbqvsU5VZAZBSmmudonXxRbYA6d9OZARfwZDZD';

async function verifyToken() {
    console.log('🔍 Verifying Access Token...\n');
    console.log(`Token (first 20 chars): ${TOKEN.substring(0, 20)}...\n`);

    try {
        // Debug the token to see which app it belongs to
        const debugUrl = `https://graph.facebook.com/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`;

        console.log('📡 Calling Facebook Debug Token API...\n');

        const response = await fetch(debugUrl);
        const result = await response.json();

        if (result.error) {
            console.error('❌ Error:', result.error.message);
            console.error('   Code:', result.error.code);
            console.error('   Type:', result.error.type);
            return;
        }

        const data = result.data;

        console.log('✅ Token Debug Information:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🆔 App ID:           ${data.app_id}`);
        console.log(`📱 Application:      ${data.application || 'N/A'}`);
        console.log(`👤 User ID:          ${data.user_id || 'N/A'}`);
        console.log(`📅 Issued At:        ${new Date(data.issued_at * 1000).toLocaleString()}`);
        console.log(`⏰ Expires At:       ${data.expires_at ? new Date(data.expires_at * 1000).toLocaleString() : 'Never (long-lived)'}`);
        console.log(`✓  Valid:            ${data.is_valid ? '✅ Yes' : '❌ No'}`);
        console.log(`🔐 Type:             ${data.type || 'N/A'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Check scopes/permissions
        if (data.scopes && data.scopes.length > 0) {
            console.log('🔑 Granted Permissions:');
            data.scopes.forEach(scope => {
                console.log(`   ✓ ${scope}`);
            });
            console.log('');
        }

        // Compare with configured App IDs
        console.log('🔍 Configuration Check:\n');

        const configuredAppId = process.env.INSTAGRAM_APP_ID;
        const facebookAppId = '749654080971157';
        const instagramAppId = '1187682906764579';

        console.log(`   Configured in .env.local: ${configuredAppId || '❌ NOT SET'}`);
        console.log(`   Facebook App ID:          ${facebookAppId}`);
        console.log(`   Instagram App ID:         ${instagramAppId}`);
        console.log('');

        if (data.app_id === configuredAppId) {
            console.log('✅ MATCH: Token belongs to the configured app!');
        } else {
            console.log('❌ MISMATCH: Token belongs to a different app!');
            console.log(`   Token is for:     ${data.app_id}`);
            console.log(`   Configured for:   ${configuredAppId || 'NOT SET'}`);
            console.log('');
            console.log('⚠️  ACTION REQUIRED: Update .env.local to use the correct App ID and Secret');
        }

        // Check if it matches either of the known apps
        console.log('');
        if (data.app_id === facebookAppId) {
            console.log('📌 This token belongs to: Facebook App (749654080971157)');
            console.log('   App Name: KrissKross.ai');
        } else if (data.app_id === instagramAppId) {
            console.log('📌 This token belongs to: Instagram App (1187682906764579)');
            console.log('   App Name: KrissKross Leads CRM');
        } else {
            console.log(`📌 This token belongs to: Unknown App (${data.app_id})`);
        }

        // Test if we can get Instagram account info
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 Testing Instagram Account Access...\n');

        const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username}}&access_token=${TOKEN}`;
        const meResponse = await fetch(meUrl);
        const meResult = await meResponse.json();

        if (meResult.error) {
            console.error('❌ Cannot access user info:', meResult.error.message);
        } else {
            console.log(`✅ User: ${meResult.name} (ID: ${meResult.id})`);

            if (meResult.accounts && meResult.accounts.data && meResult.accounts.data.length > 0) {
                console.log('\n📄 Facebook Pages:');
                meResult.accounts.data.forEach(page => {
                    console.log(`   • ${page.name} (ID: ${page.id})`);
                    if (page.instagram_business_account) {
                        console.log(`     ↳ Instagram: @${page.instagram_business_account.username} (ID: ${page.instagram_business_account.id})`);
                    } else {
                        console.log(`     ↳ No Instagram account linked`);
                    }
                });
            } else {
                console.log('⚠️  No Facebook Pages found or token lacks pages_read_engagement permission');
            }
        }

    } catch (error) {
        console.error('❌ Script Error:', error.message);
    }
}

verifyToken();
