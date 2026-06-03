# Wedding Save-the-Date — Aaron & Rina

## What This Is

An animated, single-page "save the date" website for Aaron & Rina's wedding on
May 30, 2027 in Oahu, Hawaii. Guests open a durable, unguessable personalized
link (e.g. `/i/<id>?t=<signed-token>`) and see their name woven into an elegant,
motion-rich forest-and-gold scene with the couple's names, the date, the location,
and a live countdown. Each link is backed by a persistent per-guest identity in
Neon Postgres (the foundation a future RSVP flow reuses). It is a keepsake-quality
announcement; the RSVP form itself is a follow-up milestone.

## Core Value

When a guest opens their link, they feel the warmth and elegance of the
invitation immediately — a beautiful, personalized, smoothly-animated reveal of
"Rina & Aaron· May 30, 2027 · Oahu, Hawaii."

## Current State

**Shipped: v2.0 Guest Identity & Deploy** (2026-06-03) — live at `https://wedding-site-ten-omega.vercel.app`.

The site replaced the open `?to=` greeting with durable, unguessable per-guest links (`/i/<id>?t=<signed-token>`) backed by a Neon Postgres identity record, exposed a Vercel serverless `GET /api/guest/:id` lookup, and ships responsive + reduced-motion-polished. The signed token decodes the display name client-side for an instant greeting; the frontend then fetches the authoritative DB name by `id` with graceful fallback. All 10 v2.0 requirements satisfied; integration verified clean end-to-end in production.

**Stack reality:** React 19 + React Router v7 (`react-router` import) + Vite + Framer Motion + CSS Modules; Neon Postgres; Vercel serverless (Node runtime) under `/api`. Guest list + signing secret live only locally / in server-only env vars — never committed, never `VITE_`-prefixed.

### Next Milestone Goals (not yet started)

- **RSVP flow (RSVP-01/RSVP-02)** — let a guest accept/decline (+ guest count, meal, notes) via their existing personalized link, captured to the Neon store keyed on the same opaque `id`. The v2.0 identity + serverless foundation was built specifically to carry this with no migration (RSVP columns already reserved).
- Possible: event-details pages (schedule, travel, registry, gallery) — DET-01..04.

Run `/gsd:new-milestone` to define requirements + roadmap for the next cycle.

## Requirements

### Validated

- ✓ Foundation canvas: BrowserRouter context, five design-token CSS variables, and Google Fonts (Cormorant + Jost) loaded with no system-font fallback — Phase 1 (FND-01/02/03)
- ✓ Static save-the-date page: full-bleed hero photo + legibility scrim with bottom-anchored content (label, "Rina & Aaron", divider, date, location, footer) — Phase 2 (CONT-01..05, HERO-01)
- ✓ Guest personalization (`?to=` greeting via `useGuestName`, fallback, personalized tab title) + live countdown to May 30 2027 with per-tick digit animation — Phase 3 (PERS-01..04, CNT-01/02)
- ✓ Full motion layer: olive-branch `BotanicalSvg` + corner brackets drawing in via `pathLength`, Ken Burns hero zoom (CSS keyframes), and the 10-step orchestrated entrance sequence (variants + staggerChildren), with `prefers-reduced-motion` honored — Phase 4 (DECO-01/02/03, HERO-02, ANIM-01..04)
- ✓ Durable guest-link identity **contract + library**: locked token spec (`/i/<id>?t=<payload>.<hmac>`, payload `{id,name,iat}`), `node:crypto` HMAC-SHA256 sign/verify lib, secret-free browser decode util (decode-only + graceful fallback), `VITE_`-leak-proof env discipline — Phase 6 (LINK-01/02/03). _Live wiring lands in Phase 8._
- ✓ Datastore + link-generation tooling: Neon Postgres `guests` table (idempotent migration; `id`/`display_name`/`email UNIQUE`/timestamps/soft-delete + nullable RSVP stubs), and `scripts/generate-links.js` minting durable per-guest URLs from a CSV (email-keyed upsert preserving `id`, soft-delete sync, token signing via the Phase 6 lib, `links.csv` output). Guest list + secret never committed. Live-verified end-to-end against real Neon — Phase 7 (BACK-01, LINK-04).
- ✓ Live frontend wiring + validation endpoint: `useGuestName` resolves the greeting instantly client-side from the `?t=` token (no network round-trip) with `?to=` preview + "Our Beloved Guests" fallback, `/i/:id` route added; `GET /api/guest/:id` Vercel Node function returns `{id, displayName}` from Neon (200/404/405, id-only lookup, soft-deleted→404), `vercel.json` routes `/api/*` ahead of the SPA catch-all; secrets stay server-only (no `VITE_` leak, verified against the built bundle) — Phase 8 (BACK-02, BACK-03).
- ✓ Mobile polish + reduced-motion: responsive one-screen layout at 375px, `useReducedMotion` snap-in across BotanicalSvg/CornerBrackets/entrance sequence — Phase 9 (EXP-01, EXP-02).
- ✓ Live Vercel deploy: Git-connected SPA + `/api` serverless + Neon, durable `links.csv` against the live domain, cold `/i/:id`→200 and `GET /api/guest/:id`→200 verified in production — Phase 9 (DEPLOY-01).
- ✓ Authoritative DB name on the frontend: `useGuestName` fetches `/api/guest/:id` and overrides the cached token name (source of truth) with graceful fallback — post-v2.0 quick task 260602-nu0.

### Active

(No active milestone — v2.0 shipped. Next milestone requirements defined via `/gsd:new-milestone`; expected focus: RSVP flow building on the v2.0 identity foundation.)

### Out of Scope

- RSVP form/flow itself (accept/decline, guest count, meal/notes) — follow-up milestone; v2.0 only lays the identity + backend foundation it will reuse
- Event details pages (schedule, travel, registry, gallery) — future milestones
- Component / UI libraries (shadcn, MUI, etc.) — custom design only per spec
- ~~Any backend, database, or auth~~ — **superseded in v2.0:** a backend + datastore is now in scope to support durable guest identity and future RSVP
- ~~Static-only / URL-param-only personalization, no guest list stored~~ — **superseded in v2.0:** durable identity requires a stored guest/identity record

## Context

- Greenfield build on an existing minimal scaffold: Vite + React 19 (Router v7),
  with `framer-motion` already installed. Note: the installed stack is React 19 /
  React Router v7 — the router import is `react-router` (not `react-router-dom`),
  superseding the React 18 / v6 language in `CLAUDE.md`. (Phase 1 finding.)
- A detailed design spec already exists at the repo root in `CLAUDE.md`: it
  defines the design system, the exact 10-step load animation sequence, easing
  (`[0.22, 0.61, 0.36, 1]`), the components to build (`ParallaxImage`,
  `BotanicalSvg`, `GuestGreeting`, `CountdownTimer`), the `useGuestName` hook,
  and the URL pattern. Treat `CLAUDE.md` as the binding implementation contract.
- Hero image is already in the repo at `public/images/save-the-date-hero.png`
  (duplicate at `src/assets/hero.png`). Reference it as `/images/save-the-date-hero.png`.
- Content is settled: couple = **Rina & Aaron**, date = **May 30, 2027**,
  location line = **"Oahu, Hawaii"**, footer note = **"Formal invitation to follow"**.

## Constraints

- **Tech stack**: React 19 + Vite + Framer Motion + React Router v7 (`react-router` import, not `react-router-dom`) + CSS Modules — no UI libraries, custom design only. _(CLAUDE.md still says React 18 / Router v6 — superseded; the installed/shipped stack is 19 / v7.)_
- **Fonts**: Cormorant Garamond (display) + Jost (body) via Google Fonts. Never Inter, Roboto, or system fonts.
- **Design system**: Background `#0B1610`, gold `#BF9B5A`, gold-light `#D4B57A`, cream `#EAE0CB`, muted `#72685A`. Design values live in CSS Module variables — no inline style values.
- **Animation**: Use `variants` + `staggerChildren` (no hardcoded per-element delays); min 0.8s per element; ease `[0.22, 0.61, 0.36, 1]`; honor `prefers-reduced-motion`.
- **Hosting**: Vercel — SPA build + `/api` Node serverless functions (NOT Edge) + Neon Postgres.
- **Personalization**: Durable per-guest links (`/i/<id>?t=<signed-token>`) backed by a stored Neon guest record keyed on opaque `id`. _(Supersedes the v1.0 "read-only `?to=`, no stored guest list" constraint.)_ No public guest-list endpoint — a link only resolves its own guest.
- **Secrets**: `GUEST_TOKEN_SECRET` + `DATABASE_URL` are server-only env vars, never `VITE_`-prefixed; guest list never committed.

## Key Decisions

| Decision                                                                        | Rationale                                                      | Outcome   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------- |
| Scope = save-the-date only                                                      | Ship the announcement first; RSVP/details are later milestones | ✓ Good (v2.0 shipped; RSVP next) |
| Use existing hero PNG as-is                                                     | Image already in repo; real photo confirmed                    | ✓ Good    |
| Default content (location "Oahu, Hawaii", footer "Formal invitation to follow") | User opted for sensible defaults; easy to swap later           | ✓ Good    |
| Deploy target: Vercel                                                           | Zero-config hosting for Vite SPA + Node serverless `/api`      | ✓ Good (live v2.0) |
| `CLAUDE.md` is the binding design contract                                      | Detailed spec already authored; avoid re-deriving design       | ✓ Good    |
| Signed-name link scheme: opaque nanoid `id` + HMAC-SHA256 payload, client-decoded | Durable identity + instant greeting with no public guest list; same link carries future RSVP | ✓ Good (v2.0) |
| Neon Postgres via `@neondatabase/serverless` (Node runtime, not Edge)           | Relational store for future RSVP columns; no inactivity pause; Edge deprecated | ✓ Good (v2.0) |
| Production `DATABASE_URL` set manually; Neon Vercel integration removed          | The integration injected a wrong/empty DB causing 500s; manual env var is the durable fix | ⚠️ Revisit (re-evaluate if integration matures) |
| Frontend fetches authoritative DB name by `id` (token name as instant fallback) | DB is source of truth; corrected names propagate to already-sent links | ✓ Good (quick task 260602-nu0) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-06-03 after **v2.0 Guest Identity & Deploy** milestone completion — site shipped live at wedding-site-ten-omega.vercel.app with durable signed per-guest links, Neon identity store, serverless `/api/guest/:id`, and mobile/reduced-motion polish. All 10 v2.0 requirements satisfied. Next: `/gsd:new-milestone` (expected: RSVP flow)._
