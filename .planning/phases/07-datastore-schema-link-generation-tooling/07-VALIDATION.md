---
phase: 7
slug: datastore-schema-link-generation-tooling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `07-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` (built-in) + `node:assert/strict` |
| **Config file** | none — tests run directly via `node --test` |
| **Quick run command** | `node --test scripts/lib/token.test.js` (existing, fast, no DB needed) |
| **Full suite command** | `node --test scripts/**/*.test.js src/**/*.test.js` |
| **Estimated runtime** | ~3 seconds (unit); end-to-end check requires Neon DB + links.csv |

---

## Sampling Rate

- **After every task commit:** Run `node --test scripts/lib/token.test.js`
- **After every plan wave:** Run `node --test scripts/**/*.test.js src/**/*.test.js`
- **Before `/gsd:verify-work`:** Full suite green + `node --env-file=.env.local scripts/check-link.js` passes (requires Neon DB + generated links.csv)
- **Max feedback latency:** ~3 seconds (unit tests; DB-dependent checks run at wave/phase gates)

---

## Per-Task Verification Map

> Task IDs are assigned by the planner. Rows below map each phase requirement to its verification; the planner/executor binds them to concrete task IDs.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | migrate | 1 | BACK-01 | integration | `node --env-file=.env.local scripts/migrate.js` (exit 0, all columns present) | ❌ W0 `scripts/migrate.js` | ⬜ pending |
| TBD | migrate | 1 | BACK-01 | integration | run `migrate.js` twice → no error (idempotent) | ❌ W0 `scripts/migrate.js` | ⬜ pending |
| TBD | generate | 2 | BACK-01 | unit | `node --test scripts/generate-links.test.js` — upsert-preserves-id | ❌ W0 `scripts/generate-links.test.js` | ⬜ pending |
| TBD | generate | 2 | BACK-01 | unit | `node --test scripts/generate-links.test.js` — soft-delete sync sets `deleted_at` | ❌ W0 `scripts/generate-links.test.js` | ⬜ pending |
| TBD | generate | 2 | LINK-04 | unit | `node --test scripts/generate-links.test.js` — blank display_name skipped + warned | ❌ W0 `scripts/generate-links.test.js` | ⬜ pending |
| TBD | generate | 2 | LINK-04 | e2e | `node --env-file=.env.local scripts/check-link.js` — URL from links.csv decodes to correct name | ❌ W0 `scripts/check-link.js` | ⬜ pending |
| TBD | generate | 2 | LINK-04 | automated | `node scripts/check-link.js` validates links.csv columns (id, display_name, email, url) | ❌ W0 `scripts/check-link.js` | ⬜ pending |
| TBD | gitsafety | 1 | LINK-04 | git | `git status --short \| grep -E 'guests.csv\|links.csv\|.env.local'` → no output | ❌ W0 `.gitignore` edit | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/migrate.js` — idempotent DDL migration (CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS) for BACK-01
- [ ] `scripts/generate-links.js` — main link-generation script (CSV → upsert → links.csv) for BACK-01 / LINK-04
- [ ] `scripts/check-link.js` — end-to-end URL → `decodeGuestToken` check (success criterion #3) for LINK-04
- [ ] `scripts/generate-links.test.js` — unit tests: upsert-preserves-id, soft-delete sync, blank-name skip
- [ ] `scripts/guests.example.csv` — committed fake-data CSV (documents format; safe to commit)
- [ ] `.gitignore` additions: `guests.csv`, `links.csv`

*Existing: `scripts/lib/token.test.js` covers token round-trip — no gap. `src/lib/decodeGuestToken.js` reused by `check-link.js`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Neon DB provisioned + `DATABASE_URL` set | BACK-01 | Requires user account action (provision Neon via Vercel Marketplace / Neon console) before any DB script can run | User provisions Neon, copies connection string into `.env.local` as `DATABASE_URL`; run `node --env-file=.env.local scripts/migrate.js` and confirm exit 0 |
| Generated URL renders correct name in a real browser | LINK-04 | Browser render is outside the Node test harness | Paste a `url` from `links.csv` into a browser once Phase 8 wiring exists; for Phase 7, `scripts/check-link.js` proves the decode equivalently |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < ~3s (unit)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
