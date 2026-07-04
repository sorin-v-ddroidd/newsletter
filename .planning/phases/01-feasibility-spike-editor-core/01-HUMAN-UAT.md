---
status: partial
phase: 01-feasibility-spike-editor-core
source: [01-VERIFICATION.md]
started: 2026-07-04T00:00:00Z
updated: 2026-07-04T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Dev script starts both servers in parallel
expected: `npm run dev` from `app/` starts Vite (:5173) and Express (:3000) simultaneously; `netstat -ano | findstr :3000` shows LISTENING
result: [pending]

### 2. Editor mounts with visible blocks panel
expected: http://localhost:5173 renders GrapesJS default UI — blocks panel in left sidebar, style manager, layers, device bar; no red console errors. If panel renders unstyled, drop the `grapesjsCss` unpkg prop (local pinned import already covers 0.22.16 CSS)
result: [pending]

### 3. Blocks drag, render, reorder, delete (EDIT-01, EDIT-02, EDIT-05)
expected: branded (hero, projects) + generic blocks drag onto canvas, render correctly, can be reordered and deleted
result: [pending]

### 4. Inline text edit + undo/redo (EDIT-03, EDIT-04)
expected: double-click text edits inline; Ctrl+Z undoes, Ctrl+Y redoes
result: [pending]

### 5. Project-JSON round-trip lossless (Criterion 3)
expected: `window.__ddroiddAssertRoundTrip()` in browser console prints "Round-trip identical: true"; `background-url` and `fluid-on-mobile` survive in project JSON
result: [pending]

### 6. Compile end-to-end (Criterion 4, partial)
expected: Compile button POSTs to /api/compile through Vite proxy → 200 (not 502); `dist/spike-output.html` written; renders visually correct in browser
result: [pending]

### 7. Outlook + Gmail render (Criterion 4 — CLIENT-RENDER-GATE)
expected: compiled spike-output.html renders correctly in Outlook (via QuickEmailTest.ps1 on COM-capable classic-Outlook machine) and Gmail (via EmailTester.ps1) — no broken fonts, no dark-on-dark, no collapsed spacing
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
