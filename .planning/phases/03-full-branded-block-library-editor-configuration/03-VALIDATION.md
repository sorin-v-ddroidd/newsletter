---
phase: 3
slug: full-branded-block-library-editor-configuration
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (client) + node tsx verify scripts (server) |
| **Config file** | app/client (vitest); app/server/scripts/verify-blocks.ts, verify-compile.ts, verify-parity.ts |
| **Quick run command** | `cd app/client && npx tsc --noEmit` |
| **Full suite command** | `cd app/server && npm run verify:blocks && npm run verify:compile && npm run verify:parity` |
| **Estimated runtime** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** `cd app/client && npx tsc --noEmit`
- **After every plan wave:** full verify suite (blocks + compile + parity)
- **Before `/gsd:verify-work`:** full suite green + in-editor manual check
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

> Domain gotcha: for BLOCK-03 locking, EDIT-08 pickers, and the width clamp UX, headless MJML
> compile does NOT observe in-editor DOM-parse / locking / picker behavior — those need in-editor
> manual verification (checkpoint:human-verify). The headless gates cover compile validity and the
> width→compile persistence path only.

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 01-1 | 03-01 | 0 | BLOCK-03 | verify:blocks import paths resolve; gate runs | smoke | `cd app/server && npm run verify:blocks` | ✅ (fixed this task) | ⬜ pending |
| 01-2 | 03-01 | 0 | BLOCK-03 | hero locking attrs compile clean; data-gjs-* tolerance known | smoke | `cd app/server && npm run verify:blocks` + `cd app/client && npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-1 | 03-02 | 1 | BLOCK-03 | 6 remaining blocks locked; still compile | smoke | `cd app/server && npm run verify:blocks && cd ../client && npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-2 | 03-02 | 1 | BLOCK-03 | structure locked, text/image editable, no generic regression | manual-only | none — checkpoint:human-verify | N/A | ⬜ pending |
| 03-1 | 03-03 | 1 | EDIT-07 | mj-raw removed from Block Manager | smoke | `cd app/client && grep -q "Blocks.remove('mj-raw')" src/editor/editorConfig.ts && npx tsc --noEmit` | ✅ | ⬜ pending |
| 03-2 | 03-03 | 1 | EDIT-08 | free-form color input removed; brand-only swatches + font | smoke | `cd app/client && npx tsc --noEmit && ! grep -q 'type="color"' src/editor/panelControls.tsx && grep -q BLOCK_DEFAULTS src/editor/panelControls.tsx` | ✅ | ⬜ pending |
| 03-3 | 03-03 | 1 | EDIT-07/08 | no raw surface; brand-only pickers (visual) | manual-only | none — checkpoint:human-verify | N/A | ⬜ pending |
| 04-1 | 03-04 | 2 | WIDTH-01 | mj-body width scoped + clamped helpers | smoke | `cd app/client && npx tsc --noEmit && grep -q "'mj-body'" src/editor/editorConfig.ts && grep -q setMessageWidth src/editor/actions.ts` | ✅ | ⬜ pending |
| 04-2 | 03-04 | 2 | WIDTH-01 | single clamped WidthRangeField wired to TopBar + RightPanel | smoke | `cd app/client && npx tsc --noEmit && grep -q WidthRangeField src/editor/panelControls.tsx src/editor/TopBar.tsx` | ✅ | ⬜ pending |
| 04-3 | 03-04 | 2 | WIDTH-01 | non-default mj-body width reaches compiled HTML | smoke | `cd app/server && npm run verify:compile` | ✅ (fixture added this task) | ⬜ pending |
| 04-4 | 03-04 | 2 | WIDTH-01 | clamp 320–900, persistence, compiled width (visual) | manual-only | none — checkpoint:human-verify | N/A | ⬜ pending |
| 05-1 | 03-05 | 1 | BLOCK-01/02, EDIT-06 | shipped state verified; tracker reconciled | smoke | `grep -c "ddroidd-" app/client/src/editor/blocks/registerBlocks.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Fix stale import paths in `app/server/scripts/verify-blocks.ts` (`../../client/src/blocks/*` → `.../editor/blocks/*`) so BLOCK-03 changes can be gated (research pitfall). → Plan 03-01 Task 1.
- [ ] Empirically confirm mjml@4.18 soft-validation compile tolerates unrecognized `data-gjs-*` attributes without error (research Open Question 1) before relying on instance-level locking attrs in block content. → Plan 03-01 Task 2. Fork (advisor-corrected): if the raw gate errors, teach the gate to strip `data-gjs-*` before compile — do NOT swap the locking mechanism.
- [ ] No fixture exercises a non-default `mj-body` width — added by Plan 03-04 Task 3 (verify:compile assertion) so the persistence→compile path is covered.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Plan/Task |
|----------|-------------|------------|-------------------|-----------|
| Branded block structure locked; only text/image regions editable/movable/removable | BLOCK-03 | GrapesJS locking flags only observable in a running editor | Select a branded block, attempt delete/move the section (blocked), edit/move a text/image region (allowed), drag a Button into a locked column (rejected), confirm generic 1-Column still fully editable | 03-02 Task 2 |
| Constrained pickers offer only brand palette/fonts | EDIT-08 | UI behavior of custom RightPanel swatch/dropdown | Open inspector; color control shows only 3 brand swatches (no OS picker/hex box); font control shows only Brand font | 03-03 Task 3 |
| No raw-HTML/mj-raw/code/import surface reachable | EDIT-07 | UI reachability | Search Blocks for "raw"; scan TopBar/RightPanel for code/export/import | 03-03 Task 3 |
| Global width control clamps 320–900 and reaches compiled mj-body width | WIDTH-01 | Compiled output + UI clamp | Set width, clamp out-of-range, save/load, export, confirm compiled mj-body width; RightPanel uses same clamped control | 03-04 Task 4 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a Wave 0 / manual-only dependency (checkpoints are the noted manual-only exceptions)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned 2026-07-13
