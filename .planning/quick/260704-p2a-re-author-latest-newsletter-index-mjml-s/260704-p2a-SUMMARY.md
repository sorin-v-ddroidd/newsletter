---
phase: quick-260704-p2a
plan: 01
subsystem: editor-blocks
tags: [grapesjs, mjml, branded-blocks, compile-gate]
requirements: [BLOCK-01, BLOCK-02]
dependency-graph:
  requires: [app/client/src/blocks/BLOCK_DEFAULTS.ts, app/client/src/blocks/hero.ts, app/client/src/blocks/projects.ts]
  provides: [app/client/src/blocks/new-collegues.ts, app/client/src/blocks/initiatives.ts, app/client/src/blocks/hiring.ts, app/client/src/blocks/want-to-know-more.ts, app/client/src/blocks/disclaimer.ts, app/client/src/blocks/template.ts, app/server/scripts/verify-blocks.ts]
  affects: [app/client/src/App.tsx, app/server/package.json]
tech-stack:
  added: []
  patterns: [inlined-brand-defaults-via-BLOCK_DEFAULTS, headless-mjml-compile-gate]
key-files:
  created:
    - app/client/src/blocks/new-collegues.ts
    - app/client/src/blocks/initiatives.ts
    - app/client/src/blocks/hiring.ts
    - app/client/src/blocks/want-to-know-more.ts
    - app/client/src/blocks/disclaimer.ts
    - app/client/src/blocks/template.ts
    - app/server/scripts/verify-blocks.ts
    - .planning/quick/260704-p2a-re-author-latest-newsletter-index-mjml-s/deferred-items.md
  modified:
    - app/client/src/App.tsx
    - app/server/package.json
decisions:
  - "Disclaimer block: explicit background-color=#ffffff on the section (satisfies every-section-explicit-bg rule) while keeping source's black italic text — faithful re-author, not a re-brand."
metrics:
  duration: "~35 minutes"
  completed: "2026-07-04"
---

# Phase quick-260704-p2a Plan 01: Re-author remaining newsletter sections as branded blocks Summary

Re-authored the 5 hand-authored `src/sections/*.mjml` sections not yet covered by an editor
block (new-collegues, initiatives, hiring, want-to-know-more, disclaimer) as grapesjs-mjml
branded block modules following the `hero.ts`/`projects.ts` pattern, composed all 7 sections
into a `TEMPLATE_MJML` module wired to a new "New from Template" toolbar button, and added a
headless `mjml@4.18.0` compile gate that passes 8/8 (7 blocks + full template) with zero errors.

## What Was Built

**Task 1 — 5 new branded block modules** (`app/client/src/blocks/{new-collegues,initiatives,hiring,want-to-know-more,disclaimer}.ts`):
Each exports a `<name>Block` object (`id`, `label`, `category: 'DDROIDD'`, `content`), imports
only `./BLOCK_DEFAULTS` (relative, alias-free, no react/grapesjs), inlines all brand defaults
per element (font-family, color, font-size, line-height on every `mj-text`; explicit
`background-color` on every `mj-section`), and contains no `<mj-attributes>` / `<mj-include>` /
`<mj-style>` tags. Content, structure, and intentional per-element style divergences (hiring's
yellow `#FCD400` role list, heading sizes) are preserved faithfully from source.

**Task 2 — `TEMPLATE_MJML` + App.tsx wiring** (`app/client/src/blocks/template.ts`, `App.tsx`):
`template.ts` is its own alias-free, grapesjs/react-free module composing all 7 block content
strings (hero, new-collegues, projects, initiatives, hiring, want-to-know-more, disclaimer — in
`index.mjml` order) into one `<mjml><mj-body>...</mj-body></mjml>` document. `App.tsx` now
registers all 7 DDROIDD blocks (StrictMode-guarded), and a new "New from Template" toolbar
button calls `editor.setComponents(TEMPLATE_MJML)` + `editor.UndoManager.clear()` on click only.
The existing empty-canvas scaffold seed (`if (editor.getComponents().length === 0) { ... }`)
is untouched — the full template never auto-seeds.

**Task 3 — Headless compile gate** (`app/server/scripts/verify-blocks.ts`,
`app/server/package.json`): a script run via `tsx` from `app/server` (so it resolves the pinned
`mjml@4.18.0` from `app/server/node_modules`) that imports all 7 block content strings + the
template via relative paths, mirrors the production `compile.ts` conditional wrap
(`/<mjml/i.test(trimmed)` → as-is, else wrap in `<mjml><mj-body>...`), compiles each with
`{ validationLevel: 'soft', minify: false }` (identical to production), and gates PASS/FAIL on
`errors.length === 0 && html non-empty`. Added `"verify:blocks": "tsx scripts/verify-blocks.ts"`
to `app/server/package.json`.

## Compile Gate Results (verbatim)

```
> @ddroidd/newsletter-server@0.1.0 verify:blocks
> tsx scripts/verify-blocks.ts

PASS -- DDROIDD Hero (errors: 0)
PASS -- DDROIDD New Collegues (errors: 0)
PASS -- DDROIDD Projects (errors: 0)
PASS -- DDROIDD Initiatives (errors: 0)
PASS -- DDROIDD Hiring (errors: 0)
PASS -- DDROIDD Want To Know More (errors: 0)
PASS -- DDROIDD Disclaimer (errors: 0)
PASS -- Full Template (TEMPLATE_MJML) (errors: 0)

verify-blocks: all 8 targets PASSED.
```

Exit code: `0`. All 8 targets (7 blocks in isolation + the full template) compile with
`result.errors.length === 0` and non-empty `result.html`. No warnings were recorded (`errors`
array was empty for every target — with `validationLevel: 'soft'` the script prints every entry
of `result.errors` verbatim regardless of pass/fail; there were none to print).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Normalized `#ffffffff` (8-digit hex typo) to `#ffffff`**
- **Found during:** Task 1, `new-collegues.ts`
- **Issue:** Source `src/sections/new-collegues.mjml` has caption `<p>` tags with an invalid
  8-digit hex color `#ffffffff` (extra `ff` appended).
- **Fix:** Normalized to the valid 6-digit `#ffffff` on all 5 affected caption paragraphs.
- **Files modified:** `app/client/src/blocks/new-collegues.ts` (documented in the file's header comment).

**2. [Rule 1 - Bug] Fixed malformed closing tag `<a/>` → `</a>`**
- **Found during:** Task 1, `want-to-know-more.ts`
- **Issue:** Source `src/sections/want-to-know-more.mjml` has a malformed self-closing anchor
  `<a style="color: #fff" href="mailto:newsletter@ddroidd.com">newsletter@ddroidd.com<a/>` —
  the closing tag is `<a/>` instead of `</a>`, which is invalid HTML.
- **Fix:** Corrected to `</a>`.
- **Files modified:** `app/client/src/blocks/want-to-know-more.ts`.

### Documented Divergences (per plan instructions, not bugs)

**3. Disclaimer block explicit white background** — `disclaimer.ts` sets
`background-color="#ffffff"` on its section (source has none, relying on mj-body's white
default) while keeping the source's black italic centered text. This was an explicit plan
instruction (satisfies the every-section-explicit-bg rule / white-default-text trap) and is
documented in the file's header comment as a faithful re-author, not a re-brand.

### Verify-command false positive (documented, not a real failure)

Task 1's automated verify command (`! grep -lE 'mj-(attributes|include|style)|...'`) matches
the plain-text header comment on every new block file ("MUST NOT contain mj-attributes,
mj-include, or mj-style") — it also matches this exact phrasing already present in the blessed
`hero.ts` and `projects.ts` (spike-approved pattern), so this is a pre-existing false positive
in the check's regex, not a regression introduced here. The precise check for the actual forbidden
constructs — `grep -nE '<mj-(attributes|include|style)'` (matching real MJML tags, not comment
prose) — returns zero matches across all block files. No block or template file contains an
actual `<mj-attributes>`, `<mj-include>`, or `<mj-style>` tag.

### Out-of-scope item logged (not fixed)

`app/server/src/routes/compile.ts` fails `npm run build --prefix app/server` (`tsc`) with
`Property 'errors'/'html' does not exist on type 'Promise<MJMLParseResults>'` — a pre-existing
`@types/mjml` type-declaration mismatch, introduced in commit `b81bd32` (before this quick
task), unrelated to any file this plan modifies. Runtime (`tsx`, both the dev server and this
plan's `verify-blocks.ts`) is unaffected — confirmed by the passing 8/8 compile gate. Logged in
full at `.planning/quick/260704-p2a-re-author-latest-newsletter-index-mjml-s/deferred-items.md`
for a future quick task or phase to address.

## Self-Verification Performed

- `app/client` `npx tsc --noEmit` — clean, no errors (confirms `App.tsx` edits compile).
- `npm run verify:blocks --prefix app/server` — exit 0, 8/8 PASS (see verbatim output above).
- Confirmed no block/template file imports react or grapesjs (headless-safe for the verify script).
- Confirmed no block/template file contains an actual `<mj-attributes>`/`<mj-include>`/`<mj-style>` tag.
- Confirmed `App.tsx` registers all 7 `ddroidd-*` blocks and the empty-canvas scaffold guard
  (`getComponents().length === 0`) is unchanged.
- Confirmed `app/server/tsconfig.json` `include: ["src/**/*"]` excludes `scripts/`, so
  `npm run build` (tsc) does not attempt to compile `verify-blocks.ts`.

## Runtime / Human Verification — Out of Scope (per plan)

Live-editor checks (drag/drop of the 5 new blocks, "New from Template" button click producing
a visually correct canvas, round-trip via `getProjectData()`/`loadProjectData()`, and real-client
Outlook/Gmail rendering) remain gated behind the Phase-1 human runtime check documented in
`.planning/STATE.md` and are NOT part of this quick task's deliverable. The automated compile
gate (8/8 PASS) is the proof required here.

## Changed / Created Files

Created:
- `app/client/src/blocks/new-collegues.ts`
- `app/client/src/blocks/initiatives.ts`
- `app/client/src/blocks/hiring.ts`
- `app/client/src/blocks/want-to-know-more.ts`
- `app/client/src/blocks/disclaimer.ts`
- `app/client/src/blocks/template.ts`
- `app/server/scripts/verify-blocks.ts`
- `.planning/quick/260704-p2a-re-author-latest-newsletter-index-mjml-s/deferred-items.md`
- `.planning/quick/260704-p2a-re-author-latest-newsletter-index-mjml-s/260704-p2a-SUMMARY.md` (this file)

Modified:
- `app/client/src/App.tsx` (import + register 5 new blocks, "New from Template" button + handler)
- `app/server/package.json` (added `verify:blocks` npm script)

Note: `.planning/phases/01-feasibility-spike-editor-core/01-UAT.md` and
`.planning/research/SUMMARY.md` show as modified in `git status` but were NOT touched by this
plan's execution — those changes pre-date this session (uncommitted from prior work).

## Suggested Commit Message

```
feat(quick-260704-p2a): re-author remaining newsletter sections as branded blocks

- Add new-collegues, initiatives, hiring, want-to-know-more, disclaimer block modules
  (BLOCK_DEFAULTS-inlined, alias-free, faithful re-authors of src/sections/*.mjml)
- Add TEMPLATE_MJML composing all 7 blocks in index.mjml order + "New from Template"
  toolbar button in App.tsx (empty-canvas scaffold seed unchanged)
- Add headless mjml@4.18.0 compile gate (verify-blocks.ts, npm run verify:blocks):
  8/8 targets PASS, 0 errors
```

(Per `.claude/rules/no-commit.md`, this task does NOT run `git commit`/`git push` — the
developer commits manually using the message above or their own.)

## Self-Check: PASSED

All 9 created files confirmed present on disk (5 block modules, template.ts, verify-blocks.ts,
deferred-items.md, this SUMMARY.md). No commits were made per `.claude/rules/no-commit.md`.

## Post-execution fix (orchestrator, 2026-07-04)

Live-editor verification caught a defect the headless gate could not: block content strings used XML self-closing tags (`<mj-image />`, `<mj-spacer />`, `<mj-divider />`). The browser DOM parser treats these as open tags and swallows following siblings as children, producing invalid nesting (mj-text inside mj-image) and 14 MJML compile warnings when compiling canvas-serialized `getHtml()` output. Raw strings compile clean under mjml's XML parser, so verify-blocks.ts passed 8/8 both before and after.

Fix: expanded all 19 self-closing mj-* tags to explicit close pairs across hero/projects/hiring/initiatives/new-collegues/want-to-know-more block files. Re-verified live: template loads, **0 compile warnings, 0 bad nesting**, 65 KB HTML. Rule added to `.claude/rules/grapesjs.md` ("Never self-close mj-* tags in block content strings").
