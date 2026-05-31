---
phase: 06-identity-token-contract
plan: "01"
subsystem: identity-token
tags: [token, hmac, security, contract, browser-safe, node-crypto]
dependency_graph:
  requires: []
  provides:
    - docs/identity-token-contract.md (locked URL/payload/signing/env contract)
    - scripts/lib/token.js (Node-side sign + verify exports)
    - src/lib/decodeGuestToken.js (browser-safe decode export)
  affects:
    - Phase 7: scripts/generate-links.js (imports scripts/lib/token.js sign())
    - Phase 8: api/ verify endpoint (imports scripts/lib/token.js verify()); useGuestName.js rewrite (imports decodeGuestToken)
tech_stack:
  added: []
  patterns:
    - HMAC-SHA256 via node:crypto createHmac + timingSafeEqual
    - base64url payload encoding (Buffer.from(JSON, 'utf8').toString('base64url'))
    - UTF-8-safe atob decode (decodeURIComponent(escape(atob(b64))) pattern)
    - TDD with node:test (no install; built-in)
key_files:
  created:
    - docs/identity-token-contract.md
    - scripts/lib/token.js
    - scripts/lib/token.test.js
    - src/lib/decodeGuestToken.js
    - src/lib/decodeGuestToken.test.js
    - scripts/check-token-url.js
  modified: []
decisions:
  - "HMAC-SHA256 via node:crypto (not jose/JWT) — zero-dep, sufficient for signing display names"
  - "Trust boundary enforced by file location: scripts/lib/ (Node+secret) vs src/lib/ (browser+secret-free)"
  - "base64url encoding for both payload and HMAC (URL-safe, no padding)"
  - "UTF-8-safe atob pattern (decodeURIComponent+escape) to handle unicode names like Mike & Sarah"
  - "atob() used in decodeGuestToken.js (available in browsers and Node 18+)"
  - "decodeGuestToken returns { id, name } only — iat deliberately excluded (informational only)"
metrics:
  duration: "4 minutes"
  completed_date: "2026-05-31"
  tasks_completed: 3
  files_created: 6
  files_modified: 0
---

# Phase 6 Plan 1: Identity Token Contract — Summary

**One-liner:** Locked HMAC-SHA256 token contract with Node sign/verify library and browser-safe secret-free decode utility, proven by 18 node:test assertions and a criterion-#4 harness.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write the locked identity-token contract document | ac0bd68 | docs/identity-token-contract.md |
| 2 | Build and test scripts/lib/token.js (Node sign/verify, Wave 0 suite) | 2254451 | scripts/lib/token.js, scripts/lib/token.test.js |
| 3 | Browser-safe decode util + criterion-#4 harness + build/VITE_ checks | e955e1a | src/lib/decodeGuestToken.js, src/lib/decodeGuestToken.test.js, scripts/check-token-url.js |

---

## What Was Built

### docs/identity-token-contract.md

The single locked source of truth for the durable per-guest link scheme. Documents:
- URL shape: `/i/<id>?t=<base64url-payload>.<base64url-hmac>`
- Payload schema: `{ id, name, iat }` with field semantics (id = opaque identity, name = UTF-8 display, iat = informational only, no expiry)
- HMAC-SHA256 signing algorithm and timing-safe comparison rationale
- Trust boundary split: `scripts/lib/` (Node+secret-bearing) vs `src/lib/` (browser-safe)
- Env-var naming: `GUEST_TOKEN_SECRET` + `DATABASE_URL` — NEVER `VITE_`-prefixed
- Fallback contract: null → "Our Beloved Guests"

### scripts/lib/token.js

Node-only, secret-bearing HMAC-SHA256 sign/verify library:
- `encodePayload(payload)` — base64url-encodes `{ id, name, iat }` as UTF-8 JSON
- `sign(payload, secret)` — returns `${base64urlPayload}.${base64urlHmac}` (the `t=` value)
- `verify(token, secret)` — timing-safe HMAC comparison via `crypto.timingSafeEqual`; never throws; guards all malformed inputs

### src/lib/decodeGuestToken.js

Browser-safe, secret-free payload decoder:
- `decodeGuestToken(token)` — extracts `{ id, name }` from the payload segment only; ignores the HMAC (no client secret)
- Uses `atob()` + UTF-8-safe `decodeURIComponent(escape(...))` for unicode name support
- Returns `null` on any malformed/missing input; never throws

### scripts/check-token-url.js

Throwaway criterion-#4 harness proving the end-to-end flow:
- Signs a sample `{ id, name: 'Mike & Sarah', iat }` payload and builds a crafted URL
- Decodes via `decodeGuestToken` (the browser util) — returns `{ name: 'Mike & Sarah' }`
- Decodes a malformed token `'broken'` — returns `null` (future fallback: "Our Beloved Guests")

---

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| Token lib suite | `node --test scripts/lib/token.test.js` | 9/9 PASS |
| Decode util suite | `node --test src/lib/decodeGuestToken.test.js` | 9/9 PASS |
| Criterion #4 harness | `node scripts/check-token-url.js` | PASS |
| VITE_ env discipline | `grep -rE "VITE_...(SECRET/TOKEN/DATABASE/URL)" src/` | 0 matches |
| Decode util secret-free | grep import.meta.env / process.env | CLEAN |
| Build intact | `npm run build` | green (133ms) |
| Scope check | useGuestName.js, main.jsx, no api/ | unchanged |

---

## Decisions Made

1. **HMAC-SHA256 via node:crypto** — zero runtime dependency; `jose` reserved for future RSVP session tokens only.
2. **Trust boundary by file location** — `scripts/lib/` is Node-only and secret-bearing; `src/lib/` is browser-importable and secret-free. This makes VITE_ leakage structurally impossible.
3. **base64url for both segments** — URL-safe (no `+`/`/` encoding issues in query params), no padding.
4. **UTF-8-safe atob pattern** — `decodeURIComponent(escape(atob(b64)))` correctly handles multi-byte unicode in display names without any polyfills.
5. **`atob()` chosen over `Buffer`** — `atob` is native in both browsers and Node 18+ (this project: Node 23); avoids a conditional shim.
6. **`iat` not returned by decodeGuestToken** — informational only; no display need. Future Phase 8 hook only needs `{ id, name }`.

---

## Deviations from Plan

None — plan executed exactly as written.

All 3 tasks implemented in order. No architectural changes, no new runtime dependencies, no scope creep into Phase 7/8 territory. The one minor adaptation was removing JSDoc comment text that included `process.env` and `import.meta.env` literally (the grep acceptance check would have matched comment text as false positives), replacing with equivalent prose that conveys the same constraint without triggering the grep.

---

## Known Stubs

None. This plan delivers spec + tested library code. No display stubs. The decode utility is intentionally standalone (not yet wired into the React app — that is Phase 8).

---

## Self-Check: PASSED

Files created exist:
- `docs/identity-token-contract.md` ✓
- `scripts/lib/token.js` ✓
- `scripts/lib/token.test.js` ✓
- `src/lib/decodeGuestToken.js` ✓
- `src/lib/decodeGuestToken.test.js` ✓
- `scripts/check-token-url.js` ✓

Commits exist:
- `ac0bd68` (docs/identity-token-contract.md) ✓
- `2254451` (scripts/lib/token.js + token.test.js) ✓
- `e955e1a` (src/lib/decodeGuestToken.js + test + check-token-url.js) ✓
