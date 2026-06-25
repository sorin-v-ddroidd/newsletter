# Requirements: DDROIDD Newsletter Builder

**Defined:** 2026-06-25
**Core Value:** A non-developer can build and export a complete, on-brand, client-safe newsletter end-to-end without touching code or asking a developer.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Editor (EDIT)

- [ ] **EDIT-01**: User can drag content blocks from a panel onto a canvas to assemble an email
- [ ] **EDIT-02**: User can reorder, nest, and delete blocks on the canvas via drag-and-drop
- [ ] **EDIT-03**: User can edit text inline directly on the canvas (headings, body, links)
- [ ] **EDIT-04**: User can undo and redo their edits
- [ ] **EDIT-05**: User can place generic blocks (text, image, button, 1/2/3-column, divider, spacer)
- [ ] **EDIT-06**: User can only style blocks using an email-safe, restricted set of controls (no flexbox/position/box-shadow that break in Outlook)
- [ ] **EDIT-07**: User cannot reach a raw HTML/code editor (mj-raw block and code panel are removed)
- [ ] **EDIT-08**: User can pick colors and fonts only from an approved brand palette (constrained pickers, not free-form)

### Branded Blocks (BLOCK)

- [ ] **BLOCK-01**: User can drag pre-built DDROIDD branded section blocks (hero, projects, hiring, new colleagues, initiatives, disclaimer) onto the canvas
- [ ] **BLOCK-02**: Branded blocks render on-brand by default (correct colors, fonts, spacing) with all defaults inlined per element — no reliance on mj-attributes
- [ ] **BLOCK-03**: Branded blocks enforce structural guardrails (locked layout/structure; only intended content is editable, removable, or movable)

### Authentication (AUTH)

- [ ] **AUTH-01**: User can log in with a username/email and password (internal team accounts, no public signup)
- [ ] **AUTH-02**: User session persists across browser refresh and is stored securely (httpOnly cookie)
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Unauthenticated users cannot access the editor or newsletter data

### Persistence & Library (SAVE)

- [ ] **SAVE-01**: User can save a newsletter to the server, persisting GrapesJS project JSON as the canonical state
- [ ] **SAVE-02**: User can open a saved newsletter and resume editing with full fidelity (loaded from project JSON, never re-parsed from MJML)
- [ ] **SAVE-03**: User can see a list of all saved newsletters
- [ ] **SAVE-04**: User can create a new newsletter and duplicate an existing one as a starting point
- [ ] **SAVE-05**: User can rename and delete newsletters
- [ ] **SAVE-06**: The editor autosaves the user's work periodically while editing (debounced)
- [ ] **SAVE-07**: User can view previous saved versions of a newsletter and restore one

### Images & Assets (IMG)

- [ ] **IMG-01**: User can upload an image, which is stored server-side and served from an absolute, public, unauthenticated HTTPS URL
- [ ] **IMG-02**: User can pick images from a curated asset library
- [ ] **IMG-03**: User can insert uploaded or library images into image blocks on the canvas

### Preview & Export (EXPORT)

- [ ] **EXPORT-01**: User can preview the compiled email (MJML compiled server-side to client-safe HTML)
- [ ] **EXPORT-02**: User can toggle desktop and mobile preview widths
- [ ] **EXPORT-03**: User can export/download the finished newsletter as a standalone HTML file
- [ ] **EXPORT-04**: Exported HTML is produced by injecting a fixed server-side mj-head before compile, preserving fonts/defaults and client-safe rendering

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Personalization (PERS)

- **PERS-01**: User can insert merge tags / personalization placeholders that survive export

### Collaboration & Access (COLLAB)

- **COLLAB-01**: Role-based access control (editor vs admin)
- **COLLAB-02**: Real-time co-editing of a newsletter

### Assistance (AI)

- **AI-01**: AI-assisted content drafting within blocks

### Storage (STORE)

- **STORE-01**: Image storage backed by S3-compatible object storage (v1 uses local disk behind an abstracted storage interface)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| ESP / direct sending (SendGrid, Mailgun, SMTP) | Export HTML only this milestone; sending stays external/manual. Decouples builder from delivery. |
| Outlook COM PowerShell send/preview scripts as product features | Superseded by the builder; may remain in repo for ad-hoc dev use only |
| Public multi-tenant signup / org isolation | Internal team tool only — simpler auth |
| Subscriber/contact-list management, campaigns, scheduling, analytics | This is an authoring tool, not a full ESP |
| Arbitrary MJML import of legacy hand-authored files into the editor | grapesjs-mjml cannot reliably round-trip hand-authored MJML (confirmed by 3 evidence sources); branded sections are re-authored as blocks instead |
| Free-form raw HTML/CSS editing | Bypasses MJML compilation safety; breaks the non-dev guardrail model |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (to be filled by roadmapper) | — | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 28 ⚠️

---
*Requirements defined: 2026-06-25*
*Last updated: 2026-06-25 after initial definition*
