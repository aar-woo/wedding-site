# Phase 8: Frontend Hook & API Endpoint - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the live site to the durable-link identity built in Phases 6–7. Two deliverables, against **BACK-02** and **BACK-03**:

1. **Frontend:** the SPA resolves the guest name entirely from the URL token on a new `/i/:id` route — instant greeting, **no network call on page load** — falling back gracefully when no/invalid token is present. The router gains `/i/:id` (and keeps `/`).
2. **Backend:** a `GET /api/guest/:id` Vercel serverless function (Node runtime) that looks the guest up in Neon and returns `{ id, displayName }` or 404 — the read contract the future RSVP write path reuses — plus `vercel.json` wiring `/api/*` ahead of the SPA catch-all.

**In scope:** `useGuestName` rewrite (token-first), `/i/:id` route, `api/guest/[id].js`, `vercel.json`, env discipline (no `VITE_` secrets).

**NOT in scope (later / other phases):**
- RSVP form/flow and any write endpoint (`POST /api/rsvp`) — future milestone (this phase only lays the read/validation foundation)
- Mobile/responsive polish + live Vercel deploy — **Phase 9** (EXP-01/02, DEPLOY-01)
- Re-minting links or schema changes — Phase 7 is done; this phase consumes it
- Rate limiting on the lookup endpoint — deferred to the RSVP milestone (low risk: 126-bit id space)

</domain>

<decisions>
## Implementation Decisions

### Greeting hook & name resolution (D-01, D-02, D-03)
- **D-01:** `useGuestName` is extended **in place** (not a new hook) so `GuestGreeting.jsx` stays unchanged. Resolution order: **(1)** read `?t=` and `decodeGuestToken(t)` → use `name` if non-null; **(2)** else legacy `?to=<name>` (kept — see D-04); **(3)** else fallback **"Our Beloved Guests"**.
- **D-02:** The greeting is **100% client-side token decode — no `fetch`, no API call on page load** (phase goal + ARCHITECTURE anti-pattern #1). `api/guest/:id` is NOT called by the hook/page.
- **D-03 (greeting edge cases):** missing / malformed / tampered token → fallback "Our Beloved Guests" (never an error screen, per Phase 6 D-04). `document.title` = `Save the Date – For {name}` **only** when a real name resolves (token or `?to=`); otherwise leave the default title. A token whose embedded `id` differs from the `/i/:id` path **still greets from the token name** — client decodes only; path/token-id consistency is a server-side concern for the future write path, not a client gate.

### Legacy `?to=` handling (D-04)
- **D-04:** Keep `?to=<name>` working as a **dev/preview shortcut** (e.g. `/?to=Test+Family` to preview layouts without minting a real link). It is the *second* resolution step after the token. No live `?to=` links exist (site isn't deployed yet), so this is purely a convenience, not a compatibility burden. Token is the real scheme.

### Routing (D-05)
- **D-05:** Add a `<Routes>` block in `App.jsx`: `/i/:id` and `/` both render `SaveTheDatePage` (same page; greeting differs only by what the hook resolves). `BrowserRouter` is already set up in `main.jsx` (unchanged). The `:id` path segment is the durable identity for the future RSVP route; the greeting itself only needs `?t=`.

### API endpoint trust model (D-06, D-07, D-08)
- **D-06 (auth):** `GET /api/guest/:id` is an **id-only lookup**. The unguessable 21-char nanoid IS the credential — no `?t=` token is required or read on this read path. Returns `{ id, displayName }` on 200. (Matches ROADMAP success criterion #2 verbatim. Token HMAC verification is reserved for the future RSVP **write** path, which will reuse `scripts/lib/token.js` `verify()` server-side.)
- **D-07 (name source):** `displayName` comes from the **Neon `display_name` column — the DB is the source of truth**. If a name is edited later (re-run `generate-links.js`), the endpoint reflects it. The endpoint never reads/trusts the token's name. (The client greeting still uses the token name; that's fine — endpoint is for server/RSVP use where DB truth matters.)
- **D-08 (removed/unknown):** The lookup filters `WHERE deleted_at IS NULL`. A **soft-deleted OR unknown id both return 404** (`{ error: "not found" }`) — does not leak existence, keeps criterion #2 simple. NOTE: a removed guest's *already-distributed* link still greets them client-side via the token (durability preserved); only the server/RSVP path treats them as inactive.

### Env discipline (D-09) — BACK-03
- **D-09:** `GUEST_TOKEN_SECRET` and `DATABASE_URL` are read via `process.env` **inside `api/` only**, never `VITE_`-prefixed, never imported into `src/`. The browser bundle contains no secret. Verified by `grep -r "VITE_" .env* src/` returning zero secret matches (criterion #3) and the client decode util needing no secret.

### Vercel config (D-10)
- **D-10:** `vercel.json` rewrites: `/api/(.*)` passthrough **first**, then `/(.*) → /index.html` SPA catch-all (order is critical — PITFALLS #5 / anti-pattern #4). This makes deep-linking to `/i/:id?t=...` in a fresh tab serve the SPA (criterion #4) while `/api/*` reaches the function.

### Claude's Discretion
- Exact `api/guest/[id].js` Neon query form (`@neondatabase/serverless` `neon()` tagged-template, parameterized on `id`), JSON error body shape beyond `{ error: "not found" }`, and HTTP method guard (405 for non-GET).
- Whether to extract the `?t=`-decode logic into a tiny helper vs inline in the hook.
- How `App.jsx` composes `MotionConfig` + `Routes` (keep `MotionConfig` wrapping the routed page).
- Whether `vercel.json` pins a Node runtime version in a `functions` block (default current LTS is fine).
- A throwaway/local check that `GET /api/guest/:id` returns 200/404 (e.g. `vercel dev` or a small node harness) — does not need to ship.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked contract (binding)
- `docs/identity-token-contract.md` — URL shape, payload `{id,name,iat}`, HMAC-SHA256, trust boundary (§4: HMAC verified server-side only), env-var naming (§5), fallback contract (§6). The frontend decode + the (future) server verify both flow from this.

### Phase 6 & 7 deliverables this phase consumes
- `src/lib/decodeGuestToken.js` — browser-safe `decodeGuestToken(token) → {id,name}|null`; the hook calls THIS. Already handles unicode + graceful null.
- `src/hooks/useGuestName.js` — current `?to=` reader (the rewrite target — extend in place).
- `src/components/GuestGreeting.jsx` — consumes `useGuestName().name`; should stay unchanged.
- `src/main.jsx` — `BrowserRouter` already mounted (add the route in `App.jsx`, not here).
- `scripts/lib/token.js` — `verify(token, secret)` (Node, secret-bearing); NOT used by the GET read path (D-06) but is the reusable primitive the RSVP write path will call. Do NOT import into `src/`.
- `scripts/migrate.js` — the live `guests` schema the endpoint queries (`id`, `display_name`, `deleted_at`, …).

### Milestone research (binding technical guidance)
- `.planning/research/ARCHITECTURE.md` — §"Pattern 3: Vercel api/ + SPA coexistence" (vercel.json), §"Pattern 4: Neon Postgres" (`@neondatabase/serverless` HTTP driver), §"Data Flow → Guest Link Load" (no-network greeting), anti-patterns #1/#3/#4/#5, component table (`api/guest/[id].js`).
- `.planning/research/STACK.md` — §1 Vercel Functions (Node runtime, NOT Edge — deprecated), `vercel.json` rewrite snippet, 12-function Hobby limit.
- `.planning/research/PITFALLS.md` — Pitfall 1 (`VITE_` leak — BACK-03), Pitfall 5 (catch-all-before-api ordering), Security Mistakes (PII not in logs — log `id` not name), UX (unknown-id graceful fallback).
- `.planning/research/SUMMARY.md` — §"Conflict 2" (signed token carries name; client decodes, server verifies), Phase 3 build notes (hook + API in one phase).

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — **BACK-02** (serverless lookup endpoint), **BACK-03** (server-only secrets, no `VITE_`).
- `.planning/ROADMAP.md` §"Phase 8" — goal + 4 success criteria (instant greeting, endpoint 200/404, no `VITE_` secrets, vercel.json deep-link routing).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `decodeGuestToken.js` already returns `{id,name}|null` with full graceful-fallback semantics — the hook rewrite is a thin wrapper choosing token vs `?to=` vs fallback.
- `useGuestName` already owns the `document.title` side-effect and the "Our Beloved Guests" fallback wording — extend its logic, keep its shape (`{ name, hasName }`).
- `scripts/lib/token.js verify()` exists and is tested (Phase 6) — ready for the future RSVP write path; the GET endpoint doesn't need it (D-06).
- Phase 7's live Neon `guests` table + `@neondatabase/serverless` usage pattern (see `scripts/generate-links.js`/`migrate.js`) is the template for the endpoint's DB query.

### Established Patterns
- React 19 / React Router v7: import from `react-router` (NOT `react-router-dom`). `useSearchParams` + `useParams` available. Current `App.jsx` renders the page directly with no `<Routes>` — this phase introduces routing.
- ESM throughout; `api/` functions use `process.env` (Node), `src/` never reads secrets.
- Trust boundary: `scripts/lib/` and `api/` may bear secrets; `src/` must not. `api/guest/[id].js` reading `process.env.DATABASE_URL` is correct; importing `scripts/lib/token.js` into `src/` is forbidden.

### Integration Points
- `.env.local` (gitignored, already created in Phase 7) holds `DATABASE_URL` + `GUEST_TOKEN_SECRET` for local `api/` testing; Phase 9 sets the same as Vercel env vars.
- `vercel.json` is new — first time `/api` coexists with the SPA build (`/dist`).
- The `/i/:id` route deep-link only works in production because of the `vercel.json` SPA rewrite (criterion #4); locally it works via the dev server.

</code_context>

<specifics>
## Specific Ideas

- The single load-bearing UX rule: the personalized greeting must appear **instantly with zero network latency** — the name rides in the signed token, decoded client-side. The API is deliberately OFF the page-load path; it exists only as the RSVP-foundation read contract.
- Keep the endpoint minimal and honest about the trust boundary: id-only read now, token-verify reserved for writes. Don't over-build auth the read path doesn't need.
- Log only `id`, never the guest name, in any `api/` function (PITFALLS — PII in logs).

</specifics>

<deferred>
## Deferred Ideas

- **Token HMAC verification on the GET read path** — considered (defense-in-depth) but rejected for the read endpoint; the unguessable id is the credential and `verify()` is reserved for the future RSVP write path. Revisit only if the read path ever returns sensitive data.
- **Rate limiting on `/api/guest/:id`** — deferred to the RSVP milestone (write path needs it more; 126-bit id space makes brute-force implausible).
- **410 Gone for soft-deleted guests** — chose 404 over 410 to avoid leaking existence and keep criterion #2 simple.
- **Removing `?to=` entirely** — kept as a dev/preview shortcut (D-04); a later cleanup milestone can drop it.
- **Mobile polish + Vercel deploy** — Phase 9.

</deferred>

---

*Phase: 08-frontend-hook-api-endpoint*
*Context gathered: 2026-05-31*
