# Pitfalls Research

**Domain:** Personalized guest-link identity + first backend added to a static Vite/Vercel save-the-date site
**Researched:** 2026-05-30
**Confidence:** HIGH (Vite env rules, Vercel plan limits, JWT/HMAC security verified against official docs and confirmed real-world incidents)

---

## Critical Pitfalls

### Pitfall 1: VITE_ Prefix Secret Leakage into the Client Bundle

**What goes wrong:**
Any environment variable prefixed with `VITE_` is statically inlined into the JavaScript bundle at build time by Vite's `import.meta.env` substitution. If a signing secret, database URL, or API key is accidentally given a `VITE_` prefix — or if a secret is imported anywhere in `src/` code that gets bundled — it ships to every visitor's browser in the minified JS. This is a design property of Vite (not a bug), so the leak is silent and complete.

The vite.config.js in this repo has no custom `envPrefix` override, meaning the default rule applies: `VITE_` = public, everything else = server-only.

**Why it happens:**
Developers add `VITE_` to make a variable "work" in the frontend during rapid prototyping and never remove it. In a Vite SPA that previously had no backend, the reflex is to put things in `.env` with `VITE_` because that was the only way to read env vars before. Once a serverless function layer exists, secrets must stay in unprefixed env vars only accessible to `api/` functions via `process.env`.

A documented real-world case: a `VITE_` prefixed AWS key and CircleCI token ended up compiled into the production bundle, giving every site visitor — and any attacker — credentials to the company's entire CI/CD pipeline and S3 codebase.

**How to avoid:**
- Never use `VITE_` for: signing secrets, DB connection strings, API keys, or any value that would help an attacker.
- `VITE_` is acceptable only for: truly public config (e.g., `VITE_WEDDING_DATE=2027-05-30`, `VITE_VERCEL_ENV=production`).
- Signing secrets live in Vercel's Environment Variables dashboard (mark as Sensitive), referenced as `process.env.HMAC_SIGNING_SECRET` inside `api/` functions only — never imported into `src/`.
- Add a CI lint rule or pre-commit hook that scans for `VITE_SECRET`, `VITE_KEY`, `VITE_TOKEN`, `VITE_DB` patterns.
- Audit with: `grep -r "VITE_" .env* src/` and verify every hit is genuinely public.

**Warning signs:**
- `.env` file contains `VITE_SIGNING_SECRET=`, `VITE_DB_URL=`, or any `VITE_` key whose value you would not paste in a public GitHub comment.
- The serverless API function imports a variable from `import.meta.env` rather than `process.env`.
- Running `strings dist/assets/*.js | grep -E "(secret|key|token|password)"` returns hits.

**Phase to address:**
Backend Foundation phase (the phase that introduces Vercel serverless functions and the first env var). Establish the naming convention (`VITE_` = public only) before writing any `api/` code. Do not defer — the convention is much harder to audit after the fact.

---

### Pitfall 2: Forgeable Name Payload — Unsigned or Weakly-Encoded Guest Names in the URL

**What goes wrong:**
If the guest's display name is embedded in the link as plain base64 (e.g., `?id=eyJuYW1lIjoiVGhlIEpvaG5zb25zIn0=`), any guest can decode it, edit the name to anything, re-encode, and reload. The site greets them as "For The Entire Guest List" or worse — they enumerate all guests by cycling through names. Base64 is encoding, not a signature; it provides zero tamper resistance.

**Why it happens:**
Base64 looks "obscure enough" and lets the site resolve the name without a database round-trip. The developer saves the round-trip cost and avoids setting up a datastore but forecloses the option later.

**How to avoid:**
Two valid approaches — choose one and commit to it in the identity phase:

1. **HMAC-signed payload** — embed `{id, name}` as a base64url-encoded JSON body, then append an HMAC-SHA256 signature computed with a server-side secret. The API validates the signature before trusting the name. Guests cannot forge names without the secret.
2. **Opaque ID + server lookup** — embed only a random UUID `id` in the URL; the name is never in the URL at all. The API looks up the name from the datastore by `id`. Requires a datastore round-trip but is simpler to reason about and easier to revoke.

For this project, the opaque-ID approach is recommended: it keeps PII out of the URL entirely (see Pitfall 5), is trivially revokable (delete the record), and the datastore is being built anyway.

**Warning signs:**
- URL contains a recognizable base64 blob that decodes to `{"name":"..."}`.
- The client JS decodes the name without any server validation step.
- No signing secret is defined in the backend.

**Phase to address:**
Link Identity Design phase (the first phase that replaces `?to=`). The choice of scheme here locks in the security posture for the entire RSVP future.

---

### Pitfall 3: Guessable or Sequential Guest IDs

**What goes wrong:**
If guest IDs are sequential integers (`/invite/1`, `/invite/2`, ...) or short alphanumeric codes (`/invite/ABC123`), an attacker can enumerate every guest in the list, harvest all names, and confirm the full attendee roster. For a private wedding this is a privacy violation; for any future RSVP form it means anyone can submit RSVPs for guests they are not.

**Why it happens:**
Sequential IDs are the default in most databases (auto-increment). Short codes feel "human friendly." Neither is adequate as a secret credential.

**How to avoid:**
- Use a UUID v4 (122 bits of entropy) or `nanoid` with a long alphabet as the guest `id`. At 50–200 guests this is trivially unguessable.
- Do not expose the internal database row ID in the URL — use a separate `public_id` column that is a UUID, even if internal IDs are sequential.
- The link becomes the credential: treat it with the same care as a password reset token.

**Warning signs:**
- Database schema shows `id SERIAL PRIMARY KEY` exposed directly in the URL.
- IDs in issued links are sequential or show a pattern.
- No rate limiting on the guest lookup endpoint.

**Phase to address:**
Backend Foundation / Datastore Schema phase. The ID strategy must be decided before the first link is generated; changing it later requires re-issuing all links.

---

### Pitfall 4: Link Scheme That Cannot Carry RSVP Later — Forced Re-Issue

**What goes wrong:**
v2.0's explicit requirement is that "the SAME link must support RSVP later." If the URL scheme or token format encodes too much (e.g., a signed payload that includes a `purpose: "save-the-date"` claim) or too little (e.g., only a name with no persistent identity), the RSVP milestone cannot reuse the link and must re-issue new URLs to 50–200 guests. Re-issuing is expensive: the couple must redistribute links, old bookmarks break, and guests may be confused.

**Why it happens:**
Links are designed for the immediate need (greeting only) without considering the RSVP read/write future. The token expiry, payload fields, or routing do not leave room for state the RSVP flow needs.

**How to avoid:**
Design the link from the start as a durable identity credential, not a one-time display hint:
- URL shape: `/?id=<uuid>` — opaque, stable, no version or purpose encoded in the URL path.
- The `id` maps to a guest record in the datastore; the record grows over time (greeting name now, RSVP answer later).
- Do not encode the guest name in the URL (it can be changed server-side without re-issuing).
- Do not set a link expiry for display-only links; tokens expire after the event date if at all.
- Keep the URL path stable: do not use `/save-the-date/:id` if the same link will later route to `/rsvp/:id`.

The opaque-ID + server-lookup scheme naturally satisfies durability. HMAC-signed payload links are more fragile: if the payload schema changes (adding a field), old signed links may fail validation.

**Warning signs:**
- URL contains path segment that implies purpose: `/std/:id`, `/save-the-date/:id`.
- Token includes a `purpose`, `version`, or `exp` claim tied to the announcement phase.
- Guest name is encoded in the URL (can't update without re-issue).
- Token validation rejects any unknown payload field (would reject migrated tokens).

**Phase to address:**
Link Identity Design phase, before any links are generated. The schema contract must be written and reviewed before the link-generation tool is built.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Encode guest name in URL (base64, no signature) | No datastore needed, instant greeting | Forgeable, PII in URL, re-issue required if name changes | Never — opaque ID costs almost nothing more |
| Use `VITE_` prefix for the signing/lookup secret | Works immediately in SPA code | Secret exposed in bundle to all visitors | Never — secrets must stay in `api/` + `process.env` |
| Sequential integer guest IDs in URL | Simple, maps to DB primary key | Enumerable guest list, trivial to harvest | Never — use UUID; negligible implementation cost |
| Skip HMAC signature, trust base64 payload | Saves a secret management step | Any guest can forge their own name | Never for production |
| Hard-code a "short" expiry (e.g., 7 days) on save-the-date links | Follows JWT best practice for auth tokens | Links stop working before the wedding; re-issue required | Never — display-only links should not expire before the event date |
| Put guest name in the URL path segment | "Pretty" URLs | PII indexed by crawlers, analytics, Vercel logs | Never — use opaque ID only |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel env vars + Vite | Prefix signing secret with `VITE_` so it "works" in dev | Secret stays unprefixed; `api/` functions read `process.env`; client never touches it |
| Vercel Hobby free tier + KV | Assume KV storage is available on Hobby | Vercel KV/Postgres are NOT included on Hobby; use Upstash Redis (free tier: 10K req/day) or Neon Postgres (free tier), added as marketplace integrations |
| Vercel serverless functions + Vite SPA | Put secrets in `.env.local` and import them in `src/` | Secrets in Vercel dashboard env vars only; SPA code never imports them |
| Google Analytics + personalized URLs | GA collects `?id=<uuid>` query param by default | Configure GA4 to exclude `id` param from URL collection; use `page_path` stripping |
| Vercel runtime logs on Hobby | Expect 24h log retention for debugging | Hobby tier: 1 hour of logs, up to 4,000 rows — critical errors must be surfaced via response bodies or external logging if persistence needed |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Cold start on every guest page load | First visitor after inactivity waits 1–2+ seconds for the greeting API before animation starts | Pre-fetch or cache: resolve the guest name at load time and cache aggressively; or embed name in signed payload to avoid API call on first load | Every infrequently-hit function; more acute on Hobby (no cold-start prevention) |
| Database round-trip blocking animation start | Page loads but greeting animation waits on `/api/guest/:id` response | Either: (a) signed payload (name in URL, no round-trip) or (b) show fallback greeting instantly, swap in real name when API resolves | At network latency > 500ms; feels broken on mobile |
| Vercel Hobby 10s function timeout | Long-running DB query or cold-start + slow query times out | Keep lookup functions simple (single key read); use KV/Redis for O(1) lookups rather than SQL joins | DB connection pool exhausted or network latency spikes |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Guest name in signed payload, signature never validated server-side | Any guest can forge their name | ALWAYS validate HMAC or JWT signature in the API function before trusting payload fields |
| Signing secret rotated without re-issuing links | All existing links break immediately | Plan a rotation window: support old + new secret simultaneously during transition; or use opaque ID (no secret in link, rotation doesn't break links) |
| Guest lookup API with no rate limiting | Attacker brutes UUIDs (even 122-bit space) | Add basic rate limiting (e.g., 10 req/min per IP) on `/api/guest/` using Upstash Ratelimit or Vercel Edge middleware |
| RSVP write endpoint accepts any `id` without verifying link | Anyone who guesses a UUID can submit an RSVP for any guest | Require the signed link token to authorize writes, not just reads |
| PII (guest name) logged in Vercel function logs | Name appears in 1-hour Hobby logs, potentially in log drain | Avoid logging `req.params.name` or guest name; log only `req.params.id` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Unknown/expired `id` shows a bare error or blank page | Guest thinks the site is broken; couple gets support requests | Show a graceful "We couldn't find your invitation" page with the couple's names, date, location still visible — and a contact email. Never a white screen. |
| Shared/forwarded link shows original recipient's name to a different person | Confusion: "Why does it say 'For The Smiths'?" | This is expected behavior — document it. Note in the site footer: "This link is personalized for you." Keep it warm, not alarming. |
| Link with mixed-case or URL-encoded characters fails lookup | `?id=ABC123` vs `?id=abc123` vs `?id=ABC%2D123` all hit different records | Normalize IDs to lowercase at generation time; store lowercase; look up with `.toLowerCase()`. |
| Mobile browsers drop query params when copying links | Guest shares the URL but `?id=` is stripped by messaging apps | Use hash fragment (`/#id=...`) as fallback; test sharing from iOS Messages, WhatsApp, Gmail on mobile. |
| Couple re-generates links and old bookmarks break | Guests who bookmarked their link get a 404 or unknown-guest page | Link re-issue must be a deliberate action with a warning; operationally, treat issued links as permanent. |

---

## "Looks Done But Isn't" Checklist

- [ ] **VITE_ audit:** `grep -r "VITE_" .env* src/` — every result is a genuinely public value; zero secrets.
- [ ] **Guest ID entropy:** IDs in the datastore are UUIDs v4 or equivalent — not sequential integers.
- [ ] **HMAC/signature validation:** If signed payloads are used, the API function calls `verify()` not just `decode()` — and rejects unsigned tokens.
- [ ] **Unknown-ID fallback page:** Navigate to `/?id=nonexistent` — a friendly fallback page renders, not a white screen or unhandled 500.
- [ ] **Cold-start latency:** Load the page cold (first request after 5+ minutes idle) and confirm the greeting appears within an acceptable time or falls back gracefully.
- [ ] **PII not in Vercel logs:** Check the 1-hour runtime log after a test request — guest names are not logged.
- [ ] **PII not in analytics:** Confirm GA/analytics is not collecting the raw `?id=` parameter with a name-encoded value.
- [ ] **Link portability:** Open a generated link 6 months later in a new browser with no session — it still resolves correctly.
- [ ] **Env vars on Vercel dashboard:** All secrets (signing key, DB URL) exist as Vercel Environment Variables marked Sensitive, not in `.env` committed to the repo.
- [ ] **Function timeout test:** Simulate a slow DB query — confirm the UX degrades gracefully within the 10s Hobby limit.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| VITE_ secret leaked in bundle | HIGH | Rotate the exposed secret immediately; redeploy; audit all env vars; check if secret was used by any unauthorized party before rotation |
| Wrong link scheme chosen (must re-issue) | HIGH | Generate new UUIDs for all guests; re-send all personalized links; communicate to couple with enough lead time before RSVP opens |
| Sequential IDs enumerated, guest list harvested | MEDIUM | Migrate to UUID IDs; re-issue links; no way to "un-harvest" already-scraped names — treat as a privacy incident |
| Signing secret rotated, old links break | MEDIUM | Deploy a version that accepts both old and new signatures for a transition window (e.g., 2 weeks); notify couple not to re-send links during rotation |
| Datastore deleted or corrupted | HIGH | Restore from backup (ensure backups are configured on day 1); or re-import from the source CSV used to generate links |
| Cold start causes greeting timeout on event day | LOW | Pre-warm by loading one personalized link manually before guests are expected; or switch from API-lookup to signed-payload scheme (no cold start) |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| VITE_ secret leakage | Backend Foundation (first `api/` function) | `grep -r "VITE_" .env* src/` returns no secrets; `strings dist/assets/*.js` contains no signing secrets |
| Forgeable name payload | Link Identity Design | API rejects a manually base64-edited payload; name does not appear in the URL for the opaque-ID scheme |
| Guessable / sequential IDs | Backend Foundation / Schema Design | IDs in issued links are UUIDs; sequential enumeration of 10 IDs reveals no pattern |
| Non-durable link scheme | Link Identity Design (before any link is generated) | Same URL resolves correctly after 6 months; RSVP phase can add fields to guest record without re-issue |
| Unknown-ID UX | Link Resolution / Frontend phase | `/?id=doesnotexist` renders a graceful page |
| PII in analytics / logs | Deploy / Observability phase | GA4 debug view shows `id` param stripped; Vercel logs show only `id` not name |
| Vercel Hobby limits | Backend Foundation | Function timeout under 10s; KV/DB plan confirmed free-tier compatible |
| Non-technical link minting | Link Generation Tooling phase | Couple can run `npm run generate-links` from a CSV with zero developer help |

---

## Sources

- [Vite: Env Variables and Modes — official docs](https://vite.dev/guide/env-and-mode) (HIGH confidence — official)
- [Sprocket Security: Vite VITE_ misconfiguration → CI/CD compromise](https://www.sprocketsecurity.com/blog/hunting-secrets-in-javascript-at-scale-how-a-vite-misconfiguration-lead-to-full-ci-cd-compromise) (HIGH confidence — confirmed real incident)
- [Vercel Hobby Plan — official limits table](https://vercel.com/docs/plans/hobby) (HIGH confidence — official, last updated 2026-02-27)
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) (HIGH confidence — official)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) (HIGH confidence — official)
- [JWT Security Best Practices — Curity](https://curity.io/resources/learn/jwt-best-practices/) (MEDIUM confidence — authoritative vendor)
- [PortSwigger: JWT Attacks](https://portswigger.net/web-security/jwt) (HIGH confidence — canonical security reference)
- [HMAC URL Protection — Cyril Kato's blog, 2025-03-12](https://blog.cyril.email/posts/2025-03-12/url-protection-through-hmac.html) (MEDIUM confidence — single source, pattern well-established)
- [Google Analytics: Avoiding PII in URLs](https://support.google.com/analytics/answer/6366371) (HIGH confidence — official Google policy)
- [Vercel Secret Exposure: Stripe sk_live_ keys leak case study](https://www.cremit.io/blog/vercel-secret-exposure-case-study) (MEDIUM confidence — case study)

---
*Pitfalls research for: Personalized guest-link identity + first backend on Vite/Vercel static site*
*Researched: 2026-05-30*
