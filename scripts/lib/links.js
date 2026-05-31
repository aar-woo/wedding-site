/**
 * Pure, DB-free, crypto-free helpers for link generation.
 * The DB wiring and token signing live in scripts/generate-links.js (plan 07-03).
 *
 * No database import, no crypto import — these functions are unit-testable
 * without any external infrastructure.
 */

/**
 * Normalize an email address: trim whitespace and lowercase.
 * Used everywhere an email is read or keyed to prevent duplicate rows from
 * casing differences (e.g. FOO@BAR.COM and foo@bar.com must resolve to the same row).
 *
 * @param {string} email
 * @returns {string} trimmed + lowercased email
 */
export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

/**
 * Shape raw CSV rows for upsert:
 * - Skip rows with blank/whitespace-only display_name; collect a warning per skip
 *   with a 1-based line number (CSV header = line 1, so first data row = line 2).
 * - Normalize email on kept rows.
 * - Does NOT throw or abort on a blank-name row — the run continues.
 *
 * @param {Array<{display_name: string, email: string}>} rawRows - Parsed CSV rows (header already consumed)
 * @returns {{ rows: Array<{display_name: string, email: string}>, skipped: Array<{line: number, reason: string}> }}
 */
export function shapeRows(rawRows) {
  const rows = [];
  const skipped = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Line number: header is line 1, so first data row (index 0) is line 2
    const lineNumber = i + 2;

    const rawName = row.display_name;
    const nameStr = rawName != null ? String(rawName) : '';

    if (nameStr.trim() === '') {
      skipped.push({ line: lineNumber, reason: 'blank display_name' });
      continue;
    }

    rows.push({
      display_name: nameStr.trim(),
      email: normalizeEmail(row.email),
    });
  }

  return { rows, skipped };
}

/**
 * Compute the set of emails to soft-delete:
 * emails that are active in the DB but absent from the current CSV run.
 *
 * @param {string[]} activeCsvEmails - Normalized emails present in this CSV run
 * @param {string[]} dbActiveEmails - Normalized emails currently NOT soft-deleted in the DB
 * @returns {string[]} Emails to soft-delete (in DB but not in CSV)
 */
export function computeSoftDeletes(activeCsvEmails, dbActiveEmails) {
  // Normalize inputs defensively
  const csvSet = new Set(activeCsvEmails.map(normalizeEmail));
  return dbActiveEmails.map(normalizeEmail).filter(e => !csvSet.has(e));
}

/**
 * Build the locked durable guest link URL.
 * Shape: `${base}/i/${id}?t=${token}`
 *
 * Strips any trailing slash(es) from base to prevent double-slash URLs.
 * Falls back to a clearly-marked placeholder host if baseUrl is falsy.
 *
 * @param {string} id - The guest's opaque nanoid (~21 chars)
 * @param {string} token - The signed `t=` query value from scripts/lib/token.js sign()
 * @param {string|undefined} baseUrl - The site base URL (e.g. from SITE_BASE_URL env var)
 * @returns {string} Full durable link URL
 */
export function buildLinkUrl(id, token, baseUrl) {
  const PLACEHOLDER = 'https://REPLACE-ME-SET-SITE_BASE_URL.example';
  const base = (baseUrl || PLACEHOLDER).replace(/\/+$/, '');
  return `${base}/i/${id}?t=${token}`;
}
