This repo is a small static web app (HTML/CSS/JS) located in `client/` (plus some jQuery usage).
Goal: ship clean, readable UI with minimal, non-redundant styles and minimal back-and-forth.

## Quick Commands (bash)
### Navigation / search
- `ls -la` — list files
- `cd client` — work in the app root
- `rg "pattern" client` — ripgrep search (preferred over `grep`)
- `rg --files client | rg "menu|order|cms"` — find files by name

### Git
- `git status --porcelain`
- `git diff`
- `git log --oneline --decorate -n 20`
- `git checkout -b codex/<topic>`
- `git add -A && git commit -m "message"`
- `git push -u origin HEAD`

### Node (client)
- `cd client && npm install`
- `cd client && npm run diagram` — renders Mermaid docs (see `client/docs/diagrams`)
- `node --check client/js/some-file.js`

## Project Structure
- `client/` — app root
- `client/index.html` — home
- `client/menu.html` — menu page
- `client/order.html` — order page
- `client/cms-test.html` — CMS UI test page
- `client/css/` — source styles (current approach)
- `client/css/design-tokens.css` — shared tokens (preferred for shared values)
- `client/js/` — vanilla JS

## UI + Content Guidelines
### UI principles
- Match the design: spacing, type scale, and alignment matter more than “extra features”.
- Mobile-first responsive behavior:
    - Stack columns below ~900px
    - Avoid horizontal scroll (check 375 / 768 / 1024 / 1440 widths)
- Prefer accessible patterns:
    - visible focus (`:focus-visible`)
    - labels for form controls
    - buttons for actions, links for navigation
    - `aria-current="page"` on active nav links

### Content tone
- Short, clear headings
- Descriptions: 1–2 sentences max
- Buttons: verb + noun (e.g., “Save Settings”, “View Menu”)

## CSS/SCSS Rules (strict)
- No inline styles; no duplicate CSS blocks.
- Current repo is CSS-first: prefer updating existing files in `client/css/`.
- If SCSS is introduced later, keep nesting max depth to 2 levels.
- BEM naming for styling classes: `.block__element--modifier`
- Prefer reuse:
    - First choice: values in `client/css/design-tokens.css`
    - If you need a new shared value/pattern, add it to the canonical shared location (don’t create per-file “one-off tokens”).
- Don’t restate defaults; don’t add speculative states.
- Avoid increasing specificity; no IDs in selectors.
- If a style already exists, extend/refactor—don’t duplicate.

## Code Style Conversions
### HTML
- Semantic tags (`header`, `nav`, `main`, `section`, `footer`)
- Keep markup minimal; avoid deeply nested wrappers
- Use `data-*` attributes for JS hooks, not styling classes
    - Tie-breaker: classes (BEM) are for styling; `data-*` is for JS selectors; never style off `data-*`.

### JS
- Vanilla JS, no framework assumptions.
- Prefer:
    - event delegation for lists
    - small pure helpers
    - `const` by default
- No global variables; prefer wrapping page modules in an IIFE (consistent with classic script tags).

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
    - Quick checklist:
        - No console errors on load
        - Keyboard nav works + focus visible
        - Forms usable with labels + validation
        - Responsive at 375 / 768 / 1024 / 1440

### Notes
- Tradeoffs, follow-ups, known issues
