# Phase 8: Frontend Hook & API Endpoint — Research

**Researched:** 2026-05-31
**Domain:** Vercel Node.js Functions + React Router v7 routing + `useSearchParams` hook extension + `@neondatabase/serverless` in serverless functions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `useGuestName` is extended **in place** (not a new hook) so `GuestGreeting.jsx` stays unchanged. Resolution order: **(1)** read `?t=` and `decodeGuestToken(t)` → use `name` if non-null; **(2)** else legacy `?to=<name>` (kept); **(3)** else fallback **"Our Beloved Guests"**.
- **D-02:** The greeting is **100% client-side token decode — no `fetch`, no API call on page load**. `api/guest/:id` is NOT called by the hook/page.
- **D-03:** missing / malformed / tampered token → fallback "Our Beloved Guests". `document.title` set only when a real name resolves (token or `?to=`). Token whose embedded `id` differs from the `/i/:id` path still greets from the token name — client decodes only.
- **D-04:** `?to=<name>` kept as dev/preview shortcut — second resolution step after token.
- **D-05:** Add `<Routes>` in `App.jsx`: `/i/:id` and `/` both render `SaveTheDatePage`. `BrowserRouter` stays in `main.jsx`.
- **D-06:** `GET /api/guest/:id` is id-only lookup — nanoid IS the credential, no `?t=` read on this read path. Returns `{ id, displayName }` on 200, 404 unknown. Filter `WHERE deleted_at IS NULL`. Log `id`, never `name`.
- **D-07:** `displayName` from Neon `display_name` column. Endpoint never reads/trusts token name.
- **D-08:** Soft-deleted OR unknown id → 404 (`{ error: "not found" }`).
- **D-09:** `GUEST_TOKEN_SECRET` and `DATABASE_URL` via `process.env` in `api/` only, never `VITE_`-prefixed, never in `src/`.
- **D-10:** `vercel.json` rewrites: `/api/(.*)` passthrough **first**, then `/(.*) → /index.html` SPA catch-all.

### Claude's Discretion

- Exact `api/guest/[id].js` Neon query form, JSON error body shape beyond `{ error: "not found" }`, HTTP method guard (405 for non-GET).
- Whether to extract the `?t=`-decode logic into a tiny helper vs inline in the hook.
- How `App.jsx` composes `MotionConfig` + `Routes`.
- Whether `vercel.json` pins a Node runtime version in a `functions` block.
- A throwaway/local check that `GET /api/guest/:id` returns 200/404.

### Deferred Ideas (OUT OF SCOPE)

- Token HMAC verification on the GET read path.
- Rate limiting on `/api/guest/:id`.
- 410 Gone for soft-deleted guests.
- Removing `?to=` entirely.
- Mobile polish + Vercel deploy (Phase 9).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-02 | A Vercel serverless endpoint (Node runtime) validates/looks up a guest by `id` — the contract a future RSVP flow builds on | Handler signature (Web API `export function GET`), `@neondatabase/serverless` `neon()` tagged-template, `[id].js` bracket param, `vercel.json` wiring |
| BACK-03 | The signing secret and database URL are server-only env vars (never `VITE_`-prefixed; never in client bundle) | `process.env` in `api/` only, grep audit `grep -r "VITE_" .env* src/`, confirmed clean baseline |
</phase_requirements>

---

## Summary

Phase 8 adds two deliverables to an existing working Vite SPA: (1) extend `useGuestName.js` to decode the `?t=` token first (via the already-built `decodeGuestToken`), and (2) create `api/guest/[id].js` as a Vercel Node.js function that queries Neon by id. Both the frontend hook extension and the endpoint are mechanically straightforward — all foundational pieces (token contract, `decodeGuestToken`, Neon schema, `@neondatabase/serverless` import pattern) are already built and tested in Phases 6–7.

The one architectural clarity this research provides: Vercel's **current (2026) recommended function signature** for the "other frameworks" (non-Next.js) path is the **Web API `export function GET(request)` style**, NOT the legacy `export default function handler(req, res)` style. The `[id].js` bracket convention is unchanged and route params arrive via `new URL(request.url).pathname` parsing (Web API) or via `req.query.id` (legacy handler). Using the newer Web API pattern is simpler and more consistent with official 2026 docs.

`@neondatabase/serverless`'s `neon()` client is created per-invocation (module-level creation is fine for the HTTP driver — there is no persistent TCP connection to manage). The tagged-template parameterized query mirrors the existing `scripts/migrate.js` pattern exactly.

**Primary recommendation:** Use `export function GET(request)` Web API signature for `api/guest/[id].js`, read the id from `new URL(request.url).pathname`, query Neon with a parameterized tagged-template, and return `Response.json(...)`. The hook extension is a three-step resolution that replaces the single `?to=` read — no new helpers needed.

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies To This Phase |
|-----------|----------------------|
| Import from `react-router` (NOT `react-router-dom`) — v7 unified package | `useSearchParams`, `useParams` imports in hook; `Routes`, `Route` in App.jsx |
| No UI libraries — custom design only | N/A (no new UI) |
| No inline styles — CSS Modules variables | N/A (no new styles) |
| No hardcoded animation delays — `staggerChildren` | N/A (no new animations) |
| `VITE_` never for secrets | BACK-03: `process.env` only in `api/`, never `import.meta.env` for secrets |
| `scripts/lib/` is Node-only / secret-bearing — never import into `src/` | `api/guest/[id].js` must NOT import `scripts/lib/token.js` (D-06: no token verify on read path) |

---

## Standard Stack

### Core (already installed — no new installs for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@neondatabase/serverless` | `^1.1.0` (installed) | HTTP-based Postgres driver for Vercel Functions | Zero TCP pool overhead, works identically in serverless Node.js functions as in scripts |
| `react-router` | `^7.16.0` (installed as `react-router-dom`) | `useSearchParams`, `Routes`, `Route` | Already in use; v7 unified package; import from `react-router` per project convention |

**No new npm installs required for Phase 8.** All dependencies are already in `package.json`.

### Vercel Function runtime

The project deploys to Vercel Hobby with the Node.js runtime (NOT Edge — deprecated per official Vercel docs updated 2025-12-08 and 2026-05-12). The default runtime is the current Node.js LTS (Node 22.x as of 2026). No `functions` block in `vercel.json` is needed to pin a version — the default is correct.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
wedding-site/
├── api/
│   └── guest/
│       └── [id].js          # NEW: GET /api/guest/:id — Node.js serverless function
├── vercel.json              # NEW: SPA catch-all + api passthrough rewrites
└── src/
    └── hooks/
        └── useGuestName.js  # MODIFIED: extend in place with token-first resolution
    └── App.jsx              # MODIFIED: add <Routes> wrapping both / and /i/:id
```

---

### Pattern 1: Vercel Function Handler Signature (2026 — Web API style)

**What:** Vercel's current recommended signature for non-Next.js `/api` functions is the Web API style: named HTTP method exports (`export function GET(request)`) or the `fetch` Web Standard (`export default { fetch(request) }`). The legacy `export default function handler(req, res)` style still works but the docs now lead with the Web API pattern.

**Route params in Web API style:** Dynamic path segments (the `id` from `[id].js`) are NOT available as named properties on the standard `Request` object — they arrive via `req.query.id` on the legacy helper style, or must be parsed from the URL on the Web API style.

**Recommended approach for this project:** Use the **legacy Node.js helper style** (`export default function handler(req, res)`) for `api/guest/[id].js` — it gives `req.query.id` for the bracket param directly (confirmed HIGH confidence from Vercel docs), is simpler for a single endpoint, and the project is already ESM (`"type":"module"`) so `export default` works fine.

> **Confidence: HIGH** — Verified against Vercel Functions API Reference (last updated 2026-04-26) which explicitly documents `request.query` as a Vercel-provided helper on the Node.js request object, and confirms bracket syntax for dynamic routes reads via `req.query`.

**Complete handler skeleton** for `api/guest/[id].js`:

```js
// api/guest/[id].js
// GET /api/guest/:id — id-only guest lookup (no token verify on this read path, D-06)
// Node.js runtime (NOT Edge — deprecated). process.env only, never VITE_ (D-09).

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Method guard — only GET is supported
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { id } = req.query;

  // Guard: id must be a non-empty string
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'bad request' });
  }

  // Create Neon client — per-invocation, HTTP driver (no persistent TCP pool)
  const sql = neon(process.env.DATABASE_URL);

  // Log only id — never log the guest name (PITFALLS: PII in logs, D-06)
  console.log(`GET /api/guest/${id}`);

  try {
    const rows = await sql`
      SELECT id, display_name
      FROM guests
      WHERE id = ${id}
        AND deleted_at IS NULL
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const { id: guestId, display_name } = rows[0];
    return res.status(200).json({ id: guestId, displayName: display_name });

  } catch (err) {
    // Log error without PII
    console.error(`DB error for guest lookup id=${id}:`, err.message);
    return res.status(500).json({ error: 'internal server error' });
  }
}
```

**Why not the Web API `export function GET` style:**
- `req.query.id` from the Vercel Node.js helper style is simpler than parsing `new URL(request.url).pathname` and extracting the id manually.
- This project has no TypeScript (`@vercel/node` types not needed).
- The legacy handler is not going away — Vercel docs document both as valid.
- The `res.status().json()` chainable helpers match the existing `scripts/` code style.

---

### Pattern 2: `@neondatabase/serverless` in a Vercel Node.js Function

**What:** Call `neon(process.env.DATABASE_URL)` inside the handler function, not at module scope. The HTTP driver has no persistent TCP pool to warm up, so per-invocation client creation is the correct pattern. Module-scope creation also works (the driver is stateless) but per-invocation is more explicit.

**Parameterized query** using the tagged-template SQL API (same as `scripts/migrate.js` and `scripts/generate-links.js`):

```js
const rows = await sql`
  SELECT id, display_name
  FROM guests
  WHERE id = ${id}
    AND deleted_at IS NULL
`;
```

The `${id}` interpolation is safe from SQL injection — the template tag handles parameterization (confirmed HIGH confidence by `@neondatabase/serverless` README in the installed package).

**Cold start cost:** The HTTP driver connects fresh on each invocation — no connection pool warmup. Typical latency is 10–50ms for a simple SELECT on the Hobby Neon free tier (same region as the Vercel function). This is acceptable because the endpoint is NOT on the page-load critical path (D-02).

---

### Pattern 3: `vercel.json` for Vite SPA + `/api`

**What:** The exact `vercel.json` contents needed are two rewrites in order:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```

**Why this order is critical (PITFALLS #5 / anti-pattern #4):** Vercel evaluates rewrites sequentially. If `/(.*) → /index.html` appears first, it matches `/api/guest/abc123` and sends it to the SPA — the function never fires. The `/api/(.*)` passthrough rule must come first.

**No `functions` runtime block needed:** The default Node.js runtime is correct. Adding an explicit `functions` block only matters if you need to override the Node.js version or set memory/duration. Omit it for a cleaner `vercel.json`.

**Does `/i/:id` deep-link work with this?** Yes — `/(.*) → /index.html` catches `/i/abc123` and serves the SPA. React Router's `BrowserRouter` then handles the client-side routing to the `/i/:id` route.

**Vite dev server behavior for `/i/:id`:** Vite's dev server already serves `index.html` for all paths that don't match a static file (the default `appType: 'spa'` behavior includes `historyApiFallback` by default). No `vite.config.js` changes needed.

> **Confidence: HIGH** — Verified against ARCHITECTURE.md (Pattern 3), STACK.md §1, official Vercel vercel.json docs (last updated 2026-03-11), and the existing project's confirmed vite.config.js (`appType` is not overridden, so Vite default SPA mode applies).

---

### Pattern 4: React Router v7 Routes in `App.jsx`

**What:** `App.jsx` currently renders `SaveTheDatePage` directly inside `MotionConfig` with no `<Routes>`. This phase wraps the page in `<Routes>` with two routes: `/i/:id` and `/` (catch-all fallback).

**Exact App.jsx change:**

```jsx
// Before (current):
import { MotionConfig } from 'framer-motion';
import SaveTheDatePage from './pages/SaveTheDatePage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SaveTheDatePage />
    </MotionConfig>
  );
}

// After (Phase 8):
import { MotionConfig } from 'framer-motion';
import { Routes, Route } from 'react-router';  // import from 'react-router' per project convention
import SaveTheDatePage from './pages/SaveTheDatePage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/i/:id" element={<SaveTheDatePage />} />
        <Route path="/*" element={<SaveTheDatePage />} />
      </Routes>
    </MotionConfig>
  );
}
```

**`MotionConfig` stays as the outermost wrapper** — Routes renders inside it, so all animations in `SaveTheDatePage` still inherit the `reducedMotion="user"` config.

**Does the hook need `useParams` for `:id`?** No. The greeting only needs `?t=` from `useSearchParams`. The `:id` path param is the durable identity for the future RSVP route, not needed by the greeting. `useParams` is NOT needed in `useGuestName.js`. (Per D-03 and D-05: even if `token.id` differs from the path `:id`, the client still greets from the token name — path/token-id consistency is a server concern only.)

> **Confidence: HIGH** — React Router v7 `Routes`/`Route` API is stable; `import from 'react-router'` is the project convention established in Phase 1 and Phase 3. `MotionConfig` as outer wrapper is confirmed by reading current `App.jsx`.

---

### Pattern 5: `useGuestName.js` Rewrite

**What:** Extend in place, keeping `{ name, hasName }` return shape and `document.title` side-effect. Resolution order: token → `?to=` → fallback.

**Current state:**
```js
// useGuestName.js currently reads only ?to=
const raw = searchParams.get('to');
const trimmed = raw ? raw.trim() : '';
const hasName = trimmed.length > 0;
const name = hasName ? trimmed : 'Our Beloved Guests';
```

**Phase 8 rewrite (extend in place):**

```js
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { decodeGuestToken } from '../lib/decodeGuestToken.js';

function useGuestName() {
  const [searchParams] = useSearchParams();

  // Resolution order (D-01):
  // 1. ?t= token (signed payload, instant decode — no network call)
  // 2. ?to= legacy dev/preview shortcut (D-04)
  // 3. fallback "Our Beloved Guests"

  let name = 'Our Beloved Guests';
  let hasName = false;

  const t = searchParams.get('t');
  if (t) {
    const decoded = decodeGuestToken(t);
    if (decoded && decoded.name) {
      name = decoded.name;
      hasName = true;
    }
  }

  if (!hasName) {
    const raw = searchParams.get('to');
    const trimmed = raw ? raw.trim() : '';
    if (trimmed.length > 0) {
      name = trimmed;
      hasName = true;
    }
  }

  useEffect(() => {
    if (hasName) {
      document.title = `Save the Date – For ${name}`;
    }
    // If !hasName, leave document.title at its default (D-03: no title override for fallback)
  }, [hasName, name]);

  return { name, hasName };
}

export default useGuestName;
```

**`hasName` semantics for the token path:** `hasName = true` when the token decodes successfully to a non-empty name. `hasName = false` for fallback (same as current `?to=` absent behavior). `GuestGreeting.jsx` only uses `.name` — `hasName` is returned for any future consumer that needs to branch on "personalized vs generic" (e.g. the `document.title` effect already uses it).

**Why inline vs extract to helper:** The resolution logic is 6 lines. No extraction needed — the hook IS the resolver. `decodeGuestToken` is already the extraction.

> **Confidence: HIGH** — Reading current `useGuestName.js` and `decodeGuestToken.js` confirms the integration is a direct addition. `GuestGreeting.jsx` consumes only `.name` so the return shape change is backward-compatible.

---

### Anti-Patterns to Avoid

- **Anti-pattern: Importing `scripts/lib/token.js` into `api/guest/[id].js`** — The endpoint is read-only; no token verification is needed on this path (D-06). `verify()` is reserved for the future RSVP write path. Importing it also violates the `scripts/lib/` → never into `src/` trust boundary (only `api/` would be safe, but there's no reason to import it here).
- **Anti-pattern: `VITE_DATABASE_URL` or `VITE_GUEST_TOKEN_SECRET`** — These are already absent from `.env.example` and current `.env.local` (confirmed by grep). Never add the `VITE_` prefix to these keys.
- **Anti-pattern: catch-all before api in `vercel.json`** — Always `/api/(.*)` first.
- **Anti-pattern: Calling `GET /api/guest/:id` from `useGuestName` for the greeting** — The endpoint is NOT on the page-load path. The greeting is 100% client-side token decode.
- **Anti-pattern: Logging `display_name` in the endpoint** — Log `id` only. Vercel Hobby logs retain 1 hour; guest names in logs are PII.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL-safe parameterized query | String concatenation: `"WHERE id = '" + id + "'"` | `neon()` tagged-template `WHERE id = ${id}` | Template tag handles escaping; SQL injection free |
| base64url → JSON decode for token | Custom atob/decode chain | `decodeGuestToken()` from `src/lib/decodeGuestToken.js` (already built, already tested) | All edge cases already covered (unicode, missing fields, null returns) |
| React Router URL params | `window.location.search` parsing | `useSearchParams()` from `react-router` | Already installed; handles URL encoding, re-renders on param changes |

---

## Common Pitfalls

### Pitfall 1: `VITE_` Prefix on Secrets

**What goes wrong:** Any env var prefixed `VITE_` is compiled into the Vite JS bundle at build time and shipped to every visitor. `GUEST_TOKEN_SECRET` or `DATABASE_URL` in the bundle is a complete credential leak.

**Why it happens:** Reflex from "how do I read env vars in a Vite app?" — the answer for secrets is: you don't; they live only in `api/` via `process.env`.

**How to avoid:** All secrets in `.env.local` already lack the `VITE_` prefix (confirmed by grep). Never add it. The audit command `grep -r "VITE_" .env* src/` (criterion #3) must return zero secret matches.

**Warning signs:** `import.meta.env.VITE_DATABASE_URL` appearing anywhere in `src/`.

### Pitfall 2: `vercel.json` Catch-All Before API Routes

**What goes wrong:** `/(.*) → /index.html` as the first rewrite swallows `/api/guest/abc123` — the function never fires, SPA tries to route it, fails silently.

**Why it happens:** SPA devs add the catch-all and forget `/api`.

**How to avoid:** `/api/(.*)` passthrough rule FIRST, then `/(.*) → /index.html`. The `vercel.json` skeleton above has the correct order.

**Warning signs:** `fetch('/api/guest/abc123')` returns HTML instead of JSON.

### Pitfall 3: `useGuestName` Import Path for `decodeGuestToken`

**What goes wrong:** Using `../../scripts/lib/token.js` path (the Node-only secret-bearing file) instead of `../lib/decodeGuestToken.js` (the browser-safe file). Vite would try to bundle `node:crypto` into the browser bundle.

**Why it happens:** Both files live in `lib/` directories at different levels; the paths look similar.

**How to avoid:** The hook must only import `decodeGuestToken` from `src/lib/decodeGuestToken.js` — the file that uses `atob()` (browser API), not `node:crypto`. The correct relative import from `src/hooks/useGuestName.js` is `'../lib/decodeGuestToken.js'`.

### Pitfall 4: `/i/:id` 404 on Direct Navigation Without `vercel.json`

**What goes wrong:** Without the `/(.*) → /index.html` rewrite in `vercel.json`, navigating directly to `https://yoursite.com/i/abc123?t=...` in a fresh browser tab returns a 404 — Vercel finds no static file at that path.

**Why it happens:** BrowserRouter only handles client-side navigation from within an already-loaded SPA. A cold navigation hits the Vercel CDN directly.

**How to avoid:** `vercel.json` with the SPA catch-all. This is criterion #4 and is only verifiable after the Phase 9 deploy. Locally, Vite dev server already handles this (SPA mode default).

### Pitfall 5: `decodeGuestToken` Called Without `null` Check

**What goes wrong:** `const { name } = decodeGuestToken(t)` throws if `decodeGuestToken` returns `null`.

**How to avoid:** Always guard: `const decoded = decodeGuestToken(t); if (decoded && decoded.name) { ... }`. The hook skeleton above shows the correct pattern.

---

## Local Testing Strategy (Criterion #2 — Lowest-Friction)

**Vercel CLI status:** Not installed on this machine. Installing it to run `vercel dev` is an option but adds a dependency and requires linking a Vercel project.

**Recommended: Node.js harness (zero new tools)**

Write a throwaway test harness that imports the handler directly and exercises it with a fake `req`/`res`:

```js
// scripts/test-guest-endpoint.js  (throwaway — NOT committed)
// Run: node --env-file=.env.local scripts/test-guest-endpoint.js <id>
import handler from '../api/guest/[id].js';

const id = process.argv[2] || 'test-id';

const req = {
  method: 'GET',
  query: { id },
};

const res = {
  _status: 200,
  _body: null,
  status(code) { this._status = code; return this; },
  json(body) { this._body = body; console.log(`HTTP ${this._status}:`, JSON.stringify(body, null, 2)); return this; },
};

await handler(req, res);
```

Run with `node --env-file=.env.local scripts/test-guest-endpoint.js <a-real-id>` for 200, and a fake id for 404. No `vercel dev`, no Vercel CLI, no deploy needed.

**Alternative:** `vercel dev` (install Vercel CLI, `vercel link`, then `vercel dev`). This also serves the SPA on localhost:3000 with the `/api` functions live. More complete but higher friction for a Phase 8 local smoke test. Defer to Phase 9 deploy validation.

**Criterion #4 (routing):** Not fully testable without a deploy. Locally, Vite dev server serves `index.html` for `/i/:id` by default (SPA mode). The `vercel.json` routing is only exercised on Vercel — verify in Phase 9.

---

## Criterion #3 — VITE_ Secret Audit

**Exact command (per PITFALLS Pitfall 1 and docs/identity-token-contract.md §5):**

```bash
grep -r "VITE_" .env* src/
```

**Current baseline:** Running this audit NOW against the existing repo returns no matches — confirmed clean. The Phase 8 changes must not introduce any `VITE_`-prefixed secrets.

**What "zero results" means:** The grep finds no occurrences of the literal string `VITE_` in `.env` files or `src/` files. Any VITE_ hits must be audited — only genuinely public config (e.g. `VITE_WEDDING_DATE`) is acceptable. Signing secrets and DB URLs must never appear.

**Note:** `src/lib/decodeGuestToken.js` reads no `import.meta.env` at all — confirmed by reading the file. The hook extension must not add any `import.meta.env` access.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `api/guest/[id].js` harness, existing scripts | ✓ | v23.10.0 | — |
| `@neondatabase/serverless` | `api/guest/[id].js` | ✓ | 1.1.0 (installed) | — |
| Neon DB (live) | `api/guest/[id].js` 200/404 test | ✓ | `.env.local` has `DATABASE_URL` | — |
| `react-router` | `App.jsx`, `useGuestName.js` | ✓ | 7.16.0 (installed as `react-router-dom`) | — |
| Vercel CLI (`vercel dev`) | Local full-stack test | ✗ | — | Node.js harness (see Local Testing) |
| Live Vercel deploy | Criterion #4 deep-link routing | ✗ | — | Verify in Phase 9 |

**Missing dependencies with no fallback:** None that block Phase 8 work itself.

**Missing dependencies with fallback:** Vercel CLI is absent; the Node.js harness is the fallback for criterion #2 local testing.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (Node.js built-in — existing pattern throughout the project) |
| Config file | None — tests run directly via `node --test` |
| Quick run command | `node --test src/lib/decodeGuestToken.test.js` |
| Full suite command | `node --test src/lib/decodeGuestToken.test.js scripts/lib/token.test.js` |

**React component testing:** The project currently has NO React test runner (no vitest, no jest, no RTL). Tests are pure `node:test` for lib/script modules only. This phase adds no new React components, so there is no need to add a React test runner. The hook's logic is pure enough (a sync resolution from search params) that it can be tested by extracting the resolution logic to a pure function — but this is optional. The recommendation is:

**Do NOT add vitest/RTL for this phase.** The hook's resolution logic is 6 lines of synchronous conditional logic over string inputs. The risk is low; the cost of adding a full React test runner is high. Instead, validate the hook manually by opening the browser with `/?t=<real-token>` and `/?to=Test+Name` and observing the greeting. The existing `decodeGuestToken.test.js` already covers the decode layer (9 tests, all passing).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BACK-02 | `GET /api/guest/:id` returns 200 `{id, displayName}` for a known id | integration (Node harness) | `node --env-file=.env.local scripts/test-guest-endpoint.js <real-id>` (throwaway) | ❌ Wave 0 |
| BACK-02 | `GET /api/guest/:id` returns 404 `{error:"not found"}` for unknown id | integration (Node harness) | `node --env-file=.env.local scripts/test-guest-endpoint.js fake-id-000` (throwaway) | ❌ Wave 0 |
| BACK-02 | `GET /api/guest/:id` returns 405 for non-GET methods | unit (Node harness) | Same harness with `req.method = 'POST'` | ❌ Wave 0 |
| BACK-02 | `/i/:id` route renders `SaveTheDatePage` (React Router) | manual | Open `http://localhost:5173/i/any-id` — page should load | N/A |
| BACK-02 | `useGuestName` resolves token-first, `?to=` fallback, "Our Beloved Guests" | manual browser smoke | Open `/?t=<real-token>`, `/?to=Test+Name`, `/` — check greeting | N/A |
| BACK-03 | No `VITE_` secrets in src/ or .env* | grep audit (automated) | `grep -r "VITE_" .env* src/` → zero results | N/A (command, not file) |
| BACK-03 | `decodeGuestToken` uses no `import.meta.env` | static code review | `grep -r "import.meta.env" src/` → zero results | N/A |

### Sampling Rate

- **Per task commit:** `grep -r "VITE_" .env* src/` (secret audit — instant)
- **Per wave merge:** `node --test src/lib/decodeGuestToken.test.js` (existing decode tests still pass)
- **Phase gate (before `/gsd:verify-work`):** Full integration smoke — endpoint harness (200 + 404 + 405), browser greeting check for all three resolution paths, `grep -r "VITE_"` clean.

### Wave 0 Gaps

- [ ] `scripts/test-guest-endpoint.js` — throwaway Node harness for criterion #2 (BACK-02 endpoint 200/404/405). Not committed; run locally, discard after Phase 9 deploy.

*(Existing `src/lib/decodeGuestToken.test.js` covers the decode integration — 9 tests, already complete. No new test files needed for the hook extension itself.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `export default function handler(req, res)` as primary Vercel Function style | `export function GET(request)` Web API style as preferred in 2026 docs | 2025–2026 (docs updated 2026-04-26) | Both work; Web API style is cleaner for new functions but legacy is fine and gives `req.query.id` without URL parsing |
| Edge runtime | Node.js runtime | 2025-12-08 (deprecated) | Edge runtime must NOT be used; Node.js is current standard |
| `@vercel/kv` | `@upstash/redis` or Neon Postgres | Dec 2024 (sunset) | Already resolved in Phase 7 — Neon Postgres in use |

---

## Open Questions

1. **`req.query.id` in ESM `api/` files**
   - What we know: Vercel's Node.js helper docs show `req.query` populated for functions, including bracket params. The project is `"type":"module"`, so files use `export default`.
   - What's unclear: Whether the Vercel Node.js runtime injects `req.query` for ESM handler files the same way as CJS. Based on official docs, the `request.query` helper is a Vercel-provided property on the Node.js `IncomingMessage` object regardless of module type.
   - Recommendation: Proceed with `req.query.id`. If it reads as `undefined` at runtime, fall back to parsing from `req.url` — but this is LOW risk given official documentation.

2. **`first_seen_at` update in the GET endpoint**
   - What we know: The schema has a `first_seen_at TIMESTAMPTZ` column (from `scripts/migrate.js`). ARCHITECTURE.md mentions it as "written by Phase 8 lookup endpoint on first visit."
   - What's unclear: CONTEXT.md D-06 only specifies the SELECT — it says nothing about updating `first_seen_at` on GET. Adding an UPDATE would make the endpoint non-idempotent and slightly more complex.
   - Recommendation: Omit the `first_seen_at` UPDATE from the Phase 8 GET endpoint — keep it read-only (SELECT only). The CONTEXT.md success criterion #2 only specifies "returns `{id, displayName}` with HTTP 200 for valid guest." Add `first_seen_at` update to the future RSVP milestone if needed.

---

## Sources

### Primary (HIGH confidence)

- Vercel Functions API Reference (last updated 2026-04-26) — handler signatures, `request.query` helper, method exports — https://vercel.com/docs/functions/functions-api-reference
- Vercel Node.js Runtime docs (last updated 2026-05-19) — `request.query`, `response.json()`, helper methods confirmed — https://vercel.com/docs/functions/runtimes/node-js
- Vercel Edge Runtime deprecation notice (last updated 2025-12-08) — https://vercel.com/docs/functions/runtimes/edge
- `@neondatabase/serverless` README (installed version 1.1.0, local) — `neon()` tagged-template API, parameterized query safety
- `docs/identity-token-contract.md` (LOCKED) — URL shape, payload schema, env naming, fallback contract
- `src/lib/decodeGuestToken.js` (direct read) — browser-safe decode, `{id,name}|null` return
- `src/hooks/useGuestName.js` (direct read) — current `{name, hasName}` shape, `document.title` effect
- `scripts/migrate.js` (direct read) — `neon()` pattern, schema columns confirmed
- `package.json` (direct read) — `@neondatabase/serverless ^1.1.0` installed, `react-router-dom ^7.16.0`, `"type":"module"`
- `vite.config.js` (direct read) — no `appType` override confirms default SPA mode with history fallback

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` — Pattern 3 `vercel.json`, Pattern 4 Neon driver, anti-patterns #1/#4/#5
- `.planning/research/STACK.md` — §1 Vercel Functions Node runtime, vercel.json snippet
- `.planning/research/PITFALLS.md` — Pitfall 1 VITE_ leak, Pitfall 5 catch-all ordering, PII-in-logs

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified as installed, Vercel runtime confirmed by official docs (2026-05-19)
- Architecture patterns: HIGH — handler signature from official Vercel API Reference, vercel.json from official docs, React Router v7 from installed version, `neon()` from local package README
- Pitfalls: HIGH — VITE_ leak and catch-all ordering confirmed by official Vite docs and Vercel vercel.json docs; validated by existing clean grep baseline
- Validation architecture: HIGH — existing `node:test` pattern confirmed by reading test files; no React test runner needed (no new UI components)

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (Vercel Node.js function signatures and `@neondatabase/serverless` API are stable; React Router v7 API is stable)
