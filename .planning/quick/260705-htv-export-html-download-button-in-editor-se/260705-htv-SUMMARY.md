---
phase: quick-260705-htv
plan: 01
subsystem: api
tags: [mjml, express, grapesjs, react, export]

# Dependency graph
requires:
  - phase: 01-feasibility-spike-editor-core
    provides: GrapesJS + grapesjs-mjml editor, /api/compile route, actions.ts action layer
provides:
  - "compileNewsletter service: strips editor-emitted mj-head, injects one canonical server-owned mj-head, compiles via mjml@4.18.0"
  - "verify:compile headless gate proving head injection + strip-and-replace"
  - "Export HTML toolbar button with dated-file download and compile-warning banner"
affects: [export, mjml-compile, editor-toolbar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-owned mj-head injection: single CANONICAL_HEAD constant, strip any incoming mj-head before injecting (EXPORT-04)"
    - "Client action layer stays React-free: exportHtml/postCompile/triggerDownload return data, caller (TopBar) owns UI state"

key-files:
  created:
    - app/server/src/services/compile.ts
    - app/server/scripts/verify-compile.ts
  modified:
    - app/server/src/routes/compile.ts
    - app/server/package.json
    - app/client/src/editor/actions.ts
    - app/client/src/editor/TopBar.tsx

key-decisions:
  - "mj-style placed as a direct child of mj-head (sibling of mj-attributes), fixing the legacy head.mjml's incorrect nesting inside mj-attributes, so the .tracking-pixel rule actually emits"
  - "Cast mjml2html's return value to the true synchronous runtime shape (MJMLParseResults) rather than treating it as the Promise the @types/mjml-core declaration claims — the mjml package's actual lib/index.js is synchronous"
  - "Export warnings formatted via a new formatCompileError helper (prefers formattedMessage, then message) instead of String(error), which would render '[object Object]' for MJML error objects"

requirements-completed: [EXPORT-04]

# Metrics
duration: ~40min
completed: 2026-07-05
---

# Quick Task 260705-htv: Export HTML Download Button Summary

**Server-injected canonical mj-head (Roboto, white/16px text defaults, tracking-pixel rule) via a new compileNewsletter service, plus an Export HTML toolbar button that downloads a dated file or shows a dismissible warning banner with Download-anyway.**

## Performance

- **Duration:** ~40 min
- **Tasks:** 2 completed
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- `compileNewsletter` service strips any mj-head the editor emits and injects one fixed, canonical head before compiling with mjml@4.18.0 — exactly one source of truth for the head (EXPORT-04).
- `verify:compile` headless gate proves both injection (Roboto font + tracking-pixel markers present, clean fixture compiles with `errors: []`) and strip-and-replace (a sentinel from an editor-emitted head is verifiably absent from the output).
- `routes/compile.ts` is now thin — validates input, calls the service, writes the dev `dist/spike-output.html` artifact, responds.
- Export HTML button in the toolbar: clean compiles download `newsletter-YYYY-MM-DD.html` immediately; compiles with warnings show a dismissible amber banner listing readable warning messages with a "Download anyway" action, never auto-downloading partial output.
- Existing "Preview & Compile" button behavior is untouched.

## Task Commits

No commits were made — `.claude/rules/no-commit.md` overrides the standard task-commit protocol for this repo. Changes were staged with `git add` only (never committed). See "Changed files" and "Suggested commit message" below for the developer to commit manually.

## Files Created/Modified
- `app/server/src/services/compile.ts` (new) - `compileNewsletter(editorOutput)`: conditional-wrap, mj-head strip, canonical head injection, mjml@4.18.0 soft compile; exports `HEAD_MARKERS`
- `app/server/src/routes/compile.ts` - thinned to validate → call service → write dev artifact → respond
- `app/server/scripts/verify-compile.ts` (new) - headless gate: two fixtures (bare fragment, doc with its own sentinel mj-head) assert markers present, clean-fixture `errors: []`, and sentinel absence
- `app/server/package.json` - added `verify:compile` script
- `app/client/src/editor/actions.ts` - added `postCompile`, `triggerDownload`, `buildExportFilename`, `exportHtml`, `formatCompileError`; refactored `compileDraft` to use `postCompile`
- `app/client/src/editor/TopBar.tsx` - added Export HTML button, `useState`-driven warning banner (`renderWarningBanner`), Download-anyway / dismiss handlers

## Decisions Made
- Fixed the legacy head.mjml's `mj-style`-nested-inside-`mj-attributes` bug in the new `CANONICAL_HEAD`: `mj-style` is now a direct child of `mj-head`, or the `.tracking-pixel` rule silently never emits.
- Chose content-based assertions (marker presence/absence) over `<head>` tag counting in the verify gate, since MJML always compiles to exactly one `<head>` regardless of whether the emitted head was actually stripped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing `tsc` build failure in `app/server` caused by a stale `@types/mjml-core` declaration**
- **Found during:** Task 1, running `npm run build` for the first time this session
- **Issue:** `app/server` `tsc` build was already RED before this task touched anything — `@types/mjml-core` declares `mjml2html` as returning `Promise<MJMLParseResults>`, but the `mjml` package's actual runtime (`lib/index.js`) re-exports `mjml-core`'s synchronous internal implementation directly. The pre-existing `routes/compile.ts` already accessed `.html`/`.errors` synchronously (correct at runtime, but a type error under `tsc`), so `npm run build` failed with `TS2339: Property 'errors' does not exist on type 'Promise<MJMLParseResults>'` even before this plan started.
- **Fix:** In `compile.ts`, cast the `mjml2html(...)` call result to `MJMLParseResults` (`as unknown as MJMLParseResults`) with an inline comment explaining the type/runtime mismatch, rather than awaiting a Promise that never resolves.
- **Files modified:** `app/server/src/services/compile.ts` (the file the logic moved into)
- **Verification:** `npm run verify:compile` and `npm run build` both pass cleanly after the fix.
- **Committed in:** not committed (no-commit.md) — staged only.

**2. [Rule 1 - Bug] Fixed warning banner rendering "[object Object]" for MJML compile errors**
- **Found during:** Task 2, advisor review before declaring done
- **Issue:** The plan's suggested `errors.map(String)` stringifies MJML error objects (`{ line, message, tagName, formattedMessage }`) as the literal text `"[object Object]"`, since `String()` on a plain object doesn't call any custom formatting. This also produced duplicate React list keys (`key={warning}`) when multiple errors collapsed to the same string.
- **Fix:** Added `formatCompileError(error: unknown): string` to `actions.ts`, which narrows the unknown shape and prefers `formattedMessage`, then `message`, before falling back to `String()`. Also switched the banner's list key to an index+text composite to avoid collisions.
- **Files modified:** `app/client/src/editor/actions.ts`, `app/client/src/editor/TopBar.tsx`
- **Verification:** `npm run typecheck` and `npm run build` pass in `app/client`; manually reasoned through the MJML error shape from `@types/mjml`'s `MJMLParseError` interface.
- **Committed in:** not committed (no-commit.md) — staged only.

---

**Total deviations:** 2 auto-fixed (1 blocking pre-existing build break, 1 bug in warning display)
**Impact on plan:** Both fixes were necessary for correctness — the plan's verification gates (`npm run build`, warnings "shown in the UI") would not have actually passed/held without them. No scope creep beyond the plan's stated files.

## Issues Encountered
- `app/server`'s `tsc` build was already broken on the committed `routes/compile.ts` before this task started (see deviation 1) — this is a pre-existing condition in the repo, not something introduced by this plan, but it directly blocked this plan's own verification gate (`npm run build`) so it had to be fixed in-scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `compileNewsletter` / `HEAD_MARKERS` are now the canonical compile entry point for any future export-related work (e.g. a preview pane) — reuse the service, don't re-implement head injection elsewhere.
- No blockers for further editor/export work.

---

## Changed files (for manual commit)

```
A  app/server/src/services/compile.ts
M  app/server/src/routes/compile.ts
A  app/server/scripts/verify-compile.ts
M  app/server/package.json
M  app/client/src/editor/actions.ts
M  app/client/src/editor/TopBar.tsx
```

## Suggested commit message

```
feat(export): server-injected canonical mj-head + Export HTML button

- Extract compile logic into compileNewsletter service; strip any
  editor-emitted mj-head and inject one fixed, canonical head
  (Roboto font, white/16px text defaults, .tracking-pixel rule)
  before mjml@4.18.0 compile (EXPORT-04)
- Add verify-compile.ts headless gate proving injection + strip-replace
- Add Export HTML toolbar button: downloads newsletter-YYYY-MM-DD.html
  on a clean compile, shows a dismissible warning banner with
  Download-anyway on compile warnings
- Fix pre-existing tsc build break from stale @types/mjml-core
  Promise<> declaration vs actual synchronous mjml runtime
```

---
*Phase: quick-260705-htv*
*Completed: 2026-07-05*

## Self-Check: PASSED

All 7 files created/modified confirmed present on disk. All verification gates re-run and green:
`app/server`: `npm run verify:compile` (7/7 PASS), `npm run build` (clean).
`app/client`: `npm run typecheck` (clean), `npm run build` (clean, vite build succeeded).

## Runtime verification (orchestrator, 2026-07-05, Playwright @ localhost:5175 + server :3000)

- Gotcha found: stale server (PID 57576, started 07-04) held port 3000 serving OLD compile code — new server exited silently on bind. Killed stale process, restarted; verify against fresh server.
- POST /api/compile: errors [], injected head present (Roboto font, .tracking-pixel rule) — PASS
- Export HTML button: template seeded → click → browser downloads newsletter-2026-07-05.html (65KB, <!doctype html, Roboto + tracking-pixel + newsletter content) — PASS
- 0 console errors throughout — PASS
- Not exercised in browser: warning-banner "Download anyway" path (covered by headless verify:compile fixtures only)
