# AGENTS.md

## About Me
I'm Augustas, CEO and CoFounder of KrissKross. I code with AI agents 
and think like a strategist, not a traditional programmer.

## How to Help Me Learn
- Explain WHY before HOW
- Use business analogies for technical concepts
- If you're making a complex technical decision, frame it in terms of 
  user impact, cost, and maintainability
- Don't assume I know framework-specific patterns - explain them

## Safety Rules

### Always Ask First:
- Installing dependencies
- Database changes
- Credit/payment logic changes
- Authentication modifications
- Any destructive operations (delete, drop, truncate)

### Allowed Without Asking:
- Read files
- Run tests/linters
- Add logging
- Create test files

### Deployment Rules
- **Verify Build Locally:** ALWAYS run `npm run build` before pushing code
- **Dependencies:** Use `npm ci` instead of `npm install` for deterministic builds

## Token Usage Reporting
**Critical:** I work with a 200,000 token budget per session. Track and report usage.

### After Completing Any Task:
Report token status in this format:
```
📊 **Token Status**
- Used: X tokens
- Remaining: Y tokens  
- Budget consumed: Z%
[⚠️ Warning if >75% used]
```

### Token Thresholds:
- **0-50%** (Green): ✅ Safe to continue complex tasks
- **50-75%** (Yellow): ⚠️ Monitor closely, consider checkpoints
- **75-90%** (Orange): 🔶 Break remaining work into smaller chunks
- **90%+** (Red): 🛑 Wrap up current task, prepare session summary

### When >75% Budget Used:
1. Alert me immediately
2. Summarize progress so far
3. Suggest breaking remaining work into new session
4. Create resumption notes if task incomplete

## Platform Quota Efficiency
- **Batching:** Group multiple related edits into one response
- **Chaining:** Chain terminal commands (e.g., `npm run lint && npm run test`)
- **Anticipation:** If a fix likely breaks something else, check immediately
- **No Fillers:** Minimize "I'm working on it" messages. Focus on results.

## When I Question You
If I ask "why this way?" I'm learning, not challenging.
Explain:
1. Why your approach works
2. What alternatives exist
3. Tradeoffs between them

## Projects
<!-- UPDATE THIS SECTION FOR EACH PROJECT -->
**Project Name:** [Your Project Name]
**Tech Stack:** [Next.js, React, TypeScript, TailwindCSS, Supabase, etc.]
**Critical Systems:** [List your most important/sensitive areas]

## Commands
<!-- UPDATE THESE FOR YOUR PROJECT -->
- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npm run backup` - Backup data (if applicable)

---

**Note to AI:** I'm building expertise through doing. Teach me patterns 
that generalize, not just one-off solutions. 

**Required Reading:** Before starting a task, review `MAP.md`, `STANDARDS.md`, and `VAULT.md`.

**Additional References:**
- `scripts/README.md` - Script inventory (which to use, which are deprecated)
- `docs/MIGRATIONS_MANIFEST.md` - Database migration tracking
- `.agent/workflows/session-handoff.md` - How to preserve context between sessions
