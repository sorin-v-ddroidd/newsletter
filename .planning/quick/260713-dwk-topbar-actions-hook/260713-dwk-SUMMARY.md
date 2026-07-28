---
status: complete
phase: quick-260713-dwk-topbar-actions-hook
plan: 01
subsystem: editor
tags: [refactor, hooks, topbar]
dependency-graph:
  requires: []
  provides: [useEditorActions]
  affects: [TopBar.tsx]
tech-stack:
  added: []
  patterns: [custom-hook-extraction]
key-files:
  created:
    - app/client/src/editor/hooks/useEditorActions.ts
  modified:
    - app/client/src/editor/TopBar.tsx
decisions: []
metrics:
  duration: "~10 minutes"
  completed: 2026-07-13
---

# Quick Task 260713-dwk: TopBar Actions Hook Summary

Extracted TopBar.tsx's inline banner state, `withEditor` wrapper, and all eight handler functions into a new `useEditorActions` hook, leaving TopBar as a pure render-function component. Zero behavior change.

## What was done

**Task 1 — Created `app/client/src/editor/hooks/useEditorActions.ts`:**
- Moved `ExportWarningBanner` type (kept internal, not exported — only the return shape is exposed via `UseEditorActionsReturn`).
- Moved the `banner` `useState`, the `withEditor` wrapper, and all handlers verbatim: `handleSave`, `handleLoad`, `handleAssert`, `handleTemplate`, `handleCompile`, `handleExport`, `handleDownloadAnyway`, `handleDismissBanner`.
- `handleCompile`'s body, including the popup-blocker comment, was moved unchanged — no `async`/`await` introduced anywhere in the hook.
- Followed the `useLayerVisibility.ts` file convention: top-of-file `UseEditorActionsReturn` type alias, single explanatory comment block, named `export const useEditorActions = (): UseEditorActionsReturn => { ... }`.

**Task 2 — Wired `TopBar.tsx` to the hook:**
- Removed the `useState` import, the `ExportWarningBanner` type, the `banner` state, `withEditor`, and all eight handler definitions.
- Removed all imports from `./actions` (TopBar.tsx now has zero imports from `./actions`).
- Added `import { useEditorActions } from './hooks/useEditorActions';` and destructured `banner` + all handlers from `useEditorActions()` at the top of the component body.
- `deviceIcon`, `renderBrand`, `renderDeviceSwitcher`, `renderWarningBanner`, `renderActions`, and the final `return` block are untouched — `renderWarningBanner`/`renderActions` reference the same identifiers, now sourced from the hook's return values instead of local closures.

## Critical constraint verified

The popup-blocker-sensitive chain (click → `openHtmlPreview` → `window.open()`) stays fully synchronous inside `useEditorActions.ts`. Confirmed via grep: no `async`/`await` tokens appear in the hook file except inside the pre-existing explanatory comment describing why `await` must NOT be used.

## Verification

```
cd app/client && npx tsc --noEmit
```
Zero errors.

Grep confirmed no `withEditor`, `setBanner`, `useState`, or `from './actions'` identifiers remain in `TopBar.tsx`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- FOUND: app/client/src/editor/hooks/useEditorActions.ts
- FOUND: app/client/src/editor/TopBar.tsx (modified)
- `npx tsc --noEmit` — zero errors (verified directly, no commit hashes to check since this task does not commit per `.claude/rules/no-commit.md`)

## Self-Check: PASSED

## Changed Files

- `app/client/src/editor/hooks/useEditorActions.ts` (new)
- `app/client/src/editor/TopBar.tsx` (modified)

## Suggested Commit Message

```
refactor(editor): extract TopBar actions into useEditorActions hook

Move banner state, withEditor wrapper, and all handler functions
(save/load/assert/template/compile/export/download/dismiss) out of
TopBar.tsx into a new colocated hook, per component-patterns.md.
Zero behavior change; the synchronous click -> openHtmlPreview ->
window.open() chain is preserved with no async indirection.
```

Note: per `.claude/rules/no-commit.md`, no commit was made. The developer should review and commit manually.
