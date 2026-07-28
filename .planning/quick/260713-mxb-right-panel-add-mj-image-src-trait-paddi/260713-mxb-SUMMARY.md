---
phase: quick-260713-mxb
plan: 01
subsystem: editor-right-panel
tags: [grapesjs, mj-image, padding, right-panel, ui]
dependency-graph:
  requires: []
  provides: [mj-image-src-trait, composePaddingShorthand, collapsible-right-panel-sections]
  affects: [app/client/src/editor/editorConfig.ts, app/client/src/editor/RightPanel.tsx, app/client/src/editor/panelControls.tsx]
tech-stack:
  added: [vitest@4.1.10, jsdom (devDependency)]
  patterns: [addType-shallow-merge-traits, presentation-only-display-fallback, per-section-useState-toggle]
key-files:
  created:
    - app/client/src/editor/editorConfig.test.ts
  modified:
    - app/client/src/editor/editorConfig.ts
    - app/client/src/editor/RightPanel.tsx
    - app/client/src/editor/panelControls.tsx
    - app/client/vite.config.ts
    - app/client/package.json
    - app/client/package-lock.json
decisions:
  - "Installed vitest + jsdom as devDependencies — the project's testing.md rule mandates Vitest but no test runner was actually installed yet; verified vitest is the genuine npm package (npm view vitest version) before installing."
  - "vite.config.ts test.environment set to 'jsdom' (not the vitest default 'node') because editorConfig.ts imports grapesjs-mjml at module top-level, which reads `window` during import (mjml-browser bundled dep) — node environment throws ReferenceError before any test runs."
metrics:
  duration: "~45m"
  completed: "2026-07-13"
---

# Phase quick-260713-mxb Plan 01: Right Panel mj-image src trait + padding fallback + collapsible sections Summary

Extended `mj-image` with an editable `src` trait, added a presentation-only padding-shorthand display fallback derived from longhand styles, and made right-panel section headers independently collapsible — all three are presentation-layer only, so the Phase-1 project-JSON round-trip stays byte-identical by construction.

## What was built

**Task 1 — mj-image src trait** (`editorConfig.ts`): grapesjs-mjml@1.0.8 registers `mj-image` with traits `['href','rel','alt','title']` and no `src` trait, so the Content section never showed the image URL. Added `MJ_IMAGE_TRAITS` (`src`/`href`/`alt`, dropping `rel`/`title` as non-dev noise) and called `editor.Components.addType('mj-image', { model: { defaults: { traits: MJ_IMAGE_TRAITS } } })` — `addType` on an existing type shallow-merges `model.defaults`, so `traits` is replaced while the plugin's `isComponent`/`view`/`stylable` are inherited untouched.

**Task 2 — padding shorthand display fallback** (TDD): `composePaddingShorthand(top, right, bottom, left)` in `editorConfig.ts` is the pure inverse of the existing `parsePaddingShorthand`, collapsing four longhand values into the shortest equivalent CSS shorthand (1/2/3/4-value collapse rules). Covered by `editorConfig.test.ts` (4 cases). `PairedField` (`panelControls.tsx`) gained an optional `displayValue?: string` prop — used only when the live `prop.getValue()` is empty, so the fallback never masks a real (possibly empty-string) value. `RightPanel.tsx` derives `paddingDisplay` from `selected.getStyle()`'s four longhand styles (read-only — no `addStyle`/`addAttributes`/`upValue`), returning `undefined` unless all four longhands are present, and passes it to both padding `PairedField` call sites (grid branch and standalone branch).

**Task 3 — collapsible section headers** (`RightPanel.tsx`): `Section` now owns local `useState(true)` open/closed state (intentionally per-section, not a shared accordion). The header row is a `<button type="button" aria-expanded={open}>`; the `ChevronDown` rotates `-rotate-90` when closed via `cn()` + `transition-transform`. The children container renders conditionally on `open` (header stays visible so it can be reopened). Removed the decorative static chevron from the top selected-name header (`renderHeader`) since it was misleading now that real chevrons toggle.

## Test infrastructure added

The project's `testing.md` rule mandates Vitest, but no test runner was actually installed. Installed `vitest` (verified legitimate via `npm view vitest version` before installing — 4.1.10) and `jsdom` as devDependencies, and set `test: { environment: 'jsdom' }` in `vite.config.ts` (via `defineConfig` from `vitest/config`) because `editorConfig.ts` imports `grapesjs-mjml` at module top-level, which reads `window` during import — the default Node test environment throws before any test body runs.

TDD gate followed: RED commit (`5ae50f1`) added the test file + test infra with the implementation temporarily reverted (test failed with `TypeError: composePaddingShorthand is not a function`), GREEN commit (`784f770`) reapplied `composePaddingShorthand` + the `PairedField`/`RightPanel` wiring and confirmed all 4 tests pass.

## Deviations from Plan

**1. [Rule 3 - blocking issue, package install] Installed vitest + jsdom.** The plan's Task 2 verify step (`npx vitest run src/editor/editorConfig.test.ts`) requires a test runner that was not present in `app/client/package.json` or `node_modules`. Per the package-manager-install exclusion, verified the package is legitimate (`npm view vitest version` returned a real published version, `4.1.10`) before installing — this is the project's own mandated test stack (`testing.md`: "Stack: Vitest only"), not a new/uncertain dependency. Also created `vite.config.ts` `test.environment: 'jsdom'` since none existed. Files: `app/client/package.json`, `app/client/package-lock.json`, `app/client/vite.config.ts`. No separate commit — bundled into the RED (`test:`) commit since it's test infrastructure, not app behavior.

**2. [environment setup] Worktree had no `node_modules`.** Not present in the isolated worktree checkout. Initially tried a Windows junction to the main tree's `node_modules` to run `tsc` without installing; running `npm install --save-dev vitest` afterward replaced the junction with a full local `node_modules` in the worktree (npm's reify step removes non-directory entries it doesn't recognize as its own — the junction was a symlink target, not a real directory). Confirmed the main tree's `node_modules` at `D:\Projects\newsletter\app\client\node_modules` was unaffected. No code changes; purely a local dev-environment step, not committed (node_modules is gitignored).

No other deviations — plan executed as written.

## Deferred runtime verification

This worktree is isolated from the running dev server on :5174 (which serves the main tree). The following steps from the plan's `<verify>` blocks require the orchestrator to run against the main tree after merge:

- **Task 1:** Select an image on the canvas → confirm the right-panel Content section shows an "Image URL" field prepopulated with the image's `src`, plus "Link URL" and "Alt text". Confirm the image still renders on canvas and an image block still drags/drops from the left panel.
- **Task 2:** Select a text/image block whose padding exists only as longhands → confirm the Appearance "P" field shows the composed shorthand (e.g. "10px 25px"). Edit it and confirm it still writes/updates canvas padding. Run `window.__ddroiddAssertRoundTrip()` in the console after selecting (no edit) to confirm round-trip byte-identity.
- **Task 3:** Click a section header (e.g. "Typography") → confirm its body collapses and the chevron rotates; click again → expands. Confirm sections toggle independently. Confirm the top selected-name header no longer shows a chevron.

## Self-Check

Verified created/modified files exist and commits are present in git log.

- FOUND: app/client/src/editor/editorConfig.ts
- FOUND: app/client/src/editor/editorConfig.test.ts
- FOUND: app/client/src/editor/RightPanel.tsx
- FOUND: app/client/src/editor/panelControls.tsx
- FOUND: app/client/vite.config.ts
- FOUND commit: bb82214 (feat — mj-image src trait)
- FOUND commit: 5ae50f1 (test — RED, composePaddingShorthand)
- FOUND commit: 784f770 (feat — GREEN, padding fallback)
- FOUND commit: c58c540 (feat — collapsible sections)

## Self-Check: PASSED
