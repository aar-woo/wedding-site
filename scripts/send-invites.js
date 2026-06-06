// Run: node --env-file=.env.local scripts/send-invites.js [--dry-run] [--resend]
// Or:  npm run send-invites [-- --dry-run] [-- --resend]
//
// Reads links.csv, looks each guest up in Neon by id, and emails non-deleted /
// not-yet-invited guests via Nodemailer + Gmail SMTP.
//
// Flags:
//   --dry-run         Print who WOULD be emailed; send nothing; write nothing to DB.
//   --resend, --force Re-send even if invited_at is already set; refreshes timestamp.
//
// Idempotency: invited_at is set ONLY after a successful send. A failed send
// leaves the guest un-marked so the next run retries them automatically.
//
// Requires: DATABASE_URL, GMAIL_USER, GMAIL_APP_PASSWORD in .env.local.
// Node 20+ required for --env-file support.

import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';
import { renderInvite } from './lib/email-template.js';

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isResend = args.includes('--resend') || args.includes('--force');

// ---------------------------------------------------------------------------
// Fail-fast guards — clear human-readable errors before touching the DB or SMTP
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Add it to .env.local, then run: npm run send-invites'
  );
  process.exit(1);
}

// Gmail credentials are only needed for a real send — --dry-run previews the
// recipient list (links.csv + DB lookup) without creating an SMTP transport,
// so guests can be reviewed before a Google App Password is generated.
if (!isDryRun) {
  if (!process.env.GMAIL_USER) {
    console.error(
      'GMAIL_USER is not set. Add your Gmail address to .env.local (see .env.example).'
    );
    process.exit(1);
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    console.error(
      'GMAIL_APP_PASSWORD is not set. Generate a 16-char Google App Password and add it to .env.local (see .env.example).'
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Read + parse links.csv
// ---------------------------------------------------------------------------

let raw;
try {
  raw = readFileSync('links.csv', 'utf8');
} catch (err) {
  console.error(`links.csv not found — run: npm run db:generate-links first`);
  console.error(`(${err.message})`);
  process.exit(1);
}

const rows = parse(raw, { columns: true });

if (!rows || rows.length === 0) {
  console.error('links.csv is empty — run: npm run db:generate-links first');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate expected column set (mirror check-link.js EXPECTED_COLUMNS check)
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = ['id', 'display_name', 'email', 'url'];
const actualColumns = Object.keys(rows[0]);
const missingCols = EXPECTED_COLUMNS.filter((c) => !actualColumns.includes(c));

if (missingCols.length > 0) {
  console.error('links.csv column validation FAILED.');
  console.error(`  Expected columns: ${EXPECTED_COLUMNS.join(', ')}`);
  console.error(`  Got:              ${actualColumns.join(', ')}`);
  console.error(`  Missing:          ${missingCols.join(', ')}`);
  console.error('Re-run: npm run db:generate-links');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// DB + SMTP setup
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL);

// Build transport only when actually sending (skip in --dry-run)
let transport;
if (!isDryRun) {
  transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const FROM = `Rina & Aaron <${process.env.GMAIL_USER}>`;

// ---------------------------------------------------------------------------
// Per-row idempotent send loop
// ---------------------------------------------------------------------------

let sent = 0;
let skippedInvited = 0;
let skippedDeleted = 0;
let skippedNotFound = 0;
let wouldSend = 0;
let failed = 0;

for (const row of rows) {
  // Look up current DB state by id
  const dbRows = await sql`SELECT invited_at, deleted_at FROM guests WHERE id = ${row.id}`;

  if (dbRows.length === 0) {
    console.warn(`WARN: id "${row.id}" (${row.display_name}) not found in DB — skipping.`);
    skippedNotFound++;
    continue;
  }

  const guest = dbRows[0];

  // Soft-deleted guests are ALWAYS skipped — never email them
  if (guest.deleted_at !== null) {
    skippedDeleted++;
    continue;
  }

  // Already-invited guests are skipped unless --resend
  if (guest.invited_at !== null && !isResend) {
    skippedInvited++;
    continue;
  }

  // This guest is a send candidate
  if (isDryRun) {
    console.log(`WOULD email ${row.display_name} <${row.email}> -> ${row.url}`);
    wouldSend++;
    continue;
  }

  // Real send path
  const { subject, html, text } = renderInvite({
    displayName: row.display_name,
    url: row.url,
  });

  try {
    await transport.sendMail({
      from: FROM,
      to: row.email,
      subject,
      html,
      text,
    });
    // Set invited_at ONLY after a confirmed successful send (idempotency)
    await sql`UPDATE guests SET invited_at = now() WHERE id = ${row.id}`;
    sent++;
  } catch (err) {
    console.error(`FAILED to send to ${row.email}: ${err.message}`);
    failed++;
    // Do NOT set invited_at — this guest will be retried on the next run
  }
}

// ---------------------------------------------------------------------------
// Friendly summary
// ---------------------------------------------------------------------------

if (isDryRun) {
  console.log(
    `\nDry run: ${wouldSend} would be emailed, ${skippedInvited} already invited, ${skippedDeleted} deleted. Nothing sent, nothing written.`
  );
  if (skippedNotFound > 0) {
    console.warn(`  (${skippedNotFound} id(s) not found in DB — re-run db:generate-links if needed)`);
  }
} else {
  let summary = `\nDone! ${sent} sent, ${skippedInvited} skipped (already invited), ${skippedDeleted} skipped (deleted).`;
  if (failed > 0) {
    summary += ` ${failed} failed (will retry next run).`;
  }
  console.log(summary);
  if (skippedNotFound > 0) {
    console.warn(`  (${skippedNotFound} id(s) not found in DB — re-run db:generate-links if needed)`);
  }
}
