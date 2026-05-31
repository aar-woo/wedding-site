import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Encode a payload object as a base64url string.
 * @param {Object} payload - { id, name, iat }
 * @returns {string} base64url-encoded UTF-8 JSON
 */
export function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Compute HMAC-SHA256 over a base64url payload string.
 * @param {string} base64urlPayload
 * @param {string} secret
 * @returns {string} base64url-encoded HMAC digest
 */
function hmac(base64urlPayload, secret) {
  return createHmac('sha256', secret).update(base64urlPayload).digest('base64url');
}

/**
 * Sign a payload and return the `t=` query value.
 * Format: `${base64urlPayload}.${base64urlHmac}`
 *
 * Callers are responsible for reading process.env.GUEST_TOKEN_SECRET and passing it here.
 * No secret is hardcoded in this file.
 *
 * @param {Object} payload - Must be { id, name, iat }
 * @param {string} secret - The HMAC signing secret (from process.env.GUEST_TOKEN_SECRET)
 * @returns {string} The `t=` query parameter value
 */
export function sign(payload, secret) {
  const b64 = encodePayload(payload);
  return `${b64}.${hmac(b64, secret)}`;
}

/**
 * Verify a `t=` token against a secret.
 * Returns true ONLY if the token is well-formed AND the HMAC matches.
 * Never throws on malformed input — guards and returns false.
 *
 * Uses crypto.timingSafeEqual (NOT ===) to prevent timing-oracle attacks.
 *
 * @param {string} token - The `t=` query parameter value
 * @param {string} secret - The HMAC signing secret (from process.env.GUEST_TOKEN_SECRET)
 * @returns {boolean}
 */
export function verify(token, secret) {
  if (typeof token !== 'string') return false;
  if (token.length === 0) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [b64, sig] = parts;
  if (!b64 || !sig) return false;

  try {
    const expected = hmac(b64, secret);
    const sigBuf = Buffer.from(sig, 'base64url');
    const expBuf = Buffer.from(expected, 'base64url');

    // Length check is required — timingSafeEqual throws if buffer lengths differ
    if (sigBuf.length !== expBuf.length) return false;

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
