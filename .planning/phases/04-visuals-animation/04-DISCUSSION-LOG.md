# Phase 4: Visuals & Animation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 04-visuals-animation
**Areas discussed:** Botanical design & placement, Parallax & scroll behavior

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Botanical design & placement | What the branch looks like + where it sits | ✓ |
| Corner brackets framing | Which corners, viewport vs content, size/weight | |
| Parallax & scroll behavior | Whether/how the single-screen page scrolls | ✓ |
| Entrance pacing & reduced-motion | Total duration, stagger overlap, run-once, a11y | |

**Notes:** Corner brackets and entrance pacing left to Claude's discretion within the CLAUDE.md spec.

---

## Botanical Design & Placement

### Style

| Option | Description | Selected |
|--------|-------------|----------|
| Eucalyptus sprig | Rounded paired leaves on a curving stem | |
| Olive branch | Slender pointed leaves alternating, olive terminal dots | ✓ |
| Fern frond | Arcing spine with many small leaflets (tropical) | |
| You decide | Claude's discretion | |

**User's choice:** Olive branch

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom corners, framing content | Sprig lower-left + flipped lower-right, arcing inward | |
| Flanking the couple names | Mirrored sprigs immediately L/R of "Rina & Aaron" | ✓ |
| Top corners only | Sprigs descending from upper corners | |
| You decide | Claude's discretion | |

**User's choice:** Flanking the couple names

### Orientation (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical, stems running alongside | Compact horizontal footprint, leaves arc toward text | ✓ |
| Horizontal, pointing inward | Laurel/crest look, needs more room | |
| You decide | Claude's discretion | |

**User's choice:** Vertical, stems running alongside

### Timing within sequence (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep spec order — draw before names | Branches draw at step 3, names land at step 5 | ✓ |
| You decide | Tune overlap within fixed order | |

**User's choice:** Keep spec order — draw before names ("frame fills with the couple" reveal)

**Notes:** Narrow-screen crowding of flanking branches explicitly deferred to Phase 5.

---

## Parallax & Scroll Behavior

### Scroll model

| Option | Description | Selected |
|--------|-------------|----------|
| Add modest scroll room below | Page ~130–150svh, hero shifts slower than content — real parallax | |
| Keep single screen, parallax on tiny overscroll | ~100svh, parallax only on rubber-band; effectively invisible | |
| Hero zoom only, defer real parallax | Ken Burns is hero motion; parallax a no-op | ✓ |
| You decide | Claude's discretion | |

**User's choice:** Hero zoom only, defer real parallax

### HERO-03 requirement handling (follow-up — flagged conflict)

| Option | Description | Selected |
|--------|-------------|----------|
| Defer parallax to Phase 5 | Move HERO-03 to Phase 5, amend criterion #4 | |
| Drop parallax entirely | Remove HERO-03 from milestone, out of scope for v1 | ✓ |
| You decide | Claude's discretion | |

**User's choice:** Drop parallax entirely

**Notes:** Claude flagged that "hero zoom only" conflicts with HERO-03 and Phase 4 success criterion #4 ("scrolling produces a parallax offset"). User elected to drop HERO-03 from the milestone entirely. `ParallaxImage.jsx` will not be built. REQUIREMENTS.md and ROADMAP.md Phase 4 criterion #4 need reconciliation (criterion #4 → "Ken Burns only").

---

## Claude's Discretion

- Corner-bracket specifics (which corners — default all four, size, inset, line weight) — kept consistent with olive-branch stroke weight.
- Entrance pacing: total duration, exact stagger interval, run-once-on-load, optional `prefers-reduced-motion` handling.
- Exact olive-branch SVG geometry (leaf-pair count, stem curve, olive-dot count/placement) and modest scale.

## Deferred Ideas

- Parallax / HERO-03 — dropped from v1 (not deferred to a later phase).
- Responsive/mobile polish incl. flanking-branch crowding — Phase 5.
- Performance tuning + Vercel deploy — Phase 5.
- Countdown-zero celebration state — out of scope for v1.
