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

## Current Milestone: v2.0 Personalized Guest-Link Identity + RSVP Foundation

**Goal:** Replace the open `?to=` greeting with a durable, hard-to-self-edit per-guest link backed by persistent identity, lay the backend/datastore foundation a future RSVP flow will reuse, and deploy the save-the-date live on Vercel with those durable links.

**Target features:**
- Durable per-guest link identity — opaque, stable `id` in the URL (replaces open `?to=`); the same link later carries RSVP
- Greeting resolves from the link without exposing a public guest list (display name encoded in the link)
- Backend + datastore foundation (Vercel serverless + datastore — choice TBD in research) keyed on guest `id`
- Link-generation tooling to mint per-guest links from the guest list
- Responsive/mobile polish (carried from v1.0 Phase 5 — EXP-01/02)
- Vercel deploy with durable links (DEPLOY-01), sequenced last

**Scope note:** RSVP foundation only — the actual RSVP form/flow is a follow-up milestone, but the identity scheme must support it. This milestone supersedes v1.0 Phase 5 (its polish + deploy fold in here); v1.0 is not deployed separately.

## Requirements

### Validated

- ✓ Foundation canvas: BrowserRouter context, five design-token CSS variables, and Google Fonts (Cormorant + Jost) loaded with no system-font fallback — Phase 1 (FND-01/02/03)
- ✓ Static save-the-date page: full-bleed hero photo + legibility scrim with bottom-anchored content (label, "Rina & Aaron", divider, date, location, footer) — Phase 2 (CONT-01..05, HERO-01)
- ✓ Guest personalization (`?to=` greeting via `useGuestName`, fallback, personalized tab title) + live countdown to May 30 2027 with per-tick digit animation — Phase 3 (PERS-01..04, CNT-01/02)
- ✓ Full motion layer: olive-branch `BotanicalSvg` + corner brackets drawing in via `pathLength`, Ken Burns hero zoom (CSS keyframes), and the 10-step orchestrated entrance sequence (variants + staggerChildren), with `prefers-reduced-motion` honored — Phase 4 (DECO-01/02/03, HERO-02, ANIM-01..04)

### Active (v2.0)

- [ ] Durable per-guest link identity (opaque stable `id`) replacing open `?to=`
- [ ] Greeting resolves from the link without a public guest list
- [ ] Backend + datastore foundation keyed on guest `id` (future RSVP builds on it)
- [ ] Link-generation tooling to mint per-guest links
- [ ] Responsive and performant on mobile and desktop (carried from v1.0)
- [ ] Deployed live to Vercel with durable links

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

_Last updated: 2026-05-31 — started milestone v2.0 (Personalized Guest-Link Identity + RSVP Foundation); v1.0 Phase 5 polish + deploy absorbed into v2.0_
