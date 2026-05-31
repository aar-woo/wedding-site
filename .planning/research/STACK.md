# Stack Research

**Domain:** Personalized wedding save-the-date — durable guest identity + backend/datastore foundation (v2.0 additions only)
**Researched:** 2026-05-30
**Confidence:** HIGH (all key claims verified against official Vercel docs and npm registry)

---

## Existing Stack (Keep As-Is)

Do not re-research these. They are installed, working, and validated.

| Technology | Installed Version | Notes |
|------------|-------------------|-------|
| React | ^19.2.6 | |
| Vite | ^8.0.12 | |
| framer-motion | ^12.40.0 | |
| react-router-dom | ^7.16.0 | Imports from `react-router` per Phase 1 finding |
| CSS Modules | native to Vite | |

---

## New Stack for v2.0

### 1. Vercel Functions (Node.js runtime) — Serverless API Layer

**Recommendation: Vercel Functions with Node.js runtime, /api directory convention, no framework wrapper.**

How it works with this Vite SPA:
- Files placed in `/api/*.js` (or `.ts`) are automatically detected and deployed as Vercel Functions.
- The Vite static build outputs to `/dist` (or Vercel's default). Vercel routes `/api/*` to functions; everything else rewrites to `/index.html` via `vercel.json`.
- This is the "other frameworks" path in Vercel's own docs — no Nitro, no SvelteKit wrapper needed.

`vercel.json` required to wire up SPA routing alongside API:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Node.js runtime vs Edge runtime:**
Vercel's own docs (updated 2026-05-12) explicitly warn: "We recommend migrating from edge to Node.js for improved performance and reliability." Edge Functions are deprecated. Use Node.js runtime only. The Node.js runtime has no library restrictions and can use the full `crypto` module — relevant for HMAC signing and any datastore SDK.

**Function limit on Hobby plan:** 12 functions per deployment. For v2.0 you need at most 2–3 endpoints (guest lookup, health check). Not a concern.

**Relevant official docs:** https://vercel.com/docs/frameworks/frontend/vite, https://vercel.com/docs/functions, https://vercel.com/docs/functions/runtimes/edge

---

### 2. Datastore — Upstash Redis (via Vercel Marketplace)

**Recommendation: Upstash Redis. Use it as a simple key-value store keyed on guest `id`.**

**Why not Vercel KV:** Vercel KV was sunset in December 2024. Vercel automatically migrated KV stores to Upstash Redis. For new projects, you install Upstash Redis via the Vercel Marketplace. The API is identical to the old Vercel KV (`@upstash/redis` / `@vercel/kv`-compatible).

**Why Upstash Redis over Postgres/Supabase for this use case:**

| | Upstash Redis | Supabase Postgres | Turso SQLite |
|---|---|---|---|
| Data shape | `guestId → {name, party, ...}` — perfect for key-value | Requires schema, migrations, SQL | Requires libsql driver, more complex setup |
| Free tier | 500K commands/mo, 256 MB, 1 DB | 500 MB, pauses after 1 week of inactivity | 500M row reads/mo, 9 GB, generous |
| Cold start / latency | Sub-ms reads via REST | Connection pool cold start | Edge-latency focus, less relevant for Node.js fn |
| SDK complexity | `const val = await redis.get(id)` | Full Postgres client, connection strings | libsql driver required |
| Vendor lock-in | Low — Redis is standard | Low — standard Postgres | Low — SQLite standard |
| Risk | **Free project pauses** do not apply (Redis, not Postgres) | **Free project pauses after 7 days inactive** — breaks a live wedding site | Fine for hobby; less mature tooling |

For 50–200 guests, Redis is over-engineered in capability but massively under-complicated in setup. The data model is literally `SET guest:{id} {JSON}` and `GET guest:{id}`. No schema migrations. No connection pooling. No ORM.

**Supabase is the right choice only if:** you need relational joins, row-level security, or the Auth product. For name-lookup by opaque ID, it is underkill problem + overkill solution.

**Turso is the right choice only if:** you need SQL and want SQLite semantics. Valid option, but adds a `libsql` driver dependency and more conceptual surface area for zero gain at this scale.

**Free tier is sufficient:** 500K commands/month is ~2,500 page loads/day with 200 commands each — orders of magnitude more than a wedding site sees.

| Library | Version | Purpose |
|---------|---------|---------|
| `@upstash/redis` | `^1.34.x` (latest) | Redis client — REST-based, works in Node.js and edge, zero native deps |

Install via Vercel Marketplace, which injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as env vars automatically.

**Relevant sources:** https://vercel.com/marketplace/upstash, https://upstash.com/pricing/redis, https://vercel.com/docs/redis

---

### 3. Token / Identity Scheme — Opaque nanoid + HMAC-signed display name in URL

**Recommendation: Two-part URL structure: opaque random `id` + HMAC-signed name payload.**

The design goal is:
1. The `id` is stable and opaque — used as the Redis key and as the future RSVP identifier.
2. The display name is visible to the browser without a network round-trip (pure client-side greeting, just like today's `?to=` param), but the guest cannot trivially self-edit it to claim a different identity.
3. No public guest-list endpoint is exposed.

**URL structure:**

```
/?id={nanoid}&t={base64url(name)}.{hmac_signature}
```

- `id` — 21-character nanoid (opaque, stable, used as Redis key)
- `t` — `base64url(name) + "." + hmac(base64url(name), secret)` — the name travels in the URL, protected by an HMAC so casual editing is detectable

The client reads `t`, splits on `.`, decodes the name, and uses it for greeting — identical UX to today. The Vercel function on the RSVP path (future) validates the HMAC before trusting anything from the URL.

**Why not a full JWT in the URL:**
A JWT carries header + claims + signature (three base64url segments). For a display name that's 10–30 chars, this bloats every URL and email link unnecessarily. The two-part `base64url(name).hmac` scheme gives the same tamper-detection with a shorter URL and no JWT parser needed on the client.

**Why not pure opaque ID + server lookup for name:**
That would require a network round-trip on every page load just to show the guest greeting — adding latency for a purely cosmetic piece of data. The signed payload in the URL keeps the greeting instant (same as today) while adding tamper-detection for future RSVP use.

**Why not encrypt the name:**
Encryption would hide the name from the URL bar, but at the cost of requiring a decryption endpoint. For a wedding save-the-date, the guest seeing their own name in the URL is fine — it's not sensitive data. HMAC signing (tamper-proof, not secret) is the right tool.

---

### 4. Libraries for Token/Identity

#### nanoid `^5.1.x` — ID generation

| Attribute | Detail |
|-----------|--------|
| Version | 5.1.11 (current as of May 2026) |
| Size | 118 bytes |
| Output | 21-char URL-safe string (same collision probability as UUID v4) |
| Runtime | ESM-only in v5; works in Node.js 20+ natively; works in Vercel Node.js functions |
| Import | `import { nanoid } from 'nanoid'` |

Use in the link-generation script (runs on your machine, not in the function). Not needed in the Vercel function at runtime — IDs are minted once and stored.

Note: nanoid v5 is ESM-only. This project already uses `"type": "module"` in package.json, so there is no CommonJS conflict.

#### jose `^6.x` — HMAC signing and verification

| Attribute | Detail |
|-----------|--------|
| Version | 6.2.3 (current as of May 2026) |
| Purpose | JWT/JWS/JWE — used here for HMAC-HS256 signing of the name payload |
| Runtime | Works in Node.js, browsers, Cloudflare Workers, Deno — zero deps, tree-shakeable ESM |
| Breaking change from v5 | v6 (released Feb 2025) dropped CJS `require()` support and Ed448; uses ES2022 target. No impact here — project is already ESM |
| Import | `import { SignJWT, jwtVerify } from 'jose'` |

For the simpler two-part scheme (not full JWT), you can also use Node's built-in `crypto.createHmac` in the Vercel function — no extra package needed. However, `jose` is the right choice if you later want to issue short-lived RSVP session tokens (full JWTs with expiry). Install it now to keep the token infrastructure consistent.

**Signing pattern (Node.js function / link-generation script):**

```js
import { createHmac } from 'node:crypto';

function signName(name, secret) {
  const encoded = Buffer.from(name).toString('base64url');
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyName(token, secret) {
  const [encoded, sig] = token.split('.');
  const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
  // constant-time comparison required to prevent timing attacks
  const sigBuf = Buffer.from(sig, 'base64url');
  const expBuf = Buffer.from(expected, 'base64url');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return Buffer.from(encoded, 'base64url').toString('utf8');
}
```

**When to use jose instead of raw crypto:**
Use `jose` if you issue full JWTs for RSVP session identity in the next milestone. For the v2.0 name-signing use case, `node:crypto` is zero-dependency and sufficient.

---

### 5. Link-Generation Tooling — Node.js Script (No New Framework)

**Recommendation: A standalone Node.js script (`scripts/generate-links.js`) that reads a CSV and outputs a CSV with signed URLs.**

No CLI framework, no extra package. Just:

```js
import { nanoid } from 'nanoid';
import { createReadStream } from 'node:fs';
import { createHmac } from 'node:crypto';
// parse CSV with built-in readline or csv-parse
```

One optional lightweight package if you want CSV parsing without hand-rolling it:

| Library | Version | Purpose |
|---------|---------|---------|
| `csv-parse` | `^5.6.x` | Parse guest list CSV (sync API, zero deps) |

`csv-parse` v5 is ESM and CJS compatible, 0 dependencies, actively maintained. Alternative: hand-roll with `readline` (built-in) if you want zero new packages — perfectly viable for a 200-row CSV.

**Output:** the script writes a `dist/guest-links.csv` with columns `id, name, url`. You paste URLs into email/invitation software.

**Redis seeding:** the same script (or a second pass) calls `redis.set(id, JSON.stringify({ name, party }))` to populate the datastore before launch.

---

## Installation

```bash
# Upstash Redis client
npm install @upstash/redis

# ID generation (link-generation script only, not deployed to Vercel)
npm install nanoid

# HMAC / JWT signing — add now if RSVP JWT tokens are anticipated
npm install jose

# Optional: CSV parsing for link-generation script
npm install -D csv-parse
```

`@upstash/redis` and `jose` are runtime dependencies (used in Vercel Functions). `nanoid` and `csv-parse` are devDependencies (used only in the local link-generation script).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Datastore | Upstash Redis | Supabase Postgres | Overkill for key-value lookups; free tier pauses after 7 days inactivity — breaks a live site |
| Datastore | Upstash Redis | Turso/libsql | Valid but adds SQLite driver complexity for zero benefit at 50-200 row scale |
| Datastore | Upstash Redis | Vercel Edge Config | Edge Config is for feature flags / small config blobs, not mutable app data; not designed for guest records |
| Datastore | Upstash Redis | Committed JSON file (bundled) | Exposes the entire guest list in the public JS bundle — exactly what the milestone requirement forbids |
| Token scheme | opaque nanoid + signed name payload | Full JWT in URL | JWT is 3× longer in the URL for no benefit; the client doesn't need to verify — it just displays the name |
| Token scheme | opaque nanoid + signed name payload | Pure opaque ID (name from DB) | Requires a network round-trip on every page load just to show the greeting; kills keepsake UX |
| Functions runtime | Node.js | Edge runtime | Vercel officially deprecated Edge Functions (2025/2026); Node.js runtime is now the recommended default |
| Functions runtime | Node.js | Nitro / Vite plugin | Adds a full meta-framework for 2–3 endpoints; enormous overkill |
| HMAC library | `node:crypto` (built-in) | `jose` for signing | `jose` is better if RSVP JWTs are coming; `node:crypto` is fine if not. Install jose now to keep it consistent |
| ID library | nanoid | uuid | nanoid is smaller (118 bytes) and produces shorter URL-safe IDs; functionally equivalent |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Remix / Nitro | Heavy meta-framework for 2–3 API routes on top of an existing Vite SPA | Vercel Functions via `/api` directory directly |
| Prisma / Drizzle ORM | No SQL database; adds migration tooling and type-gen overhead for a key-value store | `@upstash/redis` — one-liner get/set |
| Auth0 / Clerk / NextAuth | No user authentication — this is a static keepsake site with tamper-resistant links, not a login system | HMAC-signed URL tokens |
| Supabase Auth / Row-Level Security | No user sessions in v2.0; RSVP is future scope | n/a |
| express / fastify | Running a persistent Node.js server on Vercel defeats the point | Vercel Functions (serverless) |
| bcrypt / argon2 | Password hashing — irrelevant; no passwords | n/a |
| jsonwebtoken (older `jsonwebtoken` npm package) | CommonJS-only, slower, less actively maintained | `jose` (ESM, multi-runtime, actively maintained) |
| Vercel KV (`@vercel/kv`) | Product was sunset December 2024; package is a frozen wrapper | `@upstash/redis` directly |

---

## Version Compatibility

| Package | Version | Node.js Req | Notes |
|---------|---------|-------------|-------|
| `@upstash/redis` | `^1.34.x` | 18+ | REST-based — no native modules, works in Vercel Node.js functions |
| `nanoid` | `^5.1.x` | 20+ natively; 18 with `--experimental-require-module` | ESM-only; this project is already `"type":"module"` so no conflict |
| `jose` | `^6.2.x` | 18+ | ES2022 target; ESM-only in v6; zero deps |
| `csv-parse` | `^5.6.x` | 18+ | devDep only; ESM + CJS both supported |
| Vercel Node.js runtime | latest (`nodejs20.x` or `nodejs22.x`) | — | Set in `vercel.json` functions config if needed; default is current LTS |

---

## Sources

- https://vercel.com/docs/frameworks/frontend/vite — Vite on Vercel, SPA rewrite config, Functions recommendation (last updated 2026-03-09) — HIGH confidence
- https://vercel.com/docs/functions — Vercel Functions overview, lifecycle, /api convention (last updated 2026-03-19) — HIGH confidence
- https://vercel.com/docs/functions/runtimes/edge — Edge runtime deprecation notice (last updated 2025-12-08) — HIGH confidence
- https://vercel.com/docs/functions/runtimes — Runtime list, Hobby plan 12-function limit — HIGH confidence
- https://vercel.com/marketplace/upstash — Upstash Redis as Vercel KV replacement — HIGH confidence
- https://upstash.com/pricing/redis — Free tier: 500K commands/mo, 256 MB, 1 DB — HIGH confidence (fetched directly)
- https://www.npmjs.com/package/nanoid — nanoid 5.1.11, ESM-only — HIGH confidence (npm registry)
- https://github.com/panva/jose — jose 6.2.3, multi-runtime, zero deps — HIGH confidence (GitHub)
- https://github.com/panva/jose/blob/main/CHANGELOG.md — v6 breaking changes vs v5 — HIGH confidence
- https://supabase.com/pricing — Free tier limits, 7-day inactivity pause — MEDIUM confidence (search-verified)

---

*Stack research for: Wedding save-the-date v2.0 — durable guest identity + backend/datastore foundation*
*Researched: 2026-05-30*
