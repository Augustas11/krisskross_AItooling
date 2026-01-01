# Tag System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Database Migration (2 min)

1. Open **Supabase Dashboard** → SQL Editor
2. Copy/paste from `docs/supabase-tag-migration.sql`
3. Click **Run**
4. Verify: `SELECT tags FROM leads LIMIT 1;` should return JSONB array

### Step 2: Add Environment Variable (1 min)

Add to `.env.local`:
```bash
# For AI caption analysis (optional but recommended)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Get key from: https://console.anthropic.com/

### Step 3: Tag Existing Leads (2 min)

```bash
node scripts/seed-tags.js
```

Watch it tag all your leads and show statistics!

### Step 4: Add Tags UI to Lead Detail (5 min)

In `components/KrissKrossPitchGeneratorV2.jsx`:

```jsx
import { TagsSection } from '@/components/TagComponents';

// In your lead detail modal, add:
<TagsSection 
  lead={selectedLead}
  onUpdateTags={(enrichedData) => {
    // Update lead state
    setSelectedLead({ ...selectedLead, ...enrichedData });
    // Optionally save to database
    saveLead({ ...selectedLead, ...enrichedData });
  }}
/>
```

### Step 5: Test It! (1 min)

1. Open a lead with Instagram handle
2. Click to expand Tags section
3. Click 🔄 Refresh button
4. Watch it fetch Instagram data and apply tags!
5. See AI-detected pain points with confidence scores

---

## 📖 Common Use Cases

### Use Case 1: Enrich Lead on CSV Upload

```javascript
import { enrichAndTagLead } from '@/lib/tags';

async function handleCSVUpload(csvLeads) {
  for (const lead of csvLeads) {
    if (lead.instagram && lead.instagram !== 'N/A') {
      // Enrich with Instagram data + AI tagging
      const enriched = await enrichAndTagLead(lead);
      await saveLead(enriched);
    } else {
      // Just auto-tag without Instagram data
      await autoTagLead(lead);
      await saveLead(lead);
    }
  }
}
```

### Use Case 2: Filter Leads by Tags

```javascript
import { filterLeadsByTags, hasTag } from '@/lib/tags';

// Find all GREEN priority leads not yet contacted
const greenLeads = leads.filter(l => 
  hasTag(l, 'priority:🟢GREEN') && 
  !hasTag(l, 'outreach:email_1_sent')
);

// Find fashion sellers in US with manual_video pain
const idealProspects = filterLeadsByTags(leads, [
  'business:fashion',
  'geo:US',
  'pain:manual_video'
]);
```

### Use Case 3: Personalize Email Based on Tags

```javascript
import { getTagsByCategory } from '@/lib/tags';

function generatePersonalizedEmail(lead) {
  const painPoints = getTagsByCategory(lead, 'pain');
  
  if (painPoints.some(t => t.full_tag === 'pain:manual_video')) {
    return `Hi ${lead.name},

I noticed you're creating videos manually for your fashion brand. 
Many sellers like you spend 3-5 hours per video...

[Rest of personalized pitch]`;
  }
  
  // Default email
  return `Hi ${lead.name}, ...`;
}
```

---

## 🎯 Key Functions Reference

### Auto-Tagging
```javascript
import { autoTagLead } from '@/lib/tags';
const tagged = await autoTagLead(lead);
```

### Enrichment (Apify + AI)
```javascript
import { enrichAndTagLead } from '@/lib/tags';
const enriched = await enrichAndTagLead(lead);
```

### Tag Utilities
```javascript
import { hasTag, getTagsByCategory, addTag } from '@/lib/tags';

if (hasTag(lead, 'priority:🟢GREEN')) { ... }
const painTags = getTagsByCategory(lead, 'pain');
addTag(lead, 'special:high_value', { applied_by: 'manual' });
```

### Filtering
```javascript
import { filterLeadsByTags } from '@/lib/tags';

const filtered = filterLeadsByTags(leads, [
  'business:fashion',
  'followers:10k-100k'
]);
```

---

## 💡 Pro Tips

1. **Cost Control**: Only refresh leads you're actively working on (manual button)
2. **AI Confidence**: Tags with 70%+ confidence are reliable
3. **ICP Detection**: `icp:user2_profile` = your ideal customer
4. **Priority Tiers**: Focus on 🟢GREEN first, then 🟡YELLOW
5. **Pain Points**: Use AI-detected pain points for email personalization

---

## 🆘 Troubleshooting

**Tags not showing after seed?**
- Check console for errors
- Verify migration ran: `SELECT tags FROM leads LIMIT 1;`
- Re-run: `node scripts/seed-tags.js`

**Refresh button not working?**
- Check `APIFY_API_TOKEN` in `.env.local`
- Check browser console for errors
- Verify Instagram handle is valid

**AI tags not appearing?**
- Add `ANTHROPIC_API_KEY` to `.env.local`
- Check console for AI errors
- Verify lead has Instagram captions

**No pain points detected?**
- Captions might not mention video production
- AI requires explicit mentions (not assumptions)
- Try leads with more detailed captions

---

## 📚 Documentation

- **Full Implementation Plan**: `docs/TAG_SYSTEM_PHASE2_COMPLETE.md`
- **Tag Reference**: See artifact `tag_reference.md`
- **Database Schema**: `docs/supabase-tag-migration.sql`

---

## ✅ Checklist

- [ ] Database migration applied
- [ ] `ANTHROPIC_API_KEY` added to `.env.local`
- [ ] Seed script run successfully
- [ ] Tags UI added to lead detail
- [ ] Tested refresh button
- [ ] Verified AI pain point detection

**All done?** You're ready to use the tag system! 🎉
