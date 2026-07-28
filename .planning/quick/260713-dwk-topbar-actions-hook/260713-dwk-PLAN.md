---
phase: quick-260713-dwk-topbar-actions-hook
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/client/src/editor/hooks/useEditorActions.ts
  - app/client/src/editor/TopBar.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "TopBar.tsx component body contains no useState and no handler function definitions — only render functions (renderBrand, renderDeviceSwitcher, renderWarningBanner, renderActions) and the deviceIcon helper"
    - "Clicking 'Preview & Compile' still opens a new tab synchronously within the same click gesture (no await between the click handler and openHtmlPreview/window.open)"
    - "Save, Load, Assert round-trip, New from Template, Export HTML, Download-anyway, and Dismiss-banner all behave exactly as before (same actions.ts calls, same banner state transitions)"
  artifacts:
    - path: "app/client/src/editor/hooks/useEditorActions.ts"
      provides: "Custom hook owning ExportWarningBanner state + all TopBar handler functions"
      exports: ["useEditorActions"]
    - path: "app/client/src/editor/TopBar.tsx"
      provides: "Pure render-function component consuming useEditorActions()"
  key_links:
    - from: "app/client/src/editor/TopBar.tsx"
      to: "app/client/src/editor/hooks/useEditorActions.ts"
      via: "const { banner, handleSave, handleLoad, handleAssert, handleTemplate, handleCompile, handleExport, handleDownloadAnyway, handleDismissBanner } = useEditorActions();"
      pattern: "useEditorActions\\("
---

<objective>
Extract the non-visual stateful logic currently inlined in `TopBar.tsx` (the `banner` state, the `withEditor` wrapper, and all handler functions: handleSave, handleLoad, handleAssert, handleTemplate, handleCompile, handleExport, handleDownloadAnyway, handleDismissBanner) into a new custom hook `app/client/src/editor/hooks/useEditorActions.ts`, colocated with the existing `useSelectedComponent.ts` / `useLayerVisibility.ts` / `useBlockSearch.ts` hooks. `TopBar.tsx` becomes a pure render-function component per `.claude/rules/component-patterns.md`.

Purpose: comply with the project's "Custom Hooks" rule (component-patterns.md) — non-visual stateful logic must live in a hook, not inline in the component body. Pure refactor, zero behavior change.

Output: `useEditorActions.ts` hook + refactored `TopBar.tsx`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@app/client/src/editor/TopBar.tsx
@app/client/src/editor/actions.ts
@app/client/src/editor/hooks/useSelectedComponent.ts
@app/client/src/editor/hooks/useLayerVisibility.ts
@app/client/src/editor/hooks/useBlockSearch.ts
@.claude/rules/component-patterns.md
@.claude/rules/react-patterns.md
@.claude/rules/code-style.md
</context>

<interfaces>
<!-- Existing hook file pattern (useLayerVisibility.ts) to match exactly: return-type alias
     declared above the hook, JSDoc-free single-line comment block explaining the "why",
     named export `export const useX = (...): ReturnType => { ... }`. -->

From app/client/src/editor/actions.ts (imported functions — signatures TopBar/hook call today, unchanged):
```typescript
export const save: (editor: GrapesEditor) => void;
export const load: (editor: GrapesEditor) => void;
export const assertRoundTrip: (editor: GrapesEditor) => void;
export const handleNewFromTemplate: (editor: GrapesEditor) => void;
export const compileDraft: (editor: GrapesEditor) => CompileResult; // { html, errors }
export const exportHtml: (editor: GrapesEditor) => CompileResult;
export const triggerDownload: (html: string, filename: string) => void;
export const openHtmlPreview: (html: string) => void; // calls window.open() synchronously
export const buildExportFilename: (date?: Date) => string;
export const formatCompileError: (error: unknown) => string;
```

`window.__ddroiddEditor` is a global augmented type (declared in `editorConfig.ts`) of type `GrapesEditor | undefined` — the hook accesses it exactly as TopBar does today (`window.__ddroiddEditor`), no new abstraction.

Current `ExportWarningBanner` type (move as-is into the hook file, not exported unless TopBar needs the type — TopBar only needs the value shape, so keep it internal to the hook and expose it via the return type):
```typescript
type ExportWarningBanner = { html: string; warnings: string[] };
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create useEditorActions hook</name>
  <files>app/client/src/editor/hooks/useEditorActions.ts</files>
  <action>
Create the hook file following the exact style of `useLayerVisibility.ts` (top-of-file return-type alias, single comment block explaining intent, named `export const use...`). Move into it, verbatim in behavior:
- the `ExportWarningBanner` type
- the `banner` useState
- the `withEditor` wrapper (reads `window.__ddroiddEditor`)
- `handleSave`, `handleLoad`, `handleAssert`, `handleTemplate` (thin `withEditor(...)` wraps)
- `handleCompile` — preserve the exact synchronous body and the existing popup-blocker comment verbatim (do not add async/await anywhere in this chain; `withEditor`'s inner function must stay a plain synchronous function so the click → `openHtmlPreview` → `window.open()` chain never crosses a microtask boundary)
- `handleExport`
- `handleDownloadAnyway` (reads `banner` state directly, calls `triggerDownload` + `buildExportFilename` + `setBanner(null)`)
- `handleDismissBanner`

Import all needed functions from `../actions` (relative path from `hooks/` is one level up: `../actions`). Import `useState` from `react`. Define a `UseEditorActionsReturn` type (named per the `useLayerVisibility.ts`/`useSelectedComponent.ts` pattern) shaped as `{ banner: ExportWarningBanner | null; handleSave; handleLoad; handleAssert; handleTemplate; handleCompile; handleExport; handleDownloadAnyway; handleDismissBanner }` with each handler typed as `() => void`. Export `useEditorActions(): UseEditorActionsReturn`.

Do not touch `.claude/rules` files, `actions.ts`, or anything under `editor/blocks/`. This task only creates the new hook file — TopBar still has its own copies until Task 2.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
  </verify>
  <done>useEditorActions.ts exists, exports useEditorActions, compiles clean with tsc, contains no reference to JSX/React DOM types — just state + handlers.</done>
</task>

<task type="auto">
  <name>Task 2: Wire TopBar.tsx to the hook and strip inlined logic</name>
  <files>app/client/src/editor/TopBar.tsx</files>
  <action>
Remove from `TopBar.tsx`: the `useState` import (no longer needed — remove `useState` from the `react` import; drop the import entirely if nothing else from `react` is used), the `ExportWarningBanner` type, the `banner` state, `withEditor`, and all eight handler function definitions (handleSave, handleLoad, handleAssert, handleTemplate, handleCompile, handleExport, handleDownloadAnyway, handleDismissBanner). Remove the now-unused imports from `./actions` that moved into the hook (`assertRoundTrip`, `buildExportFilename`, `compileDraft`, `exportHtml`, `formatCompileError`, `handleNewFromTemplate`, `load`, `openHtmlPreview`, `save`, `triggerDownload`) — TopBar.tsx should have zero imports from `./actions` after this change.

Add `import { useEditorActions } from './hooks/useEditorActions';` and at the top of the component body: `const { banner, handleSave, handleLoad, handleAssert, handleTemplate, handleCompile, handleExport, handleDownloadAnyway, handleDismissBanner } = useEditorActions();` (destructure per `.claude/rules/code-style.md`).

Keep `deviceIcon`, `renderBrand`, `renderDeviceSwitcher` untouched. `renderWarningBanner` and `renderActions` keep referencing `banner`/`handleX` exactly as before — only their source changes (from local closures to the hook's return values), not their usage. The component's final `return` block is unchanged.

Preserve the existing top-of-file comment block (lines 31-34) describing TopBar's role — update only if it references implementation details that moved (it does not need to; it describes UX/architecture, not where state lives).
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
  </verify>
  <done>TopBar.tsx has no useState, no handler function bodies, and no imports from ./actions; it imports and calls useEditorActions(); tsc --noEmit passes with zero errors; grep confirms no "withEditor" or "setBanner" identifiers remain in TopBar.tsx.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| N/A | Pure client-side refactor of existing UI wiring; no new trust boundary, no new user input surface, no change to compile/export/storage logic. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|--------------|------------------|
| T-quick-260713-01 | N/A | useEditorActions.ts / TopBar.tsx | accept | No new attack surface — this relocates existing, already-reviewed logic (save/load/compile/export) verbatim with zero behavior change; no new inputs, no new external calls, no package installs. |
</threat_model>

<verification>
1. `cd app/client && npx tsc --noEmit` — zero type errors.
2. Manual smoke check (dev server): click each TopBar action (New from Template, Save, Preview & Compile, Export HTML, Load last saved via overflow menu, Assert round-trip via overflow menu) and confirm identical behavior to pre-refactor, including the warning banner appearing on a compile with errors, "Download anyway", and dismiss (X).
3. Specifically re-verify the popup-blocker-sensitive path: click "Preview & Compile" and confirm the new tab opens (not blocked) — proves the synchronous click → `openHtmlPreview` → `window.open()` chain survived the extraction with no async indirection introduced.
</verification>

<success_criteria>
- `useEditorActions.ts` hook exists, colocated in `editor/hooks/`, matching the existing hook file conventions (return-type alias, explanatory comment, no React DOM/JSX).
- `TopBar.tsx` contains only JSX/render functions (renderBrand, renderDeviceSwitcher, renderWarningBanner, renderActions) plus `deviceIcon` — no `useState`, no handler logic, no `./actions` imports.
- `tsc --noEmit` passes with zero errors.
- No behavior change: same actions called with the same arguments, same banner state transitions, same synchronous compile→preview gesture chain.
</success_criteria>

<output>
Create `.planning/quick/260713-dwk-topbar-actions-hook/260713-dwk-SUMMARY.md` when done
</output>
