---
phase: quick-260710-lty
plan: 01
subsystem: compile-pipeline
tags: [mjml, grapesjs, static-deploy, export-04]
requires: []
provides: [in-browser-compile, shared-mjml-head, parity-proof, vercel-static-config]
affects: [app/client/src/editor/actions.ts, app/client/src/editor/TopBar.tsx, app/server/src/services/compile.ts]
tech-stack:
  added: ["mjml-browser@4.18.0 (client dependency + server devDependency)"]
  patterns:
    - "Compiler-agnostic shared transform module (app/shared/mjml-head.ts) imported by both server (mjml) and client (mjml-browser) so exactly one CANONICAL_HEAD exists (EXPORT-04)"
    - "Synchronous in-browser compile (mjml-browser) replaces the async fetch('/api/compile') round-trip"
key-files:
  created:
    - app/shared/mjml-head.ts
    - app/client/src/lib/compile.ts
    - app/client/src/types/mjml-browser.d.ts
    - app/client/vercel.json
    - app/server/scripts/verify-parity.ts
    - app/server/scripts/window-polyfill.ts
  modified:
    - app/server/src/services/compile.ts
    - app/server/tsconfig.json
    - app/server/package.json
    - app/server/package-lock.json
    - app/client/package.json
    - app/client/package-lock.json
    - app/client/vite.config.ts
    - app/client/tsconfig.json
    - app/client/src/editor/actions.ts
    - app/client/src/editor/TopBar.tsx
decisions:
  - "Shared module has zero mjml/mjml-browser import — it only produces the full MJML string; each side supplies its own compiler, keeping the module compiler-agnostic per the plan's import-path strategy."
  - "verify-parity.ts needed a tiny window-polyfill.ts (not in the original plan file list) because mjml-browser's UMD bundle assigns its export to the global `window` object, which doesn't exist under plain Node/tsx. See Deviations."
metrics:
  duration: "~35 min"
  completed: 2026-07-10
---

# Phase quick-260710-lty Plan 01: Static Deploy via Browser MJML Compile Summary

In-browser MJML compilation (mjml-browser@4.18.0) replaces the server's `/api/compile` round-trip, backed by one shared, compiler-agnostic canonical-head transform (`app/shared/mjml-head.ts`) imported by both the Express server and the Vite client, with an automated parity proof that the two compilers produce identical HTML.

## What Was Built

**Task 1 — Shared head/transform module + server refactor.**
Created `app/shared/mjml-head.ts` exporting `CANONICAL_HEAD` (verbatim copy of the prior server constant), `HEAD_MARKERS`, and the pure `buildFullMjml(editorOutput)` transform (conditional-wrap → strip-mj-head → inject-canonical-head). `app/server/src/services/compile.ts` now imports `{ buildFullMjml, HEAD_MARKERS }` from the shared module and re-exports `HEAD_MARKERS` so `verify-compile.ts`'s existing import keeps resolving unchanged. `app/server/tsconfig.json` `rootDir` changed to `..` and `include` extended to `["src/**/*", "../shared/**/*"]` so `tsc` can emit a file that lives outside `src/` without breaking `npm run build`.

**Task 2 — mjml-browser + in-browser compile lib.**
Added `mjml-browser@4.18.0` as a client dependency (exact pin, matches the version grapesjs-mjml already bundles and the server's `mjml`). Added a `@shared` alias in both `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`compilerOptions.paths`) pointing at `app/shared`. Created an ambient module declaration (`app/client/src/types/mjml-browser.d.ts`) since mjml-browser ships no `@types` — documented reason for avoiding `any`. Created `app/client/src/lib/compile.ts` exporting a synchronous `compileNewsletter(editorOutput)` that mirrors the server's compile options (`validationLevel: 'soft', minify: false`).

**Task 3 — actions.ts / TopBar.tsx rewritten for in-browser compile.**
Removed `postCompile` (the `fetch('/api/compile')` function) from `actions.ts` entirely. `exportHtml` and `compileDraft` are now synchronous, calling `compileNewsletter` directly — no `Promise`, no server. Added `openHtmlPreview(html)`: Blob + `URL.createObjectURL` + `window.open`, revoking the object URL on a 60s `setTimeout` (not immediately, unlike `triggerDownload`) so the new tab has time to load. In `TopBar.tsx`, `handleCompile` and `handleExport` now call the synchronous actions directly inside the click handler (no `.then/.catch`), wrapped in `try/catch` so a thrown compile error still routes to the warning banner. Calling `compileDraft`/`openHtmlPreview` synchronously inside the click handler (not `await`ed) keeps `window.open` inside the user gesture, avoiding popup blockers.

**Task 4 — Automated server-vs-client HTML parity proof.**
Added `mjml-browser@4.18.0` to server devDependencies and a `verify:parity` script. `app/server/scripts/verify-parity.ts` builds `buildFullMjml(TEMPLATE_MJML)` once, feeds the identical string to both `mjml` and `mjml-browser`, whitespace-normalizes both outputs, and asserts exact equality — printing a diff-context hint (first differing index ± ~40/80 chars) on failure. Imports `TEMPLATE_MJML` from `../../client/src/editor/blocks/template` (the correct post-move path — deliberately did NOT copy `verify-blocks.ts`'s stale `../../client/src/blocks/` path).

**Task 5 — Vercel static-deploy config.**
Created `app/client/vercel.json`: `buildCommand: "npm run build"`, `outputDirectory: "dist"`, `framework: "vite"`, and a SPA rewrite (`"/(.*)" → "/index.html"`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] mjml-browser's UMD bundle requires a `window` global under tsx/Node**
- **Found during:** Task 4, first run of `npm run verify:parity`.
- **Issue:** `mjml-browser`'s bundle is `!function webpackUniversalModuleDefinition(e,t){...}(window,function(){...})` — a UMD wrapper that unconditionally references the global `window` object as its attach target. Under plain Node/tsx (no `window` global), this throws immediately on import, before any compile logic runs. mjml-browser does no real DOM manipulation internally (pure string/HTML-tree logic); only the UMD wrapper needs `window` to exist.
- **Fix:** Created `app/server/scripts/window-polyfill.ts` — a one-line module that aliases `globalThis.window = globalThis`. Imported it as the FIRST import in `verify-parity.ts`, before the `mjml-browser` import. This is load-bearing: ES module imports evaluate in declaration order, so the polyfill has to be its own module and be imported first, or mjml-browser's UMD wrapper would already have thrown by the time any inline top-level statement ran.
- **Files added:** `app/server/scripts/window-polyfill.ts` (not in the plan's `files_modified` list).
- **Scope:** server-only tooling; `scripts/` stays outside the server's `tsc` `include` (same as `verify-blocks.ts`), so this does not affect the production build or the client bundle (the client never needs this polyfill — it runs in a real browser where `window` already exists).

None of the remaining plan tasks required deviation — the import-path strategy, `@shared` alias, and cross-directory `tsc` `rootDir`/`include` change worked exactly as specified.

## Verification Gate Results (all 5, run in final sequence)

1. `cd app/server && npm run verify:compile` → **PASS** (10/10 assertions), exit 0.
2. `cd app/server && npm run build` → exit 0, no TS6059/rootDir errors.
3. `cd app/server && npm run verify:parity` → **PASS** — server `mjml` and client `mjml-browser` produce byte-identical (whitespace-normalized) HTML for `TEMPLATE_MJML`. BLOCKER gate cleared.
4. `cd app/client && npm run build` → exit 0, `dist/index.html` + JS/CSS assets produced (`tsc --noEmit && vite build`). Chunk-size warning (editor chunk ~1MB gz) is pre-existing/informational, not a failure.
5. Grep confirms: no `fetch(` / `/api/compile` anywhere in `actions.ts`; `CANONICAL_HEAD` defined in exactly one file (`app/shared/mjml-head.ts`).

`npm run verify:blocks` was intentionally NOT run (known pre-existing red gate on stale pre-move import paths, unrelated to this plan, per plan instructions).

## Deploy Notes (Vercel)

- **Root Directory:** `app/client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- No server process, no Postgres, no env vars needed for the static client — `app/client/vercel.json` encodes `buildCommand`/`outputDirectory`/`framework: "vite"` plus a SPA rewrite (`/(.*) → /index.html`) for future client-side routing.
- The Express server (`app/server`) is intentionally kept in the repo — it hosts `verify:compile`/`verify:parity` and remains available as a dev-time tool — but is no longer required at runtime by the deployed client.

## Human Follow-up (not an automated blocker for this refactor)

Real-client render gate per `mjml-email-safety.md` / the `verify-email-render` skill: a passing compile/parity test is **not** proof the email renders correctly in real clients.

1. Run the app (`npm run dev` in `app/client`, no server needed), click **Export HTML**, download the file.
2. `.\QuickEmailTest.ps1 -HtmlFilePath <downloaded.html> -PreviewOnly` (Outlook draft, Word engine — the harshest client).
3. `.\EmailTester.ps1 -HtmlFilePath <downloaded.html> -TestEmails <you>@gmail.com -Subject "Static deploy render check" -Debug` (Gmail web/mobile).
4. Walk the inspection checklist in `.claude/skills/verify-email-render/SKILL.md` (fonts, no dark-on-dark, spacing, images, background images, layout, links).

This was NOT run in this session (requires a human at a Windows machine with Outlook + a live send) — it is deferred exactly as the plan specifies.

## Known Stubs

None — no hardcoded empty/placeholder data was introduced; all new code paths are fully wired (compile → export/preview).

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. If anything, this refactor REDUCES surface: the client's runtime dependency on the server's `/api/compile` endpoint is removed for the deployed static build (the server route file itself was left untouched/still present, per the plan's "server intentionally kept" note).

## Self-Check: PASSED

Files verified to exist:
- FOUND: app/shared/mjml-head.ts
- FOUND: app/client/src/lib/compile.ts
- FOUND: app/client/src/types/mjml-browser.d.ts
- FOUND: app/client/vercel.json
- FOUND: app/server/scripts/verify-parity.ts
- FOUND: app/server/scripts/window-polyfill.ts

No commits were created (per `.claude/rules/no-commit.md` — this repo forbids `git commit`/`git push`/`gh pr create`). All changes are uncommitted in the working tree, `feat/app-ui` branch.
