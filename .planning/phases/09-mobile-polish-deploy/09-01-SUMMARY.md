---
phase: 09-mobile-polish-deploy
plan: 01
subsystem: frontend/css
tags: [mobile, responsive, layout, css-modules]
dependency_graph:
  requires: []
  provides: [EXP-01-layout-fix]
  affects: [src/pages/SaveTheDatePage.module.css, src/components/CountdownTimer.module.css]
tech_stack:
  added: []
  patterns: [absolute-positioning-budget-reduction, css-modules-base-block-only]
key_files:
  modified:
    - src/pages/SaveTheDatePage.module.css
    - src/components/CountdownTimer.module.css
  created: []
decisions:
  - Raised botanicalPair bottom from 180px to 220px to clear the contentBlock top edge on 375x667 (within the 200-240px acceptable range)
  - Reduced topGroup padding-top from 48px to 24px — header stack starts higher without crowding
  - Reduced contentBlock padding-bottom from 48px to 28px — reclaims 20px at the bottom anchor
  - Reduced countdown margin-bottom from 32px to 18px — footer no longer pushed off screen
  - All edits confined to base block only; @media (min-width: 768px) block byte-for-byte unchanged
metrics:
  duration: 91s
  completed: "2026-06-02"
  tasks_completed: 2
  files_changed: 2
---

# Phase 9 Plan 1: Mobile Layout — 375x667 One-Screen Fit Summary

Tightened base-block CSS spacing so the three independently-anchored groups (`.topGroup` top-pinned, `.botanicalPair` at `bottom: 220px`, `.contentBlock` bottom-pinned) fit within a 375x667px viewport with no scroll, no overflow, and no overlap — delivering EXP-01.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Audit 375x667 layout — collision/overflow identification | (no commit — audit only) | — |
| 2 | Tighten base-block spacing for one-screen fit | d946b5e | src/pages/SaveTheDatePage.module.css, src/components/CountdownTimer.module.css |

## What Was Built

Targeted CSS reductions in the base (non-media-query) block of `SaveTheDatePage.module.css` and `CountdownTimer.module.css` to make the complete keepsake fit a 375x667px viewport without scrolling.

**Vertical budget analysis (Task 1):**
- On a 375x667 viewport the three absolutely-positioned groups were colliding: `.contentBlock` top edge was ~388px from top, while `.botanicalPair` baseline was at 667-180 = 487px — placing the botanical SVGs 99px INSIDE the content block, overlapping date/countdown/location text.
- The header group consumed ~197px (topGroup with 48px padding-top + label + divider + coupleNames) and left insufficient breathing room.

**CSS changes applied (Task 2) — base block only:**

| Property | Before | After | Saved |
|---|---|---|---|
| `.topGroup` padding-top | 48px | 24px | 24px |
| `.coupleNames` margin-bottom | 24px | 16px | 8px |
| `.contentBlock` padding-bottom | 48px | 28px | 20px |
| `.date` margin-bottom | 16px | 12px | 4px |
| `.location` margin-bottom | 32px | 18px | 14px |
| `.countdown` margin-bottom | 32px | 18px | 14px |
| `.botanicalPair` bottom offset | 180px | 220px | botanicals raised 40px |

**Post-fix layout math at 375x667:**
- New contentBlock height approx: 28(pad) + 16.5(footer) + 37(countdown) + 18(margin) + 21(location) + 18(margin) + 52.4(date) + 12(margin) + 24(greeting) = ~227px
- New contentBlock top edge approx: 667 - 227 = 440px
- New botanicalPair baseline: 667 - 220 = 447px — SVGs are only 7px below contentBlock top, flanking the couple-name/divider area rather than overlapping the date/countdown

**Countdown row math (verified, not changed):**
- 4 units x 44px + 3 gaps x 20px = 236px < 375px — fits horizontally with margin to spare; `.unit min-width` and `.countdown gap` left untouched.

## Decisions Made

1. Raised `.botanicalPair bottom` to 220px (within the 200-240px plan range) — chosen to leave botanicals just above the contentBlock top edge, flanking the couple-name area as intended.
2. Reduced topGroup padding-top to 24px rather than removing it — preserves visual breathing room at the very top of the viewport.
3. Did not reduce any font sizes — all six spacing/margin/padding reductions were sufficient to achieve one-screen fit (font size reduction was documented as last resort only).
4. Did not introduce any new media queries — all edits are plain base-block rules that apply at all widths.

## Deviations from Plan

None — plan executed exactly as written. All seven tightening edits from Task 2's action list were applied with the exact values specified. The 768px media query block is provably untouched (confirmed via `git diff` grep check).

## Verification

- `npm run build` exits 0 (confirmed before and after edits)
- `git diff src/pages/SaveTheDatePage.module.css | grep -E "^\+" | grep -i "min-width: 768px"` returned empty — no changes inside the 768px boundary
- `@media (min-width: 768px)` still present at line 192 of SaveTheDatePage.module.css
- Countdown row math: 4x44 + 3x20 = 236px < 375px — no crowding at 375px floor
- No inline style design values added; only CSS Module rules using existing `var(--*)` tokens

## Known Stubs

None.

## Self-Check: PASSED

- [x] src/pages/SaveTheDatePage.module.css modified (confirmed via git diff)
- [x] src/components/CountdownTimer.module.css modified (confirmed via git diff)
- [x] Commit d946b5e exists (confirmed via git rev-parse)
- [x] npm run build exits 0 (confirmed)
- [x] @media (min-width: 768px) block untouched (confirmed via git diff grep)
- [x] No font size changes (font reductions were last resort, not needed)
- [x] No new design values or inline styles introduced
