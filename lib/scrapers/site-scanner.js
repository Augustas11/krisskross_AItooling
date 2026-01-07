/**
 * Lightweight Website Scanner
 * Scans a given URL for social media links (Instagram, Facebook, LinkedIn, etc.)
 * Uses Regex to avoid heavy dependencies like Puppeteer/Cheerio for this simple task.
 */

export async function scanForSocials(url) {
    if (!url) return null;

    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
        targetUrl = `https://${targetUrl}`;
    }

    console.log(`[SITE-SCAN] Scanning ${targetUrl} for social links...`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[SITE-SCAN] Failed to fetch ${targetUrl}: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const results = {
            instagram: null,
            linkedin: null,
            facebook: null,
            twitter: null,
            tiktok: null,
            email: null
        };

        // --- Regex Patterns ---
        // Instagram: Matches instagram.com/username, ignoring query params like ?hl=en
        // [^"']* matches any character that is NOT a quote until the closing quote
        const instaRegex = /href=["'](?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)[^"']*["']/i;

        // LinkedIn: Matches linkedin.com/company/name or /in/name
        const linkedinRegex = /href=["'](?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9-%.]+)[^"']*["']/i;

        // Facebook: Matches facebook.com/pagename
        const fbRegex = /href=["'](?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9-.]+)[^"']*["']/i;

        // Tiktok
        const tiktokRegex = /href=["'](?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([a-zA-Z0-9_.]+)[^"']*["']/i;

        // Email: mailto:
        const emailRegex = /href=["']mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)["']/i;


        // Apply Regex
        const instaMatch = html.match(instaRegex);
        if (instaMatch) results.instagram = instaMatch[1];

        const linkedinMatch = html.match(linkedinRegex);
        if (linkedinMatch) results.linkedin = linkedinMatch[1]; // Handle or ID

        const fbMatch = html.match(fbRegex);
        if (fbMatch) results.facebook = fbMatch[1];

        const tiktokMatch = html.match(tiktokRegex);
        if (tiktokMatch) results.tiktok = tiktokMatch[1];

        const emailMatch = html.match(emailRegex);
        if (emailMatch) results.email = emailMatch[1];

        console.log(`[SITE-SCAN] Results for ${targetUrl}:`, JSON.stringify(results));

        // Filter out "p", "reel", "explore" from False Positives for Instagram if needed, 
        // but the regex excludes them implicitly by looking for direct path? 
        // Actually my regex `instagram.com/([a-zA-Z0-9_.]+)` captures "p" if the link is instagram.com/p/123.
        // Let's refine validation slightly for Instagram
        if (results.instagram && ['p', 'reel', 'stories', 'explore'].includes(results.instagram)) {
            results.instagram = null;
        }

        return results;

    } catch (error) {
        console.error(`[SITE-SCAN] Error scanning ${targetUrl}:`, error.message);
        return null;
    }
}
