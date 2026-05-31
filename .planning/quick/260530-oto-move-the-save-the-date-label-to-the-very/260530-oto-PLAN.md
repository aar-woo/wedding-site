---
quick_id: 260530-oto
mode: quick
description: Move the "Save the Date" label to the very top of the hero container, with spacing between it and the rest of the content block
created: 2026-05-31
files_modified:
  - src/pages/SaveTheDatePage.jsx
  - src/pages/SaveTheDatePage.module.css
---

# Quick Task 260530-oto: Move "Save the Date" to top of hero

## Objective

Relocate the "Save the Date" label from inside the bottom-anchored content block
to a top-anchored position at the very top of the hero frame, creating visual
separation (the empty middle of the hero) between the header label and the rest
of the information (greeting, couple names, divider, date, location, countdown,
footer) which remain bottom-anchored.

## Tasks

### Task 1: Move the label out of the content block to a top-anchored header

<files>
- src/pages/SaveTheDatePage.jsx
- src/pages/SaveTheDatePage.module.css
</files>

<action>
In `SaveTheDatePage.jsx`:
- Remove the `<motion.p className={styles.label} ...>Save the Date</motion.p>` line
  from inside `.contentBlock` (currently step 5, between GuestGreeting and the h1).
- Add it back as a top-anchored sibling: a direct `motion.p` child of the
  `.heroFrame` page-root `motion.div`, placed after the `.botanicalPair` block and
  before `.contentBlock`. Give it `className={`${styles.label} ${styles.topLabel}`}`
  and `variants={fadeUpVariants}` so it reveals via the existing page-level stagger
  (no hardcoded delay — derives from stagger index, honoring ANIM-01).

In `SaveTheDatePage.module.css`, add a `.topLabel` positioning rule (typography
stays in `.label`):
```css
.topLabel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  padding: 48px 28px 0;
}
```
</action>

<verify>
npm run build exits 0; grep confirms `.topLabel` in the CSS module and
`styles.topLabel` referenced in the JSX; the label JSX no longer sits inside
`.contentBlock`.
</verify>

<done>
"Save the Date" renders pinned at the top of the hero with the rest of the
content remaining at the bottom; build is green.
</done>
