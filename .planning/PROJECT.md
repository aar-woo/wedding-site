# Wedding Save-the-Date — Aaron & Rina

## What This Is

An animated, single-page "save the date" website for Aaron & Rina's wedding on
May 30, 2027 in Oahu, Hawaii. Guests open a personalized link (e.g.
`/?to=The+Johnson+Family`) and see their name woven into an elegant, motion-rich
forest-and-gold scene with the couple's names, the date, the location, and a
live countdown. It is a keepsake-quality announcement, not a functional RSVP or
events portal.

## Core Value

When a guest opens their link, they feel the warmth and elegance of the
invitation immediately — a beautiful, personalized, smoothly-animated reveal of
"Rina & Aaron· May 30, 2027 · Oahu, Hawaii."

## Requirements

### Validated

- ✓ Foundation canvas: BrowserRouter context, five design-token CSS variables, and Google Fonts (Cormorant + Jost) loaded with no system-font fallback — Phase 1 (FND-01/02/03)
- ✓ Static save-the-date page: full-bleed hero photo + legibility scrim with bottom-anchored content (label, "Rina & Aaron", divider, date, location, footer) — Phase 2 (CONT-01..05, HERO-01)
- ✓ Guest personalization (`?to=` greeting via `useGuestName`, fallback, personalized tab title) + live countdown to May 30 2027 with per-tick digit animation — Phase 3 (PERS-01..04, CNT-01/02)

### Active

- [ ] Single-page animated save-the-date renders the couple, date, and location
- [ ] Guest name personalization via `?to=` URL param, with graceful fallback
- [ ] Orchestrated entrance animation sequence (the spec's 10-step choreography)
- [ ] Full-bleed hero photo with subtle Ken Burns motion + parallax on scroll
- [ ] Botanical SVG line-art that draws itself in, plus corner bracket decorations
- [ ] Live countdown to May 30, 2027 with per-digit tick animation
- [ ] Design system applied exactly (forest/gold palette, Cormorant + Jost fonts)
- [ ] Responsive and performant on mobile and desktop
- [ ] Deployable as a static site to Vercel

### Out of Scope

- RSVP / guest response capture — this is announcement-only; comes as a later milestone
- Event details pages (schedule, travel, registry, gallery) — future milestones
- Any backend, database, or auth — personalization is URL-param only, no guest list stored
- Component / UI libraries (shadcn, MUI, etc.) — custom design only per spec
- Routing beyond the single page — Phase 1 is one screen

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

- **Tech stack**: React 18 + Vite + Framer Motion + React Router v6 + CSS Modules — no UI libraries, custom design only.
- **Fonts**: Cormorant Garamond (display) + Jost (body) via Google Fonts. Never Inter, Roboto, or system fonts.
- **Design system**: Background `#0B1610`, gold `#BF9B5A`, gold-light `#D4B57A`, cream `#EAE0CB`, muted `#72685A`. Design values live in CSS Module variables — no inline style values.
- **Animation**: Use `variants` + `staggerChildren` (no hardcoded per-element delays); min 0.8s per element; ease `[0.22, 0.61, 0.36, 1]`.
- **Hosting**: Static build deployed to Vercel.
- **Personalization**: Read-only via `?to=` query param; no stored guest list.

## Key Decisions

| Decision                                                                        | Rationale                                                      | Outcome   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------- |
| Scope = save-the-date only                                                      | Ship the announcement first; RSVP/details are later milestones | — Pending |
| Use existing hero PNG as-is                                                     | Image already in repo; real photo confirmed                    | — Pending |
| Default content (location "Oahu, Hawaii", footer "Formal invitation to follow") | User opted for sensible defaults; easy to swap later           | — Pending |
| Deploy target: Vercel                                                           | Zero-config static hosting for a Vite SPA                      | — Pending |
| `CLAUDE.md` is the binding design contract                                      | Detailed spec already authored; avoid re-deriving design       | ✓ Good    |

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

_Last updated: 2026-05-30 after Phase 3 (Personalization & Countdown)_
