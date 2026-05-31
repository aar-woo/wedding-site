// Run: node scripts/check-link.js [path/to/links.csv]
// (No --env-file needed — decodeGuestToken uses no secret; Node 18+ required for atob)
//
// End-to-end verification harness for generated links.
// Reads links.csv, validates the expected column set, then extracts the `t=`
// query param from the first data row's URL, decodes it via the browser-safe
// decodeGuestToken util, and asserts the decoded name + id match the row.
//
// Exit 0 on PASS, exit 1 on any failure.

import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { decodeGuestToken } from '../src/lib/decodeGuestToken.js';
// (scripts→src import direction is allowed; NEVER the reverse — see CLAUDE.md)

// ---------------------------------------------------------------------------
// Read links.csv
// ---------------------------------------------------------------------------

const csvPath = process.argv[2] || 'links.csv';

let raw;
try {
  raw = readFileSync(csvPath, 'utf8');
} catch (err) {
  console.error(`links.csv not found or empty — run: npm run db:generate-links first`);
  console.error(`(Tried path: "${csvPath}" — ${err.message})`);
  process.exit(1);
}

const rows = parse(raw, { columns: true });

if (!rows || rows.length === 0) {
  console.error('links.csv not found or empty — run: npm run db:generate-links first');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate column set — LINK-04 column check
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = ['id', 'display_name', 'email', 'url'];
const actualColumns = Object.keys(rows[0]);
const missing = EXPECTED_COLUMNS.filter((c) => !actualColumns.includes(c));
const extra = actualColumns.filter((c) => !EXPECTED_COLUMNS.includes(c));

if (missing.length > 0 || extra.length > 0) {
  console.error('Column validation FAILED for links.csv');
  console.error(`  Expected: ${EXPECTED_COLUMNS.join(', ')}`);
  console.error(`  Got:      ${actualColumns.join(', ')}`);
  if (missing.length > 0) console.error(`  Missing:  ${missing.join(', ')}`);
  if (extra.length > 0)   console.error(`  Extra:    ${extra.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Decode the first row's URL and assert name + id round-trip
// ---------------------------------------------------------------------------

const row = rows[0];

let token;
try {
  token = new URL(row.url).searchParams.get('t');
} catch (err) {
  console.error(`FAIL: Could not parse URL from first row: "${row.url}"`);
  console.error(err.message);
  process.exit(1);
}

if (!token) {
  console.error(`FAIL: No "t=" query parameter in URL: "${row.url}"`);
  process.exit(1);
}

const decoded = decodeGuestToken(token);

if (decoded === null) {
  console.error(`FAIL: decodeGuestToken returned null for token extracted from: "${row.url}"`);
  process.exit(1);
}

if (decoded.name !== row.display_name) {
  console.error(`FAIL: Name mismatch.`);
  console.error(`  Decoded name: "${decoded.name}"`);
  console.error(`  Row display_name: "${row.display_name}"`);
  process.exit(1);
}

if (decoded.id !== row.id) {
  console.error(`FAIL: ID mismatch.`);
  console.error(`  Decoded id: "${decoded.id}"`);
  console.error(`  Row id: "${row.id}"`);
  process.exit(1);
}

console.log(`PASS: "${decoded.name}" (id ${decoded.id}) decoded from links.csv URL`);
process.exit(0);
