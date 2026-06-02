---
phase: 9
slug: mobile-polish-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

This phase is **predominantly visual/manual and post-deploy smoke verification** — pixel layout (EXP-01) and animation smoothness (EXP-02) cannot be asserted by an automated test, and DEPLOY-01 is exercised with `curl` smoke checks after the live domain exists. The one automated, repeatable guard is the static secret-leak audit (`grep` for `VITE_` on secrets).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node's built-in `node:test` (already used in phases 6–7) — pre-existing, not extended this phase |
| **Config file** | None — scripts run directly with `node --test` |
| **Quick run command** | `grep -rn "VITE_" .env* src/ \| grep -iE "secret\|token\|database" \|\| echo "OK: no secrets VITE-prefixed"` |
| **Full suite command** | `node --test src/lib/decodeGuestToken.test.js && node --test scripts/lib/token.test.js && node --test scripts/generate-links.test.js` |
| **Estimated runtime** | ~3 seconds (existing suite); secret audit <1s |

---

## Sampling Rate

- **After every task commit:** Run secret-leak audit (`grep -rn "VITE_" .env* src/` → no secrets) when the task touches env/config/deploy
- **After every plan wave:** Manual DevTools check at 375×667 (legibility, one screen, no overflow); reduced-motion visual check
- **Before `/gsd:verify-work`:** Existing `node:test` suite green; all three D-13 post-deploy checks pass
- **Max feedback latency:** ~5 seconds for automated checks; manual checks per wave

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (assigned by planner) | 01 | 1 | EXP-01 | manual/visual | DevTools 375×667 emulation — all content on one screen, no overflow | N/A (visual) | ⬜ pending |
| (assigned by planner) | 01 | 1 | EXP-01 | math/visual | `calc(4*44 + 3*20) = 236px < 375px` — countdown row fits | N/A (visual) | ⬜ pending |
| (assigned by planner) | 01 | 1 | EXP-02 | manual/perf | DevTools Performance, 4–6× CPU throttle during botanical draw-in + countdown ticks — no dropped frames | N/A (manual) | ⬜ pending |
| (assigned by planner) | 01 | 1 | EXP-02 | manual/functional | OS Reduce Motion ON → reload → botanicals fully visible (pathLength=1), content snaps in (no y/scale/draw) | N/A (visual) | ⬜ pending |
| (assigned by planner) | 02 | 2 | DEPLOY-01 | static audit | `grep -rn "VITE_" .env* src/` → zero secrets VITE-prefixed | Existing files | ⬜ pending |
| (assigned by planner) | 02 | 2 | DEPLOY-01 | smoke (curl) | `curl -s -o /dev/null -w "%{http_code}" $DOMAIN/i/$ID` → 200 (cold deep-link serves SPA, not 404) | N/A (post-deploy) | ⬜ pending |
| (assigned by planner) | 02 | 2 | DEPLOY-01 | smoke (curl) | `curl -s $DOMAIN/api/guest/$ID` → 200 + guest JSON | N/A (post-deploy) | ⬜ pending |
| (assigned by planner) | 02 | 2 | DEPLOY-01 | manual/visual | Open real `links.csv` link in browser → "For [Name]" greeting renders from `?t=` token | N/A (visual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are placeholders — the planner assigns final IDs (`9-NN-NN`) and may split rows across plans/waves.*

---

## Wave 0 Requirements

*Existing infrastructure covers all automated phase requirements.* No new test scaffolding is needed — EXP-01/EXP-02 verification is visual/manual via Chrome DevTools, and DEPLOY-01 is post-deploy `curl` smoke + browser visual. The pre-existing `node:test` token suite remains the regression guard for the identity contract.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All keepsake content fits one 375px screen, legible, no overflow/clip | EXP-01 | Pixel layout cannot be asserted by test | Chrome DevTools → device toolbar → 375×667 (iPhone SE) → confirm Save-the-Date label, couple names, divider, date, location, countdown, footer, botanicals all visible without horizontal/vertical scroll |
| No animation jank on botanical draw-in + countdown tick | EXP-02 | Frame timing is perceptual | DevTools Performance panel, 4–6× CPU throttle, record page load + one countdown tick → no sustained dropped frames |
| Reduced-motion: botanicals fully drawn, content snaps in | EXP-02 | Visual functional behavior | OS System Settings → Reduce Motion ON → reload → botanical/bracket paths visible (pathLength=1), fadeUps/scale/scaleX skipped (content appears immediately) |
| Personalized greeting renders in production from real link | DEPLOY-01 | End-to-end visual on live site | Open one real `links.csv` row URL in a browser on the live `*.vercel.app` domain → "For [Name]" shows the correct guest |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify OR a documented manual/smoke procedure
- [ ] Sampling continuity: secret-leak audit runs on every env/config/deploy task
- [ ] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s for automated checks
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
