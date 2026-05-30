# Phase 3: Personalization & Countdown - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add two capabilities to the existing static save-the-date page (Phase 2):

1. **Guest personalization** — read the `?to=` URL param and show a "For [Guest Name]" greeting above the "Save the Date" label, with a graceful fallback and a personalized browser tab title.
2. **Live countdown** — a ticking days / hours / minutes / seconds countdown to May 30, 2027.

In scope: PERS-01..04, CNT-01, CNT-02.

NOT in scope (later phases): the orchestrated entrance animation sequence / staggerChildren choreography, Ken Burns, parallax (Phase 4); botanical SVG and corner brackets (Phase 4); responsive polish and deploy (Phase 5). The ONLY motion in this phase is the per-tick digit swap on the countdown (CNT-02) — see decisions.
</domain>

<decisions>
## Implementation Decisions

### Guest Greeting (PERS-01..04)
- **D-01 (locked by spec):** Read `?to=` via `useSearchParams` from `react-router` (v7 import — NOT `react-router-dom`). Encapsulate in a hook at `src/hooks/useGuestName.js` returning the resolved display name.
- **D-02 (locked by spec):** Fallback to "Our Beloved Guests" when `?to=` is absent. Also treat an empty/whitespace-only `?to=` value as absent → use the fallback.
- **D-03 (locked by spec):** When `?to=` is present (non-empty), set `document.title` to "Save the Date – For {name}". When absent, leave the default title ("Save the Date — Aaron & Rina" from index.html) — do not append the fallback name to the title.
- **D-04:** Greeting copy is the word "For" + the name (e.g., "For The Johnson Family"). URL-decoding is handled by `useSearchParams` (so `?to=Mike+%26+Sarah` → "Mike & Sarah"). Trim surrounding whitespace from the decoded name.
- **D-05 (visual):** Render the greeting as a single line in **italic Cormorant Garamond** (`var(--font-display)`), in a soft personal tone — color cream (`var(--cream)`) for "For" with the name in gold-light (`var(--gold-light)`), OR the whole line in gold-light; planner/executor may choose the exact split to read elegantly. It is a softer, handwritten-invitation feel — NOT an uppercase tracked kicker.
- **D-06 (placement):** The greeting sits at the TOP of the content block, ABOVE the "Save the Date" label (matches the spec's load-sequence order: greeting → label → names). It is part of the same bottom-anchored content block from Phase 2.
- **D-07:** The greeting is `GuestGreeting.jsx` — renders the "For" + name unit. It consumes `useGuestName`.

### Countdown (CNT-01, CNT-02)
- **D-08 (locked by spec):** Live countdown to **May 30, 2027**, showing days / hours / minutes / seconds in a row. Component `CountdownTimer.jsx`. Ticks every second.
- **D-09 (placement):** The countdown sits **below the location line and above the footer note** in the content block. Final content order becomes: greeting → "Save the Date" label → couple names → divider → date → location → **countdown** → footer note.
- **D-10 (style):** Understated treatment — **Jost numerals (`var(--font-body)`) in cream (`var(--cream)`)**, each with a small **uppercase, letter-spaced unit label** (DAYS / HRS / MIN / SEC) in muted (`var(--muted)`) below or beside the number. Four units laid out in a horizontal row. Quiet/"data" feel, not large serif hero numerals. Use existing type-scale tokens; keep numerals modest (roughly in the location/footer size range, distinctly smaller than the couple names and date).
- **D-11 (per-tick animation — CNT-02):** Each unit's number animates individually when its value changes, via Framer Motion `AnimatePresence` with the number as the React `key` (key swap → exit/enter). This is the ONLY Framer Motion usage in Phase 3. Keep the swap subtle (a short fade/slide), consistent with the elegant aesthetic — do NOT build the full entrance choreography here (that's Phase 4).
- **D-12 (edge case — Claude's Discretion):** When the target date is reached or passed (all values ≤ 0), freeze the display at all zeros (00 / 00 / 00 / 00) rather than showing negative numbers. No "Today!"/celebration state required for this phase.

### Claude's Discretion
- Exact greeting color split ("For" vs name), precise numeral font-size within the stated "modest" range, the exact unit-label placement (under vs beside the number), and the specific AnimatePresence transition (fade vs short vertical slide, duration) — choose what reads most elegant within the design system.
- Name sanitization beyond trimming (e.g., max length / overflow handling) is left to the planner; keep it simple — a very long name may wrap, which is acceptable.
- Whether the hook computes countdown internally or a separate hook/util handles the interval — implementation detail.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design + behavior contract
- `CLAUDE.md` — BINDING spec. Defines: guest personalization rules (`?to=`, fallback, `document.title`, `useGuestName` hook), `GuestGreeting.jsx` and `CountdownTimer.jsx` component contracts, the URL pattern, the design system (palette, fonts, color roles), and the global animation rules (easing `[0.22, 0.61, 0.36, 1]`, min durations). Note: its "React 18 / React Router v6 / react-router-dom" language is superseded — the installed stack is React 19 / React Router v7, so import from `react-router`.
- `.planning/phases/02-static-page/02-UI-SPEC.md` — The approved visual contract from Phase 2: type scale, color roles (gold-light reserved for couple names; gold for label + divider), spacing scale, and the bottom-anchored content-block layout the greeting and countdown plug into.

### Current implementation to extend
- `src/pages/SaveTheDatePage.jsx` — The page the greeting and countdown are added to (content block is here).
- `src/pages/SaveTheDatePage.module.css` — Existing CSS module with the content-block / type styles to extend.
- `src/index.css` — Design tokens: `--forest`, `--gold`, `--gold-light`, `--cream`, `--muted`, `--font-display`, `--font-body`.

### Requirements
- `.planning/REQUIREMENTS.md` §Personalization (PERS-01..04), §Countdown (CNT-01, CNT-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/SaveTheDatePage.jsx` + `.module.css` — the content block (label/names/divider/date/location/footer) is already built and bottom-anchored; the greeting and countdown slot into it.
- `src/index.css` design tokens and the loaded fonts (Cormorant Garamond incl. italic 300–700, Jost 300–600) are available — no new fonts/weights needed (italic Cormorant is already loaded for the greeting).
- BrowserRouter is already wired in `src/main.jsx` (`react-router` v7), so `useSearchParams` works out of the box.

### Established Patterns
- CSS Modules only; all colors/fonts via `var(--*)`; no inline design values; no UI libraries (per CLAUDE.md).
- `framer-motion` is installed and was intentionally unused in Phases 1–2; Phase 3 introduces its first, minimal use (the per-tick digit swap only).

### Integration Points
- New hook: `src/hooks/useGuestName.js` (create the `src/hooks/` dir).
- New components: `src/components/GuestGreeting.jsx` and `src/components/CountdownTimer.jsx` (or co-located — planner decides), each with its own CSS module.
- Both render inside `SaveTheDatePage.jsx`'s content block at the positions in D-06 and D-09.

</code_context>

<specifics>
## Specific Ideas

- Greeting feel: soft, personal, "handwritten invitation" — italic serif, not a corporate uppercase label.
- Countdown feel: understated and quiet, secondary to the names/date — it informs, it doesn't shout.
- URL examples to support (from CLAUDE.md): `/?to=The+Johnson+Family` → "For The Johnson Family"; `/?to=Mike+%26+Sarah` → "For Mike & Sarah".

</specifics>

<deferred>
## Deferred Ideas

- Full entrance animation choreography (greeting/label/names/divider/date/location/countdown/footer fading up in sequence via staggerChildren) — **Phase 4**. Phase 3 renders these in their resting state plus only the countdown per-tick swap.
- Ken Burns, parallax, botanical SVG, corner brackets — **Phase 4**.
- Responsive/mobile polish and Vercel deploy — **Phase 5**.
- "Today!"/celebration state when the countdown hits zero — not needed; out of scope for v1.

</deferred>

---

*Phase: 03-personalization-countdown*
*Context gathered: 2026-05-29*
