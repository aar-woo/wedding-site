---
phase: 09-mobile-polish-deploy
plan: 03
subsystem: infra
tags: [vercel, neon, serverless, deploy, postgres, dns]

# Dependency graph
requires:
  - phase: 09-01
    provides: mobile CSS layout for one-screen fit
  - phase: 09-02
    provides: reduced-motion entrance-sequence compliance
  - phase: 08-frontend-hook-api-endpoint
    provides: api/guest/[id].js serverless function + useGuestName hook
  - phase: 07-datastore-schema-link-generation-tooling
    provides: Neon guests table, generate-links tooling, signed ?t= tokens
provides:
  - Live production deployment at https://wedding-site-ten-omega.vercel.app (Git-connected Vercel project, Vite SPA + /api serverless functions)
  - Production env vars set (GUEST_TOKEN_SECRET, SITE_BASE_URL, DATABASE_URL)
  - links.csv regenerated against the live SITE_BASE_URL (vercel.app host)
  - DEPLOY-01 delivered; Phase 8's deferred cold-deep-link check resolved
affects: [future-rsvp-work, future-domain-setup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SPA catch-all rewrite excludes /api so serverless functions execute (vercel.json: source /((?!api/).*) -> /index.html)"
    - "api/guest/[id].js reads process.env.DATABASE_URL per-invocation via @neondatabase/serverless HTTP driver"

key-files:
  created: []
  modified:
    - .env.local
    - links.csv

key-decisions:
  - "DEVIATION (intentional): DATABASE_URL set MANUALLY in Vercel Production env, and the Neon-managed Vercel integration was REMOVED — the opposite of the plan's 'connect Neon integration, do NOT enter by hand' instruction. Reason: an accidental second Vercel org + Neon integration was injecting a DATABASE_URL pointing at a fresh/empty Neon database, causing every /api/guest/:id call to 500. The integration auto-overwrites DATABASE_URL on each deploy, so leaving it connected would have kept reintroducing the wrong DB. Manual env var + integration removal is the durable fix. See key-decisions in STATE.md."
  - "Production DATABASE_URL points at the populated Neon project ep-bitter-base-apo4bckl (3 live guest rows), confirmed via real-id 200s and bogus-id clean 404."
  - "Deploy mechanism is git push to main (origin/main) -> Vercel auto-build; no Vercel CLI used (everything via dashboard + git)."

patterns-established:
  - "Failure-mode triage for serverless+DB: 500 on real id = env/connection broken (missing DATABASE_URL); 404 on real id = connected but wrong/empty DB. Used to diagnose the org/integration split."

requirements-completed: [DEPLOY-01]

# Metrics
duration: ~session (manual, interactive)
completed: 2026-06-03
---

# Phase 9 / Plan 03: Live Deploy Summary

**The site is shipped live at `wedding-site-ten-omega.vercel.app` with a working Vite SPA, executing `/api` serverless functions, and a correctly-wired Neon Postgres connection — after diagnosing and fixing an accidental Vercel-org/Neon-integration split that was pointing production at the wrong database.**

## Performance

- **Duration:** Manual, interactive (spread across the session)
- **Completed:** 2026-06-03
- **Tasks:** Deploy + env config + links.csv regen + end-to-end verification
- **Files modified:** 2 (`.env.local`, `links.csv`)

## Accomplishments

- **Live deployment:** Git-connected Vercel project auto-builds on push to `main`; Vite detected (build `vite build`, output `dist`). Static SPA serves at the production `*.vercel.app` URL.
- **Serverless functions execute:** `vercel.json` SPA catch-all excludes `/api`, so `api/guest/[id].js` runs server-side instead of being swallowed by the `index.html` rewrite (fixed in commit `8056dbb` earlier in the phase).
- **Production env configured:** `GUEST_TOKEN_SECRET` and `SITE_BASE_URL` set (no `VITE_` prefix); `DATABASE_URL` set manually to the populated Neon project.
- **Root-caused the 500s:** An accidental second Vercel org + Neon integration had injected a `DATABASE_URL` pointing at an empty Neon DB. Diagnosed via failure-mode triage (real-id `500` rather than `404`). Fixed by setting `DATABASE_URL` by hand to `ep-bitter-base-apo4bckl` and removing the stray integration so it can't re-inject the wrong value.
- **links.csv regenerated** against the live `SITE_BASE_URL` — guest URLs now use the `vercel.app` host with `/i/:id?t=<token>` deep links.

## Verification (production, end-to-end)

- Cold deep-link `GET /i/UZiJA4i6JIMON-BA1YwUd?t=…` → **200**, serves SPA shell (`<div id="root">`), not a 404.
- Greeting renders from `?t=` → confirmed "The Johnson Family" in-browser.
- `GET /api/guest/:id` for all three real guests → **200** with correct `displayName` (incl. accented "García").
- Bogus id → clean **404** (proves live DB query, not a crash).
- Static root → **200**.

## Deviations

1. **Manual `DATABASE_URL` instead of Neon integration (intentional).** The plan called for connecting Neon's Vercel integration and never entering `DATABASE_URL` by hand. We did the reverse and removed the integration, because the integration was the source of the wrong-DB injection causing production 500s. This is the durable fix; reconnecting the integration would risk overwriting the working value on the next deploy.

## Follow-ups / Notes

- If a custom domain is added later, update `SITE_BASE_URL` and regenerate `links.csv`.
- The frontend now also fetches the authoritative DB name by id (quick task `260602-nu0`), so corrected `guests.display_name` values propagate to already-sent links automatically.
