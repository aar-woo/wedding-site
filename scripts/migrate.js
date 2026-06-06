// Run: node --env-file=.env.local scripts/migrate.js
// Or:  npm run db:migrate
//
// Idempotent DDL migration — safe to run multiple times against the same Neon DB.
// Creates the guests table with all locked schema columns (Phase 7, BACK-01).

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Provision Neon and add DATABASE_URL to .env.local, then run: npm run db:migrate'
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Create the guests table with all 9 locked columns.
// id is minted in JS via nanoid (never serial) — TEXT PRIMARY KEY.
// first_seen_at is written by Phase 8 lookup endpoint on first visit, NOT here.
// rsvp_* columns are stubs reserved for a future RSVP milestone.
await sql`
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
  )
`;

// Additive ALTER statements — idempotent for tables created by an older migration version
// that lacked these columns. CREATE TABLE IF NOT EXISTS is a no-op on existing tables,
// so these ALTERs ensure any missing columns are added on re-run.
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_status TEXT`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_count INTEGER`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_submitted_at TIMESTAMPTZ`;
await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ`;

console.log('Migration complete: guests table ready.');
