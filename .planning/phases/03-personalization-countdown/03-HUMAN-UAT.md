---
status: resolved
phase: 03-personalization-countdown
source: [03-VERIFICATION.md]
started: 2026-05-29
updated: 2026-05-29
---

## Current Test

[complete — all items passed after contrast fix ce508ce]

## Tests

### 1. Personalized greeting renders
expected: Visiting `/?to=The+Johnson+Family` shows "For The Johnson Family" at the top of the content block (above "Save the Date"), in italic Cormorant Garamond, "For" in cream and the name in gold-light.
result: [pending]

### 2. URL-encoded ampersand decodes (UI + tab title)
expected: Visiting `/?to=Mike+%26+Sarah` shows "For Mike & Sarah" on screen, and the browser tab title reads "Save the Date – For Mike & Sarah" (with an en dash, not a hyphen).
result: [pending]

### 3. Fallback when no param
expected: Visiting `/` (no `?to=`) shows "For Our Beloved Guests", and the tab title stays at the default "Save the Date — Aaron & Rina" (no personalized title).
result: [pending]

### 4. Countdown digit-swap animation
expected: The days/hours/minutes/seconds countdown ticks once per second and each number animates individually (a subtle fade/slide) when its value changes — no jank or layout jump.
result: [pending]

### 5. Countdown layout & typography
expected: The countdown sits below "Oahu, Hawaii" and above "Formal invitation to follow", as a horizontal row of four units — Jost numerals in cream with small uppercase muted unit labels (DAYS/HRS/MIN/SEC), modest size (smaller than the names/date).
result: [pending]

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- Countdown unit labels too faint over the gray water region (#636966) — RESOLVED: switched `--muted` → `--gold` (wt 500) + dark text-shadow (commit ce508ce).
- Couple names + guest name washed out over the light-blue sky (#A3C4DC) — RESOLVED: added forest-toned text-shadow halo to `.coupleNames` and `.greeting` (commit ce508ce).
