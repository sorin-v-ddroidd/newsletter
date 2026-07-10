# Quick Task 260705-h8h: Refactor app/client for a stronger architecture — Summary

Behavior-preserving structural refactor of `app/client`: split the monolithic
`editor/editorOptions.ts` into `editor/actions.ts` (action service layer),
`editor/blocks/registerBlocks.ts` (block registration), and `editor/editorConfig.ts`
(config + `onEditor` setup); relocated block definitions from `blocks/` to
`editor/blocks/`; code-split the editor with `React.lazy` behind a sized
`EditorSkeleton`; and added a class-based `ErrorBoundary` wrapping the app.

## Tasks completed

### Task 1: Separate concerns — split editorOptions.ts and relocate blocks
- `git mv app/client/src/blocks` → `app/client/src/editor/blocks/` (9 files: `BLOCK_DEFAULTS.ts`,
  `hero.ts`, `projects.ts`, `new-collegues.ts`, `initiatives.ts`, `hiring.ts`,
  `want-to-know-more.ts`, `disclaimer.ts`, `template.ts`). Git rendered `BLOCK_DEFAULTS.ts`
  and `projects.ts` as detected renames (`R`); the other 7 show as add+delete pairs in
  `git status` because their imports changed alongside the move — content is otherwise
  byte-identical, only the `../blocks/*` import paths inside `registerBlocks.ts`/`actions.ts`
  now read `./` (they live in the same folder as the block files).
- Created `editor/blocks/registerBlocks.ts` — `registerBlocks(editor)` holding the 7
  StrictMode-guarded `editor.Blocks.add(...)` calls, moved verbatim out of `onEditor`.
- Created `editor/actions.ts` — `STORAGE_KEY`, `save`, `load`, `compileDraft`,
  `assertRoundTrip`, `handleNewFromTemplate`, moved verbatim; imports `TEMPLATE_MJML`
  from `./blocks/template`.
- Renamed `editor/editorOptions.ts` → `editor/editorConfig.ts`: `styleManagerSectors`,
  `STYLABLE_BY_TYPE`, `EMAIL_SAFE_STYLE_PROPS` (still derived from `styleManagerSectors`,
  same module — no cycle), `editorOptions`, `onEditor`. `onEditor` now calls
  `registerBlocks(editor)` (imported from `./blocks/registerBlocks`) as its final step and
  imports `assertRoundTrip` from `./actions` for the `window.__ddroiddAssertRoundTrip`
  helper. Old `editorOptions.ts` deleted.
- Updated importers: `NewsletterEditor.tsx` → `{ editorOptions, onEditor }` from
  `./editorConfig`; `TopBar.tsx` → actions from `./actions`; `RightPanel.tsx` →
  `EMAIL_SAFE_STYLE_PROPS` from `./editorConfig`.
- Preserved verbatim: the plugin options object
  (`usePlugin(grapesjsMjml, { resetBlocks:false, resetDevices:false, resetStyleManager:false })`
  passed via `plugins:[]`), `storageManager:false`, `height:'100%'`, the full
  `styleManager.sectors` object, and the exact `onEditor` operation order — (1) window
  helpers, (2) empty-canvas scaffold + `UndoManager.clear()`, (3)
  `StyleManager.getSectors().reset(...)`, (4) `component:selected` → per-instance
  `stylable`, (5) remove `devices-c` panel, (6) `registerBlocks(editor)`.

### Task 2: Code-split the editor with React.lazy + sized Suspense skeleton
- Created `editor/EditorSkeleton.tsx` — full-screen 3-panel skeleton matching
  `NewsletterEditor`'s real layout dimensions (`h-14` top bar, `w-[280px]` left rail —
  confirmed against `LeftSidebar.tsx`'s actual `w-[280px]`, `w-[300px]` right panel)
  with `bg-muted`/`animate-pulse` placeholders. No `fallback={null}`.
- Updated `App.tsx` to lazy-load the named export via
  `lazy(() => import('@/editor/NewsletterEditor').then(m => ({ default: m.NewsletterEditor })))`
  inside `<Suspense fallback={<EditorSkeleton />}>`.
- Verified via `npm run build`: the editor is a distinct chunk
  (`dist/assets/NewsletterEditor-*.js`, ~2.46 MB / 688 KB gzip) separate from the main
  entry chunk (`dist/assets/index-*.js`, ~227 KB / 72 KB gzip).

### Task 3: Add reusable ErrorBoundary and finalize App.tsx composition
- Created `components/ErrorBoundary.tsx` — class component (documented exception to
  code-style.md's arrow/`type`-only conventions, since `getDerivedStateFromError` +
  `componentDidCatch` require a class). Props: `children`, optional `fallback`. Default
  fallback: centered "Something went wrong" panel with a Reload button
  (`window.location.reload()`). Logs via `componentDidCatch`.
- Updated `App.tsx`: `ErrorBoundary` → `Suspense(fallback=EditorSkeleton)` → lazy
  `NewsletterEditor`, with a comment marking the future auth-guard/react-router seam
  (no auth or routing added — Phase 1 gate). `App` remains the default export.

## Verification performed

- `cd app/client && npm run typecheck` — clean, no errors, after each task.
- `cd app/client && npm run build` — succeeds; produces a separate
  `NewsletterEditor-*.js`/`.css` chunk distinct from the main entry chunk (confirms the
  code-split).
- Manual read-through diff of `editorConfig.ts` against the original `editorOptions.ts`
  to confirm the plugin options object, `storageManager`/`height`/`styleManager.sectors`
  values, and the exact `onEditor` operation order were preserved verbatim (no `git mv`
  baseline existed for these split files since content was hand-partitioned across three
  new modules, so this line-by-line comparison was the available check).
- No block content string was touched; no self-closing `mj-*` tags introduced (files were
  moved, not edited, apart from `registerBlocks.ts`/`actions.ts`/`editorConfig.ts` which
  only touch import paths and JS/TS logic, never MJML strings).

## REQUIRED BEFORE MERGE — NOT verified in this session (no browser available)

Per the plan's own warning ("a green typecheck is necessary but NOT sufficient proof" —
this codebase has documented runtime-only failures — pluginsOpts silent no-op,
`resetStyleManager` clobbering sectors in `onReady`, self-closing mj-* tags — that pass
every static gate), the following runtime checks from the plan's `<verify>` blocks were
**not** performed and must be run manually (`npm run dev` from repo root) before this is
considered done:

1. Editor mounts with **0 console errors**, shows the 3-panel shell.
2. Blocks panel lists **~22 chips** (7 DDROIDD branded + 15 generic).
3. Select an `mj-text`: right panel shows editable **padding**, and does **not** expose
   flex/position/box-shadow/margin.
4. Click **Save** → **Load** → **Assert round-trip** (overflow menu): console must log
   `[ddroidd] Round-trip identical: true`.
5. **New from Template** seeds the full 7-section template onto the canvas.
6. **Preview & Compile** succeeds (POST `/api/compile`, HTML returned).
7. The sized `EditorSkeleton` flashes before the editor mounts with **no layout jump**.
8. Throwing inside `NewsletterEditor` (temporarily) shows the `ErrorBoundary` fallback
   instead of a blank white app.

## Deviations from Plan

None — plan executed exactly as written. `git status` shows `BLOCK_DEFAULTS.ts` and
`projects.ts` as detected renames and the other 7 block files as add+delete pairs; this
is a git rename-heuristic artifact (similarity threshold), not a content deviation — all
9 files moved with unchanged content.

## Changed files

**Deleted:**
- `app/client/src/editor/editorOptions.ts`

**Moved (`git mv`, content unchanged) — `app/client/src/blocks/*` → `app/client/src/editor/blocks/*`:**
- `BLOCK_DEFAULTS.ts`, `hero.ts`, `projects.ts`, `new-collegues.ts`, `initiatives.ts`,
  `hiring.ts`, `want-to-know-more.ts`, `disclaimer.ts`, `template.ts`

**Created:**
- `app/client/src/editor/actions.ts`
- `app/client/src/editor/editorConfig.ts`
- `app/client/src/editor/blocks/registerBlocks.ts`
- `app/client/src/editor/EditorSkeleton.tsx`
- `app/client/src/components/ErrorBoundary.tsx`

**Modified (import paths only, per-file diffs are import-line changes plus, for `App.tsx`, the lazy/Suspense/ErrorBoundary composition):**
- `app/client/src/App.tsx`
- `app/client/src/editor/NewsletterEditor.tsx`
- `app/client/src/editor/TopBar.tsx`
- `app/client/src/editor/RightPanel.tsx`

## Self-Check

- `app/client/src/editor/actions.ts` — FOUND
- `app/client/src/editor/editorConfig.ts` — FOUND
- `app/client/src/editor/blocks/registerBlocks.ts` — FOUND
- `app/client/src/editor/EditorSkeleton.tsx` — FOUND
- `app/client/src/components/ErrorBoundary.tsx` — FOUND
- `app/client/src/blocks/` (old location) — CONFIRMED REMOVED
- `app/client/src/editor/blocks/` contains all 9 moved files + `registerBlocks.ts` — FOUND
- `npm run typecheck` — PASSED (no errors)
- `npm run build` — PASSED; `dist/assets/NewsletterEditor-*.js` emitted as a distinct chunk from `dist/assets/index-*.js`

## Self-Check: PASSED

## Suggested commit message (per no-commit.md — developer commits manually)

```
refactor(app-client): split editor config/actions/blocks, lazy-load editor, add ErrorBoundary

- Move blocks/ under editor/blocks/; extract registerBlocks(editor) and actions.ts
  (save/load/compileDraft/assertRoundTrip/handleNewFromTemplate) out of the monolithic
  editorOptions.ts, renamed to editor/editorConfig.ts (config + onEditor setup only)
- Code-split the GrapesJS editor behind React.lazy + a sized EditorSkeleton Suspense
  fallback (separate build chunk, off the initial critical path)
- Add a reusable class-based ErrorBoundary wrapping App.tsx, with a documented seam
  for a future auth-guard/route wrapper
- Behavior-preserving: plugin options, storageManager/height/styleManager.sectors, and
  the onEditor operation order are unchanged; no block content strings touched

NOTE: typecheck + build verified clean; runtime smoke (console errors, ~22 block chips,
email-safe sectors, save/load/round-trip/compile/template) not re-verified in this
session — see SUMMARY.md "REQUIRED BEFORE MERGE" before merging.
```

## Runtime verification (orchestrator, 2026-07-05, Playwright @ localhost:5175)

- Editor mounts after lazy load; canvas iframe present — PASS
- 0 console errors after mount and after template load — PASS
- Branded block chips render (Hero, Projects, New Collegues, Initiatives, Hiring, Want To Know More, Disclaimer) + generic BLOCKS section — PASS
- "New from Template" seeds canvas: 214 nodes, June digest content renders — PASS
- Not re-verified this session: Save/Load round-trip, compile endpoint, ErrorBoundary catch path, layout-shift check
