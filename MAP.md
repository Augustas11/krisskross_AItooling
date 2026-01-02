# MAP.md - Project Architecture & File Navigator

## Core Frontend (React / Next.js)
- **Main Application:** `/components/KrissKrossPitchGeneratorV2.jsx` (The primary dashboard)
- **Intelligence View:** `/components/LeadIntelligenceCard.jsx` (Deep dive for individual leads)
- **Tagging UI:** `/components/LeadTags.jsx` (Labels and categorization display)

## Backend API Routes (`/app/api`)
- **Lead Discovery:** `/app/api/leads/source/route.js` (Scraping & initial finding)
- **Enrichment:** `/app/api/enrich/route.js` (Perplexity/AI data gathering)
- **CRM Operations:** `/app/api/crm/leads/route.js` (Database sync and management)
- **Email System:** `/app/api/email/` (Automation and tracking)
- **Generation:** `/app/api/generate/route.js` (AI pitch creation)

## Logic & Integrations (`/lib`)
- **Database:** `/lib/supabase.js` (Supabase client configuration)
- **Intelligence Services:** `/lib/perplexity.js`, `/lib/social-analyzer.js`
- **Lead Scoring:** `/lib/scoring-constants.js` (The math behind "Good Leads")
- **Tag System:** `/lib/tags/` (Complex categorization logic)

## External Scripts (`/scripts`)
- **Data Migration:** `/scripts/migrate-to-supabase.js`
- **Maintenance:** `/scripts/backup-supabase.js`, `/scripts/seed-tags.js`

## Documentation & History
- **Database Schema:** `/docs/supabase-schema.md`
- **Incident Reports:** `/CRITICAL_DATA_LOSS_INCIDENT_REPORT.md`
- **Workflows:** `/WORKFLOW_ANALYSIS.md`
