/**
 * Verify Graph API Token
 * 
 * Usage: node scripts/verify-graph-token.js
 */

const https = require('https');

const TOKEN = 'EAAKpznEzYZAUBQe0AeHaXXmStfwvzLdu28Sb8c1Oo770Uvyhv2FZB5Sj1aRJxIDKJGg89gVGWTbmTkjOnx0ezmDWyHSYIgZAMeGxdsjpzgFea8563OxFllsZB1KgN3YyOygmAlmtYSdiUQe2dijixHWYiKW6EnAtfQIG8RvL3cX0ADl5onPTe6Mroy745Gsx6zAlZCFpmFqv2slnRZB4mt7xEnpZBW4S1dRH3iZAGKGe3ZA3SOp4duUzZAaxwrqkLZBbqvsU5VZAZBSmmudonXxRbYA6d9OZARfwZDZD';

function checkToken() {
    console.log('Verifying Graph API Token...');

    // 1. Get User Info & Permissions
    const url = `https://graph.facebook.com/v21.0/me?fields=id,name,permissions&access_token=${TOKEN}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.error) {
                    console.error('❌ Token Error:', json.error.message);
                    return;
                }

                console.log('\n✅ Token is valid!');
                console.log('User ID:', json.id);
                console.log('Name:', json.name);

                console.log('\nPermissions:');
                if (json.permissions && json.permissions.data) {
                    json.permissions.data.forEach(p => {
                        const status = p.status === 'granted' ? '✅' : '❌';
                        console.log(`${status} ${p.permission}`);
                    });
                }

                // 2. Check for Instagram Business Accounts
                checkInstagramAccounts();

            } catch (e) {
                console.error('Parse error:', e);
            }
        });
    }).on('error', e => console.error('Request error:', e));
}

function checkInstagramAccounts() {
    console.log('\nChecking for connected Instagram Business Accounts...');

    // Get Pages -> Instagram Business Account
    const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=${TOKEN}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.data && json.data.length > 0) {
                    let found = false;
                    json.data.forEach(page => {
                        if (page.instagram_business_account) {
                            console.log(`\nFound Instagram Account linked to Page "${page.name}":`);
                            console.log(`- ID: ${page.instagram_business_account.id}`);
                            console.log(`- Username: @${page.instagram_business_account.username}`);
                            console.log(`- Name: ${page.instagram_business_account.name}`);
                            found = true;
                        }
                    });

                    if (!found) {
                        console.warn('\n⚠️ No Instagram Business Accounts found linked to your Facebook Pages.');
                        console.warn('Make sure your Instagram account is switched to "Business" or "Creator" and linked to a Facebook Page.');
                    }
                } else {
                    console.warn('\n⚠️ No Facebook Pages found.');
                }
            } catch (e) {
                console.error(e);
            }
        });
    });
}

checkToken();
