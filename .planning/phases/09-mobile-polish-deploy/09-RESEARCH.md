# Phase 9: Mobile Polish & Deploy — Research

**Researched:** 2026-06-01
**Domain:** Mobile CSS viewport layout, Framer Motion reduced-motion, Vercel SPA+serverless deploy, Neon env-var wiring
**Confidence:** HIGH (Vercel/Neon/Framer Motion official docs; MEDIUM for pathLength reduced-motion behavior — single-source uncertainty noted)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Mobile polish (EXP-01)**
- D-01: Verify & fix only. Treat existing mobile-first CSS as the intended design. Fix only what overflows, clips, or is illegible — no redesign.
- D-02: One screen, no scroll. Full keepsake (Save-the-Date label, couple names, divider, date, location, countdown, footer, botanicals) must be visible at once on open. Tighten sizes/spacing to fit within `100svh`. Note the layout risk: `.topGroup` is pinned `top`, `.contentBlock` is pinned `bottom`, `.botanicalPair` sits at `bottom: 180px` — these are independently anchored and can crowd/collide on short viewports.
- D-03: 375px is the supported floor. Covers iPhone SE 2/3, iPhone 12–14, and most modern phones. 320px is not a commitment.
- D-04: Portrait-first, best-effort landscape.

**Mobile animation / jank (EXP-02)**
- D-05: Ship the full entrance sequence on mobile. Optimize only on measured jank — no preemptive stripping.
- D-06: Judge "no jank" via Chrome DevTools — device emulation + 4–6× CPU throttle, watching performance panel during botanical draw-in and countdown ticks.
- D-07: Extend `prefers-reduced-motion` to the whole sequence. Under reduced-motion, content must SNAP IN — skip corner-bracket pathLength draw, staggered botanical stroke draws, and fadeUps — not just freeze Ken Burns. Hook the Framer Motion variant/transition layer, not per-element hacks.
- D-08: Optimize in place is the first-line escape hatch (GPU-friendly transform/opacity only, `will-change`, reduced repaint area) before any mobile-only simplification.

**Deployment (DEPLOY-01)**
- D-09: Default to auto `*.vercel.app` URL — no custom domain this phase.
- D-10: User provisions production env vars in Vercel dashboard: `DATABASE_URL` (via Neon integration), `GUEST_TOKEN_SECRET`, `SITE_BASE_URL` (set to live domain). All server-only — NEVER `VITE_`-prefixed. **Requires user action** before production verification can pass.
- D-11: Git-connected Vercel project, auto-deploy from `main`. SPA build (`vite build`) + `/api` serverless functions (Node runtime, not Edge) + Neon. `vercel.json` rewrite order stays locked.
- D-12 (NON-NEGOTIABLE): Once live domain exists, set `SITE_BASE_URL` to it and re-run `npm run db:generate-links` so `links.csv` URLs point at production.

**Production verification**
- D-13: Verify full v2.0 stack live with one real `links.csv` row: (a) cold deep-link `/i/:id` serves the SPA not a 404, (b) personalized greeting renders from `?t=` token, (c) `GET /api/guest/:id` returns 200.

### Claude's Discretion
- Deployment model (Node runtime vs Edge, Git-connected auto-deploy): defaults above; user did not select this area, flag if wrong.
- Production verification method: one real links.csv row, three checks per D-13.

### Deferred Ideas (OUT OF SCOPE)
- Custom domain — default `*.vercel.app`; revisit later.
- 320px / very-small-device support — not committed; 375px is the floor.
- Dedicated landscape tuning — best-effort only.
- Proactive mobile motion reduction — explicitly rejected (D-05); full sequence ships.
- Real-device perf lab / analytics / rate limiting / observability — not required by Phase 9.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-01 | Layout is responsive and legible on mobile (375px) and desktop | CSS audit: `.topGroup` + `.contentBlock` + `.botanicalPair` independently anchored — collision risk on short viewports; countdown flex row fits 375px; `100svh` already in use |
| EXP-02 | Animations run smoothly without jank on a typical mobile device | `MotionConfig reducedMotion="user"` already present; pathLength draws need explicit reduced-motion treatment; Chrome DevTools 4–6× CPU throttle is the measurement gate |
| DEPLOY-01 | Site deploys live to Vercel (Git-connected, vercel.app URL), SPA build + `/api` serverless functions + Neon env config | Vercel auto-detects Vite (build: `vite build`, output: `dist`); `/api` directory auto-registered as Node functions; Neon integration injects `DATABASE_URL` for production |
</phase_requirements>

---

## Summary

Phase 9 has three parallel workstreams: (1) CSS layout audit and tightening for 375px one-screen fit, (2) extending `prefers-reduced-motion` across the full animation sequence, and (3) Vercel deploy with prod env vars and end-to-end production verification. Each workstream has clear known-state: the mobile CSS is mobile-first but independently-anchored groups can collide on short viewports; `MotionConfig reducedMotion="user"` is already present in App.jsx but only benefits opacity animations by default — the pathLength draws and fadeUps need explicit reduced-motion variant overrides; Vercel auto-detects Vite and `api/` directory, requiring only Git connect + env vars in the dashboard.

The reduced-motion work is the highest-risk piece from a research standpoint: the `MotionConfig reducedMotion="user"` already in App.jsx automatically snaps transforms (y, scale) to their end value and preserves opacity animation. However, `pathLength` is an SVG-specific animated value and official docs do not confirm it is treated identically to CSS transforms under `reducedMotion`. The safe implementation is to use `useReducedMotion()` inside `BotanicalSvg` and `CornerBrackets` to explicitly set `pathLength` to `1` and `opacity` to `1` in the `initial` state when reduced motion is preferred — making the paths fully drawn on mount, no draw animation.

The deploy workflow has one hard user-action dependency: the live Vercel domain must exist before `SITE_BASE_URL` can be set and `db:generate-links` re-run. The plan must contain an explicit pause/gate for user action at this point.

**Primary recommendation:** Audit mobile CSS for collision/overflow → tighten with targeted CSS edits inside the base (non-768px) block only → add `useReducedMotion()` to BotanicalSvg + CornerBrackets to snap pathLength to end state → deploy via Vercel dashboard (Git connect, auto Vite detect) → user adds env vars in dashboard → regenerate links.csv → verify live with one real link.

---

## Standard Stack

### Core (already installed — verified from package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.40.0 | Animation variants, staggerChildren, pathLength, MotionConfig | Already installed; provides `useReducedMotion` hook |
| react-router-dom | 7.16.0 | `useSearchParams`, `useParams` for token resolution | Already installed and in use |
| @neondatabase/serverless | ^1.1.0 | Neon Postgres HTTP driver for `/api` functions | Already installed and wired in `api/guest/[id].js` |

### Framer Motion Package Note

**IMPORTANT:** The project imports `framer-motion` (v12.40.0). The package was renamed to `motion` in 2025, but the import path `framer-motion` still works and this project has not migrated. Do not change the import path. `useReducedMotion` is available from `framer-motion` in v12.

```javascript
import { useReducedMotion } from 'framer-motion';
```

**No new packages needed** for this phase. All required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure (current — no new directories needed)

```
wedding-site/
├── api/guest/[id].js          # Already deployed as Node serverless function
├── src/
│   ├── App.jsx                # MotionConfig reducedMotion="user" already present
│   ├── components/
│   │   ├── BotanicalSvg.jsx   # MODIFY: add useReducedMotion snap-in
│   │   └── CornerBrackets.jsx # MODIFY: add useReducedMotion snap-in
│   └── pages/
│       └── SaveTheDatePage.module.css  # MODIFY: base block only (not 768px block)
└── vercel.json                # LOCKED — do not modify
```

### Pattern 1: Mobile 100svh One-Screen Fit

**What:** The page uses `100svh` (small viewport height) — already the correct unit for mobile because it sizes to the viewport with the browser chrome visible, preventing content overflow on first load.

**The collision risk (D-02):** Three independently-anchored groups:
- `.topGroup`: `position: absolute; top: 20px; padding: 48px 12px 0` — contains Save-the-Date label + divider + couple names
- `.botanicalPair`: `position: absolute; bottom: 180px` — flanks the couple name area
- `.contentBlock`: `position: absolute; bottom: 0; padding: 0 28px 48px` — contains greeting, date, location, countdown, footer

On a 375×812px viewport (iPhone 12), there is adequate vertical space. On a 375×667px viewport (iPhone SE), the `bottom: 180px` for `.botanicalPair` combined with the height of `.contentBlock` (greeting + date + location + countdown + footer) may cause collision. The fix strategy: reduce `.botanicalPair`'s `bottom` offset and/or reduce `.contentBlock` padding/margin values at 375px.

**Do not touch the `@media (min-width: 768px)` block** — desktop card view is locked per D-02 and CONTEXT.md.

**Measurement first:** Open Chrome DevTools → Device Toolbar → set to 375×667 (iPhone SE) → identify what clips or overflows before writing any code.

**Fix strategy (tighten, don't redesign):**
- Reduce `.contentBlock` bottom padding: `48px` → smaller value
- Reduce margins between content elements (`.date`, `.location`, `.footer`, `.countdown`)
- Reduce `.botanicalPair bottom` offset if botanicals overlap content
- Reduce `.topGroup` padding-top if header crowds botanicals
- `font-size` reductions only if content cannot otherwise fit (last resort, using `clamp()` already present on `.label`)

**svh support:** `100svh` has broad support in all modern browsers (iOS 16+, Chrome 108+, Firefox 101+). No polyfill needed. The project already uses it — confirmed in `SaveTheDatePage.module.css` lines 3 and 14.

```css
/* Pattern for tightening — edit only in the base block (no media query) */
.contentBlock {
  padding: 0 28px 32px; /* reduce from 48px */
}
.location {
  margin: 0 0 20px; /* reduce from 32px */
}
```

### Pattern 2: prefers-reduced-motion — Snap-In for pathLength Draws

**What:** `MotionConfig reducedMotion="user"` is already present in App.jsx. Research confirms:
- **CSS transforms** (y, scale, scaleX) — automatically snapped to their `animate` end value (not initial value, not zero) when reduced motion is active. This means `fadeUpVariants` (y: 12→0) and `coupleNamesVariants` (scale: 0.96→1) and `dividerVariants` (scaleX: 0→1) all snap instantly to their visible end state.
- **opacity** — preserved and animates normally under `reducedMotion="user"` (opacity is not classified as a transform).
- **pathLength** — SVG-specific value, NOT a standard CSS transform. Official docs do not confirm it is automatically snapped. This creates a risk: under reduced motion, `pathLength` may stay at `0` (initial), leaving the botanical strokes and corner brackets invisible.

**Critical gap requiring explicit fix:** The Ken Burns CSS animation is already guarded by `@media (prefers-reduced-motion: no-preference)` in SaveTheDatePage.module.css. The `MotionConfig reducedMotion="user"` handles transforms. But `pathLength: 0→1` draws in `BotanicalSvg.jsx` and `CornerBrackets.jsx` need explicit handling to ensure paths appear (drawn to full) when reduced motion is on.

**Pattern — use `useReducedMotion` hook in each SVG component:**

```javascript
// Source: motion.dev/docs/react-accessibility (pattern), framer-motion v12
import { motion, useReducedMotion } from 'framer-motion';

export default function BotanicalSvg({ flipped = false, opacity = 1 }) {
  const reduceMotion = useReducedMotion();

  // When reduced motion is preferred: snap paths to fully drawn (pathLength=1),
  // show immediately (opacity=1). Skip the draw animation entirely.
  const branchVariants = reduceMotion
    ? { hidden: { pathLength: 1, opacity: 1 }, visible: { pathLength: 1, opacity: 1 } }
    : {
        hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 1.0, ease: EASE } },
      };

  // dot variants same pattern
  const dotVariants = reduceMotion
    ? { hidden: { scale: 1, opacity: 1 }, visible: { scale: 1, opacity: 1 } }
    : { hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: EASE } } };

  // svgVariants: when reduced motion, no stagger needed either
  const svgVariants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

  // ... rest of JSX unchanged, uses these variants
}
```

Apply the same pattern to `CornerBrackets.jsx`:

```javascript
// CornerBrackets.jsx
import { motion, useReducedMotion } from 'framer-motion';

export default function CornerBrackets() {
  const reduceMotion = useReducedMotion();

  const bracketPathVariants = reduceMotion
    ? { hidden: { pathLength: 1, opacity: 1 }, visible: { pathLength: 1, opacity: 1 } }
    : { hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: EASE } } };

  const bracketsContainerVariants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

  // ...
}
```

**Why NOT CSS media query instead of useReducedMotion:** The `strokeDasharray="0 1"` pattern used here is a Framer Motion-specific SVG animation technique that is controlled by JS variant state. A CSS `@media (prefers-reduced-motion: reduce)` approach would need to fight the Framer Motion transform pipeline. Using `useReducedMotion()` hooks directly into the same variants layer that controls the animation — no fighting the pipeline, consistent with CLAUDE.md guidance to hook the variant/transition layer.

**fadeUp/stagger sequences:** Already handled correctly. `MotionConfig reducedMotion="user"` snaps y, scale, scaleX to end values automatically. The `fadeUpVariants` result: elements appear at `opacity: 0` initially but animate to `opacity: 1` (opacity is preserved). This is acceptable — content snaps in without y-movement, with a gentle opacity fade. The CONTEXT.md D-07 says "content should snap in — skip... fadeUps" — to fully achieve instant snap-in (no opacity fade either), implement the same `useReducedMotion` override in `SaveTheDatePage.jsx` to replace `fadeUpVariants` with instant variants.

**Implementation choice — two approaches:**

| Approach | What it does | Effort | D-07 compliance |
|----------|-------------|--------|-----------------|
| A: Keep `MotionConfig` + fix pathLength only | Transforms snap (y/scale), opacity still fades, pathLength draws fixed | Low | Partial — opacity still animates 0→1 |
| B: Keep `MotionConfig` + fix pathLength + override fadeUp variants in SaveTheDatePage.jsx | All transforms AND opacity instantly at end state | Medium | Full — truly snaps in |

**Recommendation: Approach B.** D-07 says content "snaps in" — the opacity fade is subtle but still motion. Both pathLength components and the page-level variants need `useReducedMotion` override. The page-level change is in `SaveTheDatePage.jsx` constants: when `reduceMotion === true`, replace `fadeUpVariants`, `coupleNamesVariants`, `dividerVariants` with instant end-state variants.

### Pattern 3: Vercel Deploy — Vite SPA + /api Node Functions + Neon

**Build settings (Vercel auto-detects Vite):**

| Setting | Value | Override needed? |
|---------|-------|-----------------|
| Framework Preset | Vite (auto-detected) | No |
| Build Command | `npm run build` → `vite build` | No |
| Output Directory | `dist` | No |
| Install Command | `npm install` (auto-detects package-lock.json) | No |
| Node.js Version | Set in Project Settings | Yes — match local (v23.x or select v22 LTS) |

**`/api` functions:** Vercel auto-discovers `api/` directory. Each file in `api/` becomes a serverless function. `api/guest/[id].js` uses the legacy Node.js `(req, res)` handler signature with `request.query.id` — this is a Node-runtime pattern (not Web API), confirmed valid by Vercel docs. Default runtime for `/api/*.js` files is **Node.js** — no `vercel.json` runtime config needed.

**vercel.json — LOCKED, do not modify:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```
This is the correct and complete config. Vercel evaluates rewrites in order; the `/api/(.*)` rule fires first, then the SPA catch-all handles all other routes including `/i/:id`.

**Deployment sequence (order matters — user action required):**

1. Push `main` to GitHub (already connected: `https://github.com/aar-woo/wedding-site.git`)
2. Create new Vercel project: Vercel dashboard → "Add New Project" → Import from GitHub → select `aar-woo/wedding-site`
3. Vercel auto-detects Vite framework → auto-populates Build Command + Output Directory
4. **Do NOT set env vars yet** — get the domain first
5. Click "Deploy" → Vercel deploys and assigns `*.vercel.app` domain
6. **USER ACTION — HARD GATE:** Note the live `*.vercel.app` domain
7. **USER ACTION:** Vercel dashboard → Settings → Environment Variables → add:
   - `GUEST_TOKEN_SECRET` = (copy from .env.local) — Production only, Sensitive
   - `SITE_BASE_URL` = `https://<your-project>.vercel.app` — Production only
   - `DATABASE_URL` = provided by Neon integration (see step 8)
8. **USER ACTION:** Connect Neon integration: Neon Console → Integrations → Add Vercel → Link Existing Neon Account → select Vercel project + Neon project → Connect. This auto-injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` into Production + Development environments.
9. Redeploy (trigger redeploy after env vars are set): Vercel dashboard → Deployments → Redeploy, or push a commit to `main`
10. Run locally: `SITE_BASE_URL=https://<your>.vercel.app npm run db:generate-links` (or update `.env.local` and run `npm run db:generate-links`)
11. Verify with one real `links.csv` row per D-13

**Node.js version consideration:** Local env is Node v23.10.0. Vercel supports Node 18, 20, 22 (LTS) in Project Settings. Node 23 is not a Vercel LTS option. The `api/guest/[id].js` code uses only standard Node APIs + `@neondatabase/serverless` — compatible with Node 20 or 22. Set Node.js to 22.x in Vercel Project Settings → Build & Development Settings.

**`type: "module"` gotcha:** `package.json` has `"type": "module"`. This means all `.js` files in the project are treated as ES modules. The `api/guest/[id].js` uses `export default function handler(...)` — this is ESM-compatible. Vercel Node runtime handles `"type": "module"` correctly. No issue.

### Pattern 4: Production Verification (D-13)

Three checks, all must pass, using one real row from `links.csv`:

**Check (a): Cold deep-link `/i/:id` serves SPA not 404**
- Open an incognito window → navigate directly to `https://<your>.vercel.app/i/<id>?t=<token>`
- If you see the wedding page (not a 404 or blank): vercel.json catch-all working.
- What it tests: `vercel.json` rewrite `/(.*)` → `/index.html` is serving the SPA for the `/i/` path. This was deferred from Phase 8 because it cannot be tested locally without Vercel's CDN.

**Check (b): Greeting renders from `?t=` token**
- The page opened in check (a) should show "For [Guest Name]" — not "For Our Beloved Guests"
- What it tests: `src/lib/decodeGuestToken.js` client-side decode + `useGuestName` hook resolution

**Check (c): `GET /api/guest/:id` returns 200**
```bash
curl -s https://<your>.vercel.app/api/guest/<id>
# Expected: {"id":"...","displayName":"Guest Name"}
```
- What it tests: Neon `DATABASE_URL` is correctly injected → `api/guest/[id].js` connects and reads the record

### Anti-Patterns to Avoid

- **Do not touch the `@media (min-width: 768px)` CSS block** — desktop card view is locked. All mobile fixes go in the base (unqualified) CSS rules.
- **Do not add `VITE_` prefix** to any env var — confirmed pitfall; `GUEST_TOKEN_SECRET` and `DATABASE_URL` must never be `VITE_`-prefixed.
- **Do not rely solely on `MotionConfig reducedMotion="user"` for pathLength** — it handles CSS transforms; `pathLength` requires explicit override via `useReducedMotion`.
- **Do not redeploy with stale `links.csv`** — links generated before the live domain are not shippable (D-12). The `SITE_BASE_URL` placeholder must be replaced before generating production links.
- **Do not add hardcoded per-element delays** for reduced motion — hook the variant layer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting user's prefers-reduced-motion in React | Custom window.matchMedia listener | `useReducedMotion()` from framer-motion | Already included; handles SSR, re-renders on OS setting change |
| Connecting Postgres in serverless function | Connection pool / TCP management | `neon()` from `@neondatabase/serverless` | HTTP-based driver, no persistent connections — required for cold-start serverless. Already installed and in use. |
| SPA deep-link routing on Vercel | Custom routing logic | `vercel.json` rewrites (already present and locked) | Vercel CDN resolves `/i/:id` → `/index.html` at the edge |
| Env var injection for Neon | Manual DATABASE_URL management | Neon-managed Vercel integration | Auto-injects DATABASE_URL for Production + Preview environments via Neon Console → Integrations → Add Vercel |

---

## Common Pitfalls

### Pitfall 1: Content Below the Fold on Short Viewports (375×667px)

**What goes wrong:** `.topGroup` is `position: absolute; top: 20px`, `.botanicalPair` is `position: absolute; bottom: 180px`, `.contentBlock` is `position: absolute; bottom: 0; padding: 0 28px 48px`. These are independently anchored — they don't participate in a flex/grid flow. On a 667px-tall viewport (iPhone SE), the content block height (greeting ~22px + date ~28px + location ~14px + countdown ~36px + footer ~11px + all margins + padding = approximately 280–300px) leaves the botanical pair at 180px from bottom, which means the botanicals sit at y≈387–487px from top. The topGroup takes approximately 100px. Collision zone: roughly 100px–387px is available for the botanicals + top group overlap buffer. On some very-short viewports this will cause clipping.

**Why it happens:** The layout uses absolute positioning for layered visual effect — botanicals over the hero image. Pure flex/grid would be wrong for this design.

**How to avoid:** First measure — open DevTools → set to 375×667 (iPhone SE) → observe. Then reduce:
1. `.contentBlock` padding-bottom: 48px → 28–32px
2. Margins on `.date`, `.location` (32px → 16–20px), `.footer` (no bottom margin needed)
3. `.botanicalPair bottom` offset: from 180px → match the natural top of the contentBlock
4. Only as a last resort: scale down font sizes inside the content block for mobile

**Warning signs:** Scrollbar appears on body; botanical SVGs overlap countdown text; footer is cut off.

### Pitfall 2: pathLength Paths Stay Invisible Under Reduced Motion

**What goes wrong:** `branchVariants.hidden` sets `pathLength: 0, opacity: 0`. Under `MotionConfig reducedMotion="user"`, CSS transforms snap to end state. But `pathLength` is an SVG filter value — if the library does not classify it as a "transform" requiring snap, the element stays at `pathLength: 0` (invisible). The botanical branches and corner brackets never appear.

**Why it happens:** Official documentation says "transform and layout animations are disabled" — `pathLength` is ambiguous. GitHub issues show it is not always treated as a standard transform.

**How to avoid:** Use `useReducedMotion()` in `BotanicalSvg.jsx` and `CornerBrackets.jsx` to explicitly set `pathLength: 1, opacity: 1` in the `hidden` variant when reduced motion is active. The component then renders fully drawn on mount.

**Warning signs:** Enable "Reduce Motion" in macOS System Preferences → Accessibility → Display; reload the page; botanicals and corner brackets are invisible.

### Pitfall 3: Deploying Without Env Vars Set, Then Not Redeploying

**What goes wrong:** User deploys first (step 5), notes the domain, but then adds env vars in the dashboard without triggering a redeploy. The running deployment was built without those env vars — serverless functions will see `undefined` for `DATABASE_URL` and `GUEST_TOKEN_SECRET`.

**Why it happens:** Vercel env vars take effect on the NEXT deployment, not the current one.

**How to avoid:** After adding env vars in the dashboard, explicitly trigger a redeploy: Vercel dashboard → Deployments → click the latest deployment → "Redeploy" button. Or push a trivial commit to `main`.

**Warning signs:** `GET /api/guest/:id` returns 500; logs show `Cannot read properties of undefined` or `neon connection string undefined`.

### Pitfall 4: `SITE_BASE_URL` Still Placeholder When Generating Production Links

**What goes wrong:** `npm run db:generate-links` uses `process.env.SITE_BASE_URL` to build the link URLs. If `.env.local` still has the placeholder value (or no value) from Phase 7, generated links point at `localhost` or a wrong host. Guests receive broken links.

**Why it happens:** Phase 7 intentionally left `SITE_BASE_URL` unset (D-07 Phase 7) pending the real domain.

**How to avoid:** After the live domain is known, set `SITE_BASE_URL=https://<your>.vercel.app` in `.env.local` and re-run `npm run db:generate-links`. The script will regenerate `links.csv` with correct production URLs. Verify the first row in `links.csv` starts with the correct domain before distributing.

**Warning signs:** First row of `links.csv` shows `http://localhost/i/...` or a blank host.

### Pitfall 5: `type: "module"` + `/api` Functions — ESM Compatibility

**What goes wrong:** `package.json` has `"type": "module"`, so all `.js` files are ESM. `api/guest/[id].js` uses `export default` — correct for ESM. But if any `api/` file inadvertently uses CommonJS (`module.exports`, `require()`), Vercel's Node runtime will throw a syntax error.

**Why it happens:** Mixing ESM and CJS in an `"type": "module"` project.

**How to avoid:** `api/guest/[id].js` already uses `export default` — correct. Do not add `require()` to any file in `api/`. Imports use the full `import { neon } from '@neondatabase/serverless'` ESM syntax — already done.

**Warning signs:** Vercel build log shows "require is not defined in ES module scope".

---

## Code Examples

### Verified: useReducedMotion snap-in pattern for BotanicalSvg

```javascript
// Source: motion.dev/docs/react-accessibility (useReducedMotion pattern),
//         applied to existing BotanicalSvg.jsx variant structure
import { motion, useReducedMotion } from 'framer-motion';

export default function BotanicalSvg({ flipped = false, opacity = 1 }) {
  const reduceMotion = useReducedMotion();
  const EASE = [0.22, 0.61, 0.36, 1];

  const svgVariants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

  const branchVariants = reduceMotion
    ? { hidden: { pathLength: 1, opacity: 1 }, visible: { pathLength: 1, opacity: 1 } }
    : { hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 1.0, ease: EASE } } };

  const dotVariants = reduceMotion
    ? { hidden: { scale: 1, opacity: 1 }, visible: { scale: 1, opacity: 1 } }
    : { hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: EASE } } };

  // JSX unchanged — same motion.svg and motion.path elements, uses these variants
}
```

### Verified: Snap-in override for page-level fadeUp variants

```javascript
// Source: pattern derived from framer-motion v12 docs + motion.dev/docs/react-accessibility
// In SaveTheDatePage.jsx — apply useReducedMotion at the top of the component:
import { motion, useReducedMotion } from 'framer-motion';

function SaveTheDatePage() {
  const reduceMotion = useReducedMotion();

  const fadeUpVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } } };

  // similarly for coupleNamesVariants, dividerVariants
  // ...
}
```

### Verified: Vercel env var addition (dashboard — manual step)

```
Vercel Dashboard → Project → Settings → Environment Variables
→ Add New Variable:
  Name: GUEST_TOKEN_SECRET
  Value: (copy from .env.local GUEST_TOKEN_SECRET value)
  Environments: [x] Production  [ ] Preview  [ ] Development
  Sensitive: yes (hides after save)

→ Add New Variable:
  Name: SITE_BASE_URL
  Value: https://<your-project-name>.vercel.app
  Environments: [x] Production  [ ] Preview  [ ] Development
  Sensitive: no

→ DATABASE_URL: provided automatically by Neon integration (do not add manually)
```

### Verified: link regeneration after deploy

```bash
# After setting SITE_BASE_URL in .env.local to the live domain:
# .env.local: SITE_BASE_URL=https://wedding-site-xxxxxx.vercel.app

npm run db:generate-links
# script reads SITE_BASE_URL from .env.local via node --env-file=.env.local
# rewrites links.csv with correct production URLs
```

### Verified: DevTools jank measurement method

```
Chrome DevTools:
1. F12 → Device Toolbar (Ctrl+Shift+M) → set to iPhone 12 Pro (390×844) or custom 375×667
2. Performance panel → gear icon (Capture Settings) → CPU: 4x slowdown
3. Click "Record" → hard-reload the page → wait for animations to complete → Stop
4. Look for: FPS chart drops below 60fps (green bar dips), long tasks in main thread (red flags)
5. Focus on: botanical draw-in (pathLength animations, staggered), countdown AnimatePresence ticks
6. 4x throttle = typical mid-range Android; 6x throttle = low-end device
```

### Verified: Production verification curl commands

```bash
# After deploy, using a row from links.csv:
DOMAIN=https://your-project.vercel.app
ID=<id from links.csv>

# Check (a): cold deep-link serves SPA
curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/i/$ID?t=test"
# Expected: 200 (not 404)

# Check (c): API endpoint
curl -s "$DOMAIN/api/guest/$ID"
# Expected: {"id":"...","displayName":"Guest Display Name"}

# Check (b): open in browser (visual check only)
echo "$DOMAIN/i/$ID?t=<token-from-links.csv>"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-viewport height on mobile | `100svh` (small viewport height) | ~2022–2023 (Chrome 108, iOS 15.4) | Prevents content overflow behind mobile browser chrome on first load |
| `framer-motion` package | `motion` package (`motion/react`) | 2025 (v11+) | This project still uses `framer-motion` — do NOT migrate in this phase |
| Vercel KV for key-value storage | Upstash Redis (via Marketplace) | December 2024 | Vercel KV deprecated; not relevant — this project uses Neon Postgres which is unaffected |
| CSS `@media (prefers-reduced-motion: reduce)` only | Framer Motion `useReducedMotion()` + `MotionConfig reducedMotion="user"` | Established pattern (~2022+) | JS-layer control gives full variant override; CSS guard still needed for `@keyframes` (Ken Burns — already done) |

**Deprecated / outdated:**
- `@media (prefers-reduced-motion: reduce)` guarding Framer Motion variants: Still works but is the old pattern. The `useReducedMotion` hook is more React-idiomatic.
- Edge Runtime for Vercel Functions: Edge runtime was deprecated for new projects. Node runtime is the standard. `api/guest/[id].js` already uses Node runtime pattern — confirmed correct.

---

## Open Questions

1. **Does `MotionConfig reducedMotion="user"` automatically snap `pathLength` to end state or leave it at initial?**
   - What we know: Official docs say "transform and layout animations disabled." Multiple sources confirm CSS transforms (y, scale, scaleX) snap to their `animate` end value. `pathLength` is an SVG-specific animated value — not classified as a standard CSS transform in the browser's compositor.
   - What's unclear: Whether framer-motion's internal implementation treats `pathLength` as a "transform" subject to the reducedMotion snap behavior.
   - Recommendation: Do not assume. Use `useReducedMotion()` explicitly in `BotanicalSvg` and `CornerBrackets` to set `pathLength: 1` in `hidden` variant when reduced motion is active. This is safe regardless of library behavior. Test by enabling "Reduce Motion" in OS settings.

2. **Which Vercel Node.js version to select?**
   - What we know: Local dev is Node v23.10.0. Vercel offers Node 18, 20, 22 (LTS). The `api/guest/[id].js` code uses `node:crypto`-compatible approach and `@neondatabase/serverless` which supports Node 18+.
   - Recommendation: Select Node 22 (current LTS) in Vercel Project Settings. This is the closest to local without using a non-LTS version.

3. **Will the `react-router-dom` v7 import from `'react-router'` work correctly after Vercel build?**
   - What we know: All imports in `src/` use `'react-router'` (not `'react-router-dom'`), matching the installed package `react-router-dom@7.16.0` which re-exports from the unified `react-router` package. Local dev works.
   - What's unclear: Whether Vercel's Vite build has any tree-shaking issue with this.
   - Recommendation: No change needed; this has worked in local dev since Phase 1. If build fails, investigate.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `db:generate-links` locally | Yes | v23.10.0 | — |
| `npm run build` (`vite build`) | Vercel build | Yes | vite v8.0.12 (in devDeps) | — |
| `.env.local` | `db:generate-links`, local dev | Yes | File present (keys confirmed: DATABASE_URL, GUEST_TOKEN_SECRET, SITE_BASE_URL) | — |
| `links.csv` / `guests.csv` | Link regen | Not verified | gitignored — may exist locally | Must be present before regen step |
| Vercel CLI | Optional (deploy via dashboard instead) | Not installed | — | Use Vercel dashboard (Git-connected deploy — D-11) |
| Vercel account / project | DEPLOY-01 | Not verified | — | User must create and connect |
| Neon project (existing) | DEPLOY-01, DATABASE_URL | Confirmed (Phase 7 provisioned) | — | — |
| GitHub remote | Git-connected deploy | Yes | `https://github.com/aar-woo/wedding-site.git` | — |

**Missing dependencies with no fallback:**
- Vercel account with the project connected to `aar-woo/wedding-site` GitHub repo — user must create if it doesn't exist (plan must include this step with explicit user action gate)

**Missing dependencies with fallback:**
- Vercel CLI: not installed, but dashboard-based deploy is the intended approach (D-11), so this is expected

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node's built-in `node:test` (already used in phases 6–7) |
| Config file | None — scripts run directly with `node --test` |
| Quick run command | `node --test src/lib/decodeGuestToken.test.js` |
| Full suite command | `node --test src/lib/decodeGuestToken.test.js && node --test scripts/lib/token.test.js && node --test scripts/generate-links.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXP-01 | 375px viewport shows all content on one screen, no overflow | Manual / visual | Chrome DevTools 375×667 device emulation | N/A — visual check |
| EXP-01 | Countdown flex row (4×44px + 3×20px gap = 236px) fits 375px | Manual / visual | DevTools or `calc(4*44 + 3*20) = 236px < 375px` | N/A — math verified |
| EXP-02 | No jank during botanical draw-in and countdown ticks | Manual / perf | Chrome DevTools Performance panel, 4–6× CPU throttle | N/A — manual |
| EXP-02 | Under prefers-reduced-motion: pathLength paths fully visible | Manual / functional | Enable OS Reduce Motion → reload → botanicals visible | N/A — visual check |
| EXP-02 | Under prefers-reduced-motion: no y/scale transform animation | Manual / functional | Enable OS Reduce Motion → reload → content snaps in | N/A — visual check |
| DEPLOY-01 | Cold deep-link `/i/:id` returns 200 and serves SPA | Smoke (curl) | `curl -s -o /dev/null -w "%{http_code}" $DOMAIN/i/$ID` | N/A — post-deploy |
| DEPLOY-01 | `GET /api/guest/:id` returns 200 with guest JSON | Smoke (curl) | `curl -s $DOMAIN/api/guest/$ID` | N/A — post-deploy |
| DEPLOY-01 | Personalized greeting renders from `?t=` token | Manual / visual | Open link in browser → verify "For [Name]" | N/A — visual check |
| DEPLOY-01 | Production env vars set (no `VITE_` on secrets) | Static audit | `grep -r "VITE_" .env* src/` → zero secrets | Existing files |

**Notes on validation approach:**
- EXP-01 and EXP-02 are primarily visual/manual — no automated test can verify pixel layout or animation smoothness. The verification strategy is checklist-based with DevTools.
- DEPLOY-01 smoke tests are curl commands run after deploy, not automated CI tests.
- The existing `node:test` suite covers token decode/encode (pre-existing) — not relevant to this phase's new work.

### Sampling Rate

- **Per task commit:** `grep -r "VITE_" .env* src/` — verify no secrets leaked
- **Per wave merge:** Manual DevTools check at 375×667; reduced-motion visual check
- **Phase gate:** All three D-13 checks pass (curl + browser visual) before marking DEPLOY-01 done

### Wave 0 Gaps

None — existing test infrastructure is sufficient for the automated checks in this phase. All phase verification is visual/manual or post-deploy smoke tests.

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies To |
|-----------|-----------|
| No UI libraries (shadcn, MUI, etc.) | All code changes |
| CSS Modules only — no inline style values for design values | Mobile CSS fixes must use CSS Module variables |
| Design system colors must use CSS variables (`var(--forest)`, `var(--gold)`, etc.) | Any new CSS |
| Fonts: Cormorant Garamond + Jost only, never Inter/Roboto/system | No font changes needed this phase |
| Animation: `variants` + `staggerChildren` — no hardcoded per-element delays | Reduced-motion fix must hook variant layer, not add delays |
| Framer Motion: `variants` + `staggerChildren`, min 0.8s/element, ease `[0.22, 0.61, 0.36, 1]` | New variants must preserve these values for the non-reduced-motion path |
| `GUEST_TOKEN_SECRET`, `DATABASE_URL` never `VITE_`-prefixed | Env var configuration |
| Server-only secrets live in `scripts/`/`api/`; `src/` stays secret-free | No changes to secret access patterns |
| Do not add routing beyond the single page | No new routes |

---

## Sources

### Primary (HIGH confidence)
- [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) (last updated 2026-03-09) — build command, output dir, SPA rewrites
- [Vercel: Using the Node.js Runtime with Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js) (last updated 2026-05-19) — `/api/*.js` auto-registered as Node functions, legacy handler signature confirmed
- [Vercel: Configuring a Build](https://vercel.com/docs/builds/configure-a-build) (last updated 2026-03-17) — Vite auto-detection, build settings, Node.js version selection
- [Neon: Neon-Managed Vercel Integration](https://neon.com/docs/guides/neon-managed-vercel-integration) — DATABASE_URL injection, environment coverage, setup steps
- [Motion: useReducedMotion](https://motion.dev/motion/use-reduced-motion/) — boolean hook, use pattern
- [Motion: Create accessible animations in React](https://motion.dev/docs/react-accessibility) — MotionConfig reducedMotion="user" behavior
- project source files: `App.jsx`, `SaveTheDatePage.jsx`, `SaveTheDatePage.module.css`, `BotanicalSvg.jsx`, `CornerBrackets.jsx`, `CountdownTimer.module.css`, `vercel.json`, `package.json`

### Secondary (MEDIUM confidence)
- [Motion GitHub issue #2771: animate() automatically disables all transform & layout animations](https://github.com/motiondivision/motion/issues/2771) — confirms transform behavior under reducedMotion; opacity preserved
- [CSS-Tricks: The New CSS Viewport Units (svh, dvh, lvh)](https://dev.to/web_dev-usman/the-new-css-viewport-units-that-finally-fix-mobile-layouts-2cjd) — 100svh behavior on mobile
- [Chrome DevTools: Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance) — CPU throttle method for jank measurement
- [ARCHITECTURE.md](../../research/ARCHITECTURE.md) — verified Neon + Vercel + SPA deployment pattern

### Tertiary (LOW confidence)
- Multiple WebSearch results confirming MotionConfig reducedMotion="user" snaps transforms to end state — consistent across sources but not from a single definitive official doc with a code example proving snap-to-end vs snap-to-initial

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages already installed and in use; versions verified from package.json
- Architecture: HIGH — Vercel auto-detection confirmed from official docs; pathLength behavior MEDIUM due to ambiguity
- Pitfalls: HIGH — collision risk from code audit; env var pitfalls from PITFALLS.md; pathLength risk from GitHub issue analysis
- Deployment sequence: HIGH — Vercel + Neon docs confirm each step

**Research date:** 2026-06-01
**Valid until:** 2026-09-01 (stable stack; Vercel/Neon integration patterns rarely change)
