# Design Spec — Plumeria Petal-Fall Ambient Effect

**Date:** 2026-06-03
**Status:** Approved (brainstorm) — ready for implementation planning
**Topic:** Add a continuous, organic plumeria-petal drift over the save-the-date scene.

## Goal

On page load, warm-white plumeria petals drift gently down the viewport — each a slightly different size, fall speed, sway path, and rotation — to give the Oahu save-the-date an unmistakably island, alive feel. It is ambient decoration; it must never obscure text or block interaction, and it must honor `prefers-reduced-motion`.

## Locked Decisions (from brainstorm)

| Decision | Choice |
|----------|--------|
| Relationship to existing branches | **Add** the petal layer; keep the two `BotanicalSvg` branches as-is |
| Falling unit | **Single plumeria petals** (individual rounded paddle shapes, not whole flowers) |
| Color | **Cream/white + pale gold only** — no pink (stays on palette) |
| Timing | **Continuous gentle drift** (~15–25 on screen) |
| Render mechanism | **Raw `<canvas>` + `requestAnimationFrame`** (not tsParticles) |
| Layering | Canvas **above hero photo, behind text/brackets** (`pointer-events: none`) |
| Reduced motion | **No animation** — render ~6 faint static petals scattered |
| `CLAUDE.md` rule | **Narrow** "no UI libraries; custom design only" → forbid UI *component* libraries (shadcn/MUI) but allow lightweight animation/particle libs |

## Architecture

Two isolated units, each independently understandable and testable:

### 1. `src/lib/petalEngine.js` — pure simulation (no DOM)

The math and state, with zero canvas/React coupling so it can be unit-tested with `node:test` (matching `decodeGuestToken`/`fetchGuestDisplayName` convention).

- `createPetal(width, height, rng = Math.random)` → a petal object:
  `{ x, originX, y, scale, rot, rotSpeed, swayAmp, swayFreq, swayPhase, fallSpeed, colorIndex }`
  with randomized ranges (documented constants) so no two petals match.
- `stepPetal(petal, t, width, height)` → advances one petal in place:
  - `petal.y += petal.fallSpeed`
  - `petal.x = petal.originX + Math.sin(t * petal.swayFreq + petal.swayPhase) * petal.swayAmp`
  - `petal.rot += petal.rotSpeed`
  - **recycle:** when `petal.y - margin > height`, reset it above the top (`y = -margin`) with fresh randoms (new `originX`, speeds, scale, color) so the field never visibly repeats.
- `createField(count, width, height, rng)` → array of petals seeded at random `y` across the viewport (so load doesn't start empty/from-the-top-only).
- `COLORS = ['#f2ead9', '#eae0cb', '#d4b57a']` weighted toward the first two (cream-white), occasional pale gold. Exported for the renderer.

Pure, deterministic given an injected `rng` → unit-testable: recycling resets y above top, sway stays within `originX ± swayAmp`, field count is stable across steps (pooled, no growth).

### 2. `src/components/PetalFall.jsx` (+ `PetalFall.module.css`) — canvas + lifecycle

Owns the DOM/canvas, the render loop, and all browser concerns.

- Fixed full-viewport `<canvas>`, `pointer-events: none`, `aria-hidden="true"`; CSS positioning + `z-index` live in the module (no inline design values, per `CLAUDE.md`).
- **DPR scaling:** size the backing store to `cssW * dpr × cssH * dpr`, set CSS size to `cssW × cssH`, `ctx.scale(dpr, dpr)`. Re-run on resize (debounced) and on DPR change.
- **Petal shape:** one `Path2D` of the rounded plumeria paddle (the approved silhouette), drawn per petal via `ctx.translate(x,y) → rotate(rot) → scale(scaleX, scale)` where `scaleX = Math.cos(rot)` fakes the petal tumbling/flipping over. Fill = `COLORS[colorIndex]`, modest `globalAlpha` so it reads soft.
- **Loop:** single `requestAnimationFrame` driver; on each frame clear + `stepPetal` all + draw. Cancel via `cancelAnimationFrame` in the `useEffect` cleanup (React 19 effect teardown).
- **Pause when hidden:** `visibilitychange` listener stops the loop when `document.hidden`, resumes on return (saves battery; avoids a huge `t` jump — clamp/advance `t` by real elapsed time via `performance.now()` deltas).
- **Density by viewport:** `count = width < 600 ? ~10 : ~18`.
- **Fade-in:** canvas opacity 0 → 1 over ~1.5s on mount (CSS transition) so petals don't pop in.

### 3. Reduced-motion path

- Detect with `window.matchMedia('(prefers-reduced-motion: reduce)')`; subscribe to its `change` event so toggling the OS setting live starts/stops the effect.
- When reduced: **do not start the rAF loop, and skip the fade-in** (the fade is itself motion). Draw ~6 petals once, at low alpha, scattered at fixed positions, canvas at final opacity immediately. Static, no motion — consistent with the project's existing "snap to end state" reduced-motion rule.

### 4. Integration

- Mount `<PetalFall />` as a sibling layer inside `SaveTheDatePage`, ordered so its canvas sits above the hero/background-and-scrim but behind the content block + corner brackets (z-index in the page/module).
- No change to the existing Framer entrance sequence, branches, or any other component. The petal layer is independent and self-contained.

## Out of Scope (YAGNI)

- Pink/blush petals (palette decision: cream/gold/white only).
- Whole-flower sprites, hibiscus, or multiple flower types.
- tsParticles or any particle dependency.
- Petals reacting to pointer/scroll/wind, or settling/piling at the bottom.
- Restyling the existing `BotanicalSvg` branches (explicitly kept as-is).

## Testing

- **`petalEngine`** via `node:test` (no DOM needed): seeded `rng` →
  - `createField(n,…)` returns exactly `n` petals, all within bounds.
  - `stepPetal` advances `y` by `fallSpeed`; keeps `x` within `originX ± swayAmp`.
  - a petal past the bottom recycles to above the top with a valid new state; field length never grows (pooling).
  - `colorIndex` always indexes a valid `COLORS` entry.
- **`PetalFall`** (canvas/rAF/lifecycle) is verified manually in the running app (jsdom doesn't render canvas): petals drift organically, never cross in front of text, no interaction blocking, reduced-motion shows static petals only, no console errors, smooth on mobile.
- `npm run build` + `eslint` clean.

## Risks / Notes

- **Perf:** ~18 sprites with no per-frame allocations (pooled) is trivial for canvas; main watch-items are DPR re-scaling on resize (debounce) and not leaking rAF/listeners (cleanup covers it).
- **Legibility:** keeping the canvas behind the text layer guarantees the names stay crisp; alpha is tuned conservatively. If we later want petals *in front*, only the z-index + alpha change.
- **`CLAUDE.md` amendment** is part of this work (narrow the no-libraries rule), per user instruction.

## References (research)

- [MDN — Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [CSS-Tricks — requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/)
- [Josh Comeau — Accessible animations with prefers-reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
