import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Create a single supabase client for interacting with your database
// Use dummy values if not configured to prevent build errors
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Log warning if not configured (only in browser)
if (typeof window !== 'undefined' && !isSupabaseConfigured()) {
    console.warn('⚠️ Supabase credentials not found. Using file-based storage. See docs/SUPABASE_SETUP.md for setup instructions.');
}

