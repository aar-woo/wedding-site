# Phase 3: Personalization & Countdown - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 3-personalization-countdown
**Areas discussed:** Countdown placement, Countdown styling, Greeting treatment
**Areas offered but not selected:** Edge cases (handled via Claude's Discretion defaults)

---

## Countdown placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below location, above footer | Date/location stay grouped; countdown as a distinct urgency band above the footer | ✓ |
| Directly under the date | Countdown right beneath "May 30, 2027", before location | |
| Above the names | Countdown high, between the label and couple names | |

**User's choice:** Below location, above footer
**Notes:** Final content order: greeting → label → names → divider → date → location → countdown → footer.

---

## Countdown styling

| Option | Description | Selected |
|--------|-------------|----------|
| Serif numerals + tiny labels | Large Cormorant gold-light numerals + small uppercase Jost unit labels | |
| Sans numerals, quieter | Jost numerals in cream with muted uppercase labels — understated/"data" feel | ✓ |
| Minimal single line | "120 days · 4 hrs · 12 min · 30 sec" single line, no stacked units | |

**User's choice:** Sans numerals, quieter
**Notes:** Numerals modest in size (location/footer range), distinctly smaller than names/date.

---

## Greeting treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Italic Cormorant, personal | "For [name]" in italic Cormorant Garamond, cream/gold-light — handwritten-invitation feel | ✓ |
| Uppercase muted kicker | Small uppercase tracked Jost, muted — matches the "SAVE THE DATE" label | |
| Name prominent | Larger gold-light treatment highlighting the guest name | |

**User's choice:** Italic Cormorant, personal
**Notes:** Sits at top of content block, above the "Save the Date" label (matches spec load order).

---

## Claude's Discretion

- Exact greeting color split ("For" vs name), precise numeral size, unit-label placement (under vs beside number), and the specific AnimatePresence transition.
- Edge cases (not selected for discussion): empty/whitespace `?to=` → fallback; trim names; countdown freezes at all-zeros on/after the date (no "Today!" state).

## Deferred Ideas

- Full entrance choreography, Ken Burns, parallax, botanicals — Phase 4.
- Responsive polish + Vercel deploy — Phase 5.
- Countdown zero-state celebration — out of scope for v1.
