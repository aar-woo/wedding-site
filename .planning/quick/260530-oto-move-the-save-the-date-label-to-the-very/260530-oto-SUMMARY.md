---
quick_id: 260530-oto
description: Move the "Save the Date" label to the very top of the hero container, with spacing between it and the rest of the content block
date: 2026-05-31
files_modified:
  - src/pages/SaveTheDatePage.jsx
  - src/pages/SaveTheDatePage.module.css
---

# Quick Task 260530-oto Summary

**One-liner:** Relocated the "Save the Date" label from inside the bottom-anchored content block to a top-anchored header pinned at the very top of the hero frame, leaving the empty middle of the hero as the separation between it and the rest of the information.

## What Changed

### src/pages/SaveTheDatePage.jsx
- Removed the `Save the Date` `motion.p` from inside `.contentBlock` (it was step 5, between the greeting and the couple names).
- Re-added it as a top-anchored sibling — a direct `motion.p` child of the `.heroFrame` page root, after `.botanicalPair`, with `className={`${styles.label} ${styles.topLabel}`}` and `variants={fadeUpVariants}`.

### src/pages/SaveTheDatePage.module.css
- Added a `.topLabel` rule: `position: absolute; top: 0; left/right: 0; z-index: 2; text-align: center; padding: 48px 28px 0`. Typography stays in the existing `.label` rule (both classes applied).

## Result

- "SAVE THE DATE" now sits at the very top of the hero; the rest (greeting, couple names, divider, date, location, countdown, footer) stays bottom-anchored. The hero's empty middle provides the requested spacing between them.
- `npm run build` exits 0.

## Entrance-sequence note (deviation worth knowing)

The label was step 5 in the locked 10-step reveal (after the greeting). Now that it lives at the top as a direct child of the page-level stagger, it reveals with the early decoration group (≈0.45s in) rather than after the greeting — i.e. the top header draws in with the brackets/botanical, then ~2s later the bottom details cascade. No hardcoded delay was added (timing still derives from the stagger index, honoring ANIM-01). If you'd prefer the label to reveal later (in step with the bottom cascade) instead of early, say so and I'll give the top header a matching delayed reveal.

## Self-Check: PASSED
