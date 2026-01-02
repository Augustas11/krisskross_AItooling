import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifySettings() {
    console.log('Testing App Settings...');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Read Default
    let { data: read1, error: err1 } = await supabase.from('app_settings').select('*').eq('key', 'calendly_link').single();
    if (err1) console.error('Read default failed:', err1);
    console.log('Current Setting:', read1);

    // 2. Update
    const testLink = 'https://calendly.com/test-user';
    const { error: err2 } = await supabase.from('app_settings').upsert({ key: 'calendly_link', value: testLink });
    if (err2) console.error('Update failed:', err2);
    else console.log('Updated setting to:', testLink);

    // 3. Verify Update
    let { data: read2 } = await supabase.from('app_settings').select('*').eq('key', 'calendly_link').single();
    console.log('Verified Setting:', read2?.value === testLink ? '✅ Success' : '❌ Failed');

    // 4. Cleanup (Reset to default empty string or keep it?)
    // Let's reset to generic placeholder to not mess up user
    await supabase.from('app_settings').upsert({ key: 'calendly_link', value: '' });
    console.log('Reset setting to empty');
}

verifySettings();
