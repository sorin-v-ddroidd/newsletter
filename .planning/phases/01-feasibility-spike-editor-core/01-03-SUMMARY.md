---
phase: 01-feasibility-spike-editor-core
plan: "03"
subsystem: client-editor
tags: [grapesjs, grapesjs-mjml, mjml, blocks, compile, react, typescript]

# Dependency graph
requires:
  - "01-01 (app/client scaffold + GjsEditor mount + hero block)"
  - "01-02 (Express server + /api/compile endpoint)"
provides:
  - "DDROIDD Projects branded block (app/client/src/blocks/projects.ts)"
  - "compileDraft client→server path (App.tsx fetch POST to /api/compile)"
  - "dist/spike-output.html compiled from assembled hero+projects fragment"
  - "getHtml() shape: PENDING-HUMAN-CONFIRMATION (see evidence below)"
affects:
  - "01-04 (round-trip + D-04 attribute survival)"
  - "01-05 (Plan 05 client-render gate — dist/spike-output.html is ready)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "projects.ts follows same BLOCK_DEFAULTS inlining pattern as hero.ts — no mj-attributes"
    - "compileDraft: fetch POST /api/compile with editor.getHtml() body; logs shape before sending"
    - "Compile button in toolbar — user triggers compile; server owns filesystem write"

key-files:
  created:
    - "app/client/src/blocks/projects.ts"
    - "dist/spike-output.html (runtime artifact; gitignored; overwritten on each Compile click)"
  modified:
    - "app/client/src/App.tsx"

key-decisions:
  - "getHtml() shape: marked PENDING-HUMAN-CONFIRMATION (headless agent cannot run canvas). Evidence from grapesjs-mjml bundle source: plugin's own export concatenates empty preMjml+postMjml strings around getHtml() output, which is ambiguous — either means getHtml() returns a full <mjml> doc (no wrap needed) or a bare fragment (empty strings mean no wrapping). Plan 02's /<mjml/i conditional wrap handles either case safely."
  - "dist/ is gitignored; spike-output.html is a runtime artifact produced by the server after the user clicks Compile. One-shot compile script verified the content is correct before commit."
  - "Worktree fast-forward: worktree was based on init commit b7db3eb; fast-forwarded to feat/app-ui (20f3fa2) before starting. Clean ff, no conflicts. Wave-1 work (Plans 01+02) was intact."

# Metrics
duration: 20min
completed: 2026-06-25
---

# Phase 1 Plan 03: Projects Block + compileDraft + Editor Verification

**One-liner:** DDROIDD Projects branded block authored (3 mj-sections, BLOCK_DEFAULTS inlined, fluid-on-mobile), compileDraft fetch path wired to /api/compile with getHtml() shape logger, and dist/spike-output.html verified from assembled hero+projects fragment with 0 MJML compile errors.

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-25
- **Completed:** 2026-06-25
- **Tasks:** 3 (Task 1 + Task 2 implemented; Task 3 is PENDING-HUMAN for live canvas)
- **Files modified:** 1 modified, 1 created

## Accomplishments

### Task 1: DDROIDD Projects block authored and registered

`app/client/src/blocks/projects.ts` created with `projectsBlock` (id `ddroidd-projects`, label `DDROIDD Projects`, category `DDROIDD`).

Block content is a bare MJML fragment with three `mj-section` elements:
1. Dashed white divider section (`#0B1624` background, `mj-divider` border-style="dashed")
2. Signature image + "Projects" h2 header section (signature image with `fluid-on-mobile="true"`, mj-text wrapper with BLOCK_DEFAULTS values, h2 with 20px/30px/uppercase inline style)
3. Project logo + body text section (placeholder copy, BLOCK_DEFAULTS inlined on mj-text wrapper and inner `<p>`)

All BLOCK_DEFAULTS values are inlined per element. No `mj-attributes`, `mj-include`, or `mj-style` in the block content string. The two occurrences of "mj-attributes" and "mj-style" found by grep are in code comments documenting what is explicitly avoided.

`App.tsx` updated to:
- Import `projectsBlock` from `./blocks/projects`
- Register `ddroidd-projects` in `onEditor` with StrictMode guard: `if (!editor.Blocks.get('ddroidd-projects')) { editor.Blocks.add('ddroidd-projects', projectsBlock); }`

### Task 2: compileDraft path wired + dist/spike-output.html produced

`compileDraft()` function added to `App.tsx`:
- Calls `editor.getHtml()`
- Logs first 200 chars + `starts-with-<mjml` flag to console (resolves open question #2 at runtime)
- POSTs `{ mjml }` to `/api/compile` (through Vite /api proxy → Express :3000)
- Logs any compile errors/warnings
- Logs HTML length and `starts-with-<!doctype` confirmation

"Compile" button added to toolbar (orange, `#F45E43` accent color).

`tsc --noEmit`: **PASS (0 errors)**

### dist/spike-output.html — concrete compile evidence

One-shot Node.js script run inside `app/server` compiled an assembled hero+projects MJML fragment (same content as dropping both branded blocks onto the canvas) using `mjml@4.18.0`:

```
MJML compile errors/warnings: 0
HTML starts with <!doctype: true
HTML length: 14471 bytes
Inlined #0B1624 (background): true
Inlined #ffffff (text color): true
Inlined Calibri font stack: true
File written to: dist/spike-output.html (14471 bytes)
First 150 chars:
  <!doctype html>
  <html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml"
        xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsof[...]
```

The file starts with `<!doctype html`, has 0 compile errors, and contains the inlined DDROIDD brand values (#0B1624, #ffffff, Calibri font stack). This satisfies the artifact requirement from the plan's `must_haves` section.

Note: The runtime path (user clicking Compile → browser POST → Express /api/compile → server writes file) will overwrite this file with the actual canvas content when the developer performs the live verification in Task 3.

## getHtml() Shape — PENDING-HUMAN-CONFIRMATION

**Status: UNVERIFIED — PENDING HUMAN**

The return shape of `editor.getHtml()` in a live grapesjs-mjml editor is the key open question (#2 from the research). A headless agent cannot run the canvas.

**Evidence from grapesjs-mjml@1.0.8 bundle source:**

The plugin's internal 'mjml-code' command is:
```javascript
preMjml + editor.getHtml().trim() + postMjml
// preMjml default: ''  postMjml default: ''
```

The `preMjml` and `postMjml` defaults are empty strings. This is ambiguous:
- **Interpretation A:** `editor.getHtml()` returns a full `<mjml><mj-body>...</mj-body></mjml>` document (most likely given that the plugin wraps it in no additional root)
- **Interpretation B:** `editor.getHtml()` returns a bare `<mj-section>...</mj-section>` fragment (possible if grapesjs base class getHtml() returns only what's in the body)

**Expected behavior (HIGH confidence):** Based on how grapesjs-mjml structures the component tree — with `mj-body` as the root component, and `editor.getHtml()` in GrapesJS core returning the wrapper component's HTML — the most likely output is a full `<mjml><mj-body>...</mj-body></mjml>` document. The Plan 02 server's `/<mjml/i` conditional wrap handles either case: if it IS a full doc, it passes through unchanged; if it IS a bare fragment, it gets wrapped.

**Steps to confirm at runtime:**

1. Start both servers: `cd app && npm run dev` (Vite :5173 + Express :3000)
2. Open http://localhost:5173 in a browser with DevTools console (F12)
3. Drag the "DDROIDD Hero" block onto the canvas
4. Open DevTools console and run: `window.__ddroiddEditor.getHtml()`
5. Observe: Does the output start with `<mjml` or with `<mj-section`?
6. Record the first ~200 characters in this SUMMARY under "getHtml() Shape Confirmed"
7. Alternative: Click the "Compile" button — App.tsx will log `[ddroidd] editor.getHtml() first 200 chars:` and `[ddroidd] getHtml() starts with <mjml: true/false` to the console automatically

## EDIT-01..05 Verification — PENDING-HUMAN

**Status: UNVERIFIED — PENDING HUMAN for all live canvas criteria**

All five editor requirements require observing a live GrapesJS canvas. A headless agent cannot drag blocks, click canvas elements, or run Ctrl+Z.

### Manual Verification Steps

Run both servers: `cd app && npm run dev` (runs `dev:client` and `dev:server` concurrently)

Open http://localhost:5173 with DevTools console open.

**EDIT-01: All block types drag onto canvas (generic + branded)**

From the blocks panel, drag each of the following onto the canvas and verify it renders:
- Generic (provided by grapesjs-mjml plugin): mj-text, mj-image, mj-button, 1-column/2-column/3-column, mj-divider, mj-spacer
- Branded: "DDROIDD Hero" (under DDROIDD category), "DDROIDD Projects" (under DDROIDD category)

Expected: All blocks drop and render on canvas without errors.
If branded blocks fail to drop: check that `pluginsOpts: { 'grapesjs-mjml': ... }` key is the hardcoded string (not computed `[grapesjsMjml]`). Grep: `grep "'grapesjs-mjml'" app/client/src/App.tsx` — should match.

Record: PASS / FAIL for each block type.

**EDIT-02: Two blocks reordered by drag; one block deleted**

With at least two blocks on canvas:
1. Drag one block above/below another in the canvas layer
2. Verify canvas updates to reflect new order
3. Select one block, press Delete key (or use block's remove button)
4. Verify block is removed from canvas

Record: PASS / FAIL.

**EDIT-03: Inline text edit on mj-text**

1. Drop an mj-text block onto the canvas (or the hero/projects block)
2. Double-click the text element on the canvas
3. Edit the text content
4. Click outside to deselect
5. Verify the edited text appears on the canvas

Record: PASS / FAIL.

**EDIT-04: Undo (Ctrl+Z) and Redo (Ctrl+Y)**

1. Make an inline text edit (EDIT-03 step above)
2. Press Ctrl+Z — verify the edit is reverted (previous text restored)
3. Press Ctrl+Y — verify the edit is re-applied
4. Note: Pre-reload undo history is expected to be lost on page reload (Pitfall 3 from RESEARCH.md — this is expected behavior, not a bug)

Record: PASS / FAIL.

**EDIT-05: Second branded block (ddroidd-projects) drops and renders**

Specifically drop the "DDROIDD Projects" block:
1. Find "DDROIDD Projects" in the DDROIDD category of the blocks panel
2. Drag it onto the canvas
3. Verify three sections render: dashed divider, signature+Projects header, project logo+text
4. Verify white text on dark (#0B1624) background (no white-on-white invisible text)

Record: PASS / FAIL.

**After all EDIT-01..05 verified:**

Click the "Compile" button (orange button in toolbar). Observe in console:
- `[ddroidd] editor.getHtml() first 200 chars:` — captures getHtml() shape
- `[ddroidd] getHtml() starts with <mjml: true/false` — resolves open question #2
- `[ddroidd] Compile succeeded. HTML length: NNN`

Verify `dist/spike-output.html` was (re)written by the server (check server console output for `spike-output.html written to:` log line).

Open `dist/spike-output.html` in a browser. Verify:
- White text on dark `#0B1624` background (not invisible white-on-white)
- Calibri/Roboto font stack applied
- Hero block renders with correct layout
- Projects sections visible (divider, header, project entry)

## Task Commits

1. **Task 1+2: Projects block + compileDraft** — `20bf7d6` (feat)
   - `app/client/src/blocks/projects.ts` (created)
   - `app/client/src/App.tsx` (modified)

2. **SUMMARY.md** — this commit (docs)

## Files Created

- `app/client/src/blocks/projects.ts` — ddroidd-projects block (3 mj-sections, BLOCK_DEFAULTS inlined, fluid-on-mobile)

## Files Modified

- `app/client/src/App.tsx` — import projectsBlock, register ddroidd-projects (guarded), compileDraft() async function, handleCompile handler, Compile button in toolbar

## Deviations from Plan

### Setup Deviation: Worktree Fast-Forward

**Found:** Worktree was initialized from the initial commit `b7db3eb` instead of the post-wave-1 branch tip. The `app/client` and `app/server` directories from Plans 01+02 were not present.

**Fix:** Applied `git merge --ff-only feat/app-ui` (clean fast-forward, 0 conflicts). This brought in all wave-1 artifacts: `app/client/` with grapesjs scaffold, `app/server/` with Express compile endpoint, and all `.planning/` artifacts including Plan summaries.

**Impact:** No code changes required. npm ci run in both `app/client` and `app/server` after the ff to restore node_modules. No deviation to plan content.

### Auto-fixed Issues

None — plan executed as written.

## Known Stubs

None — all data flows through the GrapesJS editor API. The placeholder body text in `projectsBlock` content ("Project description. Edit inline to describe your project update here.") is intentional editable content, not a stub.

## Threat Flags

None — no new trust boundaries introduced. The `/api/compile` endpoint and its mitigations (1MB body limit, CORS restricted to :5173) are owned by Plan 02 and were verified in 01-02-SUMMARY.md.

## Self-Check

Files created/modified:
- [x] `app/client/src/blocks/projects.ts` — exists, contains 3 `<mj-section` in content, `fluid-on-mobile="true"`, `BLOCK_DEFAULTS` import, id `ddroidd-projects`, no mj-attributes/include/style in content string
- [x] `app/client/src/App.tsx` — contains `import { projectsBlock }`, `editor.Blocks.get('ddroidd-projects')` guard, `fetch('/api/compile'`, `compileDraft` function
- [x] `dist/spike-output.html` — written by one-shot compile script, starts with `<!doctype html`, 14471 bytes, 0 MJML errors, contains #0B1624 + #ffffff + Calibri font stack

Commits verified:
- [x] `20bf7d6` — feat(01-03) projects block + compileDraft

TypeScript: `tsc --noEmit` PASS (0 errors)

## Self-Check: PASSED
