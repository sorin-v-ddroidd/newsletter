---
phase: 1-planning
ticket_id: SECDEL-01
branch: feat/app-ui
status: executing
verdict: IN_PROGRESS
started_at: "2026-07-27"
completed_at: ""
resume_with: /gsd-goal-loop
---

# Loop Plan — Iteration 1

## Discovery Summary

Three coupled mechanisms gate section deletion, all keyed off one marker:

1. **The marker.** Every branded block writes `data-gjs-removable="false"` on its root
   `mj-section`. GrapesJS parses `data-gjs-*` into model props, so the section lands with
   `removable === false`. 15 occurrences across 7 files:
   - `blocks/hero.ts:15,34`
   - `blocks/new-collegues.ts:20,52,109`
   - `blocks/projects.ts:15,21,44`
   - `blocks/initiatives.ts:14,20,44`
   - `blocks/hiring.ts:15,21,68`
   - `blocks/want-to-know-more.ts:13,19,43`
   - `blocks/disclaimer.ts:15`
   `blocks/template.ts` composes `block.content` verbatim, so the "New from Template" seed
   inherits the same marker — one fix covers both drop and seed paths.

2. **The UI reads.** `LeftSidebar.tsx:39` (`canDelete`) hides the trash button at line 61;
   `actions.ts:58` (`canDuplicate`) disables the Duplicate context-menu item. Both already
   read `removable !== false` — the single source of truth — so neither file needs editing.
   There is no canvas hover-toolbar (the plugin's `devices-c` panel is removed,
   `editorConfig.ts:420`), so Layers is the only delete affordance.

3. **The draggable lock.** `editorConfig.ts:350-358` listens on `component:add` and sets
   `draggable: false` for any `mj-section` whose `removable === false`. Once the marker is
   gone this listener becomes dead code; per the user decision (delete + duplicate + reorder)
   it is removed rather than re-keyed.

**Persistence gap.** `removable: false` / `draggable: false` are serialized into
`getProjectData()` (that is exactly what the `editorConfig.ts:346-348` comment relies on for
round-trip stability). So drafts already in localStorage stay locked after the block fix.
Per user decision, `load()` normalizes on the way in. `getExportMjml()` also calls
`loadProjectData()` for its snapshot restore, but that snapshot is taken from already-unlocked
in-memory state, so normalization belongs in `load()` only — adding it to the restore path
would be a no-op at best and could perturb the export round-trip.

No test file references `removable` or `draggable` (`editorConfig.test.ts`,
`verify-blocks.ts` both clean), so nothing needs a test update; `verify-blocks.ts` acts as
the regression gate that the attribute removal does not change compiled MJML.

## SC Coverage

| SC   | Steps that satisfy it |
|------|-----------------------|
| SC-1 | step 1 |
| SC-2 | step 2 |
| SC-3 | step 3, step 4 |
| SC-4 | step 5 |
| SC-5 | step 6 |
| SC-6 | step 7 |

## Steps

1. `app/client/src/editor/blocks/{hero,new-collegues,projects,initiatives,hiring,want-to-know-more,disclaimer}.ts`
   — delete the ` data-gjs-removable="false"` attribute from every root `mj-section` open tag
   (15 occurrences). Attribute-only removal: no tag added/removed, no self-closing introduced,
   surrounding attributes and whitespace otherwise untouched.

2. `app/client/src/editor/editorConfig.ts:342-358` — delete the BLOCK-03 `component:add`
   draggable-lock listener and its explanatory comment block. Leave the surrounding
   `component:selected` (above) and `block:drag:stop` (below) listeners intact.

3. `app/client/src/editor/actions.ts` (after `collectHidden`, before `canDuplicate`) — add
   `unlockSections(component: Component): void`: recursive walk; for each component whose
   `tagName` is `mj-section`, if `get('removable') === false` set it `true`, and if
   `get('draggable') === false` set it `true`; recurse into `component.components()`.
   Document why it exists (legacy-draft migration for SECDEL-01) and that it intentionally
   mutates loaded data, so the byte-identical round-trip assert can differ for pre-fix drafts.

4. `app/client/src/editor/actions.ts` `load()` (lines 27-40) — inside the existing
   `try`/`finally`, after `editor.loadProjectData(...)`, call `unlockSections` on
   `editor.getWrapper()` (guarded for undefined). Keep it inside the `loadingProject = true`
   window so the padding-shorthand expansion listener still bails during the mutation.

5. Run `npx tsc --noEmit` in `app/client`.

6. Run the block verification script (`app/server/scripts/verify-blocks.ts` via tsx) and
   confirm zero MJML errors.

7. Start the dev server and verify in the browser: seed the template, select a section in
   Layers, confirm the trash icon renders, click it, confirm the section disappears; confirm
   the Duplicate context item is enabled.

## Addendum — mid-iteration scope addition (user request)

"When I click save I expect to save to localStorage and after I come back (close the browser)
load my latest changes."

Discovery: `save`/`load` (`actions.ts`) are wired ONLY to manual TopBar buttons via
`hooks/useEditorActions.ts:41-42`. Nothing restores on mount — `editorConfig.onEditor` seeds an
empty `<mjml><mj-body>` scaffold whenever the canvas is empty, so every reopen starts blank and
the saved draft sits in localStorage untouched until the user clicks Load. Save itself already
works; only restore was missing.

Steps added:

8. `actions.ts` — add `hasSavedDraft()`; change `load()` to return `boolean` (found-and-loaded)
   and to catch `JSON.parse` failure, logging and returning false so a corrupt entry cannot
   brick the editor on open.
9. `editorConfig.ts` `onEditor` — inside the existing `getComponents().length === 0` guard,
   attempt `load(editor)` first and fall back to `setComponents('<mjml><mj-body></mj-body></mjml>')`
   only when there is no draft (or it failed to parse). `UndoManager.clear()` runs either way so
   the restore is not undoable back to blank. `hasSavedDraft()` is checked before touching the
   canvas so the scaffold can never clobber a real draft.

Autosave is deliberately NOT added — the user asked for explicit Save.

## Verification Approach

- SC-1: `grep -rn 'data-gjs-removable' app/client/src/editor/blocks/` → zero matches.
- SC-2: `grep -n "draggable" app/client/src/editor/editorConfig.ts` → no `set('draggable', false)`.
- SC-3: `grep -n "unlockSections" app/client/src/editor/actions.ts` → definition + call in `load()`.
- SC-4: `npx tsc --noEmit` exit 0, no output.
- SC-5: verify-blocks script reports all blocks OK / no errors.
- SC-6: browser (Chrome tools): trash icon present on a section layer row; section count drops
  after click.
