# Requirements: Wedding Save-the-Date — Aaron & Rina

**Defined:** 2026-05-28
**Core Value:** When a guest opens their link, they feel the warmth and elegance of the invitation immediately — a beautiful, personalized, smoothly-animated reveal of "Aaron & Rina · May 30, 2027 · Oahu, Hawaii."

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FND-01**: App is wrapped in `<BrowserRouter>` and renders a single save-the-date page
- [ ] **FND-02**: Google Fonts (Cormorant Garamond + Jost) are loaded and applied; no system/Inter/Roboto fallback is used
- [ ] **FND-03**: Design tokens (forest `#0B1610`, gold `#BF9B5A`, gold-light `#D4B57A`, cream `#EAE0CB`, muted `#72685A`) are defined as CSS Module / CSS variables and used everywhere — no inline design values

### Content

- [ ] **CONT-01**: Page displays the couple names "Aaron & Rina"
- [ ] **CONT-02**: Page displays a "Save the Date" label and the date "May 30, 2027"
- [ ] **CONT-03**: Page displays the location line "Oahu, Hawaii"
- [ ] **CONT-04**: Page displays the footer note "Formal invitation to follow"
- [ ] **CONT-05**: A divider line separates the couple names from the date block

### Personalization

- [ ] **PERS-01**: The `?to=` query param is read via `useSearchParams` and shown as "For [Guest Name]"
- [ ] **PERS-02**: When `?to=` is absent, the page falls back to "Our Beloved Guests"
- [ ] **PERS-03**: When `?to=` is present, `document.title` is set to "Save the Date – For {name}"
- [ ] **PERS-04**: URL-encoded names render correctly (e.g. `?to=Mike+%26+Sarah` → "Mike & Sarah")

### Hero & Imagery

- [ ] **HERO-01**: A full-bleed hero photo (`/images/save-the-date-hero.png`) fills the viewport via `object-fit: cover`
- [ ] **HERO-02**: The hero performs a subtle Ken Burns zoom (scale 1 → 1.08 over 20s, alternating)
- [ ] **HERO-03**: The hero layer has a parallax scroll offset driven by Framer Motion `useScroll` + `useTransform` (`ParallaxImage` component)

### Botanical & Decoration

- [ ] **DECO-01**: Corner bracket decorations draw in via animated `pathLength`
- [ ] **DECO-02**: A stroke-only botanical SVG branch (`BotanicalSvg`) draws itself in via `pathLength`, with staggered branches and a `flipped` prop
- [ ] **DECO-03**: Botanical strokes use `var(--gold)` with no fills except terminal dots

### Animation

- [ ] **ANIM-01**: The entrance sequence uses Framer Motion `variants` + `staggerChildren` — no hardcoded per-element delays
- [ ] **ANIM-02**: Elements reveal in the spec's order (background → brackets → botanical → guest greeting → label → names → divider → date → location → footer)
- [ ] **ANIM-03**: All easing uses `[0.22, 0.61, 0.36, 1]` and each element animates over at least 0.8s
- [ ] **ANIM-04**: Couple names animate in with a slight scale (0.96 → 1); the divider scales from center (scaleX)

### Countdown

- [ ] **CNT-01**: A live countdown to May 30, 2027 shows days / hours / minutes / seconds in a row (`CountdownTimer`)
- [ ] **CNT-02**: Each countdown number animates individually when it ticks (AnimatePresence key swap)

### Experience & Delivery

- [ ] **EXP-01**: The layout is responsive and legible on mobile and desktop
- [ ] **EXP-02**: Animations run smoothly without jank on a typical mobile device
- [ ] **DEPLOY-01**: The site builds as a static bundle (`vite build`) and is deployable to Vercel

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### RSVP

- **RSVP-01**: Guest can respond (attending / not attending)
- **RSVP-02**: Responses are captured to a backend store

### Details

- **DET-01**: Event schedule / itinerary page
- **DET-02**: Travel & accommodation info
- **DET-03**: Registry links
- **DET-04**: Photo gallery

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| RSVP / response capture | Announcement-only for v1; needs a backend, deferred to a later milestone |
| Backend / database / auth | Personalization is URL-param only; no guest list is stored |
| Routing beyond one page | Phase 1 is a single screen per spec |
| UI component libraries (shadcn, MUI, etc.) | Custom design only per spec |
| Stored/managed guest list | Names come from the link, not a system of record |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | TBD | Pending |
| FND-02 | TBD | Pending |
| FND-03 | TBD | Pending |
| CONT-01 | TBD | Pending |
| CONT-02 | TBD | Pending |
| CONT-03 | TBD | Pending |
| CONT-04 | TBD | Pending |
| CONT-05 | TBD | Pending |
| PERS-01 | TBD | Pending |
| PERS-02 | TBD | Pending |
| PERS-03 | TBD | Pending |
| PERS-04 | TBD | Pending |
| HERO-01 | TBD | Pending |
| HERO-02 | TBD | Pending |
| HERO-03 | TBD | Pending |
| DECO-01 | TBD | Pending |
| DECO-02 | TBD | Pending |
| DECO-03 | TBD | Pending |
| ANIM-01 | TBD | Pending |
| ANIM-02 | TBD | Pending |
| ANIM-03 | TBD | Pending |
| ANIM-04 | TBD | Pending |
| CNT-01 | TBD | Pending |
| CNT-02 | TBD | Pending |
| EXP-01 | TBD | Pending |
| EXP-02 | TBD | Pending |
| DEPLOY-01 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 27 ⚠️ (resolved by roadmap)

---
*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after initial definition*
