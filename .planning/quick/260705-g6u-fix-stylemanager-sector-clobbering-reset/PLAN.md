---
id: 260705-g6u
slug: fix-stylemanager-sector-clobbering-reset
type: quick
created: 2026-07-05T08:39:25.718Z
status: complete
---

# Quick Task: Fix Style Manager sector clobbering (padding missing on mj-text)

## Problem

Custom email-safe Style Manager sectors (EDIT-06) never take effect at runtime. grapesjs-mjml's `resetStyleManager` option defaults to `true` and runs `getSectors().reset()` + re-adds its own Dimension/Typography/Decorations sectors inside `editor.onReady()` — which fires AFTER our `onEditor` re-assert (editorOptions.ts:228). Plugin sectors win.

Consequence: `padding` only exists as a `composite`-type property in the plugin's Dimension sector; `RightPanel.tsx:211` filters out composite/stack props, so padding (and inner-padding, plus the whole Spacing/Background sector layout) never renders for any component. User noticed on mj-text.

Verified live via `window.__ddroiddEditor` in the running app (Playwright): active sectors were plugin's; after re-asserting custom sectors post-onReady, `padding:text` became visible on selected mj-text.

## Fix

1. `app/client/src/editor/editorOptions.ts` — add `resetStyleManager: false` to `pluginsOpts['grapesjs-mjml']` so config `styleManager.sectors` survives.
2. Update the stale comment at the `getSectors().reset()` re-assert (line ~225) — keep the reset as belt-and-braces defense.

## Verification

- Reload app, drop/select a Text block → Spacing accordion with Padding text field visible.
- Typography selects (font-weight etc.) come from OUR sectors (custom select controls), not plugin's.

## Constraints

- `no-commit.md`: no git commits — report changed files + suggested message.
