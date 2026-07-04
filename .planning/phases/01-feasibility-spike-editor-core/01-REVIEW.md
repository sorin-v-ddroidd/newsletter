---
phase: "01"
status: issues-found
depth: standard
reviewed: 2026-07-04
files_reviewed: 10
files_reviewed_list:
  - app/client/src/App.tsx
  - app/client/src/main.tsx
  - app/client/src/blocks/BLOCK_DEFAULTS.ts
  - app/client/src/blocks/hero.ts
  - app/client/src/blocks/projects.ts
  - app/client/src/experiments/mjAttributes.ts
  - app/server/src/index.ts
  - app/server/src/routes/compile.ts
  - app/package.json
  - app/server/package.json
critical: 0
warning: 6
info: 5
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-04
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the Phase-1 feasibility-spike surface: GrapesJS editor mount (App.tsx), branded block definitions, the mj-attributes experiment, the Express server + `/api/compile` route, and the three package manifests.

The load-bearing spike constraints are respected: `pluginsOpts` uses the hardcoded string key `'grapesjs-mjml'` (App.tsx:163), no `mj-attributes`/`mj-include`/`mj-style` appears in any block content string, the version triple is pinned exactly (`grapesjs@0.22.16` / `grapesjs-mjml@1.0.8` / `@grapesjs/react@2.0.0` / `mjml@4.18.0` — client and server package.json verified), project JSON is the persisted format (localStorage `getProjectData`/`loadProjectData`), and the `<Canvas>` child was removed per plan 06. `mj-attributes` correctly lives only in the negative-test experiment file, not in a block.

No Critical findings. Six Warnings: the compile endpoint can 500 (with a dev stack trace) on malformed or non-object input, compile errors are treated as success on both server and client (a `mjml-email-safety.md` rule violation), the Load button crashes on corrupted localStorage, the `grapesjsCss` unpkg URL is unpinned and duplicates a local CSS import (version-drift risk against the locked 0.22.16), and `helmet` is absent from the Express pipeline.

## Warnings

### WR-01: `mjml2html` call is not guarded — malformed input crashes the request with a 500 and a dev stack trace

**File:** `app/server/src/routes/compile.ts:33`
**Issue:** `mjml2html` throws (it does not just return `errors`) on inputs it cannot parse at all — e.g. a document containing `<mjml` but no `<mj-body>`, or badly broken XML. `validationLevel: 'soft'` only softens *validation* errors, not parse failures. Since the handler is async, Express 5 forwards the throw to the default error handler, which returns a 500 and, when `NODE_ENV !== 'production'`, includes the stack trace in the response body. Any client-supplied string can trigger this (the conditional wrap is skipped whenever the payload contains the substring `<mjml`, so an attacker/typo does not even need a well-formed root).
**Fix:**
```ts
let result;
try {
  result = mjml2html(fullMjml, { validationLevel: 'soft', minify: false });
} catch (err) {
  console.error('MJML parse failure:', err);
  res.status(400).json({ error: 'Invalid MJML: input could not be parsed.' });
  return;
}
```

### WR-02: Request body shape is not validated — non-object JSON body throws; no zod at the boundary

**File:** `app/server/src/routes/compile.ts:18`
**Issue:** `const { mjml: editorOutput } = req.body as { mjml: string }` destructures `req.body` directly. `express.json()` happily produces `null` (body `null`), a number, or a string for valid JSON payloads; destructuring `null`/`undefined` throws `TypeError` → 500 instead of the intended 400. The `typeof editorOutput !== 'string'` check on line 20 never runs for these inputs. `backend-express.md` also requires zod validation on every route boundary — this route has only the manual typeof check.
**Fix:** Guard the body before destructuring, or use zod:
```ts
const bodySchema = z.object({ mjml: z.string().min(1).max(1_000_000) });
const parsed = bodySchema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: 'Request body must contain a "mjml" string field.' });
  return;
}
const editorOutput = parsed.data.mjml;
```
(Minimal non-zod fix: `if (req.body === null || typeof req.body !== 'object') { res.status(400)...; return; }` before the destructure.)

### WR-03: MJML compile errors are treated as success — partial HTML is written to disk and returned with 200

**Files:** `app/server/src/routes/compile.ts:38-53`, `app/client/src/App.tsx:58-64`
**Issue:** `mjml-email-safety.md` states: "Treat any MJML compile warning/error as a failure surfaced to the user — never silently ship partial HTML." When `result.errors` is non-empty the server merely `console.warn`s, still writes `dist/spike-output.html` (the artifact the Plan-05 client-render gate consumes), and returns 200. The client (`compileDraft`) logs `console.warn` and then prints "Compile succeeded." A spike operator can carry a broken compile into the Outlook/Gmail render gate without noticing.
**Fix:** On the server, when `result.errors.length > 0`, either return a distinct status/flag (`res.status(422).json({ html: result.html, errors: result.errors })`) or at minimum skip the `spike-output.html` write. On the client, treat non-empty `errors` as failure: `console.error` and do not print the success lines.

### WR-04: `load()` crashes on corrupted localStorage — unguarded `JSON.parse`

**File:** `app/client/src/App.tsx:29`
**Issue:** `JSON.parse(raw)` has no error handling. If the stored draft is truncated or hand-edited (localStorage is user-writable), the Load button throws an uncaught `SyntaxError` in the click handler and the load silently does nothing from the user's perspective. Additionally, `loadProjectData` receives whatever parsed — a stored `"null"` or `"42"` would pass `JSON.parse` and be fed to the editor.
**Fix:**
```ts
const load = (editor: GrapesEditor): void => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.log('[ddroidd] No saved project data found');
    return;
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (data === null || typeof data !== 'object') {
      throw new Error('Stored draft is not an object');
    }
    editor.loadProjectData(data as object);
    console.log('[ddroidd] Loaded project data from localStorage');
  } catch (err) {
    console.error('[ddroidd] Corrupted draft in localStorage; ignoring.', err);
  }
};
```

### WR-05: `grapesjsCss` points at an unpinned unpkg URL and duplicates the locally imported CSS

**File:** `app/client/src/App.tsx:4, 153`
**Issue:** Two problems compound. (1) `https://unpkg.com/grapesjs/dist/css/grapes.min.css` has no version — unpkg resolves it to the *latest* grapesjs release, currently 0.23.x, while the JS is locked to `0.22.16`. That is exactly the cross-version pairing `versions.md` forbids, applied to the stylesheet, and it can change under you on any upstream release. (2) Line 4 already imports `grapesjs/dist/css/grapes.min.css` from the pinned local package, so the editor loads two CSS copies (local 0.22.16 + remote latest) with nondeterministic override order, plus a runtime dependency on an external CDN for an internal tool. The 01-06 summary notes this was "accept"-dispositioned (T-01-01) for the spike, but the fix is one line.
**Fix:** Drop the `grapesjsCss` prop and rely on the local import (preferred), or pin it: `grapesjsCss="https://unpkg.com/grapesjs@0.22.16/dist/css/grapes.min.css"` — and remove whichever of the two sources is not used.

### WR-06: `helmet` missing from the Express pipeline

**File:** `app/server/src/index.ts:8-18`, `app/server/package.json:12-17`
**Issue:** `security.md` requires "`helmet` on every response" and CLAUDE.md pins `helmet@8.2.0` as an always-on dependency. The server currently sends no security headers. Low blast radius for a localhost spike, but this server file is the seed of the Phase-2 backend, and the rule is unconditional.
**Fix:** `npm i helmet@8.2.0` in `app/server`, then in `index.ts`:
```ts
import helmet from 'helmet';
app.use(helmet());
```

## Info

### IN-01: Debug `console.log` calls throughout App.tsx

**File:** `app/client/src/App.tsx:22, 30, 32, 42-43, 62-64, 78`
**Issue:** Spike-intentional (manual console verification is the documented UAT procedure), so acceptable now — but these must not survive into the Phase-2 editor component.
**Fix:** Track for removal when App.tsx is refactored into `editor/NewsletterEditor` in Phase 2.

### IN-02: `REPO_ROOT` resolution breaks under the `tsc` build output

**File:** `app/server/src/routes/compile.ts:12`
**Issue:** `path.resolve(__dirname, '../../../../')` assumes the file executes from `app/server/src/routes/`. The package's `"build": "tsc"` script would emit to a different directory depth (e.g. `app/server/dist/routes/`), making `REPO_ROOT` resolve to `app/` and `spike-output.html` land in `app/dist/`. Harmless under `tsx` dev (the only current run mode), but a latent trap.
**Fix:** Derive the output path from `process.cwd()` or an env var (`SPIKE_OUTPUT_DIR`) instead of `__dirname` arithmetic, or delete the unused `build` script for the spike.

### IN-03: `PORT` parsing accepts `NaN`; `app.listen` runs on import

**File:** `app/server/src/index.ts:9, 20`
**Issue:** `Number(process.env['PORT'])` yields `NaN` for a malformed value, and `app.listen(NaN)` throws with a confusing error. Separately, `listen` fires unconditionally at module load while `app` is also `export default`-ed — any future test importing `app` (supertest style) will bind the port as a side effect.
**Fix:** `const parsed = Number(process.env['PORT']); const PORT = Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;` and, when tests arrive, move `listen` behind an entrypoint guard or a separate `server.ts`.

### IN-04: `mjAttributes.ts` is never imported — the window global it registers never exists

**File:** `app/client/src/experiments/mjAttributes.ts:141-144`
**Issue:** No module imports this file (grep confirms zero importers), so Vite never bundles it and the `window.__ddroiddMjAttributesExperiment` registration at lines 141-144 is dead code — the documented "run in browser console: `runMjAttributesExperiment()`" procedure cannot work as written. Also, both `fetch` calls skip the `res.ok` check, so a 400/500 response produces a misleading `TypeError` on `dataA.errors.length` instead of a clear failure message.
**Fix:** Either import the module from `main.tsx` behind a dev-only guard (`if (import.meta.env.DEV) import('./experiments/mjAttributes')`), or update the doc comment to say the file's strings are meant to be pasted/POSTed manually. Add `if (!resA.ok) { ... }` guards if the runner is kept.

### IN-05: Conditional-wrap regex matches `<mjml` anywhere in the payload, not just as the document root

**File:** `app/server/src/routes/compile.ts:29`
**Issue:** `/<mjml/i.test(trimmed)` skips wrapping when the substring `<mjml` appears *anywhere* — e.g. a bare fragment whose text content mentions `<mjml` would go to the compiler unwrapped and fail. Unlikely for editor-generated output, but the intent is "starts with an mjml root."
**Fix:** Anchor it: `/^<mjml[\s>]/i.test(trimmed)`.

## Notes on checks that passed

- **pluginsOpts string-key rule** (issue #223): correct — hardcoded `'grapesjs-mjml'` at App.tsx:163.
- **No `mj-attributes`/`mj-include`/`mj-style` in block content**: verified in `hero.ts`, `projects.ts`. `mj-attributes` appears only in the experiment negative-test string, as intended.
- **BLOCK_DEFAULTS inlining**: every `mj-text` in both blocks carries font-family/color/font-size/line-height; every `mj-section` carries `background-color` (white-default-text trap avoided).
- **Version triple**: `grapesjs@0.22.16`, `grapesjs-mjml@1.0.8`, `@grapesjs/react@2.0.0`, `react@19.2.7` (client) and `mjml@4.18.0`, `express@5.2.1` (server) — all exact pins, all match the locked matrix.
- **Project JSON canonical**: save/load uses `getProjectData()`/`loadProjectData()`; MJML string is export-only (`getHtml()` → POST). No `setComponents(mjmlString)` anywhere.
- **`<Canvas>` removal** (plan 06): `<Editor />` is self-closing; default-UI mode active.
- **CORS**: restricted to `http://localhost:5173`, no `credentials` — appropriate for the spike.
- **JSON body limit**: 1 MB cap present (index.ts:15).

---

_Reviewed: 2026-07-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
