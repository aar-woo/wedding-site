---
phase: 4
slug: visuals-animation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **visual animation phase**: no test framework is installed and the
> requirements (pathLength draw-in, stagger feel, Ken Burns) are intrinsically
> visual. Automated validation is limited to a build smoke test plus
> grep-based code-review assertions; aesthetic correctness is verified by a
> manual browser review (see Manual-Only Verifications).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed (no vitest/jest/testing-library) — not added this phase |
| **Config file** | none |
| **Quick run command** | `npm run build` (Vite compile smoke — confirms no errors) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** `npm run build` must succeed AND manual browser review must confirm all 8 requirements
- **Max feedback latency:** ~10 seconds (build); manual review at phase end

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (assigned by planner) | 01 | 1 | DECO-02, DECO-03 | code-review + build | `npm run build` && `grep -n 'var(--gold)' src/components/BotanicalSvg.jsx` | ❌ W0 (no unit tests; build only) | ⬜ pending |
| (assigned by planner) | 01 | 1 | DECO-02 | code-review | `grep -n 'strokeDasharray="0 1"' src/components/BotanicalSvg.jsx` | ❌ W0 | ⬜ pending |
| (assigned by planner) | 02 | 1 | DECO-01 | code-review + build | `npm run build` && `grep -n 'pathLength' src/components/CornerBrackets.jsx` | ❌ W0 | ⬜ pending |
| (assigned by planner) | 03 | 2 | HERO-02 | code-review | `grep -n 'scale(1.08)\|1.08' src/pages/SaveTheDatePage.module.css` | ❌ W0 | ⬜ pending |
| (assigned by planner) | 03 | 2 | ANIM-01 | code-review | `! grep -nE 'delay:\s*[0-9]' src/pages/SaveTheDatePage.jsx` (no per-element delays) | ❌ W0 | ⬜ pending |
| (assigned by planner) | 03 | 2 | ANIM-02 | code-review + manual | reveal order matches spec (visual) | ❌ W0 | ⬜ pending |
| (assigned by planner) | 03 | 2 | ANIM-03 | code-review | `grep -n '0.22, 0.61, 0.36, 1' src/pages/SaveTheDatePage.jsx` | ❌ W0 | ⬜ pending |
| (assigned by planner) | 03 | 2 | ANIM-04 | code-review | `grep -n '0.96' src/pages/SaveTheDatePage.jsx` (names scale) and `scaleX` on divider | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Note: the planner owns final task IDs/plan numbers; this map fixes the requirement→assertion mapping so no requirement lacks an automated or explicit-manual check.*

---

## Wave 0 Requirements

*No test framework is installed and none is added this phase (visual-only requirements; adding vitest+RTL would not meaningfully validate animation aesthetics and is out of scope per CONTEXT — performance/tooling is Phase 5).*

Existing infrastructure (Vite build) is the only automated gate. Every requirement additionally maps to a grep-based code-review assertion (above) and/or a manual browser verification (below).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Corner brackets visibly draw in via pathLength at step 2 | DECO-01 | Animation aesthetics not automatable | `npm run dev`, load page, watch brackets draw on arrival |
| Botanical strokes draw progressively, branches stagger (not all at once) | DECO-02 | Stroke-draw timing is visual | Load page; confirm leaves/stem draw in sequence, gold strokes, dots only fills |
| Ken Burns zoom scale 1→1.08 over 20s, alternating | HERO-02 | Smooth zoom feel + loop timing | Load page; watch hero ~40s; confirm slow zoom in then out, no jump |
| 10-step reveal order with no out-of-order jumps | ANIM-02 | Sequence ordering is visual | Load page; confirm bg→brackets→botanical→greeting→label→names→divider→date→location→footer |
| Each element animates over ≥0.8s, unhurried | ANIM-03 | Pacing is subjective/visual | Load page; confirm no element snaps in faster than ~0.8s |
| Couple names scale 0.96→1; divider scales from center | ANIM-04 | Subtle transform is visual | Load page; confirm names settle with slight grow; divider expands from middle outward |
| `prefers-reduced-motion` disables entrance/transform motion | (D-08 discretion) | OS setting + visual | Enable Reduce Motion in OS; reload; confirm content appears without transform animation (opacity ok), Ken Burns stilled |

---

## Validation Sign-Off

- [ ] All tasks have an automated assertion (build/grep) or an explicit Manual-Only entry
- [ ] Sampling continuity: `npm run build` runs after every task commit (no 3 consecutive tasks without automated verify)
- [ ] Wave 0 covers all MISSING references — N/A (no test framework added; build is the gate)
- [ ] No watch-mode flags (build is one-shot)
- [ ] Feedback latency < 10s (build)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
