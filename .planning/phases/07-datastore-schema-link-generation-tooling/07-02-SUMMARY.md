---
phase: 07-datastore-schema-link-generation-tooling
plan: "02"
subsystem: scripts/lib
tags: [tdd, pure-functions, node-test, link-generation, unit-tests]
dependency_graph:
  requires: []
  provides: [scripts/lib/links.js, scripts/generate-links.test.js]
  affects: [scripts/generate-links.js (plan 07-03 imports these helpers)]
tech_stack:
  added: []
  patterns: [node:test TDD RED-GREEN, pure ESM named exports, no-import unit-testable helpers]
key_files:
  created:
    - scripts/lib/links.js
    - scripts/generate-links.test.js
    - scripts/lib/token.js
    - scripts/lib/token.test.js
  modified: []
decisions:
  - "normalizeEmail is a standalone helper — same function used in shapeRows, computeSoftDeletes, and plan 07-03 upsert to prevent email casing duplicates"
  - "shapeRows 1-based line numbering: CSV header = line 1, first data row = line 2 (index + 2)"
  - "buildLinkUrl placeholder string is 'REPLACE-ME-SET-SITE_BASE_URL' to be unmistakably obvious in output CSV"
  - "computeSoftDeletes normalizes both input arrays defensively via normalizeEmail for consistency"
  - "scripts/lib/token.js and token.test.js added to worktree (Phase 6 deliverable not yet on this branch)"
metrics:
  duration: 2min
  completed_date: "2026-05-31"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
requirements: [BACK-01, LINK-04]
---

# Phase 07 Plan 02: Pure Link Helper Functions Summary

**One-liner:** Four pure, DB-free ESM helper functions (normalizeEmail, shapeRows, computeSoftDeletes, buildLinkUrl) proven by 15 node:test unit tests with zero database required.

## What Was Built

`scripts/lib/links.js` — pure, DB-free, crypto-free helper module:

- `normalizeEmail(email)` — trim + lowercase; shared normalization used everywhere email is keyed
- `shapeRows(rawRows)` — skip blank `display_name` rows with 1-based line numbers; normalize emails on kept rows; return `{ rows, skipped }`
- `computeSoftDeletes(activeCsvEmails, dbActiveEmails)` — compute soft-delete targets: DB-active emails absent from current CSV
- `buildLinkUrl(id, token, baseUrl)` — build locked `/i/<id>?t=<token>` URL; strip trailing slashes; use placeholder host when `SITE_BASE_URL` is unset

`scripts/generate-links.test.js` — 15 node:test unit tests (no DB, no network):
- normalizeEmail: 2 tests
- shapeRows: 5 tests (blank-name skip, line numbers, middle-row skip, email normalization)
- computeSoftDeletes: 4 tests (partial delete, empty DB, empty CSV, exact match)
- buildLinkUrl: 4 tests (clean URL, trailing-slash strip, undefined baseUrl, empty baseUrl)

`scripts/lib/token.js` and `scripts/lib/token.test.js` — Phase 6 library added to this worktree branch.

## TDD Execution

**RED (Task 1):** `scripts/generate-links.test.js` created and confirmed failing (links.js missing). Commit: `69747c9`

**GREEN (Task 2):** `scripts/lib/links.js` implemented; all 15 tests pass. Commit: `00bfac0`

## Verification Results

```
node --test scripts/generate-links.test.js
  tests 15 | pass 15 | fail 0

node --test scripts/lib/token.test.js
  tests 9 | pass 9 | fail 0  (no regression)
```

Grep clean — `scripts/lib/links.js` has zero imports (no DB driver, no crypto):
```
grep "^import" scripts/lib/links.js  →  (no output)
```

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| normalizeEmail is a standalone exported helper | Shared normalization prevents email casing duplicates in upsert (D-04, Pitfall 3) |
| 1-based line numbers: `i + 2` | Header = line 1 in a real CSV; first data row at index 0 = line 2 |
| PLACEHOLDER string = `REPLACE-ME-SET-SITE_BASE_URL` | Clearly visible in output CSV; unmissable when domain not yet configured |
| Defensive normalization in computeSoftDeletes | Both input arrays normalized to prevent casing mismatches in soft-delete diff |

## Deviations from Plan

### Auto-added

**[Rule 2 - Missing Critical Functionality] Added scripts/lib/token.js and token.test.js to worktree**
- **Found during:** Task 1 setup
- **Issue:** The worktree branch was forked before Phase 6 commits; `scripts/` directory did not exist in worktree
- **Fix:** Copied token.js and token.test.js from main branch into worktree so plan 07-03 has the correct sibling module and existing tests remain runnable
- **Files modified:** scripts/lib/token.js, scripts/lib/token.test.js
- **Commit:** 69747c9

## Known Stubs

None. All four functions are fully implemented and tested. Plan 07-03 (`generate-links.js`) will import these helpers to wire them to the database, but the helpers themselves are complete.

## Self-Check: PASSED

- [x] `scripts/lib/links.js` exists
- [x] `scripts/generate-links.test.js` exists
- [x] Task 1 commit `69747c9` exists
- [x] Task 2 commit `00bfac0` exists
- [x] 15/15 tests pass; 9/9 token tests pass (no regression)
