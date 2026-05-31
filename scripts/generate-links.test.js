import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, shapeRows, computeSoftDeletes, buildLinkUrl } from './lib/links.js';

// --- normalizeEmail ---

test('normalizeEmail: trims whitespace and lowercases', () => {
  assert.equal(normalizeEmail('  Foo@Bar.COM '), 'foo@bar.com');
});

test('normalizeEmail: already lowercase and trimmed is unchanged', () => {
  assert.equal(normalizeEmail('foo@bar.com'), 'foo@bar.com');
});

// --- shapeRows: blank display_name skip ---

test('shapeRows: row with empty display_name is excluded from .rows', () => {
  const raw = [{ display_name: '', email: 'test@example.com' }];
  const { rows, skipped } = shapeRows(raw);
  assert.equal(rows.length, 0, 'rows must be empty when only row has blank name');
  assert.equal(skipped.length, 1, 'skipped must record one entry');
});

test('shapeRows: row with whitespace-only display_name is excluded from .rows', () => {
  const raw = [{ display_name: '   ', email: 'test@example.com' }];
  const { rows, skipped } = shapeRows(raw);
  assert.equal(rows.length, 0, 'rows must be empty when only row has whitespace-only name');
  assert.equal(skipped.length, 1, 'skipped must record one entry');
});

test('shapeRows: skipped entry has correct 1-based line number (header=1, first data row=2)', () => {
  const raw = [{ display_name: '', email: 'test@example.com' }];
  const { skipped } = shapeRows(raw);
  assert.equal(skipped[0].line, 2, 'first data row index 0 must be line 2 (header is line 1)');
  assert.ok(typeof skipped[0].reason === 'string', 'skipped entry must have a reason string');
});

test('shapeRows: blank-name row in the middle does not drop later valid rows', () => {
  const raw = [
    { display_name: 'The Johnson Family', email: 'johnsons@example.com' },
    { display_name: '', email: 'blank@example.com' },
    { display_name: 'Mike & Sarah', email: 'mike@example.com' },
  ];
  const { rows, skipped } = shapeRows(raw);
  assert.equal(rows.length, 2, 'valid rows before and after blank must both be kept');
  assert.equal(skipped.length, 1, 'only the blank row is skipped');
  assert.equal(skipped[0].line, 3, 'middle blank row (index 1) must be line 3');
});

// --- shapeRows: email normalization on kept rows ---

test('shapeRows: valid row email is normalized (trimmed + lowercased)', () => {
  const raw = [{ display_name: 'The Johnson Family', email: '  JOHNSONS@EXAMPLE.COM  ' }];
  const { rows } = shapeRows(raw);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'johnsons@example.com');
});

// --- computeSoftDeletes ---

test('computeSoftDeletes: returns emails in DB-active but not in CSV', () => {
  const result = computeSoftDeletes(['a@x.com'], ['a@x.com', 'b@x.com']);
  assert.deepEqual(result, ['b@x.com']);
});

test('computeSoftDeletes: returns empty array when DB-active is empty', () => {
  const result = computeSoftDeletes(['a@x.com'], []);
  assert.deepEqual(result, []);
});

test('computeSoftDeletes: returns all DB-active emails when CSV is empty', () => {
  const result = computeSoftDeletes([], ['a@x.com']);
  assert.deepEqual(result, ['a@x.com']);
});

test('computeSoftDeletes: returns empty array when CSV and DB-active match exactly', () => {
  const result = computeSoftDeletes(['a@x.com', 'b@x.com'], ['a@x.com', 'b@x.com']);
  assert.deepEqual(result, []);
});

// --- buildLinkUrl ---

test('buildLinkUrl: builds correct URL with base URL and no trailing slash', () => {
  const url = buildLinkUrl('ID1', 'tok', 'https://x.com');
  assert.equal(url, 'https://x.com/i/ID1?t=tok');
});

test('buildLinkUrl: strips trailing slash from base URL (no double slash)', () => {
  const url = buildLinkUrl('ID1', 'tok', 'https://x.com/');
  assert.equal(url, 'https://x.com/i/ID1?t=tok', 'trailing slash must be stripped — no double slash');
});

test('buildLinkUrl: uses placeholder host when baseUrl is undefined', () => {
  const url = buildLinkUrl('ID1', 'tok', undefined);
  assert.ok(url.includes('/i/ID1?t=tok'), 'URL must contain the locked path and token');
  assert.ok(
    /placeholder|replace/i.test(url),
    'URL must contain a clearly-marked placeholder host (PLACEHOLDER or REPLACE, case-insensitive)'
  );
});

test('buildLinkUrl: uses placeholder host when baseUrl is falsy empty string', () => {
  const url = buildLinkUrl('ID1', 'tok', '');
  assert.ok(url.includes('/i/ID1?t=tok'), 'URL must contain the locked path and token');
  assert.ok(
    /placeholder|replace/i.test(url),
    'URL must contain placeholder when baseUrl is empty string'
  );
});
