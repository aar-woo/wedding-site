# Plumeria Petal-Fall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a continuous, organic drift of warm-white plumeria petals over the save-the-date scene using a raw `<canvas>`, honoring `prefers-reduced-motion` and never obscuring text.

**Architecture:** A pure simulation module (`src/lib/petalEngine.js`, unit-tested with `node:test`) holds all petal math and recycling; a thin React component (`src/components/PetalFall.jsx`) owns the canvas, the `requestAnimationFrame` loop, DPR scaling, visibility pausing, and the reduced-motion static fallback. The component mounts as one layer inside `SaveTheDatePage`, between the scrim (z-index 1) and the content/brackets (z-index 2).

**Tech Stack:** React 19, Vite, raw Canvas 2D + `requestAnimationFrame`, CSS Modules, `node:test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-03-petal-fall-design.md`

---

## File Structure

- **Create** `src/lib/petalEngine.js` — pure: `COLORS`, `createPetal`, `createField`, `stepPetal`. No DOM.
- **Create** `src/lib/petalEngine.test.js` — `node:test` coverage of the engine.
- **Create** `src/components/PetalFall.jsx` — canvas + rAF loop + lifecycle + reduced-motion.
- **Create** `src/components/PetalFall.module.css` — fixed full-viewport canvas styling.
- **Modify** `src/pages/SaveTheDatePage.jsx` — import and mount `<PetalFall />` after the scrim.
- **Modify** `CLAUDE.md:10`, `CLAUDE.md:87`, `CLAUDE.md:111` — narrow the no-libraries rule.

Tests run with `node --test <file>` (no `test` script in package.json; matches `decodeGuestToken.test.js` / `fetchGuestDisplayName.test.js`).

---

## Task 1: Petal simulation engine (pure, TDD)

**Files:**
- Create: `src/lib/petalEngine.js`
- Test: `src/lib/petalEngine.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/petalEngine.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createField, createPetal, stepPetal, COLORS } from './petalEngine.js';

test('createField returns exactly count petals, all within horizontal bounds and valid color', () => {
  const W = 400, H = 800;
  const petals = createField(18, W, H, Math.random);
  assert.equal(petals.length, 18, 'field has exactly count petals');
  for (const p of petals) {
    assert.ok(p.originX >= 0 && p.originX <= W, 'originX within [0,W]');
    assert.ok(Number.isInteger(p.colorIndex) && p.colorIndex >= 0 && p.colorIndex < COLORS.length, 'valid colorIndex');
    assert.ok(p.y <= H, 'seeded y is within or above the viewport');
  }
});

test('stepPetal advances y by fallSpeed*dt and keeps x within originX +/- swayAmp', () => {
  const p = createPetal(400, 800, Math.random);
  p.originX = 200; p.swayAmp = 20; p.swayFreq = 0.001; p.swayPhase = 0;
  p.fallSpeed = 0.02; p.y = 100;
  const y0 = p.y;
  stepPetal(p, 1000, 16, 400, 800, Math.random);
  assert.ok(Math.abs(p.y - (y0 + 0.02 * 16)) < 1e-9, 'y advanced by fallSpeed*dt');
  assert.ok(p.x >= 200 - 20 - 1e-9 && p.x <= 200 + 20 + 1e-9, 'x stays within sway band');
});

test('a petal past the bottom recycles to above the top with fresh valid state', () => {
  const W = 400, H = 800;
  const p = createPetal(W, H, Math.random);
  p.y = H + 100; // past the bottom
  stepPetal(p, 0, 16, W, H, Math.random);
  assert.ok(p.y < 0, 'recycled above the top');
  assert.ok(p.originX >= 0 && p.originX <= W, 'fresh originX in bounds');
  assert.ok(p.colorIndex >= 0 && p.colorIndex < COLORS.length, 'fresh colorIndex valid');
});

test('field length never grows across many steps (object pooling)', () => {
  const W = 400, H = 800;
  const petals = createField(12, W, H, Math.random);
  for (let f = 0; f < 1000; f++) {
    for (const p of petals) stepPetal(p, f * 16, 16, W, H, Math.random);
  }
  assert.equal(petals.length, 12, 'no petals added or removed');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/lib/petalEngine.test.js`
Expected: FAIL — `Cannot find module './petalEngine.js'` (or import error).

- [ ] **Step 3: Write the engine**

Create `src/lib/petalEngine.js`:

```js
// Pure simulation for the plumeria petal-fall effect. No DOM, no canvas.
// Inject `rng` for deterministic tests; defaults to Math.random.

// Weighted color pool: cream-whites common, pale gold occasional.
export const COLORS = ['#f2ead9', '#eae0cb', '#d4b57a'];
const COLOR_WEIGHTS = [0.5, 0.38, 0.12];

const MARGIN = 24; // px of spawn/recycle slack above and below the viewport

function rand(rng, min, max) {
  return min + rng() * (max - min);
}

function pickColorIndex(rng) {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
    acc += COLOR_WEIGHTS[i];
    if (r < acc) return i;
  }
  return COLORS.length - 1;
}

// Reset a petal's randomized properties for a fresh fall (mutates in place).
// Caller sets `y` afterward (seed vs recycle differ). Units: px and ms.
function randomize(petal, width, rng) {
  petal.originX = rand(rng, 0, width);
  petal.x = petal.originX;
  petal.scale = rand(rng, 0.5, 1.1);
  petal.rot = rand(rng, 0, Math.PI * 2);
  petal.rotSpeed = rand(rng, -0.0006, 0.0006); // rad per ms
  petal.swayAmp = rand(rng, 8, 26); // px
  petal.swayFreq = rand(rng, 0.0008, 0.0018); // rad per ms
  petal.swayPhase = rand(rng, 0, Math.PI * 2);
  petal.fallSpeed = rand(rng, 0.015, 0.05); // px per ms (~15-50 px/s)
  petal.colorIndex = pickColorIndex(rng);
  return petal;
}

export function createPetal(width, height, rng = Math.random) {
  const petal = {};
  randomize(petal, width, rng);
  petal.y = -MARGIN; // default: spawn just above the top
  return petal;
}

export function createField(count, width, height, rng = Math.random) {
  const petals = [];
  for (let i = 0; i < count; i++) {
    const petal = createPetal(width, height, rng);
    // Seed across the full height so the first paint isn't empty.
    petal.y = rand(rng, -MARGIN, height);
    petals.push(petal);
  }
  return petals;
}

// Advance one petal in place. `t` = total elapsed ms (drives sway),
// `dt` = ms since last frame (drives fall + spin, frame-rate independent).
export function stepPetal(petal, t, dt, width, height, rng = Math.random) {
  petal.y += petal.fallSpeed * dt;
  petal.x = petal.originX + Math.sin(t * petal.swayFreq + petal.swayPhase) * petal.swayAmp;
  petal.rot += petal.rotSpeed * dt;
  if (petal.y - MARGIN > height) {
    randomize(petal, width, rng);
    petal.y = -MARGIN;
  }
  return petal;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/lib/petalEngine.test.js`
Expected: PASS — 4 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/petalEngine.js src/lib/petalEngine.test.js
git commit -m "feat(petal-fall): pure petal simulation engine with node:test coverage"
```

---

## Task 2: PetalFall canvas component

**Files:**
- Create: `src/components/PetalFall.jsx`
- Create: `src/components/PetalFall.module.css`

(No unit test — canvas/rAF/lifecycle is verified in the running app. jsdom does not render canvas.)

- [ ] **Step 1: Write the CSS module**

Create `src/components/PetalFall.module.css`:

```css
/* Full-viewport petal layer. Sits above the hero image + scrim (z 0/1) and
   below the content block + corner brackets (z 2). Never intercepts input. */
.canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 1.5s ease;
}
```

- [ ] **Step 2: Write the component**

Create `src/components/PetalFall.jsx`:

```jsx
import { useEffect, useRef } from "react";
import styles from "./PetalFall.module.css";
import { createField, stepPetal, COLORS } from "../lib/petalEngine.js";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

// Plumeria petal silhouette as a reusable Path2D, centered on the origin,
// ~14px tall — a rounded paddle pointing up.
function makePetalPath() {
  const p = new Path2D();
  p.moveTo(0, 5);
  p.bezierCurveTo(-4.5, 1, -5.5, -6, -1, -9);
  p.bezierCurveTo(0, -9.6, 0, -9.6, 1, -9);
  p.bezierCurveTo(5.5, -6, 4.5, 1, 0, 5);
  p.closePath();
  return p;
}

export default function PetalFall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const path = makePetalPath();
    const mql = window.matchMedia(REDUCED_QUERY);

    let width = 0;
    let height = 0;
    let petals = [];
    let rafId = null;
    let last = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // cos(rot) flips the petal as it spins — fakes a 3D tumble/turn-over.
      ctx.scale(Math.cos(p.rot) * p.scale, p.scale);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = COLORS[p.colorIndex];
      ctx.fill(path);
      ctx.restore();
    }

    function frame(now) {
      const dt = Math.min(now - last, 50); // clamp big gaps (e.g. tab return)
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        stepPetal(p, now, dt, width, height);
        drawPetal(p);
      }
      rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
      const count = width < 600 ? 10 : 18;
      petals = createField(count, width, height);
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function renderStatic() {
      ctx.clearRect(0, 0, width, height);
      const six = createField(6, width, height);
      for (const p of six) {
        p.rot = p.swayPhase;
        drawPetal(p);
      }
    }

    // (Re)apply the current motion preference. Called on mount and whenever
    // the OS "reduce motion" setting toggles.
    function apply() {
      stopLoop();
      resize();
      if (mql.matches) {
        canvas.style.transition = "none"; // no fade — fade is itself motion
        canvas.style.opacity = "1";
        renderStatic();
      } else {
        canvas.style.transition = ""; // restore CSS fade
        startLoop();
        // Trigger the 0->1 opacity transition after first paint.
        requestAnimationFrame(() => {
          canvas.style.opacity = "1";
        });
      }
    }

    function onVisibility() {
      if (mql.matches) return; // static mode: nothing to pause
      if (document.hidden) {
        stopLoop();
      } else if (rafId === null) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    function onResize() {
      resize();
      if (mql.matches) renderStatic();
      // Running loop reads the new width/height on its next frame.
    }

    apply();
    mql.addEventListener("change", apply);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      stopLoop();
      mql.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
```

- [ ] **Step 3: Verify lint + build pass (component compiles, no integration yet)**

Run: `npx eslint src/components/PetalFall.jsx src/lib/petalEngine.js && npm run build`
Expected: eslint clean (no errors); `vite build` completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PetalFall.jsx src/components/PetalFall.module.css
git commit -m "feat(petal-fall): canvas component with rAF loop, DPR scaling, reduced-motion fallback"
```

---

## Task 3: Integrate into the page + narrow the CLAUDE.md rule

**Files:**
- Modify: `src/pages/SaveTheDatePage.jsx`
- Modify: `CLAUDE.md` (lines 10, 87, 111)

- [ ] **Step 1: Import and mount `<PetalFall />` after the scrim**

In `src/pages/SaveTheDatePage.jsx`, add the import alongside the other component imports (after the `CornerBrackets` import on line 6):

```jsx
import CornerBrackets from "../components/CornerBrackets.jsx";
import PetalFall from "../components/PetalFall.jsx";
```

Then mount it immediately after the scrim `<div>` (currently line 87), so it layers above the hero/scrim and below the decorations + content:

```jsx
        <div className={styles.scrim} />
        <PetalFall />
```

- [ ] **Step 2: Narrow the no-libraries rule in CLAUDE.md**

Replace line 10:

```md
- No UI libraries — custom design only
```

with:

```md
- No UI component libraries (shadcn, MUI, etc.) — custom design only. Lightweight animation/particle libraries are allowed where they earn their weight.
```

Replace line 87:

```md
- Do not use any component libraries (shadcn, MUI, etc.)
```

with:

```md
- Do not use UI component libraries (shadcn, MUI, etc.) — but lightweight animation/particle libraries are permitted when they earn their weight
```

Replace line 111 (within the `**Tech stack**` constraint line) so the tail reads:

```md
- **Tech stack**: React 18 + Vite + Framer Motion + React Router v6 + CSS Modules — no UI component libraries (lightweight animation/particle libs allowed), custom design only.
```

- [ ] **Step 3: Verify lint + build pass with the integration**

Run: `npx eslint src && npm run build`
Expected: eslint clean; `vite build` completes with no errors.

- [ ] **Step 4: Manual verification in the running app**

Run: `npm run dev`, open the printed localhost URL, and confirm:
1. Warm-white (with occasional pale-gold) petals drift down continuously, each with a different size/speed/sway/rotation — not uniform "rain".
2. Petals pass **behind** the couple names / date / countdown — text stays fully legible; clicking/selecting text is never blocked.
3. The two existing gold botanical branches are unchanged and still present.
4. The canvas fades in (~1.5s) rather than popping.
5. Enable OS "Reduce motion" and reload: a few static petals render, nothing moves, no fade.
6. Switch to a phone-width viewport (DevTools responsive): fewer petals (~10), still smooth.
7. Background a tab and return: animation pauses while hidden and resumes without a jump.
8. No console errors or warnings.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SaveTheDatePage.jsx CLAUDE.md
git commit -m "feat(petal-fall): mount petal layer in SaveTheDatePage; permit lightweight animation libs in CLAUDE.md"
```

---

## Self-Review

**Spec coverage:**
- Add petals / keep branches → Task 3 Step 1 (mount alongside, branches untouched). ✓
- Single plumeria petals → `makePetalPath` paddle shape, Task 2. ✓
- Cream/white + pale gold → `COLORS` weighted pool, Task 1. ✓
- Continuous drift, ~15-25 → `startLoop` count 10/18, recycling, Task 1/2. ✓
- Raw canvas + rAF → Task 2. ✓
- Layering above hero, behind text, pointer-events none → CSS `z-index: 1`, Task 2. ✓
- DPR scaling, visibility pause, cleanup → Task 2 (`resize`/`onVisibility`/cleanup). ✓
- Reduced motion: static ~6, no fade → `apply`/`renderStatic`, Task 2. ✓
- Fade-in ~1.5s → CSS transition + opacity flip, Task 2. ✓
- CLAUDE.md amendment → Task 3 Step 2. ✓
- petalEngine unit tests → Task 1. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `createField(count, width, height, rng)`, `createPetal(width, height, rng)`, `stepPetal(petal, t, dt, width, height, rng)`, `COLORS` — used identically in the engine, tests, and component. Petal fields (`x, originX, y, scale, rot, rotSpeed, swayAmp, swayFreq, swayPhase, fallSpeed, colorIndex`) are written by `randomize` and read by `drawPetal`/`stepPetal` consistently. ✓
