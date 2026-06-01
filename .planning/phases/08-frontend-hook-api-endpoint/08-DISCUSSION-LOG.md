# Phase 8: Frontend Hook & API Endpoint - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 08-frontend-hook-api-endpoint
**Areas discussed:** Legacy ?to= handling, API endpoint trust model

---

## Gray-area selection

| Area offered | Selected |
|--------------|----------|
| Legacy ?to= handling | ✓ |
| API endpoint trust model | ✓ |
| Removed/unknown guests | (deferred to Claude's discretion) |
| Greeting edge cases | (deferred to Claude's discretion) |

---

## Legacy ?to= handling

### Q1: How should ?to= behave once /i/:id?t= exists?
| Option | Selected |
|--------|----------|
| Keep as dev/preview (token → ?to= → fallback) | ✓ |
| Fully replace (token only) | |
| Keep but deprecate | |

**User's choice:** Keep as dev/preview shortcut.

### Q2: What should root path / show?
| Option | Selected |
|--------|----------|
| Fallback greeting (full page, "Our Beloved Guests") | ✓ |
| Same as today | |

**User's choice:** Fallback greeting (full page).

---

## API endpoint trust model

### Q1: How should GET /api/guest/:id authorize?
| Option | Selected |
|--------|----------|
| id-only lookup (nanoid is the credential; {id,displayName} or 404) | ✓ |
| Require + verify ?t= token server-side | |
| id-only now, verify() helper wired ready | |

**User's choice:** id-only lookup. (Token verification reserved for the future RSVP write path.)

### Q2: Where does the returned displayName come from?
| Option | Selected |
|--------|----------|
| DB display_name (source of truth) | ✓ |
| Echo nothing extra / never trust token name | (same effect) |

**User's choice:** DB display_name — endpoint never reads the token name.

---

## Claude's Discretion (deferred areas — defaults recorded in CONTEXT.md)

- **Removed/unknown guests:** lookup filters `WHERE deleted_at IS NULL`; soft-deleted OR unknown id → 404 `{error:"not found"}` (no existence leak; 410 considered, rejected). Already-sent links still greet client-side via token.
- **Greeting edge cases:** missing/malformed/tampered token → "Our Beloved Guests"; document.title set only when a real name resolves; token-id ≠ path-id still greets from token (client decode-only).
- **Implementation shape:** extend useGuestName in place (token → ?to= → fallback); add /i/:id + / Routes in App.jsx; vercel.json /api passthrough before SPA catch-all; api/guest/[id].js uses @neondatabase/serverless, process.env only, logs id not name.

## Deferred Ideas

- Token HMAC verify on the GET read path — rejected (reserved for RSVP write path).
- Rate limiting on /api/guest/:id — deferred to RSVP milestone.
- 410 Gone for soft-deleted — chose 404.
- Removing ?to= entirely — kept as dev/preview; future cleanup.
- Mobile polish + Vercel deploy — Phase 9.
