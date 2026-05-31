---
phase: 6
slug: identity-token-contract
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-31
---

# Phase 6 — Validation Strategy

> Per-phase validation contract. Phase 6 is unusually testable for this project:
> the core deliverable (`scripts/lib/token.js` sign/verify) is pure Node and
> directly unit-testable. The rest is grep-verifiable env/spec discipline plus a
> documented contract. Uses Node's built-in `node:test` (zero new deps).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in, Node 18+) — no install, ESM-native |
| **Config file** | none |
| **Quick run command** | `node --test scripts/lib/` |
| **Full suite command** | `node --test scripts/lib/` && `npm run build` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test scripts/lib/` (token lib) and/or the relevant grep check
- **After the wave:** `node --test scripts/lib/` + `npm run build` (ensure nothing broke the SPA build)
- **Before `/gsd:verify-work`:** token tests green + grep checks pass
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Requirement | Test Type | Automated Command | Status |
|---------|-------------|-----------|-------------------|--------|
| (planner-assigned) | LINK-02 | unit | `node --test scripts/lib/token.test.js` — asserts `verify(sign(p)) === true` | ⬜ pending |
| (planner-assigned) | LINK-02/03 | unit | same test asserts a mutated payload/hmac → `verify` returns `false` | ⬜ pending |
| (planner-assigned) | LINK-02/03 | unit | decode util returns `{id,name}` for valid token; returns null/falls back for malformed/missing | ⬜ pending |
| (planner-assigned) | LINK-01 | unit | token round-trips a unicode name (e.g. `Mike & Sarah`) via UTF-8 base64url | ⬜ pending |
| (planner-assigned) | BACK-03 (env) | grep | `! grep -rE "VITE_[A-Z_]*(SECRET\|TOKEN\|DATABASE\|URL)" .env* src/` → no secret-named VITE_ matches | ⬜ pending |
| (planner-assigned) | LINK-01/02 | doc/grep | contract doc exists and documents URL shape `/i/<id>?t=<payload>.<hmac>`, payload `{id,name,iat}`, `GUEST_TOKEN_SECRET`/`DATABASE_URL` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red*
*Planner owns final task IDs; this fixes the requirement→assertion mapping.*

---

## Wave 0 Requirements

- [ ] `scripts/lib/token.test.js` — `node:test` suite covering sign/verify round-trip, tamper-detection, and unicode round-trip (the framework is built-in; no install task needed)

*No package install required — `node:test` ships with Node.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crafted valid URL shows correct name; missing/malformed → "Our Beloved Guests" | LINK-03 (criterion #4) | No production hook wired this phase (deferred to Phase 8 per CONTEXT D-01) | Run the throwaway/manual decode harness against a sample token + a malformed token; confirm name vs fallback. NOT validated through the live app this phase. |

---

## Validation Sign-Off

- [ ] `scripts/lib/token.js` has a `node:test` suite (Wave 0) covering sign/verify + tamper + unicode
- [ ] Sampling continuity: token tests run after the lib task; grep checks after the env/doc task
- [ ] No watch-mode flags (`node --test` is one-shot)
- [ ] Feedback latency < 3s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
