# Architecture Research

**Domain:** Personalized static invite site with durable guest identity + serverless backend (v2.0)
**Researched:** 2026-05-30
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL PROJECT                                │
├─────────────────────────────────────────────────────────────────────┤
│  STATIC SPA (Vite build → /dist)                                    │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐ │
│  │ Route "/"    │  │ Route "/i/:id" │  │ useGuestIdentity hook    │ │
│  │ (fallback)   │  │ (new durable   │  │ resolves name from token │ │
│  │              │  │  guest link)   │  │ payload; no network call │ │
│  └──────────────┘  └────────┬───────┘  └────────────┬─────────────┘ │
│                             │                        │               │
│                   path param :id                token in ?t= param  │
│                             │                        │               │
├─────────────────────────────┼────────────────────────┼───────────────┤
│  VERCEL SERVERLESS FUNCTIONS (api/)                  │               │
│  ┌──────────────────────────┴──────────────────────┐ │               │
│  │ api/guest/[id].js                               │ │               │
│  │   GET  → look up guest record by id             │ │               │
│  │   (used by future RSVP; greeting does not       │ │               │
│  │    call this — name travels in the token)       │ │               │
│  └──────────────────────────┬───────────────────────┘ │               │
│                             │                          │               │
├─────────────────────────────┼──────────────────────────┼──────────────┤
│  DATA STORE (Neon Postgres via Vercel Marketplace)     │              │
│  ┌──────────────────────────────────────────────────┐  │              │
│  │ guests table                                     │  │              │
│  │   id TEXT PRIMARY KEY  (nanoid, 21 chars)        │  │              │
│  │   display_name TEXT NOT NULL                     │  │              │
│  │   created_at TIMESTAMPTZ DEFAULT now()           │  │              │
│  │   rsvp_status TEXT DEFAULT 'pending'  (future)   │  │              │
│  │   rsvp_count INT                      (future)   │  │              │
│  │   rsvp_submitted_at TIMESTAMPTZ       (future)   │  │              │
│  └──────────────────────────────────────────────────┘  │              │
│                                                         │              │
├─────────────────────────────────────────────────────────┼──────────────┤
│  LINK-GENERATION TOOLING (scripts/, runs locally)       │              │
│  ┌──────────────────────────────────────────────────────┴──────────┐  │
│  │ scripts/generate-links.js                                       │  │
│  │   reads guests.csv → mints nanoid per row → signs token         │  │
│  │   → writes rows to Neon → outputs links.csv                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New / Modified |
|-----------|----------------|----------------|
| `src/hooks/useGuestIdentity.js` | Reads `:id` path param + `?t=` query, verifies HMAC token client-side via Web Crypto, extracts `display_name` | **NEW** — replaces `useGuestName` |
| `src/hooks/useGuestName.js` | Legacy `?to=` resolution | **MODIFIED** — kept as fallback; delegates to `useGuestIdentity` when `?t=` present; remove in v3 |
| `src/components/GuestGreeting.jsx` | Renders "For {name}" — name source changes | **MODIFIED** — swap hook call, no JSX change |
| `src/App.jsx` | Mounts router routes | **MODIFIED** — add `/i/:id` route |
| `src/main.jsx` | BrowserRouter setup | **UNCHANGED** |
| `api/guest/[id].js` | Serverless function: GET returns guest record JSON; foundation for POST /rsvp later | **NEW** |
| `scripts/generate-links.js` | Local CLI: reads CSV, creates guest rows in Neon, signs tokens, outputs shareable URLs | **NEW** |
| `scripts/lib/token.js` | Shared HMAC sign/verify logic (Node crypto + Web Crypto compatible) | **NEW** |
| `vercel.json` | SPA fallback rewrites + exclude `api/` from the catch-all | **NEW** |
| `.env.local` / Vercel env vars | `GUEST_TOKEN_SECRET`, `DATABASE_URL` | **NEW** |


## Recommended Project Structure

```
wedding-site/
├── api/
│   └── guest/
│       └── [id].js          # GET /api/guest/:id — serverless function
├── scripts/
│   ├── generate-links.js    # local CLI: reads CSV, seeds DB, outputs links
│   └── lib/
│       └── token.js         # sign() + verify() shared between scripts and api/
├── src/
│   ├── hooks/
│   │   ├── useGuestIdentity.js   # NEW: path param + HMAC token → name
│   │   └── useGuestName.js       # MODIFIED: keep legacy ?to= fallback
│   ├── components/
│   │   └── GuestGreeting.jsx     # MODIFIED: use useGuestIdentity
│   └── pages/
│       └── SaveTheDatePage.jsx   # UNCHANGED (receives name via component)
├── vercel.json              # SPA rewrites + schema
└── .env.local               # GUEST_TOKEN_SECRET, DATABASE_URL (gitignored)
```

### Structure Rationale

- **`api/`:** Vercel auto-discovers this directory and deploys each file as a serverless function. `[id].js` uses the bracket convention for dynamic path params (`/api/guest/abc123`). Confidence HIGH — verified in official Vercel Functions docs.
- **`scripts/`:** Link generation is a local admin tool, not part of the deployed bundle. Keeping it outside `src/` ensures Vite does not try to bundle it.
- **`scripts/lib/token.js`:** The HMAC sign/verify logic is shared between the local script (Node `crypto` module) and the serverless function. A single implementation prevents drift.


## Architectural Patterns

### Pattern 1: Path-param route for durable identity (`/i/:id`)

**What:** Guest links use a path segment — `/i/abc123` — rather than a query param like `?g=abc123`.
**When to use:** When the identifier is integral to the resource being accessed, not a filter on it. The guest identity IS the page for that user.
**Trade-offs:**
- Path param is semantically correct (a distinct resource per guest), canonically bookmarkable, and cleaner in shareable text.
- Requires adding a new `<Route path="/i/:id">` in React Router v7.
- The SPA fallback in `vercel.json` must still serve `index.html` for `/i/*` — it does, because `/(.*) → /index.html` catches all non-`api/` paths.
- Query param (`?g=`) would avoid a route change but looks fragile and is easier for guests to accidentally strip.

**Recommendation:** Use `/i/:id`. The `i` namespace reserves future paths (`/rsvp/:id`, `/details/:id`) without ambiguity.

```
Guest link:  https://weddingsite.com/i/V1StGXR8_Z5jdHi6B-myT?t=<hmac-token>
              path param ─────────────────────────┘          query token ─┘
```

React Router change in `src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router';
// ...
<Routes>
  <Route path="/i/:id" element={<SaveTheDatePage />} />
  <Route path="/" element={<SaveTheDatePage />} />
</Routes>
```

### Pattern 2: Self-contained signed token carries the display name

**What:** The URL contains both an opaque `id` (path) and a signed token `?t=` (query). The token is a compact `base64url(JSON payload).base64url(HMAC-SHA256 signature)`. The payload includes `{ id, name, iat }`. The client reads the token, verifies the signature with the shared secret via Web Crypto API, and extracts `name` — no network round-trip needed to show the greeting.

**Why not pure server lookup for the greeting?** The site is static-first; a network call to resolve a name before rendering adds latency and a cold-start risk on every page load. The signed token eliminates both problems for the greeting use case. The database is still there for RSVP writes and admin reads — it just isn't on the critical path for the page load.

**Security model:**
- The HMAC secret lives only in `process.env.GUEST_TOKEN_SECRET` — in Vercel env vars for the serverless function, and in `.env.local` for the link-generation script. It is never exposed to the browser bundle.
- The client verifies the signature using the public half of the secret... wait — HMAC uses a symmetric shared secret. This means the verification key must be available client-side, which would expose it. **This is the key tradeoff:** pure client-side HMAC verification is not truly secure because the secret must ship to the browser.

**Recommended resolution — two-step approach:**
1. The token in the URL is URL-safe base64: `base64url(JSON).base64url(sig)`. It prevents trivial editing (guests cannot change the name without invalidating the signature) but does NOT protect a determined attacker who extracts the secret from the bundle.
2. For the greeting, this is an acceptable risk — the worst outcome is a guest crafting a URL with a forged name greeting; no private data is exposed and no RSVP is fraudulently submitted.
3. For RSVP submission (future), the serverless function re-verifies the token server-side using the real secret from env vars. Client-side "verification" is then only for the display layer.

**Practical implementation:** Store the HMAC secret as a `VITE_` prefixed env var (`VITE_GUEST_TOKEN_SECRET`) so Vite injects it into the client bundle for display verification, AND as a non-`VITE_` var (`GUEST_TOKEN_SECRET`) for the serverless function. Accept that the display-layer secret is visible in the bundle; the source of truth for security is the server.

Alternatively (stricter, more complex): skip client-side verification entirely — just base64-decode the payload for the name, ignore the signature on the client, and verify server-side only on mutation (RSVP). This is simpler and more honest about the trust boundary. **Recommended for v2.0.**

```
Token format:  <base64url({"id":"abc","name":"The Johnsons","iat":1717000000})>.<base64url(HMAC-SHA256)>
Client:        decode payload → read name → display greeting   (no secret needed, no verification)
Server:        decode payload → verify HMAC → accept/reject RSVP write
```

### Pattern 3: Vercel api/ + SPA coexistence via vercel.json rewrites

**What:** The SPA catch-all (`/(.*) → /index.html`) would intercept `/api/*` requests if not excluded. Vercel resolves this automatically: functions in `api/` are matched before static rewrites. The ordering in `vercel.json` must also respect this.

**Verified pattern** (from official Vercel + Vite docs, HIGH confidence):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The `api/` rule is first — Vercel evaluates rewrites in order, and functions in `api/` are resolved before the catch-all reaches them anyway. The second rule enables deep-linking for `/i/:id` paths.

### Pattern 4: Neon Postgres as the datastore

**What:** Neon Postgres integrates directly with Vercel projects through the Vercel Marketplace. After provisioning, Vercel auto-injects `DATABASE_URL` into all environments (production, preview, development). The serverless function uses `@neondatabase/serverless` (HTTP-based driver — no persistent TCP connections, required for serverless environments).

**Why Postgres over KV (Redis/Upstash):**
- Note: Vercel KV was **deprecated in December 2024** and migrated to Upstash Redis.
- For this project's data shape (guests with multiple fields, future RSVP columns, potential queries like "show all guests who haven't RSVP'd"), a relational schema is the right fit. Redis is optimized for single-key lookups with expiry — awkward for adding columns later.
- Neon free tier: sufficient for ~hundreds of guests, scales to zero when idle (no idle cost), preview branching included.
- The `@neondatabase/serverless` package works in Vercel's Node.js and Edge runtimes — no connection pool management needed.

**Why not Supabase:** Adds auth, storage, realtime — all out of scope. Neon is purely a Postgres database; simpler billing and mental model for this project.


## Data Flow

### Guest Link Load (v2.0 — no network call for greeting)

```
Browser navigates to /i/V1StGXR8?t=eyJpZCI6...
        ↓
React Router matches /i/:id route → renders SaveTheDatePage
        ↓
useGuestIdentity hook:
  1. useParams() → id = "V1StGXR8"
  2. useSearchParams() → t = "eyJpZCI6..."
  3. base64url-decode token payload → { id, name: "The Johnson Family", iat }
  4. (optional: lightweight format check — not security, just error handling)
  5. return { id, name: "The Johnson Family", hasIdentity: true }
        ↓
GuestGreeting renders "For The Johnson Family"
document.title set to "Save the Date – For The Johnson Family"
        ↓
(No api/ call happens — page is fully personalized from URL alone)
```

### Link Generation (admin, local)

```
scripts/generate-links.js
  1. Read guests.csv (columns: display_name, [group_id optional])
  2. For each row:
     a. nanoid() → id (21 chars, URL-safe)
     b. INSERT INTO guests (id, display_name) ON CONFLICT DO NOTHING
     c. Build payload: { id, name: display_name, iat: now() }
     d. base64url(JSON.stringify(payload)) + "." + base64url(HMAC-SHA256(payload, secret))
     e. Emit: https://weddingsite.com/i/{id}?t={token}
  3. Write links.csv
```

### RSVP Submission (future milestone — foundation laid now)

```
Guest clicks RSVP on /i/:id page
        ↓
POST /api/rsvp  { id, token, status, count }
        ↓
api/rsvp.js serverless function:
  1. Decode token payload
  2. Verify HMAC-SHA256(payload, GUEST_TOKEN_SECRET) — server-side, secret from env
  3. If invalid → 401
  4. UPDATE guests SET rsvp_status=$2, rsvp_count=$3, rsvp_submitted_at=now()
     WHERE id=$1
  5. 200 OK
```

### State Management

No global client state beyond what the URL carries. `useGuestIdentity` is a pure hook — reads URL, returns data. No React context or store needed for identity.


## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 guests | Single Neon branch, no caching, free tier sufficient |
| 500–5K guests | Same architecture; Neon free tier holds well into thousands of rows |
| 5K+ guests | Add read replica if RSVP admin queries become slow; still no architecture change needed |

This project will never exceed ~500 guests. Scaling is not a real concern; the architecture is appropriate for the scale.


## Anti-Patterns

### Anti-Pattern 1: Putting the display name lookup on the critical render path

**What people do:** Call `GET /api/guest/:id` synchronously before rendering to resolve the guest name for the greeting.
**Why it's wrong:** Adds a cold-start serverless function call (~100–300ms) on every page load. The page blocks or flashes with a fallback name.
**Do this instead:** Carry the name in the signed token payload. The API exists for RSVP writes and admin queries — not for the read-path greeting.

### Anti-Pattern 2: Using `?to=` with a name as the only identity

**What people do:** Keep the existing `?to=The+Johnson+Family` pattern.
**Why it's wrong:** Any guest can change `?to=` to any name — it's trivially forgeable, and there is no persistent identity to attach RSVP data to later.
**Do this instead:** Opaque `id` in the path + signed token. The `id` is the stable identity key; the token prevents casual name forgery for display.

### Anti-Pattern 3: Storing the HMAC secret only in the Vite client bundle

**What people do:** Use `VITE_GUEST_TOKEN_SECRET` for both signing (scripts) and server-side RSVP verification.
**Why it's wrong:** `VITE_` variables are compiled into the browser bundle — anyone can open DevTools and read the secret, then forge tokens that pass client-side "verification."
**Do this instead:** Use a non-`VITE_` env var (`GUEST_TOKEN_SECRET`) for the serverless function, which does all security-critical verification. The client only base64-decodes the payload for display — it never needs the secret.

### Anti-Pattern 4: Catch-all SPA rewrite before api/ routes in vercel.json

**What people do:** Put `/(.*) → /index.html` as the first rewrite rule.
**Why it's wrong:** Vercel evaluates rewrites in order. `/(.*)`  matches `/api/guest/abc123` — the function never fires.
**Do this instead:** Put the `/api/(.*)` passthrough rule first, then the SPA catch-all. Or rely on Vercel's automatic precedence (functions always win over rewrites) — but be explicit in `vercel.json` for clarity.

### Anti-Pattern 5: Adding a `/i/:id` route but forgetting the SPA fallback

**What people do:** Define the route in React Router but don't add `vercel.json` rewrites.
**Why it's wrong:** Vercel serves a 404 for `/i/abc123` because there is no static file at that path. The BrowserRouter only handles navigation that starts from an already-loaded SPA.
**Do this instead:** Add `vercel.json` with the `/(.*) → /index.html` rewrite before deploying.


## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Neon Postgres | Vercel Marketplace integration → auto-injects `DATABASE_URL` | Use `@neondatabase/serverless` in `api/`; HTTP driver, no TCP pool |
| Vercel Functions | `api/` directory convention; file = route | Node.js runtime; `[id].js` bracket syntax for dynamic segments |
| Web Crypto API | Browser built-in; available in all modern browsers and Vercel Edge/Node runtimes | Use for client-side payload decode; use Node `crypto` in scripts |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React SPA ↔ Vercel Function | HTTP fetch to `/api/guest/:id` | SPA never calls this for the greeting; used by future RSVP form |
| scripts/ ↔ Neon | Direct Postgres via `DATABASE_URL` from `.env.local` | Run with `node scripts/generate-links.js` locally; never deployed |
| scripts/ ↔ token.js | CommonJS / ESM import | Keep token.js pure (no framework deps) so both script and api/ can import it |
| useGuestIdentity ↔ React Router | `useParams()` + `useSearchParams()` from `react-router` | Already installed; import unchanged from existing hooks |


## Build Order / Phase Dependencies

The components are largely independent once the identity scheme is decided. Suggested order respects data-flow dependencies:

1. **Identity scheme** — decide and document token format, URL shape, secret management. Everything downstream depends on this. No code yet, just the spec.

2. **`scripts/lib/token.js`** — implement sign/verify as a standalone module with no framework deps. Write tests. This is the shared contract between link generation and server verification.

3. **Datastore schema** — provision Neon via Vercel Marketplace, write and run the `CREATE TABLE guests` migration. Independent of frontend work.

4. **`scripts/generate-links.js`** — depends on token.js (step 2) and schema (step 3). Generates real links; validates the full data-flow from guest list → DB → URL before touching the SPA.

5. **`useGuestIdentity.js` hook + React Router route update** — depends on the token format (step 1). Pure client-side; no network calls. Can be built and tested with a manually-crafted token.

6. **`GuestGreeting.jsx` + `SaveTheDatePage.jsx` wire-up** — depends on hook (step 5). Swap `useGuestName` → `useGuestIdentity` in the greeting component; update the App route.

7. **`api/guest/[id].js`** — depends on schema (step 3) and token.js (step 2). The RSVP foundation endpoint. Can be built in parallel with steps 5–6.

8. **`vercel.json`** — can be written any time after the route shape is decided (step 1). Needed before the first Vercel deploy.

9. **Deploy** — depends on all above. Run `generate-links.js` post-deploy to seed production DB and generate final shareable URLs.

Steps 5–6 and step 7 are fully parallel once steps 1–4 are done.


## Sources

- Vercel Functions overview: https://vercel.com/docs/functions (last updated 2026-03-19)
- Vite on Vercel / SPA rewrites: https://vercel.com/docs/frameworks/frontend/vite (last updated 2026-03-09)
- vercel.json configuration reference: https://vercel.com/docs/project-configuration/vercel-json (last updated 2026-03-11)
- Vercel KV deprecation (December 2024): https://vercel.com/docs/storage/vercel-kv
- Neon Postgres + Vercel integration: https://neon.com/docs/guides/vercel-postgres
- React Router v7 URL values (useParams, useSearchParams): https://reactrouter.com/start/declarative/url-values
- nanoid (URL-safe opaque IDs): https://github.com/ai/nanoid
- Web Crypto SubtleCrypto HMAC: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify
- JWT/HMAC security: https://auth0.com/docs/secure/tokens/json-web-tokens

---
*Architecture research for: Wedding save-the-date site — v2.0 durable guest identity + RSVP foundation*
*Researched: 2026-05-30*
