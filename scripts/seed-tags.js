/**
 * Seed Script - Tag Existing Leads
 * One-time script to apply tags to all existing leads in the database
 * 
 * Usage: node scripts/seed-tags.js
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { autoTagLead } from '../lib/tags/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File-based fallback
const DB_PATH = path.join(process.cwd(), 'leads_db.json');

// Transform functions (same as API route)
function transformFromDb(row) {
    return {
        id: row.id,
        name: row.name,
        productCategory: row.product_category,
        storeUrl: row.store_url,
        rating: row.rating,
        briefDescription: row.brief_description,
        status: row.status,
        addedAt: row.added_at,
        lastInteraction: row.last_interaction,
        businessAddress: row.business_address,
        email: row.email,
        phone: row.phone,
        instagram: row.instagram,
        tiktok: row.tiktok,
        website: row.website,
        enriched: row.enriched,
        score: row.score || 0,
        tier: row.tier || 'GRAY',
        tags: row.tags || [],
        instagramFollowers: row.instagram_followers,
        engagementRate: row.engagement_rate,
        postingFrequency: row.posting_frequency,
        scoreBreakdown: row.score_breakdown,
        lastScoredAt: row.last_scored_at,
        lastTaggedAt: row.last_tagged_at
    };
}

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
        posting_frequency: lead.postingFrequency,
        score_breakdown: lead.scoreBreakdown || {},
        last_scored_at: lead.lastScoredAt,
        last_tagged_at: lead.lastTaggedAt
    };
}

async function seedTags() {
    console.log('🌱 [SEED] Starting tag seeding process...\n');

    let leads = [];
    let useSupabase = false;

    // Fetch leads from Supabase or file
    if (isSupabaseConfigured()) {
        console.log('📊 [SEED] Fetching leads from Supabase...');
        const { data, error } = await supabase
            .from('leads')
            .select('*');

        if (error) {
            console.error('❌ [SEED] Error fetching from Supabase:', error);
            console.log('⚠️ [SEED] Falling back to file-based storage...');
        } else {
            leads = data.map(transformFromDb);
            useSupabase = true;
            console.log(`✅ [SEED] Fetched ${leads.length} leads from Supabase\n`);
        }
    }

    // Fallback to file if Supabase failed or not configured
    if (!useSupabase) {
        console.log('📁 [SEED] Reading leads from file...');
        if (fs.existsSync(DB_PATH)) {
            const fileData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            leads = fileData.leads || [];
            console.log(`✅ [SEED] Loaded ${leads.length} leads from file\n`);
        } else {
            console.log('❌ [SEED] No leads file found');
            return;
        }
    }

    if (leads.length === 0) {
        console.log('⚠️ [SEED] No leads to tag');
        return;
    }

    // Tag all leads
    console.log(`🏷️ [SEED] Auto-tagging ${leads.length} leads...\n`);

    const taggedLeads = [];
    const stats = {
        total: leads.length,
        tagged: 0,
        errors: 0,
        errors: 0,
        tagCounts: {}
    };

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        process.stdout.write(`\r🔄 Progress: ${i + 1}/${leads.length} (${Math.round((i + 1) / leads.length * 100)}%)`);

        try {
            const tagged = await autoTagLead(lead);
            taggedLeads.push(tagged);
            stats.tagged++;

            // Count tag usage
            if (tagged.tags) {
                tagged.tags.forEach(tag => {
                    stats.tagCounts[tag.full_tag] = (stats.tagCounts[tag.full_tag] || 0) + 1;
                });
            }
        } catch (error) {
            console.error(`\n❌ [SEED] Error tagging lead ${lead.id}:`, error.message);
            taggedLeads.push(lead);
            stats.errors++;
        }
    }

    console.log('\n\n✅ [SEED] Tagging complete!\n');

    // Save back to database
    if (useSupabase) {
        console.log('💾 [SEED] Saving tagged leads to Supabase...');

        // Update in batches of 50
        const batchSize = 50;
        for (let i = 0; i < taggedLeads.length; i += batchSize) {
            const batch = taggedLeads.slice(i, i + batchSize);
            const dbBatch = batch.map(transformToDb);

            const { error } = await supabase
                .from('leads')
                .upsert(dbBatch);

            if (error) {
                console.error(`❌ [SEED] Error saving batch ${Math.floor(i / batchSize) + 1}:`, error);
            } else {
                process.stdout.write(`\r💾 Saved: ${Math.min(i + batchSize, taggedLeads.length)}/${taggedLeads.length}`);
            }
        }
        console.log('\n✅ [SEED] All leads saved to Supabase\n');
    } else {
        console.log('💾 [SEED] Saving tagged leads to file...');
        fs.writeFileSync(DB_PATH, JSON.stringify({ leads: taggedLeads }, null, 2));
        console.log('✅ [SEED] All leads saved to file\n');
    }

    // Print statistics
    console.log('📊 [SEED] Tagging Statistics:');
    console.log('═'.repeat(50));
    console.log(`Total Leads:       ${stats.total}`);
    console.log(`Successfully Tagged: ${stats.tagged}`);
    console.log(`Errors:            ${stats.errors}`);
    console.log(`Errors:            ${stats.errors}`);
    console.log('');
    console.log('Top 10 Most Common Tags:');
    const sortedTags = Object.entries(stats.tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    sortedTags.forEach(([tag, count]) => {
        const percentage = Math.round(count / stats.total * 100);
        console.log(`  ${tag.padEnd(30)} ${count} (${percentage}%)`);
    });
    console.log('═'.repeat(50));
    console.log('\n✅ [SEED] Seed process complete!');
}

// Run the seed script
seedTags().catch(error => {
    console.error('❌ [SEED] Fatal error:', error);
    process.exit(1);
});
