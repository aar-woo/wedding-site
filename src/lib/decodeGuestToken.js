/**
 * Browser-safe, secret-free guest token decode utility.
 *
 * This file is imported by browser code (src/) and must NEVER:
 * - Import the Node-only secret-bearing token library from scripts/lib/
 * - Read any secret from the environment (server-only: see docs/identity-token-contract.md)
 * - Verify the HMAC signature (client has no access to the secret — D-04)
 *
 * It only base64url-decodes the payload segment of the `t=` query value
 * to extract { id, name } for display. HMAC verification happens server-side
 * on write paths (Phase 8).
 *
 * Token format: `<base64url-payload>.<base64url-hmac>`
 * (The `.` separator is mandatory; the hmac segment is ignored by this util.)
 */

/**
 * Decode a guest token's payload to { id, name }.
 *
 * @param {string|undefined} token - The `t=` query parameter value
 * @returns {{ id: string, name: string } | null} - Decoded payload, or null on any failure
 */
export function decodeGuestToken(token) {
  // Never throws — all error paths return null (LINK-03: graceful fallback)
  try {
    if (typeof token !== 'string' || token.length === 0) return null;

    // Extract the payload segment (before the dot separator)
    const dotIndex = token.indexOf('.');
    if (dotIndex <= 0) return null;
    const b64 = token.slice(0, dotIndex);
    if (!b64) return null;

    // Convert base64url to standard base64, then decode via atob (browser + Node 18+)
    const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');

    // UTF-8-safe decode: atob gives latin-1 bytes; decodeURIComponent(escape(...)) handles
    // multi-byte characters correctly (unicode names with &, accents, etc.)
    const json = decodeURIComponent(escape(atob(base64)));

    const payload = JSON.parse(json);

    // Validate required fields — both id and name must be non-empty strings
    if (
      !payload ||
      typeof payload.id !== 'string' ||
      payload.id.length === 0 ||
      typeof payload.name !== 'string' ||
      payload.name.length === 0
    ) {
      return null;
    }

    // Return only id + name — iat is informational only and not needed for display
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}
