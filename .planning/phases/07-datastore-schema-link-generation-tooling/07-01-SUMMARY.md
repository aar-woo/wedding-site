---
phase: 07-datastore-schema-link-generation-tooling
plan: 01
subsystem: datastore
tags: [neon, postgres, migration, git-safety, dependencies]
dependency_graph:
  requires: []
  provides: [scripts/migrate.js, scripts/guests.example.csv, .env.example]
  affects: [package.json, .gitignore]
tech_stack:
  added: ["@neondatabase/serverless@^1.1.0", "nanoid@^5.1.11", "csv-parse@^6.2.1"]
  patterns: ["neon() HTTP tagged-template driver", "node --env-file=.env.local zero-dep env loading", "CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS idempotent migration"]
key_files:
  created:
    - scripts/migrate.js
    - scripts/guests.example.csv
    - .env.example
  modified:
    - package.json
    - .gitignore
    - package-lock.json
decisions:
  - "Use deleted_at TIMESTAMPTZ (not is_active BOOLEAN) for soft-delete — self-documenting timestamp, idiomatic WHERE deleted_at IS NULL filter"
  - "node --env-file=.env.local over dotenv — zero extra dependency, Node 20+ built-in, fully supported on Node v23"
  - "first_seen_at column reserved nullable — population is Phase 8 endpoint responsibility, never minted at link-gen time"
metrics:
  duration: "2m 22s"
  completed: "2026-05-31T19:39:06Z"
  tasks_completed: 3
  files_changed: 5
requirements_satisfied: [BACK-01, LINK-04]
---

# Phase 7 Plan 01: Datastore Foundation — Deps, Git-Safety, and Migration Summary

**One-liner:** Neon Postgres `guests` table migration via `@neondatabase/serverless` HTTP driver, with git-safety gitignore entries, fake-data example CSV, and zero-dep `.env.local` loading.

## What Was Built

### Task 1: Dependencies + Script Shorthands + .env.example (commit: 1371af4)

- Installed `@neondatabase/serverless@^1.1.0` and `nanoid@^5.1.11` as production dependencies (both will be reused by the Phase 8 Vercel Function)
- Installed `csv-parse@^6.2.1` as a devDependency (local tooling only, not deployed)
- Added `db:migrate` and `db:generate-links` script shorthands to `package.json` using `node --env-file=.env.local` (Node 20+ built-in, zero extra deps)
- Created `.env.example` documenting `GUEST_TOKEN_SECRET`, `DATABASE_URL`, and `SITE_BASE_URL` — all without `VITE_` prefix per the identity token contract

### Task 2: Git-Safety + Example CSV (commit: 3e0b689)

- Appended `guests.csv` and `links.csv` to `.gitignore` (private guest data must never enter git history)
- Created `scripts/guests.example.csv` with committed fake data — exercises quoted fields (`"Mike & Sarah"`), UTF-8 (`The García Family`), and documents the `display_name,email` header format
- `.env.local` remains covered by the existing `*.local` pattern (no redundant entry added)

### Task 3: Idempotent Neon Migration (commit: d742d77)

- Created `scripts/migrate.js` — ESM, top-level await, `@neondatabase/serverless` HTTP driver
- Creates `guests` table with all 9 locked schema columns (BACK-01)
- Additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for idempotency on older schema versions
- Fail-fast guard with human-readable error if `DATABASE_URL` is unset
- Does NOT touch `first_seen_at` (Phase 8 responsibility)
- No `Pool`, no migration framework

## Success Criteria Check

| Criterion | Status |
|-----------|--------|
| `@neondatabase/serverless`, `nanoid`, `csv-parse` installed | PASS |
| `db:migrate` and `db:generate-links` scripts in package.json | PASS |
| `.gitignore` blocks `guests.csv` and `links.csv` | PASS |
| `scripts/guests.example.csv` committed with correct header | PASS |
| `scripts/migrate.js` passes `node --check` | PASS |
| `scripts/migrate.js` contains `CREATE TABLE IF NOT EXISTS guests` | PASS |
| All 9 locked columns present in DDL | PASS |
| `ADD COLUMN IF NOT EXISTS` additive ALTERs present | PASS |
| Fail-fast guard for missing `DATABASE_URL` | PASS |
| No `VITE_` prefix on any env var in `.env.example` | PASS |
| No `Pool`, no `first_seen_at` population in migration | PASS |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 1371af4 | chore(07-01): add Phase 7 dependencies and db:* script shorthands |
| Task 2 | 3e0b689 | chore(07-01): add git-safety for guest data and committed example CSV |
| Task 3 | d742d77 | feat(07-01): add idempotent Neon migration script for guests table |

## Deviations from Plan

**1. [Rule 3 - Blocking] Merged main into worktree branch before executing**
- **Found during:** Pre-execution setup
- **Issue:** The agent worktree branch (`worktree-agent-ae09598b4268fb262`) was behind `main` by ~20 commits — the Phase 6 scripts (`scripts/lib/token.js`, etc.) and Phase 7 planning files did not exist in the worktree, blocking all tasks
- **Fix:** `git merge main --no-edit` (fast-forward) to bring the worktree up to date
- **Impact:** None to plan — all Phase 7 files were present after merge; no plan content changed

No other deviations.

## Known Stubs

None — this plan creates tooling scripts and config, not UI components. No data-flow stubs introduced.

## Self-Check: PASSED

- `scripts/migrate.js` — FOUND
- `scripts/guests.example.csv` — FOUND
- `.env.example` — FOUND
- Commit 1371af4 — FOUND
- Commit 3e0b689 — FOUND
- Commit d742d77 — FOUND
