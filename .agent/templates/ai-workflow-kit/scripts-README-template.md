# Scripts Directory Reference

> **Last Updated:** [DATE]  
> **Purpose:** Inventory of all scripts with usage status and purpose

---

## ⚡ Quick Reference (Most Used)

| Script | Purpose | Usage |
|--------|---------|-------|
| `[backup].js` | Backup data | `npm run backup` |
| `[seed].js` | Seed database | `node scripts/[seed].js` |
| `[test].js` | Test connections | `node scripts/[test].js` |

---

## 🟢 Active Scripts (Safe to Use)

### Database & Backup
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `[backup].js` | Export data | Daily or before risky operations |
| `[restore].js` | Restore from backup | Emergency recovery |

### Seeding & Setup
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `[seed].js` | Create default data | New environment setup |

### Verification & Testing
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `[test-connection].js` | Test API connection | After config changes |

---

## 🟡 Utility Scripts (Use with Caution)

### Migration Runners
> ⚠️ **These apply database changes. Verify before running.**

| Script | Migration | Status |
|--------|-----------|--------|
| `[apply-migration].js` | Generic runner | Active |

---

## 🔴 Deprecated Scripts (Do Not Use)

> These scripts are superseded or were one-time fixes.

| Script | Reason | Replacement |
|--------|--------|-------------|
| `[old-script].js` | Superseded | Use `[new-script].js` |

---

## 🔵 Debug Scripts (Development Only)

| Script | Purpose |
|--------|---------|
| `[debug-x].js` | Debug X functionality |

---

## Cleanup Candidates

```bash
# One-time fixes (already applied)
rm scripts/[fix-x].js

# Old test versions
rm scripts/[old-test].js
```

---

## Adding New Scripts

When creating a new script:
1. **Name it descriptively**: `purpose-action.js`
2. **Add header comment** with purpose and usage
3. **Update this README** with the new entry
4. **Test locally** before committing

---

*Last audit: [DATE]*
