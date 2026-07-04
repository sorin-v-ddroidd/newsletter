---
status: partial
phase: 01-feasibility-spike-editor-core
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md
started: 2026-07-04T10:11:27Z
updated: 2026-07-04T10:11:27Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev servers. From /app run `npm run dev`. Vite client boots on :5173 and Express server boots on :3000 with no errors in either console.
result: pass

### 2. Editor Mounts Clean (Criterion 1)
expected: Open http://localhost:5173 with DevTools console open. GrapesJS canvas is visible, no red console errors. Blocks panel shows generic MJML blocks (text, image, button, 1/2/3-column, divider, spacer) plus "DDROIDD Hero" and "DDROIDD Projects" under a DDROIDD category.
result: pass

### 3. Blocks Drag Onto Canvas (EDIT-01, EDIT-05)
expected: Drag several generic blocks (mj-text, mj-image, mj-button) and both branded blocks onto the canvas. All drop and render. DDROIDD Projects shows 3 sections (dashed divider, signature + "Projects" header, project entry) with white text on dark #0B1624 background — no invisible white-on-white text.
result: issue
reported: "i don't have anything to drag and drop. My vision for this app is something similar with what activecampaign did — https://www.activecampaign.com/platform/email-designer (screenshot: left sidebar shows only device icons, no blocks panel; canvas empty)"
severity: blocker

### 4. Reorder and Delete Blocks (EDIT-02)
expected: With two+ blocks on canvas, drag one above/below another — canvas reflects new order. Select a block and delete it — block is removed.
result: blocked
blocked_by: other
reason: "No blocks panel (test 3 blocker) — cannot get blocks onto canvas to reorder/delete"

### 5. Inline Text Edit (EDIT-03)
expected: Double-click a text element on the canvas, edit the text, click outside. Edited text persists on canvas.
result: blocked
blocked_by: other
reason: "No blocks panel (test 3 blocker) — no text element on canvas to edit"

### 6. Undo / Redo (EDIT-04)
expected: After a text edit, Ctrl+Z reverts it and Ctrl+Y re-applies it. (Undo history lost after page reload is expected, not a bug.)
result: blocked
blocked_by: other
reason: "No blocks panel (test 3 blocker) — no content to edit/undo"

### 7. localStorage Round-Trip (Criterion 3)
expected: Click "Assert Round-Trip" button (or run `window.__ddroiddAssertRoundTrip()` in console). Console prints `[ddroidd] Round-trip identical: true`. Save then Load buttons restore the canvas identically.
result: pass

### 8. D-04 Attribute Survival
expected: With the Hero block on canvas, after save/load round-trip, `background-url` on mj-section and `fluid-on-mobile` on mj-image are still present in `editor.getProjectData()` JSON (inspect in console).
result: blocked
blocked_by: other
reason: "No blocks panel (test 3 blocker) — cannot place Hero block on canvas"

### 9. Compile Path End-to-End (getHtml shape + /api/compile)
expected: Click the orange "Compile" button. Console logs `[ddroidd] editor.getHtml() first 200 chars:`, `getHtml() starts with <mjml: true/false`, and `Compile succeeded. HTML length: NNN`. Server console logs spike-output.html written. No compile errors.
result: issue
reported: "POST http://localhost:5173/api/compile 502 (Bad Gateway); [ddroidd] /api/compile returned 502; also getHtml() first 200 chars logged EMPTY and starts-with-<mjml: false (canvas empty due to test-3 blocker)"
severity: blocker

### 10. Compiled Output Renders in Browser
expected: Open dist/spike-output.html in a browser. White text on dark #0B1624 background, Calibri/Roboto font stack, hero renders with layout, projects sections visible. No raw <mj-*> tags.
result: blocked
blocked_by: other
reason: "Compile 502 (test 9 issue) — no fresh spike-output.html from live canvas to inspect"

## Summary

total: 10
passed: 3
issues: 2
pending: 0
skipped: 0
blocked: 5

## Gaps

- truth: "All generic + branded blocks can be dragged from a blocks panel onto the canvas and render (EDIT-01, EDIT-05)"
  status: failed
  reason: "User reported: i don't have anything to drag and drop — no blocks panel rendered, only device-switcher icons in left sidebar; canvas empty. User's UX reference: ActiveCampaign email designer (https://www.activecampaign.com/platform/email-designer)"
  severity: blocker
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Compile button POSTs editor.getHtml() to /api/compile via Vite proxy and returns compiled HTML (server writes dist/spike-output.html)"
  status: failed
  reason: "User reported: POST http://localhost:5173/api/compile 502 (Bad Gateway) — Vite proxy cannot reach Express :3000. getHtml() also returned empty string (empty canvas, downstream of blocks-panel blocker)"
  severity: blocker
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
