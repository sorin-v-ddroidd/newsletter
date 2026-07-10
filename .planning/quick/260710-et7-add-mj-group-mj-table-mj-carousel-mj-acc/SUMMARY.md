---
quick_id: 260710-et7
slug: add-mj-group-mj-table-mj-carousel-mj-acc
date: 2026-07-10
status: incomplete
---

# Summary — add missing MJML standard-body components

## What was done

### 1. Gap analysis (MJML spec vs editor palette)
16 MJML standard body components enumerated. Two hard gates filter what to expose:
email-client safety (`mjml-email-safety.md`) + non-dev safety (`grapesjs.md` EDIT-07).
Verified from plugin dist: grapesjs-mjml ships **component models** for all, but **palette
block defs** only for the default 15 — carousel/accordion/table/group have models, no blocks.

### 2. New blocks (3)
- `editor/blocks/group.ts` — `mjGroupBlock` (side-by-side columns, category Layout)
- `editor/blocks/carousel.ts` — `mjCarouselBlock` (3 placeholder images, category Content)
- `editor/blocks/accordion.ts` — `mjAccordionBlock` (2 panels, dark bg + white text to dodge
  the white-default-text trap, category Content)
- Registered in `editor/blocks/registerBlocks.ts` with StrictMode guards.

### 3. mj-table DEFERRED (evidence-driven)
Runtime spike via `window.__ddroiddEditor`: grapesjs maps `mj-table`→`text`(RTE) but the canvas
DOM parser **strips `<tr>/<td>`** (not inside a real `<table>`) → `getHtml()` collapses to
`<mj-table>Cell ACell B12</mj-table>`. Needs a raw-content-preservation workaround → own task.

### 4. mj-section Style Manager expanded to full MJML attr set
User chose "everything except css-class"; skipped 8 pure duplicates of existing shorthands
(background-position-x/-y, per-side padding-*/border-*, gutter).
- `editorConfig.ts`: new `section` sector (background-url text, background-position/-size text,
  background-repeat/full-width/direction selects) + `STYLABLE_BY_TYPE['mj-section']` extended
  (+ text-align, background-url/-position/-size/-repeat, full-width, direction).
- `RightPanel.tsx`: new scoped "Section" group (`renderSection`), self-hides for non-section
  selections (only mj-section lists these in stylable). NOT a global fallthrough — that would
  leak props into every component and fight EDIT-06.

## Verification done
- `npm run typecheck` (client) — clean.
- Isolation compile (mjml@4.18.0, throwaway script, now deleted): group/carousel/accordion
  3/3 PASS (errors:0, non-empty html, structure markers present).

## Carousel — RESOLVED + Playwright-verified (2026-07-10)
Root cause of blank canvas + missing traits: **grapesjs-mjml registers NO component TYPES for
mj-carousel / mj-carousel-image** — dropped instances are GENERIC (`get('type') === ''`, default
id/title traits), so every type-keyed hook silently no-op'd. Confirmed by walking the model tree.

Fixes in `editorConfig.ts`:
- `addType('mj-carousel-image', { isComponent: el=>el.tagName==='MJ-CAROUSEL-IMAGE', model:{defaults:
  {tagName, droppable:false, traits:[src,alt,href]}} })` → slides become the real type + get editable
  Image URL / Alt / Link traits (RightPanel "Content" on select via Layers).
- `addType('mj-carousel', { isComponent: el=>el.tagName==='MJ-CAROUSEL', model:{defaults:{tagName}},
  view:{ onRender } })` → the plugin can't render the carousel in-canvas at all (its radio/label/
  <style> form doesn't survive canvas parsing), so onRender paints a STATIC preview (slide-1 img via
  safe DOM — img.src property, no innerHTML injection — + "Carousel · N slides" badge). Presentation
  only; export + project JSON untouched.
- Canvas `.mj-carousel-image-1 { display:block }` reveal kept (harmless).
- Slide images = 3 distinct picsum.photos URLs (placehold.co wasn't loading in-canvas).

Playwright headless verify (driver drove :5173): slide type=`mj-carousel-image`; traits=[src,alt,href];
selecting a slide → RightPanel shows "Image URL / Alt text / Link URL"; canvas shows slide-1 img +
badge; `getHtml()` emits valid `<mj-carousel>` MJML with both images. ALL PASS.
2. **Accordion — REWORKED + Playwright-verified.** Default restyled to the MJML-docs look (readable
   clickable tabs): white title panels / #fafafa text panels / dark text, hairline border, arrow
   icons (MJML docs CDN, set per mj-accordion-element), all inlined (no mj-attributes). Canvas render
   fix: grapesjs-mjml renders mj-accordion as RAW custom tags (`<mj-accordion-title>` etc.), which
   default to unstyled display:inline + font-size:0 → text present but invisible. Added canvas-only
   CSS (same injection as anchor/carousel) styling the raw tags into structured panels WITH explicit
   font-size (the missing piece). CSS-only → title/text stay type=text inline-editable; export
   untouched. Isolation compile 0 errors, icons present. Verified: renders as clean panels in canvas.
3. **Section-attr serialization — PASSED, Playwright-verified.** Set background-url/-size/-repeat +
   full-width + direction on a section → all present in `getHtml()`. Panel edits export correctly.
4. **Real-client render — STILL OPEN (needs human; can't automate visual client rendering).** Compile
   a doc with carousel/accordion/section-bg-image → Outlook + Gmail (`verify-email-render`). Confirm
   carousel→first image, accordion→expanded, Outlook VML renders the section bg image. Do not assume.

## Files changed
- A `app/client/src/editor/blocks/group.ts`
- A `app/client/src/editor/blocks/carousel.ts`
- A `app/client/src/editor/blocks/accordion.ts`
- M `app/client/src/editor/blocks/registerBlocks.ts`
- M `app/client/src/editor/editorConfig.ts`
- M `app/client/src/editor/RightPanel.tsx`
- A `.planning/quick/260710-et7-.../PLAN.md`, `SUMMARY.md`
- M `.planning/STATE.md`

## Commit
Per `no-commit.md`: NOT committed. Developer commits manually.
