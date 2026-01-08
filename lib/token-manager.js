/**
 * Token Manager - Handles secure token storage and refresh
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy-initialized Supabase client
let supabaseClient = null;

/**
 * Get or create Supabase client
 */
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ TokenManager: SUPABASE_URL or SERVICE_ROLE_KEY missing');
        return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey() {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
        console.error('❌ TokenManager: TOKEN_ENCRYPTION_KEY missing');
        return null;
    }
    return key;
}


/**
 * Store the long-lived access token in the database (encrypted)
 * @param {string} accessToken - The long-lived token starting with EAAQ...
 * @param {number} expiresIn - Seconds until expiration (usually ~5184000 for 60 days)
 */
export async function storeToken(accessToken, expiresIn) {
    const supabase = getSupabaseClient();
    const encryptionKey = getEncryptionKey();

    if (!supabase) return { success: false, error: 'Supabase client not initialized' };
    if (!encryptionKey) return { success: false, error: 'Encryption key missing' };

    try {
        const encrypted = encryptToken(accessToken, encryptionKey);
        // Calculate expiry date. expiresIn is in seconds.
        const expiresAt = new Date(Date.now() + (expiresIn * 1000));

        const { error } = await supabase
            .from('instagram_credentials')
            .upsert({
                id: '550e8400-e29b-41d4-a716-446655440000', // Singleton UUID
                app_id: process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID,
                access_token: encrypted,
                token_expires_at: expiresAt.toISOString(),
                connection_status: 'connected',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            });

        if (error) throw error;

        console.log('✓ Token stored securely in database');
        return { success: true };
    } catch (error) {
        console.error('Failed to store token:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieve and decrypt the access token
 * Performs auto-refresh if token is nearing expiration (within 10 days)
 */
export async function getToken() {
    const supabase = getSupabaseClient();
    const encryptionKey = getEncryptionKey();

    if (!supabase) {
        console.error('TokenManager.getToken: Supabase client not available');
        return null;
    }
    if (!encryptionKey) {
        console.error('TokenManager.getToken: Encryption key not available');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('instagram_credentials')
            .select('access_token, token_expires_at')
            .eq('id', '550e8400-e29b-41d4-a716-446655440000')
            .single();

        if (error || !data) {
            console.warn('Token not found in database:', error?.message);
            return null;
        }

        // Decrypt immediately to use or refresh
        const currentToken = decryptToken(data.access_token, encryptionKey);

        // Check if refresh needed (within 10 days of expiry)
        const expiresAt = new Date(data.token_expires_at);
        const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
        const refreshThreshold = new Date(Date.now() + tenDaysInMs);

        if (expiresAt < refreshThreshold) {
            console.log('Token nearing expiration, attempting refresh...');
            const refreshResult = await refreshToken(currentToken);
            if (refreshResult.success) {
                return refreshResult.token;
            } else {
                console.error('Token refresh failed, returning old token as fallback.');
            }
        }

        return currentToken;

    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
}

/**
 * Refresh the long-lived token using Facebook Graph API
 */
export async function refreshToken(currentToken) {
    try {
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;

        if (!appId || !appSecret) {
            throw new Error('FACEBOOK_APP_ID or FACEBOOK_APP_SECRET missing');
        }

        const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.access_token) {
            // Store the new token
            // result.expires_in is seconds remaining
            await storeToken(result.access_token, result.expires_in);
            console.log('✓ Token refreshed successfully');
            return { success: true, token: result.access_token };
        } else {
            throw new Error(result.error ? result.error.message : 'Unknown refresh error');
        }
    } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        return { success: false, error: error.message };
    }
}

// AES-256-CBC Encryption
function encryptToken(text, encryptionKey) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(encryptionKey, 'hex'); // Ensure key is buffer
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedText, encryptionKey) {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

