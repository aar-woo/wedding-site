---
phase: 08-frontend-hook-api-endpoint
verified: 2026-05-31T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Cold deep-link: open https://<deployed-domain>/i/<real-id>?t=<token> in a fresh browser tab"
    expected: "SPA loads and shows the personalized greeting — NOT a Vercel 404"
    why_human: "vercel.json SPA rewrite only executes on the Vercel CDN; cannot be reproduced locally. Deferred to Phase 9 deploy validation per 08-02-SUMMARY.md."
---

# Phase 8: Frontend Hook & API Endpoint Verification Report

**Phase Goal:** The site resolves guest identity entirely from the URL token with no network round-trip, and a validation endpoint exists that the future RSVP flow will reuse.
**Verified:** 2026-05-31
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Opening a generated guest link shows "For [Guest Name]" instantly — no loading state, no API call on page load | VERIFIED | `useGuestName.js`: three-step resolution (decodeGuestToken → ?to= → fallback), zero `fetch(` calls. GuestGreeting.jsx renders `{name}` directly with no suspense/loading branch. |
| 2 | GET /api/guest/:id returns HTTP 200 {id,displayName} for valid known guest; HTTP 404 for unknown/deleted id | VERIFIED | `api/guest/[id].js`: SELECT with `deleted_at IS NULL`, maps `display_name → displayName`. Live harness in 08-02-SUMMARY.md: 200 for UZiJA4i6JIMON-BA1YwUd ("The Johnson Family"), 404 for fake-id-000, 405 for POST. |
| 3 | No VITE_-prefixed secret exists in .env* or src/; endpoint reads process.env only | VERIFIED | `grep -rn "VITE_" .env* src/` returns only one explanatory comment in `.env.example` ("NEVER prefix these with VITE_"). No secret values. No `import.meta.env` anywhere in `src/`. `api/guest/[id].js` reads `process.env.DATABASE_URL` only. |
| 4 | vercel.json routes /api/* before the SPA catch-all | VERIFIED (code) / DEFERRED (deploy-time behavior) | vercel.json rewrites: `/api/(.*)` rule appears first, `/(.*) → /index.html` catch-all second. Ordering is correct per D-10. Cold-deploy deep-link behavior is deferred to Phase 9 (see Human Verification). |

**Score:** 4/4 truths verified (criterion #4 deploy-time behavior correctly deferred to Phase 9)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/useGuestName.js` | Token-first resolution; imports decodeGuestToken; no fetch; returns {name,hasName} | VERIFIED | Imports `decodeGuestToken` from `../lib/decodeGuestToken.js`. Steps: (1) ?t= → decodeGuestToken, (2) ?to= legacy fallback, (3) "Our Beloved Guests". `document.title` set only when hasName. Zero `fetch` calls. |
| `src/App.jsx` | Routes block: /i/:id and /* render SaveTheDatePage inside MotionConfig; imports from 'react-router' | VERIFIED | `import { Routes, Route } from 'react-router'` (NOT react-router-dom). MotionConfig wraps Routes. Both `/i/:id` and `/*` routes render `SaveTheDatePage`. |
| `api/guest/[id].js` | Vercel Node serverless: id-only Neon lookup; WHERE deleted_at IS NULL; 200/404/405/400; process.env.DATABASE_URL; no scripts/lib; no import.meta.env; logs id not name | VERIFIED | Method guard (405), id guard (400), `neon(process.env.DATABASE_URL)`, `SELECT id, display_name FROM guests WHERE id = ${id} AND deleted_at IS NULL`, `displayName: display_name` on 200, `{error:'not found'}` on 404. Logs `id` only. No `import.meta.env`, no `scripts/lib` import, no `VITE_`. |
| `vercel.json` | /api/(.*) rewrite before /(.*) → /index.html | VERIFIED | Rewrites array: index 0 is `/api/(.*)` passthrough, index 1 is `/(.*) → /index.html`. |
| `scripts/test-guest-endpoint.js` | Local harness: imports handler, fake req/res, exercises against live Neon | VERIFIED | Imports `handler` from `../api/guest/[id].js`. Constructs fake req/res. Takes id and method from argv. Live results documented in 08-02-SUMMARY.md. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/hooks/useGuestName.js` | `src/lib/decodeGuestToken.js` | `import { decodeGuestToken } from '../lib/decodeGuestToken.js'` | WIRED | Line 3 of useGuestName.js. Correct browser-safe lib — NOT scripts/lib/token.js. |
| `src/App.jsx` | `react-router` | `import { Routes, Route } from 'react-router'` | WIRED | Line 2 of App.jsx. Does not import from `react-router-dom`. |
| `api/guest/[id].js` | `process.env.DATABASE_URL` | `neon(process.env.DATABASE_URL)` | WIRED | Line 21 of endpoint. Node runtime only. |
| `api/guest/[id].js` | guests table (Neon) | `SELECT id, display_name FROM guests WHERE id = ${id} AND deleted_at IS NULL` | WIRED | Lines 27–32. Parameterized tagged-template (SQL-injection safe). |
| `vercel.json` | Vercel rewrite engine | `/api/(.*)` rule positioned before `/(.*) catch-all` | WIRED | Index 0 = api passthrough, index 1 = SPA catch-all. |
| `src/components/GuestGreeting.jsx` | `src/hooks/useGuestName.js` | `import useGuestName from '../hooks/useGuestName.js'` | WIRED | Unchanged from Phase 3. Renders `{name}` from `useGuestName().name`. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `GuestGreeting.jsx` | `name` | `useGuestName()` → `decodeGuestToken(?t=)` or `?to=` | Yes — client-side decode of signed token payload or URL param. No hardcoded stub. | FLOWING |
| `api/guest/[id].js` | `rows[0].display_name` | Neon Postgres `SELECT ... WHERE id = ${id} AND deleted_at IS NULL` | Yes — live DB query. 08-02-SUMMARY.md live-run: "The Johnson Family" returned for real id. | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| api/guest/[id].js syntax valid | `node --check "api/guest/[id].js"` | SYNTAX_OK | PASS |
| 33/33 tests pass (decodeGuestToken + token + generate-links) | `node --test src/lib/decodeGuestToken.test.js scripts/lib/token.test.js scripts/generate-links.test.js` | 33 pass, 0 fail | PASS |
| Production build succeeds | `npm run build` | 366 kB bundle (117 kB gzip), built in 137ms | PASS |
| No fetch() call in useGuestName | `grep -q "fetch(" src/hooks/useGuestName.js` | NO_fetch | PASS |
| No import.meta.env in api endpoint | `grep -q "import.meta.env" "api/guest/[id].js"` | NO_import.meta.env | PASS |
| No scripts/lib import in api endpoint | `grep -q "scripts/lib" "api/guest/[id].js"` | NO_scripts/lib | PASS |
| No VITE_ in api endpoint | `grep -rn "VITE_" "api/guest/[id].js"` | NO_VITE_in_api | PASS |
| No VITE_ secrets in src/ | `grep -rn "VITE_" .env* src/` | One explanatory comment in .env.example only | PASS |
| App.jsx uses react-router (not react-router-dom) | `grep -q "from 'react-router'" src/App.jsx` | USES_react-router | PASS |
| Live endpoint 200/404/405 | Harness in 08-02-SUMMARY.md | 200 (Johnson Family), 404 (fake-id), 405 (POST) | PASS (live evidence) |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BACK-02 | 08-01-PLAN.md, 08-02-PLAN.md | Vercel serverless endpoint (Node runtime) validates/looks up a guest by id — the contract a future RSVP flow builds on | SATISFIED | `api/guest/[id].js` fully implemented with correct 200/404/405 behavior, Neon query, process.env only. Live-tested via harness. |
| BACK-03 | 08-02-PLAN.md | Signing secret and database URL are server-only env vars (never VITE_-prefixed; never present in client bundle) | SATISFIED | Zero VITE_ refs in src/. No import.meta.env in api/. `DATABASE_URL` in process.env only. Build passes cleanly at 366 kB with no secret leakage. |

Both BACK-02 and BACK-03 are marked Complete in REQUIREMENTS.md traceability table. Confirmed accurate.

---

### Locked Decision Audit (D-01 through D-10)

| Decision | Requirement | Status | Evidence |
|----------|-------------|--------|----------|
| D-02: No fetch on page load | useGuestName must not call api/guest/:id | HONORED | Zero `fetch(` in useGuestName.js |
| D-03: Fallback wording "Our Beloved Guests" | Default when no token/to= resolves | HONORED | Line 8 of useGuestName.js |
| D-04: Legacy ?to= preserved | Second resolution step after token | HONORED | Lines 22–29 of useGuestName.js |
| D-06: id-only lookup, no token verify, no scripts/lib in api/ | GET endpoint reads id from req.query | HONORED | No `scripts/lib` import, no token verification in endpoint |
| D-07: displayName from DB display_name | DB is source of truth | HONORED | `displayName: display_name` on line 39 |
| D-08: deleted_at IS NULL → 404 | Soft-deleted AND unknown both return 404 | HONORED | SQL filter on lines 30–31; 404 on rows.length === 0 |
| D-09: process.env only, no VITE_, no import.meta.env | Server-only secrets | HONORED | All checks pass |
| D-10: vercel.json api-first | /api/(.*) before /(.*) | HONORED | vercel.json index 0 = api, index 1 = SPA |

---

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder returns, empty handlers, or hardcoded empty data found in the phase files. No `import.meta.env` in src/. No secrets in client bundle.

---

### Human Verification Required

#### 1. Cold Deep-Link Routing (Criterion #4)

**Test:** After Phase 9 Vercel deploy, open `https://<deployed-domain>/i/<real-id>?t=<token>` in a completely fresh browser tab (incognito, no previous visit).
**Expected:** The SPA loads correctly and shows the personalized greeting for the guest — NOT a Vercel 404 or raw file-not-found.
**Why human:** The `vercel.json` SPA catch-all (`/(.*) → /index.html`) only executes on the Vercel CDN routing layer. Locally, Vite's dev server serves `index.html` for all paths in SPA mode regardless of vercel.json. The ordering of rewrites is correct in code, but the actual CDN behavior can only be confirmed after a live Vercel deploy. This deferral is explicitly documented in 08-02-SUMMARY.md and is expected — it is not a gap.

---

### Summary

Phase 8 fully achieves its goal. All four success criteria are met:

1. **Instant greeting, no network call** — `useGuestName.js` decodes the `?t=` token client-side via `decodeGuestToken`, with `?to=` as a dev fallback, and "Our Beloved Guests" as the final fallback. Zero fetch calls. GuestGreeting.jsx is unchanged and consumes the hook directly.

2. **Endpoint 200/404/405** — `api/guest/[id].js` is a clean Vercel Node serverless function with id-only Neon lookup, correct soft-delete filtering, and the displayName shape from DB display_name. Live harness results in 08-02-SUMMARY.md confirm all three response codes against the real Neon DB.

3. **No secret leakage** — VITE_ audit is clean across .env*, src/, and api/. DATABASE_URL lives only in process.env inside api/. The production bundle at 366 kB contains no secrets.

4. **vercel.json ordering** — /api/(.*) passthrough is correctly positioned before the /(.*) SPA catch-all. Cold-deploy behavior is the one item deferred to Phase 9 human verification, which is expected and documented.

All 33 tests pass. Production build succeeds. All locked decisions (D-02, D-06, D-07, D-08, D-09, D-10) are honored. Both BACK-02 and BACK-03 are satisfied.

---

_Verified: 2026-05-31_
_Verifier: Claude (gsd-verifier)_
