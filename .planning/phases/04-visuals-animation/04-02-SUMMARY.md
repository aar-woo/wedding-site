---
phase: 04-visuals-animation
plan: 02
subsystem: components
tags: [animation, svg, framer-motion, decoration]
dependency_graph:
  requires: []
  provides: [CornerBrackets component, CornerBrackets CSS module]
  affects: [Plan 03 page-level stagger — CornerBrackets is a stagger child]
tech_stack:
  added: []
  patterns: [pathLength draw-in via motion.path, internal stagger via staggerChildren, variant propagation (no initial/animate)]
key_files:
  created:
    - src/components/CornerBrackets.jsx
    - src/components/CornerBrackets.module.css
  modified: []
decisions:
  - All four corners (D-05 default) — top-left, top-right, bottom-left, bottom-right
  - strokeWidth 1.5 to match olive-branch stroke weight (visual system unity per D-05)
  - 16px inset from frame edges (clear of heroFrame 20px border-radius + overflow:hidden clipping)
  - z-index 3 — above scrim (z-index 1), sits alongside content layer
metrics:
  duration: 68s
  completed: 2026-05-31
  tasks_completed: 2
  files_created: 2
---

# Phase 4 Plan 02: CornerBrackets Component Summary

**One-liner:** Four gold L-bracket SVGs that draw themselves in via Framer Motion pathLength with internal stagger, variant-propagation-ready for Plan 03's page-level choreography.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Build CornerBrackets component with pathLength draw-in | 954203b | src/components/CornerBrackets.jsx |
| 2 | Add CornerBrackets CSS module (corner positioning + flip classes) | cadd0f2 | src/components/CornerBrackets.module.css |

## What Was Built

### CornerBrackets.jsx

- `bracketsContainerVariants` with `staggerChildren: 0.1` — internal stagger for the four corner paths
- `bracketPathVariants` — `pathLength: 0 → 1`, `opacity: 0 → 1`, 0.9s duration, easing `[0.22, 0.61, 0.36, 1]`
- `CornerBracket` inner component: single `<motion.path>` L-shape (`M 4 16 L 4 4 L 16 4`), `strokeDasharray="0 1"` SSR guard, `stroke="var(--gold)"`, `strokeWidth="1.5"`
- `CornerBrackets` default export: `motion.div` wrapper with `variants={bracketsContainerVariants}` only (no `initial`/`animate`) — four instances with positioning and flip classes applied

### CornerBrackets.module.css

- `.bracketsWrapper`: `position: absolute; inset: 0; z-index: 3; pointer-events: none`
- SVG children: 28x28px, `position: absolute`, positioned at 16px inset per corner
- Four corner classes: `.topLeft`, `.topRight`, `.bottomLeft`, `.bottomRight`
- Flip classes: `.flipH` (`scaleX(-1)`), `.flipV` (`scaleY(-1)`), `.flipBoth` (`scale(-1, -1)`)
- No hardcoded hex colors

## Requirements Satisfied

- **DECO-01:** Corner brackets draw in via animated `pathLength` — confirmed via `motion.path` with `pathLength: 0 → 1`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the component is complete and self-contained. It renders correctly once consumed by Plan 03 (which wires it into the page-level stagger via `initial="hidden" animate="visible"`).

## Self-Check: PASSED
