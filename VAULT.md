# VAULT.md - Lessons Learned & Prevention

## 🛡️ Critical Guardrails (Anti-Incident Rules)
1. **Rule #1: Database Sync Safety.** Never allow a script or component to sync an empty local array to Supabase unless a user explicitly confirms a "Delete All" action. (Ref: Incident Dec 31, 2025).
2. **Rule #2: Single Source of Truth.** Do not mix `localStorage` and `Supabase` for the same data entity. It leads to race conditions and "Last Write Wins" data loss.
3. **Rule #3: Soft Deletes.** When possible, mark records as `is_deleted = true` instead of performing a hard `DELETE` from the database.

## 💡 Best Practices
1. **Scraping Reliability:** If a "Fast Scrape" returns zero results, auto-escalate to "Deep Hunt" before giving up.
2. **API Resilience:** Enrichment calls (Perplexity) should have a retry mechanism for transient network or rate-limit errors.
3. **User Feedback:** Long-running processes (like Deep Hunt) must have a real-time status indicator (e.g., "Analyzing Brand Footprint...") to prevent the user from assuming the app has crashed.

## 🚫 Stop Doing
- **Stop using `localStorage`** for lead persistence.
- **Stop assuming** all URLs are brand pages; some are category/search pages and require different scraping logic.
- **Stop merging** new code without verifying the `useEffect` dependency arrays, as they are the primary source of infinite loops and accidental syncs.
