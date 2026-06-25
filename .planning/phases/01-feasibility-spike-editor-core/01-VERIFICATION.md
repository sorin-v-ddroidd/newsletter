---
phase: 01-feasibility-spike-editor-core
verified: 2026-06-25T14:00:00Z
status: human_needed
score: 1/5 truths verified without human; 4/5 honestly deferred (not failed)
overrides_applied: 0
human_verification:
  - test: "Open http://localhost:5173 with DevTools console; confirm no red console errors and GrapesJS canvas renders with grapesjs-mjml plugin"
    expected: "Canvas renders, blocks panel shows generic MJML block types and DDROIDD category, no errors on mount"
    why_human: "grapesjs@0.22.16 + grapesjs-mjml@1.0.8 runtime mount compatibility is the spike's core question — an agent cannot drive a browser"
  - test: "Drag 'DDROIDD Hero' and 'DDROIDD Projects' blocks onto canvas; drag to reorder; select and delete one block"
    expected: "Both branded blocks drop, render with #0B1624 background and white text, can be reordered and deleted"
    why_human: "Drag-and-drop and canvas interaction requires a live browser"
  - test: "Double-click text on canvas, edit it, press Ctrl+Z / Ctrl+Y"
    expected: "Inline text editing works; undo reverts the edit; redo re-applies it"
    why_human: "Inline editing and undo/redo require browser canvas interaction"
  - test: "Run window.__ddroiddAssertRoundTrip() in browser console after editing; observe 'Round-trip identical: true'"
    expected: "JSON from getProjectData() round-trips through localStorage with byte-identical result; also confirm fluid-on-mobile and background-url survive in saved JSON"
    why_human: "Round-trip requires a mounted editor with a real block on canvas — cannot observe headlessly"
  - test: "Click 'Compile' button, inspect console for getHtml() first 200 chars and starts-with-<mjml flag; verify dist/spike-output.html opens in a browser with white text on dark background"
    expected: "Compile button POSTs to /api/compile; server writes dist/spike-output.html; file renders correctly in a browser"
    why_human: "getHtml() shape can only be confirmed at runtime; browser visual check cannot be done by an agent"
  - test: "On a classic-Outlook (COM-capable) machine: run QuickEmailTest.ps1 -HtmlFilePath dist\\spike-output.html -PreviewOnly; then EmailTester.ps1 to a Gmail address"
    expected: "No broken fonts, no dark-on-dark text, no collapsed spacing in Outlook AND Gmail"
    why_human: "Real email-client render requires a COM-capable Outlook install and a Gmail account; dev machine has new Outlook Store app with no COM"
---

# Phase 01: Feasibility Spike (Editor Core) — Verification Report

**Phase Goal:** Proof that grapesjs@0.22.16 + grapesjs-mjml@1.0.8 are viable in React — editor mounts without errors, at least 2 branded blocks are draggable, project-JSON round-trip is lossless, server MJML compile produces client-safe HTML rendering correctly in Outlook and Gmail, and mj-attributes behavior is confirmed experimentally.

**Verified:** 2026-06-25T14:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Verification Approach

This phase is a **feasibility spike with `framework: None`** (no automated UI test harness by design). Two classes of exit criteria apply:

- **Code/compile criteria** — agent-verifiable: scaffold exists, version pins correct, compile path works, BLOCK_DEFAULTS inlined, pluginsOpts string key, tsc clean.
- **Live-runtime criteria** — require a human at a browser or email client: drag/drop, inline edit, undo/redo, round-trip byte-identity, real Outlook+Gmail render.

**Judge**: an honestly recorded deferral (present in STATE.md Deferred Items and CLIENT-RENDER-GATE.md) is **correct spike behavior**, not a failure. A FAIL is reserved for: (a) code/compile criterion lacking evidence, (b) SUMMARY fabricating a PASS it could not have verified, or (c) a deferral that is silent (not recorded).

---

## Goal Achievement

### Observable Truths (5 ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GrapesJS + grapesjs-mjml mounts in React on grapesjs@0.22.16 without console errors or render failures | DEFERRED-CORRECTLY | All code artifacts correct; runtime mount unobservable by agent. SUMMARY honestly marks PENDING-browser. Recorded in STATE.md Deferred Items. |
| 2 | At least 2 branded blocks and all 5 generic types are draggable/reorderable via drag-and-drop | DEFERRED-CORRECTLY | Both block definitions exist on disk (hero.ts, projects.ts), registered in App.tsx with correct guards. Canvas interaction unverifiable by agent. Recorded in STATE.md + CLIENT-RENDER-GATE.md. |
| 3 | editor.getProjectData() persisted to localStorage and reloaded via loadProjectData() produces byte-identical canvas state | DEFERRED-CORRECTLY | assertRoundTrip() helper wired in App.tsx; localStorage save/load implemented correctly. Byte-identity check requires running canvas. SUMMARY honestly marks PENDING-browser. Recorded in STATE.md Deferred Items. |
| 4 | MJML extracted from the editor, POSTed to compile endpoint, and rendered in Outlook and Gmail displays correctly | DEFERRED-CORRECTLY | Compile path verified (see C4 below). Full Outlook+Gmail render deferred with user-approved partial-pass path (no COM on dev machine). Recorded in CLIENT-RENDER-GATE.md + STATE.md. |
| 5 | mj-attributes behavior documented from experiment; BLOCK_DEFAULTS mitigation strategy validated | VERIFIED | Independently re-verified by agent. See C5 evidence below. |

**Score:** 1/5 agent-verifiable truths confirmed directly; 4/5 deferred-correctly with documented human follow-up.

**This spike is VIABLE-PENDING-HUMAN-RUNTIME-CHECK.** The load-bearing outstanding question (does grapesjs@0.22.16 + grapesjs-mjml@1.0.8 actually mount and accept block drops?) cannot be answered without a human at the browser. This is the STATE.md-documented blocker ("Do NOT proceed to Phase 2 until all Phase 1 exit criteria pass").

---

### Deferred Items

Items not yet met but honestly deferred with documented follow-up — not silently dropped.

| # | Item | Deferred To | Evidence of Honest Deferral |
|---|------|------------|----------------------------|
| 1 | C1/C2/C3: live editor criteria (mount, drag/reorder, round-trip) | Manual human gate at localhost:5173 | STATE.md Deferred Items row "Live-editor verify"; CLIENT-RENDER-GATE.md §"Also still PENDING-HUMAN" |
| 2 | C4: Outlook+Gmail real-client render | Phase 2 follow-up, classic-Outlook machine | CLIENT-RENDER-GATE.md §"Deferred follow-up"; STATE.md Deferred Items row "Client-render (D-05)" |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/client/package.json` | Pinned version triple | VERIFIED | grapesjs@0.22.16, grapesjs-mjml@1.0.8, @grapesjs/react@2.0.0, react@19.2.7, vite@8.1.0 — all exact pins (no carets) |
| `app/server/package.json` | mjml@4.18.0 exact pin | VERIFIED | mjml@4.18.0, express@5.2.1, cors@2.8.6, dotenv@17.4.2, tsx@4.22.4 — exact pins |
| `app/client/src/App.tsx` | Editor mount with correct pluginsOpts key, storageManager:false, both blocks registered | VERIFIED | `pluginsOpts: { 'grapesjs-mjml': { ... } }` hardcoded string key confirmed. `storageManager: false` confirmed. Both heroBlock/projectsBlock registered with StrictMode guard. |
| `app/client/src/lib/editorConfig.ts` | Hardcoded 'grapesjs-mjml' string key | VERIFIED | File exists; `'grapesjs-mjml': { resetBlocks: false, resetDevices: false }` confirmed |
| `app/client/src/blocks/BLOCK_DEFAULTS.ts` | 6 brand constants, no mj-attributes | VERIFIED | backgroundColor, fontFamily, fontSize, lineHeight (24px), textColor, accentColor. Comment-only references to mj-attributes. |
| `app/client/src/blocks/hero.ts` | BLOCK_DEFAULTS inlined, fluid-on-mobile, background-url, no forbidden tags in content | VERIFIED | All BLOCK_DEFAULTS values interpolated into content string. `fluid-on-mobile="true"` on mj-image. `background-url` on mj-section. Zero occurrences of mj-attributes/mj-include/mj-style in content string. |
| `app/client/src/blocks/projects.ts` | BLOCK_DEFAULTS inlined, 3 mj-sections, no forbidden tags in content | VERIFIED | 3 mj-sections confirmed. All BLOCK_DEFAULTS values interpolated. fluid-on-mobile on signature image. Zero occurrences of forbidden tags in content string. |
| `app/server/src/index.ts` | Express 5, CORS restricted to :5173, 1MB body limit | VERIFIED | `cors({ origin: 'http://localhost:5173' })` + `express.json({ limit: '1mb' })` + mounts compileRouter at /api |
| `app/server/src/routes/compile.ts` | POST /api/compile, /<mjml/i conditional wrap, mjml@4.18.0, dist/spike-output.html write | VERIFIED | All confirmed in source. REPO_ROOT via fileURLToPath(__dirname) 4 levels up. Conditional wrap regex `/<mjml/i`. Non-fatal write path. Returns `{ html, errors }`. |
| `app/client/src/experiments/mjAttributes.ts` | Part A MJML + Part B hero fragment + runner + window global | VERIFIED | PART_A_MJML with mj-attributes color="#ff0000"; PART_B_HERO_FRAGMENT; runMjAttributesExperiment() async function; window.__ddroiddMjAttributesExperiment global |
| `.planning/phases/01-feasibility-spike-editor-core/CRITERION-5-FINDINGS.md` | Documented experiment results with DIRECTLY-OBSERVED vs INFERRED labels | VERIFIED | All 6 checklist items answered. Evidence labeling present. Compiler/editor distinction correctly articulated. BLOCK_DEFAULTS mitigation verdict documented. |
| `.planning/phases/01-feasibility-spike-editor-core/CLIENT-RENDER-GATE.md` | Deferred-follow-up record for C4 client-render | VERIFIED | File exists; partial-pass outcome documented; structural compile evidence recorded; deferred follow-up with exact PowerShell commands |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| App.tsx | /api/compile | fetch POST in compileDraft() | VERIFIED | Fetch call to `/api/compile` with `editor.getHtml()` body confirmed in App.tsx |
| compileDraft | editor.getHtml() shape | /<mjml/i conditional wrap on server | VERIFIED | Conditional wrap in compile.ts handles both full-doc and bare-fragment outputs |
| heroBlock.content / projectsBlock.content | BLOCK_DEFAULTS | Template literal interpolation | VERIFIED | Both files import `BLOCK_DEFAULTS as D` and interpolate D.* into content strings |
| App.tsx onEditor | editor.Blocks.add() | StrictMode guard | VERIFIED | `if (!editor.Blocks.get('ddroidd-hero'))` + `if (!editor.Blocks.get('ddroidd-projects'))` guards both registrations |
| STATE.md Deferred Items | CLIENT-RENDER-GATE.md | Cross-reference | VERIFIED | Both files record the same two deferral classes (client-render + live-editor) consistently |

---

### Data-Flow Trace (Level 4)

Not applicable to this phase. This is a spike scaffold; there is no server data store or dynamic API data being rendered. Data flow is: block-content-string → canvas → getHtml() → /api/compile → HTML. The compile path is verified at the code level (C5 re-run below); the canvas rendering is deferred-correctly.

---

### Behavioral Spot-Checks (Criterion 5 — Independent Re-Verification)

The verifier independently re-ran the `mjml@4.18.0` compile of the hero fragment using `node --input-type=module` inside `app/server` — without relying on SUMMARY claims.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Compile produces 0 errors | `node --input-type=module` mjml2html() on hero fragment | `ERRORS COUNT: 0` | PASS |
| Output starts with <!doctype html | Same compile | `Has <!doctype html: true` | PASS |
| #0B1624 background inlined | Same compile | `Has #0B1624: true` | PASS |
| #ffffff text color inlined | Same compile | `Has #ffffff: true` | PASS |
| Calibri font stack inlined | Same compile | `Has Calibri: true` | PASS |
| mj-full-width-mobile CSS (fluid-on-mobile) | Same compile | `Has mj-full-width-mobile: true` | PASS |
| img-hero.png in background-url context | Same compile | `Has img-hero.png (background-url): true` | PASS |
| HTML length plausible | Same compile | `6199 bytes` | PASS |

All 8 checks pass from an independent verifier run. C5 is VERIFIED.

---

### Probe Execution

No probe scripts defined for this phase. Behavioral spot-check above covers the equivalent.

---

### Requirements Coverage

| Requirement | Plan | Description (from ROADMAP) | Status | Evidence |
|-------------|------|-----------------------------|--------|---------|
| EDIT-01 | 01-01, 01-03 | All block types drag onto canvas | DEFERRED-CORRECTLY | Block definitions exist; drag requires live browser |
| EDIT-02 | 01-03 | Reorder by drag; delete block | DEFERRED-CORRECTLY | Canvas interaction requires live browser |
| EDIT-03 | 01-01 | Inline mj-text edit | DEFERRED-CORRECTLY | Double-click canvas edit requires live browser |
| EDIT-04 | 01-01 | Undo (Ctrl+Z) / Redo (Ctrl+Y) | DEFERRED-CORRECTLY | Canvas interaction requires live browser |
| EDIT-05 | 01-01, 01-03 | Second branded block (ddroidd-projects) | DEFERRED-CORRECTLY | Block definition exists; drag requires live browser |

---

### Anti-Patterns Found

Scan run on all files in `app/` created or modified by this phase. No unreferenced debt markers found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No blockers found | — | — | — | — |

**TBD/FIXME/XXX scan:** One hit in `app/server/package-lock.json` — the `TBD` string is embedded in a base64 integrity hash value (sha512), not a debt marker comment. No code files contain unresolved debt markers.

**mj-attributes/mj-include/mj-style in block content:** Confirmed absent from block content strings in both hero.ts and projects.ts. The five grep hits are in comments only, explicitly noting what is prohibited.

**Return null / stub patterns:** None found. All functions have real implementations.

---

### Human Verification Required

#### 1. Editor Runtime Mount (Criterion 1)

**Test:** `cd app && npm run dev`; open http://localhost:5173 in a browser with DevTools console.
**Expected:** GrapesJS canvas visible; blocks panel shows MJML generic types and DDROIDD category; no red console errors. If branded blocks fail to drop, check pluginsOpts string key.
**Why human:** Runtime compatibility of grapesjs@0.22.16 + grapesjs-mjml@1.0.8 is the spike's core question — an agent cannot drive a browser or observe a running GrapesJS canvas.

#### 2. Drag/Drop and Canvas Interaction (Criterion 2)

**Test:** With editor running, drag "DDROIDD Hero" and "DDROIDD Projects" blocks onto the canvas. Drag to reorder. Select and delete one block.
**Expected:** Both branded blocks drop and render with dark (#0B1624) background and white text (no white-on-white). Blocks can be reordered and deleted without error.
**Why human:** Canvas drag-and-drop requires a live browser; cannot be automated without a test harness.

#### 3. Inline Edit and Undo/Redo (Criteria 1, 3 — EDIT-03, EDIT-04)

**Test:** Double-click text on canvas; edit it; click away; then press Ctrl+Z and Ctrl+Y.
**Expected:** Text is editable inline; Ctrl+Z reverts; Ctrl+Y re-applies. Pre-reload undo history loss is EXPECTED behavior (Pitfall 3, documented in RESEARCH.md).
**Why human:** Keyboard and mouse interaction with canvas requires a live browser.

#### 4. localStorage Round-Trip (Criterion 3)

**Test:** Drop "DDROIDD Hero" block; make an inline text edit; run `window.__ddroiddAssertRoundTrip()` in DevTools console.
**Expected:** Console prints `[ddroidd] Round-trip identical: true`. Also inspect the saved localStorage JSON — confirm `fluid-on-mobile` and `background-url` attributes survive (D-04 risk probes from hero.ts).
**Why human:** Requires a mounted editor with a real block on canvas and DevTools console access.

#### 5. Live Compile Path and getHtml() Shape (Criterion 4 partial)

**Test:** With both dev servers running, drop both branded blocks onto canvas; click the orange "Compile" button; observe DevTools console.
**Expected:** Console logs `[ddroidd] editor.getHtml() first 200 chars:` and `[ddroidd] getHtml() starts with <mjml: true/false` (resolves open question #2); compile succeeds; `dist/spike-output.html` written by server. Open `dist/spike-output.html` in a browser and confirm white text on dark background, no layout collapse.
**Why human:** `editor.getHtml()` shape requires a live canvas; browser visual check cannot be automated.

#### 6. Full Outlook + Gmail Render (Criterion 4 — CLIENT-RENDER-GATE deferred)

**Test:** On a **classic-Outlook** machine (Office 365 MSI / 2019 / 2021 — COM-capable), run:
```powershell
.\QuickEmailTest.ps1 -HtmlFilePath dist\spike-output.html -PreviewOnly
.\EmailTester.ps1   -HtmlFilePath dist\spike-output.html -TestEmails sorin.vieriu@ddroidd.com
```
**Expected:** No broken fonts; no dark-on-dark text; no collapsed spacing in Outlook AND Gmail. (Dev machine's new Outlook Store app has no COM — this is why it was deferred.)
**Why human:** Requires a COM-capable Outlook install and a Gmail account; partially verified via structural compile checks (0 errors, inline CSS, table layout) but actual rendering needs a real client.

---

### Gaps Summary

No BLOCKERS. There are no fabricated PASS claims, no silent deferrals, and no code-verifiable criteria that lack evidence.

**What the phase delivered (agent-confirmed):**
- Exact version triple pinned and installed: grapesjs@0.22.16, grapesjs-mjml@1.0.8, @grapesjs/react@2.0.0
- mjml@4.18.0 pinned server-side (matches mjml-browser@4.18.0 bundled in grapesjs-mjml)
- `'grapesjs-mjml'` hardcoded string key in pluginsOpts (issue #223 prevention) — confirmed
- `storageManager: false` confirmed
- BLOCK_DEFAULTS constant: 6 brand fields, correct values
- hero.ts and projects.ts: BLOCK_DEFAULTS fully inlined per element, zero mj-attributes/mj-include/mj-style in content strings
- POST /api/compile: conditional wrap (`/<mjml/i`), mjml@4.18.0, CORS restricted to :5173, 1MB body limit, dist/spike-output.html write (non-fatal)
- Criterion 5 (mj-attributes / BLOCK_DEFAULTS): VERIFIED independently — 0 compile errors, all brand values in output, mj-full-width-mobile CSS rule, background-url applied
- Deferred items: honestly labeled (PENDING-HUMAN / INFERRED-FROM-SOURCE), explicitly recorded in STATE.md Deferred Items and CLIENT-RENDER-GATE.md

**What remains for human verification:**
- C1: editor mount without errors (the primary runtime compatibility question)
- C2: drag/drop and canvas manipulation
- C3: byte-identical localStorage round-trip (+ fluid-on-mobile and background-url attribute survival)
- C4: live compile path (getHtml() shape), browser visual check of spike-output.html, and full Outlook+Gmail render on a COM-capable machine

**Gate statement:** The spike CANNOT be declared fully viable until a human confirms the editor mounts and blocks drop (C1/C2). This is explicitly documented in STATE.md: "Do NOT proceed to Phase 2 until all Phase 1 exit criteria pass." Once the human runtime checks pass, the phase is fully complete and Phase 2 may proceed.

**STATE.md housekeeping note (informational only, not a blocker):** The frontmatter in STATE.md is stale — `completed_phases: 0`, `percent: 0`, `status: executing`, and "Plan 1 of 5" do not reflect the 5/5 plans completed shown in ROADMAP.md. The verification-relevant section (Deferred Items) is correctly populated. This is a documentation-only gap, not a code or functional issue.

---

_Verified: 2026-06-25T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
