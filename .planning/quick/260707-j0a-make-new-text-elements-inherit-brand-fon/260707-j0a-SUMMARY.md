---
quick_id: 260707-j0a
description: make new text elements inherit brand font
status: complete
date: 2026-07-07
---

# Summary — 260707-j0a: New text elements inherit DDROIDD brand font

## What changed

`app/client/src/editor/editorConfig.ts`:
- Import `BLOCK_DEFAULTS` + the `Component` type from grapesjs.
- `FONT_BEARING_TYPES` — a Set derived from `STYLABLE_BY_TYPE` (entries including `font-family`):
  `mj-text`, `mj-button`, `mj-social-element`. One source of truth for "renders text in a font".
- `applyBrandFontToTree(component)` — recurses a component tree and fills **missing**
  `font-family` / `font-size` / `line-height` from `BLOCK_DEFAULTS` on font-bearing components
  via `addAttributes`. Fill-missing only; `color` intentionally excluded.
- `onEditor` now subscribes to `block:drag:stop` → runs `applyBrandFontToTree` on the dropped
  component (guards the `undefined` rejected-drop case).

## Key decisions

- **`block:drag:stop`, not `component:create`/`component:add`.** The create/add events fire
  during `loadProjectData`, which would mutate loaded generic text and break the Phase-1
  round-trip gate (`assertRoundTrip`, `actions.ts:151`). `block:drag:stop` fires only on a real
  drop → save→load stays byte-identical.
- **No `color`.** `BLOCK_DEFAULTS.textColor` is `#ffffff`; forcing it on a generic block dropped
  into a light section = white-on-white (white-default-text trap, `mjml-email-safety.md`). Text
  color is owned by the server-injected `mj-head` at export.
- **Fill-missing only** → branded blocks + existing content untouched; idempotent.
- Export path unchanged: server `mj-head` already sets brand font/size/line-height via
  `mj-attributes` — this fix is canvas-visual only.

## Verification

- `npx tsc --noEmit` — clean (exit 0).
- The typed `block:drag:stop` signature (`Component | undefined`, `Block`) confirms arg 0 is the
  dropped component model.

## Manual verification still required (real editor)

- Drag the generic **Text** block onto the canvas → new element renders in the Calibri brand
  stack, 16px / 24px line-height (matches branded blocks); text color left to section/head.
- Same for generic **Button** and **Social** blocks.
- Regression: `window.__ddroiddAssertRoundTrip()` still logs `Round-trip identical: true`.
