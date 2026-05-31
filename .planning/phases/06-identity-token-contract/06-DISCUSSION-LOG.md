# Phase 6: Identity Token Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 06-identity-token-contract
**Areas discussed:** Phase 6/8 boundary, Client trust model, Token library

---

## Phase 6 / Phase 8 boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Spec + token lib only | Phase 6 = contract doc + scripts/lib/token.js (Node sign/verify) + small client decode util; criterion #4 via throwaway/manual check; useGuestName rewrite stays Phase 8 | ✓ |
| Also wire the hook now | Phase 6 also rewrites useGuestName.js to decode + fallback; Phase 8 shrinks to API only | |

**User's choice:** Spec + token lib only
**Notes:** Keeps Phase 6 and Phase 8 from colliding on the same frontend files.

---

## Client trust model

| Option | Description | Selected |
|--------|-------------|----------|
| Decode-only + structural fallback | Client base64-decodes payload for name; fallback on missing/malformed; does NOT verify HMAC (no client secret); server verifies on future writes | ✓ |
| Add a client-verifiable signature | Asymmetric/public-key scheme so client can verify authenticity | |

**User's choice:** Decode-only + structural fallback
**Notes:** A well-formed forged name can't be caught client-side — acceptable; opaque id is the real identity, server verifies on RSVP writes.

---

## Token library / format

| Option | Description | Selected |
|--------|-------------|----------|
| node:crypto custom format | Raw node:crypto HMAC-SHA256 → `<base64url-payload>.<base64url-hmac>` (locked shape), zero deps | ✓ |
| jose (JWT) now | jose + standard JWT (HS256), anticipating RSVP session tokens | |

**User's choice:** node:crypto custom format
**Notes:** jose/JWT reserved for a future RSVP-session need only.

## Claude's Discretion

- nanoid id length/alphabet (default ~21 chars fine; URL-safe, unguessable)
- unicode/`&`/accent name encoding (UTF-8 → base64url)
- contract doc location + client decode util path (browser-safe, secret-free)
- how the throwaway criterion-#4 check is performed

## Deferred Ideas

- Client-verifiable asymmetric signatures (rejected — overkill)
- jose/JWT session tokens (future RSVP milestone)
- Token expiry / rotation (out — guests open links months later)
