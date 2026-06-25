---
name: new-branded-block
description: Re-author a hand-authored MJML section (src/sections/*.mjml) into a grapesjs-mjml editor block definition — inline all defaults via BLOCK_DEFAULTS, apply structural locking, and verify it compiles correctly in isolation. Use when adding a DDROIDD branded block (hero, projects, hiring, new colleagues, initiatives, disclaimer) to the editor.
---

# New Branded Block

> ⚠️ **PROVISIONAL — revise after the Phase 1 feasibility spike.** The exact grapesjs-mjml runtime API (block registration shape, the locking/component-definition flags, how `getProjectData` round-trips a custom block) is research-derived but **not yet runtime-verified**. Once Phase 1 confirms the working pattern, update this skill's steps and code to match what actually worked, and remove this banner. Until then, treat the API specifics as a starting point, not gospel.

Branded sections are **re-authored**, never imported — grapesjs-mjml cannot reliably round-trip hand-authored MJML (confirmed: issues #35/#194/#388). See `.claude/rules/grapesjs.md` and `.claude/rules/mjml-email-safety.md`.

## Inputs
- The source section: `src/sections/<name>.mjml` (design + content reference only — do not import it).
- `src/components/head.mjml` — the global `mj-attributes`/fonts/colors the section *used* to inherit. Since `mj-attributes` is unsupported in the editor, those values must be inlined per element via `BLOCK_DEFAULTS`.

## Steps

1. **Read the source section** and note: structure (sections/columns), every text/image/button, and which attributes it relied on from `head.mjml` (font-family, color, font-size, line-height) plus any flagged-risky features (`background-url` on `mj-section`, `fluid-on-mobile` on `mj-image`, `css-class`).

2. **Write the block content as a flat MJML string** with **all defaults inlined** — pull shared values from the `BLOCK_DEFAULTS` constant, not from any head:
   - Every `mj-text`: `font-family` (with full fallback chain), `color`, `font-size`, `line-height`.
   - Every `mj-section`: explicit `background-color` (white-default-text trap — no background = invisible text).
   - `background-url` baked into the section (it's not a default panel trait); `fluid-on-mobile` baked into the image.
   - **Never** include `mj-include`, `mj-attributes`, or `mj-style` in the content string — they fail silently or corrupt the canvas.

3. **Register the block** under the `DDROIDD Branded` category (string key, not a computed key):
   ```js
   editor.Blocks.add('ddroidd-<name>', {
     label: '<Human Name>',
     category: 'DDROIDD Branded',
     content: `<mj-section background-color="...">...</mj-section>`, // inlined defaults
   });
   ```

4. **Apply structural locking** (BLOCK-03) so a non-dev can edit content but not break layout: lock the section/column structure (`draggable`/`droppable`/`removable`/`copyable`/`selectable` as appropriate) and leave only the intended content regions (text, images) editable/movable. *(Exact flag set — confirm against the spike's working component-definition pattern.)*

5. **Verify in isolation — no mj-head injection** (BLOCK-02): compile the block's MJML alone through `mjml@4.18.0`. It must produce correct on-brand HTML with fonts/colors/spacing present *without* relying on any injected head. If it looks wrong alone, a default wasn't inlined.

6. **Run the render gate** — invoke the `verify-email-render` skill on the isolated compile: Outlook + Gmail, full checklist. Fix and re-verify on any FAIL.

7. **Round-trip check** — drop the block on the canvas, `getProjectData()` → `loadProjectData()`, confirm the block survives byte-identical (the Phase 1 lossless-round-trip guarantee).

## Done when
- Block drags from the panel, renders on-brand by default, compiles correctly in isolation (no head dependency), passes the Outlook+Gmail render gate, locks structure while keeping content editable, and survives project-JSON round-trip.

## Cross-references
- `.claude/rules/grapesjs.md` — BLOCK_DEFAULTS, no-mj-attributes, string-key, locking.
- `.claude/rules/mjml-email-safety.md` — the client constraints the block must satisfy.
- `verify-email-render` skill — step 6 render gate.
