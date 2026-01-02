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
- Video processing pipeline changes
- Authentication modifications

### Allowed Without Asking:
- Read files
- Run tests/linters
- Add logging
- Create test files

## When I Question You
If I ask "why this way?" I'm learning, not challenging.
Explain:
1. Why your approach works
2. What alternatives exist
3. Tradeoffs between them

## Projects: KrissKross Jobs, KrissKrossAitooling (Lead CRM)
KrissKross is product image to video AI app.
Tech: Tech: Next.js, React, TypeScript, TailwindCSS, Supabase, OpenAI, Stripe, Claude, Vercel.
Critical systems: CRM Leads DB, credits, auth

## Commands
- `npm run dev` - Start local development server
- `npm run build` - Build for production (Vercel)
- `npm run backup` - Backup Supabase leads data to local `backups/`
- `node scripts/seed-tags.js` - Seed initial tags for lead personalization
- `node scripts/migrate-to-supabase.js` - Sync local data to remote Supabase
- `node scripts/send-test-email.js` - Verify SMTP/Email integration
- `node scripts/test-apify.js` - Test Apify scraping connection

---

**Note to AI:** I'm building expertise through doing. Teach me patterns 
that generalize, not just one-off solutions. 

**Required Reading:** Before starting a task, review `MAP.md`, `DOMAIN.md`, `STANDARDS.md`, and `VAULT.md` to understand our architecture, business logic, and safety rules.
