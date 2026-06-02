# Requirements: Wedding Save-the-Date — Aaron & Rina

**Defined:** 2026-05-28
**Core Value:** When a guest opens their link, they feel the warmth and elegance of the invitation immediately — a beautiful, personalized, smoothly-animated reveal of "Rina & Aaron· May 30, 2027 · Oahu, Hawaii."

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FND-01**: App is wrapped in `<BrowserRouter>` and renders a single save-the-date page
- [x] **FND-02**: Google Fonts (Cormorant Garamond + Jost) are loaded and applied; no system/Inter/Roboto fallback is used
- [x] **FND-03**: Design tokens (forest `#0B1610`, gold `#BF9B5A`, gold-light `#D4B57A`, cream `#EAE0CB`, muted `#72685A`) are defined as CSS Module / CSS variables and used everywhere — no inline design values

### Content

- [x] **CONT-01**: Page displays the couple names "Rina & Aaron"
- [x] **CONT-02**: Page displays a "Save the Date" label and the date "May 30, 2027"
- [x] **CONT-03**: Page displays the location line "Oahu, Hawaii"
- [x] **CONT-04**: Page displays the footer note "Formal invitation to follow"
- [x] **CONT-05**: A divider line separates the couple names from the date block

### Personalization

- [x] **PERS-01**: The `?to=` query param is read via `useSearchParams` and shown as "For [Guest Name]"
- [x] **PERS-02**: When `?to=` is absent, the page falls back to "Our Beloved Guests"
- [x] **PERS-03**: When `?to=` is present, `document.title` is set to "Save the Date – For {name}"
- [x] **PERS-04**: URL-encoded names render correctly (e.g. `?to=Mike+%26+Sarah` → "Mike & Sarah")

### Hero & Imagery

- [x] **HERO-01**: A full-bleed hero photo (`/images/save-the-date-hero.png`) fills the viewport via `object-fit: cover`
- [x] **HERO-02**: The hero performs a subtle Ken Burns zoom (scale 1 → 1.08 over 20s, alternating) — Phase 4
- ~~**HERO-03**: The hero layer has a parallax scroll offset~~ — **Out of scope (v1)**, see below. The save-the-date is a single, non-scrolling screen, so there is no scroll distance for parallax; Ken Burns (HERO-02) is the hero's only motion. (Dropped Phase 4, 2026-05-30.)

### Botanical & Decoration

- [x] **DECO-01**: Corner bracket decorations draw in via animated `pathLength` — Phase 4
- [x] **DECO-02**: A stroke-only botanical SVG branch (`BotanicalSvg`) draws itself in via `pathLength`, with staggered branches and a `flipped` prop — Phase 4
- [x] **DECO-03**: Botanical strokes use `var(--gold)` with no fills except terminal dots — Phase 4

### Animation

- [x] **ANIM-01**: The entrance sequence uses Framer Motion `variants` + `staggerChildren` — no hardcoded per-element delays — Phase 4
- [x] **ANIM-02**: Elements reveal in the spec's order (background → brackets → botanical → guest greeting → label → names → divider → date → location → footer) — Phase 4
- [x] **ANIM-03**: All easing uses `[0.22, 0.61, 0.36, 1]` and each element animates over at least 0.8s — Phase 4
- [x] **ANIM-04**: Couple names animate in with a slight scale (0.96 → 1); the divider scales from center (scaleX) — Phase 4

### Countdown

- [x] **CNT-01**: A live countdown to May 30, 2027 shows days / hours / minutes / seconds in a row (`CountdownTimer`)
- [x] **CNT-02**: Each countdown number animates individually when it ticks (AnimatePresence key swap)

### Experience & Delivery

*Defined in v1.0, not completed there — carried forward into the v2.0 milestone (deploy now lands with durable links + serverless).*

- [x] **EXP-01**: The layout is responsive and legible on mobile and desktop _(v2.0)_
- [x] **EXP-02**: Animations run smoothly without jank on a typical mobile device _(v2.0)_
- [ ] **DEPLOY-01**: The site deploys live to Vercel (Git-connected, vercel.app URL), including the SPA build, the `/api` serverless function(s), and the Neon datastore env config _(v2.0)_

## v2.0 Milestone Requirements

Personalized Guest-Link Identity + RSVP Foundation. Replaces the open `?to=` personalization with durable per-guest links backed by persistent identity, and lays the backend foundation a future RSVP flow reuses via the SAME link. Carries EXP-01, EXP-02, DEPLOY-01 (above) into this milestone.

### Guest Identity & Links

- [x] **LINK-01**: Each guest has a durable, unguessable per-guest link built on an opaque stable `id` (replaces the open `?to=` param); the `id` is the permanent identity a future RSVP reuses
- [x] **LINK-02**: The guest's display name travels in the link as an HMAC-signed payload and is decoded client-side with no network round-trip (instant greeting)
- [x] **LINK-03**: Invalid, tampered, or unknown links fall back gracefully to the "Our Beloved Guests" greeting (never an error screen)
- [x] **LINK-04**: A local link-generation script mints per-guest links from a guest list; the guest list and signing secret are never committed to the repo

### Backend Foundation

- [x] **BACK-01**: A Neon Postgres datastore holds a guest record keyed on the opaque `id`, with nullable RSVP fields reserved so a future RSVP flow needs no migration
- [x] **BACK-02**: A Vercel serverless endpoint (Node runtime) validates/looks up a guest by `id` — the contract a future RSVP flow builds on
- [x] **BACK-03**: The signing secret and database URL are server-only environment variables (never `VITE_`-prefixed; never present in the client bundle)

## v2+ Requirements (Future)

Deferred to a future release. Tracked but not in current roadmap.

### RSVP (form/flow — follow-up milestone; v2.0 only builds the identity + backend foundation)

- **RSVP-01**: Guest can respond (attending / not attending) via their personalized link
- **RSVP-02**: Responses are captured to the backend store (keyed on the guest `id` from v2.0)

### Details

- **DET-01**: Event schedule / itinerary page
- **DET-02**: Travel & accommodation info
- **DET-03**: Registry links
- **DET-04**: Photo gallery

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                    | Reason                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| RSVP **form/flow** (accept/decline, guest count, meal/notes) | Follow-up milestone; v2.0 builds only the identity + backend foundation it reuses |
| ~~Backend / database / auth~~              | **Superseded in v2.0** — a Vercel serverless layer + Neon Postgres are now in scope for durable guest identity |
| ~~Stored/managed guest list~~             | **Superseded in v2.0** — durable identity requires a stored per-guest record (keyed on opaque `id`) |
| Public guest-list endpoint                 | Privacy — no endpoint ever returns the full list; a link only resolves its own guest |
| Guest auth / login                         | Fatal friction for a keepsake; the unguessable link IS the access factor |
| UI component libraries (shadcn, MUI, etc.) | Custom design only per spec                                              |
| Parallax hero scroll offset (HERO-03)      | Single-screen keepsake doesn't scroll; no distance for parallax to read against. Ken Burns is the hero's only motion. Dropped Phase 4 (2026-05-30). |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| FND-01      | Phase 1 | Complete |
| FND-02      | Phase 1 | Complete |
| FND-03      | Phase 1 | Complete |
| CONT-01     | Phase 2 | Complete |
| CONT-02     | Phase 2 | Complete |
| CONT-03     | Phase 2 | Complete |
| CONT-04     | Phase 2 | Complete |
| CONT-05     | Phase 2 | Complete |
| HERO-01     | Phase 2 | Complete |
| PERS-01     | Phase 3 | Complete |
| PERS-02     | Phase 3 | Complete |
| PERS-03     | Phase 3 | Complete |
| PERS-04     | Phase 3 | Complete |
| CNT-01      | Phase 3 | Complete |
| CNT-02      | Phase 3 | Complete |
| DECO-01     | Phase 4 | Complete |
| DECO-02     | Phase 4 | Complete |
| DECO-03     | Phase 4 | Complete |
| HERO-02     | Phase 4 | Complete |
| HERO-03     | —       | Out of Scope (v1) |
| ANIM-01     | Phase 4 | Complete |
| ANIM-02     | Phase 4 | Complete |
| ANIM-03     | Phase 4 | Complete |
| ANIM-04     | Phase 4 | Complete |
| EXP-01      | Phase 9 | Complete |
| EXP-02      | Phase 9 | Complete |
| DEPLOY-01   | Phase 9 | Pending |
| LINK-01     | Phase 6 | Complete |
| LINK-02     | Phase 6 | Complete |
| LINK-03     | Phase 6 | Complete |
| LINK-04     | Phase 7 | Complete |
| BACK-01     | Phase 7 | Complete |
| BACK-02     | Phase 8 | Complete |
| BACK-03     | Phase 8 | Complete |

**Coverage:**

- v1.0 requirements: 27 (Phases 1–4 complete; EXP-01/EXP-02/DEPLOY-01 carried into v2.0)
- v2.0 milestone requirements: 10 (LINK-01..04, BACK-01..03, + carried EXP-01/EXP-02/DEPLOY-01)
- v2.0 mapping: 10/10 requirements mapped across Phases 6–9

---

_Requirements defined: 2026-05-28_
_Last updated: 2026-05-30 — v2.0 roadmap created; all 10 v2.0 requirements assigned to Phases 6–9_
