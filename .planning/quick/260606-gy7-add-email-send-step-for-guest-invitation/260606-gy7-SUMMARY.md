---
phase: quick-260606-gy7
plan: 01
subsystem: scripts/email
tags: [email, nodemailer, gmail-smtp, idempotency, tdd]
dependency_graph:
  requires: [links.csv (from db:generate-links), Neon DB (guests table)]
  provides: [send-invites CLI, email-template module, invited_at DB column]
  affects: [scripts/migrate.js, package.json, .env.example]
tech_stack:
  added: [nodemailer@^8.0.10]
  patterns: [node:test TDD, idempotent invited_at tracking, fail-fast guards, table-based email HTML with inline styles]
key_files:
  created:
    - scripts/lib/email-template.js
    - scripts/lib/email-template.test.js
    - scripts/send-invites.js
  modified:
    - scripts/migrate.js
    - package.json
    - .env.example
    - package-lock.json
decisions:
  - "Inline styles in email-template.js are the one legitimate exception to CLAUDE.md no-inline-styles rule — email clients require table-based layouts with inline styles, not CSS Modules"
  - "invited_at set ONLY after confirmed SMTP success — a failed send never marks a guest as invited, enabling safe retry on next run"
  - "htmlEscape helper added to renderInvite for safe displayName rendering (handles & in names like 'Mike & Sarah')"
metrics:
  duration: 145s
  tasks_completed: 3
  files_changed: 7
  completed_date: "2026-06-06"
---

# Phase quick-260606-gy7 Plan 01: Email Send Step Summary

**One-liner:** Idempotent Gmail SMTP send-invites CLI with Nodemailer, pure renderInvite template module, and invited_at tracking column.

## What Was Built

### Task 1: Migration ALTER + env docs + npm script + nodemailer install

- `scripts/migrate.js`: Added `ALTER TABLE guests ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ` following the existing idempotent ALTER pattern after rsvp_submitted_at.
- `nodemailer@^8.0.10` installed as a runtime dependency.
- `package.json`: Added `"send-invites": "node --env-file=.env.local scripts/send-invites.js"` script after db:generate-links, matching the existing --env-file pattern.
- `.env.example`: Appended GMAIL_USER and GMAIL_APP_PASSWORD docs with clear comments explaining the App Password requirement.

Commit: `3abead6`

### Task 2: Pure email-template module + tests (TDD)

- `scripts/lib/email-template.test.js`: 5 node:test assertions written first (RED) — module-not-found failure confirmed before implementation.
- `scripts/lib/email-template.js`: Pure `renderInvite({ displayName, url })` function. Returns `{ subject, html, text }`. HTML uses table-based layout with inline styles (email-client-safe). Includes `htmlEscape` helper. Subject: "You're invited — Rina & Aaron". Body order: For {name} / Save the Date / Rina & Aaron / gold CTA button / footer. No date, no location, no Oahu, no 2027.
- All 5 tests pass (GREEN).

Commits: `5239b9c` (test RED), `a5185e3` (feat GREEN)

### Task 3: send-invites CLI

- `scripts/send-invites.js`: Full CLI mirroring generate-links.js style.
- Fail-fast guards for DATABASE_URL, GMAIL_USER, GMAIL_APP_PASSWORD, links.csv readability, and column validation (mirrors check-link.js EXPECTED_COLUMNS pattern).
- Per-row loop: looks up each guest by id in Neon; skips deleted_at (always); skips invited_at unless --resend; --dry-run prints WOULD email lines without sending or writing.
- `invited_at = now()` set ONLY after `transport.sendMail()` resolves — a caught error increments `failed` and leaves the guest un-marked for retry.
- Friendly summary at end for both dry-run and normal modes.
- Never references GUEST_TOKEN_SECRET.

Commit: `f7b01aa`

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 3abead6 | feat(quick-260606-gy7-01): migration ALTER + env docs + npm script + nodemailer install |
| Task 2 RED | 5239b9c | test(quick-260606-gy7-01): add failing tests for renderInvite email template |
| Task 2 GREEN | a5185e3 | feat(quick-260606-gy7-01): implement renderInvite pure email template |
| Task 3 | f7b01aa | feat(quick-260606-gy7-01): send-invites CLI for idempotent guest email delivery |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The email template renders real content from the inputs provided (no hardcoded empty values, no placeholder text that reaches rendering).

## User Setup Required (before running)

The following must be completed by the user before `npm run send-invites` will work:

1. **Run the migration** against the live Neon DB:
   ```
   npm run db:migrate
   ```
   This adds the `invited_at` column. Safe to re-run (idempotent).

2. **Generate a Gmail App Password** at Google Account -> Security -> 2-Step Verification -> App passwords. The account must have 2-Step Verification enabled. Generate a 16-character App Password for "Mail".

3. **Add credentials to .env.local**:
   ```
   GMAIL_USER=rinaaron5@gmail.com
   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

4. **Dry-run first** to verify links.csv looks correct:
   ```
   npm run send-invites -- --dry-run
   ```

5. **Send for real**:
   ```
   npm run send-invites
   ```

## Self-Check: PASSED

- FOUND: scripts/lib/email-template.js
- FOUND: scripts/lib/email-template.test.js
- FOUND: scripts/send-invites.js
- FOUND: scripts/migrate.js (with invited_at ALTER)
- FOUND: .env.example (with GMAIL_APP_PASSWORD)
- FOUND: package.json (with nodemailer + send-invites script)
- FOUND: commit 3abead6 (Task 1)
- FOUND: commit 5239b9c (Task 2 RED)
- FOUND: commit a5185e3 (Task 2 GREEN)
- FOUND: commit f7b01aa (Task 3)
- node --test scripts/lib/email-template.test.js: 5/5 pass
