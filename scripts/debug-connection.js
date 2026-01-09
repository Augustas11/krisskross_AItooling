const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const token = process.env.INSTAGRAM_ACCESS_TOKEN;

async function debugConnection() {
    console.log('🕵️‍♂️ Debugging Facebook-Instagram Connection...');

    if (!token) {
        console.error('❌ No token found in .env.local');
        return;
    }

    // 1. Check Me/Accounts
    const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks,instagram_business_account{id,username,name,ig_id}&access_token=${token}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error('❌ API Error:', data.error);
            return;
        }

        console.log(`✅ Found ${data.data.length} Pages.`);

        for (const page of data.data) {
            console.log(`\n--- Page: ${page.name} (${page.id}) ---`);
            console.log('   Tasks (Permissions):', page.tasks);

            if (page.instagram_business_account) {
                console.log('   ✅ Linked Instagram Account:');
                console.log(`      - Username: @${page.instagram_business_account.username}`);
                console.log(`      - ID: ${page.instagram_business_account.id}`);

                // Try fetching conversations with PAGE token
                if (page.access_token) {
                    console.log('   🧪 Testing Access with PAGE Token...');
                    const testUrl = `https://graph.facebook.com/v21.0/${page.instagram_business_account.id}/conversations?platform=instagram&access_token=${page.access_token}`;
                    try {
                        const tRes = await fetch(testUrl);
                        const tData = await tRes.json();
                        if (tData.error) {
                            console.error('      ❌ Page Token Failed:', tData.error.message);
                        } else {
                            console.log('      ✅ Page Token SUCCEEDED! Found conversations:', tData.data.length);
                        }
                    } catch (err) {
                        console.error('      ❌ Request Failed');
                    }
                }

                // Try fetching conversations with USER token (current method)
                console.log('   🧪 Testing Access with USER Token...');
                const userTestUrl = `https://graph.facebook.com/v21.0/${page.instagram_business_account.id}/conversations?platform=instagram&access_token=${token}`;
                try {
                    const uRes = await fetch(userTestUrl);
                    const uData = await uRes.json();
                    if (uData.error) {
                        console.error('      ❌ User Token Failed:', uData.error.message);
                    } else {
                        console.log('      ✅ User Token SUCCEEDED! Found conversations:', uData.data.length);
                    }
                } catch (err) {
                    console.error('      ❌ Request Failed');
                }

            } else {
                console.error('   ❌ NO INSTAGRAM BUSINESS ACCOUNT LINKED!');
            }
        }

    } catch (e) {
        console.error('Script Error:', e);
    }
}

debugConnection();
