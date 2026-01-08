const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Use the NEW token directly (not from env yet since we haven't updated it)
const TOKEN = 'EAAKpznEzYZAUBQe0AeHaXXmStfwvzLdu28Sb8c1Oo770Uvyhv2FZB5Sj1aRJxIDKJGg89gVGWTbmTkjOnx0ezmDWyHSYIgZAMeGxdsjpzgFea8563OxFllsZB1KgN3YyOygmAlmtYSdiUQe2dijixHWYiKW6EnAtfQIG8RvL3cX0ADl5onPTe6Mroy745Gsx6zAlZCFpmFqv2slnRZB4mt7xEnpZBW4S1dRH3iZAGKGe3ZA3SOp4duUzZAaxwrqkLZBbqvsU5VZAZBSmmudonXxRbYA6d9OZARfwZDZD';

console.log('Testing /me/accounts endpoint...\n');

const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${TOKEN}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Full Response:');
            console.log(JSON.stringify(json, null, 2));

            if (json.data && json.data.length > 0) {
                console.log('\n✅ SUCCESS! Found pages:', json.data.length);
            } else if (json.error) {
                console.log('\n❌ ERROR:', json.error.message);
            } else {
                console.log('\n⚠️ No pages found (empty array)');
            }
        } catch (e) {
            console.error('Parse error:', e);
        }
    });
}).on('error', e => console.error('Request error:', e));
