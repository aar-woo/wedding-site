---
phase: 04-visuals-animation
plan: "01"
subsystem: components
tags: [svg, animation, framer-motion, botanical, decoration]
dependency_graph:
  requires: []
  provides: [BotanicalSvg component, BotanicalSvg CSS module]
  affects: [Plan 03 page-level stagger orchestration]
tech_stack:
  added: []
  patterns: [framer-motion pathLength draw-in, staggerChildren, CSS scaleX flip]
key_files:
  created:
    - src/components/BotanicalSvg.jsx
    - src/components/BotanicalSvg.module.css
  modified: []
decisions:
  - Flip via CSS scaleX(-1) on wrapper div (not framer transform) to avoid transform pipeline conflict
  - strokeDasharray="0 1" static attribute on every motion.path prevents flash-of-drawn-stroke
  - No initial/animate on motion.svg — relies on parent page-level variant propagation (Plan 03)
  - 3 leaf pairs (6 paths) + stem + 3 terminal dots = 10 paths total, staggered at 0.12s intervals
metrics:
  duration: 2min
  completed: "2026-05-31"
  tasks: 2
  files: 2
---

# Phase 04 Plan 01: BotanicalSvg Component Summary

Stroke-only gold olive-branch SVG component with pathLength stagger draw-in, 3 leaf pairs, and a flipped prop via CSS scaleX(-1) on the wrapper div.

## What Was Built

Two files: `src/components/BotanicalSvg.jsx` and `src/components/BotanicalSvg.module.css`.

The component renders a slender vertical olive branch inside a `viewBox="0 0 40 140"` SVG. It consists of:
- 1 main stem path (gentle S-curve, strokeWidth 1.5)
- 6 leaf paths (3 pairs, alternating left/right, arcing inward toward the stem at x=20)
- 3 terminal olive dot circles (the only filled elements)

All strokes use `stroke="var(--gold)"` with `fill="none"`. The terminal dots use `fill="var(--gold)"`. No hardcoded hex colors anywhere.

## Animation Architecture

The `motion.svg` carries `variants={svgVariants}` with `staggerChildren: 0.12`. Each `motion.path` carries `variants={branchVariants}` (pathLength 0→1, opacity 0→1, duration 1.0s). Each `motion.circle` dot carries `variants={dotVariants}` (scale 0→1, opacity 0→1, duration 0.4s). All use `EASE = [0.22, 0.61, 0.36, 1]`.

No `initial` or `animate` props are set on `motion.svg` or any child — the component is designed to be a stagger child of the Plan 03 page-level container which propagates "hidden"/"visible" variant state down.

## DECO-02 Satisfaction

- Stroke-only botanical SVG: yes (fill="none" on all paths)
- pathLength draw-in (0→1): yes (branchVariants)
- staggered branches: yes (staggerChildren: 0.12 on motion.svg)
- flipped prop: yes (CSS scaleX(-1) on wrapper div via styles.flipped)

## DECO-03 Satisfaction

- var(--gold) strokes: yes (stroke="var(--gold)" on all 7 paths)
- fill=none on stroke paths: yes
- only terminal dots are filled: yes (3 motion.circle with fill="var(--gold)")

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

Files created:
- src/components/BotanicalSvg.jsx: FOUND
- src/components/BotanicalSvg.module.css: FOUND

Commits:
- 4b61f93: feat(04-01): add BotanicalSvg component with pathLength stagger and flipped prop
- a9fed8b: feat(04-01): add BotanicalSvg CSS module with wrapper sizing and flipped class

Build: green (npm run build exits 0)

## Self-Check: PASSED
