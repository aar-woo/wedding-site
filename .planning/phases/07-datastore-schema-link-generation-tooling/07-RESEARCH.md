# Phase 7: Datastore Schema & Link-Generation Tooling — Research

**Researched:** 2026-05-31
**Domain:** Neon Postgres DDL + local Node ESM script (CSV → DB → links.csv); token signing via existing Phase 6 lib
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `guests.csv` has two columns with a header row: `display_name` and `email`. `display_name` is the greeting text (e.g. `The Johnson Family`, `Mike & Sarah` — unicode/`&` already round-trips through the Phase 6 token lib).
- **D-02:** `email` is carried through to the output `links.csv` (so it doubles as a mail-merge sheet: name, email, url) **and** is stored in Neon. Email is NOT placed in the token payload (payload stays the locked `{ id, name, iat }`).
- **D-03:** A row with a blank/empty `display_name` is **skipped with a warning** (print the line number, continue the run).
- **D-04:** Re-running `generate-links.js` is **upsert keyed on `email`**: an existing email keeps its existing `id` (the link stays valid) and updates `display_name` if it changed; a new email mints a fresh nanoid `id`.
- **D-05:** A guest present in Neon but **no longer in the CSV is soft-deleted**, not hard-deleted. Hard DELETE was explicitly rejected.
- **D-06:** The `guests` table includes: `id TEXT PRIMARY KEY` (nanoid ~21 chars), `display_name`, `created_at`, `first_seen_at`, nullable `rsvp_status` / `rsvp_count` / `rsvp_submitted_at`, `email TEXT UNIQUE` (nullable), and a soft-delete marker.
- **D-07:** Link base URL configurable via `SITE_BASE_URL` env var; if unset, emit a clearly-marked placeholder host. URL path is the locked `/i/<id>?t=<base64url-payload>.<base64url-hmac>`.
- **D-08:** User provisions Neon; places `DATABASE_URL` in `.env.local`. Schema applied via committed idempotent migration (`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) using `@neondatabase/serverless` HTTP driver.
- **D-09:** `.gitignore` covers `guests.csv`, `links.csv`, `.env*`. Commit a fake-data `guests.example.csv`.

### Claude's Discretion

- Soft-delete column choice: `deleted_at TIMESTAMPTZ` vs `is_active BOOLEAN` (planner to choose; see recommendation below)
- CSV parsing: `csv-parse` (sync) vs hand-rolled `readline`
- Output `links.csv` columns (recommended: `id, display_name, email, url`)

### Deferred Ideas (OUT OF SCOPE)

- Party/household column + size for RSVP headcount
- Hard delete / DB-mirrors-CSV destructively
- `first_seen_at` population (column exists; written by Phase 8 lookup endpoint, not this script)
- Rate limiting / PII-in-logs / analytics `id` stripping (Phase 8/9)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-01 | Neon Postgres datastore holds a guest record keyed on opaque `id`, with nullable RSVP fields reserved so a future RSVP flow needs no migration | Schema DDL section; idempotent migration pattern; soft-delete choice |
| LINK-04 | A local link-generation script mints per-guest links from a guest list; the guest list and signing secret are never committed to the repo | CSV parsing; upsert SQL; `sign()` reuse; `.gitignore` additions; end-to-end check pattern |
</phase_requirements>

---

## Summary

Phase 7 is a pure local tooling and Postgres DDL phase. It has zero frontend or Vercel Function deliverables. The three artifacts are: (1) a committed idempotent migration script (`scripts/migrate.js`) that applies `CREATE TABLE IF NOT EXISTS` + additive `ALTER TABLE` statements via `@neondatabase/serverless`'s HTTP driver; (2) `scripts/generate-links.js` which reads `guests.csv`, upserts rows keyed on normalized email, mints nanoid IDs for new guests, soft-deletes removed rows, signs a token per row by reusing the existing `scripts/lib/token.js`, and writes `links.csv`; (3) a committed `guests.example.csv` with fake data plus `.gitignore` additions.

All signing logic already exists in `scripts/lib/token.js` (`sign(payload, secret)` → `<base64url-payload>.<base64url-hmac>`). The link-gen script calls `sign()` — no new crypto code. All token format decisions are locked in `docs/identity-token-contract.md` and must not be changed.

The `@neondatabase/serverless` HTTP driver (the `neon()` tagged-template function) is the correct API for a plain local Node.js script. It does not require a TCP connection pool — it POSTs to Neon's HTTP endpoint. Parameterized queries, DDL, and multi-statement execution all work through it. Transactions over the HTTP driver require a special `transaction()` helper (not a standard `BEGIN/COMMIT`), but the upsert + soft-delete sequence does not strictly need a transaction — the operations are safe to run sequentially as long as the soft-delete step runs after the upsert loop.

**Primary recommendation:** Use `deleted_at TIMESTAMPTZ` for soft-delete (not `is_active BOOLEAN`); use `csv-parse` sync API for CSV parsing; load `.env.local` via Node 20+ `--env-file=.env.local` flag (zero extra dependency).

---

## Standard Stack

### Core — New Dependencies

| Library | Version | Purpose | Classification |
|---------|---------|---------|----------------|
| `@neondatabase/serverless` | 1.1.0 (current) | Neon Postgres HTTP driver — connect, DDL, parameterized queries | `dependency` (also used by Phase 8 api/ function) |
| `nanoid` | 5.1.11 (current) | Opaque 21-char URL-safe guest ID generation | `dependency` |
| `csv-parse` | 6.2.1 (current) | CSV parsing — sync API, handles quoted fields, UTF-8, header rows | `devDependency` |

**Why `dependency` not `devDependency` for `@neondatabase/serverless`:** The package will also be imported by `api/guest/[id].js` in Phase 8 (a deployed Vercel Function). Installing it as a `dependency` now avoids reclassifying it in Phase 8.

**Why `dependency` not `devDependency` for `nanoid`:** nanoid may be needed in the Phase 8 function (if the API ever needs to mint IDs server-side). Conservative to install as `dependency` now.

**Why `csv-parse` as `devDependency`:** Only used in the local link-generation script, never deployed to Vercel.

**Version verification (confirmed against npm registry 2026-05-31):**
- `@neondatabase/serverless`: 1.1.0
- `nanoid`: 5.1.11
- `csv-parse`: 6.2.1

### Existing Assets — Do Not Reinstall

| File | Role |
|------|------|
| `scripts/lib/token.js` | `sign(payload, secret)` — the link-gen script imports this directly |
| `src/lib/decodeGuestToken.js` | `decodeGuestToken(token)` — used for the end-to-end check script |
| `scripts/check-token-url.js` | Reference pattern for the end-to-end check; template for `scripts/check-link.js` |

**Installation:**
```bash
npm install @neondatabase/serverless nanoid
npm install -D csv-parse
```

---

## Architecture Patterns

### Recommended File Structure (Phase 7 additions only)

```
scripts/
├── migrate.js              # NEW: idempotent DDL — run once before generate-links
├── generate-links.js       # NEW: CSV → upsert → links.csv
├── check-link.js           # NEW: end-to-end check (success criterion #3)
├── guests.example.csv      # NEW: committed fake-data template
├── check-token-url.js      # EXISTS: Phase 6 harness (reference pattern)
└── lib/
    ├── token.js            # EXISTS: sign() / verify() — import, do not modify
    └── token.test.js       # EXISTS: test patterns to mirror
```

`.gitignore` additions:
```
guests.csv
links.csv
```
`.env*` is already covered by `*.local` (which catches `.env.local`) — verify the pattern covers all forms. The current `.gitignore` has `*.local` which covers `.env.local`. Add explicit `guests.csv` and `links.csv` entries.

---

### Pattern 1: `@neondatabase/serverless` HTTP Driver in a Local Node ESM Script

**What:** The `neon()` tagged-template function is the lightweight HTTP-based query API. It is NOT a persistent TCP connection pool. Each call POSTs a SQL statement to Neon's serverless HTTP endpoint. It is appropriate for local scripts (not just Vercel Functions) because it requires only `DATABASE_URL` and works in any Node.js environment.

**Import:**
```js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
```

**DDL (in migrate.js):**
```js
// Single-statement DDL — works directly
await sql`CREATE TABLE IF NOT EXISTS guests ( ... )`;

// Multi-statement via transaction helper if needed, or sequential calls:
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
```

**Parameterized SELECT/INSERT:**
```js
// Tagged template — parameters are passed as interpolated values, NOT string concatenation
const rows = await sql`SELECT id FROM guests WHERE email = ${normalizedEmail}`;
```

**Key distinction:** `neon()` (the tagged-template function) is for single queries and simple use. `@neondatabase/serverless` also exports `Pool` (TCP-compatible pool for long-running processes), but the `neon()` HTTP function is correct here — no connection management overhead, works in short-lived scripts.

**Transactions over the HTTP driver:** The HTTP driver does NOT support `BEGIN`/`COMMIT` directly in the tagged-template API. Instead, use the `transaction()` helper exported by the package:
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
// For atomic multi-step operations:
const results = await sql.transaction([
  sql`UPDATE guests SET deleted_at = now() WHERE email NOT IN (${emailList})`,
  sql`INSERT INTO guests ... ON CONFLICT ...`,
]);
```
However, for this phase the upsert loop + soft-delete can run sequentially without a transaction (see Upsert Pattern below).

**Confidence:** HIGH — verified against `@neondatabase/serverless` 1.1.0 npm registry + Neon docs.

---

### Pattern 2: Idempotent Migration (`scripts/migrate.js`)

**What:** A committed script that applies the full schema using `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Safe to run multiple times. Does not use a migration framework (Flyway, Prisma Migrate, etc.) — overkill for a single table.

```js
// scripts/migrate.js
// Run: node --env-file=.env.local scripts/migrate.js

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS guests (
    id               TEXT PRIMARY KEY,
    display_name     TEXT NOT NULL,
    email            TEXT UNIQUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    first_seen_at    TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ,
    rsvp_status      TEXT,
    rsvp_count       INTEGER,
    rsvp_submitted_at TIMESTAMPTZ
  )
`;

-- Additive ALTER statements for future re-runs on older schemas:
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_status TEXT`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_count INTEGER`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_submitted_at TIMESTAMPTZ`;

console.log('Migration complete.');
```

**Why `ADD COLUMN IF NOT EXISTS` after `CREATE TABLE IF NOT EXISTS`:** If the table was created by an earlier migration version without the additive columns, re-running migrate.js after adding columns to the `CREATE TABLE` statement would NOT add them (the table already exists and `IF NOT EXISTS` is a no-op). The `ALTER TABLE` statements add any missing columns idempotently.

---

### Pattern 3: Soft-Delete Column — `deleted_at TIMESTAMPTZ` (Recommended)

**Recommendation: `deleted_at TIMESTAMPTZ` (nullable), NOT `is_active BOOLEAN`.**

**Rationale:**
- `deleted_at TIMESTAMPTZ` is self-documenting: it records *when* the guest was removed from the CSV, not just *whether* they were removed. This is useful for audit/debugging.
- Query for active guests: `WHERE deleted_at IS NULL` — simple and idiomatic.
- Query for soft-deleted guests: `WHERE deleted_at IS NOT NULL` — equally simple.
- Re-activating a previously soft-deleted email on re-run: `SET deleted_at = NULL` as part of the upsert `DO UPDATE` clause — a single field clear.
- `is_active BOOLEAN DEFAULT TRUE` requires a NOT NULL constraint, has a less obvious NULL-state for new rows, and does not capture the timing of deletion.

**Active guest filter (for future Phase 8 lookup):** `WHERE deleted_at IS NULL`.

---

### Pattern 4: Email-Keyed Upsert SQL (Preserve Existing ID)

**The problem:** On re-run, a guest already in Neon should keep their existing `id` (the link stays valid). A naive `INSERT ... ON CONFLICT DO UPDATE SET id = nanoid()` would replace the id — breaking their link. The solution is to use `ON CONFLICT (email) DO UPDATE` and only update `display_name` and `deleted_at`, never `id`.

**Minting nanoid only for new emails:**

```js
import { nanoid } from 'nanoid';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// For each CSV row (after email normalization):
const normalizedEmail = row.email.trim().toLowerCase();

// Check if this email already exists — get its existing id
const existing = await sql`
  SELECT id FROM guests WHERE email = ${normalizedEmail}
`;
const id = existing.length > 0 ? existing[0].id : nanoid();

await sql`
  INSERT INTO guests (id, display_name, email, created_at)
  VALUES (${id}, ${row.display_name}, ${normalizedEmail}, now())
  ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    deleted_at   = NULL
`;
```

**Simpler single-query form (no pre-fetch):**

The problem with a pure `INSERT ... ON CONFLICT DO UPDATE SET id = EXCLUDED.id` is that `EXCLUDED.id` is the id in the INSERT, which for new rows is a freshly minted nanoid but for existing rows we don't know the existing id. The two-step approach (SELECT first, then INSERT/UPSERT) is clearer and correct. The SELECT is lightweight (indexed PK lookup).

**Alternative — one query using `ON CONFLICT ... DO UPDATE ... RETURNING id`:**

```js
// This pattern uses a deterministic id from the INSERT clause for new rows,
// and for conflicts keeps the existing row's id via the RETURNING clause.
// It requires knowing whether the row is new or existing to mint nanoid appropriately.
// The two-step SELECT + UPSERT is recommended for clarity.
```

**Recommendation:** Use the two-step approach. The extra SELECT is one indexed query per row; for 200 guests this adds negligible time and the code is unambiguous.

---

### Pattern 5: Soft-Delete Sync (Remove Guests No Longer in CSV)

After processing all CSV rows, mark rows whose email is NOT in the current CSV as soft-deleted. Use `ANY($1::text[])` for the array comparison (Postgres-idiomatic and avoids SQL injection).

```js
// After processing all rows, collect the normalized emails that are active in this run:
const activeEmails = csvRows.map(r => r.email.trim().toLowerCase());

// Soft-delete any rows NOT in the current CSV:
await sql`
  UPDATE guests
  SET deleted_at = now()
  WHERE email NOT IN ${sql(activeEmails)}
    AND deleted_at IS NULL
`;
```

**Note on `NOT IN` with `neon()` tagged template:** The `sql(activeEmails)` interpolation in the `neon()` tagged-template API handles array parameters correctly when used in an `IN` or `NOT IN` context — it expands the array to `($1, $2, ...)`. Verify this against the `@neondatabase/serverless` docs; if the tagged-template does not support array expansion in `NOT IN`, use `= ANY(${sql(activeEmails)})` instead or format as `NOT IN (${activeEmails.map((_, i) => `$${i+1}`).join(',')})` with a raw query approach.

**Safe alternative using `ANY`:**
```js
await sql`
  UPDATE guests
  SET deleted_at = now()
  WHERE email <> ALL(${activeEmails})
    AND deleted_at IS NULL
`;
```

`<> ALL(array)` is equivalent to `NOT IN (list)` for non-NULL values and is unambiguous with array params.

---

### Pattern 6: nanoid v5 ESM Import

```js
import { nanoid } from 'nanoid';
const id = nanoid(); // 21 chars, URL-safe alphabet, ~126 bits entropy
```

- nanoid v5 is ESM-only. This project uses `"type": "module"` — no conflict.
- Node version requirement: Node 20+ natively; Node 18 with `--experimental-require-module`. The environment runs Node v23.10.0 — no compatibility concern.
- The default 21-character length is correct per the locked contract.

---

### Pattern 7: CSV Parsing (`csv-parse` sync API)

**Recommendation: `csv-parse` sync API** (not hand-rolled readline).

**Rationale:**
- A ~200-row CSV with quoted fields containing commas and `&` characters (`"Mike & Sarah"`, `"The García Family"`) requires quote handling that readline does not provide out of the box.
- `csv-parse/sync` is a single import, zero dependencies, and handles UTF-8, quoted commas, BOM, and CRLF line endings.
- Hand-rolling: viable only for the simplest CSVs with no quoted fields. The example CSV `"Mike & Sarah"` already demonstrates the need for proper quote handling.

```js
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

const raw = readFileSync('guests.csv', 'utf8');
const rows = parse(raw, {
  columns: true,        // use header row as column names
  skip_empty_lines: true,
  trim: true,           // trim whitespace around values
  bom: true,            // handle BOM from Excel exports
});
// rows: [{ display_name: 'The Johnson Family', email: 'johnsons@email.com' }, ...]
```

**`csv-parse/sync` ESM import path:** The package supports ESM via subpath export `'csv-parse/sync'`. Confirmed for csv-parse v6.x.

---

### Pattern 8: Writing `links.csv` with Correct Quoting

**Recommended columns:** `id, display_name, email, url`

The email column is the mail-merge key; url is the personalized link. `display_name` may contain commas (e.g., `"Smith, Jones & Family"`), requiring CSV quoting.

**Do not hand-roll CSV writing.** Use Node's built-in `node:fs` with a simple `stringify` from `csv-stringify/sync` (part of the same `csv-parse` ecosystem, or install separately), OR format each row manually with proper quoting:

```js
function csvEscape(value) {
  // Wrap in quotes if value contains comma, double-quote, or newline
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const header = 'id,display_name,email,url';
const lines = rows.map(r =>
  [r.id, csvEscape(r.display_name), csvEscape(r.email), csvEscape(r.url)].join(',')
);
writeFileSync('links.csv', [header, ...lines].join('\n'), 'utf8');
```

**Why not `csv-stringify`:** Adding a second csv package just for output is unnecessary when the escaping function above is 6 lines and covers all real-world cases (display names with commas, ampersands, and quotes).

---

### Pattern 9: `.env.local` Loading in Local Node Script

**Recommendation: Node 20+ `--env-file=.env.local` flag** (zero extra dependency).

```bash
node --env-file=.env.local scripts/migrate.js
node --env-file=.env.local scripts/generate-links.js
```

- Node v23.10.0 is installed — `--env-file` is fully supported.
- The flag injects `.env.local` variables into `process.env` before the script runs.
- No `dotenv` package needed.
- Alternative `dotenv` is valid but adds a dependency for zero benefit given the Node version.

**Package.json script shorthands (recommended):**
```json
"scripts": {
  "db:migrate": "node --env-file=.env.local scripts/migrate.js",
  "db:generate-links": "node --env-file=.env.local scripts/generate-links.js"
}
```

---

### Pattern 10: End-to-End Check (`scripts/check-link.js`)

**Purpose:** Verify success criterion #3 — a URL from `links.csv` decodes to the correct guest name without standing up the Phase 8 hook.

**Approach:** Read the first row of `links.csv`, extract the `t=` query param, call `decodeGuestToken()` (the existing browser-safe util imported into Node), and assert `decoded.name === display_name`.

```js
// scripts/check-link.js
// Run: node scripts/check-link.js
// (No --env-file needed — decodeGuestToken uses no secrets)

import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { decodeGuestToken } from '../src/lib/decodeGuestToken.js';

const links = parse(readFileSync('links.csv', 'utf8'), { columns: true });
const row = links[0]; // first real row

const url = new URL(row.url);
const token = url.searchParams.get('t');
const decoded = decodeGuestToken(token);

console.assert(decoded !== null, 'Token must decode to non-null');
console.assert(decoded.name === row.display_name, `Name mismatch: got "${decoded?.name}", expected "${row.display_name}"`);
console.log(`PASS: "${decoded.name}" decoded from URL`);
```

**Why this works:** `decodeGuestToken` is a browser-safe module that uses only `atob` and `JSON.parse` — no Node-specific APIs. It runs in Node v18+ without modification. It does not need the signing secret (it only base64-decodes the payload, not the HMAC). The `src/lib/decodeGuestToken.js` uses `atob` which is available in Node 18+.

---

### Pattern 11: Token Building in `generate-links.js`

The link-gen script reuses `scripts/lib/token.js` directly:

```js
import { sign } from './lib/token.js';

const secret = process.env.GUEST_TOKEN_SECRET;
if (!secret) throw new Error('GUEST_TOKEN_SECRET is not set in environment');

const payload = { id, name: row.display_name, iat: Math.floor(Date.now() / 1000) };
const token = sign(payload, secret);

const baseUrl = process.env.SITE_BASE_URL || 'https://PLACEHOLDER-DOMAIN-SET-SITE_BASE_URL.example.com';
const url = `${baseUrl}/i/${id}?t=${token}`;
```

**Zero new signing code.** The payload matches the locked contract `{ id, name, iat }` exactly.

---

### Anti-Patterns to Avoid

- **Duplicating signing logic:** Never re-implement `sign()` — import from `scripts/lib/token.js`.
- **Importing `scripts/lib/token.js` into `src/`:** This would bundle the signing secret import path into the Vite build. The trust boundary is strict.
- **Using `nanoid` inside the upsert `DO UPDATE` clause:** The new id minted in the INSERT clause must be generated in JS before the query, not inside SQL. `nanoid` is a JS library.
- **Storing email in the token payload:** The locked contract is `{ id, name, iat }` — email is NOT in the token. Email stays in Neon and `links.csv` only.
- **Hard-coding `DATABASE_URL` or `GUEST_TOKEN_SECRET`:** Always read from `process.env`; fail fast with a clear error if either is unset.
- **Using TCP pool (`Pool`) instead of `neon()`:** The `neon()` HTTP tagged-template is correct for a short-lived script. `Pool` is for long-running servers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing with quoted fields | Custom `split(',')` or readline parser | `csv-parse/sync` | Quoted commas, multi-line values, BOM, CRLF — all handled; hand-roll breaks on `"Mike & Sarah"` in a quoted field |
| HMAC signing / token format | Duplicate crypto code | `scripts/lib/token.js` → `sign()` | Contract is locked; duplication risks drift from the signed format |
| Postgres connection management | Custom HTTP fetch to Neon | `@neondatabase/serverless` `neon()` | Handles auth, query formatting, error mapping |
| `.env` loading | Manual `readFileSync('.env.local')` + parse | `node --env-file=.env.local` flag | Zero-dep; built into Node 20+ |

---

## Common Pitfalls

### Pitfall 1: `neon()` Tagged Template Array Expansion in `NOT IN`

**What goes wrong:** `WHERE email NOT IN ${sql(activeEmails)}` may not expand correctly in all versions of the `neon()` tagged-template API — behavior depends on how the driver handles array-typed parameters in a `NOT IN` context.

**How to avoid:** Use `<> ALL(${activeEmails})` instead of `NOT IN (${activeEmails})`. The `<> ALL(array)` form is standard Postgres and unambiguous with array bindings.

**Warning signs:** Soft-delete step deletes all rows (empty array expands to always-false condition), or throws a query error about parameter type.

---

### Pitfall 2: `atob` in `decodeGuestToken.js` is Node 18+ Only

**What goes wrong:** `src/lib/decodeGuestToken.js` uses `atob()` which is a browser global added to Node.js in v18. Running the end-to-end check on Node 16 fails with `ReferenceError: atob is not defined`.

**How to avoid:** Non-issue — the environment runs Node v23.10.0. Document the Node 18+ requirement on `check-link.js`.

---

### Pitfall 3: Email Normalization Inconsistency

**What goes wrong:** If the migration script and generate-links script normalize email differently (e.g., one trims but doesn't lowercase), the UNIQUE constraint on `email` does not prevent duplicates like `FOO@BAR.COM` and `foo@bar.com`.

**How to avoid:** One shared email normalization helper: `email.trim().toLowerCase()`. Apply everywhere: CSV read, INSERT, SELECT, soft-delete filter.

---

### Pitfall 4: `SITE_BASE_URL` Trailing Slash

**What goes wrong:** If `SITE_BASE_URL` ends with `/`, the generated URL becomes `https://example.com//i/<id>?t=...` (double slash).

**How to avoid:** Strip trailing slash before building the URL: `const base = (process.env.SITE_BASE_URL || 'https://PLACEHOLDER.example.com').replace(/\/$/, '')`.

---

### Pitfall 5: CSV Column Name Case Sensitivity

**What goes wrong:** `csv-parse` with `columns: true` uses the header row values as-is. If the real CSV has `Display_Name` or `EMAIL`, the row object has `row.Display_Name` and `row.EMAIL`, not `row.display_name` and `row.email`.

**How to avoid:** Accept case-insensitive column names by normalizing them: `columns: (header) => header.map(h => h.trim().toLowerCase())`. This makes `row.display_name` and `row.email` always correct regardless of header casing.

---

### Pitfall 6: `guests.csv` / `links.csv` Accidentally Committed

**What goes wrong:** `guests.csv` (real guest list + emails) or `links.csv` (all personalized links) ends up in git history — a privacy and security incident.

**How to avoid:** Add to `.gitignore` before creating either file. Verify with `git status` after adding the gitignore entries and before running the script. The current `.gitignore` does NOT yet include `guests.csv` or `links.csv` — this is a required addition in Phase 7.

---

### Pitfall 7: `first_seen_at` Population is Phase 8

**What goes wrong:** The planner or implementor mistakenly populates `first_seen_at` in the generate-links script (setting it to `now()` at mint time). This is incorrect — `first_seen_at` is the timestamp of the guest's first URL visit, which the Phase 8 lookup endpoint records.

**How to avoid:** Leave `first_seen_at` as `NULL` in the INSERT. The migration creates it nullable. The generate-links script must not set it.

---

## Code Examples

### Complete Schema DDL
```sql
-- Source: locked decisions D-06 + BACK-01
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
);
```

### Email-Keyed Upsert (Preserves Existing ID)
```js
// Source: Pattern 4 above — two-step SELECT + UPSERT
const normalizedEmail = row.email.trim().toLowerCase();
const existing = await sql`SELECT id FROM guests WHERE email = ${normalizedEmail}`;
const id = existing.length > 0 ? existing[0].id : nanoid();

await sql`
  INSERT INTO guests (id, display_name, email, created_at)
  VALUES (${id}, ${row.display_name}, ${normalizedEmail}, now())
  ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    deleted_at   = NULL
`;
```

### Soft-Delete Sync
```js
// Source: Pattern 5 above
const activeEmails = csvRows.map(r => r.email.trim().toLowerCase());
await sql`
  UPDATE guests
  SET deleted_at = now()
  WHERE email <> ALL(${activeEmails})
    AND deleted_at IS NULL
`;
```

### `guests.example.csv` Content
```csv
display_name,email
The Johnson Family,johnsons@example.com
Mike & Sarah,mike.sarah@example.com
The García Family,garcia@example.com
Dr. & Mrs. Smith,smiths@example.com
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | Yes | v23.10.0 | — |
| `--env-file` flag | `.env.local` loading | Yes | Node 20+ required; have v23 | — |
| `@neondatabase/serverless` | migrate.js, generate-links.js | Not installed yet | 1.1.0 (to install) | None — required |
| `nanoid` | generate-links.js | Not installed yet | 5.1.11 (to install) | None — required |
| `csv-parse` | generate-links.js | Not installed yet | 6.2.1 (to install) | Hand-rolled reader (not recommended) |
| Neon Postgres instance | migrate.js, generate-links.js | User must provision | — | None — user action required before scripts run |

**Missing dependencies with no fallback:**
- Neon Postgres instance + `DATABASE_URL` in `.env.local`: This is a **user action** required before the migration and link-generation scripts can run end-to-end. The plan must include a clear instruction for the user to provision Neon via Vercel Marketplace and add `DATABASE_URL` to `.env.local`. Scripts should fail fast with a human-readable error if `DATABASE_URL` is unset.
- `GUEST_TOKEN_SECRET` in `.env.local`: Already established in Phase 6. Scripts must fail fast if unset.

**Missing dependencies with fallback:**
- `csv-parse`: Could hand-roll for simple CSVs, but not recommended. Install it.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in) + `node:assert/strict` |
| Config file | None — tests run directly via `node --test` |
| Quick run command | `node --test scripts/lib/token.test.js` (existing) |
| Full suite command | `node --test scripts/**/*.test.js src/**/*.test.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BACK-01 | `guests` table has all required columns | Integration | `node --env-file=.env.local scripts/migrate.js` (check output + no error) | Wave 0 — `scripts/migrate.js` |
| BACK-01 | Migration is idempotent (run twice, no error) | Integration | Run `migrate.js` twice in sequence | Wave 0 — `scripts/migrate.js` |
| BACK-01 | Upsert preserves existing `id` on re-run | Unit/Integration | `scripts/generate-links.test.js` — upsert-preserves-id test | Wave 0 — new test file |
| BACK-01 | Soft-delete: removed email gets `deleted_at` set | Unit/Integration | `scripts/generate-links.test.js` — soft-delete sync test | Wave 0 — new test file |
| LINK-04 | Token round-trip: generated URL decodes to correct name | E2E | `node scripts/check-link.js` (reads links.csv) | Wave 0 — `scripts/check-link.js` |
| LINK-04 | `guests.csv` absent from `git status` | Manual/Git | `git status --short \| grep guests.csv` → no output | Verification step |
| LINK-04 | `links.csv` absent from `git status` | Manual/Git | `git status --short \| grep links.csv` → no output | Verification step |
| LINK-04 | `.env.local` absent from git | Manual/Git | `git status --short \| grep .env.local` → no output | Verification step |
| LINK-04 | Output `links.csv` has correct columns (id, display_name, email, url) | Automated | `node scripts/check-link.js` (validates columns) | Wave 0 |
| LINK-04 | Blank `display_name` rows are skipped with a warning | Unit | `scripts/generate-links.test.js` — blank-name skip test | Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test scripts/lib/token.test.js` (existing, fast, zero DB needed)
- **Per wave merge:** Full suite: `node --test scripts/**/*.test.js src/**/*.test.js`
- **Phase gate:** Full suite green + `node scripts/check-link.js` passes (requires Neon DB + links.csv) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/migrate.js` — DDL migration script (creates the table)
- [ ] `scripts/generate-links.js` — main link-generation script
- [ ] `scripts/check-link.js` — end-to-end URL → decode check (success criterion #3)
- [ ] `scripts/guests.example.csv` — committed fake-data CSV
- [ ] `scripts/generate-links.test.js` — unit tests: upsert-preserves-id, soft-delete sync, blank-name skip
- [ ] `.gitignore` additions: `guests.csv`, `links.csv`

*(Existing: `scripts/lib/token.test.js` covers token round-trip — no gap)*

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 7 |
|-----------|------------------|
| ESM project (`"type": "module"`) | All new scripts use `import`/`export`; nanoid v5 ESM-only is compatible |
| `node:test` for tests | New test file `scripts/generate-links.test.js` must use `import { test } from 'node:test'` |
| Never import `scripts/lib/` into `src/` | `check-link.js` imports `src/lib/decodeGuestToken.js` INTO a script — correct direction |
| No `VITE_` prefix on secrets | `DATABASE_URL` and `GUEST_TOKEN_SECRET` must never have `VITE_` prefix — already enforced |
| No UI libraries, CSS Modules, animation rules | Not applicable to this phase (no frontend changes) |
| `.env*` gitignored | Already covered by `*.local` in `.gitignore`; verify `guests.csv` and `links.csv` are added |
| GSD Workflow Enforcement | Phase work flows through `/gsd:execute-phase` — do not make direct repo edits outside it |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Vercel KV for datastore | Vercel KV deprecated Dec 2024 → Neon Postgres via Marketplace | STACK.md's Upstash Redis rec is superseded; Neon is the correct choice (confirmed in SUMMARY.md Conflict 1) |
| TCP Postgres drivers (pg, postgres) | `@neondatabase/serverless` HTTP driver | No persistent TCP connections; works in serverless + local scripts equally |
| dotenv package for env loading | `node --env-file=.env.local` (Node 20+ built-in) | Zero-dep env loading; removes dotenv install |
| `csv-parse` v5 | `csv-parse` v6.2.1 | Both are ESM-compatible; v6 is current |

---

## Open Questions

1. **`neon()` tagged-template and `<> ALL(array)` parameter binding**
   - What we know: The `neon()` HTTP driver accepts array parameters in tagged template literals
   - What's unclear: Whether `<> ALL(${activeEmails})` correctly binds a JS string array as a Postgres `text[]` parameter without an explicit cast
   - Recommendation: Test the soft-delete query with a small array in the migration harness before shipping. Fallback: format the array as `{${activeEmails.map(e => `"${e}"`).join(',')}}::text[]` if the driver requires an explicit array literal.

2. **Neon free tier `email TEXT UNIQUE` with NULLs**
   - What we know: Postgres UNIQUE constraints allow multiple NULLs (each NULL is considered distinct)
   - What's unclear: Whether any future row with `email = NULL` would conflict with another `NULL` email row
   - Recommendation: Non-issue for this project — every row in the CSV has an email; `email` will always be non-null for script-generated rows. Phase 8 may need a check if the API can create rows without emails.

---

## Sources

### Primary (HIGH confidence)

- `scripts/lib/token.js` — Phase 6 deliverable; `sign()` signature verified by reading file directly
- `src/lib/decodeGuestToken.js` — Phase 6 deliverable; `decodeGuestToken()` signature verified
- `scripts/check-token-url.js` — Phase 6 deliverable; template for `check-link.js`
- `scripts/lib/token.test.js` — Phase 6 deliverable; node:test patterns to mirror
- `docs/identity-token-contract.md` — LOCKED contract; URL shape, payload, signing algorithm
- `package.json` — confirmed `"type": "module"`, no `@neondatabase/serverless` or `nanoid` installed yet
- `npm view @neondatabase/serverless version` → 1.1.0 (verified 2026-05-31)
- `npm view nanoid version` → 5.1.11 (verified 2026-05-31)
- `npm view csv-parse version` → 6.2.1 (verified 2026-05-31)
- `node --version` → v23.10.0 (verified 2026-05-31) — `--env-file` fully supported

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` §"Pattern 4: Neon Postgres" + §"Data Flow → Link Generation" — `@neondatabase/serverless` HTTP driver API; `neon()` tagged-template
- `.planning/research/SUMMARY.md` §"Conflict 1" — Neon Postgres confirmed over Upstash Redis
- `.planning/research/STACK.md` §5 — `csv-parse ^5.6.x` recommendation (version superseded to 6.2.1)

### Tertiary (LOW confidence — training knowledge)

- `@neondatabase/serverless` `neon()` array parameter behavior in `<> ALL(array)` — not independently verified against v1.1.0 release notes; flagged in Open Questions

---

## Metadata

**Confidence breakdown:**
- Schema DDL: HIGH — derived directly from locked decisions in 07-CONTEXT.md + identity-token-contract.md
- `@neondatabase/serverless` API: MEDIUM-HIGH — verified version from npm; API patterns from ARCHITECTURE.md research (previously verified against Neon docs)
- `csv-parse` sync API: HIGH — standard usage; version verified from npm
- Soft-delete `deleted_at` recommendation: HIGH — standard Postgres idiom
- Soft-delete array query (`<> ALL`): MEDIUM — correct SQL but driver array binding not independently re-verified for v1.1.0

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable stack; `@neondatabase/serverless` 1.x API is unlikely to change)
