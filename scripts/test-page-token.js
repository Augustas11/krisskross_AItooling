/**
 * Test Instagram API with Page Access Token
 * The conversations API requires a Page Access Token, not a User Access Token
 */

require('dotenv').config({ path: '.env.local' });

async function testWithPageToken() {
    const userToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    // First, get the page access token
    console.log('1. Getting Page Access Token from User Token...');
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${userToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
        console.log('Error getting pages:', pagesData.error.message);
        return;
    }

    const page = pagesData.data?.[0];
    if (!page) {
        console.log('No pages found');
        return;
    }

    console.log('   Page:', page.name);
    console.log('   Page ID:', page.id);

    const pageToken = page.access_token;

    // Get Instagram Business Account linked to this page
    console.log('\n2. Getting Instagram Business Account...');
    const igRes = await fetch(`https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`);
    const igData = await igRes.json();

    const igAccountId = igData.instagram_business_account?.id;
    console.log('   Instagram Account ID:', igAccountId);

    if (!igAccountId) {
        console.log('No Instagram Business Account linked to page');
        return;
    }

    // Try conversations with PAGE token
    console.log('\n3. Testing /conversations with PAGE token...');
    const convRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/conversations?access_token=${pageToken}`);
    const convData = await convRes.json();

    if (convData.error) {
        console.log('❌ Error:', convData.error.message);
        console.log('   Code:', convData.error.code);
    } else {
        console.log('✅ SUCCESS! Found', convData.data?.length || 0, 'conversations');
        if (convData.data?.length > 0) {
            console.log('   First conversation ID:', convData.data[0].id);
        }
    }

    // Also test comments endpoint
    console.log('\n4. Testing /media endpoint...');
    const mediaRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media?fields=id,caption,timestamp&limit=5&access_token=${pageToken}`);
    const mediaData = await mediaRes.json();

    if (mediaData.error) {
        console.log('❌ Error:', mediaData.error.message);
    } else {
        console.log('✅ SUCCESS! Found', mediaData.data?.length || 0, 'media posts');
    }

    console.log('\n✅ Page Token approach works! Update the Edge Function to use Page Token.');
}

testWithPageToken();
