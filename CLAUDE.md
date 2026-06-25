# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An MJML-based responsive HTML email template ("DDROIDD Digest" newsletter). MJML sources in `src/` compile to a single HTML file in `dist/index.html`, which is then sent/previewed through Outlook via PowerShell scripts for client-rendering tests.

## Commands

```bash
npm install              # install mjml + dev tooling

npm run build-pages      # compile src/pages/**/**.mjml -> dist/  (use this one)
npm run build            # compile only src/pages/*.mjml -> dist/index.html (single-level glob; misses nested pages)
npm run watch-pages      # recompile pages on change
npm run dev              # nodemon watch + browser-sync live preview on http://localhost:8080
```

`npm test` is a placeholder (no test suite). "Testing" here means rendering the email in real clients.

### Email client testing (Windows + Outlook COM)

```powershell
# Preview compiled HTML in an Outlook draft (does not send):
.\QuickEmailTest.ps1 -HtmlFilePath dist\index.html -PreviewOnly

# Send a test:
.\EmailTester.ps1 -HtmlFilePath dist\index.html -TestEmails you@example.com -Subject "Digest" -Debug
```

Both scripts drive a local Outlook install through the `Outlook.Application` COM object, so they only work on a Windows machine with Outlook installed. `test.eml` is a captured raw email for reference; `history/` holds prior sends.

## Architecture

Composition is via MJML `<mj-include>`, not a build-time templating system. The render pipeline is:

`src/pages/index.mjml` (the page entry) → includes `src/components/head.mjml` (global `<mj-head>`: title, fonts, `mj-attributes` defaults, `<mj-style>`) → then includes ordered section files from `src/sections/` inside `<mj-body>`.

To change the newsletter's content/order, edit `src/pages/index.mjml`'s include list and the individual section files. Each `src/sections/*.mjml` is a self-contained `<mj-section>` block and is the unit of reuse/customization.

Important: not every file in `src/sections/` is wired into `index.mjml` — only the ones listed in its include block render. Files like `benefits.mjml`, `grades.mjml`, `company.mjml`, `your-opinion-matters.mjml`, and `sections/obsolete/` exist but are inactive unless added to a page. Check `index.mjml` to see what actually ships.

Global text color/line-height/font defaults live in `head.mjml` (`mj-attributes`); override per-element in sections rather than there unless the change is intended site-wide. Default text color is white (`#ffffff`), so section background colors matter for legibility.

Images are referenced from `assets/` (hero, placeholders, team photos, signature).

## Email-client rendering constraints

This is the core domain knowledge — emails must survive inconsistent client renderers (see README for the full list):
- **Outlook**: ignores some padding/margin; use `mj-spacer` for spacing. No background images on `div` — put `background-url` on `mj-section`.
- **Gmail**: strips `<style>` tags → inline CSS for anything critical. Web fonts unreliable → always set `font-family` fallbacks (already done in `head.mjml`).
- **Yahoo**: may ignore media queries → don't rely on them alone.

Lean on MJML's built-in responsiveness; treat the above as fallbacks. Verify changes by recompiling and previewing in an actual client, not just a browser.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**DDROIDD Newsletter Builder**

A visual, drag-and-drop newsletter builder (Mailchimp / ActiveCampaign style) for the DDROIDD team. Non-developers assemble on-brand emails by dragging pre-built blocks onto a canvas, editing content inline, and exporting production-ready HTML — no developer in the loop. It is a web app built around the GrapesJS editor with the grapesjs-mjml plugin, reusing the existing `mjml` compile pipeline so output keeps surviving the same email clients today's templates target.

This replaces the current workflow where a developer hand-edits `src/sections/*.mjml`, compiles with `npm run build-pages`, and previews/sends through Outlook COM PowerShell scripts.

**Core Value:** A non-developer can build and export a complete, on-brand, client-safe newsletter end-to-end without touching code or asking a developer.

### Constraints

- **Tech stack**: Node + React, Express backend, server-side MJML compile via the `mjml` npm lib — one language end-to-end, reuses existing npm tooling. (User decision.)
- **Editor**: GrapesJS + grapesjs-mjml plugin — outputs MJML/HTML, the only mature OSS drag-drop editor that targets MJML. (User decision.)
- **Persistence**: database, server-side storage, login. Internal team tool — no public signup.
- **Sending**: export HTML only; no ESP integration this milestone.
- **Brand fidelity**: exported emails must render correctly across Outlook / Gmail / Yahoo, matching the quality of current hand-authored templates.
- **Platform note**: existing dev/test tooling (Outlook COM scripts) is Windows-only; the new builder should be OS-independent (web app).
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## PRIMARY: grapesjs-mjml Deep Assessment
### Supported MJML Components (verified from README + source)
| Component | Supported | Editable Attributes | Notes |
|-----------|-----------|---------------------|-------|
| `mj-section` | YES | background-color, padding | `background-url` is NOT a trait in the panel (must be set manually in MJML source or a custom trait added) |
| `mj-column` | YES | width, padding, background-color | |
| `mj-text` | YES | color, font-size, font-family, line-height, align | Core inline editing works |
| `mj-image` | YES | src, width, align, href | `fluid-on-mobile` not exposed as a panel trait |
| `mj-button` | YES | href, background-color, color, font-size | |
| `mj-divider` | YES | border-width, border-style, border-color | |
| `mj-spacer` | YES | height | |
| `mj-social` + `mj-social-element` | YES | href, src, alt | |
| `mj-wrapper` | YES | background-color, padding | |
| `mj-group` | YES | | Column grouping |
| `mj-hero` | YES | | Experimental in MJML; limited client support |
| `mj-navbar` + `mj-navbar-link` | YES | | Experimental; limited client support |
| `mj-raw` | YES (partial) | | Renders raw HTML; position attribute handled; NOT editable via UI traits |
| `mj-style` | PARTIAL | | Present in head management, but global `<mj-style>` with class rules is not user-editable via the panel |
| `mj-font` | YES | name, href | Registered in head |
| `mj-head` | STRUCTURAL | | Managed by the plugin internally; not user-draggable |
| `mj-body` | STRUCTURAL | background-color, width | Root container; not draggable |
| `mj-include` | **NO** | — | Compile-time directive; the canvas operates on flat MJML; includes have no runtime representation and will not survive import |
| `mj-attributes` | **NO** | — | Confirmed broken: importing MJML with `mj-attributes` corrupts the `mj-head` position (places it inside `mj-body`). Not editable via panel. |
| `mj-class` | **NO** | — | No panel support; would require `mj-attributes` infrastructure |
| `css-class` attribute | PARTIAL | — | The `css-class` attribute is part of MJML spec and passes through compilation, but grapesjs-mjml does not expose it as an editable trait in the style panel |
- `background-url` on `mj-section` (used for background images): not a standard panel trait; must be added as a custom trait or baked into block content strings
- `fluid-on-mobile` on `mj-image` (used in `hero.mjml`): not exposed as panel trait
- `css-class` (used on the tracking pixel `mj-image`): passes through MJML compile but not editable in panel
- The `.tracking-pixel { display: none }` CSS rule in `mj-style`: the rule passes through if content is pre-authored in blocks, but is not user-editable via a panel widget
### Import vs. Re-author Verdict
### Custom Block Authoring Pattern
- Attributes that `mj-attributes` would normally apply globally must be inlined per element (since `mj-attributes` is not supported). Example: `font-family`, `color`, `line-height`, `font-size` must be on every `mj-text`.
- Use `background-color` (CSS-style) not `background-url` for section backgrounds in the initial block pass. If `background-url` is needed, add it as a custom trait on the `mj-section` component type.
- Do not include `mj-include`, `mj-attributes`, or `mj-style` inside block content strings — they will fail silently or corrupt the canvas.
- The `.tracking-pixel` CSS-class image should be implemented as a block whose `mj-image` has `width="1px"` and `height="1px"` hardcoded, since `css-class` is not panel-editable.
### Maintenance Status and Abandonment Risk
| Signal | Value |
|--------|-------|
| Latest version | 1.0.8 (March 2026) |
| Prior version | 1.0.7 (July 2025) |
| Maintainer | @artf (GrapesJS author — same person maintains core) |
| Maintained by | GrapesJS org, not a third-party plugin |
| GrapesJS core latest | 0.23.2 (June 2026) |
| Total versions | 47 (active release cadence since 2017) |
### Version Compatibility Triangle (Critical)
- `^0.22.5` for 0.x packages means `>=0.22.5 <0.23.0`. GrapesJS 0.23.2 does NOT satisfy this.
- `^0.21.2` means `>=0.21.2 <0.22.0`. GrapesJS 0.22.x or 0.23.x does NOT satisfy this.
- These two declared ranges are completely disjoint — no single version can satisfy both simultaneously.
| Package | Pinned Version | Rationale |
|---------|---------------|-----------|
| `grapesjs` | `0.22.16` | Latest in the `^0.22.x` family; satisfies `@grapesjs/react@2.0.0` peerDep `^0.22.5`; avoids 0.23.x which is beyond `@grapesjs/react`'s stated peer range |
| `grapesjs-mjml` | `1.0.8` | Latest; no enforced version constraint against GrapesJS version |
| `@grapesjs/react` | `2.0.0` | Latest; peerDep satisfied by grapesjs@0.22.16 |
| `mjml` (server) | `4.18.0` | Match the browser-side `mjml-browser@4.18.0` that grapesjs-mjml bundles, ensuring preview === server output |
### @grapesjs/react vs Direct Mount
- Save: `editor.getProjectData()` → POST to `/api/newsletters/:id` → store as JSONB in DB
- Load: GET → `editor.loadProjectData(json)` → editor restores component tree
- Export HTML: POST MJML to `/api/compile` → returns server-compiled HTML via `mjml@4.18.0`
- Extract MJML source for server compile: `editor.getHtml()` returns the MJML string from the canvas
## Recommended Stack
### Core Technologies
| Technology | Pinned Version | Purpose | Why Recommended |
|------------|---------------|---------|-----------------|
| `grapesjs` | `0.22.16` | Canvas editor engine | Satisfies `@grapesjs/react@2.0.0` peerDep; closest match to grapesjs-mjml tested range |
| `grapesjs-mjml` | `1.0.8` | MJML component model + browser compile | Only mature OSS MJML editor plugin; actively maintained by GrapesJS org |
| `@grapesjs/react` | `2.0.0` | React wrapper for GrapesJS | Official wrapper; handles lifecycle, strict mode, declarative UI |
| `mjml` (server) | `4.18.0` | Server-side MJML→HTML compile | Must match browser mjml-browser v4 for preview/export parity |
| `react` | `19.2.7` | UI framework | Latest stable; supported by @grapesjs/react peerDep |
| `react-dom` | `19.2.7` | DOM rendering | Matches React version |
| `express` | `5.2.1` | HTTP server | v5 stable as of June 2026; async error handling built-in; no need for express-async-errors wrapper |
| `drizzle-orm` | `0.45.2` | ORM + queries | TypeScript-native, SQL-first; types inferred directly from the schema, no codegen step and no generated client to commit; works with PostgreSQL JSONB |
| `drizzle-kit` | `0.31.10` | Migration generation + CLI | `drizzle-kit generate` / `migrate`; dev dependency |
| `pg` | `8.22.0` | PostgreSQL driver | `drizzle-orm/node-postgres` driver; satisfies drizzle-orm peer `pg >=8` |
| `vite` | `8.1.0` | Frontend build tool | Fastest HMR; native ESM; first-class React support |
| `@vitejs/plugin-react` | `6.0.3` | Vite React plugin | Fast Refresh; Babel transform |
### Database
### Auth
| Package | Pinned Version | Purpose |
|---------|---------------|---------|
| `jsonwebtoken` | `9.0.3` | Sign/verify JWTs |
| `bcrypt` | `6.0.0` | Password hashing |
### Image Storage
| Package | Pinned Version | Purpose |
|---------|---------------|---------|
| `multer` | `2.2.0` | Multipart form handling for uploads |
| `sharp` | `0.35.2` | Image resize/optimization before storage |
### Supporting Libraries
| Library | Pinned Version | Purpose | When to Use |
|---------|---------------|---------|-------------|
| `dotenv` | `17.4.2` | Environment variable loading | Always |
| `cors` | `2.8.6` | CORS middleware for Express | Always (Vite dev server at :5173, API at :3000) |
| `helmet` | `8.2.0` | HTTP security headers | Always in Express |
| `zod` | `4.4.3` | Request validation | API route validation |
| `@aws-sdk/client-s3` | `3.x` | S3-compatible image storage | Phase 2+ if moving off local disk |
| `multer-s3` | `3.0.1` | multer storage adapter for S3 | Same: Phase 2+ |
### Development Tools
| Tool | Pinned Version | Purpose | Notes |
|------|---------------|---------|-------|
| `tsx` | `4.22.4` | Run TypeScript Node files directly | Replaces ts-node; uses esbuild internally |
| `nodemon` | latest | Restart server on file changes | Dev only |
| `eslint` + `typescript-eslint` | latest | Linting | Enforce type safety |
| TypeScript | `5.x` | Type safety end-to-end | Use strict mode |
| `drizzle-kit` | `0.31.10` | Migration tooling | Generates SQL migrations from the TS schema; commit the migration files |
## Installation
# Frontend (in /client or monorepo root)
# Backend
# Dev
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Editor | grapesjs-mjml | Unlayer, Stripo, Beefree | All proprietary SaaS with per-seat pricing and no self-hosting; grapesjs-mjml is the only OSS drag-drop MJML editor |
| Editor | grapesjs-mjml | Build custom editor from scratch | 6-12 months of work minimum; grapesjs-mjml gives drag-drop, component model, and browser preview in days |
| React wrapper | @grapesjs/react | Direct grapesjs.init() in useEffect | Direct mount works but requires manual lifecycle management; @grapesjs/react is the official solution and handles strict mode correctly; if grapesjs@0.22.x proves incompatible, fall back to direct mount with grapesjs@0.21.2 |
| ORM | Drizzle | Prisma | Prisma adds a codegen step, a separate schema DSL, and a generated client to commit/keep in sync; Drizzle is TypeScript-native, SQL-first, lighter, with types inferred directly from the schema and migrations via `drizzle-kit`. (User decision — switched from Prisma.) |
| ORM | Drizzle | Raw pg/SQL | Raw SQL is viable but has no type inference or migration tooling; Drizzle stays close to SQL while adding both |
| DB | PostgreSQL | SQLite | No concurrent writes; no JSONB; not appropriate for multi-user web app |
| Server | Express v5 | Fastify | Fastify is faster; Express is the standard for existing GrapesJS/MJML tutorials; performance irrelevant at internal-tool scale |
| Compiler | mjml@4.18.0 | mjml@5.x | v5 has breaking changes (skeleton, minification, include security); grapesjs-mjml bundles mjml-browser@^4.18.0 — mismatching major versions causes preview/export divergence |
| Image storage | Local disk + multer | AWS S3 from day 1 | Unnecessary complexity for Phase 1 internal tool; add S3 in Phase 2 if needed |
| Auth | JWT + bcrypt | NextAuth, Passport | Over-engineered for a 5-10 person internal team with pre-seeded users |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `grapesjs@0.23.x` | Outside `@grapesjs/react@2.0.0` peerDep range (`^0.22.5`); untested combination | `grapesjs@0.22.16` |
| `mjml@5.x` on the server | Breaking changes vs browser `mjml-browser@4.18.0`; preview and export HTML will diverge | `mjml@4.18.0` |
| Loading hand-authored MJML into the editor via `setComponents()` | Structural corruption on `mj-head`/`mj-attributes`; empty output on re-save; `mj-include` cannot resolve | Re-author sections as block definitions |
| `editor.setComponents(htmlString)` with compiled HTML | Round-trip from compiled HTML → editor is not supported; loses all component structure | Load via `editor.loadProjectData(json)` |
| `[grapesjsMjml]` as pluginsOpts key (computed key) | Causes "blocks can't be dropped" bug (issue #223) | Use hardcoded string `'grapesjs-mjml'` as the key |
| `localStorage` for JWT | XSS-accessible | httpOnly cookie |
| SQLite | No concurrent writes; no JSONB | PostgreSQL |
| `grapesjs-react` (old package, npm name without @scope) | Deprecated; maintenance stopped | `@grapesjs/react@2.0.0` (official, scoped package) |
## Version Compatibility Matrix
| Package | Must be Compatible With | Verified | Status |
|---------|------------------------|---------|--------|
| `grapesjs@0.22.16` | `@grapesjs/react@2.0.0` peerDep `^0.22.5` | ✓ semver satisfies | Confirmed (install-time) |
| `grapesjs@0.22.16` | `grapesjs-mjml@1.0.8` (no peerDep declared) | ✓ no install conflict | Runtime unverified — plugin tested against 0.21.x; verify in Phase-1 spike |
| `grapesjs-mjml@1.0.8` | `mjml-browser@^4.18.0` (bundled dep) | ✓ 4.18.0 bundled | Confirmed |
| `mjml@4.18.0` (server) | `mjml-browser@4.18.0` (client preview) | ✓ same major/minor | Recommended parity; prevents preview/export divergence |
| `react@19.x` | `@grapesjs/react@2.0.0` peerDep `^18\|\|^19` | ✓ semver satisfies | Confirmed |
| `express@5.2.1` | Node.js LTS 20+ | ✓ | Confirmed |
| `drizzle-orm@0.45.2` (node-postgres) | `pg@8.22.0` | ✓ peer `pg >=8` satisfied | Verified June 2026 |
## Confidence Assessment
| Area | Confidence | Basis |
|------|------------|-------|
| Version pinning (all packages) | HIGH | npm registry metadata verified June 2026 |
| grapesjs-mjml component support matrix | MEDIUM | README + source inspection via unpkg; attribute panel behavior (background-url, fluid-on-mobile) inferred rather than directly tested in a running editor |
| Import/reauthor verdict | HIGH | Direct evidence: GitHub issue #35 (mj-head corruption), Mautic forum moderator confirmation, architectural analysis of mj-include (compile-time directive), issue #194 (empty re-save) |
| Custom block pattern | HIGH | Standard GrapesJS Blocks API; pattern confirmed from issue #250 and community examples |
| pluginsOpts string-key requirement | HIGH | gjs.market guide explicit warning; issue #223 describes exact broken behavior |
| grapesjs@0.22.x + grapesjs-mjml runtime compatibility | MEDIUM | No peerDep conflict (confirmed); no reported issues in tracker; API stability likely but unverified at runtime — Phase-1 spike is required |
| Maintenance/abandonment risk | HIGH | npm publish history; maintained by GrapesJS org author |
| Backend stack | HIGH | Standard Node.js ecosystem; Express v5 stable; Drizzle pinned `drizzle-orm@0.45.2` / `drizzle-kit@0.31.10` (npm registry, verified June 2026) |
## Sources
- npm registry (verified June 2026): `grapesjs`, `grapesjs-mjml`, `@grapesjs/react`, `mjml`, `mjml-browser`, `express`, `pg`, `jsonwebtoken`, `bcrypt`, `multer`, `cors`, `helmet`, `zod`, `dotenv`, `tsx`, `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10` — version metadata, publish dates, peer/dep ranges. (`drizzle-orm`/`drizzle-kit` replaced `prisma`; drizzle-orm peer `pg >=8` satisfied by `pg@8.22.0`.)
- GitHub GrapesJS/mjml README (via unpkg app.unpkg.com): supported component list, plugin options, `customComponents` API
- GitHub GrapesJS/mjml issue #35: `mj-head`/`mj-attributes` import corruption — confirmed broken
- GitHub GrapesJS/mjml issue #194: round-trip save/load failure with `setComponents(html)` — confirmed broken
- GitHub GrapesJS/mjml issue #223: computed-key `[grapesjsMjml]` in pluginsOpts causes block drop failure
- GitHub GrapesJS/mjml issue #388: wrong rendering on MJML import
- Mautic forum (forum.mautic.org): moderator-confirmed `mj-attributes` architectural limitation
- gjs.market GrapesJS + React + Next.js guide: `@grapesjs/react` integration pattern, hardcoded-string-key requirement, GrapesJS >=0.22.x requirement
- WebSearch: MJML v5 breaking changes (skeleton, minification, include security changes from v4)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
