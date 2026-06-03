# Roadmap: Wedding Save-the-Date — Aaron & Rina

## Milestones

- ✅ **v1.0 MVP** — Phases 1–4 (animated, guest-personalized save-the-date SPA)
- ✅ **v2.0 Guest Identity & Deploy** — Phases 6–9 (durable signed per-guest links, Neon datastore, serverless API, shipped live) — SHIPPED 2026-06-03 · see [`milestones/v2.0-ROADMAP.md`](./milestones/v2.0-ROADMAP.md)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–4) — shipped</summary>

- [x] **Phase 1: Foundation** — design system, fonts, router (2026-05-29)
- [x] **Phase 2: Static Page** — hero photo + all wedding content
- [x] **Phase 3: Personalization & Countdown** — `?to=` guest name + live countdown
- [x] **Phase 4: Visuals & Animation** — botanical SVG, brackets, Ken Burns, entrance sequence
- ~~**Phase 5: Polish & Deploy**~~ — superseded by v2.0 (EXP-01/EXP-02/DEPLOY-01 carried into Phases 8–9)

</details>

<details>
<summary>✅ v2.0 Guest Identity & Deploy (Phases 6–9) — SHIPPED 2026-06-03</summary>

- [x] **Phase 6: Identity Token Contract** — URL shape + signed token format + sign/verify lib locked (2026-05-31)
- [x] **Phase 7: Datastore Schema & Link-Generation Tooling** — Neon provisioned, schema migrated, link minting (2026-05-31)
- [x] **Phase 8: Frontend Hook & API Endpoint** — signed-token hook + serverless `GET /api/guest/:id` (2026-06-01)
- [x] **Phase 9: Mobile Polish & Deploy** — responsive layout + live Vercel deploy with durable links (2026-06-03)

Full details: [`milestones/v2.0-ROADMAP.md`](./milestones/v2.0-ROADMAP.md) · Audit: [`milestones/v2.0-MILESTONE-AUDIT.md`](./milestones/v2.0-MILESTONE-AUDIT.md)

</details>

### 📋 Next Milestone (planned)

Run `/gsd:new-milestone` to define the next milestone (likely the RSVP flow — RSVP-01/RSVP-02 — building on the v2.0 identity foundation).

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-05-29 |
| 2. Static Page | v1.0 | 1/1 | Complete | — |
| 3. Personalization & Countdown | v1.0 | 2/2 | Complete | — |
| 4. Visuals & Animation | v1.0 | 3/3 | Complete | — |
| ~~5. Polish & Deploy~~ | — | — | Superseded | — |
| 6. Identity Token Contract | v2.0 | 1/1 | Complete | 2026-05-31 |
| 7. Datastore Schema & Link-Generation | v2.0 | 3/3 | Complete | 2026-05-31 |
| 8. Frontend Hook & API Endpoint | v2.0 | 2/2 | Complete | 2026-06-01 |
| 9. Mobile Polish & Deploy | v2.0 | 3/3 | Complete | 2026-06-03 |

## Backlog

### Phase 999.1: Olive-branch redraw interval (7s) (BACKLOG)

**Goal:** Periodically re-trigger the olive-branch `BotanicalSvg` draw-in animation on a 7-second interval (loop the `pathLength` draw so the branches redraw every 7s) rather than animating only once on page load. Must stay within the `prefers-reduced-motion` guard (no looping redraw when reduced motion is requested).
**Requirements:** TBD
**Plans:** 0/3 plans executed

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
