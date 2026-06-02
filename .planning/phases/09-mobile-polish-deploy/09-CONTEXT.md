# Phase 9: Mobile Polish & Deploy - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing animated save-the-date SPA fully legible and jank-free on a 375px mobile viewport, deploy it live to a Git-connected Vercel project (SPA build + `/api` serverless functions + Neon), with `DATABASE_URL`, `GUEST_TOKEN_SECRET`, and `SITE_BASE_URL` configured as production env vars, and verify the full v2.0 stack end-to-end in production with a real generated guest link. Delivers **EXP-01**, **EXP-02**, **DEPLOY-01**.

**In scope:**
- Mobile responsive polish — verify-and-fix pass at a 375px floor (existing mobile-first CSS is the intended design).
- Mobile animation performance — keep the full entrance sequence, optimize only if a measured frame drop appears; extend `prefers-reduced-motion` to the whole sequence.
- Vercel deployment — Git-connected project, SPA build + `/api` functions, production env vars, Neon integration.
- Post-deploy link regeneration — set `SITE_BASE_URL` to the live domain, regenerate `links.csv` so real links point at production (carry-forward D-07 from Phase 7).
- Production end-to-end verification — cold deep-link `/i/:id` serves the SPA (not 404), greeting renders, `GET /api/guest/:id` returns 200, using one real `links.csv` row.

**NOT in scope:**
- Custom domain (default to the auto `*.vercel.app` URL unless the user later chooses otherwise).
- Desktop layout changes — the 768px greeting-card view is done and locked; do not reshape it.
- `vercel.json` rewrite reshaping — the `/api` passthrough → SPA catch-all order is locked (Phase 8).
- RSVP flow / new features — future milestone.
- Analytics, rate limiting, observability tooling — not required by this phase's criteria.

</domain>

<decisions>
## Implementation Decisions

### Mobile polish scope (EXP-01)
- **D-01:** **Verify & fix only.** Treat the existing mobile-first CSS as the intended design. Audit at a 375px viewport and fix only what overflows, clips, or is illegible — no redesign, no reworked composition.
- **D-02:** **One screen, no scroll.** The full keepsake (Save-the-Date label, couple names, divider, date, location, countdown, footer, botanicals) must be visible at once on open. Tighten sizes/spacing to fit within `100svh` rather than introducing vertical scroll. Note the layout risk: `.topGroup` is pinned `top`, `.contentBlock` is pinned `bottom`, `.botanicalPair` sits at `bottom: 180px` — these are independently anchored and can crowd/collide on short viewports; fitting them on one screen is the core fix.
- **D-03:** **375px is the supported floor.** Matches success criterion #1 and covers iPhone SE 2/3, iPhone 12–14, and most modern phones. Narrower (320px) is not a commitment.
- **D-04:** **Portrait-first, best-effort landscape.** Optimize for portrait (how invitation links are opened); landscape must not break but receives no dedicated tuning.

### Mobile animation / jank (EXP-02)
- **D-05:** **Ship the full entrance sequence on mobile.** Do not pre-emptively strip or lighten motion. Optimize a specific effect only if a measured frame drop shows up.
- **D-06:** **Judge "no jank" via Chrome DevTools** — device emulation + 4–6× CPU throttle, watching the performance panel during the botanical draw-in and countdown ticks. (Real-device confirmation is a nice-to-have post-deploy, not the gating method.)
- **D-07:** **Extend `prefers-reduced-motion` to the whole sequence.** Today only the Ken Burns zoom is stilled. Under reduced-motion, content should snap in — skip the corner-bracket `pathLength` draw, the staggered botanical stroke draws, and the fadeUps — not just freeze Ken Burns. This is both an accessibility win and a guaranteed jank-free fallback.
- **D-08:** **Optimize in place is the first-line escape hatch.** If an effect is the jank culprit, keep it and fix the cause (GPU-friendly transform/opacity only, `will-change`, reduced repaint area) before considering any mobile-only simplification.

### Claude's Discretion — Deployment (DEPLOY-01) — defaults below; user did not select this area, flag if wrong
- **D-09 (Domain):** Default to the auto `*.vercel.app` URL — no custom domain this phase.
- **D-10 (Env vars):** User provisions production env vars in the Vercel dashboard: `DATABASE_URL` (via Neon's Vercel integration), `GUEST_TOKEN_SECRET`, and `SITE_BASE_URL` (set to the live domain). All server-only — **never `VITE_`-prefixed**. **This requires user action** before production verification can pass.
- **D-11 (Deploy model):** Git-connected Vercel project, auto-deploy from `main`. SPA build (`vite build`) + `/api` serverless functions (Node runtime, not Edge) + Neon. `vercel.json` rewrite order stays locked.
- **D-12 (Link regeneration — carry-forward, NON-NEGOTIABLE):** Once the live domain exists, set `SITE_BASE_URL` to it and re-run `npm run db:generate-links` so `links.csv` URLs point at production. Phase 7 links used a placeholder host (D-07, Phase 7) and are not yet shippable.

### Claude's Discretion — Production verification — defaults below; user did not select this area
- **D-13:** Verify the full v2.0 stack live with **one real `links.csv` row**: (a) cold deep-link `/i/:id` serves the SPA, not a 404 (deferred from Phase 8 — must be checked here); (b) the personalized greeting renders from the `?t=` token; (c) `GET /api/guest/:id` returns 200. All three must pass to satisfy success criterion #4.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract (binding — do not re-derive design values)
- `CLAUDE.md` — design system (colors, fonts, animation rules: `variants` + `staggerChildren`, min 0.8s/element, ease `[0.22, 0.61, 0.36, 1]`), image handling, and the "Do not" list. The mobile polish must stay inside these constraints.

### Locked contract (binding — changing it forces re-issuing every link)
- `docs/identity-token-contract.md` — URL shape `/i/<id>?t=<payload>.<hmac>`, payload `{ id, name, iat }`, HMAC-SHA256, env-var naming (server-only, no `VITE_`), trust boundary. §5 (env vars) and §7 (implementation files) matter most for the prod env-var config.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — **EXP-01** (responsive/legible mobile + desktop), **EXP-02** (jank-free animation on a typical mobile device), **DEPLOY-01** (live Vercel deploy: SPA + `/api` + Neon env config). All three are THIS phase.
- `.planning/ROADMAP.md` §"Phase 9" — goal + 4 success criteria (375px legibility, no animation jank, live Git-connected Vercel URL with Neon + secret env vars, full-stack prod verification with a real link).

### Prior-phase decisions this phase depends on
- `.planning/phases/07-datastore-schema-link-generation-tooling/07-CONTEXT.md` — D-07 (SITE_BASE_URL configurable, links use placeholder host until the real domain is known → regenerate after deploy), D-08 (Neon provisioning / `DATABASE_URL` in env), git-safety (`links.csv`/`guests.csv` never committed).
- `.planning/phases/08-frontend-hook-api-endpoint/` — Phase 8 criterion #4 (cold deep-link `/i/:id` → SPA, not 404) was explicitly **deferred to this phase's deploy verification**. `vercel.json` rewrite order (`/api` passthrough first, then SPA catch-all) is locked.

### Milestone research (responsive/deploy guidance)
- `.planning/research/ARCHITECTURE.md` — Vercel SPA + `/api` serverless function deployment pattern, build order, env-var wiring.
- `.planning/research/PITFALLS.md` — deploy/observability pitfalls (env-var leakage via `VITE_` prefix, link portability, the "Looks Done But Isn't" checklist).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/SaveTheDatePage.module.css` — already mobile-first. Base styles target small screens; `@media (min-width: 768px)` layers the desktop greeting-card view. Mobile polish edits the base block; **do not touch the 768px block** (desktop is locked). Already uses `clamp(20px, 8vw, 32px)` on the label and `100svh` on `.page`/`.heroFrame`.
- `@media (prefers-reduced-motion: no-preference)` guard already wraps the Ken Burns `kenBurns` keyframe animation (lines ~159-163) — the pattern to extend across the whole sequence (D-07).
- `src/components/CountdownTimer.module.css` — countdown is a flex row, `gap: 20px`, 4 units at `min-width: 44px` (≈236px total) — fits 375px with margin; verify it doesn't crowd at the floor.
- `vercel.json` — rewrites in place and order-locked: `/api/(.*)` passthrough, then `/(.*)` → `/index.html`.
- `package.json` scripts — `build` (`vite build`), `db:migrate`, `db:generate-links` (`node --env-file=.env.local scripts/generate-links.js`) — the link-regen step (D-12) re-runs `db:generate-links` with `SITE_BASE_URL` set.

### Established Patterns
- React 18 + Vite + Framer Motion + React Router (imported from `react-router`), CSS Modules only, no UI libraries, no inline style values.
- Entrance motion uses `variants` + `staggerChildren` (CLAUDE.md) — reduced-motion handling should hook the variant/transition layer, not add per-element hacks.
- Server-only secrets live in `scripts/`/`/api`; `src/` stays secret-free. Prod env vars are never `VITE_`-prefixed.

### Integration Points
- Vercel project: Git-connected, auto-deploy from `main`. Production env: `DATABASE_URL`, `GUEST_TOKEN_SECRET`, `SITE_BASE_URL`.
- `links.csv` (gitignored) is regenerated post-deploy against the live `SITE_BASE_URL`; one of its rows is the production end-to-end test fixture.
- The `/i/:id` route (Phase 8) + `api/guest/[id].js` endpoint are what the prod verification exercises.

</code_context>

<specifics>
## Specific Ideas

- The single-glance reveal is the point on mobile too: everything fits one screen (D-02), no scroll, just smaller/tighter — not a re-flowed mobile layout.
- Reduced-motion is treated as a first-class, fully-defined experience (snap-in, no draws) — not an afterthought that only freezes the background zoom.
- "No jank" is judged with DevTools CPU throttle during development (D-06); a real-device glance after deploy is welcome but not the gate.

</specifics>

<deferred>
## Deferred Ideas

- **Custom domain** — out of scope; default `*.vercel.app`. Revisit if the couple wants a branded URL (would require another `links.csv` regen).
- **320px / very-small-device support** — not committed; 375px is the floor.
- **Dedicated landscape tuning** — best-effort only this phase.
- **Proactive mobile motion reduction** — explicitly rejected (D-05); full sequence ships, optimize only on measured jank.
- **Real-device perf lab / analytics / rate limiting / observability** — not required by Phase 9 criteria; future work.

</deferred>

---

*Phase: 09-mobile-polish-deploy*
*Context gathered: 2026-06-01*
