// Run: node --env-file=.env.local scripts/generate-links.js [path/to/guests.csv]
// Or:  npm run db:generate-links
//
// Reads guests.csv (or the path passed as the first argument), upserts each row
// into the Neon `guests` table (preserving existing ids on re-run), soft-deletes
// guests no longer in the CSV, signs a personalized URL token for each kept guest,
// and writes links.csv with columns: id, display_name, email, url.
//
// Requires: DATABASE_URL and GUEST_TOKEN_SECRET in .env.local (see .env.example).
// Node 20+ required for --env-file support.

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';
import { sign } from './lib/token.js';
import { shapeRows, buildLinkUrl } from './lib/links.js';

// ---------------------------------------------------------------------------
// Fail-fast guards — clear human-readable errors before touching the DB
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Provision Neon and add it to .env.local, then run: npm run db:generate-links'
  );
  process.exit(1);
}

if (!process.env.GUEST_TOKEN_SECRET) {
  console.error(
    'GUEST_TOKEN_SECRET is not set in .env.local (established in Phase 6).'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read + parse the input CSV
// ---------------------------------------------------------------------------

const csvPath = process.argv[2] || 'guests.csv';

let raw;
try {
  raw = readFileSync(csvPath, 'utf8');
} catch (err) {
  console.error(`Cannot read CSV at "${csvPath}": ${err.message}`);
  console.error('Copy scripts/guests.example.csv to guests.csv, then add your real guest list.');
  process.exit(1);
}

// header-case-insensitive (Pitfall 5): normalize all header names to trim+lowercase
const parsed = parse(raw, {
  columns: (h) => h.map((x) => x.trim().toLowerCase()),
  skip_empty_lines: true,
  trim: true,
  bom: true,
});

// ---------------------------------------------------------------------------
// Shape rows — skip blanks, normalize emails
// ---------------------------------------------------------------------------

const { rows, skipped } = shapeRows(parsed);

for (const s of skipped) {
  console.warn(`Skipping line ${s.line}: ${s.reason}`);
}

// ---------------------------------------------------------------------------
// DB + secret setup
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL);
const secret = process.env.GUEST_TOKEN_SECRET;
const out = [];

// ---------------------------------------------------------------------------
// Per-row: two-step upsert preserving id (Pattern 4)
// ---------------------------------------------------------------------------

for (const row of rows) {
  // Two-step: look up existing id first so the INSERT can carry the correct id
  // (nanoid is a JS lib; we cannot mint it inside SQL)
  const existing = await sql`SELECT id FROM guests WHERE email = ${row.email}`;
  const id = existing.length > 0 ? existing[0].id : nanoid();

  await sql`
    INSERT INTO guests (id, display_name, email, created_at)
    VALUES (${id}, ${row.display_name}, ${row.email}, now())
    ON CONFLICT (email) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      deleted_at   = NULL
  `;

  // Build token with the LOCKED payload shape: { id, name, iat }
  // Email is NEVER included in the token payload (identity-token-contract.md §2).
  const token = sign({ id, name: row.display_name, iat: Math.floor(Date.now() / 1000) }, secret);

  const url = buildLinkUrl(id, token, process.env.SITE_BASE_URL);

  out.push({ id, display_name: row.display_name, email: row.email, url });
}

// ---------------------------------------------------------------------------
// Soft-delete sync — guests removed from CSV get deleted_at set (Pattern 5)
// Run AFTER the upsert loop so the active-email list is complete.
// ---------------------------------------------------------------------------

const activeEmails = out.map((r) => r.email);

// ::text[] cast ensures the Neon HTTP driver passes the array correctly as
// a Postgres text array even when the driver version does not auto-cast.
await sql`
  UPDATE guests
  SET deleted_at = now()
  WHERE email <> ALL(${activeEmails}::text[])
    AND deleted_at IS NULL
`;

// ---------------------------------------------------------------------------
// Write links.csv — exact column order: id,display_name,email,url
// ---------------------------------------------------------------------------

/**
 * Minimal CSV escaping: wrap value in double-quotes if it contains a comma,
 * double-quote, or newline; escape inner double-quotes by doubling them.
 * @param {string} value
 * @returns {string}
 */
function csvEscape(value) {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const header = 'id,display_name,email,url';
const lines = out.map((r) =>
  [csvEscape(r.id), csvEscape(r.display_name), csvEscape(r.email), csvEscape(r.url)].join(',')
);
const outputPath = 'links.csv';
writeFileSync(outputPath, [header, ...lines].join('\n'), 'utf8');

// ---------------------------------------------------------------------------
// Friendly summary
// ---------------------------------------------------------------------------

console.log(`\nDone! ${out.length} link(s) written to ${outputPath}. ${skipped.length} row(s) skipped.`);

if (!process.env.SITE_BASE_URL) {
  console.warn(
    '\nWARNING: SITE_BASE_URL is not set. Links use a placeholder host (REPLACE-ME-SET-SITE_BASE_URL).\n' +
    'Once the Phase 9 domain is deployed, add SITE_BASE_URL to .env.local and re-run this script.'
  );
}
