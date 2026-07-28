---
phase: quick
plan: 260713-dl2
status: complete
subsystem: editor
tags: [refactor, hooks, leftsidebar]
requirements: []
key-files:
  created:
    - app/client/src/editor/hooks/useBlockSearch.ts
  modified:
    - app/client/src/editor/LeftSidebar.tsx
decisions:
  - "MapCategoryBlocks type is not reachable via a subpath import (@grapesjs/react's package.json `exports` map only allows the package root), so it's derived as `BlocksResultProps['mapCategoryBlocks']` from the root export instead of the plan's originally specified subpath import."
metrics:
  duration: "~15m"
  completed: 2026-07-13
---

# Quick Task 260713-dl2: Extract useBlockSearch hook Summary

Extracted the inline block search/filter/sort logic from `LeftSidebar.tsx`'s `renderBlocks()` render-prop callback into a new pure-derivation hook, `useBlockSearch`, colocated with the editor's other hooks.

## What Was Done

- Created `app/client/src/editor/hooks/useBlockSearch.ts`:
  - Exports `BRAND_CATEGORY` (`'DDROIDD'`) as the single source of truth (previously duplicated as a module-level constant in `LeftSidebar.tsx`).
  - Exports `useBlockSearch(mapCategoryBlocks, query)`, a pure function (no internal `useState`/`useEffect` — it has no event source to subscribe to, unlike its sibling hooks `useSelectedComponent`/`useLayerVisibility`) that reproduces the original inline logic exactly: lowercase-trim query, filter blocks by `stripHtml(label)` match, drop empty categories, sort with `BRAND_CATEGORY` first.
  - Moved the `stripHtml` helper into this file as a non-exported local, since it's only used here now.
- Updated `app/client/src/editor/LeftSidebar.tsx`:
  - Removed the module-level `BRAND_CATEGORY` constant and `stripHtml` helper.
  - Imports `useBlockSearch` and `BRAND_CATEGORY` from `./hooks/useBlockSearch`.
  - `renderBlocks()`'s `BlocksProvider` render-prop callback now does `const categories = useBlockSearch(mapCategoryBlocks, query);` instead of inlining the map/filter/sort chain.
  - No other code touched — `BlockChip`, `LayerItem`, `renderLayers()`, and the rest of `renderBlocks()`'s JSX are unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the `MapCategoryBlocks` import path**
- **Found during:** Task 1 (initial `npx tsc --noEmit` run)
- **Issue:** The plan specified `import type { MapCategoryBlocks } from '@grapesjs/react/dist/BlocksProvider'`. This subpath does not resolve — `@grapesjs/react`'s `package.json` `"exports"` map only declares the `"."` root entry, so deep subpath imports are blocked by Node's exports-map resolution (confirmed via `node_modules/@grapesjs/react/package.json`). `tsc --noEmit` failed with `TS2307: Cannot find module '@grapesjs/react/dist/BlocksProvider'`, cascading into 6 further type errors (`mapCategoryBlocks` typed as `unknown`).
- **Fix:** Import `type { BlocksResultProps } from '@grapesjs/react'` (the package root, which does re-export `BlocksResultProps`) and derive `type MapCategoryBlocks = BlocksResultProps['mapCategoryBlocks']` locally in `useBlockSearch.ts`. Same underlying type (`Map<string, Block[]>`), reached through a path that actually resolves.
- **Files modified:** `app/client/src/editor/hooks/useBlockSearch.ts`
- **Commit:** Not committed (see below — `no-commit.md`)

## Verification

- `cd app/client && npx tsc --noEmit` — passes with zero errors.
- Manual read-through: `useBlockSearch`'s logic is line-for-line equivalent to the removed inline block (same trim/lowercase, same filter predicate via `stripHtml`, same empty-category drop, same `BRAND_CATEGORY`-first comparator).
- No inline `.filter(`/`.sort(`/`stripHtml` calls remain in `LeftSidebar.tsx`; `renderBlocks()` only calls `useBlockSearch(mapCategoryBlocks, query)` and maps the result to JSX.
- `BlockChip`, `LayerItem`, `renderLayers()`, and the Layers tab are untouched (confirmed by diff — only the `renderBlocks()` render-prop body and the import/module-level-constant lines changed).
- Did not run `npm run dev` for a live-browser check (no running dev server in this session); the `tsc` pass plus line-for-line logic equivalence is the verification basis. Recommend a quick manual Blocks-tab check (search filter, DDROIDD-first ordering) before merging, per the plan's verification step 3.

## Known Stubs

None.

## Threat Flags

None — pure client-side refactor, no new input/network/trust surface (per plan's threat model).

## Self-Check: PASSED

- FOUND: app/client/src/editor/hooks/useBlockSearch.ts
- FOUND: app/client/src/editor/LeftSidebar.tsx (modified, verified via Read)
- `npx tsc --noEmit` output: no errors reported.

## Not Committed

Per `.claude/rules/no-commit.md`, no commit was made. Changed files:

- `app/client/src/editor/hooks/useBlockSearch.ts` (new)
- `app/client/src/editor/LeftSidebar.tsx` (modified)

Suggested commit message:

```
refactor(editor): extract block search/filter/sort into useBlockSearch hook

Move the inline query-filter/category-drop/brand-sort logic out of
LeftSidebar.tsx's renderBlocks() render-prop into a dedicated
useBlockSearch hook, matching the existing hook colocation pattern
(useSelectedComponent, useLayerVisibility). No behavior change.
```
