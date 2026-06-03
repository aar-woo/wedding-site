# Milestones

## v2.0 Guest Identity & Deploy (Shipped: 2026-06-03)

**Scope:** Phases 6–9 · 7 plans · 14 tasks
**Delivered:** Replaced the open `?to=` param with durable, unguessable per-guest links backed by Neon Postgres identity, added a Vercel serverless foundation for future RSVP, and shipped the site live with mobile polish.

**Key accomplishments:**

- **HMAC-signed guest-token contract** (Phase 6) — Node sign/verify library + browser-safe, secret-free client decode; trust boundary between `scripts/lib/` (secret-bearing) and `src/lib/` (browser), proven by 18 `node:test` assertions.
- **Neon Postgres datastore + link-generation tooling** (Phase 7) — `guests` table keyed on opaque nanoid `id` with reserved nullable RSVP columns; CSV→DB upsert with id preservation and `deleted_at` soft-delete sync; mints HMAC-signed `links.csv`.
- **Serverless `GET /api/guest/:id`** (Phase 8) — Vercel Node function with Neon lookup returning `{id, displayName}` (200/404/405), `vercel.json` api-first rewrite, token-first name resolution in `useGuestName`.
- **Reduced-motion + mobile polish** (Phase 9) — `useReducedMotion` wired through BotanicalSvg, CornerBrackets, and the entrance sequence; responsive one-screen layout at 375px.
- **Shipped live** (Phase 9) — `wedding-site-ten-omega.vercel.app` serving SPA + `/api` + Neon; diagnosed and fixed an accidental Vercel-org / Neon-integration split that had production pointed at the wrong (empty) database.

**Post-milestone follow-up (quick task 260602-nu0):** frontend now fetches the authoritative DB display name by `id`, with the cached token name as instant render and graceful fallback.

**Known gaps (accepted as tech debt at completion):**

- Phase 9 has no formal `VERIFICATION.md` — closed via manual deploy + clean integration check this session (see `milestones/v2.0-MILESTONE-AUDIT.md`).
- Nyquist VALIDATION files for phases 7–9 are `draft` / `nyquist_compliant: false`.
- **Deviation (intentional):** production `DATABASE_URL` set manually and the Neon Vercel integration removed (it was the source of the wrong-DB injection), rather than the plan's "connect integration, don't enter by hand."

**Audit:** `milestones/v2.0-MILESTONE-AUDIT.md` — 10/10 requirements satisfied, integration check clean (0 broken flows).

---
