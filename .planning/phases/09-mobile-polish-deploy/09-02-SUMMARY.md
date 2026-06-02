---
phase: 09-mobile-polish-deploy
plan: 02
subsystem: ui
tags: [framer-motion, animation, accessibility, reduced-motion, pathLength, react]

# Dependency graph
requires:
  - phase: 04-motion-layer
    provides: BotanicalSvg and CornerBrackets with pathLength draw-in variants
  - phase: 09-01
    provides: mobile CSS layout for 375px one-screen fit
provides:
  - useReducedMotion-aware variants in BotanicalSvg that snap pathLength to 1 under reduced motion
  - useReducedMotion-aware variants in CornerBrackets that snap pathLength to 1 under reduced motion
  - useReducedMotion-aware fadeUp/scale/divider variants in SaveTheDatePage that snap to end state
  - EXP-02 reduced-motion compliance across the full entrance sequence
affects: [09-03-deploy, future-animation-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useReducedMotion hook inside component: variants defined inside the component so they can branch on the hook result"
    - "Reduced-motion hidden-equals-visible: when reduceMotion=true, hidden and visible variants are identical end states — paths render fully drawn on mount with no animation"
    - "CornerBracket inner helper accepts pathVariants prop — hook lifted to default export, variant threaded down"

key-files:
  created: []
  modified:
    - src/components/BotanicalSvg.jsx
    - src/components/CornerBrackets.jsx
    - src/pages/SaveTheDatePage.jsx

key-decisions:
  - "Use useReducedMotion() at variant layer (not CSS hacks or per-element delays) per CLAUDE.md animation rules"
  - "Approach B for SaveTheDatePage: override fadeUpVariants/coupleNamesVariants/dividerVariants too (not just pathLength) for full D-07 snap-in compliance"
  - "Lift useReducedMotion hook to CornerBrackets default export; thread bracketPathVariants as prop to inner CornerBracket helper — avoids calling hook in a non-component function"
  - "No will-change optimization added — full-motion path uses transform/opacity only (GPU-compositable), jank-free by construction"

patterns-established:
  - "Pattern: useReducedMotion snap-in — when reduced motion on, set hidden=visible=end-state so element renders fully visible on mount with no animation"
  - "Pattern: variant constants that need the hook must live inside the component function, not at module scope"

requirements-completed: [EXP-02]

# Metrics
duration: 3min
completed: 2026-06-02
---

# Phase 09 Plan 02: Reduced-Motion Snap-In + Jank Check Summary

**`useReducedMotion` wired into BotanicalSvg, CornerBrackets, and SaveTheDatePage variants — pathLength draws and all entrance transforms snap to end state under reduced motion; full-motion path (staggerChildren, 0.9s/element, ease [0.22,0.61,0.36,1]) unchanged**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-02T05:44:59Z
- **Completed:** 2026-06-02T05:47:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended `prefers-reduced-motion` to the full entrance sequence — botanicals, corner brackets, and all page-level animations snap in instantly with no pathLength draw, no y-translate, no opacity fade, no scaleX wipe
- Eliminated the pathLength invisible-paths risk: under reduced motion, `branchVariants.hidden` now has `pathLength: 1` (not 0), so SVG strokes are fully drawn on mount regardless of `MotionConfig` behavior with SVG-specific values
- Preserved the full 10-step entrance sequence and all animation parameters (DURATION=0.9, ease=[0.22,0.61,0.36,1], staggerChildren) on the non-reduced-motion path
- Jank check: full-motion path uses only GPU-compositable properties (transform/opacity for fadeUp/scale/divider; Framer Motion pathLength via strokeDashoffset for SVG); no will-change optimization needed

## Task Commits

1. **Task 1: BotanicalSvg and CornerBrackets pathLength snap-in** — `5e91ca6` (feat)
2. **Task 2: SaveTheDatePage page-level variant snap-in + jank check** — `b15bb8b` (feat)

## Files Created/Modified

- `src/components/BotanicalSvg.jsx` — Moved EASE and variants inside component; added `useReducedMotion`; reduced-motion branch sets `hidden: { pathLength: 1, opacity: 1 }` for all paths and dots
- `src/components/CornerBrackets.jsx` — Lifted `useReducedMotion` hook to default export; `CornerBracket` inner helper now accepts `pathVariants` prop; reduced-motion branch sets `hidden: { pathLength: 1, opacity: 1 }`
- `src/pages/SaveTheDatePage.jsx` — Added `useReducedMotion`; moved `fadeUpVariants`, `coupleNamesVariants`, `dividerVariants` inside component; reduced-motion branch sets all three to instant end-state; act-timing containers and `pageVariants` left unchanged at module scope

## Decisions Made

- Approach B (full snap-in) over Approach A (pathLength fix only): D-07 requires content to "snap in" — not just skip y/scale but also skip the opacity fade. Approach B overrides all three page-level variants so opacity starts at 1 in the hidden state.
- Hook lifted to `CornerBrackets` default export (not `CornerBracket` helper): React requires hooks to be called in component functions, not helpers called conditionally. The variant is threaded down as `pathVariants` prop.
- No `will-change` CSS added: the full-motion path is already GPU-compositable (transform/opacity for CSS animations; Framer Motion handles pathLength via SVG stroke properties). Adding `will-change` without measuring would be premature optimization per D-08.

## Deviations from Plan

None — plan executed exactly as written. The variant-inside-component restructuring and the `pathVariants` prop threading in CornerBrackets were both specified in the plan's action section.

## Jank Check (D-06 / D-08)

The full-motion animation path uses only GPU-compositable properties:
- `fadeUpVariants`, `coupleNamesVariants`, `dividerVariants`: animate `opacity` and CSS `transform` (y, scale, scaleX) — handled by the compositor, no paint
- `branchVariants` / `bracketPathVariants`: Framer Motion animates SVG `pathLength` via `strokeDashoffset`/`strokeDasharray` — paint-layer but lightweight SVG strokes only, no fill rasterization
- `CountdownTimer` digit swap: `AnimatePresence` key swap on numeric text only

No `will-change` optimization applied: code structure is already on the optimal GPU path for all animated CSS properties. Manual DevTools verification at 4–6x CPU throttle recommended to confirm no sustained jank during botanical draw-in (staggered pathLength) and first countdown tick (AnimatePresence).

## Known Stubs

None.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- EXP-02 satisfied: reduced-motion snap-in is fully defined across the whole sequence (no invisible pathLength paths); full-motion path preserved with correct parameters
- Ready for Phase 09-03: Vercel deploy, env var setup, and production verification (D-13)

---
*Phase: 09-mobile-polish-deploy*
*Completed: 2026-06-02*
