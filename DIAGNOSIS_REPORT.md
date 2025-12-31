# Contact Extraction Bug - Root Cause Analysis

## Problem Statement
AI models (Perplexity, Grok) fail to extract contact information (emails, Instagram, TikTok, social links) from website footers, despite the information being clearly visible on the target websites.

## Root Cause Identified

### File: `app/api/leads/enrich/route.js`
### Function: `executePerplexityEnrich()` (line 28-106)

**The Critical Bug:**
The function sends ONLY the URL to Perplexity's chat API and asks it to "Perform a deep search". However, Perplexity's chat completion endpoint performs **web searches**, NOT web scraping or HTML parsing.

### Current Implementation (Broken):
```javascript
const prompt = `Perform a deep search for the business "${name}" (Website: ${url}).

TASKS:
1. Find Contact Info: Email (full domain), Phone, Physical Address.
2. Find Social Profiles: Instagram, TikTok, YouTube, Facebook.

CRITICAL INSTRUCTIONS:
- PRIORITY 1: key links found on the website footer/header/contact page.
...`;

const response = await fetch('https://api.perplexity.ai/chat/completions', {
    // Only sends URL and name, NO HTML CONTENT
});
```

**What Actually Happens:**
1. Perplexity receives the URL as text in the prompt
2. Perplexity performs a web search for the business name
3. Perplexity does NOT fetch the HTML from the URL
4. Perplexity does NOT parse the footer section
5. Perplexity returns search results, missing footer-specific contact info

## Evidence

### Code Analysis:
- **Line 29-59**: Prompt only contains URL string, no HTML content
- **Line 61-74**: Perplexity API call sends only the text prompt
- **No HTML fetching**: Code never fetches HTML before calling Perplexity

### Comparison with Working Pattern:
In `app/api/leads/source/route.js` (lines 186-224), the code correctly:
1. Uses Perplexity to FETCH content first
2. Gets the actual HTML/text content
3. Passes that content to Grok for analysis

This two-step pattern works because the AI receives actual HTML content to analyze.

## Solution

### Implementation Strategy:
Use Firecrawl (already in dependencies) to fetch and render the HTML, then send the HTML content to the AI model for extraction.

### Modified Flow:
```
1. Fetch HTML using Firecrawl (handles JavaScript rendering)
2. Extract footer/contact page HTML
3. Send HTML content IN the prompt to Perplexity/Grok
4. AI analyzes actual HTML and extracts contact info
```

### Why This Works:
- ✅ AI receives actual HTML content
- ✅ Footer section is visible to the AI
- ✅ Social links are in the HTML text
- ✅ Email addresses are in the HTML text
- ✅ AI can pattern match and extract accurately

## Files to Modify

1. **app/api/leads/enrich/route.js**
   - Modify `executePerplexityEnrich()` to fetch HTML first
   - Modify `executeGrokEnrich()` to accept HTML content
   - Update prompts to analyze HTML, not search the web

## Implementation Options

### Option A: Use Firecrawl (Recommended)
- Already in dependencies (`@mendable/firecrawl-js`)
- Handles JavaScript rendering
- Returns clean HTML
- Used successfully in `source/route.js`

### Option B: Use axios + HTML parser
- Simpler but doesn't handle JavaScript
- May miss client-side rendered content
- Cheaper (no API costs)

### Option C: Hybrid Approach
- Try Firecrawl first
- Fallback to direct axios fetch if Firecrawl fails
- Best reliability

## Expected Results After Fix

- ✅ Extracts emails from footer
- ✅ Extracts TikTok links from footer
- ✅ Extracts Instagram links from footer
- ✅ Works on client-side rendered sites
- ✅ More reliable extraction overall

## Secondary Issue

**Client-Side Rendering:**
Some websites (like krisskross.ai built with Next.js) render footer content client-side. Simple HTTP fetch returns HTML without footer. Firecrawl solves this by rendering JavaScript before extracting content.
