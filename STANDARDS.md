# STANDARDS.md - Engineering Excellence & Design Patterns

## Design Philosophy
- **Rich Aesthetics:** Every UI element must feel premium. No default browser buttons or plain colors.
- **Glassmorphism & Gradients:** Use deep colors, subtle borders (`border-white/10`), and backdrop blurs.
- **Micro-Animations:** Use `framer-motion` for all transitions (hover, entry, layout changes).
- **Outcome-Focused:** Minimize technical jargon (e.g., "Scraping") and maximize user value (e.g., "Finding Leads").

## Code Standards
- **Framework:** Next.js 14 (App Router) + React 18.
- **Styling:** Tailwind CSS + Vanilla CSS for custom components.
- **Icons:** `lucide-react` only.
- **Logic:** 
  - Prefer Functional Components & Hooks.
  - Utilize "Early Returns" to reduce nesting depth.
  - No `localStorage` for primary state (Supabase is the single source of truth).
- **Security:** Always validate inputs using `zod` and handle API errors gracefully with descriptive user alerts.

## Critical Patterns
- **The "Safety First" Sync:** Never sync an empty state to the database on initial mount. Use a `useRef` to track the initial load.
- **Granular Updates:** Prefer individual `POST/PUT/DELETE` operations over full-collection overwrites.
- **Logging:** Use structured logging in API routes to make debugging easier (especially for scraping and AI calls).
