---
id: 260705-g6u
slug: fix-stylemanager-sector-clobbering-reset
type: quick
status: complete
completed: 2026-07-05
commits: []
---

# Summary: Fix Style Manager sector clobbering (padding missing on mj-text)

## Root cause (two layers)

1. **pluginsOpts silently ignored.** GrapesJS resolves plugin options via `pluginsOpts[pluginId]` where `pluginId` is whatever was passed in `plugins: []`. We passed the imported **function** (`plugins: [grapesjsMjml]`) but keyed options by the **string** `'grapesjs-mjml'` — the lookup never matches, so grapesjs-mjml ran with ALL defaults. (The "hardcoded string key" guidance from issue #223 only applies when the plugin is registered/loaded by string name.)
2. **Default `resetStyleManager: true` clobbers our sectors.** With defaults active, the plugin runs `getSectors().reset()` + adds its own Dimension/Typography/Decorations sectors inside `editor.onReady()` — AFTER `onEditor`'s re-assert. In the plugin's Dimension sector `padding` is a `composite` property, which RightPanel filters out → no padding control anywhere.

Verified live via `window.__ddroiddEditor` (Playwright): active sectors were the plugin's; config sectors present but inert; `pluginsOpts` confirmed unconsumed.

## Changes

- `app/client/src/editor/editorOptions.ts`
  - Plugin registration switched to official `usePlugin(grapesjsMjml, { resetBlocks: false, resetDevices: false, resetStyleManager: false })`; removed dead `pluginsOpts` block.
  - Added `resetStyleManager: false` (new — stops the onReady sector clobber).
  - Updated stale comments (onEditor reset is now belt-and-braces; EDIT-06 note).
- `app/client/src/editor/RightPanel.tsx`
  - Added `.filter((prop) => prop.isVisible())` so per-component `stylable` scoping (STYLABLE_BY_TYPE) is respected — e.g. `inner-padding` no longer leaks onto mj-text.
- `.claude/rules/grapesjs.md`, `.claude/rules/gotchas.md`
  - Corrected the plugin-init guidance: `usePlugin(...)` is the working pattern; string-key `pluginsOpts` with a function plugin is a silent no-op.

## Verification (live, Playwright against dev server)

- mj-text selected → sectors Typography / Spacing / Background only (Border/Dimension correctly hidden).
- Spacing shows a single Padding text field; typing `10px 25px` produces `<mj-text padding="10px 25px">` in `editor.getHtml()`.
- Plugin blocks still present (22 blocks) — resetBlocks: false now actually honored.
- `npx tsc --noEmit` clean.

## Not committed

Per `no-commit.md` — developer commits manually.
