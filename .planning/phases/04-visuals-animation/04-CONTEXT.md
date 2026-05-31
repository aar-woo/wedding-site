# Phase 4: Visuals & Animation - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the static save-the-date page to full motion life:

1. **Botanical line-art** — a stroke-only gold olive-branch SVG (`BotanicalSvg`) that draws itself in via `pathLength`, with staggered strokes and a `flipped` prop (DECO-02, DECO-03).
2. **Corner bracket decorations** — SVG brackets that draw in via animated `pathLength` (DECO-01).
3. **Ken Burns hero** — subtle zoom (scale 1 → 1.08 over 20s, alternating) on the existing hero image (HERO-02).
4. **Orchestrated entrance sequence** — the spec's 10-step reveal using Framer Motion `variants` + `staggerChildren`, no hardcoded per-element delays, easing `[0.22, 0.61, 0.36, 1]`, ≥0.8s per element (ANIM-01..04).

In scope: DECO-01, DECO-02, DECO-03, HERO-02, ANIM-01, ANIM-02, ANIM-03, ANIM-04.

**Removed from scope this phase:** HERO-03 (parallax) — see D-09. Parallax is dropped from v1 entirely; the page stays single-screen and does not scroll.

NOT in scope (later phase): responsive/mobile polish, performance tuning, Vercel deploy (Phase 5). Mobile crowding of the flanking botanicals is explicitly a Phase 5 concern.

**Already satisfied (do not rebuild):** Phase 4 success criterion #5 ("each countdown digit that changes animates individually") was delivered in Phase 3 via `AnimatePresence` key-swap in `CountdownTimer.jsx`. Phase 4 only needs to fold the resting countdown into the entrance sequence, not re-implement the per-tick animation.

</domain>

<decisions>
## Implementation Decisions

### Botanical line-art (DECO-02, DECO-03)
- **D-01:** Botanical style is an **olive branch** — slender pointed leaves alternating along the stem, with a few **terminal dots as olives**. Stroke-only, `var(--gold)`, no fills except the terminal dots (locked by spec; style chosen here).
- **D-02:** Rendered as a **mirrored pair flanking the couple names "Rina & Aaron"** — one on the left, one on the right using the `flipped` prop (a single `BotanicalSvg` component instantiated twice). This is a decorative accent on the focal point, not a full-page frame.
- **D-03:** Orientation is **vertical** — each branch's stem runs roughly top-to-bottom alongside the name, with leaves arcing **inward toward the text**. Keep a **modest, compact horizontal footprint** so the branches sit beside the name without overlapping the glyphs.
- **D-04 (timing within the locked sequence):** The branches **draw in at step 3 (botanical)**, before the couple names fade up at step 5 — gold strokes appear in the side-space, then "Rina & Aaron" lands into the frame they created. This honors CLAUDE.md's fixed 10-step order and produces a "frame fills with the couple" reveal. Planner may tune the exact stagger overlap so branches + names feel connected, but must keep the fixed order.

### Corner brackets (DECO-01) — Claude's Discretion
- **D-05:** Not deep-dived. Default to the spec intent: corner bracket decorations that **draw in via `pathLength`** at **step 2** of the sequence (after background, before botanical). Planner/executor choose which corners (default: all four, framing the viewport), size, inset, and line weight to read elegantly with the gold palette. Keep consistent with the olive-branch line-weight so brackets and botanicals feel like one decorative system.

### Hero motion (HERO-02)
- **D-06 (locked by spec):** Ken Burns zoom — `scale: 1 → 1.08` over a **20s** loop, **alternating** direction. Applied to the existing hero `<img>` layer in `SaveTheDatePage.jsx`. This is now the hero's **only** motion (see D-09).

### Entrance choreography (ANIM-01..04) — mostly locked
- **D-07 (locked by spec):** Use Framer Motion `variants` + `staggerChildren` — **no hardcoded per-element delays**. Reveal **order is fixed**: background → corner brackets → botanical → guest greeting → "Save the Date" label → couple names → divider → date → location → footer. Easing `[0.22, 0.61, 0.36, 1]` everywhere; each element animates over **≥0.8s**.
- **D-08 (locked by spec):** Couple names animate in with a **slight scale (0.96 → 1)**; the divider **scales from center (scaleX)**. The existing resting-state elements (greeting, label, names, divider, date, location, countdown, footer) from Phases 2–3 become the staggered children of the entrance sequence.
- Pacing detail (total duration, exact stagger interval, run-once-on-load, optional `prefers-reduced-motion` handling) left to Claude's Discretion — sensible, unhurried defaults within the locked easing/order/min-duration.

### Parallax / scroll behavior (HERO-03)
- **D-09 (scope change — user decision):** **Parallax is dropped from v1 entirely.** The page remains a single full-bleed screen (`100svh`, non-scrolling) — there is no scroll distance for parallax to read against, and the team chose not to introduce one. Consequences:
  - `ParallaxImage.jsx` is **NOT built** in this phase (or the milestone).
  - **HERO-03 → Out of Scope** in REQUIREMENTS.md.
  - **Phase 4 success criterion #4** is amended from "Ken Burns + parallax on scroll" to **"Ken Burns zoom only"** (no scroll-driven offset).
  - **Action for downstream / roadmap reconciliation:** REQUIREMENTS.md (HERO-03) and ROADMAP.md Phase 4 success criterion #4 must be updated to reflect this. Flagged so verification does not fail on a criterion the team intentionally removed.

### Claude's Discretion (summary)
- Corner-bracket specifics (which corners, size, inset, weight) — D-05.
- Entrance pacing: total duration, exact stagger interval, run-once behavior, and whether to honor `prefers-reduced-motion`.
- Exact olive-branch SVG path geometry (number of leaf pairs, curve of the stem, count/placement of terminal olive dots) and modest scale, within D-01..D-04.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design + animation contract (binding)
- `CLAUDE.md` — BINDING spec. Defines: the full 10-step **page load sequence order**, easing `[0.22, 0.61, 0.36, 1]`, min 0.8s/element, `variants` + `staggerChildren` rule (no hardcoded delays); `BotanicalSvg.jsx` contract (stroke-only, `var(--gold)`, no fills except terminal dots, `flipped` prop, `pathLength` 0→1 staggered branches); Ken Burns spec (scale 1→1.08 / 20s / alternate); corner-bracket draw-in via `pathLength`; the design system (palette, fonts, color roles). NOTE: its `ParallaxImage.jsx` component and parallax/`useScroll`/`useTransform` guidance are **superseded by D-09 — parallax is dropped, do not build `ParallaxImage`**. Also note React 19 / React Router v7 (import from `react-router`).

### Visual + prior-phase contracts
- `.planning/phases/02-static-page/02-UI-SPEC.md` — Approved visual contract: type scale, color roles (`--gold-light` reserved for couple names; `--gold` for label/divider/decorations), spacing scale, the bottom-anchored content-block layout the animation choreographs.
- `.planning/phases/03-personalization-countdown/03-CONTEXT.md` — Establishes that `framer-motion` first usage was the countdown per-tick swap, that GuestGreeting/CountdownTimer render in **resting state** awaiting Phase 4's entrance choreography, and the content order the sequence animates.

### Current implementation to extend
- `src/pages/SaveTheDatePage.jsx` — The page hosting hero image, scrim, and the content block; entrance variants + Ken Burns + botanical/brackets are wired here.
- `src/pages/SaveTheDatePage.module.css` — Existing layout/type styles (incl. the desktop greeting-card hero reshape from quick task 260529-os0) to extend.
- `src/components/CountdownTimer.jsx` / `.module.css` — Already has `AnimatePresence` per-tick swap (criterion #5 done); fold into the stagger as a resting child.
- `src/components/GuestGreeting.jsx` / `.module.css` — Resting-state greeting; becomes a staggered child (step 4).
- `src/index.css` — Design tokens (`--forest`, `--gold`, `--gold-light`, `--cream`, `--muted`, `--font-display`, `--font-body`).

### Requirements
- `.planning/REQUIREMENTS.md` §Botanical & Decoration (DECO-01..03), §Animation (ANIM-01..04), §Hero (HERO-02; HERO-03 to be moved Out of Scope per D-09).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/SaveTheDatePage.jsx` — full resting composition already built (hero `<img>`, scrim, bottom-anchored content block with greeting → label → names → divider → date → location → countdown → footer). Phase 4 wraps these in motion, it does not restructure them.
- `src/components/CountdownTimer.jsx` — already uses `framer-motion` `AnimatePresence` for the per-tick digit swap (Phase 3). Phase 4 success criterion #5 is therefore already met.
- `src/index.css` tokens + loaded fonts (Cormorant Garamond 300–700 incl. italic, Jost 300–600) — no new fonts/weights needed.
- `framer-motion` installed and in use; `useAnimation`/`motion`/`variants`/`staggerChildren` all available.

### Established Patterns
- CSS Modules only; all colors/fonts via `var(--*)`; no inline design values; no UI libraries (CLAUDE.md).
- Animation must derive from `staggerChildren` index — no per-element hardcoded delays (CLAUDE.md / ANIM-01).
- Imports from `react-router` (v7), not `react-router-dom`.

### Integration Points
- New component: `src/components/BotanicalSvg.jsx` (+ CSS module) — instantiated as a mirrored pair (`flipped`) flanking the couple names inside the content block.
- New corner-bracket SVGs (component or inline) drawn at the viewport corners.
- Entrance `variants` orchestration lives at the content-block (and page) level in `SaveTheDatePage.jsx`, converting existing children to `motion.*` elements.
- Ken Burns applied to the hero `<img>` layer (CSS keyframes or a `motion` loop).
- **No `ParallaxImage.jsx`** — parallax dropped (D-09).

</code_context>

<specifics>
## Specific Ideas

- Botanical feel: **olive branch** — timeless, slightly angular, Mediterranean; pointed alternating leaves with olive dots. Reads as elegant gold line-art.
- Composition idea: mirrored branches **flank the couple names vertically**, leaves arcing inward — they draw in first (step 3) and the names fade up into the frame they create.
- Keep brackets and botanicals as one cohesive gold "line-art system" (matched stroke weight).
- The page is a quiet single-screen keepsake — motion is unhurried; Ken Burns is the only ambient hero motion.

</specifics>

<deferred>
## Deferred Ideas

- **Parallax / scroll-driven hero offset (HERO-03)** — dropped from v1 (D-09). Not deferred to a later phase; intentionally out of scope for the single-screen keepsake. `ParallaxImage.jsx` not built.
- **Responsive/mobile polish** — Phase 5. Includes ensuring the flanking olive branches don't crowd "Rina & Aaron" on narrow screens (may shrink, reposition, or hide on small breakpoints).
- **Performance tuning + Vercel deploy** — Phase 5.
- "Today!"/celebration state at countdown zero — out of scope for v1 (carried from Phase 3).

</deferred>

---

*Phase: 04-visuals-animation*
*Context gathered: 2026-05-30*
