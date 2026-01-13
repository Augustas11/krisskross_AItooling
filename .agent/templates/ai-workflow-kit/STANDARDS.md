# STANDARDS.md - Engineering Excellence & Design Patterns

## Design Philosophy
<!-- Customize for your aesthetic preferences -->
- **Rich Aesthetics:** Every UI element must feel premium. No default browser buttons.
- **Modern Styling:** Use gradients, subtle borders, and backdrop blurs.
- **Micro-Animations:** Use motion libraries for smooth transitions.
- **Outcome-Focused:** Minimize technical jargon, maximize user value.

## Code Standards
<!-- UPDATE FOR YOUR TECH STACK -->
- **Framework:** [Next.js 14 / Vite / etc.]
- **Styling:** [TailwindCSS / Vanilla CSS / etc.]
- **Icons:** [lucide-react / heroicons / etc.]
- **Logic:** 
  - Prefer Functional Components & Hooks
  - Utilize "Early Returns" to reduce nesting depth
  - Single source of truth for state
- **Security:** Always validate inputs and handle API errors gracefully

## Critical Patterns

### The "Safety First" Sync
Never sync an empty state to the database on initial mount. Use a ref to track the initial load.
```javascript
const isInitialLoad = useRef(true);

useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return; // Skip on first render
    }
    // Safe to sync now
}, [data]);
```

### Granular Updates
Prefer individual `POST/PUT/DELETE` operations over full-collection overwrites.

### Structured Logging
Use structured logging in API routes for easier debugging:
```javascript
console.log('[API][leads] Fetching leads for user:', userId);
console.error('[API][leads] Error:', error.message);
```

### Error Boundaries
Wrap components in error boundaries. Fail loudly, not silently.

---

<!-- 
ADD YOUR PROJECT-SPECIFIC PATTERNS:
- Authentication patterns
- State management conventions
- File naming conventions
- Testing standards
-->
