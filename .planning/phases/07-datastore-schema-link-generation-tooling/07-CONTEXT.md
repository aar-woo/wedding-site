# Phase 7: Datastore Schema & Link-Generation Tooling - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the persistent guest datastore and the local tooling that mints real, durable, personalized links. This phase delivers, against requirements **BACK-01** and **LINK-04**:

1. A **Neon Postgres `guests` table** (provisioned + migrated) keyed on the opaque `id`, with nullable RSVP stub columns so the future RSVP flow needs no migration.
2. A local **`scripts/generate-links.js`** that reads a guest CSV, inserts/updates guest rows in Neon, signs a token per row via the Phase 6 `scripts/lib/token.js`, and writes a `links.csv` of personalized URLs.
3. **Git-safety**: the guest list and the signing secret are never committed.

**In scope:** Neon provisioning + `CREATE TABLE` migration, the link-generation script (CSV → DB → links.csv), nanoid `id` minting, token signing (reuse Phase 6 lib), `.gitignore` coverage, a committed fake-data sample CSV.

**NOT in scope (later phases):**
- `src/hooks/useGuestName.js` rewrite + `/i/:id` route — **Phase 8**
- `api/guest/[id].js` serverless endpoint + `vercel.json` — **Phase 8**
- Live Vercel deploy + production env vars + mobile polish — **Phase 9**
- RSVP form/flow — future milestone (this phase only reserves the columns)

</domain>

<decisions>
## Implementation Decisions

### Guest CSV input shape
- **D-01:** `guests.csv` has two columns with a header row: `display_name` and `email`. `display_name` is the greeting text (e.g. `The Johnson Family`, `Mike & Sarah` — unicode/`&` already round-trips through the Phase 6 token lib).
- **D-02:** `email` is carried through to the output `links.csv` (so it doubles as a mail-merge sheet: name, email, url) **and** is stored in Neon — see D-06. Email is NOT placed in the token payload (payload stays the locked `{ id, name, iat }`).
- **D-03:** A row with a blank/empty `display_name` is **skipped with a warning** (print the line number, continue the run). Forgiving for a hand-edited CSV; one typo does not abort a large batch.

### Re-run / idempotency behavior
- **D-04:** Re-running `generate-links.js` is **upsert keyed on `email`**: an existing email keeps its existing `id` (the link stays valid) and updates `display_name` if it changed; a new email mints a fresh nanoid `id`. This prevents the naive "fresh nanoid every run → duplicate every guest" failure mode and makes issued links durable across guest-list edits.
- **D-05:** A guest present in Neon but **no longer in the CSV is soft-deleted**, not hard-deleted: mark the row inactive (e.g. `deleted_at TIMESTAMPTZ` nullable, or `is_active BOOLEAN` — planner's choice) so the `id` and its already-distributed link still resolve, but the guest drops out of the "active" list. Re-run still "mirrors the CSV," non-destructively. **Hard DELETE was explicitly rejected** because it would silently break a link already sent to that guest.

### Schema (extends the success-criteria columns)
- **D-06:** The `guests` table includes, beyond the success-criteria columns (`id TEXT PRIMARY KEY` = nanoid ~21 chars, `display_name`, `created_at`, `first_seen_at`, nullable `rsvp_status` / `rsvp_count` / `rsvp_submitted_at`), two **additive** columns required by the re-run model: `email TEXT UNIQUE` (nullable) as the stable upsert key, and a soft-delete marker (`deleted_at` / `is_active`, D-05). Additive columns are fine — only the *token contract* is frozen, not the table shape.

### Claude's Discretion (areas not selected for discussion — defaults below; flag if wrong)
- **Link base URL (D-07):** The deployed domain is not final until Phase 9. Make the host **configurable via a `SITE_BASE_URL` env var** (read from `.env.local`); if unset, emit a clearly-marked placeholder host so `links.csv` is trivially regenerable once the Phase 9 domain is known. URL path is the locked `/i/<id>?t=<base64url-payload>.<base64url-hmac>`.
- **Neon provisioning (D-08):** User provisions the Neon database (standalone Neon project or via Vercel Marketplace) and places `DATABASE_URL` in `.env.local`. Schema is applied via a **committed, idempotent migration** (`CREATE TABLE IF NOT EXISTS`, plus `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for the additive columns) run with `@neondatabase/serverless` (HTTP driver — no TCP pool, serverless-safe). **This requires a user action** (provision DB + supply `DATABASE_URL`) before the script can run end-to-end.
- **Git-safety (D-09):** `.gitignore` covers `guests.csv`, `links.csv` (it effectively contains the whole guest list + names), and `.env*`. Commit a fake-data **`guests.example.csv`** so the script is runnable/documented and success criterion #2's "test CSV" is satisfied without committing real data.
- **ID normalization:** nanoid default alphabet, ~21 chars; treat `id` as case-sensitive as generated (nanoid is URL-safe). `email` keying should be normalized (trim + lowercase) to avoid duplicate rows from casing differences.
- Dependencies to add: `nanoid ^5.1.x` and `@neondatabase/serverless` (and optionally `csv-parse ^5.6.x` as a devDep, or hand-roll parsing for a small CSV — planner's choice).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked contract (binding — changing it forces re-issuing every link)
- `docs/identity-token-contract.md` — URL shape `/i/<id>?t=<payload>.<hmac>`, payload `{ id, name, iat }`, HMAC-SHA256 signing, env-var naming, trust boundary. §3 signing, §5 env vars, §7 implementation files are most relevant here.

### Phase 6 deliverables this phase reuses
- `scripts/lib/token.js` — `sign(payload, secret)` / `verify(token, secret)` / `encodePayload()` (Node-only, secret-bearing). The link-gen script imports `sign()`. **Do not duplicate signing logic.**
- `scripts/lib/token.test.js` — existing node:test patterns to mirror for any new tests.
- `src/lib/decodeGuestToken.js` — browser-safe decode used for the end-to-end check (success criterion #3): a generated URL's `t=` must decode to the right name.

### Milestone research (binding technical guidance)
- `.planning/research/SUMMARY.md` — §"Conflict 1" resolves datastore to **Neon Postgres** (overrides STACK.md's Upstash Redis); §"Link Generation" data flow; Phase 2 (= this phase) build notes.
- `.planning/research/ARCHITECTURE.md` — §"Pattern 4: Neon Postgres", §"Data Flow → Link Generation (admin, local)", §"Build Order" steps 3–4, recommended `scripts/` structure, `@neondatabase/serverless` HTTP driver.
- `.planning/research/STACK.md` — §5 link-generation tooling, nanoid/csv-parse versions. **NOTE: its datastore recommendation (Upstash Redis) is superseded by Neon — see SUMMARY.md Conflict 1.**
- `.planning/research/PITFALLS.md` — Pitfall 3 (guessable/sequential IDs → use nanoid), Pitfall 4 (non-durable link scheme), UX row on ID case-normalization, the "Looks Done But Isn't" checklist (guest-list never committed, link portability), Pitfall-to-Phase mapping row "Non-technical link minting" (couple can run it from a CSV with zero dev help).

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — **BACK-01** (Neon guest record keyed on `id`, nullable RSVP fields) and **LINK-04** (local link-gen script; guest list + secret never committed) are THIS phase.
- `.planning/ROADMAP.md` §"Phase 7" — goal + 4 success criteria (the schema column list and the four pass/fail checks).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/lib/token.js` — `sign(payload, secret)` already produces the locked `<payload>.<hmac>` token. The link-gen script builds `{ id, name: display_name, iat }`, calls `sign()`, and assembles `/i/<id>?t=<token>`. Zero new signing code.
- `src/lib/decodeGuestToken.js` — used to assert success criterion #3 (generated URL → correct name) without standing up the Phase 8 hook.
- `scripts/check-token-url.js` — existing throwaway harness showing the URL-build + decode round-trip; a useful reference pattern for an end-to-end check.

### Established Patterns
- ESM project (`"type": "module"`); scripts use `import`. `node:crypto` is built-in. New deps: `nanoid` (ESM-only v5, fine here), `@neondatabase/serverless`.
- Trust boundary (Phase 6): secret-bearing code lives in `scripts/` (Node + `process.env.GUEST_TOKEN_SECRET`); `src/` stays secret-free. The link-gen script and migration are `scripts/` — they may read secrets. **Never import `scripts/lib/token.js` into `src/`.**
- node:test is the established test runner (see existing `*.test.js`).

### Integration Points
- `.env.local` (gitignored) holds `GUEST_TOKEN_SECRET` (from Phase 6 convention) and the new `DATABASE_URL`, plus optional `SITE_BASE_URL`. No `VITE_` prefix on any of them.
- The `id` minted here is the durable identity Phase 8's `/i/:id` route + `api/guest/[id].js` look up, and the value a future RSVP keys on.
- Output `links.csv` is the artifact the couple pastes into invitation/email tooling.

</code_context>

<specifics>
## Specific Ideas

- The guest list (`guests.csv`) and the generated `links.csv` are private data — both gitignored. A committed `guests.example.csv` with fake rows documents the format and lets anyone run the script safely.
- Durable links are the whole point: the email-keyed upsert (D-04) + soft-delete (D-05) exist specifically so that editing the guest list and re-running never invalidates a link already in a guest's inbox.
- The script should be runnable by a non-developer from a CSV with no code edits (PITFALLS "Non-technical link minting") — clear console output, friendly warnings, exits non-zero on hard failure.

</specifics>

<deferred>
## Deferred Ideas

- **Party/household column + size** (for RSVP headcount) — considered for the CSV but deferred; RSVP is a future milestone and storing party now is premature. Revisit when RSVP is planned.
- **Hard delete / DB-mirrors-CSV destructively** — explicitly rejected in favor of soft-delete (D-05) to keep distributed links durable.
- **`first_seen_at` population** — column exists (nullable) but is written by the Phase 8 lookup endpoint on a guest's first visit, not by this phase's script.
- **Rate limiting / PII-in-logs / analytics `id` stripping** (PITFALLS) — belong to Phase 8 (endpoint) and Phase 9 (deploy/observability), not here.

</deferred>

---

*Phase: 07-datastore-schema-link-generation-tooling*
*Context gathered: 2026-05-31*
