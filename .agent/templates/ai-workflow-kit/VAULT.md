# VAULT.md - Lessons Learned & Prevention

<!--
PURPOSE: Encode project-specific anti-patterns to avoid repeat mistakes.
UPDATE: Every time you fix a significant bug or learn something the hard way.
-->

## 🛡️ Critical Guardrails (Anti-Incident Rules)

1. **Rule #1: Database Sync Safety.** Never allow a sync of an empty local array to the database unless explicitly confirmed.

2. **Rule #2: Single Source of Truth.** Do not mix `localStorage` and database for the same data. Pick one.

3. **Rule #3: Soft Deletes.** When possible, mark records as `is_deleted = true` instead of hard deletes.

4. **Rule #4: useEffect Dependencies.** Always verify dependency arrays - they are the primary source of infinite loops.

<!-- ADD YOUR OWN RULES AS YOU LEARN -->

## 💡 Best Practices

1. **API Resilience:** External API calls should have retry mechanisms for transient errors.

2. **User Feedback:** Long-running processes must have real-time status indicators.

3. **Graceful Degradation:** If a feature fails, show a helpful error, don't crash the app.

<!-- ADD YOUR OWN BEST PRACTICES -->

## 🚫 Stop Doing

- **Stop using localStorage** for primary data persistence (use database)
- **Stop merging** new code without testing the build first
- **Stop assuming** API responses will always succeed - handle errors

<!-- ADD YOUR OWN "STOP DOING" ITEMS -->

---

## 📋 Incident Log

<!-- 
Log significant incidents here for reference.
Format:
### [Date] - [Brief Title]
**What happened:** 
**Root cause:** 
**Fix:** 
**Prevention:** 
-->

### Template Entry
**What happened:** [Describe the issue]
**Root cause:** [What actually caused it]
**Fix:** [How it was resolved]
**Prevention:** [Rule added to prevent recurrence]

---

<!--
TIP: Reference specific incidents when explaining rules to the AI.
Example: "This is why Rule #1 exists - see the Dec 31 data loss incident."
-->
