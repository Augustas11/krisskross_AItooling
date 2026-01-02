const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testTaskFields() {
    console.log('🧪 Testing Task Management Fields...');

    // 1. Setup Supabase Client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 2. Create a test lead
    const testLead = {
        id: `test_lead_${Date.now()}`,
        name: 'Test Task Lead',
        email: `test_task_${Date.now()}@example.com`,
        status: 'New',
        next_action: 'Research',
        next_action_due: new Date().toISOString(),
        assigned_to: 'Aug'
    };

    console.log('📝 Inserting lead...', testLead.email);
    const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert([testLead])
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insert Failed:', insertError);
        return;
    }

    console.log('✅ Inserted Lead ID:', inserted.id);
    console.log('   Next Action:', inserted.next_action); // Should match

    if (inserted.next_action !== 'Research') {
        console.error('❌ Field mismatch on insert!');
    }

    // 3. Update the lead via API logic (simulation)
    // We can't call API route directly here easily without Fetch, but we updated the DB schema so direct DB access confirms storage works.
    // The API route just passes these fields through transformation. 

    // Let's verify update
    console.log('🔄 Updating task fields...');
    const { error: updateError } = await supabase
        .from('leads')
        .update({ next_action: 'Call', assigned_to: 'Reda' })
        .eq('id', inserted.id);

    if (updateError) console.error('❌ Update Failed:', updateError);
    else console.log('✅ Update Successful');

    // 4. Cleanup
    console.log('🧹 Cleaning up...');
    await supabase.from('leads').delete().eq('id', inserted.id);
    console.log('✅ Cleanup Complete');
}

testTaskFields();
