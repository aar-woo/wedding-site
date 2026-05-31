# Phase 6: Identity Token Contract - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock and test the durable per-guest link **contract** before any dependent code (datastore, link-gen tooling, frontend hook, API) is written. This phase is a spec + a small, tested signing/decoding library — NOT the live frontend wiring (that is Phase 8) and NOT the datastore or link generation (Phase 7).

In scope (LINK-01, LINK-02, LINK-03):
1. A **written contract document** defining the URL shape, token payload schema, signing algorithm, and env-var naming convention — locked so changing it later is a deliberate "re-issue all links" decision.
2. `scripts/lib/token.js` — Node-side **sign + verify** (uses the secret) with a passing `verify(sign(payload)) === true` and tamper-detection (`verify` returns false on a mutated payload).
3. A small **client-side decode utility** (browser-safe, NO secret) that extracts `{ id, name }` from a token for display, with graceful fallback.
4. Validate criterion #4 (crafted valid URL → correct name; missing/malformed → "Our Beloved Guests") via a throwaway/manual check — NOT by rewriting the production `useGuestName` hook.

NOT in scope:
- Rewriting `useGuestName.js` / `GuestGreeting` to consume the token in the live app — **Phase 8**.
- Neon datastore + schema + link-generation script — **Phase 7**.
- The `/api` lookup endpoint + `vercel.json` — **Phase 8**.
- RSVP form/flow — future milestone.

</domain>

<decisions>
## Implementation Decisions

### Phase scope / boundary (D-01)
- **D-01:** Phase 6 ships **spec + token lib only**. Deliverables: the written contract doc, `scripts/lib/token.js` (Node sign/verify), and a browser-safe decode util. Criterion #4 is proven with a throwaway/manual check; the real `useGuestName` rewrite + greeting wiring stays in **Phase 8**. This keeps Phase 6 and Phase 8 from colliding on the same files.

### Token format & signing (D-02, D-03) — mostly locked at milestone level
- **D-02 (locked):** URL shape `/i/<id>?t=<base64url-payload>.<base64url-hmac>`. Payload schema `{ id, name, iat }`. Signing = **HMAC-SHA256 via Node `node:crypto`** producing the custom `<payload>.<hmac>` format. **No JWT/jose** in this milestone — node:crypto is zero-dep and sufficient; jose is reserved for a future RSVP-session-token need only.
- **D-03 (locked):** The signed payload includes **both `id` and `name`**, so the signature binds the name to that specific id — a guest can't swap the name segment onto another guest's id without breaking the (server-checked) signature. The `id` is the durable opaque identity a future RSVP keys on.

### Client trust model & fallback (D-04) — defines LINK-02 / LINK-03 contract
- **D-04:** The client **decodes only** — it base64url-decodes the payload to render the name with no network round-trip, and does **NOT** cryptographically verify the HMAC (the secret is server-only by design). Graceful fallback to **"Our Beloved Guests"** triggers on a missing, malformed, or undecodable token (bad base64, missing fields, wrong structure) — never an error screen. A *well-formed but forged* name cannot be detected on the client; that is acceptable because (a) the opaque `id` is the real identity and (b) the **server verifies the HMAC on any write path** (future RSVP). Tamper-evidence is a server-side guarantee, not a client one.

### Expiry (D-05)
- **D-05:** **No token expiry.** `iat` (issued-at) is informational/audit only — never enforced. Guests open links months later; expiring tokens is an explicit anti-feature.

### Env-var convention (D-06) — locked
- **D-06 (locked):** Secret = `GUEST_TOKEN_SECRET`, DB = `DATABASE_URL`. **Never `VITE_`-prefixed** (Vite inlines `VITE_*` into the client bundle). The contract doc states this convention in writing before any `api/` file exists. The browser decode util must work with NO secret.

### Claude's Discretion
- `id` generation specifics (default `nanoid` length ~21 chars / ~126 bits is fine; must be URL-safe and unguessable — no sequential/DB-serial ids in the URL).
- Exact name encoding for unicode/`&`/accents (UTF-8 → base64url round-trips correctly, e.g. "Mike & Sarah").
- Where the contract doc lives (e.g. `docs/identity-token-contract.md` or in the phase dir) and the exact file path of the client decode util (browser-safe location, e.g. `src/lib/`), separate from the secret-bearing `scripts/lib/token.js`.
- How the throwaway/manual criterion-#4 check is performed (small script or temporary harness), as long as it doesn't ship the production hook rewrite.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone research (binding technical guidance)
- `.planning/research/SUMMARY.md` — resolved decisions (Neon, signed-name-in-link, node:crypto), build order, security notes
- `.planning/research/STACK.md` — node:crypto vs jose rationale, nanoid, "what not to add"
- `.planning/research/ARCHITECTURE.md` — URL/route shape, client-decode-no-network pattern, component map
- `.planning/research/PITFALLS.md` — `VITE_` secret-leakage, link durability, guessable-id, PII-in-URL pitfalls (each mapped to a phase)

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — LINK-01, LINK-02, LINK-03 (this phase); BACK-03 env discipline (related)
- `.planning/ROADMAP.md` §"Phase 6: Identity Token Contract" — goal + 4 success criteria

### Current code (integration awareness — modified in Phase 8, not here)
- `src/hooks/useGuestName.js` — current `?to=` reader (the Phase 8 rewrite target; Phase 6 only mirrors its fallback semantics)
- `src/components/GuestGreeting.jsx` — consumer of the name
- `src/main.jsx` — `BrowserRouter` setup (the `/i/:id` route is added in Phase 8)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useGuestName.js` already implements the fallback contract ("Our Beloved Guests" when no name) and `document.title` side-effect — Phase 8 will adapt this to decode the token; Phase 6 mirrors its fallback wording so the contract is consistent.

### Established Patterns
- ESM project (`"type": "module"`) — `scripts/lib/token.js` and the decode util use ESM `import`. `node:crypto` is built-in (no dep).
- Router import is from `react-router` (v7), not `react-router-dom`.
- No backend/deps yet — Phase 6 adds no runtime dependencies (node:crypto is built-in; `nanoid` enters in Phase 7 for the link-gen script).

### Integration Points
- The browser decode util must be importable by the future Phase 8 `useGuestName` rewrite — keep it secret-free and framework-agnostic.
- `scripts/lib/token.js` (sign/verify, secret-bearing) is reused by Phase 7's link-generation script and the future server-side verify.

</code_context>

<specifics>
## Specific Ideas

- The single most consequential, irreversible artifact of this phase is the **written contract** — once links are minted (Phase 7) and sent, the URL shape / payload schema / signing cannot change without re-issuing every link. Treat the contract doc as the source of truth all later phases cite.
- Split the lib by trust boundary: **secret-bearing sign/verify in `scripts/lib/`** (Node only), **secret-free decode in a browser-safe location**. This makes the `VITE_`/secret-leak pitfall structurally impossible.

</specifics>

<deferred>
## Deferred Ideas

- Client-verifiable (asymmetric/public-key) signatures — considered and rejected (overkill for a keepsake greeting; HMAC + server-side write verification is sufficient). Revisit only if client-side tamper-proofing ever becomes a real requirement.
- `jose`/JWT session tokens — reserved for a future RSVP milestone if full session auth is needed; not this milestone.
- Token expiry / rotation — intentionally out (guests open links months later).

</deferred>

---

*Phase: 06-identity-token-contract*
*Context gathered: 2026-05-31*
