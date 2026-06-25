# DDROIDD Newsletter Builder

## What This Is

A visual, drag-and-drop newsletter builder (Mailchimp / ActiveCampaign style) for the DDROIDD team. Non-developers assemble on-brand emails by dragging pre-built blocks onto a canvas, editing content inline, and exporting production-ready HTML — no developer in the loop. It is a web app built around the GrapesJS editor with the grapesjs-mjml plugin, reusing the existing `mjml` compile pipeline so output keeps surviving the same email clients today's templates target.

This replaces the current workflow where a developer hand-edits `src/sections/*.mjml`, compiles with `npm run build-pages`, and previews/sends through Outlook COM PowerShell scripts.

## Core Value

A non-developer can build and export a complete, on-brand, client-safe newsletter end-to-end without touching code or asking a developer.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ MJML → client-safe HTML compile pipeline (`mjml` npm lib, `src/` → `dist/`) — existing, reused
- ✓ Library of branded section designs (hero, projects, hiring, new colleagues, initiatives, disclaimer, etc.) as MJML source — existing, to be re-authored as editor blocks

### Active

<!-- Current scope. Building toward these. Hypotheses until shipped. -->

- [ ] Drag-and-drop visual editor (GrapesJS + grapesjs-mjml) running in a React web app
- [ ] Editor outputs MJML, compiled server-side to client-safe HTML via the `mjml` lib
- [ ] DDROIDD branded sections available as pre-built, drag-in editor blocks (re-authored, not imported — see Key Decisions)
- [ ] Generic content blocks (text, image, button, columns, spacer) available alongside branded blocks
- [ ] Inline content editing (text, links, images) on the canvas
- [ ] Users log in (internal team auth, no public signup)
- [ ] Newsletters saved server-side to a database; users can list, open, edit, and duplicate them
- [ ] Multiple internal users can each manage newsletters
- [ ] Image upload (stored server-side / object storage) + pick-from-asset-library
- [ ] Export finished newsletter as standalone HTML file (download / copy)
- [ ] Live preview of the compiled email (desktop + mobile widths)

### Out of Scope

<!-- Explicit boundaries with reasoning. -->

- ESP / direct sending integration (SendGrid, Mailgun, etc.) — export HTML only for now; sending stays manual/external. Decouples builder from delivery.
- Outlook COM PowerShell send/preview scripts — superseded; the builder is the new authoring surface. Scripts may stay in repo for ad-hoc dev use but are not part of the product.
- Public multi-tenant signup / org isolation — internal team tool only; simpler auth.
- Subscriber/contact-list management, campaigns, scheduling, analytics — this is an authoring tool, not a full ESP.
- Arbitrary MJML import of legacy hand-authored files into the editor — see grapesjs-mjml round-trip risk in Key Decisions.

## Context

**Existing repo:** MJML sources in `src/` — `components/head.mjml` (global `mj-head`: fonts, `mj-attributes` defaults, `mj-style`), `sections/*.mjml` (self-contained `mj-section` blocks), `pages/index.mjml` (composes sections via `mj-include`). Compiled to `dist/index.html` with the `mjml` npm lib. Assets in `assets/`. PowerShell + Outlook COM scripts (`EmailTester.ps1`, `QuickEmailTest.ps1`) for preview/send.

**Composition model today is `mj-include`-based** — a compile-time directive. `index.mjml` pulls in `head.mjml` then ordered section files. The grapesjs-mjml editor operates on *flat* MJML and has no concept of includes. "Reuse the pipeline" therefore means reuse the `mjml` *compiler*, not the include structure.

**Email-client rendering is the core domain constraint** (Outlook ignores some padding → `mj-spacer`; Gmail strips `<style>` → inline critical CSS; Yahoo may ignore media queries). The current templates encode this hard-won knowledge in `head.mjml` and the sections. Any block re-authoring must preserve these behaviors. Default text color is white, so block background colors matter for legibility.

**Why now:** developer is a bottleneck for every content change. Goal is to remove that dependency entirely for routine newsletter creation.

## Constraints

- **Tech stack**: Node + React, Express backend, server-side MJML compile via the `mjml` npm lib — one language end-to-end, reuses existing npm tooling. (User decision.)
- **Editor**: GrapesJS + grapesjs-mjml plugin — outputs MJML/HTML, the only mature OSS drag-drop editor that targets MJML. (User decision.)
- **Persistence**: database, server-side storage, login. Internal team tool — no public signup.
- **Sending**: export HTML only; no ESP integration this milestone.
- **Brand fidelity**: exported emails must render correctly across Outlook / Gmail / Yahoo, matching the quality of current hand-authored templates.
- **Platform note**: existing dev/test tooling (Outlook COM scripts) is Windows-only; the new builder should be OS-independent (web app).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Embed GrapesJS + grapesjs-mjml rather than build editor from scratch or use Unlayer | Mature OSS, outputs MJML so the existing compile pipeline + client-safety knowledge are reused; avoids months of from-scratch work and proprietary lock-in | — Pending |
| **grapesjs-mjml supports its own MJML subset; it does NOT reliably import arbitrary hand-authored MJML** — branded sections will be **re-authored as block definitions**, not imported | `src/` relies on `mj-include` (compile-time), `mj-style`/`mj-attributes` in `head.mjml`, `background-url`, `mj-spacer`, `css-class` — features with lossy/variable plugin support. Verified by grepping the repo. This is the #1 project risk and must be spiked in Phase 1 before SaaS infra is built. | ⚠️ Revisit (spike first) |
| Web app: Node + React + Express, server-side compile | Single language across editor/compiler, reuses `mjml` lib, OS-independent vs current Windows-only scripts | — Pending |
| Internal team tool, simple auth, no public signup | Audience is DDROIDD staff; avoids multi-tenant complexity | — Pending |
| Export HTML only; no ESP / Outlook coupling this milestone | Keeps scope on authoring; sending stays external/manual | — Pending |
| Image upload + curated asset library | Non-devs need to add images without dev help, but keep branded assets handy | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-25 after initialization*
