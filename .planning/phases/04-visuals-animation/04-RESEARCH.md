# Phase 4: Visuals & Animation — Research

**Researched:** 2026-05-30
**Domain:** Framer Motion orchestration, SVG pathLength draw-in, Ken Burns CSS/motion loop, prefers-reduced-motion
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Botanical style is an olive branch — slender pointed leaves alternating along the stem, terminal dots as olives. Stroke-only, `var(--gold)`, no fills except terminal dots.
- **D-02:** Rendered as a mirrored pair flanking "Rina & Aaron" — one left, one right using `flipped` prop (single `BotanicalSvg` component instantiated twice).
- **D-03:** Orientation is vertical — stem runs top-to-bottom alongside the name, leaves arc inward toward the text. Modest compact horizontal footprint so branches sit beside names without overlapping glyphs.
- **D-04:** Branches draw in at step 3 (botanical), before couple names fade up at step 5. Gold strokes appear first, then "Rina & Aaron" lands into the frame they create. Planner may tune stagger overlap so branches + names feel connected; fixed order must hold.
- **D-05:** Corner bracket draw-in at step 2 (after background, before botanical). Default all four viewport corners. Size, inset, and line weight are Claude's discretion; must match olive-branch line weight so brackets + botanicals read as one decorative system.
- **D-06 (locked by spec):** Ken Burns zoom — `scale: 1 → 1.08` over a 20s loop, alternating. Applied to the existing hero `<img>` layer. This is the hero's ONLY motion.
- **D-07 (locked by spec):** Use Framer Motion `variants` + `staggerChildren` — no hardcoded per-element delays. Reveal order is fixed: background → corner brackets → botanical → guest greeting → label → names → divider → date → location → footer. Easing `[0.22, 0.61, 0.36, 1]` everywhere; each element animates over at least 0.8s.
- **D-08 (locked by spec):** Couple names animate with slight scale (0.96 → 1); divider scales from center (scaleX). Existing resting-state elements from Phases 2–3 become staggered children.
- **D-09 (user decision):** Parallax DROPPED from v1 entirely. `ParallaxImage.jsx` is NOT built. HERO-03 is Out of Scope. Page stays single-screen 100svh, non-scrolling. `useScroll` / `useTransform` / `ParallaxImage` must NOT be researched or built.

### Claude's Discretion
- Corner-bracket specifics: which corners (default all four), size, inset, stroke weight.
- Entrance pacing: total sequence duration, exact stagger interval, run-once-on-load behavior, and whether to honor `prefers-reduced-motion`.
- Olive-branch SVG path geometry: number of leaf pairs, stem curve, count/placement of terminal olive dots, overall compact scale.

### Deferred Ideas (OUT OF SCOPE)
- Parallax / scroll-driven hero offset (HERO-03) — dropped from v1 (D-09). Not deferred to later; intentionally out of scope.
- Responsive/mobile polish — Phase 5. Flanking branches crowding narrow screens is a Phase 5 concern.
- Performance tuning + Vercel deploy — Phase 5.
- "Today!" celebration state at countdown zero — out of scope for v1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DECO-01 | Corner bracket decorations draw in via animated `pathLength` | SVG pathLength 0→1 pattern with staggered `motion.path` children; positioned absolute at viewport corners |
| DECO-02 | Stroke-only `BotanicalSvg` component draws in via `pathLength`, staggered branches, `flipped` prop | Same pathLength draw-on pattern; `motion.svg` parent with `staggerChildren`; `flipped` via `scaleX(-1)` CSS transform |
| DECO-03 | Botanical strokes use `var(--gold)`, no fills except terminal dots | CSS Modules stroke color; SVG path `fill="none"` for branches, filled circle/ellipse for olive dots |
| HERO-02 | Hero performs Ken Burns zoom (scale 1 → 1.08, 20s, alternating) | CSS `@keyframes` approach preferred for ambient loop; coexistence with entrance variants documented |
| ANIM-01 | Entrance sequence uses Framer Motion `variants` + `staggerChildren`, no hardcoded delays | Two-container stagger architecture with `delayChildren` bridging gap; `staggerChildren` confirmed in FM 12.40.0 |
| ANIM-02 | Elements reveal in spec order: background → brackets → botanical → greeting → label → names → divider → date → location → footer | `when: "beforeChildren"` + `delayChildren` to offset content block start; bracket/botanical sequenced via first container |
| ANIM-03 | Easing `[0.22, 0.61, 0.36, 1]`, each element ≥0.8s | Use `ease` array in each child `transition`; stagger interval ≥0 (accumulated offset from parent `staggerChildren`) |
| ANIM-04 | Couple names: scale 0.96→1; divider: scaleX from center | `scale: [0.96, 1]` + `opacity: [0, 1]` in names variant; `scaleX: [0, 1]` + `transformOrigin: "center"` in divider variant |
</phase_requirements>

---

## Summary

Phase 4 brings a fully static page to life through Framer Motion orchestration. The core challenge is a **two-container stagger architecture**: the viewport-level elements (corner brackets at step 2, botanical at step 3) and the content-block children (greeting through footer, steps 4–10) live in separate DOM containers. Bridging these two containers in one coherent sequence requires `delayChildren` on the content-block container to offset when its stagger begins, so the bracket/botanical draw-in finishes before the content cascade starts.

The SVG pathLength draw-on is well-supported in framer-motion 12.40.0 via `motion.path` with `initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}` and variant-based staggering. The `strokeDasharray="0 1"` SSR-safety attribute must be set on every `motion.path` to prevent a flash of fully-drawn strokes before React hydrates.

Ken Burns is best implemented as a **CSS `@keyframes` loop** rather than a framer-motion `animate` loop. CSS keyframes run entirely on the compositor thread with zero JS involvement, coexist cleanly alongside the JS-driven entrance variants on adjacent/wrapper elements, and do not conflict with framer-motion's transform handling.

**Primary recommendation:** Two-level stagger (page-level container for brackets + botanical; content-block container for text elements), CSS keyframes for Ken Burns, `motion.svg` + `staggerChildren` for botanical and bracket draw-in, `MotionConfig` with `reducedMotion="user"` for accessibility.

---

## Stack Verification (Actual Installed Versions)

**CRITICAL — Stack Drift Resolved.** CONTEXT.md and CLAUDE.md disagree. The ground truth is `package.json` and the actual imports:

| Source | Claims | Actual |
|--------|--------|--------|
| CLAUDE.md | React 18, React Router v6, `react-router-dom` | WRONG |
| CONTEXT.md | React 19 / React Router v7 / import from `react-router` | CORRECT |
| `package.json` | react `^19.2.6`, react-router-dom `^7.16.0` | Installed |
| `src/main.jsx` | `import { BrowserRouter } from 'react-router'` | Confirmed |
| `src/hooks/useGuestName.js` | `import { useSearchParams } from 'react-router'` | Confirmed |

**All new Phase 4 code must import from `'react-router'` (not `'react-router-dom'`) and from `'framer-motion'` (the installed package — NOT from the new `'motion/react'` alias, as the project uses framer-motion directly).**

| Package | Installed Version | Notes |
|---------|------------------|-------|
| `framer-motion` | **12.40.0** | `motion`, `AnimatePresence`, `useReducedMotion`, `MotionConfig`, `stagger` all confirmed exported |
| `react` | **19.2.6** | |
| `react-dom` | **19.2.6** | |
| `react-router-dom` | **7.16.0** | Re-exports from `react-router`; import from `'react-router'` as established in project |
| `vite` | **8.0.12** | |

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `framer-motion` | 12.40.0 | Entrance variants, staggerChildren, pathLength SVG, AnimatePresence | Already installed, already used for CountdownTimer |
| CSS Modules | — | Ken Burns @keyframes, SVG color via var(--gold), layout | Project convention (CLAUDE.md) |

**No new npm packages are needed for Phase 4.**

### Key APIs Available (confirmed via node require)

| Export | Available | Use in Phase 4 |
|--------|-----------|---------------|
| `motion` | YES | `motion.div`, `motion.path`, `motion.svg` |
| `AnimatePresence` | YES | Already used in CountdownTimer — no change |
| `useReducedMotion` | YES | Optional accessibility handling |
| `MotionConfig` | YES | Optional: wrap App with `reducedMotion="user"` |
| `stagger` | YES | Alternative to numeric `staggerChildren` |
| `useAnimation` | YES | Available but not needed — variants pattern is sufficient |

---

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── BotanicalSvg.jsx          # NEW — olive branch SVG, flipped prop
│   ├── BotanicalSvg.module.css   # NEW — stroke color, sizing
│   ├── CornerBrackets.jsx        # NEW — four corner SVG brackets
│   ├── CornerBrackets.module.css # NEW — position, sizing
│   ├── CountdownTimer.jsx        # EXISTING — unchanged internally; wrap in motion.div in page
│   ├── CountdownTimer.module.css # EXISTING — unchanged
│   ├── GuestGreeting.jsx         # EXISTING — unchanged internally; becomes motion.div stagger child
│   └── GuestGreeting.module.css  # EXISTING — unchanged
└── pages/
    ├── SaveTheDatePage.jsx        # MODIFIED — add all entrance variants + Ken Burns
    └── SaveTheDatePage.module.css # MODIFIED — add @keyframes kenBurns, kenBurnsImage class
```

### Pattern 1: Two-Container Stagger Architecture

The 10-step sequence spans two DOM containers. Steps 1–3 (hero/brackets/botanical) are at the `heroFrame` level; steps 4–10 (greeting through footer) are inside `contentBlock`. The sequence is bridged by calculating `delayChildren` on the contentBlock container to equal the time the first container's stagger finishes.

**Architecture diagram:**

```
<motion.div className={heroFrame} variants={pageVariants} initial="hidden" animate="visible">
  │   transition: { staggerChildren: STAGGER_INTERVAL }
  │
  ├── <CornerBrackets />         ← step 2 (gets stagger index 0 delay)
  ├── <BotanicalSvg />           ← step 3 (gets stagger index 1 delay)  [left]
  ├── <BotanicalSvg flipped />   ← step 3 (gets stagger index 1 delay)  [right, same visual step]
  │
  └── <motion.div className={contentBlock} variants={contentContainerVariants}>
          │   transition: { staggerChildren: STAGGER_INTERVAL, delayChildren: OFFSET }
          │   OFFSET = enough to let brackets + botanical finish before content starts
          │
          ├── <GuestGreeting />     ← step 4 (greeting becomes motion.div child)
          ├── <p label />           ← step 5
          ├── <h1 coupleNames />    ← step 6 (scale 0.96→1 variant)
          ├── <div divider />       ← step 7 (scaleX variant)
          ├── <p date />            ← step 8
          ├── <p location />        ← step 9
          ├── <CountdownTimer />    ← step 10a (folded in as resting child)
          └── <p footer />          ← step 10b
```

**Why the Ken Burns hero image is NOT in the stagger:** The hero `<img>` is inside `.heroContainer` which is a separate layer sibling to the content. Ken Burns is a CSS animation that starts on mount — it runs independently and does not participate in the variant stagger. The `heroFrame` or `page` wrapper can still use `motion.div` for other reasons, but the hero image's CSS animation is self-contained.

**Key insight on `delayChildren`:** With `staggerChildren: 0.15` and two pre-content items (brackets at index 0, botanical at index 1 — counting as a pair at the same delay slot since both botanicals should draw together), the content block needs `delayChildren` offset of approximately `(bracket_duration + stagger_interval * 1)` seconds so content starts after brackets and botanical are well into their reveal. A practical value is `delayChildren: 1.2` for the content block container, giving breathing room for the 0.8s bracket + 0.8s botanical to land before the greeting appears.

**Example:**
```jsx
// Source: motion.dev/docs/react-animation (stagger orchestration)
// confirmed: staggerChildren present in framer-motion 12.40.0

const EASE = [0.22, 0.61, 0.36, 1];
const STAGGER = 0.15; // interval between sequential steps
const ITEM_DURATION = 0.9; // ≥0.8s per spec

const pageVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER,
    },
  },
};

// Decorative items (brackets, botanical) share this variant
const decorVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  // pathLength handled inside the SVG components themselves
};

// Content block wrapper — delays its stagger start until decoratives are in
const contentContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER,
      delayChildren: 1.4, // tune so brackets+botanical finish before greeting starts
    },
  },
};

// Standard fadeUp child
const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: ITEM_DURATION, ease: EASE },
  },
};

// Couple names — fadeUp + slight scale
const coupleNamesVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: ITEM_DURATION, ease: EASE },
  },
};

// Divider — scaleX from center
const dividerVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: ITEM_DURATION, ease: EASE },
  },
};
// The divider element needs: style={{ transformOrigin: 'center' }}
// or transformOrigin via CSS — cannot use a CSS Module value directly in Framer
// Use: <motion.div ... style={{ transformOrigin: 'center' }} variants={dividerVariants} />
```

### Pattern 2: SVG pathLength Draw-In with Stagger

**For both `BotanicalSvg` and `CornerBrackets`.**

The `motion.svg` parent controls the stagger; `motion.path` children carry the pathLength animation. Variant names must match between parent and children for propagation.

```jsx
// Source: motion.dev/docs/react-svg-animation (verified 2026-05-30)
// SSR caveat: strokeDasharray="0 1" prevents flash-of-drawn-stroke on initial load

const svgVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12, // stagger each branch/stroke
      delayChildren: 0,
    },
  },
};

const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.0, ease: EASE },
  },
};

// Usage in BotanicalSvg.jsx:
function BotanicalSvg({ flipped = false, opacity = 1 }) {
  return (
    <motion.svg
      viewBox="0 0 40 120"
      variants={svgVariants}
      // Note: initial/animate NOT set here — propagated from parent page container
      style={{
        transform: flipped ? 'scaleX(-1)' : undefined,
        opacity,
      }}
    >
      {/* stem */}
      <motion.path
        d="M20 110 Q18 80 20 50 Q22 20 20 10"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="0 1"   // SSR safety
        variants={pathVariants}
      />
      {/* leaf pair 1 */}
      <motion.path
        d="M20 90 Q12 82 10 74 Q16 78 20 82"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="0 1"
        variants={pathVariants}
      />
      {/* ... more leaves, terminal dots as <motion.circle> with same variant ... */}
    </motion.svg>
  );
}
```

**Critical: Do NOT set `initial` / `animate` on `motion.svg` or `motion.path` when they are children in the page-level stagger.** The parent `motion.div` with `initial="hidden" animate="visible"` propagates the variant state down. Setting `initial`/`animate` redundantly on the SVG wrapper breaks the propagation chain.

**`flipped` prop implementation:** Use `style={{ transform: 'scaleX(-1)' }}` on the `motion.svg` (or a wrapper `<div>`). Do NOT use CSS Module transforms that conflict with Framer's transform pipeline on the same element. Since `BotanicalSvg` is a child of the page stagger, its `motion.svg` should not carry Framer transforms for the flip — use a plain wrapper div with CSS Module class `flipped`.

### Pattern 3: Ken Burns via CSS @keyframes

**Use CSS keyframes, not a framer-motion `animate` loop.**

Rationale: CSS `@keyframes` run on the compositor thread with zero JavaScript involvement. A framer-motion `repeat: Infinity` on `scale` works but adds unnecessary JS overhead for a simple 20s ambient loop and can interfere with transform compositing on the same element if framer-motion is also managing other transform properties. CSS keyframes on the `heroImage` class are cleanly isolated.

```css
/* SaveTheDatePage.module.css */
@keyframes kenBurns {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.heroImage {
  /* existing styles */
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  /* Ken Burns: */
  animation: kenBurns 20s ease-in-out infinite;
  will-change: transform;
}
```

The `heroContainer` has `overflow: hidden` which prevents the scale from bleeding outside bounds. This is already set in `SaveTheDatePage.module.css` (line 24).

**Coexistence with entrance variants:** The hero `<img>` is inside `.heroContainer` which is NOT a `motion.*` element. The entrance stagger wires up `.heroFrame`, `.contentBlock`, etc. The CSS animation on `.heroImage` is fully independent. No conflicts.

**framer-motion `animate` loop alternative** (if CSS is not preferred):
```jsx
// Only use this if CSS keyframes are ruled out
<motion.img
  className={styles.heroImage}
  src="/images/save-the-date-hero.webp"
  alt="..."
  animate={{ scale: [1, 1.08, 1] }}
  transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
/>
```
This works but uses framer-motion's JS scheduler for a task CSS does better. **Prefer CSS keyframes.**

### Pattern 4: Folding Existing Static Children into Stagger

The existing resting-state children (`GuestGreeting`, `<p className={styles.label}>`, etc.) need to become `motion.*` elements with matching variant names.

**The pattern:**
- Replace `<p className={styles.label}>` with `<motion.p className={styles.label} variants={fadeUpVariants}>`
- Replace `<h1 className={styles.coupleNames}>` with `<motion.h1 className={styles.coupleNames} variants={coupleNamesVariants}>`
- Replace `<div className={styles.divider}>` with `<motion.div className={styles.divider} variants={dividerVariants} style={{ transformOrigin: 'center' }}>`
- Replace `<CountdownTimer />` with a `motion.div` wrapper: `<motion.div variants={fadeUpVariants}><CountdownTimer /></motion.div>` (CountdownTimer's internal AnimatePresence is untouched)
- Replace `<GuestGreeting />` with a `motion.div` wrapper OR modify `GuestGreeting.jsx` to return a `motion.p` — the cleanest approach is wrapping at the page level without touching `GuestGreeting.jsx`

**Key gotcha:** Existing elements already render and are visible in the resting state. Once they are wrapped in motion variants with `initial="hidden"`, they start hidden on load. This is correct behavior — but verify that the page-level `initial="hidden"` is set on the root container (NOT the children), so children inherit it via variant propagation and don't flash visible before animating.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stagger timing | Per-element `transition.delay` calculations | `staggerChildren` in parent variant | Hardcoded delays break relative timing; stagger auto-adjusts |
| Motion easing | CSS cubic-bezier on motion elements | `ease: [0.22, 0.61, 0.36, 1]` in each variant's `transition` | Framer normalizes easing array → cubic-bezier automatically |
| SVG stroke draw-on | stroke-dasharray / stroke-dashoffset manual calculation | `pathLength: 0→1` in framer-motion | Framer measures path length automatically; no manual getComputedStyle |
| Ken Burns loop | framer-motion repeat: Infinity | CSS @keyframes | CSS runs on compositor, no JS overhead for simple scale loop |
| Reduced motion detection | matchMedia('(prefers-reduced-motion)') manually | `useReducedMotion()` hook from framer-motion | Hook re-renders on OS setting change; no manual listener needed |
| Flip/mirror SVG | SVG transform attribute | CSS `scaleX(-1)` on wrapper | Avoids conflicting with framer-motion's transform pipeline |

**Key insight:** The `staggerChildren` + `delayChildren` combination is the correct tool for multi-container sequencing — do not simulate this with manual `delay` values on individual children.

---

## Common Pitfalls

### Pitfall 1: redundant `initial`/`animate` on SVG children breaking propagation

**What goes wrong:** Setting `initial="hidden" animate="visible"` on both the `motion.svg` AND the page container. The SVG starts its own independent animation timeline rather than waiting for the parent stagger to tell it when to fire.

**Why it happens:** Developers paste the "standard" framer-motion SVG example which shows `initial` and `animate` on the element itself.

**How to avoid:** Only set `initial="hidden" animate="visible"` on the single root container (`motion.div` wrapping `heroFrame` or `page`). All children — including `motion.svg`, `motion.path`, `motion.div` — only carry `variants={...}`. The variant names ("hidden"/"visible") propagate automatically.

**Warning signs:** Brackets or botanical draw in immediately on page load, ignoring the stagger order.

### Pitfall 2: Flash of fully-drawn SVG stroke on initial load (SSR caveat applies to CSR too)

**What goes wrong:** The `<motion.path>` renders fully drawn for one frame before the initial `pathLength: 0` is applied.

**Why it happens:** React renders the element to the DOM before framer-motion's JS applies the initial state. The browser briefly shows the path at its natural (fully drawn) state.

**How to avoid:** Add `strokeDasharray="0 1"` as a static SVG attribute on every `motion.path` (not via framer-motion, as a plain HTML attribute). This sets the stroke to invisible before JS runs.
```jsx
<motion.path
  d={...}
  strokeDasharray="0 1"   // static — prevents flash
  variants={pathVariants}
/>
```

**Warning signs:** SVG strokes visible for a frame on hard reload, then disappear, then draw in.

### Pitfall 3: `transformOrigin` on divider scaleX not working

**What goes wrong:** The divider scales from its left edge instead of from center.

**Why it happens:** Framer Motion's default `transformOrigin` is `"50% 50%"` BUT if the element has `margin: 24px auto` and block layout, the transform origin in viewport space may not be "center" of the element. CSS Modules cannot set `transform-origin` in a way that Framer respects — Framer overrides transforms.

**How to avoid:** Pass `style={{ transformOrigin: 'center' }}` directly on the `motion.div` divider element (inline style is acceptable for transform-origin since it is not a design value — it is a transform hint for the animation engine).

**Warning signs:** Divider grows from left to right instead of outward from center.

### Pitfall 4: `delayChildren` offset too small — content cascade starts during botanical draw-in

**What goes wrong:** The "For [Guest Name]" greeting fades up while the botanical strokes are still drawing, collapsing the two-stage reveal into visual chaos.

**Why it happens:** `delayChildren` on the content block was set too short — not accounting for the time brackets + botanical animations run at the viewport level.

**How to avoid:** `delayChildren` on the content block should be at least: `(bracket_stagger_delay + bracket_duration) + (botanical_stagger_delay + botanical_duration)`. With brackets at stagger index 0 (delay ≈ 0), duration 0.9s; botanical at index 1 (delay ≈ STAGGER), duration ~1.2s for the full stagger-in of all branches — content block should start no earlier than ~2.2s from zero. Use `delayChildren: 2.0` as a baseline and tune visually.

**Warning signs:** Greeting appears while gold strokes are still mid-draw.

### Pitfall 5: Framer transforms on `flipped` BotanicalSvg conflicting with variant transforms

**What goes wrong:** Using `motion.svg` with `animate={{ scaleX: -1 }}` for the flip creates a second framer-motion transform layer that conflicts with the entrance variant's own transforms (opacity, etc.).

**Why it happens:** Framer merges all animated transforms; mixing a static "flip" value with a tween creates unexpected intermediate states.

**How to avoid:** Implement the `flipped` prop as a CSS Module class with `transform: scaleX(-1)` on a plain wrapper `<div>`. The `motion.svg` inside only carries the entrance variant.

```jsx
// BotanicalSvg.jsx
function BotanicalSvg({ flipped = false, opacity = 1 }) {
  return (
    <div className={flipped ? styles.flipped : styles.wrapper}>
      <motion.svg variants={svgVariants} style={{ opacity }}>
        ...
      </motion.svg>
    </div>
  );
}
// .flipped { transform: scaleX(-1); }
```

### Pitfall 6: Ken Burns using `motion.img` with `animate` loop interfering with CSS object-fit

**What goes wrong:** Using `<motion.img animate={{ scale: [1, 1.08, 1] }}` changes the img's transform, which may interact unexpectedly with the `heroContainer`'s `overflow: hidden` boundary at the compositing level.

**Why it happens:** Framer-motion applies transforms via a `style` attribute, bypassing CSS Module styles. The `object-fit: cover` and `object-position: center` remain intact, but framer-motion's transform and the browser's object-fit scaling can produce visual artifacts at certain zoom levels.

**How to avoid:** Use CSS `@keyframes` on the `.heroImage` class instead (see Pattern 3 above). CSS `transform: scale()` on an img with `object-fit: cover` is well-tested and produces no artifacts.

---

## Code Examples

### Complete SaveTheDatePage orchestration skeleton

```jsx
// Source: verified framer-motion 12 API + motion.dev docs 2026-05-30
import { motion } from 'framer-motion';
import styles from './SaveTheDatePage.module.css';
import GuestGreeting from '../components/GuestGreeting.jsx';
import CountdownTimer from '../components/CountdownTimer.jsx';
import BotanicalSvg from '../components/BotanicalSvg.jsx';
import CornerBrackets from '../components/CornerBrackets.jsx';

const EASE = [0.22, 0.61, 0.36, 1];
const DURATION = 0.9;
const STAGGER = 0.15;

// Root page container — propagates "hidden"→"visible" to all children
const pageVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER },
  },
};

// Content block container — delays start until decos are in
const contentContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER,
      delayChildren: 2.0, // tune this value
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

const coupleNamesVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION, ease: EASE } },
};

const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: DURATION, ease: EASE } },
};

function SaveTheDatePage() {
  return (
    <div className={styles.page}>
      <motion.div
        className={styles.heroFrame}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero image — CSS Ken Burns, not in stagger */}
        <div className={styles.heroContainer}>
          <img
            className={styles.heroImage} // has @keyframes kenBurns
            src="/images/save-the-date-hero.webp"
            alt="Rina and Aaron's wedding in Oahu, Hawaii"
          />
        </div>
        <div className={styles.scrim} />

        {/* Step 2: Corner brackets — stagger index 0 */}
        <CornerBrackets />

        {/* Step 3: Botanical pair — stagger index 1 */}
        <div className={styles.botanicalPair}>
          <BotanicalSvg />
          <BotanicalSvg flipped />
        </div>

        {/* Steps 4–10: Content block with its own internal stagger */}
        <motion.div
          className={styles.contentBlock}
          variants={contentContainerVariants}
        >
          <motion.div variants={fadeUpVariants}><GuestGreeting /></motion.div>
          <motion.p className={styles.label} variants={fadeUpVariants}>Save the Date</motion.p>
          <motion.h1 className={styles.coupleNames} variants={coupleNamesVariants}>Rina &amp; Aaron</motion.h1>
          <motion.div
            className={styles.divider}
            variants={dividerVariants}
            style={{ transformOrigin: 'center' }}
          />
          <motion.p className={styles.date} variants={fadeUpVariants}>May 30, 2027</motion.p>
          <motion.p className={styles.location} variants={fadeUpVariants}>Oahu, Hawaii</motion.p>
          <motion.div variants={fadeUpVariants}><CountdownTimer /></motion.div>
          <motion.p className={styles.footer} variants={fadeUpVariants}>Formal invitation to follow</motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

### BotanicalSvg pathLength + stagger skeleton

```jsx
// src/components/BotanicalSvg.jsx
// Source: motion.dev/docs/react-svg-animation; confirmed for framer-motion 12.40.0
import { motion } from 'framer-motion';
import styles from './BotanicalSvg.module.css';

const EASE = [0.22, 0.61, 0.36, 1];

const svgVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const branchVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.0, ease: EASE },
  },
};

// Terminal olive dot (circle) uses same variant pattern
const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: EASE },
  },
};

export default function BotanicalSvg({ flipped = false, opacity = 1 }) {
  return (
    <div className={`${styles.wrapper} ${flipped ? styles.flipped : ''}`} style={{ opacity }}>
      <motion.svg
        viewBox="0 0 40 140"
        className={styles.svg}
        variants={svgVariants}
        // NO initial/animate here — propagated from page container
      >
        {/* Stem */}
        <motion.path
          d="M20 130 C19 100 21 70 20 10"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 1 (lower) — left */}
        <motion.path
          d="M20 110 C12 104 8 96 12 90 C16 96 20 102 20 110"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 1 (lower) — right */}
        <motion.path
          d="M20 110 C28 104 32 96 28 90 C24 96 20 102 20 110"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Add 2–3 more leaf pairs spaced up the stem */}
        {/* Terminal olive dot */}
        <motion.circle
          cx="20"
          cy="10"
          r="2.5"
          fill="var(--gold)"
          variants={dotVariants}
        />
      </motion.svg>
    </div>
  );
}
```

### Corner bracket draw-in

```jsx
// src/components/CornerBrackets.jsx
import { motion } from 'framer-motion';
import styles from './CornerBrackets.module.css';

const EASE = [0.22, 0.61, 0.36, 1];

// CornerBrackets is a single motion.div child in the page stagger
// It has its own internal stagger for the 4 bracket paths
const bracketsContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const bracketPathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: EASE },
  },
};

// Each corner is an SVG with an L-shaped bracket (two lines = two paths)
function CornerBracket({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className}>
      <motion.path
        d="M 4 16 L 4 4 L 16 4"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="0 1"
        variants={bracketPathVariants}
      />
    </svg>
  );
}

export default function CornerBrackets() {
  return (
    <motion.div className={styles.bracketsWrapper} variants={bracketsContainerVariants}>
      <CornerBracket className={styles.topLeft} />
      <CornerBracket className={`${styles.topRight} ${styles.flipH}`} />
      <CornerBracket className={`${styles.bottomLeft} ${styles.flipV}`} />
      <CornerBracket className={`${styles.bottomRight} ${styles.flipBoth}`} />
    </motion.div>
  );
}
// CSS: position: absolute; inset variants per corner; pointer-events: none
// flip classes use CSS transform: scaleX(-1) / scaleY(-1) / scale(-1,-1)
```

### prefers-reduced-motion handling

```jsx
// Option A: MotionConfig wrapper in App.jsx (recommended for whole-app)
// Import: framer-motion 12 confirmed MotionConfig available
import { MotionConfig } from 'framer-motion';

// In App.jsx:
function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SaveTheDatePage />
    </MotionConfig>
  );
}
// Effect: disables transform + layout animations site-wide when OS reduced motion is on.
// Preserves opacity animations (still communicates reveal).
// Ken Burns CSS keyframe must be separately conditioned:

/* SaveTheDatePage.module.css */
@media (prefers-reduced-motion: no-preference) {
  .heroImage {
    animation: kenBurns 20s ease-in-out infinite;
  }
}
```

---

## Olive-Branch SVG Geometry Guidance

**Practical approach for a slender vertical olive branch** that reads elegantly at ~40px wide × 120–140px tall alongside a 48px Cormorant Garamond h1:

| Element | SVG approach | Notes |
|---------|-------------|-------|
| Main stem | Single `path` with gentle S-curve (C or Q bezier) | Drawn first; establishes frame |
| Leaf pairs | 3–4 pairs; each leaf = one `path` with a closed-ish D-shaped curve; `fill="none"` | Stagger after stem; alternating left/right |
| Olive dots | `<circle>` or small filled ellipse; `fill="var(--gold)"` | 2–3 near the top terminus; drawn last via `dotVariants` |
| Stroke weight | `strokeWidth="1" – "1.5"` | Must match corner bracket stroke weight (visual system unity per D-05) |
| viewBox | `"0 0 40 140"` | Gives ~1:3.5 aspect ratio — slender but not too narrow |

**Leaf curve suggestion** (pointed olive leaf pointing inward):
- Left leaf at y=90: `M20 100 C13 94 9 86 13 80 C17 86 20 94 20 100` (curves out and back in)
- Right leaf at y=90 (mirror): `M20 100 C27 94 31 86 27 80 C23 86 20 94 20 100`

These paths produce a pointed-oval silhouette ~7px wide, inward-facing. The `flipped` prop via `scaleX(-1)` on the wrapper div mirrors the whole branch horizontally, making the right instance's leaves point the other direction correctly.

**Total path count:** ~10 paths for 3 leaf pairs + 2–3 olive dots + stem = reasonable DOM count, all animatable in ~1.2s of stagger.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `framer-motion` package name | Still `framer-motion` (v12) — `motion/react` is an alias in the separate `motion` package | Project uses framer-motion directly; import from `'framer-motion'` |
| `staggerChildren: number` in transition | Both `staggerChildren: number` (legacy) and `stagger()` function work in v12 | Prefer `staggerChildren` for simple numeric stagger; `stagger()` for directional options |
| Hardcoded animation delays per element | `staggerChildren` + `delayChildren` + variant propagation | CLAUDE.md binding rule; also cleaner to maintain |

---

## Open Questions

1. **Exact `delayChildren` value for content block**
   - What we know: brackets ~0.9s at stagger index 0, botanical ~1.2s of draw-in at stagger index 1 (with its own internal 0.12s sub-stagger across ~8 paths). Total estimated time before content should start: ~2.2–2.5s.
   - What's unclear: whether the "overlap" feel is pleasing with content starting at exactly 2.0s or needs to be 2.5s.
   - Recommendation: Start with `delayChildren: 2.0` and tune during visual checkpoint. This is discretionary per D-07.

2. **BotanicalSvg position within the layout**
   - What we know: D-02 says botanicals flank "Rina & Aaron" — modestly beside the name, leaves inward. The current DOM has a single `.contentBlock` anchored bottom-left-right. The botanicals and content text need to coexist horizontally around the h1.
   - What's unclear: Should botanicals be absolute-positioned relative to heroFrame (positioned above the content block at the h1's y-position)? Or should they be flex siblings inside a modified `.contentBlock` row? Absolute-positioned to `heroFrame` gives the most layout independence and avoids modifying the content block rhythm.
   - Recommendation: Position botanicals absolutely within `heroFrame` (or `page`) — they are decorative overlays independent of content flow. Use absolute positioning with `bottom: {calculated-offset}` to align vertically with the h1. This means adding a `botanicalPair` container with `position: absolute` and vertical centering math based on the content block's layout. Planner should specify this explicitly.

3. **Corner bracket size and inset for desktop greeting-card hero frame**
   - What we know: The Phase 2 quick task (260529-os0) reshaped the desktop layout into a greeting-card hero frame (`heroFrame` with `aspect-ratio: 5/7`, max-width `680px`, `border-radius: 20px`). The "viewport corners" for bracket placement are now the corners of the `heroFrame` card, not the full browser viewport.
   - What's unclear: Bracket positioning should be relative to `heroFrame` on desktop (which has border-radius clipping) and relative to the full viewport on mobile. The rounded corners may clip bracket SVGs.
   - Recommendation: Position brackets relative to `heroFrame` (using `position: absolute` within it, `inset: 16px`). On desktop, the rounded corners will naturally clip extreme positions — keep brackets inset 12–16px from the frame edges. Note: rounded `border-radius` does NOT clip content unless `overflow: hidden` is set — `heroFrame` does have `overflow: hidden` (line 16 of CSS) so clips apply.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure frontend code/config change with pre-installed packages).

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`. However, this is a **visual animation project** — there are no test files in the repository, no test framework is installed, and the nature of the requirements (pathLength draw-in aesthetics, stagger timing, Ken Burns feel) is intrinsically visual and cannot be automated meaningfully.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — no vitest, jest, or testing-library found |
| Config file | None |
| Quick run command | `vite build` (smoke: confirms no compile errors) |
| Full suite command | `vite build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DECO-01 | Corner brackets render and draw in | Visual / manual | `vite build` (compile smoke) | No test file |
| DECO-02 | BotanicalSvg renders with pathLength stagger + flipped | Visual / manual | `vite build` | No test file |
| DECO-03 | Botanical uses `var(--gold)`, no fills on stroke paths | CSS inspection / manual | `vite build` | No test file |
| HERO-02 | Ken Burns zoom 1→1.08 over 20s alternating | Visual / manual | `vite build` | No test file |
| ANIM-01 | No hardcoded per-element delays (code review) | Code review | `grep -r "delay:" src/pages/SaveTheDatePage.jsx` | Manual |
| ANIM-02 | Reveal order matches spec | Visual / manual | `vite build` | No test file |
| ANIM-03 | Easing array + ≥0.8s per element | Code review | `grep -r "ease:" src/` | Manual |
| ANIM-04 | Names scale 0.96→1; divider scaleX from center | Visual / manual | `vite build` | No test file |

### Wave 0 Gaps
All requirements are visual/behavioral. No automated test framework can validate animation aesthetics. The verification gate for this phase is a **visual browser review** — running `vite dev`, opening the page, and confirming each of the 10 steps.

**Phase gate:** `vite build` succeeds (no compile errors) AND visual browser review confirms all 8 requirements before `/gsd:verify-work`.

---

## Project Constraints (from CLAUDE.md)

All directives below are BINDING and cannot be superseded by this research:

| Directive | Rule |
|-----------|------|
| No UI libraries | Do not use shadcn, MUI, Radix, etc. Custom CSS Modules only. |
| No inline design values | All colors, fonts, spacing via CSS Module variables (`var(--gold)`, etc.) |
| No hardcoded animation delays | All timing must derive from `staggerChildren` index — no `delay:` on individual elements |
| Framer Motion variant pattern | `variants` + `staggerChildren` only for entrance sequences |
| Easing | `[0.22, 0.61, 0.36, 1]` everywhere |
| Min animation duration | 0.8s per element |
| Fonts | Cormorant Garamond + Jost only. Never Inter, Roboto, system fonts |
| Import source (confirmed) | `'framer-motion'` for motion; `'react-router'` for router hooks |
| No ParallaxImage.jsx | Superseded by D-09. `useScroll`/`useTransform` are NOT used in this phase. |
| CSS Module colors | `stroke="var(--gold)"` is acceptable directly on SVG elements; do not hardcode hex values |

---

## Sources

### Primary (HIGH confidence)
- `framer-motion` npm package @ 12.40.0 — inspected locally: `staggerChildren`, `stagger`, `useReducedMotion`, `MotionConfig`, `motion`, `AnimatePresence` all confirmed exported
- [motion.dev/docs/react-svg-animation](https://motion.dev/docs/react-svg-animation) — pathLength 0→1 pattern, `strokeDasharray="0 1"` SSR caveat, motion.path usage
- [motion.dev/docs/react-animation](https://motion.dev/docs/react-animation) — staggerChildren + delayChildren + variants propagation
- [motion.dev/docs/react-accessibility](https://motion.dev/docs/react-accessibility) — `useReducedMotion`, `MotionConfig reducedMotion="user"` pattern
- `src/` source files — actual installed versions, established import paths, DOM structure confirmed

### Secondary (MEDIUM confidence)
- [allsvgicons.com/blog/animating-svg-paths-css-framer-motion](https://allsvgicons.com/blog/animating-svg-paths-css-framer-motion/) — staggered SVG path variant pattern (verified against motion.dev docs)
- [motion.dev/magazine/web-animation-performance-tier-list](https://motion.dev/magazine/web-animation-performance-tier-list) — CSS keyframes on compositor thread = preferred for Ken Burns

### Tertiary (LOW confidence — for awareness only)
- WebSearch results re: Ken Burns CSS vs framer-motion loop — directional only; CSS keyframes recommendation is independently supported by the performance tier list article (MEDIUM)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from installed node_modules
- Architecture: HIGH — patterns confirmed against motion.dev official docs and existing source code structure
- Pitfalls: HIGH — derived from official docs + direct analysis of existing code DOM structure
- SVG geometry: MEDIUM — olive branch path coordinates are illustrative starting points; exact aesthetics require visual tuning

**Research date:** 2026-05-30
**Valid until:** 2026-08-30 (framer-motion 12 is stable; patterns unlikely to change in 90 days)
