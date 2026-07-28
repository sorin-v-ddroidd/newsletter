---
phase: 03-full-branded-block-library-editor-configuration
plan: 02
subsystem: editor
tags: [grapesjs, mjml, block-locking, data-gjs]

requires:
  - phase: 03-01
    provides: proven data-gjs-* locking pattern + gate sanitizer
provides:
  - All 7 DDROIDD branded blocks carry instance-level GrapesJS locking attrs
affects: [block-locking]

tech-stack:
  added: []
  patterns:
    - "Uniform locking applied structure-agnostically: every mj-section → draggable/removable=false; every mj-column → droppable allowlist"

key-files:
  created: []
  modified:
    - app/client/src/editor/blocks/projects.ts
    - app/client/src/editor/blocks/new-collegues.ts
    - app/client/src/editor/blocks/initiatives.ts
    - app/client/src/editor/blocks/hiring.ts
    - app/client/src/editor/blocks/want-to-know-more.ts
    - app/client/src/editor/blocks/disclaimer.ts
    - app/client/src/editor/blocks/hero.ts (draggable token removed — see correction)
    - app/client/src/editor/editorConfig.ts (component:add draggability lock — see correction)

key-decisions:
  - "Applied via a token-insertion script (attrs prepended right after <mj-section / <mj-column) — structure-agnostic across the varied section tags (padding attrs, column widths). No addType (Pitfall 1)."

patterns-established:
  - "LeftSidebar delete-icon gate (removable !== false) and actions.ts canDuplicate exclusion now apply to branded sections automatically — no extra code."

requirements-completed: [BLOCK-03]

duration: ~10min
completed: 2026-07-13
---

# Phase 3 / Plan 02: lock the remaining 6 branded blocks

**All 7 DDROIDD branded blocks now carry instance-level locking (16 sections non-draggable/removable, 20 columns text/image-only drops); gate 8/8 PASS, tsc clean. In-editor human-verify PENDING.**

## Performance
- **Duration:** ~10 min
- **Completed:** 2026-07-13T08:52Z
- **Tasks:** 1/1 auto (Task 2 human-verify checkpoint deferred to consolidated session)
- **Files modified:** 6

## Accomplishments
- Added `data-gjs-draggable="false" data-gjs-removable="false"` to every `<mj-section>` and `data-gjs-droppable='["mj-text","mj-image"]'` to every `<mj-column>` across projects (3/3), new-collegues (3/6), initiatives (3/3), hiring (3/4), want-to-know-more (3/3), disclaimer (1/1). No leaf text/image tag touched; no tag converted to self-closing.
- Matched hero.ts exactly (same attr set + array allowlist form).
- The 03-01 gate sanitizer already strips these attrs → verify:blocks stayed green with no further gate change.

## Files Created/Modified
- 6 branded block files (see frontmatter) — locking attrs on structural section/column tags only.

## Decisions Made
- Used a scripted token insertion (prepend attrs after the tag name) rather than per-string Edits — the 6 files have divergent section tags (padding-top/bottom, column widths), so a structure-agnostic pass is both safer and consistent. Verified via grep counts + gate + tsc.

## Deviations from Plan
None — same uniform rule as Plan 01, applied to all 6 files.

## Issues Encountered
- Initial `node -e` one-liners silently no-op'd under Git Bash quoting; switched to a script file (`node lock-blocks.cjs`) which applied cleanly. No effect on output.

## Verification
- `cd app/server && npm run verify:blocks` → 8/8 PASS (0 errors).
- `cd app/client && npx tsc --noEmit` → clean.
- grep: 18 `data-gjs-draggable="false"` across 7 files (hero 2 + 16 in the 6 blocks).
- **PENDING (human-verify, blocking):** in-editor confirmation at localhost:5173 — locks enforced, text/image still editable/movable, columns reject Button/Divider drops but reorder own children, and generic blocks stay fully unlocked (Pitfall 1 regression). Consolidated into the phase-end checkpoint.

## Post-verify Correction (2026-07-13, during human-verify)

**Bug found on first drag:** a branded block would not appear when dragged from the panel onto the canvas.

**Root cause:** `data-gjs-draggable="false"` on the block's ROOT `<mj-section>`. GrapesJS 0.22.16's sorter validates a panel drop against the *dragged model's* `draggable`; when it is falsy the drag path bails with `"The element is not draggable"` (confirmed in the grapes.min.js sorter and live). So the block never lands. `removable`/`droppable` do NOT block the drop — only `draggable` does.

**Fix (both plans 01 + 02 blocks):**
- Removed `data-gjs-draggable="false"` from all 7 block content strings (hero + 6). Kept `data-gjs-removable="false"` (sections) and `data-gjs-droppable='["mj-text","mj-image"]'` (columns) — neither blocks the drop.
- Added a `component:add` listener in `editorConfig.ts` that locks `draggable=false` on any `mj-section` whose `removable===false` (the branded marker), AFTER it is in the tree. Fires on real drops (locks in place) and is a no-op on load (draggable already serialized false).

**Verified live** (Playwright, `window.__ddroiddEditor`): after adding the hero block, both branded sections report `removable:false, draggable:false`; a generic section keeps `removable:true` + the default draggable selector (not locked). All three props serialize into project JSON → the lock survives save/load. Still needs a real drag-drop human confirmation (headless can't fully simulate GrapesJS canvas DnD).

### Second correction — column droppable (2026-07-13, during human-verify)

**Bug found:** with a branded block on the canvas, you could not add text/image/any block INTO its column.

**Root cause:** the `data-gjs-droppable='["mj-text","mj-image"]'` allowlist on each `<mj-column>`. grapesjs 0.22.16 evaluates an ARRAY droppable by joining it to a CSS selector and matching it against the *source element* (`sourceEl.matches("mj-text,mj-image")`). A block dragged from the panel has no rendered element yet (`d==null`) → the check returns `undefined` → ALL new drops rejected. (Existing children reorder because they have elements — which is why RESEARCH's "array allowlist" looked fine but wasn't.)

**Decision (user-directed research):** MJML forbids `mj-section` inside a section/column; `mj-column` only in section/group; content only in `mj-column`. **grapesjs-mjml already enforces this** via per-type `draggable` parent selectors (confirmed live: `mj-section` draggable = `[data-gjs-type=mj-body],[data-gjs-type=mj-wrapper]`; `mj-text` draggable = `[data-gjs-type=mj-column]`). So a custom column allowlist is unnecessary AND was the only thing blocking valid content.

**Fix:** removed `data-gjs-droppable` from all 7 blocks — branded columns are now plain `<mj-column>` (plugin default `droppable:true`). Valid content (text/image/button/divider/spacer/social) drops into branded columns; invalid nesting (a section into a column) is still impossible by the plugin's own rules. **This supersedes the original must-have "locked columns reject arbitrary block drops (Button/Divider/other)"** — the guardrail is now MJML structural validity, not an arbitrary type allowlist (per user decision 2026-07-13).

**Verified live:** branded section `removable:false, draggable:false`; branded column `droppable:true`; `mj-text` draggable targets `mj-column`; `mj-section` draggable excludes columns. Needs real drag-drop human confirmation.

## Commits
None — `.claude/rules/no-commit.md` (GSD-without-commits). Uncommitted; suggested message at phase end.

## Next Phase Readiness
- BLOCK-03 code complete across the full library; awaiting the single consolidated live-editor verification.

---
*Phase: 03-full-branded-block-library-editor-configuration*
*Completed: 2026-07-13*
