import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// For local development, we store leads in a JSON file in the project root
// In production (Vercel), this will reset on deploy, so a real DB would be better
// But for local SDR usage, this is 100% persistent and browser-independent.
const DB_PATH = path.join(process.cwd(), 'leads_db.json');

function readDb() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { leads: [] };
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading leads DB:', error);
        return { leads: [] };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to leads DB:', error);
        return false;
    }
}

export async function GET() {
    const data = readDb();
    return NextResponse.json(data);
}

export async function POST(req) {
    try {
        const { leads } = await req.json();
        const success = writeDb({ leads });

        if (success) {
            return NextResponse.json({ message: 'Leads synced to server storage' });
        } else {
            throw new Error('Failed to write to file system');
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
