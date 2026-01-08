/**
 * Token Manager - Handles secure token storage and refresh
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize with a fallback to allow basic script usage if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ TokenManager: SUPABASE_URL or SERVICE_ROLE_KEY missing. Database operations will fail.');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Get encryption key with fallback warning
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.warn('⚠️ TokenManager: TOKEN_ENCRYPTION_KEY missing. Token storage will be insecure or fail.');
}

/**
 * Store the long-lived access token in the database (encrypted)
 * @param {string} accessToken - The long-lived token starting with EAAQ...
 * @param {number} expiresIn - Seconds until expiration (usually ~5184000 for 60 days)
 */
export async function storeToken(accessToken, expiresIn) {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };
    if (!ENCRYPTION_KEY) return { success: false, error: 'Encryption key missing' };

    try {
        const encrypted = encryptToken(accessToken);
        // Calculate expiry date. expiresIn is in seconds.
        const expiresAt = new Date(Date.now() + (expiresIn * 1000));

        const { error } = await supabase
            .from('instagram_credentials')
            .upsert({
                id: 'primary', // Singleton record for likely single account usage
                access_token: encrypted,
                token_expires_at: expiresAt.toISOString(),
                connection_status: 'connected',
                updated_at: new Date().toISOString(),
                encryption_version: 1
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
    if (!supabase) return null;
    if (!ENCRYPTION_KEY) return null;

    try {
        const { data, error } = await supabase
            .from('instagram_credentials')
            .select('access_token, token_expires_at')
            .eq('id', 'primary')
            .single();

        if (error || !data) {
            console.warn('Token not found in database:', error?.message);
            return null;
        }

        // Decrypt immediately to use or refresh
        const currentToken = decryptToken(data.access_token);

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
function encryptToken(text) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex'); // Ensure key is buffer
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedText) {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
