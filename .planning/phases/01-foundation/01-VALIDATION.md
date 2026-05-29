---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (none installed yet — Wave 0 installs if tests are needed) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` (fast structural check until a test runner exists) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must succeed and dev server must render the page
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (to be filled by planner) | 01 | 1 | FND-01/02/03 | build/grep | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework required for Phase 1 — foundation is verified via `npm run build` success + grep on source files. Planner may add vitest only if a unit-testable seam emerges.

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cormorant Garamond + Jost actually render (no system-font flash) | FND-02 | Font rendering is visual; not assertable without a browser | Run `npm run dev`, open page, confirm display/body fonts match the spec and no Roboto/system fallback is shown |
| Palette CSS variables inherit site-wide | FND-03 | Visual/computed-style check | In devtools, inspect `:root`/`body` computed styles for `--forest`, `--gold`, `--gold-light`, `--cream`, `--muted` |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
