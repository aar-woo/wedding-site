# Wedding Website — Save the Date

## Project

React + Vite + Framer Motion wedding website.
Phase 1: Animated save-the-date with guest personalization via URL params.

## Tech stack

- React 18, Vite, Framer Motion, React Router v6, CSS Modules
- No UI libraries — custom design only
- Fonts: Cormorant Garamond (display) + Jost (body) via Google Fonts

## Design system

- Background: #0B1610 (deep forest)
- Gold: #BF9B5A — use for accents, labels, botanical elements
- Gold light: #D4B57A — couple names, guest name
- Cream: #EAE0CB — body text
- Muted: #72685A — secondary labels, uppercase tracking text
- Never use Inter, Roboto, or system fonts

## Guest personalization

Read `?to=` query param using useSearchParams from react-router-dom.
Fall back to "Our Beloved Guests" if param is absent.
Set document.title to "Save the Date – For {name}" when param is present.
Component: src/hooks/useGuestName.js

## Animation rules (Framer Motion)

- Use `variants` + `staggerChildren` for entrance sequences — never hardcode
  individual delays on every element
- Page load sequence order:
  1. Background image (Ken Burns subtle zoom, 20s loop)
  2. Corner bracket decorations (draw in via pathLength)
  3. Botanical SVG (stroke pathLength draw, stagger branches)
  4. "For [Guest Name]" — fadeUp
  5. Save the Date label — fadeUp
  6. Couple names — fadeUp with slight scale (0.96 → 1)
  7. Divider line — scaleX from center
  8. Date — fadeUp
  9. Location — fadeUp
  10. Footer note — fadeUp
- All easing: [0.22, 0.61, 0.36, 1] (ease out quart)
- No animation should feel rushed — min 0.8s duration per element

## Image handling

- Hero: full-bleed fixed background with Ken Burns (scale 1→1.08 over 20s, alternate)
- Use <img> with object-fit: cover in a positioned container
- Parallax: use Framer Motion useScroll + useTransform on image layers
- Images live in /public/images/ — reference as "/images/filename.jpg"

## Components to build

### ParallaxImage.jsx

Wraps an image with useScroll/useTransform for a parallax scroll offset.
Props: src, alt, speed (default 0.3), className

### BotanicalSvg.jsx

SVG botanical branch illustration.
Uses Framer Motion `pathLength` from 0→1 with staggered branches.
Props: flipped (bool), opacity (default 1)
Branches should be stroke-only, color var(--gold), no fills except terminal dots.

### GuestGreeting.jsx

Shows "For" label + guest name pulled from useGuestName hook.
Animate in as a unit with motion.div.

### CountdownTimer.jsx

Live countdown to May 30, 2027.
Display: days / hours / minutes / seconds in a row.
Each number animates individually when it ticks (AnimatePresence key swap).

## URL pattern

/?to=The+Johnson+Family → "For The Johnson Family"
/?to=Mike+%26+Sarah → "For Mike & Sarah"
Wrap <App> in <BrowserRouter> in main.jsx.

## Do not

- Do not use any component libraries (shadcn, MUI, etc.)
- Do not add routing beyond the single page for Phase 1
- Do not use inline styles for design values — always CSS Modules variables
- Do not hardcode animation delays — derive from staggerChildren index

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Wedding Save-the-Date — Aaron & Rina**

An animated, single-page "save the date" website for Aaron & Rina's wedding on
May 30, 2027 in Oahu, Hawaii. Guests open a personalized link (e.g.
`/?to=The+Johnson+Family`) and see their name woven into an elegant, motion-rich
forest-and-gold scene with the couple's names, the date, the location, and a
live countdown. It is a keepsake-quality announcement, not a functional RSVP or
events portal.

**Core Value:** When a guest opens their link, they feel the warmth and elegance of the
invitation immediately — a beautiful, personalized, smoothly-animated reveal of
"Aaron & Rina · May 30, 2027 · Oahu, Hawaii."

### Constraints

- **Tech stack**: React 18 + Vite + Framer Motion + React Router v6 + CSS Modules — no UI libraries, custom design only.
- **Fonts**: Cormorant Garamond (display) + Jost (body) via Google Fonts. Never Inter, Roboto, or system fonts.
- **Design system**: Background `#0B1610`, gold `#BF9B5A`, gold-light `#D4B57A`, cream `#EAE0CB`, muted `#72685A`. Design values live in CSS Module variables — no inline style values.
- **Animation**: Use `variants` + `staggerChildren` (no hardcoded per-element delays); min 0.8s per element; ease `[0.22, 0.61, 0.36, 1]`.
- **Hosting**: Static build deployed to Vercel.
- **Personalization**: Read-only via `?to=` query param; no stored guest list.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
