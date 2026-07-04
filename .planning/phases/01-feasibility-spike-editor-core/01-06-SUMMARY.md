---
phase: 01-feasibility-spike-editor-core
plan: "06"
subsystem: editor-ui + dev-tooling
tags: [gap-closure, grapesjs, blocks-panel, windows-dev-script, concurrently]
dependency_graph:
  requires: []
  provides: [blocks-panel-visible, dev-script-parallel-windows]
  affects: [01-UAT]
tech_stack:
  added: [concurrently@10.0.3]
  patterns: [default-UI-mode, parallel-dev-launcher]
key_files:
  modified:
    - app/client/src/App.tsx
    - app/package.json
  deleted:
    - app/client/src/lib/editorConfig.ts
  created:
    - app/package-lock.json
decisions:
  - "Self-closing <Editor /> (no child) triggers @grapesjs/react default-UI mode — simpler and unambiguous than appendTo fallback"
  - "Comment above Editor worded without '<Canvas' token to avoid grep false-positives at verification"
  - "grapesjsCss unpkg prop left untouched per plan scope; CSS-looks-wrong is a downstream UAT judgment"
  - "editorConfig.ts deleted — 0 importers confirmed, kills drift risk"
  - "concurrently pinned via package-lock.json; threat register T-01-SC pre-cleared (mitigate disposition)"
metrics:
  duration: "~15 minutes"
  completed: "2026-07-04"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 01 Plan 06: Gap-Closure (Blocks Panel + Windows Dev Script) Summary

**One-liner:** Removed `<Canvas>` child to activate GrapesJS default-UI mode (blocks panel) and replaced the `&`-chained dev script with `concurrently` to fix the Windows cmd.exe sequential-execution bug that blocked Express :3000.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Render default GrapesJS UI (remove Canvas child) + delete dead editorConfig.ts | 7dee3fb | App.tsx (modified), editorConfig.ts (deleted) |
| 2 | Run client + server in parallel via concurrently (fix Windows dev script) | a12bf01 | app/package.json, app/package-lock.json |

## What Was Built

### Task 1: Blocks panel fix

`<Editor>` in `App.tsx` was rendered with a `<Canvas />` child, which put `@grapesjs/react` into **custom-UI mode** (`customUI: true`, `panels: { defaults: [] }`). All registered blocks existed in `editor.Blocks` but had no panel to drag from.

Fix: made `<Editor />` self-closing (no children). This triggers default-UI mode, rendering the stock GrapesJS chrome — blocks panel, style manager, layers, device bar. The explanatory comment above the element is worded without the `<Canvas` literal to keep grep-based verification clean.

Also deleted `app/client/src/lib/editorConfig.ts` — dead code (0 importers confirmed via grep); App.tsx already inlines all options; removal eliminates a drift risk flagged in 01-UAT.md.

### Task 2: Windows dev script fix

`app/package.json`'s `dev` script used `&` to chain two servers:
```
"dev": "npm run dev:client & npm run dev:server"
```
Under cmd.exe on Windows, `&` is **sequential** — Vite never exits, so `dev:server` never starts and nothing listens on :3000. The Vite proxy target was unreachable, causing 502 on every `/api/compile` call.

Fix: installed `concurrently` (devDependency) and changed the script to:
```
"dev": "concurrently -n client,server \"npm run dev:client\" \"npm run dev:server\""
```
Both processes now start in parallel. `package-lock.json` committed as the version pin.

## Deviations from Plan

None — plan executed exactly as written. The advisor flag to avoid putting `<Canvas` in the comment was followed; the comment is placed above `<Editor />` and avoids the token.

## Known Stubs

None. This plan is dev-tooling only — no data flows, no UI components, no placeholder content.

## Threat Flags

None new. The only surface change is `concurrently` (T-01-SC, threat register pre-cleared as "mitigate"); the `grapesjsCss` unpkg URL (T-01-01, "accept") was left untouched per plan scope.

## Verification Status

**Automated (this plan):**
- `grep Canvas src/App.tsx` → zero matches
- `editorConfig.ts` deleted; `tsc --noEmit` clean
- `grep concurrently package.json` → found; `node -e` script check → exit 0

**Runtime (pending human UAT):**
- Blocks panel visible at http://localhost:5173 (UAT tests 3-6, 8)
- `npm run dev` from `app/` boots both servers; `netstat` shows :3000 LISTENING; POST /api/compile through proxy returns 200; spike-output.html written (UAT tests 9-10)

## Self-Check: PASSED

- `app/client/src/App.tsx` — modified, Canvas removed, Editor self-closing
- `app/client/src/lib/editorConfig.ts` — deleted
- `app/package.json` — dev script uses concurrently
- `app/package-lock.json` — created, staged, committed
- Commit 7dee3fb — Task 1
- Commit a12bf01 — Task 2
