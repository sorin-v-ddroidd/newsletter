---
phase: quick-260705-htv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/server/src/services/compile.ts
  - app/server/src/routes/compile.ts
  - app/server/scripts/verify-compile.ts
  - app/server/package.json
  - app/client/src/editor/actions.ts
  - app/client/src/editor/TopBar.tsx
autonomous: true
requirements: [EXPORT-04]

must_haves:
  truths:
    - "Compiled HTML always carries the fixed server-injected mj-head (Roboto font, white-text/16px defaults, .tracking-pixel display:none rule) regardless of what editor.getHtml() emits"
    - "Any mj-head the editor emits is stripped and replaced — exactly one head source"
    - "A non-dev can click Export HTML in the toolbar and receive a downloaded newsletter-YYYY-MM-DD.html file"
    - "When the compiler returns warnings/errors, they are shown in the UI and the file is NOT silently downloaded — the user must confirm download-anyway"
  artifacts:
    - path: "app/server/src/services/compile.ts"
      provides: "compileNewsletter service: mj-head injection + mjml@4.18.0 soft compile; exports HEAD_MARKERS for tests"
      exports: ["compileNewsletter", "HEAD_MARKERS"]
    - path: "app/server/scripts/verify-compile.ts"
      provides: "Headless gate: compiles fixtures through the service and asserts injected head markers present + emitted head stripped"
    - path: "app/client/src/editor/TopBar.tsx"
      provides: "Export HTML button + warning banner"
  key_links:
    - from: "app/client/src/editor/TopBar.tsx"
      to: "app/client/src/editor/actions.ts"
      via: "exportHtml(editor) returns { html, errors }; TopBar renders banner + triggers download"
      pattern: "exportHtml"
    - from: "app/server/src/routes/compile.ts"
      to: "app/server/src/services/compile.ts"
      via: "route calls compileNewsletter"
      pattern: "compileNewsletter"
---

<objective>
Turn the Phase-1 spike compile route into a real Export HTML flow.

1. Server owns the mj-head: extract compile into a service that strips any editor-emitted mj-head and injects one fixed, canonical mj-head (fonts, defaults, .tracking-pixel rule) before compiling with mjml@4.18.0. One source of truth for the head (per mjml-email-safety.md EXPORT-04).
2. Client Export HTML: a toolbar button compiles the current canvas and downloads the client-safe HTML as a dated file.
3. Surface compile warnings to the user — never silently ship partial HTML.

Purpose: Delivers the core product promise — a non-dev exports production-ready, client-safe HTML with the branded head baked in, without touching code.
Output: services/compile.ts, thin route, verify-compile.ts gate, Export HTML button + warning banner.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.claude/rules/mjml-email-safety.md
@.claude/rules/backend-express.md
@.claude/rules/grapesjs.md
@.claude/rules/code-style.md
@.claude/rules/gotchas.md
@.claude/rules/no-commit.md

<interfaces>
<!-- Current compile route (app/server/src/routes/compile.ts) — logic to relocate into a service -->
POST /api/compile  body { mjml: string }  -> res.json({ html: string, errors: MJMLParseError[] })
- conditional wrap: `/<mjml/i.test(trimmed)` — if editor already emitted a full <mjml> doc, don't re-wrap
- mjml2html(fullMjml, { validationLevel: 'soft', minify: false })
- also writes dist/spike-output.html at REPO_ROOT (dev client-render gate consumes it) — keep this

<!-- Legacy hand-authored head (src/components/head.mjml) — SOURCE for the injected head.
     NOTE: it wrongly nests <mj-style> INSIDE <mj-attributes>. In the injected head, mj-style
     MUST be a direct child of mj-head (sibling of mj-attributes), or the tracking-pixel rule
     won't emit. mj-attributes in an INJECTED head is safe — the issue #35 corruption is only
     when importing mj-attributes INTO the editor (mjml-email-safety.md mandates head injection). -->
<mj-title>DDROIDD Digest</mj-title>
<mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:wght@400;700" />
mj-text defaults: color #ffffff, line-height 24px, font-size 16px
mj-all font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif
mj-style: .tracking-pixel { display: none; }

<!-- Client action layer (app/client/src/editor/actions.ts) — React-free; functions take editor,
     return data or void, never import components/hooks. compileDraft currently discards HTML/logs only. -->
export const save/load/compileDraft/assertRoundTrip/handleNewFromTemplate = (editor) => ...
fetch('/api/compile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mjml }) })

<!-- TopBar (app/client/src/editor/TopBar.tsx): withEditor(fn) helper wraps window.__ddroiddEditor.
     renderActions() holds the button row. lucide-react + shadcn Button available. No toast/sonner
     primitive exists — surface warnings with a state-driven inline banner, not a toast lib. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract compile into a head-injecting service + thin route + headless gate</name>
  <files>app/server/src/services/compile.ts, app/server/src/routes/compile.ts, app/server/scripts/verify-compile.ts, app/server/package.json</files>
  <action>
Create `app/server/src/services/compile.ts` exporting `compileNewsletter(editorOutput: string): { html: string; errors: MJMLParseError[] }` (import the error type from 'mjml' / '@types/mjml'; use `type` alias per code-style, `import type` where type-only). Steps inside:
1. Trim input.
2. Ensure an `<mjml>` root: if `/<mjml/i` does NOT match, wrap as `<mjml></mjml>` with the fragment inside a single `<mj-body>` (preserve current conditional-wrap behavior so a bare fragment still compiles).
3. Strip any existing head the editor emitted: remove all `<mj-head ...>...</mj-head>` (case-insensitive, dot-matches-newline) so there is exactly one head source.
4. Inject the canonical head immediately after the opening `<mjml...>` tag. Define it as a module-level `const CANONICAL_HEAD` string containing, in this order: `<mj-title>DDROIDD Digest</mj-title>`, the Roboto `<mj-font ... />`, an `<mj-attributes>` block with `<mj-text color="#ffffff" line-height="24px" font-size="16px" />` and `<mj-all font-family="Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif" />`, and — as a DIRECT child of mj-head, NOT inside mj-attributes — `<mj-style>.tracking-pixel { display: none; }</mj-style>`. (The legacy head.mjml nests mj-style wrongly; fix it here.)
5. Compile with `mjml2html(fullMjml, { validationLevel: 'soft', minify: false })` and return `{ html, errors }`.
Also export `const HEAD_MARKERS` = the substrings a correctly-injected + compiled output must contain, for the gate to assert (choose markers that survive compile: e.g. the Roboto font URL `family=Roboto` and the tracking-pixel rule text `.tracking-pixel`). Add a JSDoc `@description` on `compileNewsletter` per jsdoc.md.

Rewrite `app/server/src/routes/compile.ts` to be thin (backend-express.md): validate `req.body.mjml` is a string (400 with safe message otherwise), call `compileNewsletter`, keep the existing non-fatal write of the compiled HTML to `dist/spike-output.html` at REPO_ROOT (dev render gate depends on it), then `res.json({ html, errors })`. Move no compile/mjml logic into the handler — it only validates, calls the service, writes the dev artifact, responds.

Create `app/server/scripts/verify-compile.ts`: a headless node script (run via tsx, mirroring verify-blocks.ts style) that calls `compileNewsletter` on two inline MJML fixtures and exits non-zero with a clear message on any failed assertion, printing PASS lines otherwise:
- Fixture 1 (bare fragment) `<mj-section><mj-column><mj-text>hi</mj-text></mj-column></mj-section>`: assert every `HEAD_MARKERS` substring appears in `result.html`, AND assert `result.errors.length === 0` (proves the injected canonical head is itself valid MJML — otherwise the export warning banner would cry wolf on every valid newsletter).
- Fixture 2 (full doc that ships its OWN mj-head carrying a unique sentinel, e.g. `<mj-head><mj-title>SHOULD-BE-STRIPPED</mj-title><mj-font name="Sentinel" href="https://fonts.googleapis.com/css?family=SENTINEL"/></mj-head>`): assert every `HEAD_MARKERS` substring is PRESENT (Roboto family) AND assert the sentinel strings (`family=SENTINEL` and `SHOULD-BE-STRIPPED`) are ABSENT from `result.html`. This is the real proof of strip+replace — do NOT rely on counting `<head>` (MJML always merges to exactly one `<head>` whether or not the emitted head was stripped, so a `<head>` count can't discriminate).

Add an npm script to `app/server/package.json`: `"verify:compile": "tsx scripts/verify-compile.ts"`.
  </action>
  <verify>
    <automated>cd app/server && npm run verify:compile && npm run build</automated>
  </verify>
  <done>compileNewsletter injects the fixed head and strips editor-emitted heads; route is thin; `npm run verify:compile` prints PASS — markers present, clean fixture errors:[], and sentinel from the emitted head absent; `tsc` build clean.</done>
</task>

<task type="auto">
  <name>Task 2: Export HTML action + toolbar button + compile-warning banner</name>
  <files>app/client/src/editor/actions.ts, app/client/src/editor/TopBar.tsx</files>
  <action>
In `app/client/src/editor/actions.ts` (keep it React-free — functions take `editor`, return data/void, no component/hook imports):
1. Extract a shared `postCompile(mjml: string): Promise<{ html: string; errors: unknown[] }>` that does the existing fetch to `/api/compile` and throws on non-ok (typed error message). Refactor `compileDraft` to use it (preserve its current dev logging behavior).
2. Add `triggerDownload(html: string, filename: string): void` — a pure helper that creates a `Blob([html], { type: 'text/html' })`, an object URL, a temporary anchor with `download=filename`, clicks it, then revokes the URL. No React.
3. Add `exportHtml(editor: GrapesEditor): Promise<{ html: string; errors: unknown[] }>` — calls `editor.getHtml()`, `postCompile`, and returns `{ html, errors }` to the caller (the caller decides download-vs-warn UX). Do NOT download inside exportHtml. Use `const` throughout, destructure, early return on the fail path, curly braces on every `if` (code-style.md, gotchas.md).
Add filename helper producing `newsletter-YYYY-MM-DD.html` from the current date.

In `app/client/src/editor/TopBar.tsx`:
1. Add a state-driven inline warning banner (React `useState`) holding `{ html: string; warnings: string[] } | null` — no toast/sonner (none installed). Render it directly under the `<header>` (wrap the header + banner in a fragment or a wrapping div) so it's visible above the editor; make it dismissible (X button) and give it a "Download anyway" action button.
2. Leave the existing "Preview & Compile" button UNCHANGED — it keeps its current console-logging behavior. Warning-surfacing lands ONLY on the new Export path; do not wire the banner into Preview & Compile.
3. Add an "Export HTML" primary/secondary Button in `renderActions()` (lucide `Download` icon) next to Preview & Compile. Its handler: guard `window.__ddroiddEditor`, call `exportHtml`, then — if `errors.length > 0`: set banner state to `{ html, warnings: errors.map(String) }` and do NOT auto-download (honor mjml-email-safety.md "never silently ship partial HTML"); else call `triggerDownload(html, filename)` immediately and clear any banner. The banner's "Download anyway" button calls `triggerDownload(banner.html, filename)` then dismisses. Handle fetch rejection with a catch that surfaces an error banner (reuse the same banner with the error text), never an unhandled rejection.
Keep styling in Tailwind/shadcn utilities only (styling.md) — no inline styles. Extract the banner into a `renderWarningBanner()` render function per code-style.md so the return stays a flat outline.
  </action>
  <verify>
    <automated>cd app/client && npm run typecheck && npm run build</automated>
  </verify>
  <done>Export HTML button exists in the toolbar; clicking with a clean compile downloads newsletter-YYYY-MM-DD.html; a compile with warnings shows a dismissible banner listing them with a Download-anyway action and does not auto-download; Preview & Compile behavior unchanged; client typecheck + build pass.</done>
</task>

</tasks>

<verification>
- `cd app/server && npm run verify:compile` — asserts injected head markers (Roboto font URL, .tracking-pixel rule) present, clean fixture compiles with errors:[], and the editor-emitted head's sentinel is stripped (absent) — proving strip+replace.
- `cd app/server && npm run build` — server tsc clean.
- `cd app/client && npm run build` — client tsc + vite build clean.
- Manual (non-gate, optional): run `npm run dev`, click Export HTML → a newsletter-YYYY-MM-DD.html downloads; open it and confirm the `<style>` contains `.tracking-pixel{display:none}` and a Roboto font reference.
</verification>

<success_criteria>
- Exactly one mj-head in compiled output, server-injected, independent of editor.getHtml() emitting its own.
- Compiled HTML contains the Roboto font reference, white/16px text defaults, and the .tracking-pixel display:none rule.
- Export HTML toolbar button downloads a dated .html file.
- Compile warnings are surfaced in the UI and block silent download (Download-anyway requires user confirmation).
- mjml stays 4.18.0, validationLevel soft. No auth/DB introduced. No git commit performed (no-commit.md).
</success_criteria>

<output>
Create `.planning/quick/260705-htv-export-html-download-button-in-editor-se/260705-htv-SUMMARY.md` when done.
</output>
