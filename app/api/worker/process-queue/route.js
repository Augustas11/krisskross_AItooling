import { createClient } from '@supabase/supabase-js';
import { enrichAndTagLead } from '@/lib/tags/enrichment';
import { NextResponse } from 'next/server';

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        console.log('👷 [WORKER v2] Checking queue (SQL Bypass + Public Schema + Flat)...');

        // 1. Fetch highest priority pending item using raw SQL with PUBLIC schema prefix
        // Flattened selection to avoid row_to_json issues
        const fetchSQL = `
      SELECT 
        eq.id as queue_id, 
        eq.attempts, 
        l.* 
      FROM public.enrichment_queue eq 
      JOIN public.leads l ON eq.lead_id = l.id 
      WHERE eq.status = 'pending' 
      ORDER BY eq.priority ASC, eq.created_at ASC 
      LIMIT 1
    `;

        const { data: fetchResult, error: fetchError } = await supabase.rpc('exec_sql', { sql: fetchSQL.trim() });

        if (fetchError || (fetchResult && !fetchResult.success)) {
            console.error('Fetch Error:', fetchError || fetchResult?.error);
            return NextResponse.json({ error: fetchError?.message || fetchResult?.error }, { status: 500 });
        }

        const rows = fetchResult.data;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'Queue empty', processed: false }, { status: 200 });
        }

        const item = rows[0];
        const lead = item; // item contains lead data + queue_id merged
        const queueId = item.queue_id;

        // 2. Mark as PROCESSING via SQL
        await supabase.rpc('exec_sql', {
            sql: `UPDATE public.enrichment_queue SET status = 'processing', updated_at = NOW() WHERE id = '${queueId}'`
        });

        console.log(`🚀 [WORKER] Processing item ${queueId} for lead ${lead.email || lead.id}...`);

        try {
            // 3. Run Enrichment
            const enrichedLead = await enrichAndTagLead(lead);

            // 4. Save Enriched Data to DB
            // We use exec_sql to bypass any RLS issues and ensure we use the same reliable channel
            // We must carefully escape strings.

            const escapeSql = (str) => {
                if (str === null || str === undefined) return 'NULL';
                if (typeof str === 'string') return `'${str.replace(/'/g, "''")}'`;
                if (typeof str === 'object') return `'${JSON.stringify(str).replace(/'/g, "''")}'::jsonb`; // JSONB casting
                if (typeof str === 'number' && Number.isNaN(str)) return 'NULL';
                return str; // numbers, booleans
            };

            const updateSql = `
        UPDATE public.leads SET
          enrichment_status = 'complete',
          enrichment_last_attempt = NOW(),
          ai_research_summary = ${escapeSql(enrichedLead.ai_research_summary)},
          tags = ARRAY[${(enrichedLead.tags || []).map(t => typeof t === 'string' ? `'${t.replace(/'/g, "''")}'` : `'${JSON.stringify(t).replace(/'/g, "''")}'`).join(',')}],
          email = ${escapeSql(enrichedLead.email)},
          phone = ${escapeSql(enrichedLead.phone)},
          business_address = ${escapeSql(enrichedLead.location)},
          website = ${escapeSql(enrichedLead.website)},
          instagram = ${escapeSql(enrichedLead.instagram)},
          tiktok = ${escapeSql(enrichedLead.tiktok)},
          product_category = ${escapeSql(enrichedLead.productCategory)},
          instagram_followers = ${escapeSql(enrichedLead.instagramFollowers)},
          engagement_rate = ${escapeSql(enrichedLead.engagementRate)},
          posting_frequency = ${escapeSql(enrichedLead.posting_frequency)},
          enrichment_history = ${escapeSql(enrichedLead.enrichmentHistory)}
        WHERE id = '${lead.id}'
      `;

            const { data: updateResult, error: rpcError } = await supabase.rpc('exec_sql', { sql: updateSql });

            const updateError = rpcError || (updateResult && !updateResult.success ? updateResult.error : null);

            if (updateError) {
                throw new Error(`Failed to save lead update: ${typeof updateError === 'object' ? JSON.stringify(updateError) : updateError}`);
            }

            // 5. Mark Queue as COMPLETED via SQL
            await supabase.rpc('exec_sql', {
                sql: `UPDATE public.enrichment_queue SET status = 'completed', updated_at = NOW() WHERE id = '${queueId}'`
            });


            console.log(`✅ [WORKER] Successfully enriched lead ${lead.id}`);
            return NextResponse.json({ success: true, processed: true, leadId: lead.id });

        } catch (processError) {
            console.error(`❌ [WORKER] Enrichment failed for ${lead.id}:`, processError);

            // 5. Handle Failure
            const newAttempts = (item.attempts || 0) + 1;
            const status = newAttempts >= 3 ? 'failed' : 'pending';
            // Simple escape single quotes
            const safeError = (processError.message || String(processError)).replace(/'/g, "''");
            const errorEntry = JSON.stringify({ timestamp: new Date().toISOString(), error: safeError }).replace(/'/g, "''");

            await supabase.rpc('exec_sql', {
                sql: `UPDATE public.enrichment_queue SET 
                    status = '${status}', 
                    attempts = ${newAttempts}, 
                    last_attempt = NOW(),
                    error_log = coalesce(error_log, '[]'::jsonb) || '${errorEntry}'::jsonb
                  WHERE id = '${queueId}'`
            });

            return NextResponse.json({
                success: false,
                error: processError.message,
                retry: status === 'pending'
            }, { status: 500 });
        }

    } catch (err) {
        console.error('🔥 [WORKER] Fatal Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
