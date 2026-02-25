# Agent Instructions (pizza-place)

This repo is a small pizza shop site:
- `client/` is the primary app: static HTML + CSS/SCSS + vanilla JS (plus jQuery).
- `backend/` exists but is currently minimal.

Goal: ship clean, readable UI with minimal, non-redundant styles and minimal back-and-forth.

## How to work (default behavior)
- Prefer making the change directly over asking questions; only ask when blocked.
- Keep diffs small and localized; don’t refactor unrelated areas.
- Match the existing style and patterns in nearby files.
- Avoid “speculative” features/states (only implement what’s requested or implied by the design).

## Quick commands (bash)
### Navigation / search
- `cd client` — work in the app root
- `rg "pattern" client` — search (preferred over `grep`)
- `rg --files client | rg "menu|order|cms"` — find files by name

### Node (client)
- `cd client && npm install`
- `cd client && npm run diagram` — renders Mermaid docs (see `client/docs/diagrams`)
- `node --check client/js/some-file.js` — syntax check

## Project structure
- `client/index.html` — home
- `client/menu.html` — menu page
- `client/order.html` — order page
- `client/cms-test.html` — CMS UI test page
- `client/css/` — source CSS (current approach)
- `client/scss/` — reserved for future SCSS sources (currently empty)
- `client/js/` — client-side JS

## UI + content guidelines
### UI principles
- Match the design first: spacing, type scale, alignment, and consistency.
- Mobile-first responsive behavior:
  - stack columns below ~900px
  - avoid horizontal scroll at common widths (375/768/1024/1440)
- Prefer accessible patterns:
  - visible focus via `:focus-visible`
  - labels for form controls
  - buttons for actions, links for navigation
  - `aria-current="page"` on active nav links

### Content tone
- Short, clear headings.
- Descriptions: 1–2 sentences max.
- Buttons: verb + noun (e.g., “Save Settings”, “View Menu”).

## CSS/SCSS rules (strict)
- No inline styles; don’t duplicate existing CSS blocks.
- Prefer BEM naming: `.block__element--modifier`.
- Keep selector nesting shallow (max ~2 levels if using SCSS later).
- Prefer reuse:
  - tokens in `client/css/design-tokens.css` when possible
  - shared patterns instead of copy/paste
- Avoid increasing specificity:
  - no IDs in selectors
  - don’t rely on tag-qualified selectors like `button.btn` unless already used nearby

## HTML rules
- Prefer semantic tags (`header`, `nav`, `main`, `section`, `footer`).
- Keep markup minimal; avoid deeply nested wrappers.
- Use `data-*` attributes for JS hooks, not CSS classes.

## JS rules
- Vanilla JS; no framework assumptions.
- Prefer:
  - event delegation for lists
  - small pure helpers
  - `const` by default
- Avoid globals; wrap code in an IIFE or an ES module pattern consistent with the file.
- Don’t ship console noise:
  - if debugging is needed, gate via `const DEBUG = location.search.includes("debug=1");`

## Error handling + gating
- Guard for missing DOM nodes: if an element isn’t found, return early.
- Only initialize features on pages that need them (gate on a container or `data-*` hook).
- For async calls (if any): use `try/catch`, show a user-facing message, log details only in debug mode.

## Diagrams (Mermaid)
Mermaid sources: `client/docs/diagrams/*.mmd`.
- Render: `cd client && npm run diagram`
- Outputs: `client/docs/diagrams/dist/` (default SVG)

## PR / handoff template
### Summary
- What changed?

### Screenshots
- Before/After (if UI)

### Testing
- How you verified (browser + viewport sizes + steps)

### Notes
- Tradeoffs, follow-ups, known issues

