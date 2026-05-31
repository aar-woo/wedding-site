# Roadmap: Wedding Save-the-Date — Aaron & Rina

## Overview

**v1.0 (Phases 1–4):** Five phases took the site from a bare Vite scaffold to a fully-animated, guest-personalized save-the-date SPA. Phases 1–4 are complete. Phase 5 was never executed and is superseded by v2.0.

**v2.0 (Phases 6–9):** Replaces the open `?to=` param with durable per-guest identity backed by Neon Postgres, adds a Vercel serverless foundation for future RSVP, and ships the site live with responsive polish and durable personalized links.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### v1.0 — Complete

- [x] **Phase 1: Foundation** - Design system, fonts, and router wired up (completed 2026-05-29)
- [x] **Phase 2: Static Page** - Hero photo and all wedding content visible on screen (completed)
- [x] **Phase 3: Personalization & Countdown** - Guest name from URL and live countdown timer (completed)
- [x] **Phase 4: Visuals & Animation** - Botanical SVG, brackets, Ken Burns, full entrance sequence (completed)
- ~~**Phase 5: Polish & Deploy**~~ — **Superseded by v2.0** (responsive polish + deploy folded into v2.0 Phases 8–9; EXP-01, EXP-02, DEPLOY-01 carried forward)

### v2.0 — Active

- [x] **Phase 6: Identity Token Contract** - URL shape, signed token format, env var naming, and token sign/verify library locked before any code is committed (completed 2026-05-31)
- [ ] **Phase 7: Datastore Schema & Link-Generation Tooling** - Neon Postgres provisioned, guest schema migrated, local script mints real shareable links
- [ ] **Phase 8: Frontend Hook & API Endpoint** - Guest-name hook updated to parse signed token; Vercel serverless GET endpoint wired; vercel.json deployed
- [ ] **Phase 9: Mobile Polish & Deploy** - Responsive layout verified on mobile, site deployed live to Vercel with durable personalized links

## Phase Details

### Phase 1: Foundation
**Goal**: The app has a working router, the design token palette, and Google Fonts loaded — the canvas is ready
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03
**Success Criteria** (what must be TRUE):
  1. Opening the site in a browser shows a page (no blank screen or console errors from missing router)
  2. Cormorant Garamond and Jost fonts render — no system font fallback visible
  3. CSS custom properties for all five palette colors (`--forest`, `--gold`, `--gold-light`, `--cream`, `--muted`) are defined and inherited site-wide
**Plans**: 1 plan
- [x] 01-01-PLAN.md — Router wiring, design-token palette, and Google Fonts

### Phase 2: Static Page
**Goal**: All wedding content is readable on screen — couple names, date, location, footer, and the hero photo filling the viewport
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, HERO-01
**Success Criteria** (what must be TRUE):
  1. "Aaron & Rina" appears on the page in the correct typeface and gold-light color
  2. "Save the Date" label, "May 30, 2027", and "Oahu, Hawaii" are all visible
  3. "Formal invitation to follow" footer note appears at the bottom
  4. A divider line is visible between the couple names and the date block
  5. The hero photo fills the full viewport with no white bars or overflow
**Plans**: 1 plan
- [x] 02-01-PLAN.md — SaveTheDatePage: full-bleed hero + scrim + bottom-anchored content block (all CONT copy)
**UI hint**: yes

### Phase 3: Personalization & Countdown
**Goal**: Guests see their name in the greeting and a live countdown drives urgency
**Depends on**: Phase 2
**Requirements**: PERS-01, PERS-02, PERS-03, PERS-04, CNT-01, CNT-02
**Success Criteria** (what must be TRUE):
  1. Opening `/?to=The+Johnson+Family` shows "For The Johnson Family" on screen
  2. Opening `/?to=Mike+%26+Sarah` shows "For Mike & Sarah" (URL-encoded ampersand decoded)
  3. Opening the site without `?to=` shows "For Our Beloved Guests" (fallback)
  4. When `?to=` is present, the browser tab title reads "Save the Date – For {name}"
  5. A live days / hours / minutes / seconds countdown to May 30, 2027 is visible and ticking
**Plans**: 2 plans
- [x] 03-01-PLAN.md — useGuestName hook + GuestGreeting wired above the label (PERS-01..04)
- [x] 03-02-PLAN.md — CountdownTimer with per-tick AnimatePresence swap, wired below location (CNT-01, CNT-02)
**UI hint**: yes

### Phase 4: Visuals & Animation
**Goal**: The page delivers its full motion experience — botanical line art, corner brackets, Ken Burns hero, and the 10-step orchestrated entrance sequence
**Depends on**: Phase 3
**Requirements**: DECO-01, DECO-02, DECO-03, HERO-02, ANIM-01, ANIM-02, ANIM-03, ANIM-04
**Scope note** (2026-05-30): Parallax (HERO-03) dropped from v1 — the single-screen keepsake doesn't scroll, so Ken Burns is the hero's only motion and `ParallaxImage` is not built. See `.planning/phases/04-visuals-animation/04-CONTEXT.md` D-09.
**Success Criteria** (what must be TRUE):
  1. On page load, elements reveal in the specified order (background → brackets → botanical → guest greeting → label → names → divider → date → location → footer) with no elements jumping in out of order
  2. Corner bracket SVGs visibly draw themselves in via `pathLength` animation on arrival
  3. The botanical branch SVG draws its strokes progressively, with branches staggering rather than appearing all at once; strokes are gold with no fills except terminal dots
  4. The hero photo performs a Ken Burns zoom (scale 1 → 1.08) on a 20-second loop (parallax dropped — see scope note)
  5. Each countdown digit that changes animates individually (old number exits, new number enters via AnimatePresence)
**Plans**: 3 plans (2 waves)
- [x] 04-01-PLAN.md — BotanicalSvg olive-branch component (pathLength stagger, flipped) [DECO-02, DECO-03]
- [x] 04-02-PLAN.md — CornerBrackets component (four corners, pathLength draw-in) [DECO-01]
- [x] 04-03-PLAN.md — SaveTheDatePage entrance orchestration + Ken Burns + MotionConfig [HERO-02, ANIM-01..04]
**UI hint**: yes

### Phase 5: Polish & Deploy
~~**Goal**: The site is production-ready — responsive, smooth on mobile, and live at a Vercel URL~~
**Status**: **Superseded by v2.0** — responsive polish (EXP-01, EXP-02) and Vercel deployment (DEPLOY-01) fold into v2.0 Phases 8–9, which deploy with durable personalized links rather than the open `?to=` scheme. This phase was never executed.
**Requirements carried forward**: EXP-01 → Phase 9, EXP-02 → Phase 9, DEPLOY-01 → Phase 9
**Plans**: None executed

---

### Phase 6: Identity Token Contract
**Goal**: The URL shape, token payload format, env var naming, and sign/verify library are locked and tested before any dependent code is written — changing these after links are issued forces re-minting every URL
**Depends on**: Phase 4 (v1.0 complete — SPA exists to receive durable links)
**Requirements**: LINK-01, LINK-02, LINK-03
**Success Criteria** (what must be TRUE):
  1. A documented URL shape (`/i/<nanoid>?t=<base64url-payload>.<base64url-hmac>`) and token payload schema (`{ id, name, iat }`) are written down and locked — no fields added or removed later without a deliberate re-issue decision
  2. `scripts/lib/token.js` can produce a signed token from a guest record and verify it — `verify(sign(payload)) === true`, and a tampered payload returns false
  3. Running `grep -r "VITE_" .env* src/` produces no secret-named matches — env var naming convention (`GUEST_TOKEN_SECRET`, `DATABASE_URL`, no `VITE_` prefix) is established in writing before the first `api/` file is created
  4. Navigating to a manually-crafted URL with a valid token shows the correct guest name; navigating with a missing or malformed token falls back to "Our Beloved Guests" with no error screen
**Plans**: 1 plan
- [x] 06-01-PLAN.md — Locked contract doc + scripts/lib/token.js sign/verify + src/lib browser decode util + node:test suites (LINK-01..03)

### Phase 7: Datastore Schema & Link-Generation Tooling
**Goal**: Guests can receive a real shareable link — the Neon Postgres guest table exists, and the local script can mint a batch of valid, durable, personalized URLs from a CSV
**Depends on**: Phase 6
**Requirements**: BACK-01, LINK-04
**Success Criteria** (what must be TRUE):
  1. A `guests` table exists in Neon Postgres with `id TEXT PRIMARY KEY` (nanoid, 21 chars), `display_name`, `created_at`, `first_seen_at`, and nullable RSVP stub columns (`rsvp_status`, `rsvp_count`, `rsvp_submitted_at`) — no migration needed when RSVP ships
  2. Running `node scripts/generate-links.js` against a test CSV inserts guest rows into the DB and outputs a `links.csv` with one valid personalized URL per row
  3. A URL from the generated `links.csv` resolves to the correct guest name in the browser (end-to-end test via the Phase 6 token decode)
  4. Neither `guests.csv` nor any `.env` file containing the signing secret appears in `git status` or `git log` — `.gitignore` covers both
**Plans**: TBD

### Phase 8: Frontend Hook & API Endpoint
**Goal**: The site resolves guest identity entirely from the URL token with no network round-trip, and a validation endpoint exists that the future RSVP flow will reuse
**Depends on**: Phase 7
**Requirements**: BACK-02, BACK-03
**Success Criteria** (what must be TRUE):
  1. Opening a generated guest link (`/i/<id>?t=<token>`) shows "For [Guest Name]" instantly — no loading state, no API call on page load
  2. `GET /api/guest/:id` returns `{ id, displayName }` with HTTP 200 for a valid known guest, and HTTP 404 for an unknown or invalid id
  3. Running `grep -r "VITE_" .env* src/` returns zero results for `GUEST_TOKEN_SECRET` or `DATABASE_URL` — secrets are present only in Vercel env vars and `.env.local`, never in the Vite client bundle
  4. `vercel.json` correctly routes `/api/*` to serverless functions before the SPA catch-all — navigating directly to `/i/<id>?t=<token>` in a fresh browser tab shows the personalized page, not a 404
**Plans**: TBD
**UI hint**: yes

### Phase 9: Mobile Polish & Deploy
**Goal**: Every guest, on any device, gets the full keepsake experience the moment they open their link — and that link is live on Vercel
**Depends on**: Phase 8
**Requirements**: EXP-01, EXP-02, DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. On a 375px-wide mobile viewport, all content is legible, nothing overflows or is clipped, and the countdown is readable without horizontal scrolling
  2. The full entrance animation sequence runs without visible jank on a mid-range mobile device (no dropped frames on the botanical draw-in or countdown tick)
  3. The site is accessible at a live `vercel.app` URL, served from a Git-connected Vercel project, with the Neon DB integration and `GUEST_TOKEN_SECRET` configured as production environment variables
  4. At least one real generated guest link (from `links.csv`) opens in a browser, shows the personalized greeting, and the `GET /api/guest/:id` endpoint returns 200 — the full v2.0 stack verified end-to-end in production
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
v1.0 phases complete (1–4). v2.0 phases execute in numeric order: 6 → 7 → 8 → 9.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-05-29 |
| 2. Static Page | 1/1 | Complete | — |
| 3. Personalization & Countdown | 2/2 | Complete | — |
| 4. Visuals & Animation | 3/3 | Complete | — |
| ~~5. Polish & Deploy~~ | — | Superseded by v2.0 | — |
| 6. Identity Token Contract | 1/1 | Complete   | 2026-05-31 |
| 7. Datastore Schema & Link-Generation | 0/TBD | Not started | — |
| 8. Frontend Hook & API Endpoint | 0/TBD | Not started | — |
| 9. Mobile Polish & Deploy | 0/TBD | Not started | — |

## Backlog

### Phase 999.1: Olive-branch redraw interval (7s) (BACKLOG)

**Goal:** Periodically re-trigger the olive-branch `BotanicalSvg` draw-in animation on a 7-second interval (loop the `pathLength` draw so the branches redraw every 7s) rather than animating only once on page load. Must stay within the `prefers-reduced-motion` guard (no looping redraw when reduced motion is requested).
**Requirements:** TBD
**Plans:** 1/1 plans complete

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
