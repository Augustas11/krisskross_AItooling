---
description: Create structured handoff notes when ending a complex session to preserve context for future sessions
---

# Session Handoff Workflow

## When to Use This
- **Token budget >75% consumed** (approaching session limit)
- **Complex multi-step task** that won't finish in current session
- **Debugging session** with valuable findings to preserve
- **Before taking a break** on an in-progress feature

## Handoff Template

Copy this template and fill it out at the end of your session:

```markdown
# Session Handoff: [Date YYYY-MM-DD]

## 🎯 Original Objective
[What the user originally asked for]

## ✅ Completed
- [Task 1]: [Brief description of what was done]
  - Files: `/path/to/file.js`
  - Key change: [What specifically changed]
- [Task 2]: ...

## 🔄 In Progress
**Current State:** [Where exactly we stopped]
**Next Step:** [The immediate next action to take]
**Blocked By:** [If applicable, what's preventing progress]

## ❌ Not Started
- [Remaining task 1]
- [Remaining task 2]

## 🐛 Issues Discovered
[Any bugs or problems found during the work]
- **Issue**: [Description]
- **Location**: `/path/to/file.js:line-number`
- **Proposed Fix**: [How to address it]

## 💡 Context for Next Session
[Critical information the next AI session needs to know]
- Pattern used: [e.g., isInitialLoad ref pattern]
- Dependency: [e.g., This relies on X being done first]
- Gotcha: [e.g., Don't forget to run migrations after]

## 🧪 How to Verify
1. [Step to test the completed work]
2. [Expected result]

## 📂 Files Modified
| File | Type of Change |
|------|----------------|
| `/path/to/file.js` | Added feature |
| `/path/to/other.js` | Bug fix |

## Resume Prompt
**Copy this to start next session:**
> I'm continuing work from a previous session. 
> [Paste the "In Progress" and "Not Started" sections above]
> Read the session handoff at `.agent/workflows/HANDOFF_[DATE].md` first.
```

---

## Quick Handoff (Minimal Version)

For simpler sessions, use this abbreviated format:

```markdown
# Quick Handoff: [Date]

**Completed:** [One-liner summary]
**Next Step:** [Exact next action]  
**Key File:** `/path/to/file.js` (lines X-Y)
**Notes:** [Anything non-obvious]
```

---

## Saving Handoffs

1. **During session**: Create handoff notes in a code block (agent will display it)
2. **Persistent storage**: Save complex handoffs to `.agent/handoffs/[DATE]_[topic].md`
3. **Start next session**: Reference the handoff file in your first prompt

---

## Example Handoff

```markdown
# Session Handoff: 2026-01-12

## 🎯 Original Objective
Fix Instagram sync not showing pending matches in the UI

## ✅ Completed
- Fixed API query: Changed `status` to `match_status` field
  - Files: `/app/api/instagram/pending-matches/route.js`
  - Key change: Line 23, corrected column name
- Added error logging for debugging
  - Files: `/lib/instagram/sync.js`

## 🔄 In Progress
**Current State:** API now returns matches, but UI doesn't render them
**Next Step:** Debug `InstagramPendingMatches.jsx` component
**Blocked By:** Need to verify the response shape matches component expectations

## ❌ Not Started
- Add "Ignore" action button for matches
- Write tests for the sync flow

## 💡 Context for Next Session
- The `match_status` field uses 'pending'/'approved'/'ignored' values
- Component expects `matches` array with `{id, username, matchedLead}` shape
- Check if the API response wrapper matches what the UI expects

## Resume Prompt
> Continuing Instagram sync debugging. The API is fixed but UI still 
> doesn't show matches. Start by checking InstagramPendingMatches.jsx 
> and comparing expected props vs. actual API response.
```

---

## Pro Tips

1. **Be specific about location** - "Line 45 of route.js" saves 5 minutes of searching
2. **Include the resume prompt** - Makes starting the next session instant
3. **Note patterns used** - Future you forgets why you did things
4. **List what DIDN'T work** - Prevents repeating failed approaches
