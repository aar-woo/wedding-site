---
phase: 04-visuals-animation
plan: 03
subsystem: pages
tags: [animation, framer-motion, entrance-sequence, ken-burns, accessibility]
dependency_graph:
  requires: [BotanicalSvg component, CornerBrackets component]
  provides: [orchestrated entrance sequence, Ken Burns hero motion, app-wide reduced-motion config]
  affects: [SaveTheDatePage entrance, App root motion config]
tech_stack:
  added: []
  patterns: [two-container stagger (variants + staggerChildren + delayChildren), CSS @keyframes Ken Burns on compositor thread, MotionConfig reducedMotion=user, variant propagation from page root]
key_files:
  created: []
  modified:
    - src/pages/SaveTheDatePage.jsx
    - src/pages/SaveTheDatePage.module.css
    - src/App.jsx
decisions:
  - Two-container stagger — page-root staggerChildren 0.15 drives decorations (brackets step 2, botanical step 3); content block uses delayChildren 2.0 so decorations finish before the text cascade
  - Ken Burns implemented as CSS @keyframes (scale 1→1.08, 20s ease-in-out infinite alternate) on the compositor thread, NOT a framer-motion loop — avoids transform conflict with entrance variants
  - Ken Burns guarded by @media (prefers-reduced-motion - no-preference); MotionConfig reducedMotion=user wraps App to disable transform animations site-wide under OS reduce-motion
  - botanicalPair positioned absolute at bottom 180px to flank the couple names (discretionary value, flagged tunable at visual checkpoint)
  - Couple names scale 0.96→1; divider scaleX 0→1 with transformOrigin center (ANIM-04)
  - All durations 0.9s, easing [0.22, 0.61, 0.36, 1], no per-element hardcoded delays (only stagger/delayChildren orchestration)
  - Countdown folded into the stagger as a resting child — per-tick AnimatePresence swap from Phase 3 left untouched
metrics:
  duration: ~128s
  completed: 2026-05-31
  tasks_completed: 4
  files_modified: 3
---

# Phase 4 Plan 03: Entrance Choreography + Ken Burns Summary

**One-liner:** Converts the resting-state save-the-date page into the full 10-step orchestrated entrance sequence (two-container Framer Motion stagger), adds the CSS Ken Burns hero zoom, and wraps the app in a reduced-motion-aware MotionConfig.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Ken Burns @keyframes + reduced-motion guard + botanicalPair CSS | 3fbcd2e | src/pages/SaveTheDatePage.module.css |
| 2 | Entrance orchestration — two-container stagger + brackets + botanical | d147b26 | src/pages/SaveTheDatePage.jsx |
| 3 | Wrap App in MotionConfig reducedMotion="user" | 9eca161 | src/App.jsx |
| 4 | Visual review of full entrance sequence + Ken Burns (checkpoint) | — | (human-verify — approved 2026-05-31) |

## What Was Built

### SaveTheDatePage.jsx
- Page-root `motion.div` with `initial="hidden" animate="visible"` — single source of propagation for all children
- `containerVariants` (`staggerChildren: 0.15`) drives the viewport-level decorations: `CornerBrackets` (step 2), `BotanicalSvg` pair in `.botanicalPair` (step 3)
- `contentVariants` (`staggerChildren: 0.15, delayChildren: 2.0`) bridges to the content block so decorations finish before the text cascade (steps 4–10: greeting → label → names → divider → date → location → countdown → footer)
- Couple-names variant `scale: 0.96 → 1`; divider variant `scaleX: 0 → 1` with `style={{ transformOrigin: 'center' }}`
- All item variants 0.9s duration, easing constant `EASE = [0.22, 0.61, 0.36, 1]`; no per-element delays
- Countdown rendered as a resting stagger child — Phase 3 per-tick AnimatePresence swap untouched

### SaveTheDatePage.module.css
- `@keyframes kenBurns` (scale 1 → 1.08), applied to the hero image `20s ease-in-out infinite alternate` inside `@media (prefers-reduced-motion: no-preference)`; `will-change: transform` for compositing
- `.botanicalPair` absolute positioning (`bottom: 180px`) flanking the couple-names area

### App.jsx
- App tree wrapped in `<MotionConfig reducedMotion="user">` — disables transform/layout animation when OS reduce-motion is set (opacity preserved)

## Requirements Satisfied

- **HERO-02:** Ken Burns zoom scale 1→1.08 over 20s alternating (CSS @keyframes)
- **ANIM-01:** Entrance uses variants + staggerChildren — no hardcoded per-element delays (verified `! grep -nE 'delay:\s*[0-9]'`)
- **ANIM-02:** Reveal order matches spec (bg → brackets → botanical → greeting → label → names → divider → date → location → footer)
- **ANIM-03:** Easing `[0.22, 0.61, 0.36, 1]` everywhere; each element ≥0.8s (0.9s)
- **ANIM-04:** Couple names scale 0.96→1; divider scaleX from center (transformOrigin center)

## Deviations from Plan

None functionally. Two discretionary values set and flagged tunable at the visual checkpoint: content-block `delayChildren: 2.0` and `.botanicalPair { bottom: 180px }`. User approved the sequence as-is.

## Known Stubs

None. Follow-up idea captured separately as backlog 999.1 (re-trigger olive-branch draw-in on a 7s interval) — out of scope for this phase.

## Self-Check: PASSED
