# Roadmap: DDROIDD Newsletter Builder

## Overview

Four phases, risk-first. Phase 1 is a hard technical gate — it verifies the GrapesJS + grapesjs-mjml stack actually works before any auth, database, or storage infrastructure is built. Phase 2 lays the authenticated API and persistence foundation. Phase 3 delivers the full branded block library with editor guardrails. Phase 4 completes preview, export, and newsletter list polish to bring the product to shippable state.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Feasibility Spike (Editor Core)** - HARD GATE — verify GrapesJS + grapesjs-mjml mounts, branded blocks drag/drop, project-JSON round-trip is lossless, server compile produces client-safe HTML
- [ ] **Phase 2: Auth + DB + Image Foundation** - Authenticated API, PostgreSQL schema, save/load wired to real API, image upload with public HTTPS URLs, asset library
- [ ] **Phase 3: Full Branded Block Library + Editor Configuration** - All branded blocks re-authored with BLOCK_DEFAULTS, locking constraints, restricted Style Manager, raw-HTML surfaces removed
- [ ] **Phase 4: Preview, Export, Library Polish & Extras** - Server-compiled preview (desktop/mobile), HTML download, mj-head injection, newsletter list polish, autosave, version history

## Phase Details

### Phase 1: Feasibility Spike (Editor Core)

**Goal**: Proof that grapesjs@0.22.16 + grapesjs-mjml@1.0.8 are viable in React — editor mounts without errors, at least 2 branded blocks are draggable, project-JSON round-trip is lossless, server MJML compile produces client-safe HTML rendering correctly in Outlook and Gmail, and mj-attributes behavior is confirmed experimentally.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):

  1. GrapesJS + grapesjs-mjml mounts in React on grapesjs@0.22.16 without console errors or render failures
  2. At least 2 DDROIDD branded blocks and all 5 generic block types (text, image, button, columns, spacer) are draggable onto the canvas and reorderable via drag-and-drop
  3. `editor.getProjectData()` persisted to localStorage and reloaded via `editor.loadProjectData()` produces a byte-identical canvas state (inline text editing and undo/redo functional on reload)
  4. MJML extracted from the editor, POSTed to the server compile endpoint, and rendered in Outlook and Gmail displays correctly without broken fonts, dark-on-dark text, or spacing failures
  5. mj-attributes behavior documented from experiment: defaults either survive or are confirmed silently dropped, and the BLOCK_DEFAULTS mitigation strategy is validated

**Plans:** 2/5 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold app/client + mount GrapesJS editor + hero block + localStorage round-trip (criteria 1, 3)
- [x] 01-02-PLAN.md — Scaffold app/server + POST /api/compile (conditional wrap, CORS, body limit)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-03-PLAN.md — Wire client→server compile + projects block + full EDIT-01..05 drag/reorder/inline/undo verification (criterion 2)
- [ ] 01-04-PLAN.md — mj-attributes experiment (Part A + Part B) + BLOCK_DEFAULTS validation (criterion 5)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-05-PLAN.md — Client-render gate (D-05) with human checkpoint for classic Outlook (criterion 4)

### Phase 2: Auth + DB + Image Foundation

**Goal**: Full authenticated API with login/logout, PostgreSQL schema with project_data JSONB as authoritative state, GrapesJS save/load wired to real server API, image upload storing files server-side and returning absolute public HTTPS URLs, and asset library panel operational.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SAVE-01, SAVE-02, SAVE-03, SAVE-04, IMG-01, IMG-02, IMG-03
**Success Criteria** (what must be TRUE):

  1. User can log in with email/password, stay logged in across browser refresh (httpOnly cookie), and log out from any page; unauthenticated requests to the editor or API are rejected
  2. User can save a newsletter to the server and reload it in a fresh browser session with the canvas in the identical state it was saved (loaded from project JSON, never re-parsed from MJML)
  3. User can see a list of saved newsletters and create a new one or duplicate an existing one as a starting point
  4. User can upload an image that is stored server-side and immediately accessible via an absolute public HTTPS URL that does not require authentication to fetch
  5. User can pick images from a curated asset library and insert them into image blocks on the canvas

**Plans**: TBD
**UI hint**: yes

### Phase 3: Full Branded Block Library + Editor Configuration

**Goal**: All DDROIDD branded section blocks re-authored as locked editor component definitions sharing a BLOCK_DEFAULTS constant, locking constraints enforced per component, Style Manager restricted to an email-safe allowlist, brand palette constrained, and all raw-HTML escape hatches removed from the editor.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: BLOCK-01, BLOCK-02, BLOCK-03, EDIT-06, EDIT-07, EDIT-08
**Success Criteria** (what must be TRUE):

  1. User can drag all 6 DDROIDD branded section types (hero, projects, hiring, new colleagues, initiatives, disclaimer) onto the canvas from the block panel
  2. Every branded block renders with correct DDROIDD colors, fonts, and spacing by default — no reliance on mj-attributes; verified by loading the block in isolation and compiling to HTML without any mj-head injection
  3. Branded blocks enforce structural guardrails: layout and structure are locked; only intended content regions (text, images) are editable or movable; non-editable structural elements cannot be removed
  4. User can only style elements using an email-safe set of controls — no flexbox, position, box-shadow, or other properties that break in Outlook's Word rendering engine are exposed
  5. User cannot reach a raw HTML editor, MJML import panel, or mj-raw block anywhere in the editor UI; color and font pickers are constrained to the approved DDROIDD brand palette

**Plans**: TBD
**UI hint**: yes

### Phase 4: Preview, Export, Library Polish & Extras

**Goal**: Server-compiled email preview (desktop and mobile widths) in a sandboxed iframe, HTML download/export, server-side mj-head injection before compile, newsletter list CRUD polish (rename, delete), autosave, and version history with restore.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, SAVE-05, SAVE-06, SAVE-07
**Success Criteria** (what must be TRUE):

  1. User can preview the compiled email in a sandboxed iframe that matches what recipients see — MJML compiled server-side with fixed mj-head injected, fonts and defaults applied; user can toggle between desktop and mobile preview widths
  2. User can download the finished newsletter as a standalone HTML file that renders correctly in Outlook and Gmail without any additional assets or inline processing
  3. Exported HTML is produced by injecting a fixed server-side mj-head before compile, preserving fonts, color defaults, and Outlook-safe spacing regardless of what individual blocks carry
  4. User can rename and delete newsletters from the list page
  5. The editor autosaves the user's work periodically while editing; user can view a list of previously saved versions of a newsletter and restore any of them

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Feasibility Spike (Editor Core) | 2/5 | In Progress|  |
| 2. Auth + DB + Image Foundation | 0/TBD | Not started | - |
| 3. Full Branded Block Library + Editor Configuration | 0/TBD | Not started | - |
| 4. Preview, Export, Library Polish & Extras | 0/TBD | Not started | - |
