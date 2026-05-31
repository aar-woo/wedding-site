---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Personalized Guest-Link Identity + RSVP Foundation
status: planning
stopped_at: "Phase 6 complete & verified; planning Phase 7"
last_updated: "2026-05-31T18:36:09.205Z"
last_activity: 2026-05-31
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 8
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-31)

**Core value:** When a guest opens their link, they feel the warmth and elegance of the invitation immediately — a beautiful, personalized, smoothly-animated reveal of "Aaron & Rina · May 30, 2027 · Oahu, Hawaii."
**Current focus:** Phase 06 — identity-token-contract

## Current Position

Phase: 999.1
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-05-31

Progress: [░░░░░░░░░░] 0% (v2.0 phases; v1.0 Phases 1–4 complete)

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

### Pending Todos

- Plan Phase 6: Identity Token Contract (next step)

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260529-os0 | Update the styling of the hero image card on desktop view to be a larger greeting card view, not iphone sized card. | 2026-05-30 | 64f6753 | [260529-os0-update-the-styling-of-the-hero-image-car](./quick/260529-os0-update-the-styling-of-the-hero-image-car/) |
| 260530-oto | Move the "Save the Date" label to the very top of the hero container, with spacing between it and the rest of the content block | 2026-05-31 | c3ce4f0 | [260530-oto-move-the-save-the-date-label-to-the-very](./quick/260530-oto-move-the-save-the-date-label-to-the-very/) |

## Session Continuity

Last session: 2026-05-31T18:31:38.575Z
Stopped at: Completed 06-01-PLAN.md (Phase 6: Identity Token Contract)
Resume file: None
