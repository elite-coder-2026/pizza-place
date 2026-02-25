This repo is a small static web app (HTML/CSS/SCSS/JS) located in `client/`.
Goal: ship clean, readable UI with minimal, non-redundant styles.

## Quick Commands (bash)
### Navigation / search
- `ls -la` — list files
- `cd client` — work in the app root
- `rg "pattern" client` — ripgrep search (preferred over `grep`)
- `rg --files client | rg "menu|cms"` — find files by name

### Git
- `git status --porcelain`
- `git diff`
- `git log --oneline --decorate -n 20`
- `git checkout -b codex/<topic>`
- `git add -A && git commit -m "message"`
- `git push -u origin HEAD`

### Node (if needed)
- `npm install`
- `npm run dev` / `npm run build` (only if present in `package.json`)
- `node --check client/js/some-file.js`

## Project Structure
- `client/` — app root
- `client/index.html` — home
- `client/menu.html` — menu page
- `client/cms-test.html` — cms UI test page
- `client/css/` — styles (prefer SCSS source in `client/scss/` if applicable)
- `client/js/` — vanilla JS

## UI + Content Guidelines
### UI principles
- Match the design: spacing, type scale, and alignment matter more than “extra features”.
- Mobile-first responsive behavior:
    - Stack columns below ~900px
    - Avoid horizontal scroll
- Prefer accessible patterns:
    - visible focus (`:focus-visible`)
    - labels for form controls
    - buttons for actions, links for navigation
    - `aria-current="page"` on active nav links

### Content tone
- Short, clear headings
- Descriptions: 1–2 sentences max
- Buttons: verb + noun (e.g., “Save Settings”, “View Menu”)

## SCSS Rules (strict)
- Write SCSS only (no inline styles, no duplicate CSS blocks).
- BEM naming: `.block__element--modifier`
- Nesting max depth: 2 levels.
- Prefer reuse:
    - Tokens: `$color-*`, `$space-*`, `$radius-*`, `$shadow-*`, `$font-*`
    - Shared patterns via mixins/placeholders:
        - `%card`, `%pill`, `%btn`, `%input`
- Don’t restate defaults; don’t add speculative states.
- Avoid increasing specificity; no IDs in selectors.
- If a style already exists, extend/refactor—don’t duplicate.

## Code Style Conversions
### HTML
- Semantic tags (`header`, `nav`, `main`, `section`, `footer`)
- Keep markup minimal; avoid deeply nested wrappers
- Use `data-*` attributes for JS hooks, not classes

### JS
- Vanilla JS, no framework assumptions.
- Prefer:
    - event delegation for lists
    - small pure helpers
    - `const` by default
- No global variables; wrap modules in an IIFE or ES module.

## State Management
- Keep state local to the page/module:
    - UI state (tabs, filters) in JS variables
    - persistent preferences in `localStorage` only when requested
- Derive UI from state:
    - `render()` or `update()` functions that apply DOM changes from state

## Logging, Error Handling, Gating, Debugging
### Logging
- Default: no console noise.
- When debugging:
    - gate logs behind a flag:
        - `const DEBUG = location.search.includes("debug=1");`
        - `if (DEBUG) console.log(...)`

### Error handling
- Guard for missing DOM nodes:
    - if an element isn’t found, return early.
- For async calls:
    - show a user-facing message area
    - `try/catch`, and log detail only in debug mode

### Gating
- Only initialize features if needed:
    - `if (!document.querySelector("[data-widget]")) return;`

### Debug workflow
1. Reproduce
2. Reduce (smallest failing case)
3. Inspect DOM + network + console
4. Fix and add a small regression check (if possible)

## Pull Request Template
Use this in PR descriptions:

### Summary
- What changed?

### Screenshots / Video
- Before/After (if UI)

### Testing
- How you verified (browser, viewport sizes, steps)

### Notes
- Tradeoffs, follow-ups, known issues
