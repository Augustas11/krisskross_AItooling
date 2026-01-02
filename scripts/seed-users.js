const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key, RLS might block if not using service_role, but earlier SQL policy allowed all. 
// Ideally use service_role key if available, but for now we rely on the open policy or user adding one.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS_TO_CREATE = [
    { email: 'augustas@krisskross.ai', name: 'Augustas', role: 'admin' },
    { email: 'reda@krisskross.ai', name: 'Reda', role: 'admin' },
    { email: 'paulius@krisskross.ai', name: 'Paulius', role: 'admin' },
];

async function seedUsers() {
    console.log('🌱 Seeding initial admin users...');

    for (const user of USERS_TO_CREATE) {
        // 1. Generate temp password
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!1`;
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(tempPassword, salt);

        // 2. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

        if (existingUser) {
            console.log(`⚠️ User ${user.email} already exists. Skipping.`);
            continue;
        }

        // 3. Insert user
        const { data, error } = await supabase
            .from('users')
            .insert({
                email: user.email,
                full_name: user.name,
                role: user.role,
                password_hash: hash,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error(`❌ Failed to create ${user.email}:`, error.message);
        } else {
            console.log(`✅ Created user: ${user.email}`);
            console.log(`   🔑 Temporary Password: ${tempPassword}`);
            console.log(`   (Save this password securely!)`);
        }
    }
}

seedUsers();
