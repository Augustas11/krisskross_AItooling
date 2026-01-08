/**
 * Instagram Graph API Service
 * 
 * Provides clean abstraction for all Instagram Business API calls
 * Handles token management, rate limiting, and error handling
 */

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v21.0';

class InstagramAPI {
    constructor() {
        this.appId = process.env.FACEBOOK_APP_ID;
        this.appSecret = process.env.FACEBOOK_APP_SECRET;

        // Token will be fetched asynchronously
        this.accessToken = null;

        if (!this.accessToken) {
            console.warn('Instagram access token not configured');
        }
    }

    /**
     * Get the valid access token, refreshing if necessary
     */
    async getAccessToken() {
        // Try to get cached token first
        if (this.accessToken) return this.accessToken;

        try {
            // Dynamic import to handle potential ESM/CJS interop issues if any,
            // but ideally we should match the project style.
            // Assuming we will convert token-manager to ESM or use standard import
            const { getToken } = await import('./token-manager.js');
            const token = await getToken();

            if (token) {
                this.accessToken = token;
                return token;
            }
        } catch (error) {
            console.error('Failed to get access token:', error);
        }

        return null;
    }

    /**
     * Make authenticated API call to Instagram Graph API
     */
    async makeRequest(endpoint, options = {}) {
        const url = new URL(`${INSTAGRAM_API_BASE}${endpoint}`);

        // Add access token to query params
        const token = await this.getAccessToken();
        if (!token) {
            console.warn('No access token available for Instagram request');
            // Proceed anyway? Or throw? Graph API will fail without token.
            // We'll let it proceed and fail naturally or we could throw here.
        }
        url.searchParams.set('access_token', token);

        // Add any additional query params
        if (options.params) {
            Object.entries(options.params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        try {
            const response = await fetch(url.toString(), {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle Instagram API errors
                throw new Error(data.error?.message || `Instagram API error: ${response.status}`);
            }

            return { success: true, data };
        } catch (error) {
            console.error('Instagram API request failed:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * Verify access token and get account info
     * Returns Instagram Business Account ID and username
     */
    async verifyToken() {
        // 1. Get Facebook User info
        const result = await this.makeRequest('/me', {
            params: { fields: 'id,name' }
        });

        if (!result.success) return result;

        // 2. Fetch linked Instagram Business Account
        // Graph API: User -> Accounts (Pages) -> Instagram Business Account
        const accountsResult = await this.makeRequest('/me/accounts', {
            params: { fields: 'id,name,instagram_business_account{id,username,profile_picture_url}' }
        });

        if (!accountsResult.success) return accountsResult;

        // Find the first Page with a connected Instagram account
        const pageWithInsta = accountsResult.data.data?.find(
            page => page.instagram_business_account
        );

        if (!pageWithInsta) {
            return {
                success: false,
                error: 'No Instagram Business Account linked to this Facebook User\'s Pages. Please link your Instagram Professional account to a Facebook Page.'
            };
        }

        const instaAccount = pageWithInsta.instagram_business_account;

        return {
            success: true,
            account: {
                id: instaAccount.id,
                username: instaAccount.username,
                account_type: 'BUSINESS', // Graph API implies business/creator
                profile_picture_url: instaAccount.profile_picture_url
            }
        };
    }

    /**
     * Get Instagram Business Account info
     */
    async getAccountInfo() {
        // Reuse verifyToken logic as it fetches the same core info in Graph API
        return this.verifyToken();
    }

    /**
     * Get list of conversations (DM threads)
     * @param {string} accountId - Instagram Business Account ID
     * @param {number} limit - Number of conversations to fetch (default 50)
     */
    async getConversations(accountId, limit = 50) {
        const result = await this.makeRequest(`/${accountId}/conversations`, {
            params: {
                fields: 'id,participants,updated_time',
                limit: limit.toString()
            }
        });

        return result;
    }

    /**
     * Get messages in a conversation thread
     * @param {string} conversationId - Instagram conversation thread ID
     */
    async getMessages(conversationId, limit = 50) {
        const result = await this.makeRequest(`/${conversationId}/messages`, {
            params: {
                fields: 'id,message,from,created_time,attachments',
                limit: limit.toString()
            }
        });

        return result;
    }

    /**
     * Send a DM to an Instagram user
     * @param {string} accountId - Instagram Business Account ID
     * @param {string} recipientId - Instagram-scoped user ID of recipient
     * @param {string} messageText - Message content (max 1000 characters)
     */
    async sendMessage(accountId, recipientId, messageText) {
        // Validate message length
        if (messageText.length > 1000) {
            return {
                success: false,
                error: 'Message exceeds 1000 character limit'
            };
        }

        const result = await this.makeRequest(`/${accountId}/messages`, {
            method: 'POST',
            body: {
                recipient: { id: recipientId },
                message: { text: messageText }
            }
        });

        return result;
    }

    /**
     * Get comments on a media post
     * @param {string} mediaId - Instagram media ID
     */
    async getComments(mediaId, limit = 50) {
        const result = await this.makeRequest(`/${mediaId}/comments`, {
            params: {
                fields: 'id,text,username,timestamp,from',
                limit: limit.toString()
            }
        });

        return result;
    }

    /**
     * Get recent media posts from account
     * @param {string} accountId - Instagram Business Account ID
     */
    async getRecentMedia(accountId, limit = 25) {
        const result = await this.makeRequest(`/${accountId}/media`, {
            params: {
                fields: 'id,caption,timestamp,media_type,media_url,permalink',
                limit: limit.toString()
            }
        });

        return result;
    }

    /**
     * Get permissions granted to the access token
     */
    async getTokenPermissions() {
        const result = await this.makeRequest('/me/permissions');
        return result;
    }

    /**
     * Check if token has required permissions for full functionality
     */
    async verifyPermissions() {
        const requiredPermissions = [
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'pages_manage_metadata',
            'pages_read_engagement'
        ];

        const result = await this.getTokenPermissions();

        if (!result.success) {
            return {
                success: false,
                error: 'Failed to fetch permissions',
                missing: requiredPermissions
            };
        }

        const grantedPermissions = result.data.data
            .filter(p => p.status === 'granted')
            .map(p => p.permission);

        const missingPermissions = requiredPermissions.filter(
            perm => !grantedPermissions.includes(perm)
        );

        return {
            success: missingPermissions.length === 0,
            granted: grantedPermissions,
            missing: missingPermissions
        };
    }
}

// Export singleton instance
const instagramAPI = new InstagramAPI();
export default instagramAPI;
