---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Phase 2 UI-SPEC approved
last_updated: "2026-07-04T00:00:00.000Z"
last_activity: 2026-07-04 -- Completed gap-closure plan 01-06 (blocks panel + Windows dev script)
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-25)

**Core value:** A non-developer can build and export a complete, on-brand, client-safe newsletter end-to-end without touching code or asking a developer.
**Current focus:** Phase 01 — feasibility-spike-editor-core

## Current Position

Phase: 01 (feasibility-spike-editor-core) — EXECUTED, gap-closure complete, GATE PASSED
Plan: 6 of 6 complete (5 original + 1 gap-closure)
Status: Phase 01 complete; PHASE-2 GATE CLEARED (2026-07-05 headless-CDP runtime check)
Last activity: 2026-07-14 - Completed quick task 260714-dq7: Vite vendor chunk splitting — split the 3.66MB editor chunk into cacheable per-lib vendor chunks

Progress: [██████████] 100% (plans) — Phase-2 gate PASSED

✅ PHASE-2 GATE CLEARED (2026-07-05): verified against live `npm run dev` via isolated
headless chromium (CDP), evidence editor-runtime-gate-pass.png + 01-UAT.md:
  1. Editor MOUNTS, 0 console errors, Blocks panel shows 22 chips (7 DDROIDD branded
     + 15 generic) — grapesjs@0.22.16 + grapesjs-mjml@1.0.8 runtime compat PROVEN.
  2. POST /api/compile via Vite proxy → 200, valid HTML, errors:[].
Remaining human-only (non-gate): mouse drag feel, inline edit/undo, real Outlook+Gmail
render (CLIENT-RENDER-GATE). Phase 2 (auth/DB/image) may proceed.

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: grapesjs@0.22.16 + grapesjs-mjml@1.0.8 + @grapesjs/react@2.0.0 is the target version triple; fallback is grapesjs@0.21.2 + direct mount
- [Init]: GrapesJS project JSON (getProjectData) is the canonical persisted state — never reload from MJML string
- [Init]: mj-head injected server-side before compile; BLOCK_DEFAULTS constant shared across all block definitions
- [Init]: mjml@4.18.0 pinned server-side to match mjml-browser@4 bundled in grapesjs-mjml (v5 breaks preview/export parity)
- [Init]: Image upload POST authenticated; asset GET publicly reachable; always absolute HTTPS URLs
- [2026-06-25]: ORM switched from Prisma → **Drizzle** (TS-native, SQL-first, no codegen/generated client; migrations via drizzle-kit; driver stays `pg`). See PROJECT.md Key Decisions.
- [2026-07-04]: Self-closing `<Editor />` (no child) activates @grapesjs/react default-UI mode (blocks panel). The custom-UI pattern with sub-components is deferred to a later phase.
- [2026-07-04]: `concurrently` replaces `&` in the app dev script for Windows cmd.exe compatibility; both dev servers now start in parallel.

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED 2026-07-05]: grapesjs@0.22.16 + grapesjs-mjml@1.0.8 runtime compatibility — CONFIRMED working (editor mounts, 22 blocks register, 0 console errors, compile 200). Phase-2 gate cleared. Phase 2 may proceed.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260704-iqo | Capture ActiveCampaign email designer research into planning docs | 2026-07-04 | (pending — no-commit rule) | [260704-iqo-capture-activecampaign-email-designer-re](./quick/260704-iqo-capture-activecampaign-email-designer-re/) |
| 260704-p2a | Re-author 5 remaining newsletter sections as branded blocks; TEMPLATE_MJML + "New from Template" button; headless mjml compile gate (8/8 PASS) | 2026-07-04 | (pending — no-commit rule) | [260704-p2a-re-author-latest-newsletter-index-mjml-s](./quick/260704-p2a-re-author-latest-newsletter-index-mjml-s/) |
| 260704-ppr | Figma-style 3-panel editor UI: custom-UI mode, render-props panels (blocks chips, layers tree, email-safe styles/traits); Playwright-verified | 2026-07-04 | (pending — no-commit rule) | [260704-ppr-figma-style-3-panel-editor-ui-layers-blo](./quick/260704-ppr-figma-style-3-panel-editor-ui-layers-blo/) |
| 260705-g6u | Fix Style Manager sector clobbering: usePlugin() (string-key pluginsOpts was a silent no-op) + resetStyleManager:false + RightPanel isVisible filter — padding now editable on mj-text; Playwright-verified | 2026-07-05 | (pending — no-commit rule) | [260705-g6u-fix-stylemanager-sector-clobbering-reset](./quick/260705-g6u-fix-stylemanager-sector-clobbering-reset/) |
| 260705-h8h | Client architecture refactor: editorOptions split into actions/editorConfig/registerBlocks, blocks/ → editor/blocks/, React.lazy+Suspense editor chunk (~688KB gz split from ~72KB entry), ErrorBoundary, auth-guard seam | 2026-07-05 | (pending — no-commit rule) | [260705-h8h-refactor-app-client-for-strong-architect](./quick/260705-h8h-refactor-app-client-for-strong-architect/) |
| 260705-htv | Export HTML: compile service w/ canonical mj-head injection (strips editor head), Export button downloads newsletter-YYYY-MM-DD.html, compile-warning banner w/ Download-anyway, verify:compile gate (7/7); Playwright-verified end-to-end | 2026-07-05 | (pending — no-commit rule) | [260705-htv-export-html-download-button-in-editor-se](./quick/260705-htv-export-html-download-button-in-editor-se/) |
| 260707-cee | Figma-style right inspector panel: panelControls.tsx primitives (SegmentedIconGroup, SwatchRow, PairedField) + RightPanel curated sections (Content→Alignment→Layout→Appearance→Fill→Stroke→Typography); EDIT-06 gates preserved; tsc clean; human canvas verify pending | 2026-07-07 | (pending — no-commit rule) | [260707-cee-figma-style-right-panel](./quick/260707-cee-figma-style-right-panel/) |
| 260707-j0a | New text elements inherit brand font: block:drag:stop fill-missing font-family/size/line-height (from BLOCK_DEFAULTS) on dropped mj-text/mj-button/mj-social-element; color excluded (white-default trap); chose drag:stop over component:create to keep round-trip byte-identical; tsc clean; human canvas verify pending | 2026-07-07 | (pending — no-commit rule) | [260707-j0a-make-new-text-elements-inherit-brand-fon](./quick/260707-j0a-make-new-text-elements-inherit-brand-fon/) |
| 260710-67u | Anchors inside mj-text inherit brand color: inline `a{color:#ffffff}` mj-style in CANONICAL_HEAD (juice-inlined, naked-only — pre-colored/button/social anchors keep own color); canvas iframe `a{color:inherit}` <style> injected DOM-direct on editor load (never enters project JSON, round-trip safe); color-only (size/line-height already inherit); verify:compile 10/10; tsc clean; Outlook+Gmail + canvas human verify pending | 2026-07-10 | (pending — no-commit rule) | [260710-67u-anchors-inside-mj-text-inherit-brand-color](./quick/260710-67u-anchors-inside-mj-text-inherit-brand-color/) |
| 260710-et7 | Add missing MJML standard-body components to editor: mj-group/mj-carousel/mj-accordion blocks (plugin ships models, no palette defs); mj-table DEFERRED (canvas DOM parser strips tr/td — spike-confirmed); expand mj-section Style Manager to full MJML attr set (background-url/-position/-size/-repeat, full-width, direction, text-align) via new "Section" sector + scoped RightPanel group; isolation-compile 3/3 PASS; tsc clean. PENDING runtime gates: carousel/accordion canvas-parse (getHtml children survive), section-attr serialization, Outlook+Gmail bg-image render | 2026-07-10 | (pending — no-commit rule) | [260710-et7-add-mj-group-mj-table-mj-carousel-mj-acc](./quick/260710-et7-add-mj-group-mj-table-mj-carousel-mj-acc/) |
| 260710-kz8 | Fix Padding controls: mirror shorthand `padding` into the four longhand styles on `component:styleUpdate:padding` (grapesjs-mjml's style-default longhands were overriding shorthand at MJML compile, so canvas never re-rendered on edit); clear removes longhands to restore plugin default (not zero); `isLoadingProject()` guard in actions.ts prevents mutation during loadProjectData; inner-padding untouched (no longhand equivalent); tsc clean; Playwright-verified (93→53→133→93px section height, round-trip identical: true) | 2026-07-10 | (pending — no-commit rule) | [260710-kz8-fix-padding-controls-expand-shorthand-pa](./quick/260710-kz8-fix-padding-controls-expand-shorthand-pa/) |
| 260710-lg4 | Fix Alignment control: writes CSS `text-align` which is illegal on mj-text/mj-button/mj-image/mj-divider/mj-social-element (MJML silently ignores it — no canvas or export effect); added a scoped `align` StyleManager property (left/center/right) via STYLABLE_BY_TYPE, mj-section keeps `text-align` (its only legal alignment attribute); resolveAlignIcon + RightPanel wired for the new prop; tsc clean; Playwright-verified end-to-end (API-level + real UI click path): canvas `td[align=center]`, export `<mj-text align="center">` with no `text-align`, mj-section still `text-align`-only | 2026-07-10 | (pending — no-commit rule) | [260710-lg4-fix-alignment-control-use-mjml-align-att](./quick/260710-lg4-fix-alignment-control-use-mjml-align-att/) |
| 260710-lty | Static-deploy: move MJML compile in-browser (mjml-browser@4.18.0), removing the last server runtime dep (`/api/compile`). Extracted CANONICAL_HEAD + `buildFullMjml` into `app/shared/mjml-head.ts` — one source of truth imported by both server `mjml` and client `mjml-browser` (EXPORT-04). `actions.ts` compile is now synchronous (Export/Preview work with server stopped); Preview opens compiled HTML in a new tab. `@shared` alias (Vite + tsconfig). `verify:parity` proves server `mjml` === client `mjml-browser` HTML for TEMPLATE_MJML (blocker gate PASS). `app/client/vercel.json` static SPA config. Deviation: `window-polyfill.ts` for mjml-browser UMD under tsx (server tooling only). Save/Load already localStorage-only. PENDING: real Outlook+Gmail render gate; live browser Export/Preview click-path | 2026-07-10 | (pending — no-commit rule) | [260710-lty-static-deploy-via-browser-mjml-compile-s](./quick/260710-lty-static-deploy-via-browser-mjml-compile-s/) |
| 260714-dq7 | Vite vendor chunk splitting: `build.rollupOptions.output.manualChunks` (function form — rolldown rejects object form) splits the 3.66MB editor chunk into per-lib vendor chunks (grapesjs 287KB gz / mjml-browser 342KB gz / grapesjs-mjml 353KB gz); editor app code now its own 53KB gz chunk, entry unchanged (232KB). Caching+parallelism change, NOT a size reduction (total editor payload unchanged — client MJML editor floor ≈1MB gz). `chunkSizeWarningLimit: 1500` silences the misleading >500kB warning. `npm run build` (tsc + vite) clean, no warnings | 2026-07-14 | (pending — no-commit rule) | [260714-dq7-vite-vendor-chunk-split](./quick/260714-dq7-vite-vendor-chunk-split/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Client-render (D-05) | Full Outlook+Gmail render of `dist/spike-output.html` via `QuickEmailTest.ps1` + `EmailTester.ps1` on a classic-Outlook (COM) machine; compile/structural safety already verified. See CLIENT-RENDER-GATE.md. | Deferred | Phase 1 / 01-05 (2026-06-25) |
| Live-editor verify | EDIT-01..05 (drag/drop/reorder/delete/inline/undo/redo), `getHtml()` shape, and `fluid-on-mobile`/`background-url` round-trip survival — need a human at `localhost:5173`. | Pending-human | Phase 1 / 01-03 + 01-04 |

## Session Continuity

Last session: 2026-06-25T13:06:38.741Z
Stopped at: Phase 2 UI-SPEC approved
Resume file: .planning/phases/02-auth-db-image-foundation/02-UI-SPEC.md
