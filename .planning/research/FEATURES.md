# Feature Research

**Domain:** Personalized per-guest invite link identity + RSVP foundation (wedding/event site)
**Researched:** 2026-05-30
**Confidence:** HIGH (architecture patterns well-established; wedding-specific implementations corroborated by open-source references)

---

## Scope Boundary

This research covers v2.0 only: durable guest identity, link generation tooling, backend/datastore foundation. The RSVP form/flow itself is explicitly out of scope. All features below are evaluated against the existing v1 save-the-date (animated single-page React/Vite app with `?to=` greeting).

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Opaque per-guest URL ID | Any personalized invite system uses stable, hard-to-guess IDs; a plain `?to=Name` invite is trivially editable by guests | LOW | UUID v4 or nanoid (21-char URL-safe random) is the standard. Not a signed token at this layer — just a stable random key. |
| Greeting resolves from the link without a guest-list endpoint | Guests must see their name immediately; making the app call `/api/guest/:id` on every load leaks whether IDs are valid and adds latency | MEDIUM | Two proven approaches exist (see Architecture note below). Recommended: encode display name in the link itself (Base64 or JWT payload) so the frontend can render instantly, while the backend validates the ID separately for writes. |
| Graceful fallback for invalid/tampered links | Guests forward links, typo URLs, tokens expire or are revoked; the page must not crash or show an error wall | LOW | Fall back to the same "Our Beloved Guests" default already in `useGuestName`. Show the full save-the-date experience anonymously. Log the miss server-side for admin awareness. |
| Link-generation CLI/script (owner tooling) | The couple needs to produce one URL per guest group from a simple source (CSV, JSON, or a spreadsheet) | LOW | A Node.js script (`scripts/mint-links.js`) that reads a guest list file and outputs a CSV of `[name, url]` pairs. No web UI needed for v2.0. |
| Persistent guest record in datastore | Identity must be durable (same link works months later for the RSVP flow) and keyed for future writes | MEDIUM | Minimum schema: `{ id, displayName, createdAt }`. The RSVP milestone adds `rsvpStatus`, `partySize`, etc. to this same record. |
| Backend API route to validate a guest ID | When the RSVP form lands in a future milestone, it needs a server endpoint to confirm the ID is real before accepting a submission | LOW | `GET /api/guest/:id` → `{ displayName }` or 404. Already needed for idempotent RSVP writes. |

### Differentiators (What Makes This Better Than `?to=`)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Self-contained display-name in URL (no DB round-trip for greeting) | Page renders instantly with correct guest name — no loading state, no flash of generic fallback, works even before DB responds | MEDIUM | Encode `displayName` as a URL-safe Base64 segment or JWT claim in the URL alongside the opaque ID. Pattern: `/?g=<id>.<b64name>` or `/?g=<signedJWT>`. The signed-JWT variant adds tamper-evidence to the display name itself. |
| HMAC-signed token (name + ID bound together) | Prevents a guest from editing their own display name in the URL to impersonate another guest or inject script content | MEDIUM | Sign `{ id, displayName }` with HMAC-SHA256 using a server secret. Verify signature server-side on any write. For the greeting-only read path this is optional but cheap to add. |
| Single link serves both save-the-date and future RSVP | Guests bookmark or share one URL; re-issuing links before RSVP launch is operationally painful | LOW | Design the URL shape as `/?g=<token>` now. The RSVP milestone adds form UI keyed on the same `id`. No link regeneration required. |
| Admin CSV export of link inventory | Owner can see which links were minted, re-send a specific link, track who hasn't opened yet (via first-seen timestamp) | MEDIUM | Requires `firstSeenAt` field in guest record, set on first valid load. Not a v2.0 requirement but the schema should include the field from day one. |

### Anti-Features (Avoid These)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Storing display name only in the URL with no backend record | Seems simpler — no DB needed, pure static site | The RSVP milestone requires a server-side record to write responses to. Building stateless-only now means a schema migration and re-issuance of all links when RSVP lands. One-time cost to add a minimal DB now is far cheaper. | Add the minimal DB record now (`id`, `displayName`, `createdAt`); RSVP fields come later. |
| Public guest-list endpoint (`GET /api/guests`) | Seems convenient for an admin dashboard | Exposes every guest name and ID in a single unauthenticated call — any guest can see the full list | Admin tooling reads the datastore directly (script or protected route with env-var secret header); no public list endpoint ever. |
| Full auth/login flow for guests | "Secure" feels like it needs login | Massive friction for a keepsake site. Guests won't create accounts for a single-event invite. Industry standard (Joy, Zola, django-wedding-website) is token-in-URL, not login. | Opaque ID in URL is the accepted pattern. Add a simple rate-limit on the validation endpoint to resist brute force. |
| Expiring tokens | "Security best practice" | A guest saves the link in Gmail and opens it 6 months later before the RSVP window — it's dead. Wedding invite links must be permanent or at minimum multi-year. | No expiry. Revocation (if needed) is an explicit admin action, not automatic TTL. |
| Fancy admin web UI for v2.0 | Nice to manage guests visually | Overkill for a ~100 guest list; builds scope significantly | CLI script + direct datastore access is sufficient for v2.0. Admin UI is a future milestone if needed. |
| Parallel `?to=` and `?g=` support (migration shim) | Backward compatibility during cutover | The site is not yet deployed — there are no live `?to=` links in the wild to support. A shim adds code path complexity for zero real benefit. | Cut cleanly to `?g=` in v2.0. The `useGuestName` hook is the only consumer and is easy to replace. |

---

## Feature Dependencies

```
[Opaque guest ID in datastore]
    └──required by──> [Link-generation script]
    └──required by──> [Backend API route GET /api/guest/:id]
                          └──required by──> [Future RSVP form submission]
                          └──required by──> [Graceful 404 handling for invalid IDs]

[Display name in URL token]
    └──feeds──> [Frontend greeting render (no DB round-trip)]
    └──enhanced by──> [HMAC signature on token]
                          └──required for──> [Tamper-evident display name on write]

[Guest record schema { id, displayName, createdAt, firstSeenAt }]
    └──extended by (future)──> [RSVP fields: rsvpStatus, partySize, meal, notes]
    └──extended by (future)──> [Admin dashboard: open rate, response rate]

[Vercel serverless API routes]
    └──required by──> [Backend API route]
    └──required by──> [HMAC signature verification]
```

### Dependency Notes

- **Opaque guest ID requires datastore:** The ID is meaningless without a record to look up. Datastore must be provisioned before link generation.
- **Display name in URL is independent of datastore read:** This is intentional — it lets the save-the-date greeting render instantly without a server round-trip. The DB is only hit on write paths (future RSVP).
- **HMAC signing requires a server secret:** Must be set as a Vercel environment variable. The link-generation script uses the same secret to sign; the API route uses it to verify.
- **`useGuestName` hook (v1) must be replaced:** v2.0 parses `?g=` instead of `?to=`. The hook interface stays the same (returns a display name string) but the parsing logic changes. One-file change, no cascade.

---

## What the Foundation Must Expose for Future RSVP

This is the contract the v2.0 foundation must honor so the RSVP milestone slots in without re-issuing links or reworking identity:

| Contract Item | Why Required | v2.0 Delivers? |
|---------------|--------------|----------------|
| Stable guest ID in URL that survives bookmark/share | RSVP form reads the same `?g=` param to identify who is submitting | YES — the opaque ID is the key |
| `GET /api/guest/:id` returns `{ id, displayName }` or 404 | RSVP form validates the link is real before showing the form | YES — minimal route in v2.0 |
| Guest record in datastore has reserved fields for RSVP data | RSVP milestone adds `rsvpStatus`, `partySize` etc. to the existing row — no schema migration required if fields are nullable from day one | YES — schema includes nullable RSVP columns as stubs |
| No link expiry | RSVP window opens months after save-the-date launch; the same link must work | YES — no TTL |
| Idempotent write path | RSVP form can be re-submitted (guest changes their mind); last-write wins, no duplicate records | DESIGN INTENT — v2.0 does not implement writes but the schema key (`id`) is the natural idempotency key |
| Rate-limited validation endpoint | RSVP form hitting the validation endpoint must be protected against abuse | PARTIAL — v2.0 should add basic rate limiting on `GET /api/guest/:id`; full write-path rate limiting is RSVP milestone work |

---

## MVP Definition for v2.0

### Launch With (v2.0)

- [ ] Opaque ID generated per guest group (UUID/nanoid), stored in datastore
- [ ] Display name encoded in URL alongside ID (Base64 or HMAC-JWT) — no DB read needed for greeting
- [ ] `useGuestName` updated to parse `?g=` token and return display name
- [ ] Graceful fallback to "Our Beloved Guests" for missing/invalid/tampered `?g=`
- [ ] `GET /api/guest/:id` serverless route (validate ID exists, return display name)
- [ ] Guest datastore schema with stub RSVP columns (nullable) so future writes don't require migration
- [ ] Link-generation CLI script: reads guest list (JSON/CSV), mints URLs, outputs link inventory CSV
- [ ] Vercel environment variable for HMAC signing secret
- [ ] Responsive/mobile polish (EXP-01/02, carried from v1)
- [ ] Deployed to Vercel with durable links (DEPLOY-01)

### Add After Validation (RSVP milestone)

- [ ] RSVP form UI keyed on the same `?g=` ID
- [ ] `POST /api/rsvp` write route with idempotent upsert
- [ ] Full write-path rate limiting and anti-bot
- [ ] Email confirmation to couple on new response

### Future Consideration (post-RSVP)

- [ ] Admin web dashboard (response rates, individual status, re-send link)
- [ ] `firstSeenAt` / open-rate tracking
- [ ] Event details pages (schedule, travel, registry)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Opaque stable guest ID + datastore record | HIGH | LOW | P1 |
| Display name in URL (instant greeting, no DB round-trip) | HIGH | LOW | P1 |
| Graceful fallback for invalid links | HIGH | LOW | P1 |
| Link-generation CLI script | HIGH (owner) | LOW | P1 |
| `GET /api/guest/:id` validation route | HIGH (RSVP contract) | LOW | P1 |
| HMAC signing on the token | MEDIUM | MEDIUM | P2 |
| Stub RSVP fields in schema | MEDIUM (future-proofing) | LOW | P1 |
| Rate limiting on validation endpoint | MEDIUM | LOW-MEDIUM | P2 |
| `firstSeenAt` open-rate field | LOW | LOW | P3 |
| Admin web UI | LOW (v2.0) | HIGH | P3 |

---

## Dependencies on Existing Save-the-Date (v1)

| v1 Component | Change Required | Impact |
|--------------|----------------|--------|
| `src/hooks/useGuestName.js` | Replace `?to=` parsing with `?g=` token parsing (decode display name from token) | Low — single file, same return interface |
| `src/pages/SaveTheDatePage` | No change — consumes `useGuestName` hook output unchanged | None |
| `main.jsx` / routing | No change — still single-page BrowserRouter | None |
| `vite.config.js` | May need Vercel adapter config if using Vite-native API routes; more likely separate `/api` folder for Vercel serverless | Low |
| CSS Modules / design system | No change | None |
| Animation layer (Framer Motion) | No change | None |

The v1 `?to=` param used in `useSearchParams` is the only breaking change surface. Everything else is additive.

---

## Sources

- django-wedding-website (open source): unique per-party invite URL pattern (`/invite/<uuid>/`), CSV import, admin dashboard — [github.com/czue/django-wedding-website](https://github.com/czue/django-wedding-website)
- "The Hidden Engineering Behind Holiday Invites" (DEV Community): opaque token architecture, privacy-first design, idempotent writes, rate limiting — [dev.to/sonia_bobrik_1939cdddd79d/...](https://dev.to/sonia_bobrik_1939cdddd79d/the-hidden-engineering-behind-holiday-invites-make-your-rsvp-page-fast-safe-and-not-creepy-3a2o)
- JWT vs Opaque Token tradeoffs: self-contained token advantages/risks — [permit.io/blog/a-guide-to-bearer-tokens-jwt-vs-opaque-tokens](https://www.permit.io/blog/a-guide-to-bearer-tokens-jwt-vs-opaque-tokens)
- Vercel + Upstash KV (Upstash Redis): serverless key-value for guest records — [vercel.com/marketplace/upstash](https://vercel.com/marketplace/upstash)
- Neon Postgres + Vercel integration (free tier, scale-to-zero): relational alternative for guest schema — [neon.com](https://neon.com/)
- HMAC URL signing in Node.js: stateless tamper-proof link verification — [authgear.com/post/generate-verify-hmac-signatures](https://www.authgear.com/post/generate-verify-hmac-signatures/)

---

*Feature research for: v2.0 — Personalized Guest-Link Identity + RSVP Foundation*
*Researched: 2026-05-30*
