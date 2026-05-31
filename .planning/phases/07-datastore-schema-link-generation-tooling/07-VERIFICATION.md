---
phase: 07-datastore-schema-link-generation-tooling
verified: 2026-05-31T22:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Open a URL from links.csv in a browser"
    expected: "Guest name appears in the 'For [Guest Name]' greeting (Phase 8 hook not yet wired, so this is future — valid pending Phase 8)"
    why_human: "Phase 8 endpoint and useGuestId hook are out of scope for Phase 7; browser resolution requires Phase 8 deployment"
---

# Phase 7: Datastore Schema & Link-Generation Tooling — Verification Report

**Phase Goal:** Guests can receive a real shareable link — the Neon Postgres guest table exists, and the local script can mint a batch of valid, durable, personalized URLs from a CSV.

**Verified:** 2026-05-31
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `guests` table DDL contains all 9 locked columns (id, display_name, email, created_at, first_seen_at, deleted_at, rsvp_status, rsvp_count, rsvp_submitted_at) plus `email TEXT UNIQUE` and `deleted_at TIMESTAMPTZ` additive columns per CONTEXT D-06 | ✓ VERIFIED | `scripts/migrate.js` lines 22–44: CREATE TABLE defines all 9 + additive ALTER statements for each |
| 2  | Running `generate-links.js` against a test CSV inserts guest rows and outputs `links.csv` with one valid personalized URL per kept row | ✓ VERIFIED | 07-03-SUMMARY.md live-run table: "4 link(s) written to links.csv. 0 row(s) skipped." — all 4 rows from guests.example.csv processed |
| 3  | A URL from `links.csv` decodes via `decodeGuestToken` to the correct guest name (end-to-end token round-trip) | ✓ VERIFIED | 07-03-SUMMARY.md live-run: `PASS: "The Johnson Family" (id UZiJA4i6JIMON-BA1YwUd) decoded from links.csv URL` — column validation passed |
| 4  | `guests.csv`, `links.csv`, and `.env.local` never appear in `git status` or `git log` | ✓ VERIFIED | `.gitignore` lines 30–31 cover `guests.csv` and `links.csv`; line 13 `*.local` covers `.env.local`. `git check-ignore -v` confirmed all three. Git log shows no private data in any commit. |

**Score:** 4/4 truths verified

---

## Roadmap Success Criteria (Granular)

### SC-1: Schema columns

**Claim:** `guests` table has `id TEXT PRIMARY KEY` (nanoid ~21 chars), `display_name`, `created_at`, `first_seen_at`, nullable RSVP stub columns (`rsvp_status`, `rsvp_count`, `rsvp_submitted_at`); locked CONTEXT decisions add `email TEXT UNIQUE` and `deleted_at TIMESTAMPTZ`.

**Evidence — `scripts/migrate.js` DDL (lines 22–34):**

```sql
CREATE TABLE IF NOT EXISTS guests (
  id                TEXT PRIMARY KEY,
  display_name      TEXT NOT NULL,
  email             TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_seen_at     TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  rsvp_status       TEXT,
  rsvp_count        INTEGER,
  rsvp_submitted_at TIMESTAMPTZ
)
```

All 9 locked columns confirmed. Additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements present for `email`, `deleted_at`, `first_seen_at`, `rsvp_status`, `rsvp_count`, `rsvp_submitted_at`. **PASS.**

### SC-2: Live link generation

**Claim:** `node scripts/generate-links.js` inserts guest rows and outputs `links.csv`.

**Evidence (07-03-SUMMARY.md live-run):**
- `npm run db:migrate` ran twice; both exits 0 — idempotent confirmed.
- `npm run db:generate-links` with 4-row CSV: "4 link(s) written to links.csv. 0 row(s) skipped."
- Re-run id preservation confirmed: `UZiJA4i6JIMON-BA1YwUd` matched before and after second run.
- Soft-delete confirmed: `smiths@example.com` row had `deleted_at` set; id and row preserved. **PASS.**

### SC-3: URL decode round-trip

**Claim:** A URL from `links.csv` resolves to the correct guest name via `decodeGuestToken` (Phase 6 browser util).

**Evidence (07-03-SUMMARY.md live-run):**
- `node scripts/check-link.js` output: `PASS: "The Johnson Family" (id UZiJA4i6JIMON-BA1YwUd) decoded from links.csv URL`
- Column validation passed (`id`, `display_name`, `email`, `url` — no missing, no extra).
- `decoded.name === row.display_name` AND `decoded.id === row.id` both asserted in `check-link.js` logic. **PASS.**

### SC-4: Git safety

**Claim:** `guests.csv`, `links.csv`, `.env.local` never in git.

**Evidence:**
- `.gitignore` line 13: `*.local` (covers `.env.local`)
- `.gitignore` lines 30–31: `guests.csv`, `links.csv` (explicit entries under "Private guest data" section)
- `git check-ignore -v` (from 07-03-SUMMARY.md): all three confirmed covered.
- Full git log inspection: no commits touch `guests.csv`, `links.csv`, or `.env.local`.
- `.env.example` contains only placeholder values; no VITE_ prefix on any var. **PASS.**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/migrate.js` | Idempotent Neon DDL for guests table | ✓ VERIFIED | Exists, 47 lines, all 9 columns, additive ALTERs, fail-fast guard, `node --check` passes |
| `scripts/generate-links.js` | CSV → upsert → soft-delete → sign → links.csv | ✓ VERIFIED | Exists, 157 lines, imports `sign` from `./lib/token.js`, `shapeRows`/`buildLinkUrl` from `./lib/links.js`, `ON CONFLICT (email) DO UPDATE`, soft-delete via `<> ALL(::text[])` |
| `scripts/check-link.js` | End-to-end decode + column validation | ✓ VERIFIED | Exists, imports `decodeGuestToken` from `../src/lib/decodeGuestToken.js`, validates 4 columns, asserts `decoded.name === row.display_name` |
| `scripts/lib/links.js` | Pure helpers: normalizeEmail, shapeRows, computeSoftDeletes, buildLinkUrl | ✓ VERIFIED | Exists, zero imports (no DB/crypto), all 4 exports present |
| `scripts/generate-links.test.js` | 15-test node:test suite for pure helpers | ✓ VERIFIED | 15/15 tests pass; imports only `./lib/links.js` |
| `.gitignore` | blocks `guests.csv`, `links.csv` | ✓ VERIFIED | Lines 30–31 explicit; `*.local` on line 13 covers `.env.local` |
| `scripts/guests.example.csv` | Committed fake-data CSV with `display_name,email` header | ✓ VERIFIED | Header `display_name,email`, 4 fake rows including quoted values and UTF-8 |
| `.env.example` | Documents `GUEST_TOKEN_SECRET`, `DATABASE_URL`, `SITE_BASE_URL` — no VITE_ prefix | ✓ VERIFIED | All 3 vars present; no VITE_ prefix anywhere |
| `package.json` | `@neondatabase/serverless`, `nanoid` deps; `csv-parse` devDep; `db:migrate`, `db:generate-links` scripts | ✓ VERIFIED | `neon@^1.1.0`, `nanoid@^5.1.11`, `csv-parse@^6.2.1`; both db: scripts with `--env-file=.env.local` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/generate-links.js` | `scripts/lib/token.js sign()` | `import { sign } from './lib/token.js'` | ✓ WIRED | Line 16; sign() called at line 98 with locked `{ id, name, iat }` payload |
| `scripts/generate-links.js` | `scripts/lib/links.js helpers` | `import { shapeRows, buildLinkUrl } from './lib/links.js'` | ✓ WIRED | Line 17; shapeRows called line 64; buildLinkUrl called line 100 |
| `scripts/check-link.js` | `src/lib/decodeGuestToken.js` | `import { decodeGuestToken } from '../src/lib/decodeGuestToken.js'` | ✓ WIRED | Line 13; decodeGuestToken called line 76 |
| `scripts/migrate.js` | `process.env.DATABASE_URL` | `neon(process.env.DATABASE_URL)` | ✓ WIRED | Line 16; fail-fast guard at lines 9–14 |
| `scripts/generate-links.js` | Neon DB (upsert + soft-delete) | `neon(process.env.DATABASE_URL)` | ✓ WIRED | `ON CONFLICT (email) DO UPDATE` at line 88; soft-delete `<> ALL(::text[])` at lines 113–119 |

---

## CONTEXT Decision Compliance (D-01..D-09)

| Decision | Requirement | Status | Evidence |
|----------|-------------|--------|----------|
| D-01/D-02: `display_name,email` CSV header; email in links.csv, NOT in token | Email in output CSV, never in token payload `{ id, name, iat }` | ✓ | `sign({ id, name: row.display_name, iat: ... }, secret)` — no `email` key; email present in `out.push` |
| D-03: Blank display_name rows skipped with line number warning | `shapeRows` skips blank names, logs 1-based line number | ✓ | `links.js` lines 43–45; `generate-links.js` lines 66–68 |
| D-04: Email-keyed upsert preserving id | `SELECT id` before INSERT; existing id reused, new `nanoid()` only for new emails | ✓ | `generate-links.js` lines 85–94; `id` NOT in `DO UPDATE SET` clause |
| D-05: Soft-delete (not hard delete) via `deleted_at` | `UPDATE SET deleted_at = now() WHERE email <> ALL(...)` | ✓ | `generate-links.js` lines 113–119 |
| D-06: Schema includes `email TEXT UNIQUE` and `deleted_at TIMESTAMPTZ` additive columns | Both in CREATE TABLE DDL + additive ALTERs | ✓ | `migrate.js` lines 27,29,39,40 |
| D-07: `SITE_BASE_URL` configurable, clearly-marked placeholder if unset | `process.env.SITE_BASE_URL` passed to `buildLinkUrl`; fallback `REPLACE-ME-SET-SITE_BASE_URL.example` | ✓ | `generate-links.js` line 100; `links.js` line 84 |
| D-08: Idempotent migration via `@neondatabase/serverless` HTTP driver; no Pool | `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`; no Pool import | ✓ | `migrate.js` confirmed; `grep -i Pool` clean |
| D-09: `.gitignore` covers `guests.csv`, `links.csv`, `.env*` | Lines 13, 30, 31 in `.gitignore` | ✓ | Confirmed by `git check-ignore -v` |

---

## Test Suite Results

Run: `node --test scripts/generate-links.test.js scripts/lib/token.test.js src/lib/decodeGuestToken.test.js`

```
tests 33 | pass 33 | fail 0 | cancelled 0 | skipped 0
```

- `generate-links.test.js`: 15/15 pass (normalizeEmail: 2, shapeRows: 5, computeSoftDeletes: 4, buildLinkUrl: 4)
- `token.test.js`: 9/9 pass
- `decodeGuestToken.test.js`: 9/9 pass (no regressions from Phase 6)

---

## Data-Flow Trace (Level 4)

These are CLI scripts (not React components); data flows from CSV → DB → CSV output, not from React state. Level 4 data-flow trace adapted accordingly.

| Script | Data Source | Produces Real Data | Status |
|--------|-------------|-------------------|--------|
| `scripts/generate-links.js` | `readFileSync(csvPath)` → `csv-parse` → `neon()` SQL upsert | Yes — live Neon DB confirmed by 07-03-SUMMARY.md live run | ✓ FLOWING |
| `scripts/migrate.js` | `neon(DATABASE_URL)` → DDL execution | Yes — two idempotent runs both exited 0 | ✓ FLOWING |
| `scripts/check-link.js` | `readFileSync('links.csv')` → `decodeGuestToken` | Yes — PASS output confirmed with real token decode | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Test suite passes with 33/33 | `node --test scripts/generate-links.test.js scripts/lib/token.test.js src/lib/decodeGuestToken.test.js` | 33 pass, 0 fail | ✓ PASS |
| All three scripts parse as valid ESM | `node --check scripts/migrate.js scripts/generate-links.js scripts/check-link.js` | Exit 0 | ✓ PASS |
| gitignore covers all three private files | `git check-ignore -v guests.csv links.csv .env.local` | All three matched | ✓ PASS |
| Token payload never includes email | `grep "sign(" scripts/generate-links.js` | `sign({ id, name: row.display_name, iat: ... }, secret)` — no email key | ✓ PASS |
| `id` NOT in `ON CONFLICT DO UPDATE SET` | Grep upsert clause | Only `display_name` and `deleted_at = NULL` in UPDATE SET | ✓ PASS |
| Live DB migration idempotent | 07-03-SUMMARY.md: two runs, both Exit 0 | Confirmed | ✓ PASS (live evidence) |
| Live link generation + decode | 07-03-SUMMARY.md: `PASS: "The Johnson Family" (id UZiJA4i6JIMON-BA1YwUd)` | Confirmed | ✓ PASS (live evidence) |
| Re-run id preservation | 07-03-SUMMARY.md: same id `UZiJA4i6JIMON-BA1YwUd` before and after re-run | Confirmed | ✓ PASS (live evidence) |
| Soft-delete sets deleted_at, preserves row | 07-03-SUMMARY.md: `[SOFT-DELETED (deleted_at=Sun May 31 2026)] Dr. & Mrs. Smith` row confirmed | Confirmed | ✓ PASS (live evidence) |

---

## Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| BACK-01 | 07-01, 07-02, 07-03 | Neon Postgres guest record keyed on opaque `id`, nullable RSVP fields, no migration needed when RSVP ships | ✓ SATISFIED | `migrate.js` DDL with all 9 columns; live Neon run confirmed in 07-03-SUMMARY; id preservation across re-runs confirmed |
| LINK-04 | 07-01, 07-02, 07-03 | Local link-generation script mints per-guest links from a guest list; guest list and signing secret never committed | ✓ SATISFIED | `generate-links.js` + `check-link.js` implemented; `guests.csv` and `links.csv` gitignored; GUEST_TOKEN_SECRET never committed; live PASS confirmed |

REQUIREMENTS.md traceability table updated: both BACK-01 and LINK-04 marked `Phase 7 | Complete`.

No orphaned requirements detected for Phase 7.

---

## Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `scripts/lib/links.js` line 84 | `const PLACEHOLDER = 'https://REPLACE-ME-SET-SITE_BASE_URL.example'` | ℹ Info | NOT a stub — this is the intentional, clearly-marked fallback host for when `SITE_BASE_URL` is not yet configured (CONTEXT D-07). The value flows to URL output only when the real domain is absent, and is documented as "regenerate after Phase 9 deployment". |

No blocking or warning anti-patterns found. The `PLACEHOLDER` constant is intentional behavior documented in CONTEXT D-07, the 07-03-SUMMARY.md, and flagged with a console.warn in the script itself.

---

## Human Verification Required

### 1. Browser URL Resolution (Phase 8 dependency — expected not-yet-working)

**Test:** Take a URL from `links.csv` (once `SITE_BASE_URL` is set to the live Vercel domain after Phase 9), open it in a browser.
**Expected:** Guest name "The Johnson Family" appears as the personalized greeting.
**Why human:** Phase 8 (`/i/:id` route + `api/guest/[id].js` endpoint) is not yet built. The URLs in `links.csv` currently use the `REPLACE-ME-SET-SITE_BASE_URL.example` placeholder host because Phase 9 deployment hasn't occurred. This is intentional and explicitly deferred. The token decode logic (check-link.js PASS) proves the token is correctly formed; the browser greeting is a Phase 8/9 concern, not a Phase 7 gap.

---

## Gaps Summary

None. All four observable truths are verified. All artifacts exist, are substantive, and are correctly wired. The live Neon run (documented in 07-03-SUMMARY.md) confirms end-to-end DB behavior. The test suite is 33/33 green. Git safety is confirmed. All CONTEXT decisions D-01 through D-09 are honored.

The only "human needed" item is the browser greeting, which is a Phase 8/9 deliverable and explicitly out of scope for Phase 7 per 07-CONTEXT.md.

---

_Verified: 2026-05-31_
_Verifier: Claude (gsd-verifier)_
