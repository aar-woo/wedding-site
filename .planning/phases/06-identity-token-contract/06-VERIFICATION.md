---
phase: 06-identity-token-contract
verified: 2026-05-31T00:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 6: Identity Token Contract — Verification Report

**Phase Goal:** The URL shape, token payload format, env var naming, and sign/verify library are locked and tested before any dependent code is written — changing these after links are issued forces re-minting every URL
**Verified:** 2026-05-31
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | URL shape, payload schema, signing algorithm, and env-var naming are written in one locked contract document | VERIFIED | `docs/identity-token-contract.md` contains all 6 required literal strings: `/i/<id>`, `{ id, name, iat }`, `HMAC-SHA256`, `GUEST_TOKEN_SECRET`, `DATABASE_URL`, `Our Beloved Guests` |
| 2 | `scripts/lib/token.js` produces a signed token where `verify(sign(payload)) === true` | VERIFIED | `node --test scripts/lib/token.test.js` — 9/9 pass; round-trip test is explicit |
| 3 | A tampered payload or signature makes `verify()` return false | VERIFIED | Tests 2 and 3 in token.test.js cover payload-segment and hmac-segment mutation independently; both exit 0 |
| 4 | A unicode display name (`Mike & Sarah`) survives the full sign -> decode round-trip | VERIFIED | Test 5 in token.test.js; Test 2 in decodeGuestToken.test.js; criterion-#4 harness output confirms `"name":"Mike & Sarah"` |
| 5 | Browser-safe decode util returns `{ id, name }` for a valid token and `null` for missing/malformed — with no secret and no network | VERIFIED | `node --test src/lib/decodeGuestToken.test.js` — 9/9 pass; no `process.env` or `import.meta.env` in the file; does not import `scripts/lib/token.js` |
| 6 | No `VITE_`-prefixed secret-named env var exists in `src/` | VERIFIED | `grep -rE "VITE_[A-Z_]*(SECRET\|TOKEN\|DATABASE\|URL)" src/` — 0 matches |
| 7 | Vite build still succeeds after adding the browser decode util to `src/` | VERIFIED | `npm run build` exits 0 in 134ms, 434 modules transformed |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected (min lines) | Lines | Status | Details |
|----------|----------------------|-------|--------|---------|
| `docs/identity-token-contract.md` | Locked contract prose with required literals | 188 | VERIFIED | All 6 required literal strings present; LOCKED status stated; explains re-issue consequence; states `iat` informational only; documents `VITE_` prohibition rationale |
| `scripts/lib/token.js` | sign/verify/encodePayload, HMAC-SHA256, no hardcoded secret (min 40) | 71 | VERIFIED | Exports `sign`, `verify`, `encodePayload`; uses `createHmac('sha256', ...)` and `timingSafeEqual`; secret is a function argument only |
| `scripts/lib/token.test.js` | node:test suite — round-trip, tamper x2, wrong-secret, unicode, no-throw (min 30) | 91 | VERIFIED | 9 tests: round-trip, payload tamper, hmac tamper, wrong-secret, unicode, no-dot, empty, non-string, encodePayload |
| `src/lib/decodeGuestToken.js` | Browser-safe, secret-free, returns `{id,name}` or null (min 20) | 59 | VERIFIED | Secret-free; no `process.env`; no `import.meta.env`; no import of `scripts/lib/token.js`; UTF-8-safe atob pattern |
| `src/lib/decodeGuestToken.test.js` | node:test suite — valid, malformed, missing (min 20) | 83 | VERIFIED | 9 tests covering all required failure modes; confirms `iat` is not exposed in result |
| `scripts/check-token-url.js` | Criterion-#4 harness — valid token -> name, malformed -> null, prints PASS | 64 | VERIFIED | Prints `CRITERION #4: PASS` and exits 0; covers valid, malformed, and missing token cases |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/lib/token.js` | `node:crypto` | `createHmac('sha256', secret)` + `timingSafeEqual` | WIRED | Both imports present on line 1; `createHmac('sha256'` on line 19; `timingSafeEqual` on line 67 |
| `src/lib/decodeGuestToken.js` | token.js payload format | base64url-decode payload segment — no HMAC verify, no secret | WIRED | `b64.replace(/-/g, '+').replace(/_/g, '/')` + `atob` + `decodeURIComponent(escape(...))` + `JSON.parse` on lines 35-41 |
| `scripts/check-token-url.js` | `src/lib/decodeGuestToken.js` + `scripts/lib/token.js` | Signs a sample, decodes via browser util, checks name equality | WIRED | Both imports present; `sign` called, `decodeGuestToken` called on `tParam`, equality asserted before exit |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase produces a signing library, a decode utility, a contract document, and test harnesses — no React components or UI rendering. Data-flow trace (component -> state -> API -> DB) is not relevant.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| sign/verify round-trip passes | `node --test scripts/lib/token.test.js` | 9/9 pass, exit 0 | PASS |
| Tamper-detection (payload + hmac mutation) | Tests 2 & 3 in token.test.js | both return false, 0 failures | PASS |
| Decode util: valid -> {id,name}; malformed -> null | `node --test src/lib/decodeGuestToken.test.js` | 9/9 pass, exit 0 | PASS |
| Criterion #4 harness | `node scripts/check-token-url.js` | `CRITERION #4: PASS`, exit 0 | PASS |
| Vite build intact | `npm run build` | exit 0, 134ms, 434 modules | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LINK-01 | 06-01-PLAN.md | Each guest has a durable, unguessable per-guest link built on an opaque stable `id`; the `id` is the permanent identity a future RSVP reuses | SATISFIED | Contract locks the opaque `id` field in the payload schema; `id` round-trips through `sign` -> `encodePayload` -> `decodeGuestToken` intact; `check-token-url.js` uses `randomUUID()` as the id |
| LINK-02 | 06-01-PLAN.md | Guest display name travels in the link as an HMAC-signed payload and is decoded client-side with no network round-trip | SATISFIED | `scripts/lib/token.js` HMAC-signs the payload containing `name`; `src/lib/decodeGuestToken.js` decodes client-side with no fetch/network call; unicode round-trip proven by tests |
| LINK-03 | 06-01-PLAN.md | Invalid, tampered, or unknown links fall back gracefully to "Our Beloved Guests" greeting — never an error screen | SATISFIED | `decodeGuestToken` returns `null` on all malformed inputs (never throws); contract Section 6 documents the `null` -> "Our Beloved Guests" mapping; 7 of 9 decode tests exercise the null fallback path |

All three LINK-01..03 requirements assigned to Phase 6 in `REQUIREMENTS.md` traceability table are SATISFIED.

No orphaned requirements: the traceability table maps LINK-01, LINK-02, LINK-03 to Phase 6 and all three are claimed by 06-01-PLAN.md.

---

### Scope Integrity (Intentional Absences)

The following are correctly absent per the phase's explicit out-of-scope constraints (D-01..D-06, context decisions). They are NOT gaps.

| Item | Expected Phase | Status |
|------|---------------|--------|
| `src/hooks/useGuestName.js` rewrite | Phase 8 | Absent — unchanged (0 new references) |
| `/i/:id` route in `src/main.jsx` | Phase 8 | Absent — unchanged (0 new references) |
| `scripts/generate-links.js` | Phase 7 | Absent (correct) |
| `api/` directory or any endpoint | Phase 8 | Absent (correct) |
| `vercel.json` | Phase 8 | Absent (correct) |
| New runtime dependencies (nanoid, jose, @neondatabase) | Never | Absent — `package.json` unchanged |

Trust-boundary split confirmed: `src/lib/decodeGuestToken.js` does NOT import `scripts/lib/token.js`, reads no secret env vars, and contains no `process.env` or `import.meta.env` references.

---

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder returns, empty handlers, or hardcoded empty state in any phase artifact. The decode util's `return null` paths are deliberate, documented fallback contracts — not stubs.

---

### Human Verification Required

None. All acceptance criteria are fully automatable and verified programmatically. The phase produces no UI, no visual output, and no external service integration.

---

## Summary

Phase 6 goal is fully achieved. The identity-token contract is locked in a citable document before any dependent code is written, exactly as required. The sign/verify library and browser-safe decode utility are tested (18 assertions across two suites), the trust boundary between Node-only and browser-safe code is enforced structurally, env-var discipline is confirmed clean, and the Vite build is unaffected. All three assigned requirements (LINK-01, LINK-02, LINK-03) are satisfied. No scope creep into Phase 7/8 territory.

---

_Verified: 2026-05-31_
_Verifier: Claude (gsd-verifier)_
