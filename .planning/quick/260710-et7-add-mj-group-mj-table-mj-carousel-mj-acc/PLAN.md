---
quick_id: 260710-et7
slug: add-mj-group-mj-table-mj-carousel-mj-acc
date: 2026-07-10
status: in-progress
---

# Add missing MJML standard-body components as editor blocks

## Goal
Close the gap between the MJML standard body-component set and the editor's draggable
block palette. Add the safe, editable ones as branded-pattern blocks.

## Scope decision (evidence-driven)
MJML has 16 standard body components. Filtered by the project's two hard gates
(email-client safety `mjml-email-safety.md`, non-dev safety `grapesjs.md` EDIT-07):

| Component | Decision | Why |
|-----------|----------|-----|
| mj-group | **BUILD** | Layout wrapper (side-by-side cols on mobile). Email-safe, no children issues. |
| mj-carousel | **BUILD** | Plugin has editor model; children are registered `mj-carousel-image` types → parse cleanly. Degrades to static first-image in Outlook/Gmail (verify in gate). |
| mj-accordion | **BUILD** | Plugin has editor model; `mj-accordion-element/title/text` registered → parse cleanly. Degrades to expanded panels in Outlook/Gmail (verify in gate). |
| mj-table | **DEFER** | Runtime spike (260710, `window.__ddroiddEditor`): grapesjs maps `mj-table`→`text`(RTE), but the DOM parser **strips `<tr>/<td>`** (not inside a real `<table>`) → `getHtml()` = `<mj-table>Cell ACell B12</mj-table>`, structure destroyed. Needs raw-content-preservation workaround → own task. |
| mj-carousel/accordion interactivity | accepted-as-static in Outlook/Gmail | user decision; verify actual fallback, don't assume. |
| mj-raw | out (being removed, plan 260709-iw7) | — |
| mj-hero, mj-navbar | leave as-is | user decision; already exposed. |

## Files to change
1. `app/client/src/editor/blocks/group.ts` (new) — `mjGroupBlock`
2. `app/client/src/editor/blocks/carousel.ts` (new) — `mjCarouselBlock`
3. `app/client/src/editor/blocks/accordion.ts` (new) — `mjAccordionBlock`
4. `app/client/src/editor/blocks/registerBlocks.ts` — register the 3 with StrictMode guard
5. `app/client/src/editor/editorConfig.ts` — add `STYLABLE_BY_TYPE` entries for the new types

## Block authoring rules (grapesjs.md)
- Inline all brand defaults per element via `BLOCK_DEFAULTS` (font-family/size/line-height/color + section bg).
- **NO self-closing mj-* tags** — explicit close pairs only (DOM parser swallows siblings).
- No `mj-attributes`/`mj-include`/`mj-style` in content.
- Accordion white-default-text trap: MJML default accordion panels are white → set explicit
  dark bg + white text on title/text so brand white text stays visible.
- Carousel placeholder src = existing absolute URL (hero image); user swaps per-image via trait.

## STYLABLE_BY_TYPE (email-safe subset per new type)
- `mj-group`: background-color, width, vertical-align
- `mj-carousel`: border-radius, container-background-color
- `mj-carousel-image`: border-radius
- `mj-accordion`: font-family, border, padding, container-background-color
- `mj-accordion-element`: font-family, border, background-color
- `mj-accordion-title`: font-family, font-size, color, padding, background-color
- `mj-accordion-text`: font-family, font-size, color, line-height, padding, background-color

(title/text are font-bearing → auto-fill brand font via existing FONT_BEARING_TYPES derivation.)

## Exit criteria
- [ ] 3 new block files, registered, appear in palette; drop onto canvas without error.
- [ ] `npm run typecheck` (client) clean.
- [ ] Each block compiles in isolation via server compile (BLOCK-02) — no MJML errors, structure preserved.
- [ ] Project-JSON round-trip stays byte-identical (assertRoundTrip) — new blocks don't break it.
- [ ] **Real-client render (carousel + accordion specifically):** compile → Outlook + Gmail via
      `verify-email-render` / PowerShell scripts. Confirm ACTUAL degradation (carousel→first image,
      accordion→expanded), not assumed. If either renders blank → reopen scope.
- [ ] Style Manager shows only the allowlisted props for each new type (EDIT-06).

## Commits
Per `no-commit.md`: NO auto-commit. All GSD commit steps suppressed. Hand back changed-file
list + suggested message; developer commits.
