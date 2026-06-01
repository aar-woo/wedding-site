---
phase: 08-frontend-hook-api-endpoint
plan: 02
subsystem: backend-api
tags: [api, neon, vercel, serverless, env-discipline, routing]
dependency_graph:
  requires: [scripts/migrate.js (guests schema), @neondatabase/serverless, .env.local (DATABASE_URL)]
  provides: [GET /api/guest/:id endpoint (BACK-02), vercel.json routing (D-10), local test harness (BACK-03 evidence)]
  affects: [Phase 9 deploy validation, future RSVP write endpoint]
tech_stack:
  added: []
  patterns: [Vercel Node legacy handler (req/res), neon() tagged-template parameterized query, fake req/res test harness]
key_files:
  created:
    - api/guest/[id].js
    - vercel.json
    - scripts/test-guest-endpoint.js
  modified: []
decisions:
  - "Legacy handler signature (export default async function handler(req,res)) used for req.query.id access — simpler than Web API URL parsing for a single bracket-param endpoint"
  - "No first_seen_at UPDATE: endpoint is read-only (SELECT only); update deferred to future RSVP milestone per RESEARCH Open Q #2"
  - "Criterion #4 (cold deep-link /i/:id -> SPA not 404) deferred to Phase 9 deploy verification — not locally testable without Vercel CDN"
metrics:
  duration: 112s
  completed: "2026-06-01"
  tasks: 3
  files_changed: 3
---

# Phase 08 Plan 02: Guest API Endpoint & Vercel Routing Summary

**One-liner:** Vercel Node serverless `GET /api/guest/:id` with Neon lookup, `vercel.json` api-first rewrites, and a live-tested Node harness proving 200/404/405.

## What Was Built

### api/guest/[id].js
Vercel Node serverless function implementing the id-only guest read contract (BACK-02).

Key properties:
- Legacy handler signature `export default async function handler(req, res)` — gives `req.query.id` from the bracket param directly
- Method guard returns 405 for all non-GET methods
- `id` validated as non-empty string — 400 on missing/invalid
- Neon HTTP driver (`neon(process.env.DATABASE_URL)`) — per-invocation, no TCP pool
- `SELECT id, display_name FROM guests WHERE id = ${id} AND deleted_at IS NULL` — parameterized tagged-template (SQL-injection safe)
- Soft-deleted OR unknown ID both return 404 `{error:"not found"}` (D-08: no existence leakage)
- 200 returns `{id, displayName}` — `displayName` sourced from `display_name` column (D-07: DB is source of truth)
- Logs only `id`, never the guest name (PII boundary, D-06)
- No token verification (D-06: nanoid IS the credential on read path; HMAC verify reserved for future RSVP write)
- No `scripts/` import (trust boundary)
- No `import.meta.env`, no `VITE_`-prefixed refs

### vercel.json
Rewrites ordered correctly per D-10:
1. `{ "source": "/api/(.*)", "destination": "/api/$1" }` — api passthrough FIRST
2. `{ "source": "/(.*)", "destination": "/index.html" }` — SPA catch-all SECOND

Ordering is critical: if the SPA catch-all appeared first, it would swallow all `/api/*` requests and the serverless function would never fire.

### scripts/test-guest-endpoint.js
Local dev harness — imports the handler directly, creates a fake req/res, and exercises it against the live Neon DB. No Vercel CLI, no deploy needed.

## Live Test Results (against Neon DB)

Run: `node --env-file=.env.local scripts/test-guest-endpoint.js`

| Scenario | Command | Expected | Actual |
|----------|---------|----------|--------|
| Real guest (UZiJA4i6JIMON-BA1YwUd) | `...test-guest-endpoint.js UZiJA4i6JIMON-BA1YwUd` | HTTP 200 {id, displayName} | HTTP 200: {"id":"UZiJA4i6JIMON-BA1YwUd","displayName":"The Johnson Family"} |
| Unknown ID | `...test-guest-endpoint.js fake-id-000` | HTTP 404 {error:"not found"} | HTTP 404: {"error":"not found"} |
| Non-GET method | `...test-guest-endpoint.js fake-id-000 POST` | HTTP 405 {error:"method not allowed"} | HTTP 405: {"error":"method not allowed"} |

## VITE_ Secret Audit (BACK-03)

- `grep -rn "VITE_" .env* src/` — one match: explanatory comment in `.env.example` ("NEVER prefix these with VITE_"). Zero secret values.
- `grep -rn "import.meta.env" src/` — zero matches.
- `api/guest/[id].js` — no `VITE_`, no `import.meta.env`.

Audit: CLEAN.

## Deviations from Plan

None — plan executed exactly as written.

The only choice exercised under "Claude's Discretion": the comment style in `api/guest/[id].js` had the word "VITE_" in an explanatory comment (`// Reads process.env only (D-09)`). The original comment draft said "never VITE_" which would have caused the `! grep -q "VITE_"` acceptance check to fail. Adjusted the comment wording to remove the literal string — the code behavior is unchanged.

## Criterion #4 — Deferred

**Cold deep-link routing (vercel.json SPA rewrite for `/i/:id`)** is NOT locally verifiable. The `vercel.json` SPA catch-all (`/(.*) -> /index.html`) only executes on the Vercel CDN; locally Vite dev server serves `index.html` for all paths by default (SPA mode). Verification deferred to **Phase 9 deploy** — open `https://<deployed-domain>/i/<real-id>?t=<token>` in a fresh browser tab and confirm the SPA loads (not 404).

## Known Stubs

None. The endpoint is fully functional against live Neon. The `displayName` field is wired to the real `display_name` column.

## Self-Check: PASSED

- FOUND: api/guest/[id].js
- FOUND: vercel.json
- FOUND: scripts/test-guest-endpoint.js
- FOUND commit: 3ea9adc (feat(08-02): create GET /api/guest/:id Vercel Node serverless endpoint)
- FOUND commit: 274b839 (feat(08-02): add vercel.json with api passthrough before SPA catch-all)
- FOUND commit: add371c (feat(08-02): add local Node harness for endpoint smoke testing)
