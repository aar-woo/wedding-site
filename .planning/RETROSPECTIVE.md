# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Guest Identity & Deploy

**Shipped:** 2026-06-03
**Phases:** 4 (6–9) | **Plans:** 7 | **Sessions:** multiple

### What Was Built
- HMAC-signed guest-token contract (Node sign/verify + browser-safe secret-free decode) with a strict `scripts/lib/` (secret-bearing) vs `src/lib/` (browser) trust boundary.
- Neon Postgres `guests` table keyed on opaque nanoid `id` with reserved nullable RSVP columns, plus `generate-links.js` CSV→DB upsert (id preservation, `deleted_at` soft-delete sync) minting signed `links.csv`.
- Vercel Node serverless `GET /api/guest/:id` (Neon lookup, 200/404/405) + `vercel.json` api-first rewrite + token-first `useGuestName`.
- Reduced-motion + 375px mobile polish across the entrance sequence.
- Live Vercel deploy; post-milestone, the frontend now fetches the authoritative DB name by `id` with graceful fallback.

### What Worked
- **Locking the URL/token contract in Phase 6 before any wiring** paid off — downstream phases (7/8) had an unambiguous interface, and the `id` threaded unbroken from mint → DB → URL → token → decode → API → lookup (integration check found 0 broken flows).
- **Failure-mode triage** during the deploy bug was decisive: distinguishing `500` (no/invalid DB connection) from `404` (connected but wrong/empty DB) pinpointed the accidental Vercel-org / Neon-integration split fast.
- **TDD on the pure helper** (`fetchGuestDisplayName`, 10 `node:test` cases) made the async hook rewire low-risk; the "never throws, returns null on every failure" contract kept the guest experience unbreakable.

### What Was Inefficient
- **The Neon Vercel integration auto-injected a `DATABASE_URL` pointing at the wrong/empty DB**, causing production 500s and a multi-commit debug detour (`6632920`, `e7d96f7`, revert). Root cause was an accidentally-created second Vercel org during integration setup. Lesson learned the hard way: dashboard integrations can silently override env vars on every deploy.
- **Phase 9 was completed manually (out-of-band) rather than through the executor**, so it never got a formal `VERIFICATION.md`; the audit had to lean on manual + integration evidence. Faster in the moment, but left a paperwork gap.
- **SUMMARY.md `requirements-completed` frontmatter was left empty** for several P6/P7/P8 plans, so the milestone-complete CLI extraction produced "One-liner:" noise that needed manual cleanup.

### Patterns Established
- **Diagnose serverless+DB by failure code:** `500` on a known-good id = env/connection broken; `404` on a known-good id = connected to the wrong/empty DB. Encode this in future deploy verification.
- **Pure-helper + thin-hook split** for async data: isolate network/failure logic in a never-throwing pure function (unit-testable), keep React state/abort-safety in the hook.
- **Manual env var over dashboard integration** when an integration proves unreliable — but document it as a deviation since it diverges from the plan.

### Key Lessons
1. **Lock contracts before code when multiple phases share an interface** — the Phase 6 token/URL lock is why 7/8/9 integrated cleanly.
2. **Treat third-party dashboard integrations as mutable on every deploy** — verify the env var they manage post-deploy, and prefer an explicit manual value when correctness matters.
3. **Don't skip the verifier even when shipping manually** — the functional work was sound, but the missing `VERIFICATION.md` cost audit confidence. Run `/gsd:verify-work` even on hand-finished phases.

### Cost Observations
- Model mix: planning on opus, execution on sonnet (balanced profile).
- Notable: ~61 commits across the v2.0 range; the single biggest time sink was the deploy/env-var bug, not feature code.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v2.0 | multiple | 4 (6–9) | First milestone with a backend (Neon) + serverless deploy; introduced contract-first locking and failure-mode deploy triage |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v2.0 | node:test (28+ assertions: token 18, fetch helper 10) | n/a | HMAC via node:crypto, env via `--env-file` (no dotenv) |

### Top Lessons (Verified Across Milestones)

1. Contract-first locking prevents cross-phase integration debt. _(v2.0)_
2. External infra (dashboard integrations, env injection) needs post-deploy verification, not trust. _(v2.0)_
