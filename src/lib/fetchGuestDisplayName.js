/**
 * Pure async helper to fetch the authoritative display name for a guest from the DB.
 *
 * This module is browser-safe and secret-free. It calls GET /api/guest/:id and
 * returns the displayName string on HTTP 200 with a valid body, or null on any
 * failure (network error, 4xx/5xx, missing/empty displayName, abort, JSON error).
 *
 * This function NEVER throws — all error paths resolve null.
 */

/**
 * Fetch the DB-authoritative displayName for a guest.
 *
 * @param {string} id - The guest ID (nanoid) from the decoded token
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string | null>} - Resolves the displayName string, or null on any failure
 */
export async function fetchGuestDisplayName(id, { signal } = {}) {
  // Guard: id must be a non-empty string — no fetch for invalid input
  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  try {
    const url = `/api/guest/${encodeURIComponent(id)}`;
    const res = await fetch(url, { signal });

    // Any non-2xx response (404, 500, etc.) -> null
    if (!res.ok) {
      return null;
    }

    // Parse body — any JSON failure also falls through to null via catch
    const body = await res.json();

    // Validate displayName: must be a non-empty string
    if (body && typeof body.displayName === 'string' && body.displayName.length > 0) {
      return body.displayName;
    }

    return null;
  } catch {
    // Network error, AbortError, JSON SyntaxError — all silently return null
    return null;
  }
}
