---
phase: quick
plan: 260529-os0
subsystem: ui/hero-layout
tags: [css, responsive, layout, desktop]
dependency_graph:
  requires: []
  provides: [desktop-greeting-card-hero]
  affects: [SaveTheDatePage.module.css]
tech_stack:
  added: []
  patterns: [aspect-ratio portrait card, CSS media query overrides]
key_files:
  modified:
    - src/pages/SaveTheDatePage.module.css
decisions:
  - "5:7 aspect ratio chosen as classic greeting/A-card portrait proportion — clearly wider than phone without going landscape"
  - "max-width: min(92vw, 680px) caps the card on very wide viewports without needing a container query"
  - "border-radius softened from 28px to 20px to suit the larger, less phone-like frame"
  - "Typography overrides (coupleNames 84px, date 32px, contentBlock padding 0 56px 56px) kept minimal — only three overrides added, all dimensional"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-30"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 1
---

# Quick Task 260529-os0: Update Hero Card to Greeting-Card Proportions

**One-liner:** Reshaped desktop hero from 9:19.5 phone column to 5:7 portrait greeting-card (capped 680px wide / 900px tall) with matching typography nudges.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Reshape desktop hero to greeting-card proportions | 04cdbfc | src/pages/SaveTheDatePage.module.css |
| 2 | Adjust desktop card content typography to fit new frame | 04cdbfc | src/pages/SaveTheDatePage.module.css |

Both tasks were committed together in a single atomic commit (04cdbfc) since they are two halves of the same CSS change to the `@media (min-width: 768px)` block.

## What Was Built

The `@media (min-width: 768px)` `.heroFrame` rule in `SaveTheDatePage.module.css` was rewritten:

- **Before:** `height: min(92svh, 920px); aspect-ratio: 9 / 19.5; border-radius: 28px` — a narrow phone-column shape
- **After:** `height: min(88svh, 900px); aspect-ratio: 5 / 7; max-width: min(92vw, 680px); border-radius: 20px` — a generous portrait invitation card

Desktop typography overrides added inside the same media block:
- `.contentBlock { padding: 0 56px 56px; }` — wider side padding to use the extra width
- `.coupleNames { font-size: 84px; margin: 0 0 28px; }` — larger presence on a bigger canvas
- `.date { font-size: 32px; }` — slightly larger to match

Mobile rules (below 768px) and all page background rules (`.page`, `.page::before`, `.page::after`) are completely unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree was missing uncommitted desktop layout additions from main working tree**

- **Found during:** Task 1 setup
- **Issue:** The worktree branch was rebased onto main but the main working tree had uncommitted changes to `SaveTheDatePage.module.css` — specifically the `.heroFrame` base rule and the entire `@media (min-width: 768px)` block. The plan was authored against this uncommitted state (the plan's context block cites the phone-ratio `.heroFrame` which only existed as an uncommitted change).
- **Fix:** The full current state of the file (committed base + uncommitted additions from main) was written to the worktree file, with the plan's required changes applied on top. No changes were lost.
- **Files modified:** src/pages/SaveTheDatePage.module.css

## Checkpoint: Awaiting Human Visual Verification

**Task 3** is a `checkpoint:human-verify` gate. Automated tasks (1 and 2) are complete and committed. Human visual verification is required before this task can be marked complete.

### How to Verify

1. Run `npm run dev` and open the local URL in a desktop-width browser window (>=768px wide)
2. Confirm the hero card looks like an elegant invitation/greeting card — clearly wider and less phone-like than before, with margins of background photo visible around it
3. Confirm all content (Rina & Aaron, Save the Date, May 30 2027, Oahu, countdown, footer) fits inside the card without overflowing or feeling cramped
4. Resize the window below 768px and confirm the mobile full-bleed hero is unchanged
5. If proportions feel off, describe the desired adjustment and the aspect-ratio / max-width / height values can be tuned

**Resume signal:** Type "approved" or describe the proportion/size adjustments you want.

## Known Stubs

None — all content is wired. Card dimensions are structural CSS, not placeholder values.

## Self-Check: PASSED

- [x] src/pages/SaveTheDatePage.module.css modified with `aspect-ratio: 5 / 7`
- [x] src/pages/SaveTheDatePage.module.css has `max-width: min(92vw, 680px)`
- [x] No `9 / 19.5` ratio remains in the file
- [x] `font-size: 84px` and `padding: 0 56px 56px` present in media block
- [x] Commit 04cdbfc exists in worktree git log
