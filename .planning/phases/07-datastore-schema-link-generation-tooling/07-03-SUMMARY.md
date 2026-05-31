---
phase: 07-datastore-schema-link-generation-tooling
plan: 03
subsystem: scripts
tags: [neon, postgres, link-generation, csv, token, soft-delete, id-preservation]
dependency_graph:
  requires: ["07-01", "07-02", "06-01"]
  provides: ["scripts/generate-links.js", "scripts/check-link.js", "links.csv (runtime artifact)"]
  affects: ["Phase 8 API endpoint", "Phase 9 deploy (SITE_BASE_URL re-generation)"]
tech_stack:
  added: []
  patterns:
    - "Two-step upsert: SELECT id by email → nanoid() if new → INSERT ... ON CONFLICT DO UPDATE"
    - "Soft-delete via array exclusion: UPDATE ... WHERE email <> ALL(${emails}::text[]) AND deleted_at IS NULL"
    - "ESM top-level await scripts with node --env-file=.env.local (zero dotenv dep)"
    - "scripts→src import direction (allowed): check-link.js imports decodeGuestToken from src/lib/"
key_files:
  created:
    - scripts/generate-links.js
    - scripts/check-link.js
  modified: []
decisions:
  - "No SITE_BASE_URL in .env.local — links use REPLACE-ME placeholder; must regenerate after Phase 9 deployment"
  - "Soft-delete confirmed live against Neon: deleted_at timestamp set on removed CSV row, id and row preserved"
  - "check-link.js requires no secret (decodeGuestToken is browser-safe HMAC-verify via atob); node --env-file not needed"
metrics:
  duration: "4 minutes (live run only; Tasks 1 & 2 committed in prior agent session)"
  completed: "2026-05-31"
  tasks: 3
  files: 2
---

# Phase 7 Plan 03: Link-Generation Scripts + Live Neon Run Summary

**One-liner:** CSV-to-Neon upsert chain with id preservation, soft-delete sync, HMAC-signed links, and end-to-end decode verification against a live Neon Postgres DB.

## What Was Built

### Task 1 (committed 9d32a06): scripts/generate-links.js

Full CSV → Neon upsert → soft-delete sync → signed URL → links.csv pipeline. Key design:

- **Fail-fast guards**: exits 1 with a clear human-readable message if `DATABASE_URL` or `GUEST_TOKEN_SECRET` is unset
- **Header normalization**: `columns: (h) => h.map(x => x.trim().toLowerCase())` handles any CSV header casing
- **Two-step id-preserving upsert**: SELECT id by normalized email first; use existing id or mint a new nanoid; then INSERT … ON CONFLICT (email) DO UPDATE SET display_name, deleted_at = NULL
- **Locked token payload**: `{ id, name, iat }` only — email is never in the token (identity-token-contract.md §2)
- **Soft-delete sync**: after the upsert loop, `UPDATE guests SET deleted_at = now() WHERE email <> ALL(${activeEmails}::text[]) AND deleted_at IS NULL`
- **links.csv output**: 6-line inline csvEscape helper; exact column order `id,display_name,email,url`
- **SITE_BASE_URL guard**: prints a warning if unset (links get placeholder host REPLACE-ME.example)

### Task 2 (committed 60b98e7): scripts/check-link.js

End-to-end decode harness with no secret dependency:

- Reads links.csv, validates exactly the 4 expected columns (`id`, `display_name`, `email`, `url`)
- Extracts `t=` param from first row URL via `new URL(…).searchParams.get('t')`
- Decodes via `decodeGuestToken` (imported from `src/lib/decodeGuestToken.js` — scripts→src direction, allowed)
- Asserts `decoded.name === row.display_name` AND `decoded.id === row.id`
- Exit 0 on PASS, exit 1 with diagnostic output on any failure

### Task 3: Live Neon Run

Executed against the user-provisioned Neon Postgres DB with DATABASE_URL in `.env.local`.

## Live Run Results

### Migration (db:migrate)

- **Run 1:** Exit 0 — "Migration complete: guests table ready."
- **Run 2:** Exit 0 — "Migration complete: guests table ready." (idempotent — CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS — no errors on second run)

### Link Generation (db:generate-links)

Input: `guests.csv` copied from `scripts/guests.example.csv` (4 rows: The Johnson Family, Mike & Sarah, The García Family, Dr. & Mrs. Smith)

Output:
- **4 link(s) written to links.csv. 0 row(s) skipped.**
- Columns confirmed exactly: `id,display_name,email,url`
- SITE_BASE_URL unset → placeholder host `REPLACE-ME.example` in all URLs (expected; regenerate post Phase 9)

### End-to-End Decode Check (check-link.js)

```
PASS: "The Johnson Family" (id UZiJA4i6JIMON-BA1YwUd) decoded from links.csv URL
```

Column validation passed (exactly `id`, `display_name`, `email`, `url`). decodeGuestToken round-tripped correctly: name and id both matched the CSV row.

### Id Preservation (re-run idempotency)

Re-ran `npm run db:generate-links` against the same 4-row CSV. First-row id before: `UZiJA4i6JIMON-BA1YwUd`. First-row id after: `UZiJA4i6JIMON-BA1YwUd`. **ID PRESERVED** — confirmed same id across re-runs. All 4 rows preserved existing ids.

### Soft-Delete Verification

Removed `Dr. & Mrs. Smith` (smiths@example.com) from guests.csv and re-ran generate-links. Output: "3 link(s) written to links.csv." Direct Neon query confirmed:

```
[ACTIVE] The Johnson Family <johnsons@example.com> id=UZiJA4i6JIMON-BA1YwUd
[ACTIVE] Mike & Sarah <mike.sarah@example.com> id=x8EG_dQ05HZktkwiU_aqJ
[ACTIVE] The García Family <garcia@example.com> id=O8HGTk71wZJ_FTfAxvd_y
[SOFT-DELETED (deleted_at=Sun May 31 2026 ...)] Dr. & Mrs. Smith <smiths@example.com> id=39CyeTZwdOE584QpUhGAB
```

Soft-delete row preserved its id and row; deleted_at was set. The link for smiths@example.com remains in the DB for future audit/resolution.

### Git Safety

```
git status --short   → only .planning/ROADMAP.md (tracked file, no private data)
git check-ignore -v guests.csv links.csv .env.local
  .gitignore:30:guests.csv    guests.csv
  .gitignore:31:links.csv     links.csv
  .gitignore:13:*.local       .env.local
```

All three private-data files are gitignored and never appeared in git status. Confirmed.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- **links.csv URLs use placeholder host** `REPLACE-ME.example` because `SITE_BASE_URL` is not set in `.env.local`. This is intentional and documented — regenerate links.csv after Phase 9 deployment once the live Vercel domain is known.

## Requirements Fulfilled

- **BACK-01**: Real guest rows in Neon with id preserved across re-runs, soft-delete synced
- **LINK-04**: Mint links from CSV; signing secret + guest list never committed; URL decodes to correct name; links.csv has exactly `id,display_name,email,url` columns

## Self-Check: PASSED

- scripts/generate-links.js: FOUND
- scripts/check-link.js: FOUND
- 07-03-SUMMARY.md: FOUND
- Commit 9d32a06 (generate-links.js): FOUND
- Commit 60b98e7 (check-link.js): FOUND
