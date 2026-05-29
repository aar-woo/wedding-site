# Phase 1: Foundation - Research

**Researched:** 2026-05-28
**Domain:** React 19 + Vite 8 + React Router v7 wiring, CSS custom properties, Google Fonts loading
**Confidence:** HIGH

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md is the binding design contract. All directives below are LOCKED — no deviation.

- **Tech stack:** React 18 (actually 19.2.6 installed), Vite, Framer Motion, React Router v6 (actually v7.16.0 installed), CSS Modules
- **No UI libraries** — custom design only
- **Fonts:** Cormorant Garamond (display) + Jost (body) via Google Fonts. Never Inter, Roboto, or system fonts.
- **Design tokens:** `#0B1610` forest, `#BF9B5A` gold, `#D4B57A` gold-light, `#EAE0CB` cream, `#72685A` muted — defined as CSS variables, never inline
- **Guest personalization:** `useSearchParams` from react-router-dom / react-router, component at `src/hooks/useGuestName.js`
- **Do not** use component libraries, add routing beyond single page, use inline styles for design values, hardcode animation delays

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | App is wrapped in `<BrowserRouter>` and renders a single save-the-date page | React Router v7 declarative mode: import `BrowserRouter` from `"react-router"`, wrap `<App>` in `main.jsx` |
| FND-02 | Google Fonts (Cormorant Garamond + Jost) are loaded and applied; no system/Inter/Roboto fallback | Three-link pattern in `index.html` (preconnect × 2 + stylesheet with `&display=swap`); override `--sans`/`--heading` vars from default `index.css` |
| FND-03 | Design tokens (all five palette colors) are defined as CSS variables and used everywhere — no inline design values | Define in `:root` block inside `src/index.css`; remove Vite scaffold defaults; use `var(--forest)` etc. in all subsequent CSS |
</phase_requirements>

---

## Summary

This phase wires three independent concerns: (1) the React Router v7 declarative wrapper, (2) Google Fonts loading without system-font flash, and (3) the five CSS custom properties that all later CSS will consume.

The project already has React 19.2.6, Vite 8, Framer Motion 12.40.0, and React Router DOM 7.16.0 installed. **This is an important divergence from CLAUDE.md's spec of "React 18" and "React Router v6".** The actual installed packages are one major version ahead of the docs language. The good news: React Router v7 in declarative mode is a drop-in upgrade — `BrowserRouter` and `useSearchParams` work identically; only the import path changes from `"react-router-dom"` to `"react-router"`. React 19 is API-compatible with React 18 for all patterns this project uses.

The current `src/index.css` is the Vite scaffold's default and contains conflicting CSS variables (`--text`, `--bg`, `--accent`, `--sans: system-ui, Roboto`), a `color-scheme: light dark` dark mode block, and non-project heading/font rules. All of this must be replaced wholesale in this phase. Similarly `src/App.jsx` is the Vite scaffold demo — it will be cleared to a minimal shell that passes the "no blank screen, no console errors" success criterion.

**Primary recommendation:** Replace `src/index.css` entirely with the five design tokens + font-face application rules + a clean body/root reset. Add the Google Fonts three-link block to `index.html`. Wrap `<App>` in `<BrowserRouter>` imported from `"react-router"` in `main.jsx`. Clear `App.jsx` to a minimal `<div>` shell.

---

## Actual Repo State (Verified)

| File | Current State | Action Required |
|------|---------------|----------------|
| `package.json` | react@19.2.6, react-router-dom@7.16.0, framer-motion@12.40.0, vite@8.0.12 | No installs needed |
| `src/main.jsx` | StrictMode + createRoot, no BrowserRouter, imports `./index.css` | Add BrowserRouter import + wrap |
| `src/App.jsx` | Full Vite scaffold demo (hero.png import, counter, logos) | Replace with minimal shell |
| `src/index.css` | Vite defaults — wrong variables, Roboto in font stack, dark mode block | Replace entirely |
| `index.html` | No Google Fonts links, title is "wedding-site" | Add preconnect + font link; update title |
| `src/App.css` | Vite scaffold component styles | Clear or delete (App.jsx no longer needs it) |
| `public/images/` | `save-the-date-hero.png` present | No action (Phase 1 scope) |
| `public/save-the-date-hero.png` | Also present at root of public | No action (Phase 1 scope) |

---

## Standard Stack

### Core (already installed — no installs needed)

| Library | Installed Version | Purpose | Notes |
|---------|------------------|---------|-------|
| react | 19.2.6 | UI rendering | CLAUDE.md says "18" but 19 is installed and compatible |
| react-dom | 19.2.6 | DOM renderer | Same |
| react-router-dom | 7.16.0 | Routing + BrowserRouter + useSearchParams | CLAUDE.md says "v6" but v7 is installed; import from `"react-router"` not `"react-router-dom"` |
| framer-motion | 12.40.0 | Animation (later phases) | No action this phase |
| vite | 8.0.12 | Build tool | No config changes needed for this phase |

**No new packages needed for Phase 1.**

### Version divergence note (HIGH confidence)

CLAUDE.md was written before the actual package install. The installed stack is React 19 + React Router v7. Both are backwards-compatible for this project's usage. All CLAUDE.md patterns still apply exactly — only the import path for router components changes.

---

## Architecture Patterns

### Recommended Project Structure (post-Phase-1)

```
src/
├── main.jsx          # BrowserRouter wrapper + createRoot
├── App.jsx           # Minimal shell (single-route, no sidebar/nav)
├── index.css         # :root design tokens + body/font reset (global)
└── hooks/            # (create empty dir — useGuestName.js goes here in Phase 3)
```

No `src/components/` or `src/pages/` needed yet — those emerge in later phases.

### Pattern 1: BrowserRouter in main.jsx (React Router v7 declarative mode)

**What:** Wrap the root `<App>` in `<BrowserRouter>` so that `useSearchParams`, `useLocation`, etc. work anywhere in the tree.
**When to use:** Any Vite SPA that is NOT using React Router's framework mode (no file-based routing).
**Import path:** `"react-router"` — NOT `"react-router-dom"` (v7 unifies the package).

```jsx
// src/main.jsx
// Source: https://reactrouter.com/start/modes (declarative mode)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

### Pattern 2: CSS custom properties in :root (global tokens)

**What:** All five design tokens defined in `:root` inside `src/index.css`. Every component's CSS Module can use `var(--gold)` etc. without any import — custom properties are inherited through the cascade.
**When to use:** Global design system values that all components consume. This is the standard CSS Modules pattern for design tokens — tokens are global (`:root`), component layout is scoped (`.module.css`).

```css
/* src/index.css — Source: CSS specification + Vite docs */
:root {
  --forest: #0B1610;
  --gold: #BF9B5A;
  --gold-light: #D4B57A;
  --cream: #EAE0CB;
  --muted: #72685A;

  /* Font families — applied after Google Fonts load */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Jost', system-ui, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--forest);
  color: var(--cream);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100svh;
}
```

**Critical:** The existing `src/index.css` has `--sans: system-ui, 'Segoe UI', Roboto, sans-serif` and a dark mode block that would override the forest background. The entire file must be replaced, not patched.

### Pattern 3: Google Fonts in index.html (three-link method)

**What:** Two `<link rel="preconnect">` tags + one `<link rel="stylesheet">` with `&display=swap` appended.
**When to use:** Loading Google Fonts from CDN in a Vite project. This is the canonical approach — no Vite plugin required for this project's needs.
**Why preconnect:** Eliminates DNS + TCP + TLS handshake latency before the browser even requests the CSS. The `crossorigin` attribute on the gstatic preconnect is required because fonts are fetched as cross-origin resources.
**Why `display=swap`:** Google Fonts injects `font-display: swap` into all `@font-face` rules, meaning the browser renders text with a fallback font immediately and swaps to the web font when it arrives — no invisible text (FOIT).

```html
<!-- index.html <head> block -->
<!-- Source: https://fonts.google.com — standard embedding snippet -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Jost:wght@300;400;500;600&display=swap"
/>
```

**Font weights to request:**
- Cormorant Garamond: 300–700, normal + italic (display font for couple names; italic variants needed for elegance)
- Jost: 300–600 (body/labels; no italics needed for this design)

### Pattern 4: Minimal App.jsx shell

**What:** Clear the Vite scaffold and render the minimum needed to prove the router and CSS are working.
**Why:** The current App.jsx imports `./assets/hero.png` (a file that may or may not exist post-cleanup), uses Vite scaffold CSS variables, and will throw import errors once App.css is cleared.

```jsx
// src/App.jsx
function App() {
  return (
    <div className="app">
      {/* Save the Date content — Phase 2+ */}
    </div>
  )
}

export default App
```

### Anti-Patterns to Avoid

- **Importing BrowserRouter from `"react-router-dom"`:** In v7, this still works but triggers a deprecation warning. Use `"react-router"`.
- **Defining design tokens in App.module.css instead of index.css:** CSS Module variables are locally scoped — they will NOT be inherited by child components. `:root` in a global stylesheet is the correct location.
- **Leaving `color-scheme: light dark` in index.css:** The Vite scaffold has this, which enables dark mode overrides that would fight the `--forest` background color.
- **Leaving `--sans: system-ui, Roboto` in index.css:** This makes Roboto appear as a fallback font, violating the CLAUDE.md "Never use Roboto" rule.
- **Using `font-display: optional` instead of `swap`:** Optional suppresses the font swap on slow connections, causing the fallback to persist. `swap` is correct for this aesthetic-priority project.
- **Adding `<link rel="stylesheet">` inside a React component:** Google Fonts `<link>` tags belong in `index.html` `<head>`, not injected via JS, to avoid a render-blocking waterfall.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param reading | Custom `window.location.search` parser | `useSearchParams` from `"react-router"` | Handles encoding, updates reactively, integrates with router context |
| CSS variable theming | JS theme objects / inline style injection | CSS custom properties in `:root` | Inherited by all descendants, overridable per component, zero runtime cost |
| Font loading detection | JS font loading API + state | `font-display: swap` in Google Fonts URL | Browser-native; no JS needed for Phase 1 requirements |

**Key insight:** All three Phase 1 concerns have built-in platform/library solutions. Nothing custom needs to be built.

---

## Common Pitfalls

### Pitfall 1: React Router v7 import path

**What goes wrong:** Importing `BrowserRouter` from `"react-router-dom"` works but produces a deprecation warning in the console, which counts as a "console error from missing router" against FND-01's success criterion.
**Why it happens:** v7 unified the package — `react-router-dom` re-exports from `react-router` but is considered deprecated.
**How to avoid:** Import from `"react-router"` only.
**Warning signs:** Console warning: `[React Router] react-router-dom is deprecated`.

### Pitfall 2: Vite scaffold CSS bleeding into wedding design

**What goes wrong:** Leaving any of the existing `src/index.css` content causes: dark mode overrides fighting `--forest` background, Roboto in font stacks violating CLAUDE.md, wrong CSS variable names being referenced.
**Why it happens:** The Vite scaffold is a fully functional demo with its own design system. Partial edits leave conflicts.
**How to avoid:** Replace `src/index.css` in full — do not patch.
**Warning signs:** Background appears white or grey; heading font looks like system-ui.

### Pitfall 3: App.jsx scaffold imports breaking after cleanup

**What goes wrong:** Current `App.jsx` imports `./assets/hero.png` and `./App.css`. If App.css is deleted or its classes are removed, Vite will throw module resolution errors or `undefined` class name references.
**Why it happens:** CSS Module files throw if imported but missing; image imports succeed but produce broken `img` src if the file moves.
**How to avoid:** Clear App.jsx to a minimal shell at the same time as clearing App.css, or delete App.css and remove its import.
**Warning signs:** `Failed to resolve import "./App.css"` in Vite dev server.

### Pitfall 4: Google Fonts not applying because CSS font-family not set

**What goes wrong:** Fonts load (network tab shows CSS + woff2), but text still renders in system font.
**Why it happens:** Loading the font CSS does not apply it — you must also set `font-family` on `body` or specific elements.
**How to avoid:** After defining `--font-display` and `--font-body` in `:root`, explicitly set `body { font-family: var(--font-body); }` and apply `var(--font-display)` to headings.
**Warning signs:** Fonts appear in the browser's font inspector as "downloaded" but DevTools shows `font-family: system-ui` still applied.

### Pitfall 5: Missing crossorigin on gstatic preconnect

**What goes wrong:** Preconnect to `fonts.gstatic.com` without `crossorigin` attribute means the browser opens the connection in non-CORS mode, then must reopen it with CORS for the actual font fetch — negating the preconnect benefit.
**Why it happens:** Fonts are fetched as cross-origin anonymous resources; preconnect must match the fetch mode.
**How to avoid:** Always include `crossorigin` on the gstatic preconnect: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`.
**Warning signs:** No visible error, but fonts load slightly slower than expected.

---

## Code Examples

### Complete index.html head block

```html
<!-- index.html -->
<!-- Source: Google Fonts documentation + web.dev font loading guide -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Save the Date — Aaron &amp; Rina</title>

    <!-- Google Fonts: preconnect to reduce latency -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Jost:wght@300;400;500;600&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Complete src/index.css replacement

```css
/* src/index.css — Design tokens + global reset */
/* Source: CLAUDE.md design system spec */
:root {
  --forest:     #0B1610;
  --gold:       #BF9B5A;
  --gold-light: #D4B57A;
  --cream:      #EAE0CB;
  --muted:      #72685A;

  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'Jost', system-ui, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--forest);
  color: var(--cream);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100svh;
}
```

### src/main.jsx with BrowserRouter

```jsx
// src/main.jsx
// Source: https://reactrouter.com/start/modes
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

### src/App.jsx minimal shell

```jsx
// src/App.jsx — placeholder shell for Phase 1
// All save-the-date content added in Phase 2+
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      {/* Save the Date — Phase 2 */}
    </div>
  )
}

export default App
```

```css
/* src/App.module.css */
.app {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

**Note on App.css:** The existing `src/App.css` (non-module, Vite scaffold) should be deleted and replaced with `src/App.module.css` (CSS Module). This aligns with CLAUDE.md's "always CSS Modules variables" rule and sets the convention for all future components.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — this is a Vite SPA with no test runner configured |
| Config file | None |
| Quick run command | `npm run dev` (manual browser verification) |
| Full suite command | `npm run build` (Vite build must succeed with 0 errors) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | BrowserRouter wraps App, no console errors | smoke (manual) | `npm run dev` — open browser, check console | N/A |
| FND-02 | Cormorant Garamond + Jost render, no system font | smoke (manual) | `npm run dev` — inspect DevTools > Fonts | N/A |
| FND-03 | Five CSS vars defined and inherited | smoke (manual) | `npm run dev` — DevTools computed styles show `--forest` etc. on `:root` | N/A |

All three FND requirements are visual/environmental — they cannot be meaningfully automated without a browser test harness (Playwright/Vitest). For Phase 1, manual browser inspection is the appropriate validation strategy.

### Wave 0 Gaps

- [ ] No test framework is installed. Phase 1 validation is manual browser inspection only.
- [ ] If future phases require automated testing, consider adding Vitest + `@testing-library/react` in Phase 5.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server | Yes | 23.10.0 | — |
| npm | Package management | Yes | 10.9.2 | — |
| Vite | Dev server + build | Yes (installed) | 8.0.12 | — |
| Google Fonts CDN | FND-02 (font loading) | Requires internet | — | Self-host via fontsource (not needed if dev machine has internet) |

**Missing dependencies with no fallback:** None.

**Note on Google Fonts offline:** If the dev environment has no internet access, fonts will not load from the CDN and FND-02 cannot be verified. In that case, use `@fontsource/cormorant-garamond` + `@fontsource/jost` as local fallback. This is unlikely for this project but documented for completeness.

---

## Open Questions

1. **App.css deletion vs. clearing**
   - What we know: `src/App.css` is the Vite scaffold stylesheet, not a CSS Module. It will conflict with the wedding design.
   - What's unclear: Whether the planner should delete it entirely or empty it. Either works; deletion is cleaner but requires removing the import in App.jsx.
   - Recommendation: Delete `src/App.css`, create `src/App.module.css`, update the import in `App.jsx`.

2. **Title tag in index.html for Phase 1**
   - What we know: CLAUDE.md says `document.title` is set to "Save the Date – For {name}" when `?to=` is present (that's Phase 3 work). The static `<title>` in index.html is the fallback.
   - What's unclear: What the default title should be for Phase 1 (before personalization is wired).
   - Recommendation: Set `<title>Save the Date — Aaron &amp; Rina</title>` in index.html now. Phase 3 will dynamically override it when `?to=` is present.

3. **`react-router-dom` vs `react-router` import**
   - What we know: v7 unifies the package; `react-router-dom` re-exports but is deprecated. Both packages are currently installed (react-router-dom@7.16.0 includes react-router@7.16.0 as a dependency).
   - Recommendation: Import from `"react-router"` throughout the project. Do NOT add a separate `import from "react-router-dom"` anywhere.

---

## Sources

### Primary (HIGH confidence)
- [React Router v7 — Picking a Mode](https://reactrouter.com/start/modes) — confirmed BrowserRouter import path and declarative mode setup
- [React Router v7 — useSearchParams API](https://reactrouter.com/api/hooks/useSearchParams) — confirmed import from `"react-router"`
- Direct repo inspection (`package.json`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `index.html`) — verified actual installed versions and current file state

### Secondary (MEDIUM confidence)
- [web.dev — Preload optional fonts](https://web.dev/preload-optional-fonts/) — font-display: swap + preconnect strategy
- [Google Fonts — Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) — weights 300–700 + italic confirmed via multiple sources
- [Google Fonts — Jost](https://fonts.google.com/specimen/Jost) — weights 100–900 (variable font), using 300–600
- CSS specification — `:root` custom properties are globally inherited; CSS Modules scope applies only to class selectors, not custom property declarations on `:root`

### Tertiary (LOW confidence — training data, not verified against live docs)
- Pattern: `crossorigin` required on gstatic preconnect — widely documented, not independently verified against current Chrome behavior in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack (actual installed versions): HIGH — verified from package.json + npm list
- React Router v7 import path: HIGH — verified against official docs
- Architecture patterns: HIGH — simple, standard patterns; no complex dependencies
- Google Fonts URL format: MEDIUM — weights/URL structure verified via multiple sources; exact URL should be tested in browser
- Pitfalls: HIGH — most derived from direct repo inspection (actual files show the conflicts)

**Research date:** 2026-05-28
**Valid until:** 2026-08-28 (stable stack; React Router v7 + Vite 8 unlikely to break these patterns in 90 days)
