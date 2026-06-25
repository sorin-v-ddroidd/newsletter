# Project Research Summary

**Project:** DDROIDD Newsletter Builder
**Domain:** Visual drag-and-drop MJML email builder — internal authoring tool (no ESP sending)
**Researched:** 2026-06-25
**Confidence:** HIGH (stack + pitfalls from primary sources; architecture from GrapesJS docs; features confirmed)

## Executive Summary

The DDROIDD Newsletter Builder is a GrapesJS + grapesjs-mjml web application that lets non-developers drag pre-built branded blocks onto a canvas, edit content inline, and export production-ready HTML for manual sending. All four research streams converge on a single root cause that shapes every major decision: **grapesjs-mjml does not model `mj-head`/`mj-attributes` and does not reliably round-trip hand-authored MJML.** This one architectural fact forces: (1) all branded sections must be re-authored as block definitions with every attribute inlined per element — import is off the table; (2) a fixed `mj-head` must be injected server-side before compile to supply font, color, and attribute defaults that cannot travel through the editor; (3) GrapesJS project JSON (`editor.getProjectData()`) is the canonical persisted state — MJML and compiled HTML are one-way output artifacts and must never be used as the reload source; and (4) the server-side MJML compiler must be pinned to mjml@4.18.0 (NOT v5) to match the mjml-browser@4 bundled inside grapesjs-mjml, preventing preview/export divergence.

The recommended version triple is **grapesjs@0.22.16 + grapesjs-mjml@1.0.8 + @grapesjs/react@2.0.0** with **mjml@4.18.0** on the server. This satisfies @grapesjs/react's peerDep of `^0.22.5` and uses the latest grapesjs-mjml release (maintained by the GrapesJS org author, low abandonment risk). The combination of grapesjs@0.22.x with grapesjs-mjml — which was tested against 0.21.x — is unverified at runtime. This is the project's single genuine technical unknown and must be resolved in a Phase 1 feasibility spike before any auth, database, or storage work begins. If 0.22.x proves incompatible, the documented fallback is grapesjs@0.21.2 with a direct mount (skipping @grapesjs/react).

The critical risk beyond version compatibility is brand fidelity. The existing `head.mjml` centralizes global defaults (color, font-family, line-height, `mj-spacer` Outlook workarounds) through `mj-attributes` — a mechanism the plugin does not support. Re-authoring blocks without embedding these defaults per element will produce emails with dark text on dark backgrounds (white text lost), wrong font families, and broken spacing in Outlook. The mitigation is a `BLOCK_DEFAULTS` constant shared across all block definition files, plus a server-side `mj-head` injection that acts as a safety net regardless of what individual blocks carry. Image upload must serve absolute public HTTPS URLs from day one — app-relative paths or auth-gated asset endpoints will break images in every email client.

## Key Findings

### Recommended Stack

The full stack is Node/Express on the backend with React + Vite on the frontend, connected over a plain REST API. grapesjs-mjml is the only mature OSS drag-and-drop MJML editor; all commercial alternatives (Unlayer, Beefree, Stripo) are proprietary SaaS with per-seat pricing. Version pinning is non-negotiable — the three-package compatibility triangle is fragile and the MJML server major version must match the browser-side bundled major version exactly. See `.planning/research/STACK.md` for full version matrix and install commands.

**Core technologies:**
- `grapesjs@0.22.16`: Canvas editor engine — satisfies @grapesjs/react peerDep `^0.22.5`; avoids 0.23.x which is outside that range
- `grapesjs-mjml@1.0.8`: MJML component model + browser-side compile — only OSS MJML drag-drop plugin; actively maintained by GrapesJS org author
- `@grapesjs/react@2.0.0`: Official React wrapper — handles editor lifecycle, React StrictMode, declarative UI; use `pluginsOpts: { 'grapesjs-mjml': {...} }` with a hardcoded string key (NOT a computed key `[grapesjsMjml]`) or blocks will silently fail to drop (issue #223)
- `mjml@4.18.0` (server): Server-side compile — must be v4 to match bundled `mjml-browser@4.18.0`; v5 has breaking changes that cause preview/export divergence
- `express@5.2.1`: HTTP server — v5 stable, built-in async error handling
- `prisma@7.8.0` + `pg@8.22.0`: ORM + PostgreSQL — JSONB column for project data, migration tooling; SQLite excluded (no concurrent writes, no JSONB)
- `multer@2.2.0`: Image upload handling — local disk for Phase 1; storage service abstracted for S3 migration later
- `jsonwebtoken@9.0.3` + `bcrypt@6.0.0`: Auth — JWT in httpOnly cookie; pre-seeded users table sufficient; no OAuth/SAML needed
- `vite@8.1.0` + `@vitejs/plugin-react@6.0.3`: Frontend build

**Do NOT use:** `grapesjs@0.23.x` (outside @grapesjs/react peerDep), `mjml@5.x` server-side (breaks preview/export parity), `editor.setComponents(mjmlString)` to reload (structural corruption), `[grapesjsMjml]` as pluginsOpts computed key (issue #223), `localStorage` for JWT (XSS-accessible).

### Expected Features

The editor's built-in features (drag-and-drop, inline text editing, undo/redo, desktop/mobile preview) are essentially free. The project effort lies in re-authoring branded blocks with constraints, wiring the backend (auth, DB, image storage), and configuring the editor to remove email-hostile escape hatches. See `.planning/research/FEATURES.md` for the full capability-ownership map.

**Must have for launch (P1):**
- GrapesJS + grapesjs-mjml canvas mounted in React app [BUILT-IN]
- DDROIDD branded block library (hero, projects, hiring, new colleagues, initiatives, disclaimer) re-authored as locked custom component definitions [APP — HIGH effort, #1 project risk]
- Content locking and guardrails per block (`removable`, `draggable`, `stylable`, `droppable`) — must ship alongside block authoring, not separately [APP config]
- Generic blocks (text, image, button, 1/2/3 columns, divider, spacer) [BUILT-IN]
- Image upload + asset library (storage backend required) [GJS-UI + BACKEND]
- Save/load newsletters via API + DB [GJS-UI + BACKEND]
- Newsletter list (create, open, duplicate) [APP]
- Export as standalone compiled HTML (download) [BUILT-IN compile + APP wrapper]
- Auth (login, session) [APP]
- Raw HTML surface disabled: exclude `mj-raw` block, disable `core:open-code` and MJML import panel [BUILT-IN config — one-line changes, but must be deliberate]
- Style Manager restricted to email-safe properties only [BUILT-IN config]

**Should have (P2, after core validated):**
- Autosave (debounced `editor.on('update', ...)` + remote endpoint)
- Constrained Style Manager per branded block (approved palette dropdowns, not free-form color wheel)
- Duplicate newsletter from list
- Version history (last N saves as JSON snapshots)

**Defer to v2+:** Merge tags, AI content assistance, role-based access, real-time co-editing

**Explicit anti-features:** ESP/direct sending (out of scope — export only), arbitrary MJML import of legacy hand-authored files (confirmed broken by 3 evidence sources), free-form raw HTML/CSS editor (bypasses MJML compilation safety)

### Architecture Approach

GrapesJS project JSON is the canonical persisted state; the MJML compile service is a stateless on-demand endpoint never called on save. The GrapesJS Integration Layer is the single module that holds and operates on the editor instance — no other React component calls `editor.*` directly. Block definitions are framework-agnostic TypeScript modules (pure data, no GrapesJS import). Project structure is an npm workspaces monorepo (`packages/client` + `packages/server`) in the existing repo. See `.planning/research/ARCHITECTURE.md` for full component diagram and data flows.

**Major components:**
1. **React Editor App** — Shell, routing, newsletter list; does not reach into GrapesJS internals
2. **GrapesJS Integration Layer** (`GjsEditor.tsx`) — single entry point for all `editor.*` calls; init, storage hooks, event routing
3. **Block Definitions Module** (`blocks/branded/` + `blocks/generic.ts`) — framework-agnostic TypeScript modules; one file per branded section mirroring `src/sections/*.mjml`
4. **API Server** (Express) — REST routes for newsletters CRUD, compile, image upload, asset library, auth
5. **MJML Compile Service** — stateless `mjml(string, options)` wrapper; injects fixed `mj-head` before compile; called on preview/export only, never on save
6. **DB Layer** (Prisma + PostgreSQL) — `newsletters.project_data JSONB` authoritative; `mjml_source` and `compiled_html` regenerable cache columns
7. **Image Upload / Storage Service** — always returns absolute public HTTPS URL; upload POST authenticated, asset GET publicly reachable
8. **Auth** — JWT in httpOnly cookie; bcrypt; `requireAuth` middleware on all non-public routes

**Key data flow:** Save = project JSON → DB (no compile). Load = DB JSON → `editor.loadProjectData()` (never re-parse MJML). Preview/Export = extract MJML → POST `/api/compile` → server injects mj-head → `mjml()` → HTML.

### Critical Pitfalls

1. **mj-attributes silently dropped** — Confirmed architectural limitation (3 evidence sources). Prevention: embed ALL `head.mjml` defaults inline on every element via shared `BLOCK_DEFAULTS` constant; inject fixed `mj-head` server-side as safety net. Recovery cost if missed: HIGH.
2. **Editor state vs. MJML source drift** — Saving MJML and reloading via `setComponents(mjmlString)` produces lossy round-trips; blocks degrade over edit cycles. Prevention: `project_data JSONB` is authoritative; load always via `editor.loadProjectData(json)`. Recovery cost if missed: no clean path.
3. **Custom block breaks on version update** — No declared peerDependency constraint. Prevention: pin both packages to exact versions (no `^`); add CI smoke test per block. Recovery: revert pins immediately.
4. **Email-hostile CSS via Style Manager** — Default Style Manager exposes flexbox, position, box-shadow — all broken in Outlook/Word rendering engine; passes browser preview. Prevention: replace default sectors with email-safe allowlist before any user testing.
5. **Image URLs breaking in email clients** — Auth-gated or relative-path URLs produce 403s when recipients open email. Prevention: upload POST authenticated; asset GET publicly reachable; always store/return absolute HTTPS URLs.
6. **Block type names changed without migration** — Renaming a registered component type invalidates all saved project JSON. Prevention: `schema_version` on every save; type names are a published contract; write DB migrations before any type rename.
7. **mj-head defaults drifting across block definitions** — Copy-paste per-block embedding produces inconsistent color/font values. Prevention: `BLOCK_DEFAULTS` TypeScript constant in `blocks/defaults.ts` referenced by every block.

## Implications for Roadmap

### Phase 1: Feasibility Spike (Editor Core) — HARD GATE

**Rationale:** grapesjs@0.22.16 + grapesjs-mjml@1.0.8 runtime compatibility is unverified (plugin tested against 0.21.x). Do not build auth, DB, or storage until this gate passes.

**Delivers:** Proof of editor viability — branded MJML blocks drag/drop correctly, round-trip persistence works, server compile produces client-safe HTML.

**Exit criteria (ALL must pass):**
1. GrapesJS + grapesjs-mjml mounts in React without errors on grapesjs@0.22.16
2. At least 2 branded blocks re-authored and draggable in editor
3. `getProjectData()` → localStorage → `loadProjectData()` produces identical canvas state
4. Server `mjml(mjmlString)` on exported MJML renders correctly in Outlook and Gmail
5. mj-attributes behavior confirmed experimentally

**Fallback:** grapesjs@0.21.2 + direct mount in `useEffect`, skipping @grapesjs/react

### Phase 2: Database + Auth + Image Upload Foundation

**Rationale:** Auth is a dependency for all persistence features. Schema design must precede the first saved newsletter (`schema_version`, JSON-primary pattern). Public-URL image pattern must be established before users add images.

**Delivers:** Full authenticated API (login/logout, newsletter CRUD, image upload with public absolute URLs), PostgreSQL schema with `project_data JSONB` authoritative, GrapesJS save/load wired to real API, asset library panel operational.

**Key constraint:** Upload POST authenticated; asset GET publicly reachable with no auth; always return absolute HTTPS URLs. Local disk satisfies this for Phase 2; storage service interface abstracted for later S3 swap.

### Phase 3: Full Branded Block Library + Editor Configuration

**Rationale:** Highest-effort task; requires Phase 2 persistence to test real round-trips. Content locking must ship with blocks — not separately.

**Delivers:** All branded block definitions with inline `BLOCK_DEFAULTS`, locking constraints per component, restricted Style Manager (email-safe allowlist), `mj-raw` excluded, code panel disabled.

**Block authoring standard:** `BLOCK_DEFAULTS` constant in `blocks/defaults.ts`; every `mj-text` carries explicit `color`, `font-family`, `line-height`, `font-size`; type names documented as published contract.

### Phase 4: Preview + Export + Polish + Newsletter List

**Rationale:** Export quality only validatable against full block set. Newsletter list UI polish deferred until core flows are stable.

**Delivers:** Server-side compile preview in sandboxed iframe, export/download as `.html`, mobile/desktop preview toggle, newsletter list page (list, create, duplicate, rename, delete), server-side `mj-head` injection before compile, end-to-end QA against Outlook/Gmail.

**Performance note:** `mjml()` is synchronous CPU-bound. For 5-15 internal users, acceptable. If simultaneous compile blocks event loop, move to `worker_threads` — Phase 4+ scope.

### Phase Ordering Rationale

- Phase 1 first: only technical unknown; failed editor invalidates all subsequent work
- Phase 2 before Phase 3: branded block round-trips need real DB persistence and auth to test fully
- Phase 3 before Phase 4: export quality requires full block set
- Compile service in Phase 1 (stateless, no auth) — unchanged through Phase 4
- Auth is Phase 2 dependency for newsletter list, save/load, and image upload

### Research Flags

**Needs research (use `--research-phase`):**
- **Phase 1:** Runtime compatibility grapesjs@0.22.16 + grapesjs-mjml@1.0.8 — the spike is the research; plan with explicit exit criteria

**Standard patterns (skip `--research-phase`):**
- **Phase 2:** Auth (JWT + bcrypt), PostgreSQL schema, image upload with multer
- **Phase 3:** Block authoring via GrapesJS BlockManager API — effort is content authoring
- **Phase 4:** Compile endpoint, preview iframe, HTML download, newsletter list CRUD

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry metadata verified June 2026; one runtime gap documented (Phase 1 spike) |
| Features | HIGH | GrapesJS/grapesjs-mjml docs via Context7; capability-ownership map verified |
| Architecture | HIGH | GrapesJS Storage Manager docs, @grapesjs/react README — primary sources |
| Pitfalls | HIGH | Pitfalls 1+2 from GitHub issues #35, #194, #388 + Mautic moderator (3 sources) |

**Overall confidence:** HIGH

### Gaps to Address

- **grapesjs@0.22.16 + grapesjs-mjml@1.0.8 runtime behavior:** Only gap with HIGH consequence. Documented fallback exists. Resolve in Phase 1 spike.
- **@grapesjs/react GjsEditor exact prop API:** Confirm against `github.com/GrapesJS/react` README before first use in Phase 1.
- **grapesjs-mjml issue #207 — custom fonts dropped from export:** Server-side `mj-head` injection is the workaround. Validate in Phase 1 spike.
- **background-url on mj-section:** Not exposed as a panel trait. If any branded section needs background images, add a custom trait. Assess in Phase 1 against actual `src/sections/*.mjml`.
- **mj-social / mj-navbar blocks:** Plugin-supported but experimental with limited client coverage. Evaluate in Phase 3.

---
*Research completed: 2026-06-25*
*Ready for roadmap: yes*
