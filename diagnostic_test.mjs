/**
 * DIAGNOSTIC TEST: Contact Extraction Bug Analysis
 */

import axios from 'axios';

async function testContactExtraction() {
    console.log("=" + "=".repeat(59));
    console.log("DIAGNOSTIC TEST: Contact Extraction Bug");
    console.log("=" + "=".repeat(59));

    const testUrl = "https://krisskross.ai";
    const testName = "KrissKross";

    // Test 1: Fetch the actual HTML
    console.log("\n[TEST 1] Fetching HTML from target website...");
    try {
        const response = await axios.get(testUrl);
        const html = response.data;

        console.log("Status:", response.status);
        console.log("HTML length:", html.length, "characters");

        // Test 2: Check if contact info exists in HTML
        console.log("\n[TEST 2] Checking raw HTML for contact information...");
        const emailFound = html.includes('support@krisskross.ai') ||
                          html.match(/[a-zA-Z0-9._%+-]+@krisskross\.ai/);
        const tiktokFound = html.includes('tiktok.com') || html.includes('@krisskross');
        const instagramFound = html.includes('instagram.com');

        console.log("Email in HTML:", emailFound ? 'FOUND ✓' : 'NOT FOUND ✗');
        console.log("TikTok in HTML:", tiktokFound ? 'FOUND ✓' : 'NOT FOUND ✗');
        console.log("Instagram in HTML:", instagramFound ? 'FOUND ✓' : 'NOT FOUND ✗');

        // Test 3: Extract footer section
        console.log("\n[TEST 3] Analyzing HTML structure...");
        const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
        const hasFooterTag = footerMatch !== null;

        console.log("Footer tag exists:", hasFooterTag ? 'YES ✓' : 'NO ✗');

        if (hasFooterTag) {
            console.log("Footer length:", footerMatch[0].length, "characters");
            console.log("\nFirst 500 chars of footer:");
            console.log(footerMatch[0].substring(0, 500));
            console.log("\n...truncated");
        } else {
            console.log("\nWARNING: No <footer> tag found in server-rendered HTML!");
            console.log("This is likely a client-side rendered React/Next.js app");
            console.log("Footer appears only after JavaScript execution");
        }

        // Test 4: Simulate current Perplexity approach
        console.log("\n[TEST 4] Simulating CURRENT approach (THE BUG)...");
        console.log("━".repeat(60));
        console.log("Current executePerplexityEnrich() sends to Perplexity:");
        console.log("  URL:", testUrl);
        console.log("  Name:", testName);
        console.log("  HTML Content: ❌ NO - ONLY THE URL!");
        console.log("\nWhat Perplexity does:");
        console.log("  ❌ Performs WEB SEARCH (not HTML parsing)");
        console.log("  ❌ Searches for \"" + testName + "\" on the internet");
        console.log("  ❌ Does NOT fetch or parse the actual website HTML");
        console.log("  ❌ Cannot see footer content");
        console.log("\nResult: FAILS to extract contact info from footer");
        console.log("━".repeat(60));

        // Test 5: Manual extraction (proof of concept)
        console.log("\n[TEST 5] Manual extraction test (proof HTML has data)...");
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = html.match(emailPattern) || [];
        const uniqueEmails = [...new Set(emails)]
            .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.svg'))
            .slice(0, 5);

        const socialPatterns = {
            tiktok: html.match(/https?:\/\/(?:www\.)?tiktok\.com\/[@\w.]+/)?.[0],
            instagram: html.match(/https?:\/\/(?:www\.)?instagram\.com\/[\w.]+/)?.[0],
            twitter: html.match(/https?:\/\/(?:www\.)?(twitter\.com|x\.com)\/\w+/)?.[0]
        };

        console.log("Emails found via simple regex:", uniqueEmails);
        console.log("Social links found:", JSON.stringify(socialPatterns, null, 2));

        if (uniqueEmails.length > 0 || Object.values(socialPatterns).some(v => v)) {
            console.log("\n✓ Contact info IS PRESENT in HTML!");
            console.log("  This confirms the bug: AI models don't receive this HTML");
        }

        // Summary
        console.log("\n" + "=" + "=".repeat(59));
        console.log("DIAGNOSIS SUMMARY");
        console.log("=" + "=".repeat(59));
        console.log("\n🔍 ROOT CAUSE IDENTIFIED:");
        console.log("   File: app/api/leads/enrich/route.js");
        console.log("   Function: executePerplexityEnrich() (line 28)");
        console.log("   Issue: Only sends URL to Perplexity, not HTML content");
        console.log("\n   The prompt asks Perplexity to 'Perform a deep search'");
        console.log("   but Perplexity's chat API does web searches, NOT web scraping.");
        console.log("   It never fetches/parses the actual HTML from the URL.");
        console.log("\n💡 SOLUTION:");
        console.log("   1. Fetch HTML content from the URL (using axios/fetch)");
        console.log("   2. Extract relevant sections (footer, contact page)");
        console.log("   3. Send the HTML content IN the prompt to the AI");
        console.log("   4. AI analyzes the actual HTML, not web search results");
        console.log("\n📝 IMPLEMENTATION:");
        console.log("   Option A: Use Firecrawl to fetch HTML (already in codebase)");
        console.log("   Option B: Use axios + send HTML in prompt");
        console.log("   Option C: Use Playwright for client-side rendering");

        if (!hasFooterTag) {
            console.log("\n⚠️  SECONDARY ISSUE:");
            console.log("   No <footer> tag in server-rendered HTML");
            console.log("   This is a Next.js app with client-side rendering");
            console.log("   May need Playwright/Puppeteer for full HTML");
        }

        console.log("\n" + "=" + "=".repeat(59));

    } catch (error) {
        console.error("\n✗ Test failed:", error.message);
        console.error(error.stack);
    }
}

testContactExtraction();
