
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB_PATH = path.join(__dirname, '../leads_db.json');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Transform frontend format to Supabase row (Reuse logic from API)
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
        tiktok: lead.tiktok,
        website: lead.website,
        enriched: lead.enriched || false,
        score: lead.score || 0,
        tier: lead.tier || 'GRAY',
        tags: lead.tags || [],
        instagram_followers: lead.instagramFollowers,
        engagement_rate: lead.engagementRate,
        score_breakdown: lead.scoreBreakdown || {},
        last_scored_at: lead.lastScoredAt
    };
}

async function restore() {
    console.log('📂 Reading local DB...');
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ leads_db.json not found!');
        return;
    }

    const fileData = fs.readFileSync(DB_PATH, 'utf8');
    const json = JSON.parse(fileData);
    const leads = json.leads || [];

    console.log(`✅ Found ${leads.length} leads in local JSON file.`);

    if (leads.length === 0) {
        console.warn('⚠️ No leads to restore.');
        return;
    }

    // Safety: only restore if we have a decent number (or user confirms, but here we assume yes since user complained)
    console.log('🔄 Wiping DB and Restoring...');

    // 1. Delete all
    const { error: delError } = await supabase
        .from('leads')
        .delete()
        .neq('id', 'placeholder');

    if (delError) {
        console.error('❌ Error clearing DB:', delError);
        return;
    }

    // 2. Insert all
    const dbLeads = leads.map(transformToDb);
    const { error: insertError } = await supabase
        .from('leads')
        .insert(dbLeads);

    if (insertError) {
        console.error('❌ Error inserting restored leads:', insertError);
        return;
    }

    console.log(`🚀 SUCCESSFULLY RESTORED ${leads.length} LEADS TO SUPABASE!`);
}

restore();
