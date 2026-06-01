---
phase: 08-frontend-hook-api-endpoint
plan: 01
subsystem: frontend
tags: [hook, routing, token-decode, guest-personalization, react-router]
dependency_graph:
  requires: [src/lib/decodeGuestToken.js, src/main.jsx]
  provides: [token-first guest name resolution, /i/:id durable route]
  affects: [src/components/GuestGreeting.jsx]
tech_stack:
  added: []
  patterns: [token-first URL resolution, client-side decode without fetch]
key_files:
  created: []
  modified:
    - src/hooks/useGuestName.js
    - src/App.jsx
decisions:
  - "Token-first resolution: ?t= decoded via decodeGuestToken (client-side, no network), then ?to= legacy fallback, then 'Our Beloved Guests'"
  - "document.title set only when a real name resolves — default title left untouched when no token/to param"
  - "Routes added to App.jsx with /i/:id (durable identity) and /* catch-all — both render SaveTheDatePage"
  - "MotionConfig retained as outermost wrapper so all page animations inherit reduced-motion config"
metrics:
  duration: "70s"
  completed_date: "2026-06-01"
  tasks: 2
  files_modified: 2
---

# Phase 8 Plan 1: Frontend Hook & Route Wiring Summary

**One-liner:** Token-first guest name resolution in useGuestName (decodeGuestToken → ?to= → fallback) with /i/:id and /* Routes in App.jsx — instant greeting, zero network call.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite useGuestName for token-first resolution | 1c52aae | src/hooks/useGuestName.js |
| 2 | Add Routes block to App.jsx (/i/:id and catch-all) | d4e6790 | src/App.jsx |

## What Was Built

**Task 1 — useGuestName token-first resolution:**

Extended `src/hooks/useGuestName.js` in place (D-01) with three-step resolution:
1. Read `?t=` param → call `decodeGuestToken(t)` (browser-safe, no HMAC secret needed) → use `decoded.name` if non-null
2. Fall back to `?to=` legacy dev/preview shortcut (D-04) → use trimmed string if non-empty
3. Fall back to `"Our Beloved Guests"` (D-03 wording)

`document.title` is set to `"Save the Date – For {name}"` only when `hasName` is true (D-03). Default title left unchanged when no name resolves. No fetch, no `import.meta.env`, no `scripts/lib` import. Return shape `{ name, hasName }` preserved so `GuestGreeting.jsx` stays unchanged.

**Task 2 — App.jsx Routes block:**

Added `import { Routes, Route } from 'react-router'` (NOT react-router-dom — project convention). Wrapped `SaveTheDatePage` in:
```jsx
<MotionConfig reducedMotion="user">
  <Routes>
    <Route path="/i/:id" element={<SaveTheDatePage />} />
    <Route path="/*" element={<SaveTheDatePage />} />
  </Routes>
</MotionConfig>
```
`MotionConfig` remains the outermost wrapper. Both routes render the same `SaveTheDatePage` — the greeting differs by what `useGuestName` resolves from `?t=` / `?to=`. `main.jsx` not touched (BrowserRouter already there).

## Verification Results

- `node --check src/hooks/useGuestName.js` — PASS
- `grep` assertions for decodeGuestToken import, both resolution steps, fallback wording, no scripts/lib, no import.meta.env, no fetch — all PASS
- `node --test src/lib/decodeGuestToken.test.js` — 9/9 PASS (decode layer intact)
- `grep` assertions for react-router import, Routes, Route, path="/i/:id", MotionConfig — all PASS
- `! grep react-router-dom src/App.jsx` — PASS
- `grep -rn "VITE_" src/` — no matches (no secret leaks)
- `npm run build` — PASS (366 kB bundle, 117 kB gzip)

## Deviations from Plan

**1. [Rule 1 - Bug] node --check does not support .jsx extension**
- **Found during:** Task 2 verify
- **Issue:** `node --check src/App.jsx` exits non-zero with `ERR_UNKNOWN_FILE_EXTENSION` for `.jsx` files — Node cannot syntax-check JSX natively.
- **Fix:** Accepted as a Node limitation (not an actual syntax error). The Vite build (`npm run build`) serves as the definitive syntax + import verification for JSX files, and it passed cleanly. All grep assertions for App.jsx passed independently.
- **Files modified:** None (deviation is in verify method, not code)

## Known Stubs

None. Both modified files are fully wired: `useGuestName` decodes real tokens, `App.jsx` renders real routes with real components.

## Self-Check: PASSED

Files exist:
- src/hooks/useGuestName.js — FOUND
- src/App.jsx — FOUND

Commits exist:
- 1c52aae (Task 1) — FOUND
- d4e6790 (Task 2) — FOUND
