---
phase: 01-feasibility-spike-editor-core
verified: 2026-07-04T00:00:00Z
status: human_needed
score: 1/5 must-haves agent-verified; 4/5 runtime-deferred (human_needed)
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 1/5 truths verified without human; 4/5 honestly deferred (not failed)
  gaps_closed:
    - "Blocks panel not visible — Canvas child removed from App.tsx; Editor now runs default-UI mode"
    - "POST /api/compile 502 — dev script fixed from sequential & to parallel concurrently; Express :3000 now starts"
    - "app/client/src/lib/editorConfig.ts dead-code deleted"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run `npm run dev` from the `app/` directory. Confirm BOTH prefixes (client, server) emit startup output in the terminal. Run `netstat -ano | findstr :3000` (Windows) and confirm LISTENING."
    expected: "Two processes start in parallel — Vite on :5173 and Express on :3000. :3000 shows LISTENING."
    why_human: "Parallel process startup with concurrently can only be confirmed by observing terminal output on the actual machine."
  - test: "Open http://localhost:5173 with DevTools console. Confirm the GrapesJS canvas renders and the left sidebar shows a blocks panel (generic MJML blocks + 'DDROIDD Hero' and 'DDROIDD Projects' under a DDROIDD category) — not just device-switcher icons."
    expected: "Blocks panel visible. No red console errors on mount. If the panel renders but looks unstyled/broken: remove the `grapesjsCss` prop from the `<Editor>` element in App.tsx (line 153) — the local pinned `import 'grapesjs/dist/css/grapes.min.css'` on line 4 already covers the 0.22.16 CSS. The unpkg URL is unversioned and resolves to 0.23.x, which could conflict with the 0.22.16 JS bundle."
    why_human: "Runtime compatibility of grapesjs@0.22.16 + grapesjs-mjml@1.0.8 is the spike's core question. Agent cannot drive a browser or observe a running GrapesJS canvas."
  - test: "Drag 'DDROIDD Hero' and 'DDROIDD Projects' blocks from the DDROIDD category in the blocks panel onto the canvas. Then drag to reorder them. Select a block and delete it."
    expected: "Both branded blocks drop and render with dark (#0B1624) background and white text — no white-on-white invisible text. Blocks can be reordered and deleted without console errors. (EDIT-01, EDIT-02, EDIT-05)"
    why_human: "Canvas drag-and-drop interaction requires a live browser with a running editor."
  - test: "Drag a few generic blocks (mj-text, mj-image, mj-button, a column layout, a spacer). Double-click a text element and edit inline. Press Ctrl+Z and Ctrl+Y."
    expected: "Generic blocks drop. Inline text editing works. Undo reverts the edit; Redo re-applies it. Pre-reload undo history loss is expected behavior (documented in RESEARCH.md Pitfall 3). (EDIT-02, EDIT-03, EDIT-04)"
    why_human: "Inline edit and keyboard undo/redo require a live browser canvas."
  - test: "Drop the 'DDROIDD Hero' block onto the canvas. Make an inline text edit. Click the 'Assert Round-Trip' button (or run `window.__ddroiddAssertRoundTrip()` in DevTools console). Then inspect `editor.getProjectData()` in the console and confirm `background-url` and `fluid-on-mobile` attributes appear on the Hero block's mj-section / mj-image."
    expected: "Console prints `[ddroidd] Round-trip identical: true`. The `background-url` and `fluid-on-mobile` attributes survive the save→load cycle in the JSON (D-04 risk probes). (Criterion 3)"
    why_human: "localStorage round-trip byte-identity requires a mounted editor with a real block on canvas and DevTools access."
  - test: "With both dev servers running and blocks on canvas, click the orange 'Compile' button. Observe the DevTools console for `[ddroidd] editor.getHtml() first 200 chars:`, the starts-with-<mjml flag, and 'Compile succeeded. HTML length: NNN'. Check the server terminal for 'spike-output.html written'. Open dist/spike-output.html in a browser."
    expected: "POST /api/compile returns 200 (no 502). Console confirms MJML string is non-empty. Server writes dist/spike-output.html. File renders with white text on dark #0B1624 background, Calibri/Roboto font, no raw <mj-*> tags. (Criterion 4 partial)"
    why_human: "getHtml() shape requires a live canvas; visual correctness of spike-output.html requires a browser."
  - test: "On a classic-Outlook machine (Office 365 MSI / 2019 / 2021 — COM-capable), run: `QuickEmailTest.ps1 -HtmlFilePath dist\\spike-output.html -PreviewOnly` then `EmailTester.ps1 -HtmlFilePath dist\\spike-output.html -TestEmails sorin.vieriu@ddroidd.com`"
    expected: "No broken fonts, no dark-on-dark text, no collapsed spacing in Outlook AND Gmail. (Criterion 4 — CLIENT-RENDER-GATE deferred)"
    why_human: "Requires a COM-capable classic Outlook install (dev machine has new Store app without COM) and a live Gmail account."
---

# Phase 01: Feasibility Spike (Editor Core) — Verification Report

**Phase Goal:** Proof that grapesjs@0.22.16 + grapesjs-mjml@1.0.8 are viable in React — editor mounts without errors, at least 2 branded blocks are draggable, project-JSON round-trip is lossless, server MJML compile produces client-safe HTML rendering correctly in Outlook and Gmail, and mj-attributes behavior is confirmed experimentally.

**Verified:** 2026-07-04T00:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 01-06 (commits 7dee3fb, a12bf01)

---

## Verification Approach

This phase is a feasibility spike with `framework: None`. Two classes of exit criteria apply:

- **Code/compile criteria** — agent-verifiable: scaffold exists, version pins correct, gap-closure code changes landed, compile path works, BLOCK_DEFAULTS inlined, pluginsOpts string key, tsc clean.
- **Live-runtime criteria** — require a human at a browser or email client: blocks panel visible, drag/drop, inline edit, undo/redo, round-trip byte-identity, real Outlook+Gmail render.

**Re-verification focus:** The two UAT blockers from 01-UAT.md are verified at the code level. Runtime proof (tests 3-6, 8-10 in 01-UAT.md) still requires a human.

---

## Re-Verification: Gap Closure Evidence

### Gap 1 — Blocks Panel Not Visible (FIXED)

**Root cause (01-UAT.md):** `<Canvas />` as child of `<Editor>` put @grapesjs/react into custom-UI mode (`customUI: true`, `panels: { defaults: [] }`), suppressing all default panel chrome.

**Fix applied (commit 7dee3fb):**
- `app/client/src/App.tsx`: `<Canvas />` child removed. `Editor` is now self-closing. `Canvas` removed from the `@grapesjs/react` import entirely (both JSX and import). Explanatory comment added above `<Editor />`.
- `app/client/src/lib/editorConfig.ts`: Deleted (confirmed: file does not exist on disk).

**Agent-verified evidence:**
- `grep Canvas src/App.tsx` — zero matches (no `<Canvas` JSX, no `Canvas` import)
- `app/client/src/lib/editorConfig.ts` — absent from filesystem
- App.tsx line 3: `import { Editor } from '@grapesjs/react';` — Canvas not present
- App.tsx lines 146-170: `<Editor ... />` self-closing with explanatory comment

**Status: FIXED at code level. Runtime proof pending (human_verification item #2).**

---

### Gap 2 — POST /api/compile 502 (FIXED)

**Root cause (01-UAT.md):** `app/package.json` `dev` script used `&` to chain two npm scripts. Under cmd.exe on Windows, `&` is sequential — Vite never exits, so `dev:server` never starts, nothing listens on :3000, and the Vite proxy returns 502.

**Fix applied (commit a12bf01):**
- `concurrently@^10.0.3` added to `app/package.json` devDependencies.
- `dev` script changed to: `concurrently -n client,server "npm run dev:client" "npm run dev:server"`

**Agent-verified evidence:**
- `app/package.json` line 8: `"dev": "concurrently -n client,server \"npm run dev:client\" \"npm run dev:server\""`
- `app/package.json` line 11: `"concurrently": "^10.0.3"` in devDependencies
- `app/client/vite.config.ts` proxy confirmed: `/api` → `http://localhost:3000` (target for compile calls)

**Status: FIXED at code level. Runtime proof pending (human_verification item #1, #6).**

---

## Goal Achievement

### Observable Truths (5 ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GrapesJS + grapesjs-mjml mounts in React on grapesjs@0.22.16 without console errors or render failures | HUMAN-NEEDED | Code artifacts correct; Canvas child removed (default-UI mode). Runtime mount requires browser observation. |
| 2 | At least 2 branded blocks and all 5 generic block types are draggable/reorderable via drag-and-drop | HUMAN-NEEDED | heroBlock and projectsBlock definitions exist and are registered in App.tsx. Default-UI mode code-verified. Canvas interaction requires live browser. |
| 3 | editor.getProjectData() persisted to localStorage and reloaded via loadProjectData() produces byte-identical canvas state | HUMAN-NEEDED | assertRoundTrip() helper wired in App.tsx; save/load implemented correctly. Byte-identity check requires running canvas. |
| 4 | MJML extracted from the editor, POSTed to compile endpoint, rendered in Outlook and Gmail displays correctly | HUMAN-NEEDED | Compile path code-verified: concurrently fix allows Express :3000 to start, proxy routes /api to :3000. Outlook/Gmail render requires COM-capable machine. |
| 5 | mj-attributes behavior documented from experiment; BLOCK_DEFAULTS mitigation strategy validated | VERIFIED | Independently re-verified. CRITERION-5-FINDINGS.md exists and is substantive. Compile spot-check: 0 errors, brand values inlined, fluid-on-mobile CSS rule, background-url applied. |

**Score: 1/5 truths agent-verified. 4/5 runtime-deferred (human_needed — not failed).**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/client/package.json` | Pinned version triple | VERIFIED | grapesjs@0.22.16, grapesjs-mjml@1.0.8, @grapesjs/react@2.0.0, react@19.2.7, vite@8.1.0 — exact pins |
| `app/server/package.json` | mjml@4.18.0 exact pin | VERIFIED | mjml@4.18.0, express@5.2.1, cors@2.8.6, dotenv@17.4.2, tsx@4.22.4 — exact pins |
| `app/client/src/App.tsx` | Editor self-closing (no Canvas child), hardcoded 'grapesjs-mjml' string key, storageManager:false, both blocks registered | VERIFIED | Self-closing `<Editor />` confirmed. No `Canvas` import or JSX. `pluginsOpts: { 'grapesjs-mjml': {...} }` hardcoded string key confirmed. `storageManager: false` confirmed. heroBlock/projectsBlock registered with StrictMode guards. |
| `app/client/src/lib/editorConfig.ts` | DELETED (dead code) | VERIFIED | File does not exist on disk. |
| `app/client/src/blocks/BLOCK_DEFAULTS.ts` | 6 brand constants, no mj-attributes | VERIFIED | backgroundColor, fontFamily, fontSize, lineHeight (24px), textColor, accentColor. Comment-only references to mj-attributes. |
| `app/client/src/blocks/hero.ts` | BLOCK_DEFAULTS inlined, fluid-on-mobile, background-url, no forbidden tags in content | VERIFIED | All BLOCK_DEFAULTS values interpolated. `fluid-on-mobile="true"` on mj-image. `background-url` on mj-section. Zero occurrences of mj-attributes/mj-include/mj-style in content string. |
| `app/client/src/blocks/projects.ts` | BLOCK_DEFAULTS inlined, 3 mj-sections, no forbidden tags in content | VERIFIED | 3 mj-sections confirmed. All BLOCK_DEFAULTS values interpolated. fluid-on-mobile on signature image. Zero occurrences of forbidden tags in content string. |
| `app/server/src/index.ts` | Express 5, CORS restricted to :5173, 1MB body limit | VERIFIED | `cors({ origin: 'http://localhost:5173' })`, `express.json({ limit: '1mb' })`, compileRouter mounted at /api. |
| `app/server/src/routes/compile.ts` | POST /api/compile, /<mjml/i conditional wrap, mjml@4.18.0, dist/spike-output.html write | VERIFIED | All confirmed. Conditional wrap regex `/<mjml/i`. Non-fatal write path. Returns `{ html, errors }`. |
| `app/package.json` | dev script using concurrently to run client + server in parallel | VERIFIED | `concurrently -n client,server "npm run dev:client" "npm run dev:server"` confirmed. concurrently@^10.0.3 in devDependencies. |
| `app/client/vite.config.ts` | Proxy /api to http://localhost:3000 | VERIFIED | `proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }` confirmed. |
| `app/client/src/experiments/mjAttributes.ts` | Part A MJML + Part B hero fragment + runner + window global | VERIFIED | File exists. |
| `.planning/phases/01-feasibility-spike-editor-core/CRITERION-5-FINDINGS.md` | Documented experiment results | VERIFIED | File exists and is substantive. |
| `.planning/phases/01-feasibility-spike-editor-core/CLIENT-RENDER-GATE.md` | Deferred-follow-up record for C4 client-render | VERIFIED | File exists. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| App.tsx | /api/compile | fetch POST in compileDraft() | VERIFIED | Fetch to `/api/compile` with `editor.getHtml()` body confirmed. |
| compileDraft | editor.getHtml() shape | /<mjml/i conditional wrap on server | VERIFIED | Conditional wrap in compile.ts handles full-doc and bare-fragment. |
| heroBlock/projectsBlock content | BLOCK_DEFAULTS | Template literal interpolation | VERIFIED | Both files import `BLOCK_DEFAULTS as D` and interpolate D.* into content strings. |
| App.tsx onEditor | editor.Blocks.add() | StrictMode guard | VERIFIED | `if (!editor.Blocks.get('ddroidd-hero'))` and `if (!editor.Blocks.get('ddroidd-projects'))` guards confirmed. |
| app/package.json dev script | dev:client + dev:server (parallel) | concurrently | VERIFIED | `concurrently -n client,server` confirmed in package.json scripts. |
| Vite proxy /api | Express :3000 /api/compile | concurrently starts Express (target now reachable) | CODE-VERIFIED | Code fix confirmed; actual proxy success requires runtime check (human_verification item #6). |

---

### Data-Flow Trace (Level 4)

Not applicable to this phase. This is a spike scaffold with no server-side data store. Data flow (block-content-string → canvas → getHtml() → /api/compile → HTML) is verified at code level; canvas rendering is deferred to human.

---

### Behavioral Spot-Checks (Criterion 5 — Re-Verified)

Spot-checks previously run in initial verification; compile path and server code unchanged by 01-06.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Compile produces 0 errors | mjml2html() on hero fragment (node --input-type=module, app/server) | `ERRORS COUNT: 0` | PASS (prior run; code unchanged) |
| Output starts with <!doctype html | Same | `Has <!doctype html: true` | PASS |
| #0B1624 background inlined | Same | `Has #0B1624: true` | PASS |
| #ffffff text color inlined | Same | `Has #ffffff: true` | PASS |
| Calibri font stack inlined | Same | `Has Calibri: true` | PASS |
| mj-full-width-mobile CSS (fluid-on-mobile) | Same | `Has mj-full-width-mobile: true` | PASS |
| img-hero.png in background-url context | Same | `Has img-hero.png (background-url): true` | PASS |
| HTML length plausible | Same | `6199 bytes` | PASS |

---

### Requirements Coverage

| Requirement | Plans | Description | Status | Evidence |
|-------------|-------|-------------|--------|---------|
| EDIT-01 | 01-01, 01-03, 01-06 | User can drag content blocks from a panel onto a canvas | CODE-VERIFIED / RUNTIME-PENDING | heroBlock + projectsBlock registered. Canvas child removed so blocks panel renders. Drag confirmation requires human. |
| EDIT-02 | 01-03 | User can reorder, nest, and delete blocks via drag-and-drop | RUNTIME-PENDING | GrapesJS handles natively; human must confirm on live canvas. |
| EDIT-03 | 01-01 | User can edit text inline on canvas | RUNTIME-PENDING | GrapesJS inline edit; human must double-click text on canvas. |
| EDIT-04 | 01-01 | User can undo and redo edits | RUNTIME-PENDING | GrapesJS undo/redo; pre-reload history loss is expected (Pitfall 3). Human confirmation required. |
| EDIT-05 | 01-01, 01-03, 01-06 | User can place generic blocks (text, image, button, columns, spacer) | CODE-VERIFIED / RUNTIME-PENDING | grapesjs-mjml provides generic blocks via resetBlocks:false. Panel rendering code-verified. Drag confirmation requires human. |

---

### Anti-Patterns Found

Scanned files modified by 01-06: `app/client/src/App.tsx`, `app/package.json`.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No TBD/FIXME/XXX markers found | — | — | — | — |

**WARNING (not a blocker) — CSS version mismatch in App.tsx:**
- Line 4: `import 'grapesjs/dist/css/grapes.min.css'` — local pinned 0.22.16 CSS (correct)
- Line 153: `grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"` — unpkg with no version pin = resolves to LATEST (currently 0.23.x, outside the locked triple)

The 01-06 plan explicitly flagged this (watch_item #2) and the executor intentionally left it for human judgment. Now that default-UI panels render and depend on this stylesheet, a 0.23.x CSS against 0.22.16 JS could make panels look broken/unstyled. This is NOT a blocker (it is an accepted "T-01-01" dev-tooling risk), but it MUST be resolved by the human during UAT. **Remedy: if the blocks panel mounts but renders unstyled or broken, drop the `grapesjsCss` prop — the local pinned import already covers CSS.**

---

### Human Verification Required

#### 1. Dev Servers Start in Parallel (concurrently fix)

**Test:** From the `app/` directory run `npm run dev`. Observe terminal output.
**Expected:** Both the `client` and `server` prefixes emit startup lines. Run `netstat -ano | findstr :3000` and confirm LISTENING.
**Why human:** Parallel process startup with concurrently can only be confirmed by observing terminal output on the actual machine.

---

#### 2. Editor Mounts with Blocks Panel Visible (Criterion 1 + blocks-panel gap)

**Test:** Open http://localhost:5173 with DevTools console open.
**Expected:** GrapesJS canvas renders. Left sidebar shows a blocks panel with generic MJML block types AND a "DDROIDD" category containing "DDROIDD Hero" and "DDROIDD Projects". No red console errors.

**CSS WARNING:** The `grapesjsCss` prop in App.tsx points to `https://unpkg.com/grapesjs/dist/css/grapes.min.css` with no version — this resolves to the latest GrapesJS CSS (0.23.x) while the JS bundle is pinned to 0.22.16. If the blocks panel renders but looks broken or unstyled, remove the `grapesjsCss` prop from the `<Editor>` element (line 153 of App.tsx). The local `import 'grapesjs/dist/css/grapes.min.css'` on line 4 already loads the correct 0.22.16 CSS.

**Why human:** Runtime compatibility of grapesjs@0.22.16 + grapesjs-mjml@1.0.8 is the spike's core question. An agent cannot drive a browser.

---

#### 3. Drag, Drop, Reorder, Delete Blocks (EDIT-01, EDIT-02, EDIT-05)

**Test:** Drag "DDROIDD Hero" and "DDROIDD Projects" blocks from the DDROIDD category onto the canvas. Drag to reorder. Select a block and delete it. Also drag several generic blocks (mj-text, mj-image, mj-button, a column layout, a spacer).
**Expected:** All blocks drop and render. Branded blocks show dark (#0B1624) background and white text — no invisible white-on-white text. Generic blocks drop correctly. Blocks can be reordered and deleted without console errors.
**Why human:** Canvas drag-and-drop requires a live browser with a running editor.

---

#### 4. Inline Text Edit and Undo/Redo (EDIT-03, EDIT-04)

**Test:** Double-click a text element on canvas; edit the text; click outside. Then press Ctrl+Z and Ctrl+Y.
**Expected:** Text is editable inline; Ctrl+Z reverts; Ctrl+Y re-applies. Undo history loss after page reload is EXPECTED behavior (Pitfall 3, documented in RESEARCH.md).
**Why human:** Keyboard and mouse canvas interaction requires a live browser.

---

#### 5. localStorage Round-Trip + D-04 Attribute Survival (Criterion 3)

**Test:** Drop "DDROIDD Hero" block; make an inline text edit; click "Assert Round-Trip" button or run `window.__ddroiddAssertRoundTrip()` in console. Then in console run `JSON.stringify(window.__ddroiddEditor.getProjectData())` and confirm `background-url` and `fluid-on-mobile` appear in the saved JSON.
**Expected:** Console prints `[ddroidd] Round-trip identical: true`. The `background-url` attribute on mj-section and `fluid-on-mobile` on mj-image survive the save→load cycle (D-04 risk probes).
**Why human:** Requires a mounted editor with a real block on canvas and DevTools console access.

---

#### 6. Compile Path End-to-End — getHtml() Shape + /api/compile 200 (Criterion 4 partial)

**Test:** With both dev servers running and blocks on canvas, click the orange "Compile" button. Observe DevTools console and server terminal.
**Expected:** Console logs `[ddroidd] editor.getHtml() first 200 chars:` (non-empty string) and `getHtml() starts with <mjml: true/false`. Console logs `[ddroidd] Compile succeeded. HTML length: NNN`. Server terminal logs `spike-output.html written to: ...`. POST /api/compile returns 200 (not 502). Open `dist/spike-output.html` in a browser — white text on dark #0B1624 background, Calibri/Roboto font, no raw `<mj-*>` tags.
**Why human:** getHtml() shape can only be confirmed at runtime; visual correctness requires a browser.

---

#### 7. Full Outlook + Gmail Render (Criterion 4 — CLIENT-RENDER-GATE deferred)

**Test:** On a **classic-Outlook** machine (Office 365 MSI / 2019 / 2021 — COM-capable):
```powershell
.\QuickEmailTest.ps1 -HtmlFilePath dist\spike-output.html -PreviewOnly
.\EmailTester.ps1   -HtmlFilePath dist\spike-output.html -TestEmails sorin.vieriu@ddroidd.com
```
**Expected:** No broken fonts, no dark-on-dark text, no collapsed spacing in Outlook AND Gmail.
**Why human:** Requires a COM-capable Outlook install (dev machine has new Store app without COM) and a Gmail account. Dev machine's new Outlook is COM-incompatible per CLIENT-RENDER-GATE.md.

---

### Gaps Summary

No BLOCKERS. Both UAT-diagnosed code defects (Canvas child suppressing blocks panel, Windows & sequential dev script) are confirmed fixed at the code level. The phase now has the correct implementation for a human to complete the runtime verification.

**What 01-06 delivered (agent-confirmed):**
- `<Editor />` self-closing — default-UI mode with stock blocks panel, style manager, layers, device bar
- `Canvas` removed from import and JSX (zero grep matches)
- `editorConfig.ts` deleted — drift risk eliminated
- `concurrently@^10.0.3` in devDependencies; dev script uses `concurrently -n client,server`
- Vite proxy `/api` → `http://localhost:3000` confirmed in vite.config.ts

**What remains for human verification (unchanged from prior verification, now re-enabled by code fixes):**
- C1: editor mount without errors (primary runtime compatibility question)
- C2: drag/drop blocks panel → canvas; generic + branded blocks; reorder; delete (EDIT-01, 02, 05)
- C3: byte-identical localStorage round-trip + fluid-on-mobile + background-url attribute survival (Criterion 3)
- C4: live compile path (getHtml() non-empty, POST 200, spike-output.html correct in browser), full Outlook+Gmail render on COM-capable machine

**Advisory CSS note:** The `grapesjsCss` unpkg URL (no version pin) resolves to 0.23.x CSS against the 0.22.16 JS bundle. Left intentionally by 01-06 executor per plan scope. If the blocks panel renders but appears unstyled or broken at UAT, drop the `grapesjsCss` prop — the local pinned import already covers CSS. Not a code blocker; a UAT contingency.

**Gate statement:** The spike cannot be declared fully viable until a human confirms the editor mounts and blocks drop (C1/C2). STATE.md reads: "Do NOT proceed to Phase 2 until all Phase 1 exit criteria pass." Once human runtime checks pass, the phase is fully complete and Phase 2 may proceed.

---

_Verified: 2026-07-04T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after gap-closure plan 01-06 (commits 7dee3fb, a12bf01)_
