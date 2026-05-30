# Roadmap: Wedding Save-the-Date — Aaron & Rina

## Overview

Five phases take the site from a bare Vite scaffold to a deployed, animated,
guest-personalized save-the-date. Each phase delivers a coherent capability:
foundation wiring, then static content on screen, then personalization and
countdown, then the full motion/visual layer, then responsive polish and
Vercel deployment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Design system, fonts, and router wired up (completed 2026-05-29)
- [ ] **Phase 2: Static Page** - Hero photo and all wedding content visible on screen
- [ ] **Phase 3: Personalization & Countdown** - Guest name from URL and live countdown timer
- [ ] **Phase 4: Visuals & Animation** - Botanical SVG, brackets, Ken Burns, parallax, full entrance sequence
- [ ] **Phase 5: Polish & Deploy** - Responsive layout, performance, and live on Vercel

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
- [ ] 03-02-PLAN.md — CountdownTimer with per-tick AnimatePresence swap, wired below location (CNT-01, CNT-02)
**UI hint**: yes

### Phase 4: Visuals & Animation
**Goal**: The page delivers its full motion experience — botanical line art, corner brackets, Ken Burns hero, parallax scroll, and the 10-step orchestrated entrance sequence
**Depends on**: Phase 3
**Requirements**: DECO-01, DECO-02, DECO-03, HERO-02, HERO-03, ANIM-01, ANIM-02, ANIM-03, ANIM-04
**Success Criteria** (what must be TRUE):
  1. On page load, elements reveal in the specified order (background → brackets → botanical → guest greeting → label → names → divider → date → location → footer) with no elements jumping in out of order
  2. Corner bracket SVGs visibly draw themselves in via `pathLength` animation on arrival
  3. The botanical branch SVG draws its strokes progressively, with branches staggering rather than appearing all at once; strokes are gold with no fills except terminal dots
  4. The hero photo performs a Ken Burns zoom (scale 1 → 1.08) on a 20-second loop, and scrolling the page produces a parallax offset on the hero layer
  5. Each countdown digit that changes animates individually (old number exits, new number enters via AnimatePresence)
**Plans**: TBD
**UI hint**: yes

### Phase 5: Polish & Deploy
**Goal**: The site is production-ready — responsive, smooth on mobile, and live at a Vercel URL
**Depends on**: Phase 4
**Requirements**: EXP-01, EXP-02, DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. On a phone-sized viewport, all content is legible and nothing overflows or is clipped
  2. The entrance animations run without visible jank on a mid-range mobile device
  3. `vite build` produces a clean static bundle and the site is accessible at a live Vercel URL
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete   | 2026-05-29 |
| 2. Static Page | 0/1 | Not started | - |
| 3. Personalization & Countdown | 1/2 | In Progress|  |
| 4. Visuals & Animation | 0/TBD | Not started | - |
| 5. Polish & Deploy | 0/TBD | Not started | - |
