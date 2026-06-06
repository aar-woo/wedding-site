---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Guest Identity & Deploy — SHIPPED
status: v2.0 milestone complete — archived + tagged; awaiting next milestone
stopped_at: Completed v2.0 milestone (archived to milestones/)
last_updated: "2026-06-03T04:00:00.000Z"
last_activity: 2026-06-03
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 16
  completed_plans: 16
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-03 after v2.0 completion)

**Core value:** When a guest opens their link, they feel the warmth and elegance of the invitation immediately — a beautiful, personalized, smoothly-animated reveal of "Aaron & Rina · May 30, 2027 · Oahu, Hawaii."
**Current focus:** Planning next milestone (expected: RSVP flow) — run `/gsd:new-milestone`

## Current Position

Milestone: v2.0 Guest Identity & Deploy — SHIPPED 2026-06-03 (archived + tagged)
Live: https://wedding-site-ten-omega.vercel.app
Next: define next milestone via /gsd:new-milestone

Progress: [██████████] v2.0 100% (Phases 6–9 complete; v1.0 Phases 1–4 complete; Phase 5 superseded)

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 2min | 3 tasks | 6 files |
| Phase 02-static-page P01 | 25min | 3 tasks | 3 files |
| Phase 03-personalization-countdown P01 | 2min | 3 tasks | 4 files |
| Phase 03-personalization-countdown P02 | 2min | 2 tasks | 3 files |
| Phase 06 P01 | 4min | 3 tasks | 6 files |
| Phase 07 P01 | 2m 22s | 3 tasks | 5 files |
| Phase 07 P03 | 4 | 3 tasks | 2 files |
| Phase 08 P01 | 70s | 2 tasks | 2 files |
| Phase 08 P02 | 112s | 3 tasks | 3 files |
| Phase 09 P01 | 91s | 2 tasks | 2 files |
| Phase 09-mobile-polish-deploy P02 | 3min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Init: CLAUDE.md is the binding design contract — do not re-derive design values
- Init: Hero image already in repo at `/public/images/save-the-date-hero.png`
- Init: Default copy settled (location "Oahu, Hawaii", footer "Formal invitation to follow")
- [Phase 01-foundation]: Import BrowserRouter from 'react-router' (React Router v7 unified package) to avoid deprecated -dom console warnings
- [Phase 01-foundation]: Replace index.css wholesale (not patch) — Vite scaffold CSS conflicts with wedding design system
- [Phase 01-foundation]: Google Fonts in index.html head (not React component) — prevents render-blocking waterfall
- [Phase 02-static-page]: Couple name display order changed to Rina & Aaron at user request during visual checkpoint
- [Phase 02-static-page]: App.jsx reduced to thin wrapper — page owns full-viewport layout, App.module.css left in place but unused
- [Phase 02-static-page]: Mobile responsiveness deferred to Phase 5 — only desktop sizes implemented in Phase 2
- [Phase 03-personalization-countdown]: Import useSearchParams from 'react-router' (not 'react-router-dom') to match React Router v7 installed package
- [Phase 03-personalization-countdown]: GuestGreeting renders in resting state only — no Framer Motion animation deferred to Phase 4
- [Phase 03-personalization-countdown]: AnimatePresence mode=popLayout with key={value} for per-tick digit swap; numberCell with overflow:hidden prevents layout jumps
- [Phase 03-personalization-countdown]: CountdownTimer frozen at zeros when diff<=0 — no negative display
- [v2.0 milestone]: Datastore: Neon Postgres (Vercel Marketplace, no inactivity pause, relational for future RSVP columns)
- [v2.0 milestone]: Greeting scheme: signed name in link — opaque stable nanoid `id` + HMAC-SHA256 signed display-name payload; client decodes name with NO network round-trip
- [v2.0 milestone]: Backend: Vercel serverless functions via /api (Node runtime, NOT Edge — deprecated)
- [v2.0 milestone]: Link generation: local Node script only; guest list + signing secret NEVER committed
- [v2.0 milestone]: Security: signing secret (GUEST_TOKEN_SECRET) + DB URL are server-only env vars, never VITE_-prefixed
- [v2.0 milestone]: URL shape: /i/<nanoid>?t=<base64url-payload>.<base64url-hmac> — locked before any code; changing it forces re-issue of all guest links
- [v2.0 milestone]: vercel.json: /api passthrough rule first, then /(.*) SPA catch-all — order is critical (catch-all-first intercepts all /api/ requests)
- [v2.0 milestone]: Phase 5 (Polish & Deploy) superseded — EXP-01, EXP-02, DEPLOY-01 absorbed into v2.0 Phases 8–9
- [Phase 06]: HMAC-SHA256 via node:crypto (not jose/JWT) — zero-dep, sufficient for signing display names
- [Phase 06]: Trust boundary: scripts/lib/ (Node+secret-bearing) vs src/lib/ (browser-safe, no secret)
- [Phase 06]: GUEST_TOKEN_SECRET + DATABASE_URL never VITE_-prefixed; contract locked before Phase 7 link minting
- [Phase 07]: Use deleted_at TIMESTAMPTZ (not is_active BOOLEAN) for soft-delete — self-documenting timestamp, idiomatic WHERE deleted_at IS NULL filter
- [Phase 07]: node --env-file=.env.local over dotenv for zero-dep env loading (Node 20+ built-in, Node v23 installed)
- [Phase 07]: No SITE_BASE_URL set — links use placeholder host; must regenerate links.csv after Phase 9 deployment
- [Phase 07]: Soft-delete confirmed live: deleted_at set on removed CSV row, id and row preserved in Neon
- [Phase 08]: Token-first resolution in useGuestName: ?t= decoded client-side via decodeGuestToken, then ?to= legacy fallback, then 'Our Beloved Guests' — no fetch, no network call
- [Phase 08]: App.jsx Routes: /i/:id (durable identity) + /* catch-all both render SaveTheDatePage inside MotionConfig; import from 'react-router' (not react-router-dom)
- [Phase 08]: Legacy handler signature used for api/guest/[id].js — req.query.id simpler than Web API URL parsing for a single bracket-param endpoint
- [Phase 08]: Criterion #4 (cold deep-link /i/:id -> SPA not 404) deferred to Phase 9 deploy verification — not testable locally without Vercel CDN
- [Phase 09]: Raised botanicalPair bottom to 220px (within 200-240px range) to clear contentBlock top edge on 375x667 — botanicals flank couple-name area without overlapping date/countdown text
- [Phase 09]: Base-block-only edits (topGroup padding, coupleNames/date/location margins, contentBlock padding, countdown margin) fit 375x667 with no font-size reductions — font reduction was last resort and not needed
- [Phase Phase 09-02]: Use useReducedMotion() at variant layer (not CSS hacks) for reduced-motion snap-in per CLAUDE.md animation rules
- [Phase Phase 09-02]: Approach B: override fadeUpVariants/coupleNamesVariants/dividerVariants in SaveTheDatePage for full snap-in (opacity=1 in hidden state), not just pathLength
- [Phase Phase 09-02]: Lift useReducedMotion to CornerBrackets default export; thread bracketPathVariants as prop to CornerBracket helper — hooks cannot be called in non-component functions
- [quick-260602-nu0]: dbOverride stores { id, displayName } not bare string — avoids synchronous setState in effect (ESLint rule), stale names auto-invalidated by id comparison
- [quick-260606-gy7]: Inline styles in email-template.js are the one legitimate exception to CLAUDE.md no-inline-styles rule — email clients require table-based layouts with inline styles (CSS Modules target React app, not transactional email)
- [quick-260606-gy7]: invited_at set ONLY after confirmed SMTP success — failed send leaves guest un-marked for retry on next run (idempotency per EMAIL-01)

### Pending Todos

- Define next milestone via `/gsd:new-milestone` (expected: RSVP flow on the v2.0 identity foundation)
- (Optional debt) Backfill Phase 9 `VERIFICATION.md` + run `/gsd:validate-phase 07/08/09` to close Nyquist gaps

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260529-os0 | Update the styling of the hero image card on desktop view to be a larger greeting card view, not iphone sized card. | 2026-05-30 | 64f6753 | [260529-os0-update-the-styling-of-the-hero-image-car](./quick/260529-os0-update-the-styling-of-the-hero-image-car/) |
| 260530-oto | Move the "Save the Date" label to the very top of the hero container, with spacing between it and the rest of the content block | 2026-05-31 | c3ce4f0 | [260530-oto-move-the-save-the-date-label-to-the-very](./quick/260530-oto-move-the-save-the-date-label-to-the-very/) |
| 260602-nu0 | Wire frontend to fetch authoritative guest name from DB via /api/guest/:id — abort-safe DB override in useGuestName with instant token-name render | 2026-06-02 | 2e5c80b | [260602-nu0-wire-frontend-to-fetch-authoritative-gue](./quick/260602-nu0-wire-frontend-to-fetch-authoritative-gue/) |
| 260605-s5q | Make BotanicalSvg drawing animation loop every 7s (ambient redraw) via keyframe arrays with opacity fade reset; reduced-motion static unchanged | 2026-06-06 | 4df6832 | [260605-s5q-make-the-botanicalsvg-drawing-animation-](./quick/260605-s5q-make-the-botanicalsvg-drawing-animation-/) |
| 260606-gy7 | Add email send step: send-invites CLI + Gmail SMTP via Nodemailer + invited_at DB column + pure email-template module + TDD tests | 2026-06-06 | f7b01aa | [260606-gy7-add-email-send-step-for-guest-invitation](./quick/260606-gy7-add-email-send-step-for-guest-invitation/) |

## Session Continuity

Last session: 2026-06-06T07:16:48Z
Stopped at: Completed quick task 260606-gy7 (3 tasks: migration ALTER, TDD email-template, send-invites CLI)
Resume file: None
