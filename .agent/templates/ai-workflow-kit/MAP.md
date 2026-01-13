# MAP.md - Project Architecture & File Navigator

<!-- 
PURPOSE: Help the AI navigate your codebase quickly without wasting tokens exploring.
UPDATE: Keep this current as your project evolves.
-->

## Core Frontend
<!-- List your main UI components -->
- **Main Application:** `/components/[MainComponent].jsx`
- **Key Pages:** `/app/[page]/page.jsx`

## Backend API Routes (`/app/api` or `/pages/api`)
<!-- List your API endpoints by category -->
- **Core CRUD:** `/app/api/[resource]/route.js`
- **Authentication:** `/app/api/auth/`
- **Integrations:** `/app/api/[third-party]/`

## Logic & Integrations (`/lib` or `/utils`)
<!-- List your service modules -->
- **Database:** `/lib/[database].js`
- **External APIs:** `/lib/[service].js`
- **Helpers:** `/lib/[helpers].js`

## External Scripts (`/scripts`)
<!-- Reference your scripts inventory -->
See `scripts/README.md` for full inventory.

**Most Used:**
- `node scripts/[backup].js` - Backup data
- `node scripts/[seed].js` - Seed database

## Configuration
- **Environment:** `.env.local`
- **Package:** `package.json`
- **Build:** `next.config.js` / `vite.config.js`

## Documentation & History
- **Database Schema:** `/docs/[schema].md`
- **Migrations:** `/docs/MIGRATIONS_MANIFEST.md`
- **Incident Reports:** `/[incident-reports].md` (if any)

---

<!-- 
TIP: The more specific you are here, the less tokens the AI wastes exploring.
Example: Instead of "API routes", write:
  - **Lead Discovery:** `/app/api/leads/source/route.js` (Scraping & initial finding)
  - **Enrichment:** `/app/api/enrich/route.js` (AI data gathering)
-->
