---
phase: 03-personalization-countdown
plan: "02"
subsystem: countdown
tags: [countdown, framer-motion, AnimatePresence, CSS-modules]
dependency_graph:
  requires: ["03-01"]
  provides: ["CountdownTimer component", "per-tick digit swap animation"]
  affects: ["src/pages/SaveTheDatePage.jsx"]
tech_stack:
  added: []
  patterns: ["AnimatePresence key-swap for per-tick digit animation", "setInterval + useState countdown hook", "CSS Modules with var() design tokens only"]
key_files:
  created:
    - src/components/CountdownTimer.jsx
    - src/components/CountdownTimer.module.css
  modified:
    - src/pages/SaveTheDatePage.jsx
decisions:
  - "Used AnimatePresence mode=popLayout with key={value} for per-tick digit swap — keeps layout stable while old/new digits cross-fade and slide"
  - "numberCell with position:relative and overflow:hidden anchors the absolute-positioned motion.span during AnimatePresence transitions, preventing layout jumps"
  - "TARGET = new Date(2027, 4, 30, 0, 0, 0) — 0-indexed month 4 = May, midnight local time"
metrics:
  duration: "~2 minutes"
  completed: "2026-05-30"
  tasks: 2
  files: 3
requirements: [CNT-01, CNT-02]
---

# Phase 03 Plan 02: CountdownTimer Summary

Live countdown to May 30, 2027 with per-tick AnimatePresence digit swap using Jost numerals in cream and muted uppercase unit labels, inserted between the location line and footer in SaveTheDatePage.

## What Was Built

`CountdownTimer.jsx` — a four-unit (DAYS / HRS / MIN / SEC) horizontal countdown to May 30, 2027 that ticks every second. Each unit's number swaps via Framer Motion `AnimatePresence` keyed on the numeric value, producing a subtle fade/slide exit+enter on every tick. The display freezes at 00/00/00/00 when the target date is reached or passed — no negative values.

`CountdownTimer.module.css` — Jost 22px numerals in `var(--cream)`, 9px uppercase letter-spaced unit labels in `var(--muted)`. Flex row with 20px gap. All values via `var(--*)` — zero raw hex or inline design values.

`SaveTheDatePage.jsx` updated — `<CountdownTimer />` inserted between `<p className={styles.location}>` and `<p className={styles.footer}>`. Final content order: GuestGreeting → label → coupleNames → divider → date → location → CountdownTimer → footer. `<GuestGreeting />` from plan 03-01 preserved.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Create CountdownTimer component + CSS module | e107d8c |
| 2 | Wire CountdownTimer between location and footer, build | 6429c65 |

## Verification

- `npm run build` exits 0 (359.33 kB JS, 3.29 kB CSS)
- `grep` checks pass: `AnimatePresence`, `key={value}`, `2027`, `setInterval`, `[0.22, 0.61, 0.36, 1]`, `var(--font-body)`, `var(--muted)` all present
- Position check: `<CountdownTimer />` appears after `Oahu` and before `Formal invitation` in JSX source

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all four countdown units (DAYS/HRS/MIN/SEC) are live-computed from `Date.now()` vs the May 30, 2027 target; no placeholder data.
