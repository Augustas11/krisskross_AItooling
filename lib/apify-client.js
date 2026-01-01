
import { ApifyClient } from 'apify-client';

export const getApifyClient = () => {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        console.warn('⚠️ [Apify] No APIFY_API_TOKEN found in environment variables. Enrichment may fail.');
    }
    return new ApifyClient({
        token: token,
    });
};
