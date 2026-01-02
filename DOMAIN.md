# DOMAIN.md - Business Logic & Lead Lifecycle

## The KrissKross AI Tooling Mission
To automate the discovery, enrichment, and outreach of high-value leads for KrissKross (an image-to-video AI platform).

## The Lead Lifecycle
1. **Discovery:** Finding raw data (URL, Name, Store) from platforms like Amazon or eBay.
2. **Enrichment:** Using AI (Perplexity/Grok) to find social handles, emails, and brand details.
3. **Scoring:** Assigning a quantitative value (0-100) based on social presence and brand fit.
4. **CRM:** Moving leads from "Discovered" to "Saved" for long-term tracking.
5. **Outreach:** Automatically crafting and sending personalized pitches via email.

## Key Technical Concepts
- **Fast Scrape vs. Deep Hunt:** 
    - *Fast Scrape:* Quick, high-volume extraction from search/listing pages.
    - *Deep Hunt:* Slower, high-quality investigation of a specific brand's digital footprint.
- **Smart Mode:** An automated layer that decides between Fast/Deep based on the URL type.
- **Intelligence Tags:** Automated labels (e.g., "High Social Impact", "Storefront") generated during enrichment.

## Strategic Guardrails
- **Data Integrity:** Never perform bulk operations (Delete/Overwrite) without a granular backup first.
- **Cost Sensitivity:** Prioritize efficient scraping methods; only upgrade to "Deep Hunt" or high-token AI calls when high confidence is established.
- **User Impact:** The UI should be outcome-focued (Leads) rather than tech-focused (Scrapers).
