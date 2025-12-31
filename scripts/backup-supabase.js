#!/usr/bin/env node

/**
 * Backup script to capture a snapshot of Supabase CRM data
 * Usage: node scripts/backup-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runBackup() {
    console.log('🚀 Initiating Database Snapshot...');

    try {
        // Fetch ALL leads
        const { data, error, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });

        if (error) throw error;

        console.log(`📦 Successfully retrieved ${count} leads from Supabase.`);

        // Ensure backup directory exists
        const backupDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `leads_backup_${timestamp}.json`;
        const filePath = path.join(backupDir, filename);

        // Save file
        const payload = {
            snapshot_at: new Date().toISOString(),
            count: data.length,
            leads: data
        };

        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

        console.log(`✅ Backup saved to: ${filePath}`);

        // Keep only last 10 backups to save space
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('leads_backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 10) {
            console.log('🧹 Cleaning up old backups...');
            files.slice(10).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f.name));
                console.log(`   Deleleted old backup: ${f.name}`);
            });
        }

        console.log('✨ Backup process complete.');
    } catch (err) {
        console.error('❌ Backup failed:', err.message);
        process.exit(1);
    }
}

runBackup();
