---
phase: quick-260710-lty
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/shared/mjml-head.ts
  - app/server/src/services/compile.ts
  - app/server/tsconfig.json
  - app/server/package.json
  - app/server/scripts/verify-parity.ts
  - app/client/package.json
  - app/client/vite.config.ts
  - app/client/tsconfig.json
  - app/client/src/types/mjml-browser.d.ts
  - app/client/src/lib/compile.ts
  - app/client/src/editor/actions.ts
  - app/client/src/editor/TopBar.tsx
  - app/client/vercel.json
autonomous: true
requirements: [EXPORT-04, STATIC-DEPLOY]
must_haves:
  truths:
    - "Client compiles MJML to client-safe HTML entirely in-browser (no /api/compile fetch)"
    - "Export HTML and Preview & Compile work with the server process stopped"
    - "Server mjml path and client mjml-browser path produce identical HTML for TEMPLATE_MJML"
    - "There is exactly ONE definition of CANONICAL_HEAD (in app/shared), imported by both sides"
    - "The Vite production build (app/client) succeeds and emits dist/index.html"
  artifacts:
    - path: "app/shared/mjml-head.ts"
      provides: "CANONICAL_HEAD, HEAD_MARKERS, and pure buildFullMjml(editorOutput) transform"
      contains: "buildFullMjml"
    - path: "app/client/src/lib/compile.ts"
      provides: "In-browser compileNewsletter via mjml-browser"
      contains: "mjml-browser"
    - path: "app/server/scripts/verify-parity.ts"
      provides: "Automated server-vs-client HTML parity proof"
    - path: "app/client/vercel.json"
      provides: "Static build + SPA rewrite config"
  key_links:
    - from: "app/client/src/editor/actions.ts"
      to: "app/client/src/lib/compile.ts"
      via: "import compileNewsletter (replaces fetch /api/compile)"
      pattern: "from '@/lib/compile'"
    - from: "app/server/src/services/compile.ts"
      to: "app/shared/mjml-head.ts"
      via: "relative import of buildFullMjml + HEAD_MARKERS"
      pattern: "shared/mjml-head"
    - from: "app/client/src/lib/compile.ts"
      to: "app/shared/mjml-head.ts"
      via: "@shared alias import of buildFullMjml"
      pattern: "@shared/mjml-head"
---

<objective>
Make the DDROIDD Newsletter Builder deployable as a static site (Vercel) by moving MJML
compilation from the Express `/api/compile` endpoint into the browser. After this plan the
client has zero runtime dependency on the server: Save/Load are already localStorage-only, and
Export/Preview will compile in-browser with `mjml-browser@4.18.0`.

Purpose: A marketing team deploys and uses the builder as a pure static SPA — no Node server,
no Postgres, no login. The only remaining server coupling (`/api/compile`) is removed.

Output: A shared, compiler-agnostic head/transform module (one source of truth for the
canonical `mj-head`, satisfying EXPORT-04); an in-browser compile lib; rewritten client actions;
an automated parity proof that server `mjml` and client `mjml-browser` emit identical HTML; and
Vercel static-deploy config.

The Express server is INTENTIONALLY kept — it hosts the parity-proof harness (its `mjml`
install) and stays available for the dev real-client render gate. It is simply no longer
required at runtime by the deployed client.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/rules/mjml-email-safety.md
@.claude/rules/grapesjs.md
@.claude/rules/versions.md
@.claude/rules/code-style.md
@.claude/rules/typescript.md
@.claude/rules/gotchas.md

<interfaces>
<!-- Contracts the executor needs. Extracted from the codebase — do not go re-explore. -->

Current server transform (app/server/src/services/compile.ts) — the pure string ops to extract:
```ts
// 1. conditional-wrap a bare fragment into a full <mjml> doc
const wrapped = /<mjml/i.test(trimmed)
  ? trimmed
  : `<mjml>\n  <mj-body>\n    ${trimmed}\n  </mj-body>\n</mjml>`;
// 2. strip any editor-emitted mj-head
const withoutHead = wrapped.replace(/<mj-head[\s\S]*?<\/mj-head>/gi, '');
// 3. inject the single canonical head after the opening <mjml...> tag
const fullMjml = withoutHead.replace(/(<mjml[^>]*>)/i, `$1${CANONICAL_HEAD}`);
```
CANONICAL_HEAD (verbatim string) and `HEAD_MARKERS = ['family=Roboto', '.tracking-pixel']`
also live in that file today. verify-compile.ts imports `{ compileNewsletter, HEAD_MARKERS }`
from `'../src/services/compile'` — that import MUST keep working.

Runtime shape (both engines): mjml2html is SYNCHRONOUS at runtime despite the @types Promise
signature. Server casts `as unknown as MJMLParseResults` from `mjml-core`. Result shape:
`{ html: string; errors: Array<{ line; message; tagName; formattedMessage }> }`.

Client action contract that callers depend on (actions.ts + TopBar.tsx):
```ts
type CompileResponse = { html: string; errors: unknown[] };
exportHtml(editor): returns { html, errors }        // TopBar downloads or shows warning banner
compileDraft(editor): currently Promise<void>       // "Preview & Compile" button
formatCompileError(error): string                    // maps an error object to a display string
```
TopBar `handleExport` reads `errors.length` and `errors.map(formatCompileError)`.

Cross-package headless import precedent: app/server/scripts/verify-blocks.ts already imports
client TS modules into a tsx server process — blocks are alias-free + browser-free pure strings.
TEMPLATE_MJML lives at app/client/src/editor/blocks/template.ts (a pure string; safe to import
headlessly).
</interfaces>

Import-path strategy (decided — do not re-litigate):
- Shared module lives at `app/shared/mjml-head.ts` (user-locked location).
- CLIENT imports it via a Vite alias `@shared` → `../shared`, mirrored in client tsconfig
  `paths`. BOTH are required: the tsconfig path satisfies `tsc`, the Vite alias satisfies the
  bundler. The `@/*` alias only maps to `app/client/src`, so it cannot reach `app/shared`.
- SERVER imports it via a relative path (`../../../shared/mjml-head` from services/). The server
  runs on `tsx` (dev + verify), which ignores `rootDir`. To keep the server's `tsc` emit green
  with a file imported from outside `src`, set server `rootDir` to `..` and add the shared glob
  to `include` (see Task 1). `scripts/` stays outside `include`, so `tsc` will not drag client
  code into the server program.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract shared head/transform module + refactor server compile</name>
  <files>app/shared/mjml-head.ts, app/server/src/services/compile.ts, app/server/tsconfig.json</files>
  <action>
Create `app/shared/mjml-head.ts` as a PURE, compiler-agnostic module (no mjml import of any
kind). Export three things:
  - `CANONICAL_HEAD` — the exact head string currently in server compile.ts (copy verbatim,
    including the `mj-style` tracking-pixel rule and the inline `a { color }` rule and every
    comment-worthy nuance; preserve whitespace).
  - `HEAD_MARKERS` — `['family=Roboto', '.tracking-pixel']` (typed `as const` or `string[]`).
  - `buildFullMjml(editorOutput: string): string` — the pure conditional-wrap → strip-mj-head →
    inject-CANONICAL_HEAD pipeline (the three regex steps from the interfaces block). This is the
    single source of the transform; it does NOT compile.
Use `type` over `interface` if any type is needed; no `any`.

Refactor `app/server/src/services/compile.ts`:
  - Remove the local `CANONICAL_HEAD` constant and the inline wrap/strip/inject lines.
  - Import `{ buildFullMjml, HEAD_MARKERS }` from `'../../../shared/mjml-head'` (no file
    extension — bundler resolution).
  - Re-export `HEAD_MARKERS` (`export { HEAD_MARKERS } from '../../../shared/mjml-head';` or
    re-declare an export) so `verify-compile.ts`'s `import { compileNewsletter, HEAD_MARKERS }`
    keeps resolving unchanged.
  - `compileNewsletter` now calls `mjml2html(buildFullMjml(editorOutput), { validationLevel:
    'soft', minify: false })` and keeps the existing `as unknown as MJMLParseResults` cast and
    the `{ html, errors }` return. Behavior must be byte-identical to today.

Update `app/server/tsconfig.json`: set `"rootDir": ".."` and change `"include"` to
`["src/**/*", "../shared/**/*"]`. Leave everything else untouched. (This only affects the unused
`tsc` emit layout; runtime uses tsx.)
  </action>
  <verify>
    <automated>cd app/server && npm run verify:compile && npm run build</automated>
  </verify>
  <done>verify:compile prints all PASS and exits 0; `npm run build` (real tsc emit) exits 0 with no TS6059/rootDir errors; CANONICAL_HEAD exists in exactly one place (app/shared/mjml-head.ts).</done>
</task>

<task type="auto">
  <name>Task 2: Add mjml-browser + in-browser client compile lib</name>
  <files>app/client/package.json, app/client/vite.config.ts, app/client/tsconfig.json, app/client/src/types/mjml-browser.d.ts, app/client/src/lib/compile.ts</files>
  <action>
Add `"mjml-browser": "4.18.0"` to `app/client/package.json` dependencies (exact pin, matching
the version grapesjs-mjml bundles and the server `mjml`). Install it (`npm install` in
app/client).

Add the `@shared` alias in TWO places:
  - `app/client/vite.config.ts` → `resolve.alias`: `'@shared': path.resolve(__dirname, '../shared')`.
  - `app/client/tsconfig.json` → `compilerOptions.paths`: add `"@shared/*": ["../shared/*"]`
    alongside the existing `"@/*"` entry.
Leave the existing `/api` dev proxy in vite.config.ts in place (now unused, harmless — a one-line
comment noting it is dead is fine).

Create `app/client/src/types/mjml-browser.d.ts` — an ambient module declaration for
`mjml-browser` (no published `@types`, so this avoids `any` with a documented reason). Declare
the default export as a synchronous function returning `{ html: string; errors: MjmlError[] }`
where `MjmlError = { line: number; message: string; tagName: string; formattedMessage: string }`,
and an options arg `{ validationLevel?: 'strict' | 'soft' | 'skip'; minify?: boolean }`.

Create `app/client/src/lib/compile.ts`:
  - `import mjml2html from 'mjml-browser';`
  - `import { buildFullMjml } from '@shared/mjml-head';`
  - Export `type CompileResult = { html: string; errors: MjmlError[] }` (or reuse the ambient
    type) and `compileNewsletter(editorOutput: string): CompileResult`.
  - Implementation mirrors the server: `const result = mjml2html(buildFullMjml(editorOutput),
    { validationLevel: 'soft', minify: false });` then `return { html: result.html, errors:
    result.errors };`. MUST be synchronous (mjml-browser is sync at runtime) — do NOT wrap in a
    Promise. The sync contract is load-bearing for the Task 3 preview (in-gesture window.open).
Follow code-style: `import type` for types, `type` over `interface`, curly braces on every `if`.
  </action>
  <verify>
    <automated>cd app/client && npm run build</automated>
  </verify>
  <done>`npm run build` (= `tsc --noEmit && vite build`) exits 0 — this proves BOTH the tsconfig `@shared` path and the Vite `@shared` alias resolve, mjml-browser is installed and typed, and dist/ is produced.</done>
</task>

<task type="auto">
  <name>Task 3: Rewrite actions.ts to compile in-browser + wire Preview UX</name>
  <files>app/client/src/editor/actions.ts, app/client/src/editor/TopBar.tsx</files>
  <action>
In `app/client/src/editor/actions.ts`:
  - Delete `postCompile` (the `fetch('/api/compile')` function) entirely.
  - `import { compileNewsletter } from '@/lib/compile';` (and its `CompileResult` type if used).
  - Keep the `CompileResponse` shape `{ html; errors }` consistent — or replace it with the
    imported `CompileResult`; whichever, TopBar's `errors.length` / `errors.map(formatCompileError)`
    must still typecheck.
  - `exportHtml(editor)` becomes SYNCHRONOUS: `return compileNewsletter(getExportMjml(editor));`
    (drop `async`/`Promise`). Keep it returning `{ html, errors }`.
  - `compileDraft(editor)` becomes SYNCHRONOUS and returns `{ html, errors }` (not
    `Promise<void>`). Remove ALL dead server-era lines: the `getHtml() first 200 chars` /
    `<mjml` / `HTML length` / `<!doctype` / `dist/spike-output.html written by server` logs.
  - Add a preview helper `openHtmlPreview(html: string): void`: create a `Blob([html], { type:
    'text/html' })`, `URL.createObjectURL`, `window.open(url, '_blank')`. Do NOT revoke the URL
    immediately (a new tab needs it alive to load) — revoke on a `setTimeout` (e.g. 60_000 ms) or
    leave it unrevoked. This mirrors triggerDownload but MUST NOT copy its immediate-revoke.

In `app/client/src/editor/TopBar.tsx`:
  - `handleExport` no longer needs `.then/.catch` on a Promise — call `exportHtml(editor)`
    synchronously inside a try/catch: on `errors.length > 0` set the warning banner; else
    `triggerDownload` + clear banner. (The compile can still throw on malformed input — keep a
    try/catch and route the message to the banner as today.)
  - `handleCompile` ("Preview & Compile"): call `compileDraft(editor)` synchronously INSIDE the
    click handler (do not await — awaiting would move `window.open` outside the user gesture and
    trigger popup blockers). On `errors.length > 0`, show the warning banner (reuse `setBanner`,
    include `html` so "Download anyway" still works). On success, `openHtmlPreview(html)` and
    clear the banner. Wrap in try/catch → banner on thrown error.
  - The `withEditor` wrapper stays. Adjust its typing only if the sync signatures require it.
Follow gotchas.md: no `setState` to children, curly braces on every `if`, return early.
  </action>
  <verify>
    <automated>cd app/client && npm run build</automated>
  </verify>
  <done>Build exits 0; actions.ts contains no `fetch(` and no `/api/compile`; compileDraft/exportHtml are synchronous; TopBar's Preview opens a compiled-HTML tab and Export downloads — both with the server process stopped.</done>
</task>

<task type="auto">
  <name>Task 4: Automated server-vs-client HTML parity proof</name>
  <files>app/server/package.json, app/server/scripts/verify-parity.ts</files>
  <action>
Add `"mjml-browser": "4.18.0"` to `app/server/package.json` devDependencies and install
(`npm install` in app/server). This lets a single tsx process (cwd app/server) resolve BOTH
`mjml` (already present) and `mjml-browser`. Add a script `"verify:parity": "tsx
scripts/verify-parity.ts"`.

Create `app/server/scripts/verify-parity.ts` (mirror verify-compile.ts style — PASS/FAIL lines,
`process.exit(1)` on failure):
  - `import mjml2html from 'mjml';`
  - `import mjmlBrowser from 'mjml-browser';`
  - `import { buildFullMjml } from '../../shared/mjml-head';`
  - `import { TEMPLATE_MJML } from '../../client/src/editor/blocks/template';`
    (NOTE the `editor/blocks/` segment — the blocks were moved there. Do NOT copy verify-blocks.ts's
    stale `../../client/src/blocks/` paths.)
  - Build the input ONCE: `const full = buildFullMjml(TEMPLATE_MJML);` — feed the SAME string to
    both engines so the transform is not double-applied and only the compiler differs.
  - Compile via both (both sync; cast the same way the services do if TS complains):
    `const serverHtml = mjml2html(full, { validationLevel: 'soft', minify: false }).html;`
    `const clientHtml = mjmlBrowser(full, { validationLevel: 'soft', minify: false }).html;`
  - Normalize whitespace before diffing (collapse runs of whitespace, trim) so a whitespace-only
    difference passes. Compare the normalized strings for exact equality.
  - PASS if equal → print PASS + exit 0. If they differ, print a FAIL line AND a short diff hint
    (e.g. first differing index + ~120 chars of context from each side) and `process.exit(1)`.
    A STRUCTURAL diff FAILS the task.
  </action>
  <verify>
    <automated>cd app/server && npm run verify:parity</automated>
  </verify>
  <done>`npm run verify:parity` prints PASS and exits 0 — server `mjml` and client `mjml-browser` produce identical (whitespace-normalized) HTML for the full template.</done>
</task>

<task type="auto">
  <name>Task 5: Vercel static-deploy config + deploy notes</name>
  <files>app/client/vercel.json</files>
  <action>
Create `app/client/vercel.json` for a static SPA deploy:
  - `"buildCommand": "npm run build"`, `"outputDirectory": "dist"`, `"framework": "vite"`.
  - A SPA rewrite so client routing (none yet, but future-proof) falls back to index.html:
    `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`.
Add a short `<!-- deploy notes -->` block is not valid JSON — instead put deploy instructions in
the plan's SUMMARY / a top-of-file note is not possible in JSON. So: keep vercel.json pure JSON,
and record the human deploy steps in the task SUMMARY: Vercel project Root Directory =
`app/client`, Build Command `npm run build`, Output Directory `dist`. No server, no env vars
needed for the static client.
Validate the JSON parses.
  </action>
  <verify>
    <automated>cd app/client && node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json valid')" && npm run build</automated>
  </verify>
  <done>vercel.json is valid JSON with buildCommand/outputDirectory/rewrites; `npm run build` emits dist/index.html (the artifact Vercel will serve).</done>
</task>

</tasks>

<verification>
Full gate (all must pass):
1. `cd app/server && npm run verify:compile` → all PASS (server head injection unchanged).
2. `cd app/server && npm run build` → exit 0 (cross-dir shared import doesn't break tsc emit).
3. `cd app/server && npm run verify:parity` → PASS (server vs client HTML identical). BLOCKER.
4. `cd app/client && npm run build` → exit 0 (both `@shared` resolutions + mjml-browser typed + dist produced).
5. Grep confirms: no `fetch(`/`/api/compile` in actions.ts; `CANONICAL_HEAD` defined only in app/shared/mjml-head.ts.

Adjacent-breakage notes (do NOT act on, just be aware):
- `npm run verify:blocks` is ALREADY red (its imports point at the pre-move `src/blocks/` paths).
  Unrelated to this plan — do not run it expecting green, do not copy its paths.
- The Vite `/api` dev proxy is now dead; kept as harmless (or drop it).

Human follow-up (NOT an automated blocker for this refactor):
- Real-client render gate per mjml-email-safety.md: use Export HTML → download the file → point
  `QuickEmailTest.ps1 -HtmlFilePath <downloaded.html> -PreviewOnly` at it (the server no longer
  auto-writes dist/spike-output.html). A passing compile/parity test is NOT proof of client
  rendering — Outlook + Gmail is the only proof.
</verification>

<success_criteria>
- The deployed client compiles and exports newsletters with the Express server stopped.
- Exactly one CANONICAL_HEAD, imported by both server and client (EXPORT-04 preserved).
- Automated parity proof green: server `mjml` === client `mjml-browser` for TEMPLATE_MJML.
- `app/client` builds to a static `dist/` deployable on Vercel with a SPA rewrite.
- No `any` without documented reason; `type` over `interface`; sync compile path.
</success_criteria>

<output>
Create `.planning/quick/260710-lty-static-deploy-via-browser-mjml-compile-s/260710-lty-SUMMARY.md` when done.
Record in it: the Vercel deploy settings (Root Directory `app/client`, Build `npm run build`,
Output `dist`), and the real-client render follow-up path (Export → QuickEmailTest.ps1).
</output>
