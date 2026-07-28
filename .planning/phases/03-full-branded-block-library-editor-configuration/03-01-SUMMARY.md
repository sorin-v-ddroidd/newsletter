---
phase: 03-full-branded-block-library-editor-configuration
plan: 01
subsystem: editor
tags: [grapesjs, mjml, block-locking, verify-gate, data-gjs]

requires:
  - phase: 01-feasibility-spike-editor-core
    provides: branded block library (editor/blocks/*), verify:blocks headless gate, grapesjs-mjml runtime
provides:
  - Working verify:blocks headless compile gate (stale import paths fixed)
  - Gate-side data-gjs-* sanitizer so instance-locking attrs never fail the raw compile
  - BLOCK-03 instance-level locking pattern proven on the hero block
affects: [03-02, 03-04, block-locking]

tech-stack:
  added: []
  patterns:
    - "Instance-level locking via data-gjs-* attrs in block content strings (never addType — avoids type-level leak to generic blocks)"
    - "verify:blocks strips data-gjs-* before raw mjml2html() (mirrors GrapesJS drop-time strip)"

key-files:
  created: []
  modified:
    - app/server/scripts/verify-blocks.ts
    - app/client/src/editor/blocks/hero.ts

key-decisions:
  - "Open Question 1 answered: raw mjml@4.18 validationLevel:'soft' RECORDS data-gjs-* as errors ('illegal attributes'). Decision Branch B fired — teach the gate to strip, do NOT change the locking mechanism."
  - "Uniform locking rule: outer mj-section → data-gjs-draggable/removable=false; every mj-column → data-gjs-droppable='[\"mj-text\",\"mj-image\"]' (array allowlist keeps existing children reorderable); leaf text/image → no attrs."

patterns-established:
  - "Locking attrs go on block content strings, not component types (RESEARCH Pitfall 1)."
  - "The headless gate sanitizes production-invisible attrs so it tests only production-reachable input."

requirements-completed: [BLOCK-03]

duration: ~15min
completed: 2026-07-13
---

# Phase 3 / Plan 01: verify:blocks gate fix + hero locking spike

**Fixed the stale-path verify:blocks gate, proved raw mjml@4.18 rejects `data-gjs-*` as illegal, and resolved it gate-side; hero now carries the BLOCK-03 instance-locking pattern (8/8 targets PASS, tsc clean).**

## Performance
- **Duration:** ~15 min
- **Completed:** 2026-07-13T08:49Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- `verify-blocks.ts` imports repointed from the stale `../../client/src/blocks/*` to the current `../../client/src/editor/blocks/*` (260705-h8h moved them). Comment updated. Pre-hero run: all 8 targets PASS.
- Added `data-gjs-draggable="false" data-gjs-removable="false"` to both hero `<mj-section>` tags and `data-gjs-droppable='["mj-text","mj-image"]'` to both `<mj-column>` tags. No tag converted to self-closing.
- **Empirical tolerance answer (RESEARCH Open Q1):** raw compile emits `data-gjs-*` as `errors` → hero + template FAILed. Fixed by adding `stripGjsAttrs()` to the gate (regex removes `data-gjs-*='...'|"..."`), applied to every target before `mjml2html()`. Rerun: 8/8 PASS.

## Files Created/Modified
- `app/server/scripts/verify-blocks.ts` — corrected block import paths; added `stripGjsAttrs()` sanitizer applied to all targets.
- `app/client/src/editor/blocks/hero.ts` — instance-level locking attrs on 2 sections + 2 columns.

## Decisions Made
- Followed the plan's Decision Gate **Branch B** (gate strips attrs) — the observed errors were exactly the predicted case. Did NOT switch to a component-type/addType lock (would globally lock generic mj-section/mj-column — Pitfall 1).

## Deviations from Plan
None — plan executed as written; the decision gate resolved to the documented Branch B.

## Issues Encountered
- `Full Template (TEMPLATE_MJML)` also FAILed initially because it embeds hero's markup inline; the gate-level `stripGjsAttrs` fixed both block and template targets together.

## Verification
- `cd app/server && npm run verify:blocks` → all 8 targets PASS (0 errors).
- `cd app/client && npx tsc --noEmit` → clean.
- No `client/src/blocks/` path remains in verify-blocks.ts.

## Post-verify Correction (2026-07-13)

Hero's `data-gjs-draggable="false"` was later removed from the content string — it blocked the panel drop (GrapesJS sorter rejects a non-draggable dragged model). Section draggability now locks post-drop via a `component:add` listener in `editorConfig.ts`, keyed on `removable===false`. hero keeps `data-gjs-removable="false"` + column `data-gjs-droppable`. The `data-gjs-*` tolerance finding and gate sanitizer are unaffected (the gate still strips all `data-gjs-*`). Full detail in 03-02-SUMMARY "Post-verify Correction".

## Commits
None — `.claude/rules/no-commit.md` (GSD-without-commits chosen for this phase). Changes are uncommitted in the working tree; suggested commit message emitted at phase end.

## Next Phase Readiness
- Locking pattern + tolerance question resolved → **Plan 02 unblocked** (apply same pattern to remaining 6 blocks; gate already handles their attrs).

---
*Phase: 03-full-branded-block-library-editor-configuration*
*Completed: 2026-07-13*
