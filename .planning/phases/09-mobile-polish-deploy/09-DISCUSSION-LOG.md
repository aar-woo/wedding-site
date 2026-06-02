# Phase 9: Mobile Polish & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 09-mobile-polish-deploy
**Areas discussed:** Mobile polish scope, Animation / jank on mobile

---

## Mobile polish scope

### Q: How ambitious should the mobile work be?
| Option | Description | Selected |
|--------|-------------|----------|
| Verify & fix only | Treat existing mobile-first CSS as intended; audit at 375px, fix only overflow/clip/illegibility | ✓ |
| Targeted refinement | Fix breakage AND deliberately tune small-screen spacing/sizes | |
| Rework mobile layout | Rethink the mobile composition (near-redesign) | |

### Q: One screen or gentle scroll on mobile?
| Option | Description | Selected |
|--------|-------------|----------|
| One screen, no scroll | Everything visible at once on open; tighten to fit 100svh | ✓ |
| Allow gentle scroll | Permit small vertical scroll on very small/short screens | |

### Q: Smallest committed width?
| Option | Description | Selected |
|--------|-------------|----------|
| 375px floor | Matches criterion; iPhone SE2/3, 12–14, most phones | ✓ |
| 320px floor | Also very small / older phones | |

### Q: Landscape handling?
| Option | Description | Selected |
|--------|-------------|----------|
| Portrait-first, best-effort landscape | Optimize portrait; landscape must not break | ✓ |
| Explicitly handle landscape | Dedicated landscape tuning | |

**Notes:** Layout risk surfaced — `.topGroup` (top-anchored) + `.contentBlock` (bottom-anchored) + `.botanicalPair` (bottom:180px) can collide on short viewports; fitting on one screen is the core fix.

---

## Animation / jank on mobile

### Q: Strategy for animation on mobile?
| Option | Description | Selected |
|--------|-------------|----------|
| Full sequence, fix if janky | Ship full reveal; optimize only on measured frame drop | ✓ |
| Proactively lighten on mobile | Pre-emptively reduce mobile motion regardless of perf | |

### Q: How to judge "no jank"?
| Option | Description | Selected |
|--------|-------------|----------|
| Real device | Eyeball on an actual mid-range phone | |
| DevTools throttle | Device emulation + 4–6× CPU throttle, perf panel | ✓ |
| Both | Throttle in dev, confirm on real phone post-deploy | |

### Q: How far should prefers-reduced-motion go?
| Option | Description | Selected |
|--------|-------------|----------|
| Whole sequence | Snap content in; skip bracket/botanical draws + fadeUps, not just Ken Burns | ✓ |
| Keep as-is | Only Ken Burns stilled | |

### Q: Escape hatch if an effect is the jank culprit?
| Option | Description | Selected |
|--------|-------------|----------|
| Optimize in place | Keep effect, fix cause (transform/opacity, will-change, repaint area) | ✓ |
| Simplify on mobile | Permit lighter mobile variant of the effect | |

**Notes:** Real-device confirmation accepted as a post-deploy nice-to-have, not the gating method.

---

## Claude's Discretion

User did not select these areas; defaults documented in CONTEXT.md (D-09 through D-13) for confirmation at plan time:
- **Vercel deploy specifics** — auto `*.vercel.app` domain, Git-connected auto-deploy from `main`, user-provisioned server-only env vars (`DATABASE_URL` via Neon integration, `GUEST_TOKEN_SECRET`, `SITE_BASE_URL`).
- **Production verification** — verify with one real `links.csv` row: cold `/i/:id` → SPA (not 404), greeting renders, `GET /api/guest/:id` → 200.

Non-negotiable carry-forwards flagged even though the area was skipped: link regeneration against the live domain (D-12), and the cold deep-link check deferred from Phase 8 (D-13).

## Deferred Ideas

- Custom domain (default vercel.app)
- 320px support (375px is the floor)
- Dedicated landscape tuning
- Proactive mobile motion reduction (rejected — full sequence ships)
- Real-device perf lab / analytics / rate limiting / observability
