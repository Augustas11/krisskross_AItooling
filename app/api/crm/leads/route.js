import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Fallback file-based storage for when Supabase is not configured
const DB_PATH = path.join(process.cwd(), 'leads_db.json');

// File-based fallback functions
function readDb() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { leads: [] };
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ [FILE] Error reading leads DB:', error);
        return { leads: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ [FILE] Error writing to leads DB:', error);
        return false;
    }
}

// Transform Supabase row to frontend format
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
    };
}

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
        tiktok: lead.tiktok,
        website: lead.website,
        enriched: lead.enriched || false,
    };
}

export async function GET() {
    console.log('📥 [API] GET /api/crm/leads');

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
        console.log('⚠️ [API] Supabase not configured, using file-based storage');
        const data = readDb();
        return NextResponse.json(data);
    }

    try {
        console.log('🔄 [SUPABASE] Fetching leads from database...');
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ [SUPABASE] Error fetching leads:', error);
            throw error;
        }

        const leads = data.map(transformFromDb);
        console.log(`✅ [SUPABASE] Fetched ${leads.length} leads`);

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('❌ [SUPABASE] Falling back to file storage:', error.message);
        // Fallback to file-based storage
        const data = readDb();
        return NextResponse.json(data);
    }
}

export async function POST(req) {
    console.log('💾 [API] POST /api/crm/leads');

    try {
        const { leads } = await req.json();
        console.log(`📦 [API] Received ${leads.length} leads to sync`);

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            console.log('⚠️ [API] Supabase not configured, using file-based storage');
            const success = writeDb({ leads });
            if (success) {
                return NextResponse.json({ message: 'Leads synced to file storage' });
            } else {
                throw new Error('Failed to write to file system');
            }
        }

        // Use Supabase
        console.log('🔄 [SUPABASE] Syncing leads to database...');

        // --- SAFETY CHECK ---
        // Get current count to prevent accidental wipeouts
        const { count: currentCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (currentCount > 10 && leads.length === 0) {
            console.error(`🚨 [SAFETY] Aborting sync. Attempting to wipe ${currentCount} leads with an empty list.`);
            return NextResponse.json({
                error: 'Safety Block: Attempting to sync 0 leads while DB has data. If you really want to clear the CRM, please delete leads individually.',
                currentCount
            }, { status: 403 });
        }

        // Delete all existing leads and insert new ones (full sync approach)
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .neq('id', 'placeholder_non_existent'); // Delete all rows

        if (deleteError) {
            console.error('❌ [SUPABASE] Error deleting old leads:', deleteError);
            throw deleteError;
        }

        // Insert all leads
        if (leads.length > 0) {
            const dbLeads = leads.map(transformToDb);
            const { error: insertError } = await supabase
                .from('leads')
                .insert(dbLeads);

            if (insertError) {
                console.error('❌ [SUPABASE] Error inserting leads:', insertError);
                throw insertError;
            }

            // --- DATA TIME MACHINE: INTERNAL BACKUP ---
            // Save a full snapshot of the current state to the backups table
            try {
                const { error: backupError } = await supabase
                    .from('leads_backups')
                    .insert([{
                        snapshot_data: leads,
                        lead_count: leads.length,
                        source: 'auto_sync'
                    }]);

                if (backupError) {
                    console.warn('⚠️ [BACKUP] Internal snapshot failed (Table might not exist yet):', backupError.message);
                } else {
                    console.log('📦 [BACKUP] Internal snapshot created successfully.');

                    // Cleanup: Keep only last 20 snapshots
                    const { data: oldBackups } = await supabase
                        .from('leads_backups')
                        .select('id')
                        .order('created_at', { ascending: false })
                        .range(20, 100);

                    if (oldBackups && oldBackups.length > 0) {
                        const idsToDelete = oldBackups.map(b => b.id);
                        await supabase.from('leads_backups').delete().in('id', idsToDelete);
                    }
                }
            } catch (backupErr) {
                console.warn('⚠️ [BACKUP] Critical backup logic failed:', backupErr.message);
            }
        }

        console.log(`✅ [SUPABASE] Successfully synced ${leads.length} leads (Previous count: ${currentCount})`);

        // Also save to file as local mirror/backup
        try {
            writeDb({ leads, last_sync: new Date().toISOString() });
        } catch (fsError) {
            console.warn('⚠️ [API] Local backup failed:', fsError.message);
        }

        return NextResponse.json({
            message: 'Leads synced + Internal Snapshot Saved',
            count: leads.length,
            previousCount: currentCount
        });
    } catch (error) {
        console.error('❌ [API] Error syncing leads:', error);

        // Try fallback to file storage
        try {
            const { leads } = await req.json();
            const success = writeDb({ leads });
            if (success) {
                return NextResponse.json({
                    message: 'Leads synced to file storage (Supabase failed)',
                    warning: error.message
                });
            }
        } catch (fallbackError) {
            console.error('❌ [API] Fallback also failed:', fallbackError);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
