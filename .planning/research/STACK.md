# Stack Research

**Domain:** Drag-and-drop MJML newsletter builder (web app)
**Researched:** 2026-06-25
**Confidence:** HIGH for versions/compatibility; MEDIUM for grapesjs-mjml support matrix detail; HIGH for import/reauthor verdict

---

## PRIMARY: grapesjs-mjml Deep Assessment

### Supported MJML Components (verified from README + source)

The plugin registers these component types as first-class GrapesJS model objects:

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

**Key omissions relevant to the existing repo:**
- `background-url` on `mj-section` (used for background images): not a standard panel trait; must be added as a custom trait or baked into block content strings
- `fluid-on-mobile` on `mj-image` (used in `hero.mjml`): not exposed as panel trait
- `css-class` (used on the tracking pixel `mj-image`): passes through MJML compile but not editable in panel
- The `.tracking-pixel { display: none }` CSS rule in `mj-style`: the rule passes through if content is pre-authored in blocks, but is not user-editable via a panel widget

---

### Import vs. Re-author Verdict

**VERDICT: Re-author. Do NOT attempt to import hand-authored MJML. CONFIDENCE: HIGH.**

Evidence:

1. **`mj-include` is a compile-time filesystem directive.** The editor operates on flat MJML in memory. There is no mechanism for `mj-include` to resolve at editor load time — it simply does not exist in the canvas model. `index.mjml` with 7 includes cannot be loaded at all in this sense.

2. **`mj-attributes` import is confirmed broken.** A known GitHub issue (#35) documents that importing MJML containing `mj-head`/`mj-attributes` produces structural corruption: `mj-head` gets repositioned inside `mj-body`. The plugin's internal parser does not correctly reconstruct the head section from arbitrary MJML. A Mautic forum moderator (a production deployment of grapesjs-mjml) confirmed: *"mj-attributes does not work, and I understand that's an architectural limitation."*

3. **Round-trip is the wrong mental model.** The plugin's storage model is `editor.getProjectData()` (GrapesJS component JSON), not MJML source. Saving MJML text and re-loading it into the editor loses component type metadata and produces an empty document on re-edit (documented in issue #194). The correct persistence format is the GrapesJS project JSON, with MJML generated at export time.

4. **`mj-style`/global CSS is not imported.** The `head.mjml` global defaults (`mj-attributes` defaults for color, font-size, line-height; the `.tracking-pixel` `mj-style` rule) have no import path. These must be rebuilt into block definitions or into the plugin's `mjmlParser` configuration.

**Implication for roadmap:** Every branded section must be re-authored as a block definition with content: `<mj-section>...</mj-section>` MJML strings, where the MJML contains hardcoded values (no reliance on `mj-attributes` inheritance). Phase 1 is a "re-author every block" task, not a "wire up import." This is already documented in `PROJECT.md` Key Decisions. This research confirms that decision is correct.

---

### Custom Block Authoring Pattern

Custom blocks in grapesjs-mjml are standard GrapesJS blocks whose `content` is an MJML string. The plugin's component model parses that string when the block is dropped onto the canvas.

**Minimal example — Hero section block:**

```javascript
// After editor is initialized with grapesjs-mjml plugin:
editor.Blocks.add('ddroidd-hero', {
  label: 'DDROIDD Hero',
  category: 'DDROIDD Branded',
  attributes: { class: 'fa fa-image' }, // icon
  content: `
    <mj-section background-color="#0B1624">
      <mj-column>
        <mj-image
          src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
          width="600px"
        />
        <mj-text
          font-family="Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif"
          font-size="16px"
          line-height="20px"
          color="#ffffff"
        >
          <p>Edit your intro text here.</p>
        </mj-text>
      </mj-column>
    </mj-section>
  `,
});
```

**Key rules for block content strings:**
- Attributes that `mj-attributes` would normally apply globally must be inlined per element (since `mj-attributes` is not supported). Example: `font-family`, `color`, `line-height`, `font-size` must be on every `mj-text`.
- Use `background-color` (CSS-style) not `background-url` for section backgrounds in the initial block pass. If `background-url` is needed, add it as a custom trait on the `mj-section` component type.
- Do not include `mj-include`, `mj-attributes`, or `mj-style` inside block content strings — they will fail silently or corrupt the canvas.
- The `.tracking-pixel` CSS-class image should be implemented as a block whose `mj-image` has `width="1px"` and `height="1px"` hardcoded, since `css-class` is not panel-editable.

**Block category grouping pattern:**
```javascript
// Group blocks by category for the panel:
const BRANDED = 'DDROIDD Branded';
const GENERIC = 'Layout';

editor.Blocks.add('ddroidd-hero',     { category: BRANDED, content: '...', label: 'Hero' });
editor.Blocks.add('ddroidd-projects', { category: BRANDED, content: '...', label: 'Projects' });
editor.Blocks.add('section-1col',     { category: GENERIC, content: '...', label: '1 Column' });
```

---

### Maintenance Status and Abandonment Risk

| Signal | Value |
|--------|-------|
| Latest version | 1.0.8 (March 2026) |
| Prior version | 1.0.7 (July 2025) |
| Maintainer | @artf (GrapesJS author — same person maintains core) |
| Maintained by | GrapesJS org, not a third-party plugin |
| GrapesJS core latest | 0.23.2 (June 2026) |
| Total versions | 47 (active release cadence since 2017) |

**Abandonment risk: LOW.** The plugin is maintained by the same author as GrapesJS core and lives in the GrapesJS org. Two releases in 2025-2026 confirm active maintenance. The lag between core (0.23.x) and the plugin's devDeps (tested against 0.21.x) is a known pattern — GrapesJS's plugin API is stable across 0.21–0.23 for the component/block API used by this plugin.

---

### Version Compatibility Triangle (Critical)

```
grapesjs-mjml@1.0.8
  - devDeps: grapesjs ^0.21.2  (tested range, NOT a peerDependency — no install-time enforcement)
  - deps: mjml-browser ^4.18.0  (MJML v4, not v5)

@grapesjs/react@2.0.0
  - peerDeps: grapesjs ^0.22.5, react ^18.0.0 || ^19.0.0  (ENFORCED)

grapesjs latest: 0.23.2
```

**Semver analysis:**
- `^0.22.5` for 0.x packages means `>=0.22.5 <0.23.0`. GrapesJS 0.23.2 does NOT satisfy this.
- `^0.21.2` means `>=0.21.2 <0.22.0`. GrapesJS 0.22.x or 0.23.x does NOT satisfy this.
- These two declared ranges are completely disjoint — no single version can satisfy both simultaneously.

**However:** grapesjs-mjml declares NO `peerDependencies`, only `devDependencies`. npm does not enforce devDep ranges at install time. The plugin will install alongside any GrapesJS version without a conflict error. The devDep range is the developed-against/tested version, not a hard constraint.

**Recommended pinned triple:**

| Package | Pinned Version | Rationale |
|---------|---------------|-----------|
| `grapesjs` | `0.22.16` | Latest in the `^0.22.x` family; satisfies `@grapesjs/react@2.0.0` peerDep `^0.22.5`; avoids 0.23.x which is beyond `@grapesjs/react`'s stated peer range |
| `grapesjs-mjml` | `1.0.8` | Latest; no enforced version constraint against GrapesJS version |
| `@grapesjs/react` | `2.0.0` | Latest; peerDep satisfied by grapesjs@0.22.16 |
| `mjml` (server) | `4.18.0` | Match the browser-side `mjml-browser@4.18.0` that grapesjs-mjml bundles, ensuring preview === server output |

**IMPORTANT — Phase-1 spike required:** grapesjs-mjml was developed and tested against `grapesjs@^0.21.2`. The recommended `grapesjs@0.22.16` installs without npm errors but has never been explicitly tested with grapesjs-mjml. GrapesJS's component/block API is stable across minor versions and the plugin uses only established APIs, making it likely-but-unverified that 0.22.x works. The Phase-1 spike must confirm: (a) editor mounts, (b) blocks drag onto canvas, (c) MJML export produces valid output. If 0.22.x proves incompatible, the fallback is `grapesjs@0.21.2` + skip `@grapesjs/react` (use direct mount instead). Do not build SaaS infra before this is verified.

**Do NOT use grapesjs 0.23.x** until `@grapesjs/react` updates its peer dependency range to include `^0.23.x`. Using 0.23.x with `@grapesjs/react@2.0.0` will trigger npm peer dependency warnings and is outside the tested range.

**Do NOT use mjml v5 on the server.** grapesjs-mjml pins `mjml-browser@^4.18.0` (v4). The browser preview and server compile must use the same MJML major version to produce identical HTML. MJML v5 has breaking changes (different skeleton, minification, include handling) that would cause preview/export divergence.

---

### @grapesjs/react vs Direct Mount

**Use `@grapesjs/react@2.0.0`.** It is the official wrapper, maintained by the GrapesJS org. It handles editor lifecycle (init/destroy on mount/unmount), React context, and provides a `<Canvas />` component for declarative UI composition.

**Direct mount** (creating a `div` ref and calling `grapesjs.init()` in `useEffect`) is the pre-2022 pattern. It works but requires manual cleanup and has known SSR/double-render issues in strict mode. `@grapesjs/react` handles all of this.

**Integration pattern:**
```jsx
import grapesjs from 'grapesjs';
import { GjsEditor, Canvas } from '@grapesjs/react';
import grapesjsMjml from 'grapesjs-mjml';
import 'grapesjs/dist/css/grapes.min.css';

export function NewsletterEditor() {
  return (
    <GjsEditor
      grapesjs={grapesjs}          // pass the imported library object, NOT the string "grapesjs"
      grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
      options={{
        height: '100%',
        storageManager: false,     // use custom save via API
        plugins: [grapesjsMjml],
        pluginsOpts: {
          'grapesjs-mjml': {       // use hardcoded string key, NOT [grapesjsMjml] computed key
            resetBlocks: false,    // keep default blocks
            resetDevices: false,
            // useXmlParser: true  // experimental void-element parser; keep OFF unless needed
          }
        },
        canvas: {
          styles: ['path/to/grapesjs-mjml.css'],
        }
      }}
    >
      <Canvas />
    </GjsEditor>
  );
}
```

**Why hardcoded string key in `pluginsOpts`:** Using `[grapesjsMjml]` (the function as a computed key) is a known-broken idiom that causes "canvas loads but blocks can't be dropped" (documented in GitHub issue #223). The `@grapesjs/react` guide explicitly warns to use the plugin's registered string name `'grapesjs-mjml'` as the key.

**Note on `GjsEditor` props:** The `grapesjs` prop accepts the imported GrapesJS module (the object). The `@grapesjs/react` npm page returned 403 during research, so exact prop names should be confirmed against the official README at `github.com/GrapesJS/react` before first use.

**Persistence (save/load):**
- Save: `editor.getProjectData()` → POST to `/api/newsletters/:id` → store as JSONB in DB
- Load: GET → `editor.loadProjectData(json)` → editor restores component tree
- Export HTML: POST MJML to `/api/compile` → returns server-compiled HTML via `mjml@4.18.0`
- Extract MJML source for server compile: `editor.getHtml()` returns the MJML string from the canvas

---

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
| `prisma` | `7.8.0` | ORM + migrations | Type-safe queries, migration tooling, works with PostgreSQL; faster to set up than raw SQL for an internal tool |
| `pg` | `8.22.0` | PostgreSQL driver | Prisma peer dep |
| `vite` | `8.1.0` | Frontend build tool | Fastest HMR; native ESM; first-class React support |
| `@vitejs/plugin-react` | `6.0.3` | Vite React plugin | Fast Refresh; Babel transform |

### Database

**Use PostgreSQL (local or hosted).** For an internal team tool with < 50 users, PostgreSQL is the correct choice: JSONB columns store GrapesJS project data natively (no schema migration needed per newsletter), relational tables handle users/newsletters/assets cleanly.

**Do NOT use SQLite** for this project. SQLite lacks concurrent write support (multiple users editing simultaneously) and has no native JSONB type for querying into project data if needed later.

Schema sketch:
```
users (id, email, password_hash, created_at)
newsletters (id, user_id, title, project_data JSONB, created_at, updated_at)
assets (id, user_id, filename, storage_key, mime_type, size, created_at)
```

### Auth

**Use JWT + bcrypt for internal tool auth.** No OAuth needed — this is DDROIDD staff only. Avoid session-based auth (requires Redis/sticky sessions); JWTs are stateless and work with a simple Express middleware.

| Package | Pinned Version | Purpose |
|---------|---------------|---------|
| `jsonwebtoken` | `9.0.3` | Sign/verify JWTs |
| `bcrypt` | `6.0.0` | Password hashing |

Pattern: POST `/auth/login` with email+password → returns JWT in httpOnly cookie → Express middleware validates on protected routes.

For an internal tool with small team, a pre-seeded users table is sufficient — no self-registration flow needed in v1.

### Image Storage

**Use local disk storage + `multer` for Phase 1.** An internal tool with a small team does not need object storage complexity immediately. Store uploaded images in `uploads/` on the Node server, serve them at `/assets/:filename`.

Add S3-compatible storage (via `@aws-sdk/client-s3` + `multer-s3`) only if the team grows or the server needs to be stateless.

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
| `prisma` CLI | `7.8.0` | Migration tooling | Commit generated types |

---

## Installation

```bash
# Frontend (in /client or monorepo root)
npm install grapesjs@0.22.16 grapesjs-mjml@1.0.8 @grapesjs/react@2.0.0 react@19.2.7 react-dom@19.2.7

# Backend
npm install express@5.2.1 mjml@4.18.0 prisma@7.8.0 pg@8.22.0 jsonwebtoken@9.0.3 bcrypt@6.0.0 multer@2.2.0 sharp@0.35.2 cors@2.8.6 helmet@8.2.0 zod@4.4.3 dotenv@17.4.2

# Dev
npm install -D vite@8.1.0 @vitejs/plugin-react@6.0.3 typescript tsx@4.22.4 nodemon @types/express @types/node @types/jsonwebtoken @types/bcrypt @types/multer prisma@7.8.0
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Editor | grapesjs-mjml | Unlayer, Stripo, Beefree | All proprietary SaaS with per-seat pricing and no self-hosting; grapesjs-mjml is the only OSS drag-drop MJML editor |
| Editor | grapesjs-mjml | Build custom editor from scratch | 6-12 months of work minimum; grapesjs-mjml gives drag-drop, component model, and browser preview in days |
| React wrapper | @grapesjs/react | Direct grapesjs.init() in useEffect | Direct mount works but requires manual lifecycle management; @grapesjs/react is the official solution and handles strict mode correctly; if grapesjs@0.22.x proves incompatible, fall back to direct mount with grapesjs@0.21.2 |
| ORM | Prisma | Drizzle | Drizzle has less migration tooling; Prisma's type generation and migrate CLI are better for an internal tool |
| ORM | Prisma | Raw pg/SQL | Viable but no migration tooling |
| DB | PostgreSQL | SQLite | No concurrent writes; no JSONB; not appropriate for multi-user web app |
| Server | Express v5 | Fastify | Fastify is faster; Express is the standard for existing GrapesJS/MJML tutorials; performance irrelevant at internal-tool scale |
| Compiler | mjml@4.18.0 | mjml@5.x | v5 has breaking changes (skeleton, minification, include security); grapesjs-mjml bundles mjml-browser@^4.18.0 — mismatching major versions causes preview/export divergence |
| Image storage | Local disk + multer | AWS S3 from day 1 | Unnecessary complexity for Phase 1 internal tool; add S3 in Phase 2 if needed |
| Auth | JWT + bcrypt | NextAuth, Passport | Over-engineered for a 5-10 person internal team with pre-seeded users |

---

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

---

## Version Compatibility Matrix

| Package | Must be Compatible With | Verified | Status |
|---------|------------------------|---------|--------|
| `grapesjs@0.22.16` | `@grapesjs/react@2.0.0` peerDep `^0.22.5` | ✓ semver satisfies | Confirmed (install-time) |
| `grapesjs@0.22.16` | `grapesjs-mjml@1.0.8` (no peerDep declared) | ✓ no install conflict | Runtime unverified — plugin tested against 0.21.x; verify in Phase-1 spike |
| `grapesjs-mjml@1.0.8` | `mjml-browser@^4.18.0` (bundled dep) | ✓ 4.18.0 bundled | Confirmed |
| `mjml@4.18.0` (server) | `mjml-browser@4.18.0` (client preview) | ✓ same major/minor | Recommended parity; prevents preview/export divergence |
| `react@19.x` | `@grapesjs/react@2.0.0` peerDep `^18\|\|^19` | ✓ semver satisfies | Confirmed |
| `express@5.2.1` | Node.js LTS 20+ | ✓ | Confirmed |
| `prisma@7.8.0` | `pg@8.22.0` | ✓ compatible | Standard |

---

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
| Backend stack | HIGH | Standard Node.js ecosystem; Express v5 stable, Prisma well-established |

---

## Sources

- npm registry (verified June 2026): `grapesjs`, `grapesjs-mjml`, `@grapesjs/react`, `mjml`, `mjml-browser`, `express`, `prisma`, `pg`, `jsonwebtoken`, `bcrypt`, `multer`, `cors`, `helmet`, `zod`, `dotenv`, `tsx` — version metadata, publish dates, peer/dep ranges
- GitHub GrapesJS/mjml README (via unpkg app.unpkg.com): supported component list, plugin options, `customComponents` API
- GitHub GrapesJS/mjml issue #35: `mj-head`/`mj-attributes` import corruption — confirmed broken
- GitHub GrapesJS/mjml issue #194: round-trip save/load failure with `setComponents(html)` — confirmed broken
- GitHub GrapesJS/mjml issue #223: computed-key `[grapesjsMjml]` in pluginsOpts causes block drop failure
- GitHub GrapesJS/mjml issue #388: wrong rendering on MJML import
- Mautic forum (forum.mautic.org): moderator-confirmed `mj-attributes` architectural limitation
- gjs.market GrapesJS + React + Next.js guide: `@grapesjs/react` integration pattern, hardcoded-string-key requirement, GrapesJS >=0.22.x requirement
- WebSearch: MJML v5 breaking changes (skeleton, minification, include security changes from v4)

---

*Stack research for: DDROIDD Newsletter Builder (GrapesJS + MJML)*
*Researched: 2026-06-25*
