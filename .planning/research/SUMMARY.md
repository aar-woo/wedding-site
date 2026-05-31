# Project Research Summary

**Project:** Wedding Save-the-Date — Aaron & Rina (v2.0 Guest Identity + RSVP Foundation)
**Domain:** Personalized per-guest invite link identity with serverless backend on a static Vite SPA
**Researched:** 2026-05-30
**Confidence:** HIGH

---

## Executive Summary

v2.0 adds durable per-guest link identity to an existing, fully-working animated save-the-date SPA. The pattern is well-understood: mint a hard-to-guess opaque ID per guest, store a minimal record in a datastore, embed a display name in the URL so the greeting renders instantly without a network call, and expose a single serverless validation endpoint that the future RSVP flow reuses. The entire addition is small — two or three new files in `api/`, a local link-generation script, one modified hook, and a `vercel.json`. The existing React/Vite/Framer Motion layer is completely untouched.

The two consequential design decisions are the datastore choice and how (or whether) the display name travels in the URL. Both are resolved below with recommended defaults and clear rationale — but both must be locked in writing before a single link is generated or any code is committed to `api/`, because changing either after links are issued forces re-minting every URL and redistributing to all guests. The recommended approach uses **Neon Postgres** (relational, future-RSVP-compatible, no inactivity-pause risk) and carries the **display name in a signed URL token alongside an opaque nanoid ID** (instant greeting, tamper-resistant, no DB round-trip on page load).

The two critical risks are (1) accidentally leaking secrets into the client JS bundle via `VITE_` env-var prefix — a completely silent Vite design property with real-world precedent — and (2) choosing a URL/token scheme that cannot carry RSVP state later, forcing a re-issue of every personalized link. Both are fully preventable by establishing one naming convention and locking the URL shape before writing any backend code.

---

## Resolved Conflicts

### Conflict 1: Datastore — Upstash Redis vs. Neon Postgres

STACK.md recommends **Upstash Redis** (key-value simplicity, free tier has no inactivity pause, `GET guest:{id}` is one line). ARCHITECTURE.md recommends **Neon Postgres** (relational, better for future RSVP columns and admin queries like "all guests who have not responded").

**Recommendation: Neon Postgres.**

Rationale: The dataset is 50–200 rows — trivially small for either option. What tips the decision is the future RSVP requirement. Redis is optimized for single-key lookups and TTL expiry; adding `rsvp_status`, `rsvp_count`, `rsvp_submitted_at`, and per-field queries later is awkward (requires either serializing extra fields into a JSON blob or adding secondary Redis data structures). Postgres handles those columns naturally with a single `ALTER TABLE`. Neon's free tier does **not** pause after inactivity (unlike Supabase, which pauses after 7 days — a showstopper for a live wedding site). The `@neondatabase/serverless` HTTP driver has zero persistent-connection overhead in Vercel Node.js functions. Upstash Redis remains a valid alternative if schema complexity never materializes, but Neon is the lower-regret default.

This is confirmable at requirements time if the couple has a strong preference for simplicity over future flexibility.

### Conflict 2: Display Name in URL vs. Opaque ID Only

STACK.md and ARCHITECTURE.md favor carrying the display name in the URL (HMAC-signed token `?t=base64(payload).sig`) so the guest greeting renders instantly with no network call — matching today's `?to=` UX. PITFALLS.md favors opaque-ID-only (name lives in the DB, never in the URL) to eliminate PII in URLs, prevent name-change issues requiring re-issue, and remove any risk of payload-schema drift breaking old links.

**Recommendation: Signed token carrying the display name, with strict separation of client decode vs. server verify.**

Rationale: The instant greeting is load-bearing UX for a keepsake site — the animation sequence is designed around it. A DB round-trip on every page load adds cold-start latency to the most important moment (the guest's first impression). The signed-payload approach keeps that instant, while HMAC signing makes casual name forgery detectable.

The PITFALLS concern about PII in URLs is real but manageable: the guest's own name appearing in a URL they received by email is not a meaningful privacy exposure for a wedding invite. The schema-drift concern is addressed by keeping the token payload minimal (`{ id, name }` — no version or purpose fields that would break on schema change) and by treating the token as a display hint only on the client (decode, don't verify) and as a security boundary only on the server (verify HMAC before any write).

**The client MUST NOT verify HMAC** (the secret would be `VITE_`-prefixed and leaked into the bundle). The client decodes the base64 payload for the name display; the Vercel function verifies the HMAC signature before trusting anything on mutation paths.

**This decision must be locked before any links are generated.** Post-mint changes to the token format or URL shape require re-issuing every personalized URL.

---

## Key Findings

### Recommended Stack

The existing stack (React 19, Vite, Framer Motion, React Router v7, CSS Modules) requires no changes. v2.0 additions are purely additive: a serverless API layer, a datastore, and a local tooling script.

Vercel Functions use the `/api` directory convention with Node.js runtime. The Edge runtime is deprecated per official Vercel docs (2025/2026) and must not be used. The Hobby plan allows 12 functions; v2.0 needs 2–3.

**Core technologies:**
- **Neon Postgres** (`@neondatabase/serverless`): datastore for guest records — HTTP driver, no TCP pool, free tier, relational for future RSVP columns, no inactivity pause
- **nanoid `^5.1.x`**: opaque 21-character guest ID generation in the local link-generation script — ESM-only, compatible with the project's `"type":"module"` setup
- **`node:crypto` (built-in)**: HMAC-SHA256 signing in the link-generation script and server-side verification in the Vercel function — zero additional dependency
- **`jose` (optional, `^6.2.x`)**: add now if RSVP milestone will use full JWTs for session tokens; `node:crypto` is sufficient for v2.0 name-signing alone
- **`csv-parse ^5.6.x`** (devDep): CSV parsing in the link-generation script — zero runtime cost

**Critical non-additions:**
- No Next.js / Remix / Nitro — heavy meta-framework for 2–3 routes
- No Supabase — 7-day inactivity pause breaks a live site; auth/RLS are out of scope
- No Vercel KV / `@vercel/kv` — sunset December 2024
- No Edge runtime — deprecated, Node.js only
- No `VITE_` prefix on any secret

### Expected Features

**Must have (table stakes for v2.0):**
- Opaque nanoid per guest group stored as the primary key in the datastore
- Display name encoded + HMAC-signed in the URL token (`?t=`) — instant greeting, no DB round-trip
- `GET /api/guest/:id` validation endpoint — returns `{ id, displayName }` or 404; the contract the future RSVP form requires
- Graceful fallback to "Our Beloved Guests" for missing, invalid, or tampered `?t=` tokens
- Link-generation CLI script (`scripts/generate-links.js`) — reads guest CSV, seeds DB, outputs shareable URL CSV; never committed with secrets or guest list
- Guest record schema with stub RSVP columns (`rsvp_status`, `rsvp_count`, `rsvp_submitted_at`) as nullable fields — prevents schema migration when RSVP ships
- `useGuestName.js` updated to parse `?t=` token instead of `?to=` plain string — single file change, same hook interface
- `vercel.json` with `/api/(.*)` passthrough first, then `/(.*) → /index.html` SPA catch-all
- Secrets (`GUEST_TOKEN_SECRET`, `DATABASE_URL`) as unprefixed Vercel env vars, never `VITE_`, never committed

**Should have (differentiators):**
- `first_seen_at` timestamp field in schema (low cost, enables open-rate tracking later)
- Basic rate limiting on `GET /api/guest/:id` (prevents UUID brute-force)
- ID normalization to lowercase at generation and lookup (prevents case-sensitivity mismatches)

**Defer to RSVP milestone:**
- RSVP form UI and `POST /api/rsvp` write route
- Full write-path rate limiting and anti-bot
- Email confirmation to couple on new RSVP
- Admin web dashboard (response rates, re-send link)

**Anti-features (explicitly exclude):**
- Public `GET /api/guests` endpoint — exposes full guest list
- Token expiry on display-only links — kills bookmarked links before RSVP opens
- Parallel `?to=` shim — site is not yet deployed, no live links to preserve
- Auth/login for guests — massive friction, not the industry pattern

### Architecture Approach

The architecture is a Vite SPA on Vercel with a thin serverless layer in `api/` and a Neon Postgres datastore. The SPA never calls the backend to render the greeting — the display name travels in the signed `?t=` token and is decoded client-side from the base64 payload. The `api/guest/[id].js` function exists exclusively for the future RSVP write path. This keeps the page-load critical path 100% static (no serverless cold start affecting the animated reveal) while establishing the durable identity the RSVP milestone reuses.

**Major components:**
1. `src/hooks/useGuestName.js` (modified) — parse `?t=` token, base64-decode payload, return `displayName`; fall back to "Our Beloved Guests" on any error
2. `api/guest/[id].js` (new) — Node.js Vercel Function; `GET` returns `{ id, displayName }` or 404; verifies HMAC on the token before trusting name on future write paths
3. `scripts/generate-links.js` + `scripts/lib/token.js` (new) — local-only; reads `guests.csv`, mints nanoid per row, signs token, seeds Neon, outputs `links.csv`; never deployed
4. `vercel.json` (new) — api passthrough rule first, then SPA catch-all rewrite
5. Neon Postgres `guests` table — `id TEXT PK`, `display_name`, `created_at`, `first_seen_at`, nullable RSVP stubs

### Critical Pitfalls

1. **`VITE_` secret leakage into the client bundle** — Any env var prefixed `VITE_` is compiled into the public JS bundle. The signing secret and `DATABASE_URL` MUST be unprefixed. The client decodes the token payload without the secret; only the Vercel function (via `process.env`) verifies it. Audit with `grep -r "VITE_" .env* src/` before every deploy.

2. **Non-durable link scheme forcing re-issue** — Any token format change, payload field addition, or URL path restructure after links are minted requires re-generating and redistributing every personalized URL. Lock the URL shape (`/?id=<nanoid>&t=<b64payload>.<hmac>`) and token payload schema (`{ id, name }` — nothing else) before writing any code.

3. **Unsigned or plain-base64 name payload** — Base64 is encoding, not a signature. A guest can decode, change their name to anything, re-encode, and reload. HMAC-SHA256 with a server-kept secret prevents casual forgery and is required before launch.

4. **Sequential or guessable guest IDs** — Never expose auto-increment DB row IDs in the URL. Use nanoid (21 chars, 126 bits effective entropy). The link is the credential.

5. **SPA catch-all rewrite before `api/` passthrough in `vercel.json`** — `/(.*) → /index.html` as the first rule intercepts all `/api/` requests. The `api/(.*)` passthrough must come first.

---

## Implications for Roadmap

Based on the build-order dependencies identified across all four research files, the work naturally sequences into four discrete phases. Steps 1–4 from ARCHITECTURE.md map to two phases (identity spec + schema/tooling); steps 5–8 map to two more (frontend wire-up + serverless endpoint, then deploy).

### Phase 1: Identity Spec and Token Contract

**Rationale:** Every downstream artifact — DB schema, link-generation script, hook, API function — depends on the URL shape and token format being decided first. Changing either after code is written (let alone after links are issued) is extremely expensive. This phase produces no deployable code but de-risks everything else.

**Delivers:** Documented URL shape (`/?id=<nanoid>&t=<b64json>.<hmac>`), token payload schema (`{ id, name }`), env var naming convention (`GUEST_TOKEN_SECRET`, `DATABASE_URL` — no `VITE_` prefix), and `scripts/lib/token.js` with `sign()` / `verify()` using `node:crypto`.

**Addresses:** Opaque stable guest ID, HMAC-signed display name token
**Avoids:** Non-durable link scheme (Pitfall 4), plain-base64 forgeable payload (Pitfall 2)
**Research flag:** None — pattern is well-documented and validated. No `/gsd:research-phase` needed.

### Phase 2: Datastore Schema and Link-Generation Tooling

**Rationale:** The DB schema must exist before the link-generation script can seed it. Both are prerequisites for generating real shareable links that can be tested end-to-end.

**Delivers:** Neon Postgres `guests` table (provisioned via Vercel Marketplace), `CREATE TABLE` migration, `scripts/generate-links.js` that reads a CSV, inserts guest rows, signs tokens, and writes `links.csv`. The couple can generate real links before any frontend changes ship.

**Addresses:** Persistent guest record with stub RSVP columns, link-generation CLI, datastore keyed on `id`
**Avoids:** Sequential IDs (Pitfall 3), schema migration later (include nullable RSVP stubs from day one)
**Research flag:** None — Neon + Vercel Marketplace integration is well-documented. Standard patterns apply.

### Phase 3: Frontend Hook Update and API Endpoint

**Rationale:** Both items are independent of each other (they can run in parallel) but depend on the token contract (Phase 1) and schema (Phase 2). The frontend change is one file; the API endpoint is one file. Keep them in the same phase to keep the scope small and validate the full data flow before deploy.

**Delivers:** `useGuestName.js` updated to parse `?t=` token and return display name (falls back to "Our Beloved Guests" on error); `api/guest/[id].js` Vercel Function returning guest record or 404; `vercel.json` with correct rewrite order.

**Addresses:** Instant greeting from URL (no DB round-trip), graceful fallback, RSVP-foundation validation endpoint
**Avoids:** `VITE_` secret leakage (Pitfall 1 — establish env discipline here), SPA catch-all before api passthrough (Pitfall 5)
**Research flag:** None — Vercel Functions + `useSearchParams` hook patterns are standard.

### Phase 4: Mobile Polish and Vercel Deploy

**Rationale:** Deploy last, after the full data flow is tested locally. This phase also absorbs the responsive/mobile polish carried from v1.0 (EXP-01/02). Sequencing it last ensures the deployed artifact is the fully-wired, personalized site with durable links — not an intermediate state.

**Delivers:** Live site on Vercel with production env vars set (Sensitive), pre-seeded guest DB, generated `links.csv` ready to send, responsive layout verified on mobile.

**Addresses:** DEPLOY-01, EXP-01/02 from v1.0 carry-forward
**Avoids:** PII in Vercel logs, analytics collecting `id` param with names
**Research flag:** Minor flag for mobile link-sharing — test query-param preservation in iOS Messages and WhatsApp before distributing links.

### Phase Ordering Rationale

- Token contract (Phase 1) is a pure decision/documentation + utility-module phase with no UI or infra dependencies — doing it first prevents any cascade rework.
- Datastore + tooling (Phase 2) is independent of frontend but is a prerequisite for generating test links; keeping it separate from frontend changes allows the couple to validate links before UI work is done.
- Hook + API (Phase 3) can develop in parallel internally once Phase 1 and 2 are complete; keeping them in one phase avoids a half-wired deploy.
- Deploy (Phase 4) is sequenced strictly last — no partial states are deployed.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Token contract):** HMAC signing with `node:crypto` is well-documented; URL-safe base64 is standard Node.js.
- **Phase 2 (Neon + tooling):** Neon Vercel Marketplace integration is documented; `CREATE TABLE` migration is trivial.
- **Phase 3 (Hook + API):** React Router `useSearchParams` is in use today; Vercel `api/[id].js` convention is verified.
- **Phase 4 (Deploy):** Vercel deploy from a Vite project is the baseline.

No phases require deeper research. The one area to watch is mobile link-sharing behavior (query param stripping by iOS Messages / WhatsApp) — worth a manual test in Phase 4 before sending links.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against npm registry and official Vercel docs; Edge runtime deprecation confirmed in official docs |
| Features | HIGH | Pattern corroborated by open-source wedding site references, security pattern references, and HMAC signing docs |
| Architecture | HIGH | Vercel `/api` convention, `vercel.json` rewrite ordering, and `@neondatabase/serverless` HTTP driver all verified against official sources |
| Pitfalls | HIGH | `VITE_` secret leakage confirmed by real-world incident (Sprocket Security); Vercel Hobby limits from official plan docs; JWT/HMAC security from PortSwigger |

**Overall confidence: HIGH**

### Gaps to Address

- **Mobile query-param stripping:** Some messaging apps strip query strings from shared URLs. If `?t=` is stripped, the signed token is lost and the greeting falls back to "Our Beloved Guests." Test with real devices in Phase 4 before link distribution. Mitigation: send links via email rather than iMessage/WhatsApp; hash-fragment fallback is an option if the problem is observed.

- **Rate limiting implementation detail:** Basic rate limiting on `GET /api/guest/:id` was flagged as P2 but not researched in depth. Low risk for v2.0 (brute-forcing 126-bit UUID space is implausible), but the RSVP milestone write path will need it. Flag for that milestone.

- **`VITE_` audit tooling:** A pre-commit grep hook scanning for `VITE_SECRET`, `VITE_KEY`, `VITE_TOKEN`, `VITE_DB`, `VITE_DATABASE` patterns in `src/` and `.env*` is cheap insurance and is not yet set up.

---

## Sources

### Primary (HIGH confidence)
- https://vercel.com/docs/functions — Vercel Functions overview, /api convention, Node.js runtime recommendation (updated 2026-03-19)
- https://vercel.com/docs/functions/runtimes/edge — Edge runtime deprecation notice (updated 2025-12-08)
- https://vercel.com/docs/frameworks/frontend/vite — Vite on Vercel SPA rewrite config (updated 2026-03-09)
- https://vercel.com/docs/plans/hobby — Hobby plan limits, 12-function cap, 10s timeout (updated 2026-02-27)
- https://vercel.com/marketplace/upstash — Upstash Redis as Vercel KV replacement
- https://neon.com/docs/guides/vercel-postgres — Neon Postgres + Vercel Marketplace integration
- https://vite.dev/guide/env-and-mode — VITE_ prefix behavior (official)
- https://www.npmjs.com/package/nanoid — nanoid 5.1.11, ESM-only
- https://github.com/panva/jose — jose 6.2.3, multi-runtime

### Secondary (MEDIUM confidence)
- https://github.com/czue/django-wedding-website — opaque per-party invite URL pattern, CSV import reference implementation
- https://dev.to/sonia_bobrik_1939cdddd79d/the-hidden-engineering-behind-holiday-invites-make-your-rsvp-page-fast-safe-and-not-creepy-3a2o — token architecture, idempotent writes, rate limiting patterns
- https://upstash.com/pricing/redis — Upstash free tier: 500K commands/mo, 256 MB
- https://supabase.com/pricing — 7-day inactivity pause (free tier) — confirmed Supabase ruled out

### Tertiary (HIGH confidence — security references)
- https://portswigger.net/web-security/jwt — JWT attack surface (canonical)
- https://www.sprocketsecurity.com/blog/hunting-secrets-in-javascript-at-scale-how-a-vite-misconfiguration-lead-to-full-ci-cd-compromise — VITE_ leakage real-world incident
- https://vercel.com/docs/environment-variables/sensitive-environment-variables — Sensitive env var marking
- https://www.authgear.com/post/generate-verify-hmac-signatures — HMAC signing in Node.js

---

*Research completed: 2026-05-30*
*Ready for roadmap: yes*
