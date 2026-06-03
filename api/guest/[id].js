// api/guest/[id].js
// GET /api/guest/:id — id-only guest lookup (no token verify on this read path, D-06)
// Node.js runtime (NOT Edge — deprecated). Reads process.env only (D-09).

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Method guard — only GET is supported
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { id } = req.query;

  // Guard: id must be a non-empty string
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'bad request' });
  }

  // Create Neon client — per-invocation, HTTP driver (no persistent TCP pool)
  const sql = neon(process.env.DATABASE_URL);

  // Log only id — never log the guest name (PITFALLS: PII in logs, D-06)
  console.log(`GET /api/guest/${id}`);

  try {
    const rows = await sql`
      SELECT id, display_name
      FROM guests
      WHERE id = ${id}
        AND deleted_at IS NULL
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const { id: guestId, display_name } = rows[0];
    return res.status(200).json({ id: guestId, displayName: display_name });

  } catch (err) {
    // Log error without PII
    console.error(`DB error for guest lookup id=${id}:`, err.message);
    // TEMP DIAGNOSTIC (09-03 debug) — secret-safe: host only, names only, redacted message. REMOVE after diagnosis.
    let dbHost = 'NO_DATABASE_URL';
    try { dbHost = new URL(process.env.DATABASE_URL).host; } catch { /* unset */ }
    const dbEnvNames = Object.keys(process.env)
      .filter((k) => /DATABASE|POSTGRES|PG|NEON/i.test(k))
      .sort();
    return res.status(500).json({
      error: 'internal server error',
      diag: {
        dbHost,
        dbEnvNames,
        errName: err?.name ?? null,
        errMessage: String(err?.message ?? '').replace(/\/\/[^@\s]*@/g, '//[REDACTED]@'),
      },
    });
  }
}
