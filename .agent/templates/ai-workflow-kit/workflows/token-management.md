---
description: Manage token limits for complex coding sessions
---

# Token & Quota Management Workflow

## Purpose
1. **Session Budget:** Prevent breakdowns from the 200,000 token per-session limit.
2. **Platform Quota:** Preserve messages/credits to avoid "Quota exceeded" errors that lock you out for hours.

## Before Starting a Complex Task

### 1. Check Current Token Status
- Look for the last system warning: `<system_warning>Token usage: X/200000; Y remaining</system_warning>`
- If no recent warning, assume you're starting fresh

### 2. Estimate Task Complexity
**Small Task** (< 10% tokens, ~20k)
- Single file edits
- Bug fixes
- Simple feature additions
- Documentation updates

**Medium Task** (10-30% tokens, ~20-60k)
- Multi-file refactoring
- New feature with tests
- API endpoint creation
- Database schema changes

**Large Task** (30-50% tokens, ~60-100k)
- Major feature implementation
- System architecture changes
- Multiple integrated components
- Complex debugging sessions

**Very Large Task** (>50% tokens)
- ⚠️ **BREAK INTO MULTIPLE SESSIONS**
- Create implementation plan first
- Tackle in phases across sessions

### 3. Plan Checkpoints
For Medium/Large tasks, set checkpoints at:
- 25% task completion
- 50% task completion  
- 75% task completion

---

## During Task Execution

### At Each Checkpoint
Agent should report:
- [ ] Current token usage and remaining budget
- [ ] What's been completed
- [ ] What remains
- [ ] Estimated tokens needed to finish
- [ ] Recommendation: continue or pause

### If Token Warning Appears
When you see: `<system_warning>Token usage: X/200000; Y remaining</system_warning>`

**Immediately assess:**
1. How much work is left?
2. Can it fit in remaining budget?
3. If no, create a breakpoint NOW

---

## Token Budget Thresholds

### ✅ Green Zone (0-50%, 0-100k tokens used)
**Status:** Safe to continue

**Actions:**
- Proceed with planned work
- No special precautions needed
- Continue complex tasks

---

### ⚠️ Yellow Zone (50-75%, 100k-150k tokens used)
**Status:** Monitor closely

**Actions:**
- Start tracking token usage more carefully
- Avoid starting NEW large tasks
- Finish current task, then assess
- Consider creating checkpoints

**Agent should:**
- Report token status more frequently
- Estimate remaining capacity
- Suggest task prioritization

---

### 🔶 Orange Zone (75-90%, 150k-180k tokens used)
**Status:** Approaching limit

**Actions:**
- **DO NOT** start new complex tasks
- Focus on wrapping up current work
- Create detailed progress notes
- Prepare for potential session end

**Agent should:**
- Alert you immediately upon entering this zone
- Provide session summary
- Suggest breaking remaining work into new session
- Create resumption notes

---

### 🛑 Red Zone (90%+, 180k+ tokens used)
**Status:** Critical - session will end soon

**Actions:**
- **STOP** new work immediately
- Save all progress
- Create comprehensive session summary
- Document exactly where to resume

**Agent must:**
1. **Immediate alert** with current status
2. **Session Summary:**
   - What was accomplished
   - What's in progress (incomplete)
   - What's not started
3. **Resumption Notes:**
   - Exact files modified
   - Next steps to take
   - Context needed for next session
4. **Recommend** ending session gracefully

---

## Session End Protocol

### When Approaching Token Limit
Create a session summary document:

```markdown
# Session Summary - [Date]

## Token Usage
- Total used: X/200,000 (Y%)
- Session duration: Z minutes

## Completed ✅
- [List all completed tasks]
- [Files modified]
- [Tests passing/failing]

## In Progress 🔄
- [Current task status]
- [What's partially done]
- [Blockers encountered]

## Not Started ⏸️
- [Remaining tasks from original request]
- [Estimated token cost]

## Resume Instructions
**To continue this work:**
1. [First step to take]
2. [Context to review]
3. [Files to check]
4. [Commands to run]

## Notes
- [Any important context]
- [Decisions made]
- [Things to remember]
```

---

## Task Breakdown Strategy

### If Task Exceeds Token Budget
**Instead of trying to do everything in one session:**

1. **Create Implementation Plan**
   - Break into logical phases
   - Estimate tokens per phase
   - Prioritize phases

2. **Phase 1: Foundation** (Session 1)
   - Core infrastructure
   - Database changes
   - Basic functionality

3. **Phase 2: Features** (Session 2)
   - Build on foundation
   - Add complexity
   - Integration work

4. **Phase 3: Polish** (Session 3)
   - Testing
   - Error handling
   - Documentation

---

## Platform Quota Preservation (Message Efficiency)
If you are nearing your hourly or daily limit, we must switch to **High Efficiency Mode**:

### Agent Strategy:
1. **Batch Tools:** Use `multi_replace_file_content` for all edits in one turn.
2. **Chain Commands:** Use `&&` to run multiple terminal steps at once.
3. **Plan Before Do:** Create a comprehensive plan and execute it in as few turns as possible.
4. **Avoid Small Edits:** Do not send one message per fix. Gather 5+ fixes before sending.

### User Strategy:
1. **Clear Prompts:** Give multi-step instructions at once.
2. **Batch Feedback:** Instead of saying "Fix X," then "Fix Y," wait and say "Fix X, Y, and Z" in one message.

---

## Tips for Token & Quota Efficiency

### Reduce Token Consumption:
- **View specific files** instead of exploring entire directories
- **Use grep/search** to find exact locations before viewing
- **View file outlines** before reading full files
- **Target specific line ranges** when viewing files
- **Avoid repeated file views** - take notes on first read

### Maximize Productivity:
- **Batch related changes** together
- **Test incrementally** rather than at the end
- **Use workflows** for repetitive tasks
- **Create reusable components** to avoid rebuilding

---

## Example: Managing a Large Refactoring

**Scenario:** Refactoring authentication system (estimated 120k tokens)

### Session 1 (Target: <90k tokens)
- Review current auth implementation
- Create refactoring plan
- Implement core auth service
- **Checkpoint:** Save progress, create resumption notes

### Session 2 (Target: <90k tokens)  
- Review Session 1 notes
- Implement auth middleware
- Update API routes
- **Checkpoint:** Save progress

### Session 3 (Target: <90k tokens)
- Review Session 2 notes
- Add tests
- Update documentation
- Final integration testing

---

## Quick Reference

**Before starting:** Estimate complexity, plan checkpoints
**During work:** Monitor warnings, report at checkpoints  
**At 75%:** Start wrapping up, create notes
**At 90%:** Stop new work, create session summary
**Always:** Think in phases, not marathons

---

**Remember:** It's better to end a session cleanly at 80% tokens with good notes than to hit the hard limit mid-task and lose context.
