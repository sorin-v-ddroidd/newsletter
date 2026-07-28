---
phase: 03-full-branded-block-library-editor-configuration
plan: 03
subsystem: editor
tags: [grapesjs, mjml, guardrails, edit-07, edit-08, brand-palette]

requires:
  - phase: 01-feasibility-spike-editor-core
    provides: custom editor shell (editorConfig onEditor, panelControls, RightPanel), EDIT-06 allowlist
provides:
  - mj-raw block removed from the Block Manager (no raw-HTML escape hatch)
  - Constrained brand-swatch color control (replaces free-form OS picker + hex input)
  - Constrained single-option brand font-family control
affects: [editor-guardrails]

tech-stack:
  added: []
  patterns:
    - "Constrained pickers source values from BLOCK_DEFAULTS (single source of truth) — swatch buttons + single-option select, no free-form input"

key-files:
  created: []
  modified:
    - app/client/src/editor/editorConfig.ts
    - app/client/src/editor/panelControls.tsx

key-decisions:
  - "font-family constrained via a single-option select ({BLOCK_DEFAULTS.fontFamily, 'Brand font'}); EMAIL_SAFE_STYLE_PROPS still yields 'font-family' because it reads prop.property ?? prop.id."
  - "SwatchRow kept its exported name + (prop: Property) signature so all 4 RightPanel call sites (background/container-background/color/border-color) keep working with no changes."

patterns-established:
  - "Removing a block from the Block Manager (onEditor) drops it from the custom LeftSidebar automatically (reads blocks live) — no LeftSidebar filter."

requirements-completed: [EDIT-07, EDIT-08]

duration: ~15min
completed: 2026-07-13
---

# Phase 3 / Plan 03: remove raw-HTML hatch + constrain color/font pickers

**mj-raw block removed (EDIT-07); color control is now three brand swatches and font-family a single brand option (EDIT-08). tsc clean; in-editor human-verify PENDING.**

## Performance
- **Duration:** ~15 min
- **Completed:** 2026-07-13T09:00Z
- **Tasks:** 2/2 auto (Task 3 human-verify deferred to consolidated session)
- **Files modified:** 2

## Accomplishments
- **EDIT-07:** guarded `editor.Blocks.remove('mj-raw')` added in `onEditor` next to the devices-c removal (idempotent under StrictMode). LeftSidebar reads blocks live → it drops from the custom panel with no filter. `resetBlocks:false` unchanged (generic blocks preserved). RESEARCH confirmed no other code/view-source/MJML-import surface exists.
- **EDIT-08 color:** `SwatchRow` rewritten to render one clickable swatch per BLOCK_DEFAULTS color (Background `#0B1624`, Accent `#F45E43`, Text `#ffffff`), writing via `prop.upValue` and highlighting the active swatch (case-insensitive). Native `type="color"` input and free-text hex `Input` removed. `BLOCK_DEFAULTS` imported (single source of truth). Export name/signature preserved → all 4 RightPanel call sites intact.
- **EDIT-08 font:** the bare `'font-family'` string in the typography sector replaced with an explicit `type:'select'` property, default `BLOCK_DEFAULTS.fontFamily`, single option labeled "Brand font". Renders via the existing SelectField.

## Files Created/Modified
- `app/client/src/editor/editorConfig.ts` — mj-raw removal in onEditor; constrained font-family select in the typography sector.
- `app/client/src/editor/panelControls.tsx` — `SwatchRow` → constrained brand-swatch control; added `BRAND_SWATCHES` from BLOCK_DEFAULTS; removed the now-unused `HEX_COLOR` regex.

## Decisions Made
- Kept `SwatchRow` name + `(prop: Property)` signature (per plan's "keep the export name" option) to avoid touching RightPanel call sites.
- One unavoidable inline style: swatch `backgroundColor` is a runtime brand hex (cannot be a static Tailwind class); layout stays in utilities. Noted inline.

## Deviations from Plan
None — both tasks executed as written.

## Issues Encountered
None.

## Verification
- `grep "Blocks.remove('mj-raw')" editorConfig.ts` → 1. `resetBlocks:false` unchanged; LeftSidebar.tsx untouched.
- `grep 'type="color"' panelControls.tsx` → 0. `BLOCK_DEFAULTS` present.
- `cd app/client && npx tsc --noEmit` → clean.
- EMAIL_SAFE_STYLE_PROPS still contributes `'font-family'` (object carries `property: 'font-family'`; derivation reads `prop.property ?? prop.id`).
- **PENDING (human-verify, blocking):** at localhost:5173 — no "raw"/code/import surface; generic + branded blocks still drop; color control shows only the 3 brand swatches (click changes element color); font control offers only "Brand font"; no console errors. Consolidated into the phase-end checkpoint.

## Commits
None — `.claude/rules/no-commit.md` (GSD-without-commits). Uncommitted; suggested message at phase end.

## Next Phase Readiness
- editorConfig.ts + panelControls.tsx guardrails complete → Plan 04 (global width) builds on the same two files.

---
*Phase: 03-full-branded-block-library-editor-configuration*
*Completed: 2026-07-13*
