---
phase: 8
slug: frontend-hook-api-endpoint
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `08-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) — existing project pattern; NO React test runner added (no new UI components) |
| **Config file** | none — tests run directly via `node --test` |
| **Quick run command** | `grep -rn "VITE_" .env* src/` (secret audit — instant) |
| **Full suite command** | `node --test src/lib/decodeGuestToken.test.js scripts/lib/token.test.js scripts/generate-links.test.js` |
| **Estimated runtime** | ~3 seconds (unit); endpoint harness needs live Neon (`.env.local`) |

---

## Sampling Rate

- **After every task commit:** `grep -rn "VITE_" .env* src/` → must show zero secret matches (BACK-03)
- **After every plan wave:** `node --test src/lib/decodeGuestToken.test.js scripts/lib/token.test.js` (decode + token layers still green)
- **Before `/gsd:verify-work`:** endpoint harness 200/404/405 against live Neon + browser greeting smoke (token / `?to=` / fallback) + `grep -r "VITE_"` clean
- **Max feedback latency:** ~3s (unit/grep); endpoint + browser checks at the phase gate

---

## Per-Task Verification Map

> Task IDs assigned by the planner. Rows map each requirement to its verification.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | hook | 1 | BACK-02 | static | `node --check src/hooks/useGuestName.js` + `grep "decodeGuestToken" src/hooks/useGuestName.js` | ✅ exists (modified) | ⬜ pending |
| TBD | hook | 1 | BACK-02 | manual | Browser: `/?t=<real-token>` → name; `/?to=Test+Name` → "Test Name"; `/` → "Our Beloved Guests" | N/A | ⬜ pending |
| TBD | routes | 1 | BACK-02 | static/manual | `grep -E "path=\"/i/:id\"" src/App.jsx`; open `http://localhost:5173/i/abc` → page loads | ✅ exists (modified) | ⬜ pending |
| TBD | endpoint | 1 | BACK-02 | integration | `node --env-file=.env.local scripts/test-guest-endpoint.js <real-id>` → HTTP 200 `{id,displayName}` | ❌ W0 harness | ⬜ pending |
| TBD | endpoint | 1 | BACK-02 | integration | `node --env-file=.env.local scripts/test-guest-endpoint.js fake-id` → HTTP 404 `{error:"not found"}` | ❌ W0 harness | ⬜ pending |
| TBD | endpoint | 1 | BACK-02 | unit | harness with `req.method='POST'` → HTTP 405 | ❌ W0 harness | ⬜ pending |
| TBD | endpoint | 1 | BACK-03 | static | `grep -n "process.env" api/guest/[id].js` (reads DATABASE_URL via process.env, not import.meta.env) | ❌ W0 endpoint | ⬜ pending |
| TBD | vercel | 1 | BACK-02 | static | `vercel.json` rewrites: `/api/(.*)` index < `/(.*)` index (api passthrough FIRST) | ❌ W0 vercel.json | ⬜ pending |
| TBD | audit | 1 | BACK-03 | grep | `grep -rn "VITE_" .env* src/` → zero secret matches; `grep -rn "import.meta.env" src/` → no secret reads | N/A (command) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/guest/[id].js` — the Vercel Node function under test (BACK-02)
- [ ] `vercel.json` — rewrite ordering under test (BACK-02 / criterion #4)
- [ ] `scripts/test-guest-endpoint.js` — throwaway Node harness importing the handler with fake req/res to prove 200/404/405 locally without Vercel CLI (NOT committed long-term; or commit as a documented dev tool — planner's call)

*Existing: `src/lib/decodeGuestToken.test.js` (9 tests) covers the decode layer the hook reuses — no new decode tests needed. `useGuestName` resolution is 6 lines of sync logic; validated by browser smoke (no React test runner added — see research recommendation).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Greeting renders instantly with no network call on page load | BACK-02 (criterion #1) | "No network call" is a runtime/DevTools observation | Open `/i/<id>?t=<token>` (or `/?t=<token>`) in browser; confirm name appears immediately; DevTools Network shows no `/api/guest` request on load |
| `useGuestName` resolution across all 3 paths | BACK-02 | No React test runner in project (intentional) | `/?t=<real-token>` → decoded name; `/?to=Test+Name` → "Test Name"; `/` → "Our Beloved Guests" |
| `vercel.json` deep-link routing (`/i/:id` cold nav → SPA, not 404) | BACK-02 (criterion #4) | Only exercised on Vercel; not testable without deploy | Verify in Phase 9 after deploy; locally Vite dev serves index.html for `/i/:id` (SPA default) |
| Endpoint 200/404 against live data | BACK-02 (criterion #2) | Requires live Neon DB | `node --env-file=.env.local scripts/test-guest-endpoint.js <id>` with a real id (200) and fake id (404) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies or are listed as manual-only with instructions
- [ ] Sampling continuity: no 3 consecutive tasks without an automated/grep check
- [ ] Wave 0 covers the endpoint + vercel.json + harness
- [ ] No watch-mode flags
- [ ] Feedback latency < ~3s (unit/grep)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
