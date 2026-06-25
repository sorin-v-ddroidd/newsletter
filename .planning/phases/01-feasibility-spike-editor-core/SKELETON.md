# Walking Skeleton — DDROIDD Newsletter Builder

**Phase:** 1
**Generated:** 2026-06-25

## Capability Proven End-to-End

A developer can mount the GrapesJS + grapesjs-mjml editor in a React/Vite app, drag a DDROIDD-branded block onto the canvas, save the canvas to localStorage and reload it byte-identically, then extract the MJML, POST it to an Express endpoint, and receive client-safe HTML compiled by `mjml@4.18.0`.

This is the smallest slice that exercises the full stack — editor → persistence → server compile — and resolves the project's #1 risk: whether the locked version triple is runtime-compatible.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Repo layout | Monorepo: new code under `/app`; existing `src/` MJML stays as re-author reference | D-02 — one repo to clone; branded section sources sit next to derived blocks |
| Internal layout | `app/client/` (Vite + React) and `app/server/` (Express); root `app/package.json` orchestrates `dev:client` / `dev:server` / `dev` | D-03 — planner discretion; clean client/server split enables parallel Wave-1 work and zero file overlap |
| Editor | GrapesJS `0.22.16` + grapesjs-mjml `1.0.8` + @grapesjs/react `2.0.0` | Locked stack; only OSS drag-drop MJML editor; version triple verified against peerDeps |
| Editor mount | `@grapesjs/react` `GjsEditor`; `pluginsOpts` keyed by the hardcoded string `'grapesjs-mjml'`; `storageManager: false` | Computed key triggers issue #223 (blocks undroppable). Manual localStorage persistence this phase. |
| Mount fallback | If the triple fails at runtime: `grapesjs@0.21.2` + direct `grapesjs.init()` in `useEffect`, drop `@grapesjs/react` | Documented in STATE.md / CLAUDE.md; block definitions + compile endpoint unaffected |
| Data layer | Browser `localStorage` via `editor.getProjectData()` / `editor.loadProjectData()`; key `ddroidd_newsletter_draft` | No server DB in Phase 1 (deferred to Phase 2). Project JSON is canonical persisted state — never reload from MJML string. |
| Branded blocks | hero + projects, re-authored as grapesjs-mjml block definitions (NOT imported from hand-authored MJML); all defaults inlined per element via shared `BLOCK_DEFAULTS` | D-04 — import round-trip is confirmed lossy. `mj-attributes` is broken in the plugin, so defaults must be inlined. |
| Server compile | Express `5.2.1` + `mjml@4.18.0` (exact, matches bundled `mjml-browser@4`); `POST /api/compile`; conditional `<mjml>` wrap robust to either `getHtml()` shape | v5 breaks preview/export parity. `getHtml()` return shape is LOW confidence — wrap conditionally. |
| Compile-endpoint security | `express.json({ limit: '1mb' })`; CORS restricted to `http://localhost:5173` | T-01-01 (DoS via oversized body), T-01-02 (open CORS). No auth/DB/users this phase. |
| Client-render verification | Reuse `QuickEmailTest.ps1` (Outlook) + `EmailTester.ps1` (Gmail send) | D-05 — Windows-only dev gate acceptable. **BLOCKED on this dev machine** (new Outlook Store app has no COM); requires a machine with classic Outlook. |
| Language | TypeScript strict mode end-to-end; `tsx` runs the Express server in dev | One language across client + server; reuses existing npm tooling |

## Stack Touched in Phase 1

- [x] Project scaffold — `app/client` (Vite + React + TS) and `app/server` (Express + TS), root orchestrating package.json, lint/build configured
- [x] Routing — `POST /api/compile` (the one real server route)
- [x] Persistence — one real write (`getProjectData()` → localStorage) AND one real read (`loadProjectData()` ← localStorage), byte-identical round-trip
- [x] UI wired to API — editor `getHtml()` → `fetch POST /api/compile` → HTML returned and written to file
- [x] Deployment — documented local full-stack run: `npm run dev` in `/app` starts Vite (:5173) + Express (:3000) concurrently

## Out of Scope (Deferred to Later Slices)

Explicitly NOT in the skeleton — prevents later phases from re-litigating Phase 1's minimalism:

- Authentication, login/logout, httpOnly session cookies (Phase 2)
- PostgreSQL / Drizzle / any server-side DB persistence (Phase 2)
- Server-side save/load API (Phase 2 — localStorage only here)
- Image upload, asset library, public HTTPS asset URLs (Phase 2)
- The full 6-block branded library — only hero + projects are built here (Phase 3)
- Style Manager restriction, brand-palette-constrained pickers, locking constraints, raw-HTML removal (Phase 3)
- Server-compiled preview UI, desktop/mobile toggle, HTML download, mj-head injection (Phase 4)
- Newsletter list CRUD, autosave, version history (Phase 4)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2:** Auth + PostgreSQL schema (project_data JSONB authoritative) + save/load wired to real API + image upload with public HTTPS URLs + asset library
- **Phase 3:** All 6 branded blocks re-authored with BLOCK_DEFAULTS + locking constraints + email-safe Style Manager allowlist + brand palette + raw-HTML escape hatches removed
- **Phase 4:** Server-compiled preview (desktop/mobile) + HTML download + server-side mj-head injection + newsletter list polish + autosave + version history
