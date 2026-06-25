# Phase 1: Feasibility Spike (Editor Core) - Research

**Researched:** 2026-06-25
**Domain:** GrapesJS + grapesjs-mjml + React integration, MJML server compile, localStorage round-trip, client-render verification
**Confidence:** MEDIUM (runtime compat of grapesjs@0.22.16 + grapesjs-mjml@1.0.8 is the spike's own question — see Blockers)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Build the spike as **foundation code** — Phase 2 builds directly on it. The stack/versions are locked and won't change, so the working mount, block definitions, and compile endpoint are kept, not thrown away. Invest reasonable structure/quality now (not throwaway, not gold-plated).
- **D-02:** New React + Express app lives in an **`/app` subfolder of this repo** (monorepo). Existing `src/` MJML sources stay in place as reference for block re-authoring. One repo to clone; branded section sources sit next to the blocks derived from them.
- **D-03:** `/app` holds both the client (React + Vite) and the server (Express) — exact internal layout inside `/app` (e.g. `app/client`, `app/server`) is planner's discretion.
- **D-04:** Re-author **hero + projects** as the 2 branded blocks. Blocks are **re-authored as grapesjs-mjml block definitions**, NOT imported from the hand-authored MJML. All defaults inlined per element; no `mj-attributes`, no `mj-include`, no `mj-style` inside block content strings.
- **D-05:** Verify compiled HTML by **reusing the existing PowerShell + Outlook COM scripts**. Windows-only is acceptable for a dev-time gate.

**Stack is locked (do not recommend alternatives):**
- `grapesjs@0.22.16`
- `grapesjs-mjml@1.0.8`
- `@grapesjs/react@2.0.0`
- `mjml@4.18.0` (server-side)
- `react@19.2.7` / `react-dom@19.2.7`
- `vite@8.1.0` / `@vitejs/plugin-react@6.0.3`
- `express@5.2.1`

### Claude's Discretion
- Internal folder structure within `/app`.
- Exact `mj-attributes` experiment design (criteria #5) — how to construct the test that confirms whether defaults survive or are silently dropped.
- Mount approach details; fallback to `grapesjs@0.21.2` + direct mount only if the `0.22.16` + `@grapesjs/react` triple fails at runtime.
- localStorage key/shape for the round-trip test.

### Deferred Ideas (OUT OF SCOPE)
Auth, PostgreSQL/DB, server-side persistence API, image upload, asset library, full 6-block library, Style Manager restriction, raw-HTML removal, preview UI, export download, mj-head injection. Persistence in this phase is localStorage only.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | User can drag content blocks from a panel onto a canvas to assemble an email | grapesjs-mjml ships 5 generic block types; GjsEditor + @grapesjs/react mounts the full panel + canvas |
| EDIT-02 | User can reorder, nest, and delete blocks on the canvas via drag-and-drop | Native GrapesJS capability; verified by the round-trip test |
| EDIT-03 | User can edit text inline directly on the canvas (headings, body, links) | grapesjs-mjml `mj-text` block supports inline editing; activate:true property triggers select-on-drop |
| EDIT-04 | User can undo and redo their edits | GrapesJS UndoManager is built-in; survives localStorage reload for new edits (NOT pre-reload history — see Pitfalls) |
| EDIT-05 | User can place generic blocks (text, image, button, 1/2/3-column, divider, spacer) | grapesjs-mjml@1.0.8 ships exactly these 5 generic types (mj-text, mj-image, mj-button, mj-1-column/mj-2-columns/mj-3-columns combined as "columns", mj-divider, mj-spacer) — the 5 in the exit gate |
</phase_requirements>

---

## Summary

Phase 1 is a hard technical gate: prove that `grapesjs@0.22.16` + `grapesjs-mjml@1.0.8` + `@grapesjs/react@2.0.0` works in a React/Vite app before any auth, DB, or storage work begins. The research here provides concrete implementation knowledge — verified from the grapesjs-mjml@1.0.8 source bundle — so the planner can write tasks with executable specifics.

The primary risk is **runtime compatibility** between grapesjs@0.22.16 and grapesjs-mjml@1.0.8. `grapesjs-mjml` declares no `peerDependencies`, so npm installs without conflict, but the plugin's own test/dev history targets 0.21.x. The README says "requires v0.15.9 or higher" with no upper bound, and there are no reports of 0.22.x breakage in the issue tracker — but this is absence of evidence, not evidence of absence. The spike is the test; do not code past it as if it has passed.

A secondary, concrete surprise: **the dev machine has "new Outlook for Windows" (Microsoft Store app), which does NOT support COM automation**. The existing `QuickEmailTest.ps1` and `EmailTester.ps1` depend on `New-Object -ComObject Outlook.Application`, which will fail. D-05's client-render verification requires either a machine with classic Outlook (Office 365 / MSI install), or an alternative approach. The planner must surface this to the user before the email-render verification task.

**Primary recommendation:** Scaffold the `app/` monorepo and wire the thinnest possible vertical slice: mount editor → add one branded block → save to localStorage → reload → POST MJML to server → write HTML → attempt PowerShell verify. Each step surfaces a distinct failure mode; stop and document rather than work around.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MJML drag-drop canvas + block panel | Browser (GrapesJS) | — | grapesjs-mjml owns the full editor UI including blocks panel and canvas |
| Real-time MJML preview in canvas | Browser (mjml-browser bundled in grapesjs-mjml) | — | Plugin bundles mjml-browser@4.18.0 and compiles in-canvas automatically |
| MJML → production HTML compile | API/Backend (Express + mjml@4.18.0) | — | Server compile is authoritative; matches mjml-browser version for parity |
| Project state persistence (this phase) | Browser (localStorage) | — | No server DB in Phase 1; `getProjectData`/`loadProjectData` API |
| Client-render verification | Developer toolchain (PowerShell) | — | D-05: QuickEmailTest.ps1 + EmailTester.ps1; not part of the web app |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `grapesjs` | `0.22.16` | Editor engine | Only version satisfying both `@grapesjs/react@2.0.0` peerDep (`^0.22.5`) AND avoiding 0.23.x (outside peerDep range) [VERIFIED: npm registry] |
| `grapesjs-mjml` | `1.0.8` | MJML component model + browser compile | Only mature OSS MJML drag-drop editor plugin; maintained by GrapesJS org [VERIFIED: npm registry, March 2026 publish] |
| `@grapesjs/react` | `2.0.0` | React lifecycle wrapper for GrapesJS | Official wrapper; handles init/destroy, StrictMode double-init guard [VERIFIED: npm registry] |
| `mjml` (server) | `4.18.0` | Server-side MJML→HTML compile | Must match `mjml-browser@^4.18.0` bundled in grapesjs-mjml to prevent preview/export divergence [VERIFIED: npm registry + grapesjs-mjml@1.0.8 bundle] |
| `react` | `19.2.7` | UI framework | Satisfies `@grapesjs/react` peerDep `^18||^19` [VERIFIED: npm registry] |
| `react-dom` | `19.2.7` | DOM rendering | Matches React version [VERIFIED: npm registry] |
| `vite` | `8.1.0` | Frontend build | [VERIFIED: npm registry] |
| `@vitejs/plugin-react` | `6.0.3` | React Fast Refresh | [VERIFIED: npm registry] |
| `express` | `5.2.1` | HTTP server for compile endpoint | v5 stable; async error handling built-in [VERIFIED: npm registry] |
| `cors` | `2.8.6` | CORS (Vite :5173 ↔ Express :3000) | [VERIFIED: npm registry] |
| `dotenv` | `17.4.2` | Env var loading | [VERIFIED: npm registry] |

### Supporting (dev only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | `4.22.4` | Run TypeScript Node files directly | Express server in dev |
| `nodemon` | `3.1.14` | Restart server on file changes | Dev only |
| TypeScript | `6.0.3` | Type safety | Strict mode throughout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `grapesjs@0.22.16` | `grapesjs@0.23.2` (latest) | 0.23.x is outside `@grapesjs/react@2.0.0` peerDep `^0.22.5` — do not use |
| `mjml@4.18.0` | `mjml@5.3.0` (latest) | v5 has breaking changes; grapesjs-mjml bundles mjml-browser@^4.18.0 — mismatch causes preview/export divergence |
| `@grapesjs/react@2.0.0` | Direct `grapesjs.init()` in `useEffect` | Fallback only if 0.22.16 + React wrapper triple fails. Direct mount requires manual lifecycle management and StrictMode guard |

**Installation (client):**
```bash
npm install grapesjs@0.22.16 grapesjs-mjml@1.0.8 @grapesjs/react@2.0.0 react@19.2.7 react-dom@19.2.7
npm install --save-dev vite@8.1.0 @vitejs/plugin-react@6.0.3 tsx@4.22.4 nodemon typescript
```

**Installation (server):**
```bash
npm install express@5.2.1 cors@2.8.6 dotenv@17.4.2 mjml@4.18.0
```

---

## Package Legitimacy Audit

slopcheck was unavailable on this machine. All packages are cross-verified via npm registry metadata and official GitHub repositories.

| Package | Registry | Publish Date | Source Repo | Disposition |
|---------|----------|-------------|-------------|-------------|
| `grapesjs` | npm | Active since 2016 | github.com/GrapesJS/grapesjs | Approved [VERIFIED: npm registry] |
| `grapesjs-mjml` | npm | 2026-03-13 (1.0.8) | github.com/GrapesJS/mjml | Approved [VERIFIED: npm registry] |
| `@grapesjs/react` | npm | 2.0.0 (official GrapesJS org) | github.com/GrapesJS/react | Approved [VERIFIED: npm registry] |
| `mjml` | npm | Active since 2016 | github.com/mjmlio/mjml | Approved [VERIFIED: npm registry] |
| `express` | npm | 5.2.1 (2026) | github.com/expressjs/express | Approved [VERIFIED: npm registry] |
| `vite` | npm | 8.1.0 (2026) | github.com/vitejs/vite | Approved [VERIFIED: npm registry] |
| `react` / `react-dom` | npm | 19.2.7 (2025) | github.com/facebook/react | Approved [VERIFIED: npm registry] |
| `cors` | npm | 2.8.6 | github.com/expressjs/cors | Approved [VERIFIED: npm registry] |
| `dotenv` | npm | 17.4.2 | github.com/motdotla/dotenv | Approved [VERIFIED: npm registry] |
| `tsx` | npm | 4.22.4 | github.com/privatenumber/tsx | Approved [VERIFIED: npm registry] |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable — packages above verified via npm registry metadata and official GitHub org membership.*

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Vite dev server :5173)
  |
  +-- React App
       |
       +-- GjsEditor (@grapesjs/react)
            |  plugins: [grapesjsMjml]
            |  pluginsOpts: { 'grapesjs-mjml': { ... } }  ← hardcoded string key
            |
            +-- Block Panel (generic + branded blocks)
            |    [drag to canvas]
            |
            +-- Canvas (mjml-browser@4.18.0 renders live preview)
            |
            +-- onEditor callback
                 |
                 +-- editor.Blocks.add('ddroidd-hero', { content: '<mj-section>...</mj-section>' })
                 +-- editor.Blocks.add('ddroidd-projects', { ... })
                 |
                 +-- [save] editor.getProjectData() → localStorage
                 +-- [load] editor.loadProjectData(JSON.parse(localStorage))
                 |
                 +-- [compile] editor.getHtml()  → MJML body fragment
                              → POST /api/compile { mjml: '<mj-section>...</mj-section>' }
                              |
                              v
Express server (:3000)
  POST /api/compile
    |
    +-- Wrap: '<mjml><mj-body>' + req.body.mjml + '</mj-body></mjml>'
    +-- mjml(wrapped, { minify: false })
    +-- return { html: result.html, errors: result.errors }
    |
    v
Client writes HTML to file
    |
    v
PowerShell (D-05 gate)
  QuickEmailTest.ps1 -HtmlFilePath <file> -PreviewOnly  → Outlook preview
  EmailTester.ps1 -HtmlFilePath <file> -TestEmails <gmail>  → Gmail inbox
```

### Recommended Project Structure
```
app/
├── client/                  # Vite + React frontend
│   ├── src/
│   │   ├── main.tsx         # React entry
│   │   ├── App.tsx          # GjsEditor mount
│   │   ├── blocks/
│   │   │   ├── BLOCK_DEFAULTS.ts   # inlined brand constants
│   │   │   ├── hero.ts             # branded hero block definition
│   │   │   └── projects.ts         # branded projects block definition
│   │   └── lib/
│   │       └── editorConfig.ts     # GrapesJS init options
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                  # Express API
│   ├── src/
│   │   ├── index.ts         # Express entry
│   │   └── routes/
│   │       └── compile.ts   # POST /api/compile
│   ├── tsconfig.json
│   └── package.json
│
└── package.json             # root scripts: dev:client, dev:server, dev
```

### Pattern 1: GjsEditor React Mount

**What:** Mount grapesjs-mjml inside React using `@grapesjs/react`. Critical: use hardcoded string `'grapesjs-mjml'` as pluginsOpts key.

**Why critical:** The README shows computed key `[grapesJSMJML]` — but CLAUDE.md documents that this causes issue #223 ("blocks can't be dropped" bug). Use the string.

**Example:**
```typescript
// Source: grapesjs-mjml README (verified from @1.0.8 tarball) + gjs.market guide
import grapesjs from 'grapesjs';
import grapesjsMjml from 'grapesjs-mjml';
import { GjsEditor } from '@grapesjs/react';
import 'grapesjs/dist/css/grapes.min.css';

const onEditor = (editor: any) => {
  // Register branded blocks here (see Pattern 2)
  // Guard against StrictMode double-registration:
  if (!editor.Blocks.get('ddroidd-hero')) {
    editor.Blocks.add('ddroidd-hero', heroBlock);
  }
  if (!editor.Blocks.get('ddroidd-projects')) {
    editor.Blocks.add('ddroidd-projects', projectsBlock);
  }
};

export default function App() {
  return (
    <GjsEditor
      grapesjs={grapesjs}
      grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
      onEditor={onEditor}
      options={{
        height: '100vh',
        storageManager: false,   // Phase 1: manual localStorage, no auto-save
        plugins: [grapesjsMjml],
        pluginsOpts: {
          'grapesjs-mjml': {     // ← hardcoded string key, NOT [grapesjsMjml]
            resetBlocks: false,  // keep generic blocks; we add branded ones in onEditor
          }
        }
      }}
    />
  );
}
```

**StrictMode note:** `@grapesjs/react` handles React StrictMode's double-invocation. The `editor.Blocks.get(id)` guard in `onEditor` prevents duplicate block registration on double-fire. [CITED: gjs.market integration guide]

### Pattern 2: Branded Block Definition

**What:** Register DDROIDD branded blocks via `editor.Blocks.add()` in the `onEditor` callback. Content is a bare MJML fragment (NOT a full `<mjml>` document). All brand defaults must be inlined per-element because `mj-attributes` is not supported.

**Verified from bundle:** The plugin's own generic blocks use this exact format — e.g., mj-1-column content is `"<mj-section>\n        <mj-column><mj-text>Content 1</mj-text></mj-column>\n      </mj-section>"`. Branded blocks follow the same pattern.

```typescript
// Source: grapesjs-mjml@1.0.8 dist/index.js bundle — verified block content format

// BLOCK_DEFAULTS.ts — single source of truth for inline brand values
export const BLOCK_DEFAULTS = {
  backgroundColor: '#0B1624',
  fontFamily: 'Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '24px',
  textColor: '#ffffff',
  accentColor: '#F45E43',
} as const;

// hero.ts — derived from src/sections/hero.mjml
// NOTE: mj-attributes is NOT used — all values inlined
// NOTE: fluid-on-mobile IS a supported mj-image attribute (verify in canvas)
// NOTE: background-url on mj-section is NOT a default panel trait (canvas may ignore it;
//       use background-color only for the spike, document in experiment)
export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'DDROIDD Hero',
  category: 'DDROIDD',
  content: `<mj-section background-color="${BLOCK_DEFAULTS.backgroundColor}">
  <mj-column>
    <mj-image
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
      fluid-on-mobile="true"
    />
    <mj-text
      color="${BLOCK_DEFAULTS.textColor}"
      font-family="${BLOCK_DEFAULTS.fontFamily}"
      font-size="${BLOCK_DEFAULTS.fontSize}"
      line-height="${BLOCK_DEFAULTS.lineHeight}"
    >
      <p style="font-family: ${BLOCK_DEFAULTS.fontFamily}; font-size: ${BLOCK_DEFAULTS.fontSize}; line-height: ${BLOCK_DEFAULTS.lineHeight}; color: ${BLOCK_DEFAULTS.textColor};">
        Insert hero text here.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
```

**Key authoring rules (from CLAUDE.md + verified):**
- Do NOT include `mj-attributes`, `mj-include`, or `mj-style` inside content strings
- Background images (`background-url` on `mj-section`) are not a default panel trait — use `background-color` for the spike; document whether `background-url` survives round-trip as a manual attribute
- `fluid-on-mobile` on `mj-image` is not a panel trait but IS valid MJML; include it and document whether it appears in compiled output
- `css-class` attribute passes through compilation but is not panel-editable; omit it from branded blocks

### Pattern 3: MJML Extraction and Server Compile

**What:** `editor.getHtml()` returns a bare MJML body fragment — the sections/columns content only. It does NOT return a complete `<mjml><mj-body>...</mj-body></mjml>` document. You must wrap it before passing to `mjml()` server-side.

**Verified from bundle source:**
```javascript
// From grapesjs-mjml@1.0.8 dist/index.js — the 'mjml-code' command:
n.add('mjml-code', function() {
  return preMjml + editor.getHtml().trim() + postMjml
  // preMjml default: ''  postMjml default: ''
})
// The 'mjml-code-to-html' command calls mjmlParser on the result of 'mjml-code'
```

So `editor.getHtml()` returns the body fragment. To compile server-side:

```typescript
// server/src/routes/compile.ts
import express from 'express';
import mjml2html from 'mjml';

const router = express.Router();

router.post('/compile', async (req, res) => {
  const { mjml: bodyFragment } = req.body as { mjml: string };

  // Wrap body fragment in full MJML document
  // mj-head is intentionally minimal in Phase 1 (full injection deferred to Phase 4)
  const fullMjml = `<mjml>
  <mj-body>
    ${bodyFragment.trim()}
  </mj-body>
</mjml>`;

  const result = mjml2html(fullMjml, {
    validationLevel: 'soft',  // don't throw on warnings
    minify: false,
  });

  if (result.errors && result.errors.length > 0) {
    // Log errors but still return HTML if generated
    console.warn('MJML compile warnings:', result.errors);
  }

  res.json({ html: result.html, errors: result.errors });
});

export default router;
```

**Note on preMjml/postMjml options:** If needed, the `preMjml` / `postMjml` plugin options can wrap the fragment before the plugin's own export command. For server compile, wrapping server-side is cleaner and more controllable.

### Pattern 4: localStorage Round-Trip

**What:** Manual getProjectData/loadProjectData using localStorage. No storage manager auto-save in Phase 1.

```typescript
const STORAGE_KEY = 'ddroidd_newsletter_draft';

// Save
const save = (editor: any) => {
  const data = editor.getProjectData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Load
const load = (editor: any) => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    editor.loadProjectData(JSON.parse(raw));
  }
};

// Assert round-trip fidelity
const assertRoundTrip = (editor: any) => {
  const before = JSON.stringify(editor.getProjectData());
  save(editor);
  load(editor);
  const after = JSON.stringify(editor.getProjectData());
  console.assert(before === after, 'Round-trip mismatch!');
};
```

**Undo/redo after reload:** `loadProjectData()` resets the UndoManager. The exit criterion is that undo/redo works for *new* edits after reload, and the canvas state reflects edits made before save. Pre-reload undo history does NOT survive — this is expected behavior, not a failure.

### Anti-Patterns to Avoid

- **`[grapesjsMjml]` as computed key in pluginsOpts:** Causes issue #223 — blocks appear in panel but cannot be dropped onto canvas. Use the hardcoded string `'grapesjs-mjml'`.
- **`editor.setComponents(htmlString)` with compiled HTML:** Unsupported round-trip. Loses component structure. Load only via `loadProjectData(json)`.
- **`mj-attributes` in block content strings:** Confirmed architecturally broken in grapesjs-mjml (Mautic forum moderator, issue #17, CLAUDE.md). Defaults are silently dropped.
- **`mj-include` in block content strings:** Compile-time directive; editor operates on flat MJML; includes have no runtime representation.
- **`grapesjs@0.23.2`:** Latest on npm but outside `@grapesjs/react@2.0.0` peerDep range `^0.22.5`. Do not upgrade.
- **`mjml@5.x`:** Latest on npm but breaking changes vs mjml-browser@4 bundled in grapesjs-mjml. Do not use.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MJML drag-drop canvas | Custom editor | grapesjs-mjml | 6-12 months of work; handles component model, inline edit, live preview |
| MJML browser compilation | Custom MJML parser | mjml-browser (bundled in grapesjs-mjml) | MJML compilation is not trivial; version parity with server compile matters |
| React StrictMode double-init guard | useRef/flag hack | @grapesjs/react wrapper | Official wrapper handles lifecycle correctly |
| localStorage serialization format | Custom JSON schema | GrapesJS `getProjectData()` / `loadProjectData()` API | Canonical format; only reliable persistence mechanism |

**Key insight:** The entire value of grapesjs-mjml is that it already solves MJML-as-component-tree. The spike's only job is to verify it works at the pinned versions.

---

## mj-attributes Experiment Design (Criterion #5)

The experiment is two-part: negative confirmation and positive validation.

### Part A: Negative Confirmation (expected to fail)

**Goal:** Confirm that `mj-attributes` defaults are silently dropped when present in imported/loaded MJML.

**Procedure:**
1. Create a minimal MJML string containing `mj-attributes`:
   ```xml
   <mjml>
     <mj-head>
       <mj-attributes>
         <mj-text color="#ff0000" />
       </mj-attributes>
     </mj-head>
     <mj-body>
       <mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section>
     </mj-body>
   </mjml>
   ```
2. Load it into the editor (via `fromElement` or `setComponents` — even though setComponents is lossy, the goal is just to observe what happens).
3. Observe canvas: does the text render red?
4. Run `editor.getHtml()` and POST to `/api/compile`. Does compiled HTML have `color:#ff0000` on the text?
5. **Expected:** No — `mj-attributes` is ignored; text renders in default color.
6. **Document:** "mj-attributes confirmed dropped. BLOCK_DEFAULTS mitigation is required."

### Part B: Positive Validation (must pass for gate)

**Goal:** Confirm that a branded block with all defaults inlined compiles correctly with NO mj-head injection.

**Procedure:**
1. Drop the `ddroidd-hero` block onto a fresh canvas.
2. Run `editor.getProjectData()` → save → `loadProjectData()` → reload.
3. Assert canvas state is identical (deep-equal JSON).
4. Run `editor.getHtml()` → POST to `/api/compile` with NO mj-head in the server wrapper.
5. Open compiled HTML in a browser. Verify: text is white (`#ffffff`), font stack is `Calibri/...`, background is `#0B1624`.
6. Save HTML to file. Run `QuickEmailTest.ps1` (if Outlook COM available).
7. **Expected:** Correct rendering entirely from inlined defaults. No `mj-attributes` in the chain.
8. **Document:** "BLOCK_DEFAULTS mitigation validated. Inlined defaults survive round-trip and compile without mj-head."

### Documentation Checklist for Criterion #5

- [ ] Does `fluid-on-mobile` on `mj-image` survive `getProjectData()`/`loadProjectData()`?
- [ ] Does `fluid-on-mobile` appear in compiled HTML output?
- [ ] Does `background-url` on `mj-section` survive as a manually-set attribute?
- [ ] Does `background-url` appear in compiled HTML output?
- [ ] Are there any MJML compile warnings or errors from the body fragment?

---

## Common Pitfalls

### Pitfall 1: Computed pluginsOpts Key (Issue #223)

**What goes wrong:** Blocks appear in the panel but cannot be dropped onto the canvas.
**Why it happens:** The grapesjs-mjml plugin registers itself under its string name `'grapesjs-mjml'`. When `pluginsOpts` uses `[grapesjsMjml]` (computed key from the import), the plugin options are stored under a different key and the plugin initializes with defaults — missing critical config.
**How to avoid:** Always use the hardcoded string:
```typescript
pluginsOpts: { 'grapesjs-mjml': { ... } }
```
**Warning signs:** Blocks visible in panel; drag-drop over canvas doesn't place the block.

### Pitfall 2: getHtml() Returns a Fragment, Not a Full MJML Document

**What goes wrong:** Passing `editor.getHtml()` directly to `mjml()` on the server throws a parse error ("Root component 'mjml' not found").
**Why it happens:** `editor.getHtml()` returns only the `mj-section`/`mj-column` body content, no `<mjml><mj-body>` wrapper. This is confirmed from the bundle source: `preMjml` and `postMjml` both default to `''`.
**How to avoid:** Always wrap server-side before calling `mjml()`:
```typescript
const full = `<mjml><mj-body>${fragment}</mj-body></mjml>`;
```
**Warning signs:** `mjml()` throws or returns empty HTML.

### Pitfall 3: Undo History Lost After loadProjectData

**What goes wrong:** Test asserts undo works across browser reload and fails because pre-reload edits cannot be undone.
**Why it happens:** `loadProjectData()` resets the UndoManager. Undo history is in-memory only and does not serialize into project JSON.
**How to avoid:** Define criterion #3 precisely: undo/redo works for new edits AFTER reload; the loaded state reflects edits made before save.
**Warning signs:** Mistakenly treating "can't undo pre-reload edit" as a bug.

### Pitfall 4: mj-attributes Silently Dropped

**What goes wrong:** Block renders differently than designed — wrong color, wrong font — and the cause is non-obvious.
**Why it happens:** `mj-attributes` is architecturally broken in grapesjs-mjml (confirmed: Mautic forum, issue #17). Global defaults are never applied; each element renders with MJML's own defaults instead of brand values.
**How to avoid:** Never rely on `mj-attributes`. Inline all values in BLOCK_DEFAULTS and reference them in each block content string.
**Warning signs:** White background text rendered black; font appears as generic sans-serif instead of Calibri/Roboto stack.

### Pitfall 5: Outlook COM Not Available (New Outlook)

**What goes wrong:** `QuickEmailTest.ps1 -PreviewOnly` fails with `Could not connect to Outlook`.
**Why it happens:** The dev machine has "new Outlook for Windows" (Microsoft Store app, `Microsoft.OutlookForWindows`), which does NOT support COM automation. COM requires classic Outlook (Office 365 MSI / Office 2019/2021 volume).
**How to avoid:** Surface this blocker to the user before the email-render verification task. Fallback options: (a) use a Windows machine with classic Outlook; (b) send via EmailTester.ps1 to Gmail only (does not require Outlook); (c) use a hosted email testing service (Litmus / Email on Acid — out of scope but worth noting as fallback).
**Warning signs:** `New-Object -ComObject Outlook.Application` throws immediately.

### Pitfall 6: grapesjs@0.22.16 Runtime Incompatibility with grapesjs-mjml@1.0.8

**What goes wrong:** Editor mounts but some component type is not registered; canvas renders empty or blocks fail to instantiate.
**Why it happens:** grapesjs-mjml's internal component type registration may rely on GrapesJS APIs that changed between 0.21.x and 0.22.x. No peerDep conflict at install time does not mean runtime compatibility.
**How to avoid:** This is the spike's primary question. If this fails: fall back to `grapesjs@0.21.2` with direct mount (no `@grapesjs/react`).
**Warning signs:** Console errors referencing undefined GrapesJS API methods after mount; empty canvas despite successful plugin init.

---

## Code Examples

### Express Compile Endpoint (Minimal)

```typescript
// Source: mjml npm package API + verified getHtml() output format from grapesjs-mjml@1.0.8 bundle

import express from 'express';
import cors from 'cors';
import mjml2html from 'mjml';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.post('/api/compile', (req, res) => {
  const { mjml: bodyFragment } = req.body;
  const fullMjml = `<mjml><mj-body>${bodyFragment.trim()}</mj-body></mjml>`;
  const result = mjml2html(fullMjml, { validationLevel: 'soft', minify: false });
  res.json({ html: result.html, errors: result.errors });
});

app.listen(3000, () => console.log('API: http://localhost:3000'));
```

### localStorage Round-Trip Test (Browser Console)

```typescript
// Run in browser console after loading editor with a branded block
const key = 'ddroidd_spike_test';
const before = JSON.stringify(editor.getProjectData());
localStorage.setItem(key, before);
editor.loadProjectData(JSON.parse(localStorage.getItem(key)));
const after = JSON.stringify(editor.getProjectData());
console.log('Round-trip identical:', before === after);
// Expected: true
// If false: log the diff to identify what changed
```

### Compile and Write to File (Browser → Server → File)

```typescript
// Client side: extract MJML and send to server
const compileDraft = async (editor: any) => {
  const mjmlFragment = editor.getHtml();
  const res = await fetch('http://localhost:3000/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mjml: mjmlFragment }),
  });
  const { html, errors } = await res.json();
  console.log('Compile errors:', errors);
  return html;
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `grapesjs.init()` in `useEffect` | `@grapesjs/react` wrapper | @grapesjs/react 2.0.0 (2025) | Handles StrictMode, cleanup, declarative config |
| `mjml@5.x` breaking changes (skeleton, minification) | `mjml@4.18.0` pinned | mjml v5 release | v5 breaks preview/export parity with mjml-browser@4 |
| `[grapesJSMJML]` computed key | `'grapesjs-mjml'` hardcoded string | Issue #223 discovery | Fixes block drop failure |
| Loading hand-authored MJML via setComponents | Re-author as block definitions | Issue #35 / #194 discovery | Prevents mj-head corruption and empty re-save |

**Deprecated/outdated:**
- `grapesjs-react` (no scope, old npm package): maintenance stopped; use `@grapesjs/react@2.0.0`
- `editor.setComponents(compiledHtml)`: unsupported round-trip; use `loadProjectData(json)` only

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All (Vite, Express, mjml) | YES | v24.16.0 | — |
| npm | Package install | YES | 11.13.0 | — |
| Outlook COM | D-05 QuickEmailTest.ps1 | NO | new Outlook (Store app — no COM) | EmailTester.ps1 (Gmail only) or machine with classic Outlook |
| Gmail inbox | D-05 EmailTester.ps1 | [ASSUMED] — not probed | — | — |
| PowerShell | D-05 scripts | YES (Windows 11) | Built-in | — |

**Missing dependencies with no fallback:**
- Classic Outlook COM — required for `QuickEmailTest.ps1 -PreviewOnly`. The dev machine has new Outlook (Store app) which does NOT support `New-Object -ComObject Outlook.Application`. This BLOCKS criterion #4 for the Outlook half. **Planner must surface to user before scheduling the Outlook verification task.**

**Missing dependencies with fallback:**
- Outlook COM → fallback to Gmail-only verification via `EmailTester.ps1`. Partial pass for criterion #4 (Gmail only, not both clients).

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly set to false — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (Phase 1 is a spike — validation is manual observation + console assertions) |
| Config file | N/A |
| Quick run command | Visual inspection + browser console assertions |
| Full suite command | All 5 exit criteria manually verified in sequence |

**Rationale:** Phase 1 is explicitly a feasibility spike. The "tests" are the 5 exit criteria themselves — manual, observable checkpoints. A formal test suite (Jest/Vitest) is not set up in this phase; if one is desired, it belongs in Wave 0 setup. Given the spike nature, the validation architecture is a defined procedure, not an automated suite.

### Phase Requirements → Validation Map

| Req ID | Behavior | Validation Type | Observable Signal |
|--------|----------|----------------|-------------------|
| EDIT-01 | Drag blocks from panel onto canvas | Manual | Blocks panel visible; drag to canvas places block |
| EDIT-02 | Reorder, nest, delete blocks | Manual | Move existing block; delete; verify canvas updates |
| EDIT-03 | Inline text editing | Manual | Double-click mj-text on canvas; edit; content changes |
| EDIT-04 | Undo / redo | Manual | Edit text; Ctrl+Z reverts; Ctrl+Y re-applies |
| EDIT-05 | Generic block types present | Manual | All 5 generic types visible in blocks panel and droppable |

### Exit Criteria Verification Procedure

**Criterion 1 — Mount without console errors:**
- Open browser DevTools console before loading the app
- Mount succeeds when: no red errors, GjsEditor renders canvas, blocks panel appears
- FAIL signal: `TypeError`, `Cannot read property`, or blank canvas

**Criterion 2 — Drag/drop + reorder (≥2 branded + 5 generic):**
- Drop each of: mj-text, mj-image, mj-button, mj-1-column (or 2-col/3-col), mj-divider, mj-spacer
- Drop ddroidd-hero, ddroidd-projects
- Reorder two blocks by drag
- PASS: all blocks drop; reorder works

**Criterion 3 — localStorage round-trip (byte-identical):**
- Add hero block; edit its text inline
- Run console assertion: `JSON.stringify(getProjectData())` before and after save/load cycle
- PASS: `before === after` logs `true`
- Verify: undo/redo functional for new edit after reload

**Criterion 4 — Server compile → Outlook + Gmail:**
- Call `editor.getHtml()` → POST `/api/compile` → write HTML to `dist/spike-output.html`
- Outlook: `.\QuickEmailTest.ps1 -HtmlFilePath dist\spike-output.html -PreviewOnly`
  - BLOCKED on dev machine: new Outlook (no COM). Must use a machine with classic Outlook or skip Outlook half.
- Gmail: `.\EmailTester.ps1 -HtmlFilePath dist\spike-output.html -TestEmails sorin.vieriu@ddroidd.com`
- PASS: no broken fonts, no dark-on-dark text, no spacing failures

**Criterion 5 — mj-attributes experiment documented:**
- Run Part A (negative): confirm mj-attributes dropped
- Run Part B (positive): confirm inlined defaults survive round-trip + compile without mj-head
- Document fluid-on-mobile and background-url observations
- PASS: written documentation exists; BLOCK_DEFAULTS mitigation validated

### Wave 0 Gaps
- [ ] `app/client/` directory and `package.json` — create before any code tasks
- [ ] `app/server/` directory and `package.json` — create before server tasks
- [ ] TypeScript config (`tsconfig.json`) in both client and server
- [ ] `vite.config.ts` with proxy config (`/api` → `http://localhost:3000`)

---

## Security Domain

> `security_enforcement` not explicitly set to false — section included.

Phase 1 is a local dev spike with no auth, no real users, no persistent DB, and no public exposure. Security controls are minimal by design.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (deferred to Phase 2) | — |
| V3 Session Management | No (deferred to Phase 2) | — |
| V4 Access Control | No (local dev only) | — |
| V5 Input Validation | Minimal | Basic Express body size limit (`1mb`); MJML compile errors logged |
| V6 Cryptography | No | — |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized MJML body to server | Denial of service | `express.json({ limit: '1mb' })` |
| CORS open to any origin | Spoofing | Restrict to `http://localhost:5173` in dev |

Phase 1 spike: no user auth, no external exposure, no secrets, no DB. ASVS controls are Phase 2 concerns.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@grapesjs/react` StrictMode double-init guard works via `editor.Blocks.get(id)` check | Mount Pattern | Double-registration of branded blocks; can be observed immediately and fixed |
| A2 | `fluid-on-mobile` on mj-image is passed through to compiled HTML output | Branded Block Definition | Spike criterion #5 document may be incomplete; low risk — experiment will reveal |
| A3 | `background-url` attribute on mj-section, set manually in block content, survives round-trip | Branded Block Definition | Hero block may lose background image; document in experiment; use background-color as fallback |
| A4 | Gmail is accessible for EmailTester.ps1 test send | Environment Availability | Cannot verify criterion #4 Gmail half; user must confirm email address and credentials |
| A5 | grapesjs@0.22.16 + grapesjs-mjml@1.0.8 are runtime-compatible | ALL | Entire spike fails; fall back to grapesjs@0.21.2 + direct mount per STATE.md fallback plan |

**If A5 is wrong:** Follow the documented fallback in STATE.md — switch to `grapesjs@0.21.2` with direct `grapesjs.init()` in `useEffect` and drop `@grapesjs/react`. Block definitions and server compile endpoint are unaffected.

---

## Open Questions

1. **Outlook COM on dev machine**
   - What we know: Dev machine has new Outlook (Store app); `New-Object -ComObject Outlook.Application` will fail
   - What's unclear: Whether another machine with classic Outlook is available for the D-05 gate
   - Recommendation: Planner should add a human checkpoint before the Outlook verification task asking the user to confirm Outlook availability

2. **`background-url` on mj-section in the editor canvas**
   - What we know: Not a default panel trait in grapesjs-mjml; CLAUDE.md flags it as risky
   - What's unclear: Whether setting it directly in block content string causes it to appear in `getHtml()` output
   - Recommendation: Include in the hero block content string and document the result in criterion #5 experiment

3. **`fluid-on-mobile` round-trip fidelity**
   - What we know: Attribute is valid MJML; not exposed as a panel trait in grapesjs-mjml
   - What's unclear: Whether GrapesJS strips non-trait attributes during getProjectData serialization
   - Recommendation: Include in hero block and verify in criterion #5 experiment

---

## Sources

### Primary (HIGH confidence)
- `grapesjs-mjml@1.0.8 dist/index.js` (npm pack + local inspection) — verified block content format, `getHtml()` behavior, `preMjml`/`postMjml` defaults, `mjml-code` command structure, `pluginsOpts` defaults
- `grapesjs-mjml@1.0.8 README.md` (npm pack + local inspection) — plugin options table, supported component list, ESM usage pattern
- npm registry (verified 2026-06-25): all package versions, peer dependencies, publish dates
- `CLAUDE.md` (project root) — pinned version triple, compatibility matrix, pluginsOpts string-key requirement, import/reauthor verdict, block authoring pattern, "What NOT to Use" table

### Secondary (MEDIUM confidence)
- gjs.market Next.js integration guide — `@grapesjs/react` mount pattern, hardcoded string key requirement, StrictMode guard; Vite SPA portions carry over but Next.js-specific patterns (SSR, `dynamic()`) do not apply
- Mautic forum (forum.mautic.org) — moderator-confirmed `mj-attributes` architectural limitation
- GitHub issue #17 (artf/grapesjs-mjml) — attribute loss at load time; confirms round-trip attribute fidelity concern
- GrapesJS Blocks API docs (grapesjs.com/docs/modules/Blocks.html) — `editor.Blocks.add()` signature

### Tertiary (LOW confidence)
- WebSearch summary: `editor.getHtml()` returns MJML source — now superseded by verified bundle inspection

---

## Metadata

**Confidence breakdown:**
- Block content format and getHtml() behavior: HIGH — verified from bundle source
- Mount pattern (@grapesjs/react + pluginsOpts): MEDIUM — verified from README and gjs.market guide; runtime behavior unverified
- Runtime compatibility (0.22.16 + grapesjs-mjml@1.0.8): LOW — this is the spike's question; no peerDep conflict ≠ runtime compat
- Server compile (mjml@4.18.0): HIGH — standard mjml npm API
- Pitfalls: HIGH — sourced from CLAUDE.md, GitHub issues, and bundle verification
- Outlook COM availability: HIGH (confirmed NOT available on dev machine)

**Research date:** 2026-06-25
**Valid until:** 2026-07-25 (stable stack; grapesjs-mjml 1.0.8 pinned)
