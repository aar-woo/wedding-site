# Identity Token Contract

**Status: LOCKED**

> This contract is locked. Once per-guest links are minted (Phase 7) and distributed to guests,
> the URL shape, payload schema, and signing algorithm **cannot change without re-issuing every
> guest link**. Treat every field and format described here as a permanent, binding commitment.
> Changing any locked element is a deliberate "re-issue all links" decision.
>
> Locked decisions: D-02 (URL shape + payload + signing), D-03 (signature binds id + name),
> D-04 (trust boundary — client decodes only), D-05 (no expiry), D-06 (env-var naming).

---

## 1. URL Shape

```
/i/<id>?t=<base64url-payload>.<base64url-hmac>
```

- **`/i/<id>`** — the path segment. `<id>` is an opaque, URL-safe, unguessable string (a nanoid
  of ~21 characters, ~126 bits of entropy). It is the durable guest identity — the value a future
  RSVP will key on. **No sequential or database-serial integers appear in the URL** (an enumerable
  sequential ID would allow an attacker to harvest all guest names, per PITFALLS Pitfall 3).

- **`?t=<base64url-payload>.<base64url-hmac>`** — the token query parameter. The value consists of
  exactly two base64url segments joined by a literal dot (`.`):
  - `<base64url-payload>`: a base64url-encoded UTF-8 JSON object (see § Payload Schema below).
  - `<base64url-hmac>`: a base64url-encoded HMAC-SHA256 digest over the payload segment.

---

## 2. Payload Schema

The payload is a JSON object with exactly three fields:

```json
{ "id": "<opaque-id>", "name": "Guest Display Name", "iat": 1748000000 }
```

Canonical form: `{ id, name, iat }`

| Field | Type   | Description |
|-------|--------|-------------|
| `id`  | string | Opaque, URL-safe, unguessable identifier. The durable guest identity (LINK-01). A future RSVP keys on this value. Must match the `<id>` in the URL path. |
| `name`| string | Guest display name, UTF-8. May contain `&`, accents, emoji, and other unicode characters (e.g. `"Mike & Sarah"`, `"The García Family"`). |
| `iat` | number | Issued-at timestamp, Unix epoch seconds. **Informational only — never enforced.** Provided for audit/debugging. No link expiry per D-05; guests open links weeks or months after minting. |

**No other fields.** Do not add `version`, `purpose`, `exp`, or any phase-specific claim. Extra
fields are a pitfall: if the signed payload ever changes, all previously issued links fail
server-side validation and must be re-issued (PITFALLS Pitfall 4). The contract is minimal by
design.

---

## 3. Signing Algorithm

**Algorithm:** HMAC-SHA256 via Node's built-in `node:crypto`.

**No JWT / jose.** The `node:crypto` implementation is zero-dependency, battle-tested, and
sufficient for this use case. `jose` is reserved for a future RSVP-session-token need only.

**Token (`t=` value) format:**

```
${base64urlPayload}.${base64urlHmac}
```

Where:

1. `base64urlPayload = Buffer.from(JSON.stringify({ id, name, iat }), 'utf8').toString('base64url')`
2. `base64urlHmac = createHmac('sha256', GUEST_TOKEN_SECRET).update(base64urlPayload).digest('base64url')`
3. The token is the two values concatenated with a literal `.` separator.

**Why the signature binds both `id` and `name` (D-03):** The HMAC is computed over the
base64url-encoded payload, which encodes both `id` and `name` together. This means a guest cannot
swap the name segment from one link onto a different guest's `id` without breaking the
server-checked signature. The `id` is the real credential; the `name` in the payload is
authoritative only after server-side HMAC verification.

**Timing-safe comparison:** The server-side `verify()` function uses `crypto.timingSafeEqual` (not
`===` / `==`) to compare the expected and received HMAC buffers, preventing timing-oracle attacks.

---

## 4. Trust Boundary

Two files implement this contract, with a strict security split:

### `scripts/lib/token.js` — Node-only, secret-bearing

- **Exports:** `sign(payload, secret)`, `verify(token, secret)`, `encodePayload(payload)`
- **Reads:** `GUEST_TOKEN_SECRET` from `process.env` (caller's responsibility)
- **Used by:** Phase 7 link-generation script, Phase 8 server-side write verification
- **Must never be imported into `src/`** — it is a Node-only module with access to the signing secret

### `src/lib/decodeGuestToken.js` — browser-safe, secret-free

- **Exports:** `decodeGuestToken(token)` — returns `{ id, name }` on success, `null` on failure
- **Does NOT verify the HMAC.** The secret is server-only by design (D-04); the browser decode
  utility has no access to it and must not need it.
- **Does NOT read** `process.env` or `import.meta.env` for any secret — it must work with no secret.
- **Base64url-decodes only the payload segment** to extract the display name for rendering. The
  `<base64url-hmac>` segment is ignored by the client.

### When is the HMAC verified?

The HMAC is verified **server-side only**, on future write paths (e.g. RSVP submission — Phase 8).
Client-side tamper-detection is **intentionally not a guarantee** (D-04). A well-formed but
forged name cannot be detected on the client; this is acceptable because:
- The opaque `id` is the real identity credential (not the name).
- Any write path (future RSVP) will verify the HMAC server-side before trusting the payload.
- A guest who forges their own display name sees a wrong greeting — it does not affect data integrity.

---

## 5. Environment Variable Naming Convention

| Variable | Purpose | Prefix |
|----------|---------|--------|
| `GUEST_TOKEN_SECRET` | HMAC signing secret | **Never `VITE_`-prefixed** |
| `DATABASE_URL` | Neon Postgres connection string (Phase 7) | **Never `VITE_`-prefixed** |

**Why no `VITE_` prefix (D-06 / BACK-03, PITFALLS Pitfall 1):**

Vite statically inlines any environment variable prefixed with `VITE_` into the JavaScript bundle
at build time via `import.meta.env` substitution. Any `VITE_`-prefixed secret is exposed to every
visitor's browser in the minified JS, silently and completely. A documented real-world incident
resulted in AWS keys and CI/CD credentials being compiled into a production bundle.

The rule is absolute:
- `VITE_*` = genuinely public config only (e.g. `VITE_WEDDING_DATE=2027-05-30`)
- `GUEST_TOKEN_SECRET`, `DATABASE_URL` = server-only, read via `process.env` inside `api/` functions
- The browser decode utility (`src/lib/decodeGuestToken.js`) works with **no secret** — it decodes
  the base64url payload only, without cryptographic verification

Audit with: `grep -r "VITE_" .env* src/` — every result must be a genuinely public value. Zero
secrets.

---

## 6. Fallback Contract

A missing, malformed, or undecodable token falls back gracefully — never to an error screen
(LINK-03, D-04).

- `decodeGuestToken(undefined)` → `null`
- `decodeGuestToken('')` → `null`
- `decodeGuestToken('garbage-no-dot')` → `null`
- `decodeGuestToken('notbase64!!.sig')` → `null`
- Any JSON with missing `id` or `name` fields → `null`

The future Phase 8 hook maps `null` to the literal greeting string **"Our Beloved Guests"**,
mirroring the current `src/hooks/useGuestName.js` fallback. The guest sees a warm, personalized-
feeling page even when no valid token is present.

The decode utility must never throw — all error paths return `null`.

---

## 7. Implementation Files

| File | Role | Scope |
|------|------|-------|
| `scripts/lib/token.js` | Sign + verify (HMAC-SHA256, secret-bearing) | Node only |
| `scripts/lib/token.test.js` | node:test suite: round-trip, tamper, unicode | Node only |
| `src/lib/decodeGuestToken.js` | Secret-free payload decode | Browser + Node |
| `src/lib/decodeGuestToken.test.js` | node:test suite: valid, malformed, missing | Node only |
| `scripts/check-token-url.js` | Criterion-#4 harness (throwaway) | Node only |

---

## 8. What Is Out of Scope for This Phase

The following are **Phase 7 / Phase 8** concerns and must not be implemented in Phase 6:

- `src/hooks/useGuestName.js` rewrite (Phase 8)
- `/i/:id` route in `src/main.jsx` (Phase 8)
- Neon datastore schema or `scripts/generate-links.js` (Phase 7)
- Any `api/` endpoint or `vercel.json` (Phase 8)
- New runtime dependencies — `node:crypto` and `node:test` are built-in; no `nanoid`, `jose`, etc.

---

*Phase: 06-identity-token-contract*
*Contract locked: 2026-05-31*
*Change this document only if you are prepared to re-issue every guest link.*
