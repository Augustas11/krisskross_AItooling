#!/usr/bin/env node

/**
 * Migration script to transfer existing leads from leads_db.json to Supabase
 * 
 * Usage: node scripts/migrate-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Transform frontend format to Supabase row
function transformToDb(lead) {
    return {
        id: lead.id,
        name: lead.name,
        product_category: lead.productCategory,
        store_url: lead.storeUrl,
        rating: lead.rating,
        brief_description: lead.briefDescription,
        status: lead.status,
        added_at: lead.addedAt,
        last_interaction: lead.lastInteraction,
        business_address: lead.businessAddress,
        email: lead.email,
        phone: lead.phone,
        instagram: lead.instagram,
        website: lead.website,
        enriched: lead.enriched || false,
    };
}

async function migrate() {
    console.log('🚀 Starting migration from leads_db.json to Supabase...\n');

    // Read existing leads from file
    const dbPath = path.join(__dirname, '..', 'leads_db.json');

    if (!fs.existsSync(dbPath)) {
        console.log('⚠️  No leads_db.json found. Nothing to migrate.');
        return;
    }

    const fileData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const leads = fileData.leads || [];

    if (leads.length === 0) {
        console.log('⚠️  No leads found in leads_db.json. Nothing to migrate.');
        return;
    }

    console.log(`📦 Found ${leads.length} leads in leads_db.json`);

    // Transform leads to database format
    const dbLeads = leads.map(transformToDb);

    // Insert into Supabase
    console.log('🔄 Inserting leads into Supabase...');

    const { data, error } = await supabase
        .from('leads')
        .upsert(dbLeads, { onConflict: 'id' });

    if (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    console.log(`✅ Successfully migrated ${leads.length} leads to Supabase!`);
    console.log('\n📊 Migration Summary:');
    console.log(`   - Total leads migrated: ${leads.length}`);
    console.log(`   - Status breakdown:`);

    const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {});

    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     • ${status}: ${count}`);
    });

    console.log('\n✨ Migration complete! Your data is now in Supabase.');
    console.log('💡 The leads_db.json file will remain as a backup.');
}

migrate().catch(console.error);
