---
quick_id: 260713-eou
slug: multiselect-duplicate-layers
status: complete
---

Multi-select (ctrl/cmd-click toggle, shift-click range) and duplicate (Ctrl/Cmd+D, right-click context menu) for the Layers panel.

## Files changed
- `app/client/src/editor/actions.ts` — `canDuplicate(component)` locking predicate (excludes root/no-parent, `mjml`, `mj-body`, `removable === false`); `duplicateComponents(editor, components)` (clone-and-insert-as-sibling, filtered by `canDuplicate`, selects clones); `flattenLayerTree(root)` (pre-order traversal for shift-click range).
- `app/client/src/editor/hooks/useLayerSelection.ts` (new) — selection subscription (`component:selected`/`deselected`), shift-click anchor state, `isSelected`, `handleRowClick`, `handleDuplicate`.
- `app/client/src/editor/LeftSidebar.tsx` — `LayerSelectionContext` + `LayersPanelBody`; `LayerItem` reads selection/handlers from context; each row wrapped in shadcn `ContextMenu` with "Duplicate" item, `disabled` when `!canDuplicate`.
- `app/client/src/editor/editorConfig.ts` — `editor.Keymaps.add('ddroidd:duplicate-layers', '⌘+d, ctrl+d', ...)`, guarded by `editor.getEditing()`, calls `duplicateComponents(editor, editor.getSelectedAll())`.
- `app/client/src/components/ui/context-menu.tsx` (new, via shadcn CLI).

## Deviation
`flattenLayerTree` uses explicit forEach/push instead of `.map().flatMap()` — GrapesJS `Components` collection didn't narrow cleanly under strict TS with `.map()`. Behaviorally identical.

## Typecheck
`npx tsc --noEmit` in `app/client` — clean.

## Manual verification (not run — no browser tool in this session)
1. Ctrl/Cmd-click 2 rows → both highlight, `getSelectedAll().length === 2`.
2. Ctrl/Cmd-click one again → deselects it only.
3. Click row (anchor), shift-click distant row → contiguous range highlights.
4. Ctrl/Cmd+D with 2+ duplicable selected → siblings cloned below each, clones become new selection.
5. Mixed selection (locked + duplicable) → Ctrl/Cmd+D only duplicates duplicable ones.
6. Right-click duplicable row → Duplicate → clones as sibling.
7. Right-click root/`mj-body`/`removable:false` → Duplicate present but disabled.
8. Eye-toggle/trash buttons still work (stopPropagation unaffected).
9. `window.__ddroiddAssertRoundTrip()` after duplicate → still `true`.
10. Preview & Compile after duplicating a branded section → no new compile warnings.
