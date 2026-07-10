---
phase: quick
plan: 260710-kz8
type: execute
wave: 1
depends_on: []
files_modified:
  - app/client/src/editor/editorConfig.ts
  - app/client/src/editor/actions.ts
requirements: [EDIT-06]
tags: [grapesjs, mjml, padding, style-manager]
---

# Quick Task 260710-kz8: Fix Padding Controls (Expand Shorthand to Longhands) Summary

Editing the Padding (P) field in the RightPanel previously wrote only the CSS shorthand
`padding` attribute, which had no visible effect because grapesjs-mjml's `style-default`
ships LONGHAND paddings (`padding-top/right/bottom/left`) on the model — and at MJML
compile, longhand always overrides shorthand. The canvas silently never re-rendered on a
padding edit, even though export happened to look correct (getHtml omits default-valued
longhands, so the shorthand alone reached the compiler).

## What changed

### `app/client/src/editor/actions.ts`
- Added a module-scoped `loadingProject` flag + exported getter `isLoadingProject()`.
- Wrapped both `editor.loadProjectData(...)` call sites (`load()` and the restore-in-`finally`
  inside `getExportMjml()`) in `try { loadingProject = true; ... } finally { loadingProject = false; }`.
- Purpose: give the new padding listener (below) a way to detect "we're mid-load" and bail,
  so it never injects longhand styles into a project snapshot that didn't have them — this is
  what keeps the Phase-1 byte-identical round-trip gate green.

### `app/client/src/editor/editorConfig.ts`
- Imported `isLoadingProject` from `./actions`.
- Added a pure helper `parsePaddingShorthand(value): [top, right, bottom, left] | null` that
  implements the standard CSS 1/2/3/4-value shorthand expansion rules; returns `null` for 0
  or >4 tokens.
- Added a module-scoped re-entrancy guard `expandingPadding` (cheap insurance; not expected to
  trigger by construction since the handler never re-writes the shorthand it's reacting to).
- Registered `editor.on('component:styleUpdate:padding', ...)` in `onEditor`, next to the
  existing `block:drag:stop` listener:
  - Bails if `isLoadingProject()` is true.
  - Resolves the target component from the event arg, falling back to `editor.getSelected()`.
  - Reads `target.getStyle()['padding']`. If falsy/non-string, removes all four longhand
    properties via `removeStyle` (restores the plugin's built-in default padding — NOT zero).
    Otherwise parses the shorthand and mirrors it into the four longhands via `addStyle`.
  - Does **not** touch `inner-padding` — the plugin ships no `inner-padding-*` longhands, so
    that shorthand already worked correctly (confirmed by the plan's live diagnosis and
    re-confirmed in the runtime verification below).

## Verification

**TypeScript:** `cd app/client && npx tsc --noEmit` — clean (one type-narrowing fix needed:
`getStyle()['padding']` types as `string | string[] | DataResolverProps`, so the falsy-check
was widened to `!paddingValue || typeof paddingValue !== 'string'` before parsing).

**Runtime (Playwright against the running `localhost:5174` dev server):**
Simulated the real RightPanel interaction via `editor.StyleManager.getProperty('spacing',
'padding').upValue(...)` (the same code path the UI slider/text field uses) on a dropped
`mj-section` with initial shorthand `padding="40px 10px"`:

| Step | Section height (px) | Longhands on model |
|------|---------------------|---------------------|
| Initial (plugin defaults + attr) | 93 | top 20px / right 0 / bottom 20px / left 0 (mismatched vs. shorthand — the bug) |
| Set Padding to `0` | 53 (collapsed) | top/right/bottom/left all `0` |
| Set Padding to `40px 10px` | 133 (expanded) | top 40px / right 10px / bottom 40px / left 10px |
| Clear Padding | 93 (back to default) | no longhand keys present — plugin default reasserts |

- Inner padding on an `mj-button` (`inner-padding: 5px 5px` via `upValue`) still applies live —
  confirmed the four `padding-*` longhands on the button (its own outer padding) were
  untouched by the inner-padding write.
- Round-trip gate: dropped a padded section, ran `window.__ddroiddAssertRoundTrip()` →
  console printed `[ddroidd] Round-trip identical: true`.

All plan `must_haves.truths` and the task `<done>` criteria are satisfied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Type-narrow `getStyle()['padding']` before parsing**
- **Found during:** Task 2, `npx tsc --noEmit`.
- **Issue:** GrapesJS types `Component.getStyle()` values as `string | string[] |
  DataResolverProps`, not `string`. Passing the raw value to `parsePaddingShorthand(value:
  string)` failed to compile.
- **Fix:** Widened the falsy/reset check to `!paddingValue || typeof paddingValue !==
  'string'` — non-string values fall through to the same "reset to default" branch as an
  empty value, which is a safe defensive default (padding as an array/resolver object is not
  a shape this app ever produces).
- **Files modified:** `app/client/src/editor/editorConfig.ts`.
- **Commit:** not committed (see below — no-commit rule).

No other deviations — plan executed as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. This is a
client-only canvas-rendering fix.

## Self-Check: PASSED

- `app/client/src/editor/actions.ts` — FOUND (edited, contains `isLoadingProject`).
- `app/client/src/editor/editorConfig.ts` — FOUND (edited, contains
  `component:styleUpdate:padding` and `parsePaddingShorthand`).
- `npx tsc --noEmit` — PASSED (exit 0, no errors).
- Playwright runtime verification — PASSED (canvas re-render, clear-to-default,
  inner-padding untouched, round-trip identical: true).

## Changed files (per no-commit.md — developer commits manually)

- `app/client/src/editor/actions.ts`
- `app/client/src/editor/editorConfig.ts`

**Suggested commit message:**

```
fix(editor): expand padding shorthand into longhands so canvas re-renders

grapesjs-mjml's style-default ships longhand paddings (padding-top/right/
bottom/left) which override the shorthand `padding` attribute at MJML
compile. The RightPanel Padding field wrote only the shorthand, so editing
it never visibly changed the canvas. Mirror the shorthand into the four
longhands on `component:styleUpdate:padding`; clearing removes the
longhands so the plugin default reasserts. Guard with isLoadingProject()
(actions.ts) so this never mutates a document mid-loadProjectData, keeping
the Phase-1 byte-identical round-trip gate green. inner-padding is
untouched (no longhand equivalent exists).
```
