# Scripts Directory Reference

> **Last Updated:** 2026-01-12  
> **Purpose:** Inventory of all scripts with usage status and purpose

---

## ⚡ Quick Reference (Most Used)

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-supabase.js` | Backup leads to local JSON | `npm run backup` |
| `seed-tags.js` | Initialize lead tags | `node scripts/seed-tags.js` |
| `send-test-email.js` | Verify SMTP config | `node scripts/send-test-email.js` |
| `test-apify.js` | Test scraping connection | `node scripts/test-apify.js` |

---

## 🟢 Active Scripts (Safe to Use)

### Database & Backup
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `backup-supabase.js` | Export leads to `/backups/*.json` | Daily or before risky operations |
| `restore-from-local.js` | Restore leads from local backup | Emergency recovery |
| `migrate-to-supabase.js` | Sync local data to Supabase | One-time migration (DONE) |

### Seeding & Setup
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `seed-tags.js` | Create default lead tags | New environment setup |
| `seed-users.js` | Create test users | Development only |
| `setup-instagram-credentials.js` | Configure Instagram tokens | After token refresh |

### Verification & Testing
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `send-test-email.js` | Test SMTP connection | After email config changes |
| `test-apify.js` | Verify Apify scraper | After API key changes |
| `test-instagram-connection.js` | Test IG Graph API | Debugging sync issues |
| `test-email-flow.js` | End-to-end email test | After email system changes |
| `verify-instagram-integration.js` | Full IG integration check | After IG configuration |

### Analysis & Debugging
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `check-lead-stats.js` | Get lead count & stats | Reporting |
| `analyze-performance.js` | Profile API performance | Optimization |
| `audit-lead-enrichment.js` | Check enrichment quality | Data quality review |
| `verify-enriched-quality.js` | Validate enrichment data | After enrichment runs |

### Token Management (Instagram)
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `exchange-token.js` | Exchange short→long token | Token refresh flow |
| `get-long-lived-token.js` | Get 60-day IG token | After OAuth |
| `verify-graph-token.js` | Validate token status | Debugging auth issues |
| `check-token.js` | Quick token check | Before sync operations |

---

## 🟡 Utility Scripts (Use with Caution)

### Migration Runners
> ⚠️ **These apply database changes. Verify before running.**

| Script | Migration | Status |
|--------|-----------|--------|
| `apply-migrations.js` | Generic runner | Active |
| `apply-migrations-robust.js` | With better error handling | Preferred |
| `run-migration.js` | Legacy runner | Use robust version instead |
| `apply-phase1-migration.js` | Phase 1 schema | ✅ Applied Jan 3 |
| `apply-phase2-migration.js` | Phase 2 schema | ✅ Applied Jan 3 |
| `apply-phase2-affiliate.js` | Affiliate refactor | ✅ Applied Jan 3 |
| `apply-phase2-pricing-nudge.js` | Pricing nudge fields | ✅ Applied Jan 3 |
| `apply-phase2-segments.js` | Segment tables | ✅ Applied Jan 3 |
| `apply-phase3-activity-logs.js` | Activity logging | ✅ Applied Jan 3 |
| `apply-phase3-playbooks.js` | Playbook tables | ✅ Applied Jan 3 |
| `apply-phase3-settings.js` | Settings table | ✅ Applied Jan 3 |
| `run-instagram-migration.js` | Instagram tables | ✅ Applied Jan 4 |

### Queue & Enrichment
| Script | Purpose | Notes |
|--------|---------|-------|
| `generate-enrichment-queue.js` | Populate enrichment queue | Run before worker |
| `run-enrichment-worker.js` | Process enrichment jobs | Long-running |
| `monitor-queue.js` | Watch queue status | Real-time monitoring |

---

## 🔴 Deprecated Scripts (Do Not Use)

> These scripts are superseded or were one-time fixes. Delete when confident.

| Script | Reason | Replacement |
|--------|--------|-------------|
| `test-instagram-sync-old.js` | Old sync logic | Use `test-instagram-connection.js` |
| `test-sendgrid-fixed.js` | Hotfix merged | Use `test-sendgrid.js` |
| `test-triple-threat-fix.js` | Debug script | No longer needed |
| `test-triple-threat-live.js` | Debug script | No longer needed |
| `fix-exec-sql.js` | One-time fix | Already applied |
| `fix-schema-inconsistencies.js` | One-time fix | Already applied |
| `upgrade-exec-sql.js` | One-time upgrade | Already applied |
| `reload-schema.js` | Superseded | Use migrations |

---

## 🔵 Debug Scripts (Development Only)

> Useful during development but not for production use.

| Script | Purpose |
|--------|---------|
| `debug-connection.js` | Test Supabase connection |
| `debug-imap.js` | Debug IMAP email fetch |
| `debug-instagram-data.js` | Inspect IG API responses |
| `debug-pages.js` | Debug Facebook pages |
| `debug-queue-count.js` | Check queue size |
| `debug-queue-join.js` | Debug queue joins |
| `debug-worker-query-exact.js` | Debug worker queries |
| `add-dummy-lead.js` | Create test leads |
| `inspect-backups.js` | View backup contents |
| `inspect-credentials.js` | Check stored creds |

---

## 📚 Reference Scripts

| Script | Purpose |
|--------|---------|
| `compare_providers.js` | Compare AI provider outputs |
| `simulate_enrichment.js` | Mock enrichment for testing |
| `demonstrate-before-after.js` | Show enrichment improvements |
| `validate_grok_summary.js` | Validate Grok outputs |
| `validate_perplexity_summary.js` | Validate Perplexity outputs |

---

## 🛠️ Shell Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy-instagram-integration.sh` | Deploy IG to Supabase | After IG changes |
| `generate-instagram-token.sh` | Interactive token gen | Token refresh |
| `manual-deployment-guide.sh` | Deployment checklist | Reference only |

---

## Cleanup Candidates

The following scripts may be safe to delete after review:

```bash
# One-time fixes (already applied)
rm scripts/fix-exec-sql.js
rm scripts/fix-schema-inconsistencies.js
rm scripts/upgrade-exec-sql.js

# Old test versions
rm scripts/test-instagram-sync-old.js
rm scripts/test-sendgrid-fixed.js
rm scripts/test-triple-threat-fix.js
rm scripts/test-triple-threat-live.js
```

---

## Adding New Scripts

When creating a new script:

1. **Name it descriptively**: `purpose-action.js` (e.g., `backup-leads.js`)
2. **Add header comment** with purpose and usage
3. **Update this README** with the new entry
4. **Test locally** before committing

---

*Maintained by: AI Assistant*  
*Last audit: 2026-01-12*
