---
phase: quick-260602-nu0
plan: "01"
subsystem: guest-personalization
tags: [guest-name, fetch, abort-safe, db-authoritative, tdd]
dependency_graph:
  requires: [api/guest/[id].js, src/lib/decodeGuestToken.js]
  provides: [src/lib/fetchGuestDisplayName.js, src/hooks/useGuestName.js (async)]
  affects: [src/components/GuestGreeting.jsx (backward compatible)]
tech_stack:
  added: []
  patterns: [abort-controller, active-flag, id-scoped-override-state]
key_files:
  created:
    - src/lib/fetchGuestDisplayName.js
    - src/lib/fetchGuestDisplayName.test.js
  modified:
    - src/hooks/useGuestName.js
decisions:
  - "Track dbOverride as { id, displayName } instead of bare displayName — avoids synchronous setState in effect (ESLint react-hooks/set-state-in-effect) while still clearing stale names on tokenId change"
  - "No setDbName(null) synchronous call in effect — stale validation done inline via dbOverride.id === tokenId comparison"
metrics:
  duration: "~2 minutes"
  completed: "2026-06-02"
  tasks_completed: 2
  files_changed: 3
requirements: [GUEST-DB-SOT]
---

# Quick Task 260602-nu0: Wire Frontend to Fetch Authoritative Guest Name Summary

**One-liner:** Abort-safe async DB override in useGuestName: renders token name instantly, replaces with /api/guest/:id displayName on 200, silently keeps token name on any failure.

## What Was Built

### src/lib/fetchGuestDisplayName.js (new)

Pure async helper: `fetchGuestDisplayName(id, { signal } = {}) -> Promise<string | null>`.

- Guards empty/non-string id (no fetch called)
- Wraps entire fetch in try/catch — never throws
- Returns displayName string only on HTTP 200 with non-empty string displayName
- Returns null on 404/500/network error/AbortError/JSON parse failure
- Passes signal through to native fetch for cancellation support

### src/lib/fetchGuestDisplayName.test.js (new)

10 node:test cases covering every null path and the happy path:
200 ok, 404, 500, network error, empty id (no fetch), null id (no fetch), 200 with no displayName, 200 with empty displayName, JSON parse failure, already-aborted signal.

### src/hooks/useGuestName.js (modified)

Upgraded from synchronous-only to async-with-instant-render:

- Synchronous block still resolves tokenName/tokenId/hasName instantly
- `dbOverride` state tracks `{ id, displayName }` — scoped to the tokenId it was fetched for
- `dbName = dbOverride && dbOverride.id === tokenId ? dbOverride.displayName : null` — validates match, rejects stale overrides without synchronous setState in effect
- Effect keyed on `tokenId`: aborts in-flight request + ignores stale responses via AbortController + `active` flag
- Legacy `?to=` and no-token paths: tokenId is null, no fetch performed
- document.title follows resolved name (token name first, DB name once loaded)
- Return shape: `{ name, hasName, resolved }` — backward compatible, `resolved` is additive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restructured dbName state to avoid ESLint react-hooks/set-state-in-effect**

- **Found during:** Task 2 eslint verification
- **Issue:** Plan called for `setDbName(null)` as the first line of the tokenId effect — ESLint rule `react-hooks/set-state-in-effect` forbids synchronous setState calls inside effect bodies (causes cascading renders).
- **Fix:** Changed state shape from bare `dbName: string|null` to `dbOverride: { id, displayName }|null`. Validation happens inline via `dbOverride.id === tokenId` — stale overrides are automatically invalidated when tokenId changes without any synchronous setState call.
- **Files modified:** src/hooks/useGuestName.js
- **Commit:** 2e5c80b

All plan requirements are satisfied:
- Instant render via tokenName (dbOverride starts null)
- DB name shown once fetched and valid
- Stale responses ignored (both by `active` flag and by id mismatch check)
- AbortController cancels in-flight requests on tokenId change / unmount
- Legacy ?to= / no-token: no fetch
- document.title follows resolved name
- Return shape backward compatible

## Known Stubs

None. fetchGuestDisplayName calls the real /api/guest/:id endpoint. No mock data or placeholder values in the render path.

## Self-Check: PASSED

Files exist:
- src/lib/fetchGuestDisplayName.js — FOUND
- src/lib/fetchGuestDisplayName.test.js — FOUND
- src/hooks/useGuestName.js — FOUND (modified)

Commits exist:
- 5e30e86 — test(quick-260602-nu0-01): failing tests — FOUND
- 4e044ef — feat(quick-260602-nu0-01): fetchGuestDisplayName helper — FOUND
- 2e5c80b — feat(quick-260602-nu0-01): rewire useGuestName — FOUND

Tests: 10/10 pass (`node --test src/lib/fetchGuestDisplayName.test.js`)
ESLint: clean (`npx eslint src/hooks/useGuestName.js`)
Build: success (`npm run build`)
