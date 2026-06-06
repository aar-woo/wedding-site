---
phase: quick-260605-s5q
plan: 01
subsystem: animation
tags: [botanical, framer-motion, loop, ambient, reduced-motion]
dependency_graph:
  requires: []
  provides: ["BotanicalSvg self-driving 7s redraw loop"]
  affects: ["src/components/BotanicalSvg.jsx"]
tech_stack:
  added: []
  patterns: ["Framer Motion keyframe array with repeat:Infinity", "opacity fade reset tail for pathLength loop"]
key_files:
  modified:
    - src/components/BotanicalSvg.jsx
decisions:
  - "Keyframe array [0,1,1,0] for both pathLength and opacity — lets opacity fade out before the reset, hiding the 1→0 snap"
  - "times:[0,0.14,0.85,1] for branches (approx 1s draw-in) and times:[0,0.06,0.85,1] for dots (approx 0.4s pop) preserves original speed feel"
  - "repeat:Infinity on child variants only; parent decorations cascade drives first draw unchanged"
  - "staggerChildren:0.12 kept on svgVariants so each branch loop is naturally offset for organic feel"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-06-06"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 1
---

# Quick Task 260605-s5q: BotanicalSvg Drawing Animation Loop — Summary

## One-liner

Botanical gold strokes now self-redraw every 7 seconds via Framer Motion keyframe arrays with opacity fade on reset, while the parent-cascade first draw and reduced-motion static state are fully preserved.

## What Was Done

### Task 1: Add 7s draw-in loop to BotanicalSvg (COMPLETE)

**Commit:** 17d0af5

Modified `src/components/BotanicalSvg.jsx` to convert the one-shot `branchVariants.visible` and `dotVariants.visible` states into self-repeating keyframe loops.

**branchVariants.visible (non-reduced-motion):**
- `pathLength: [0, 1, 1, 0]` + `opacity: [0, 1, 1, 0]`
- `transition: { duration: 7, times: [0, 0.14, 0.85, 1], ease: EASE, repeat: Infinity }`

**dotVariants.visible (non-reduced-motion):**
- `scale: [0, 1, 1, 0]` + `opacity: [0, 1, 1, 0]`
- `transition: { duration: 7, times: [0, 0.06, 0.85, 1], ease: EASE, repeat: Infinity }`

Key design decisions:
- The opacity fade on the `[..., 1, 0]` tail hides the instantaneous pathLength 1 to 0 reset so gold strokes never appear to "erase" — they fade out before the redraw starts.
- `times[1]` at `0.14` gives a ~1s draw-in (0.14 x 7s ~= 0.98s) matching the original 1.0s feel. `times[1]` at `0.06` for dots gives ~0.42s matching the original 0.4s.
- `staggerChildren: 0.12` kept on `svgVariants.visible` — each branch's 7s loop is naturally offset by 0.12s, preserving the organic cascade on every redraw.
- No `initial`/`animate` props added to BotanicalSvg's motion elements — the first draw still comes entirely from the SaveTheDatePage decorations cascade. Once the parent flips to "visible", the child's `repeat:Infinity` loop takes over automatically.
- `reduceMotion` branch: untouched — resolves to static `{ pathLength:1, opacity:1 }` / `{ scale:1, opacity:1 }` with no repeat, no keyframes.

**Build verification:** `npm run build` passed (436 modules, no errors).

### Task 2: Human Verification Checkpoint (PENDING — awaiting human)

**Status:** Blocked on human visual verification. This checkpoint requires a human to observe the browser.

**How to verify:**
1. Run `npm run dev` and open the local URL.
2. Watch the two botanical branches flanking "Rina & Aaron" draw in during page load (the initial entrance cascade should be unchanged from before this task).
3. Wait ~7 seconds after the initial settle: confirm the strokes re-draw from base to tip (leaves cascade branch-by-branch, dots pop), then repeat again ~7 seconds later. The animation should feel smooth and ambient — no visible "erasing" or abrupt jump.
4. Confirm the redraw does not disturb the rest of the layout/text.
5. Enable "Reduce motion" (macOS: System Settings -> Accessibility -> Display -> Reduce motion), hard-refresh: botanicals should appear fully drawn immediately and NOT loop.

**Resume signal:** Type "approved" or describe what looks off (timing, erase flicker, too distracting).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] `src/components/BotanicalSvg.jsx` modified — confirmed via git commit 17d0af5
- [x] Build passes — `npm run build` exited successfully (436 modules, no errors)
- [x] `branchVariants.visible` uses keyframe pathLength array with `repeat: Infinity`
- [x] `dotVariants.visible` loops every 7s
- [x] `reduceMotion` branch is static (no repeat, no keyframes)
- [x] No edits to SaveTheDatePage.jsx
- [x] No hardcoded per-element delay props added
