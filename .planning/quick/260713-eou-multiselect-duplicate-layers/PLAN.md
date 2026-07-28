---
quick_id: 260713-eou
date: 2026-07-13
slug: multiselect-duplicate-layers
description: >
  Add multi-select (ctrl/cmd-click toggle, shift-click range) to the LeftSidebar
  layer tree, plus a Duplicate action (Ctrl/Cmd+D and right-click context menu)
  that respects GrapesJS component locking and BLOCK-03 structural locking.
---

# Multi-select + Duplicate for Layers panel

## Scope

In scope:
- Ctrl/Cmd-click toggles a layer row into/out of the current selection.
- Shift-click selects the contiguous range between the last-clicked anchor and
  the clicked row (in rendered tree order).
- Ctrl/Cmd+D duplicates every *duplicable* component currently selected.
- Right-click on a layer row opens a context menu with a "Duplicate" item
  (disabled when the row isn't duplicable; when multiple rows are selected and
  the right-clicked row is part of that selection, it duplicates the whole
  duplicable subset — see Step 2).
- Locked/structural components (root, `mjml`, `mj-body`, anything with
  `removable === false`) are never duplicated, and the Duplicate control is
  disabled for them.

Out of scope (do not touch):
- Drag-reorder in the Layers panel.
- Canvas marquee/multi-select.
- Copy/paste (clipboard), collapse/expand affordances.
- Ctrl+Shift range-extend or any selection mode beyond plain/ctrl/shift click.

## Design decisions (binding — do not drift)

1. **One locking predicate, reused everywhere.** Add a single exported
   `canDuplicate(component)` in `actions.ts`. It is the *only* place that
   encodes the locking rule:
   `component.parent() != null && component.get('tagName') !== 'mjml' &&
   component.get('tagName') !== 'mj-body' && component.get('removable') !== false`
   (root has no parent → excluded via the `parent()` check; this also mirrors
   `LeftSidebar.tsx`'s existing `isStructural`/`canDelete` logic — reuse those
   exact conditions, don't reinvent). Do **not** gate on `copyable` — the task
   defines duplicability via `removable` + structural tag, not GrapesJS's
   built-in copy flag. The context-menu `disabled` state, the Ctrl/Cmd+D
   handler's filter, and the multi-duplicate filter must all call this one
   function — never re-implement the check inline in three places.

2. **Selection lives in GrapesJS, not React state.** Per `grapesjs.md`, don't
   mirror editor state into React. Use `editor.getSelectedAll()` as the source
   of truth for "what's selected"; mutate via `editor.select()`,
   `editor.selectToggle()`. Subscribe to `component:selected` /
   `component:deselected` to know when to re-render (same pattern as
   `useSelectedComponent.ts`). The *only* genuine React state needed is the
   shift-click **anchor** (the last plain/ctrl-clicked row), because "anchor"
   isn't a GrapesJS concept.

3. **Duplicate a clone-and-insert, not the built-in toolbar command.** GrapesJS's
   `tlb-clone` command operates on the single last-selected component and its
   exact insertion/locking behavior isn't part of the documented/typed API
   surface — don't depend on it. Implement duplication directly:
   `Component.clone()` (does NOT auto-insert) + manual sibling insertion.

4. **Selection is broader than duplication.** Any row (including structural
   ones) can be included in a multi-select highlight — selection is just a UI
   highlight concept. The Duplicate action independently filters the current
   selection through `canDuplicate` before acting. Do not try to prevent
   locked rows from being ctrl/shift-selected; that adds complexity for no
   behavioral gain (duplicate simply no-ops on them).

## Steps

### 1. `app/client/src/editor/actions.ts` — duplication service functions

Add, near the other component-tree helpers (after `collectHidden`, before
`getExportMjml`):

```ts
// canDuplicate: the SINGLE source of truth for "is this component duplicable".
// Reused by the Layers context menu (disabled state), the Ctrl/Cmd+D handler,
// and the multi-select duplicate filter — must never be reimplemented inline
// elsewhere (see .planning/quick/260713-eou.../PLAN.md design decision 1).
// Mirrors LeftSidebar's existing isStructural/canDelete checks: no parent
// (root), <mjml>, <mj-body>, or an explicit removable:false are all excluded.
export const canDuplicate = (component: Component): boolean => {
  const parent = component.parent();
  if (!parent) {
    return false;
  }
  const tag = String(component.get('tagName') ?? '');
  if (tag === 'mjml' || tag === 'mj-body') {
    return false;
  }
  return component.get('removable') !== false;
};

// Clones each duplicable component in `components` as a sibling directly
// below itself, then selects the resulting clones. Non-duplicable components
// in the input are silently skipped (BLOCK-03 locking). `index()` is read
// live per-iteration so inserting one clone doesn't shift the position of a
// not-yet-processed sibling's insert point.
export const duplicateComponents = (editor: GrapesEditor, components: Component[]): void => {
  const clones = components
    .filter(canDuplicate)
    .map((component) => {
      const parent = component.parent();
      if (!parent) {
        return null;
      }
      const clone = component.clone();
      parent.append(clone, { at: component.index() + 1 });
      return clone;
    })
    .filter((c): c is Component => c !== null);

  if (clones.length > 0) {
    editor.select(clones);
  }
};
```

Why: `actions.ts` is the pure editor-facing service layer (no React) per
`backend`-equivalent convention for the editor side (`component-patterns.md` /
CLAUDE.md project layout) — duplication logic belongs here, not inline in a
hook or component.

### 2. `app/client/src/editor/hooks/useLayerSelection.ts` — new hook

Owns:
- Subscribing to `component:selected`/`component:deselected` (mirrors
  `useSelectedComponent.ts`) to force re-render when the GrapesJS selection
  changes.
- The shift-click anchor (`useState<Component | null>`).
- `isSelected(component)` — `editor.getSelectedAll().includes(component)`.
- `handleRowClick(component, event)`:
  - plain click → `editor.select(component)`; set anchor to `component`.
  - ctrl/cmd click (`event.ctrlKey || event.metaKey`) → `editor.selectToggle(component)`;
    set anchor to `component`.
  - shift click (`event.shiftKey`) → compute the flat pre-order list of layer
    components rooted at the tree root (see below), find the anchor's and the
    clicked row's index, `editor.select(range)` covering both endpoints
    inclusive. If no anchor yet, fall back to plain-select behavior.
- `handleDuplicate()` — `duplicateComponents(editor, editor.getSelectedAll())`.

Flat-list helper for shift-range: a small pure function
`flattenLayerTree(root: Component): Component[]` doing the exact same
pre-order traversal LayerItem's JSX recursion does (`[component, ...children.flatMap(flatten)]`)
so index order matches what's rendered. Put this in the same hook file (it's
tree-shape logic tied 1:1 to this hook, not shared elsewhere) or export it
from `actions.ts` if you prefer one-location-for-tree-walks consistency with
`collectHidden` — pick `actions.ts` for consistency with existing tree-walk
helpers, since it also needs zero React.

Type shape:
```ts
type UseLayerSelectionReturn = {
  isSelected: (component: Component) => boolean;
  handleRowClick: (component: Component, event: React.MouseEvent) => void;
  handleDuplicate: () => void;
};
```

This hook needs the tree **root** to flatten it for shift-range. Since
`LayerItem` is recursive and only receives its own `component`/`depth`, thread
the root through a small context (see Step 3) rather than prop-drilling depth
levels — `component-patterns.md` prefers Context over drilling past 2 levels,
and layer depth is unbounded.

### 3. `app/client/src/editor/LeftSidebar.tsx` — wire selection + context menu

- Add a `LayerSelectionContext` (or lift `useLayerSelection()` once in
  `renderLayers()` and pass its return value down via a lightweight React
  context provider wrapping the `<LayerItem>` tree) so every recursive
  `LayerItem` can call `isSelected`/`handleRowClick`/`handleDuplicate` without
  prop drilling. Call `useLayerSelection(root)` once at the top of
  `renderLayers()`, right after getting `root` from `LayersProvider`.
- Replace `LayerItem`'s local `isSelected` (currently `selected === component`
  from `useSelectedComponent`) with the context's `isSelected(component)` —
  this is the multi-select-aware version. `useSelectedComponent` can stay for
  other single-selection consumers (e.g. Style Manager panel) — do not modify
  it.
- Change the row `<button onClick={...}>` to call
  `handleRowClick(component, event)` instead of `editor.select(component)`
  directly.
- Wrap the row's outer `<div>` (the one with `group flex items-center...`) in
  a shadcn `ContextMenu` / `ContextMenuTrigger`, with a `ContextMenuContent`
  containing a single `ContextMenuItem` "Duplicate" that calls
  `handleDuplicate()` and is `disabled={!canDuplicate(component)}` (import
  `canDuplicate` from `actions.ts`). Only render the context menu at all if
  `!isRoot` (mirror the existing `renderControls` early-return for
  structural rows) to avoid a context menu on root with no meaningful entries beyond a disabled item — actually simplest: always wrap, just always compute `disabled` via `canDuplicate`; keep it consistent rather than special-casing root.
- Verify the existing eye/trash buttons' `ev.stopPropagation()` still prevents
  the row click (and now the context-menu trigger's click-through) from
  interfering — shadcn's `ContextMenuTrigger` only intercepts right-click by
  default, so left-click behavior on the row button is unaffected; confirm
  this manually in Step "Verification" below.

### 4. Keyboard shortcut — Ctrl/Cmd+D

Add in `editorConfig.ts`'s `onEditor(editor)`, alongside the other
`editor.on(...)` wiring (near the `block:drag:stop` listener):

```ts
editor.Keymaps.add('ddroidd:duplicate-layers', '⌘+d, ctrl+d', (_editor: GrapesEditor) => {
  if (editor.getEditing()) {
    return; // don't hijack Ctrl/Cmd+D while editing text (RTE) in a component
  }
  duplicateComponents(editor, editor.getSelectedAll());
});
```
(Confirm `editor.Keymaps.add` accepts this combo syntax — GrapesJS's Keymaps
plugin uses Mousetrap-style strings; check the installed type defs /
`Keymaps` section of `grapesjs/dist/index.d.ts` for the exact `add` signature
before writing this, and adjust the combo string format if it differs.)
Import `duplicateComponents` from `./actions` at the top of `editorConfig.ts`.

This intentionally binds the shortcut editor-wide (not scoped to the Layers
panel having focus) — matches how Ctrl/Cmd+D is expected to "just work" while
a component/set of components is selected, whether selection was made via
canvas click or the Layers panel.

### 5. shadcn context-menu primitive

Run `npx shadcn@latest add context-menu` from `app/client/` (per
`styling.md`/`gotchas.md`: always use the CLI, never hand-write files under
`components/ui/`). This adds `components/ui/context-menu.tsx` and wires the
`radix-ui` context-menu primitive (already a dependency per `radix-ui` in
`package.json`).

## Locking constraint enforcement — explicit call-outs

- **Structural exclusion**: root (no parent), `mjml`, `mj-body` — excluded via
  `canDuplicate`'s `parent()`/`tagName` checks, same tags `LeftSidebar.tsx`
  already treats as `isStructural`.
- **Explicit non-removable**: any component with `removable === false` (set
  by a branded block definition per BLOCK-03) is excluded via the same
  `canDuplicate` check — this covers locked branded-block structural parts
  without needing a separate flag.
- **Single source of truth**: `canDuplicate` in `actions.ts` is imported by
  (a) the context-menu `disabled` prop, (b) the Ctrl/Cmd+D keymap handler
  (indirectly, via `duplicateComponents`'s internal filter), (c) the
  multi-duplicate filter — literally the same filter in all three, not
  re-derived.
- Multi-select itself does **not** exclude locked/structural rows — they can
  be highlighted, they just don't get duplicated. Simpler to reason about,
  matches the task's "if that matters" hedge on this point.

## Verification (manual, in the running dev app)

0. Per MEMORY: kill any stale dev server on 5173/5174 before starting a fresh
   one (`npm run dev` from `app/client`), to avoid testing against stale code.
1. Load the editor with a few sections in the canvas. Open the Layers tab.
2. **Ctrl/Cmd-click** two different layer rows → both rows highlight
   (bg-accent). In the browser console:
   `window.__ddroiddEditor.getSelectedAll().length === 2`.
3. **Ctrl/Cmd-click** one of them again → it deselects, the other stays
   selected.
4. **Shift-click**: plain-click a row (sets anchor), then shift-click a row
   several levels/rows away → the contiguous rendered range between them
   highlights.
5. **Ctrl/Cmd+D** with 2+ duplicable rows selected → each gets a new sibling
   directly below it in the tree; the clones become the new selection
   (verify via `getSelectedAll()` and visually in the Layers panel).
6. Multi-select including a locked/structural row (e.g. select `mj-body` or a
   `removable:false` component alongside a duplicable one) → Ctrl/Cmd+D only
   duplicates the duplicable member(s); no error, no duplicate of the locked
   one.
7. **Right-click** a duplicable row → context menu shows "Duplicate", click
   it → row is duplicated as a sibling below.
8. **Right-click** the root row / `mj-body` / a `removable:false` component →
   "Duplicate" is present but disabled (or absent if you chose to special-case
   it — pick one and keep it consistent with Step 3's note).
9. Confirm the existing eye-toggle and trash-delete buttons on a row still
   work unchanged (their `stopPropagation` isn't broken by the context-menu
   wrapper or the new row-click handler).
10. Run `window.__ddroiddAssertRoundTrip()` after performing a duplicate —
    console should still log `Round-trip identical: true` (duplication is a
    normal component-tree mutation; the Phase-1 round-trip gate must still
    hold).
11. `Preview & Compile` (TopBar) after duplicating a branded section → no new
    MJML compile warnings/errors introduced by the duplicated markup.

## Explicitly not doing

- No drag-reorder changes.
- No canvas-level multi-select/marquee.
- No copy/paste to clipboard.
- No ctrl+shift combined range-extend-and-add semantics — plain/ctrl/shift
  click only, as scoped.
