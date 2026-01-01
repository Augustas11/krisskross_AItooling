
import { ApifyClient } from 'apify-client';

let apifyClientInstance = null;

export const getApifyClient = () => {
    if (!apifyClientInstance) {
        const token = process.env.APIFY_API_TOKEN;
        if (!token) {
            console.warn('⚠️ [Apify] No APIFY_API_TOKEN found in environment variables. Enrichment may fail.');
        }
        apifyClientInstance = new ApifyClient({
            token: token,
        });
    }
    return apifyClientInstance;
};
