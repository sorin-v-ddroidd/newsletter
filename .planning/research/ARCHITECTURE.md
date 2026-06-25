# Architecture Research

**Domain:** Visual newsletter builder — GrapesJS/MJML + Node/React web app
**Researched:** 2026-06-25
**Confidence:** HIGH (GrapesJS/plugin docs via Context7; architectural patterns from primary sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  React Editor App│  │ GrapesJS Layer │  │  Block Defs     │  │
│  │  (layout, nav,   │  │ (init, storage │  │  Module         │  │
│  │   list, export)  │  │  hooks, events)│  │  (MJML strings, │  │
│  └────────┬─────────┘  └───────┬────────┘  │  categories)    │  │
│           │                    │           └────────┬────────┘  │
│           └────────────────────┴──────registered at init        │
│                                │                                 │
│                         API Client                               │
│                         (fetch + auth header)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP (REST)
┌──────────────────────────────┴──────────────────────────────────┐
│                        SERVER (Node/Express)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Auth Layer  │  │  API Server      │  │  MJML Compile     │  │
│  │  (session /  │  │  (newsletters,   │  │  Service          │  │
│  │   JWT)       │  │   assets routes) │  │  (stateless,      │  │
│  └──────┬───────┘  └────────┬─────────┘  │   on-demand)      │  │
│         │                   │            └───────┬───────────┘  │
│         └───────────────────┘                    │              │
│                             │                    │              │
│  ┌──────────────────┐  ┌────┴──────────────┐     │              │
│  │  Image Upload /  │  │  DB Layer         │     │ mjml npm lib │
│  │  Storage Service │  │  (ORM + queries)  │     │              │
│  │  (disk / S3)     │  └────────┬──────────┘     │              │
│  └──────────────────┘           │                │              │
└────────────────────────────────┬┴────────────────┴──────────────┘
                                 │
┌────────────────────────────────┴──────────────────────────────────┐
│                          PERSISTENCE                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  newsletters    │  │  users           │  │  assets          │  │
│  │  (project JSON  │  │  (id, email,     │  │  (id, url,       │  │
│  │   + meta)       │  │   role, hash)    │  │   name, owner)   │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────┐                  │
│  │  File / Object Storage (images, assets)       │                  │
│  └──────────────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

All nine components explicitly mapped:

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| **React Editor App** | Shell, routing, newsletter list/duplicate, toolbar UI, export download trigger | Owns layout outside the canvas; does not reach into GrapesJS internals directly |
| **GrapesJS Integration Layer** | `grapesjs.init()` with plugins + options; wires `storageManager` to authenticated API; fires save/load via `getProjectData`/`loadProjectData`; routes editor events (preview, export) to API calls | Single entry-point module; keeps GrapesJS API contained here, not scattered across React components |
| **Block Definitions Module** | Declares all branded and generic blocks as MJML-string definitions and categories; exported as static data, has no GrapesJS import | Framework-agnostic; consumed at init by the integration layer; separating it here lets block definitions be unit-tested and ported independently |
| **API Server** | Express routes for newsletters (CRUD), MJML compile endpoint, image upload, asset library listing, auth | Single Express app; plain REST; no GraphQL needed at this scale |
| **MJML Compile Service** | Thin stateless function: `mjml(mjmlString, options) → html`; invoked by API routes for preview and export | Uses `mjml` npm lib (already in project); never called from the client; never called on save (see Data Flow) |
| **DB Layer** | ORM models and queries for users, newsletters, assets | Drizzle (TypeScript-native, SQL-first, migration-driven via drizzle-kit); PostgreSQL for both dev and prod (no SQLite — needs concurrent writes + JSONB) |
| **Auth** | Session or JWT-based login; internal users only; no public signup; middleware applied to all non-public routes | Recommended: express-session + bcrypt for simplicity, or jsonwebtoken for stateless JWT; no OAuth needed |
| **Image Upload / Storage Service** | Accepts multipart upload, writes to disk or S3, returns a permanent public URL; validates file type and size | Images need absolute, publicly-reachable URLs — email clients fetch them at send time, not serve-time; app-relative paths will break |
| **Asset Library** | Curated set of brand images (logos, team photos, signature); persisted in `assets` table; browsable in editor via panel; picks return an absolute URL | Backed by the same storage service; seed script populates from existing `assets/` directory |

## Recommended Project Structure

```
newsletter/                     # repo root (existing)
├── packages/
│   ├── client/                 # React front-end (new)
│   │   ├── src/
│   │   │   ├── editor/
│   │   │   │   ├── GjsEditor.tsx       # GrapesJS integration layer
│   │   │   │   ├── blocks/             # block definitions module
│   │   │   │   │   ├── generic.ts      # mj-text, mj-image, mj-button, etc.
│   │   │   │   │   └── branded/        # hero, projects, hiring, etc.
│   │   │   │   │       ├── hero.ts
│   │   │   │   │       └── ...
│   │   │   │   └── panels/             # custom asset library panel
│   │   │   ├── pages/
│   │   │   │   ├── EditorPage.tsx
│   │   │   │   └── NewsletterListPage.tsx
│   │   │   └── api/                    # typed API client (fetch wrapper)
│   │   └── package.json
│   └── server/                 # Express backend (new)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── newsletters.ts
│       │   │   ├── compile.ts
│       │   │   ├── assets.ts
│       │   │   └── auth.ts
│       │   ├── services/
│       │   │   ├── mjmlCompile.ts      # thin wrapper around mjml npm lib
│       │   │   └── storage.ts          # disk or S3 upload
│       │   ├── db/
│       │   │   ├── schema.ts            # Drizzle table definitions
│       │   │   ├── migrations/          # drizzle-kit output
│       │   │   └── client.ts            # drizzle client over pg
│       │   └── middleware/
│       │       └── auth.ts
│       └── package.json
├── src/                        # existing MJML sources — dev reference only
├── dist/                       # legacy compiled output
├── assets/                     # seed source for asset library
├── package.json                # root — add workspaces: ["packages/*"]
└── ...
```

### Structure Rationale

- **packages/client + packages/server:** npm workspaces monorepo gives one repo, one git history, shared type definitions, separate dependency trees; no complex tooling needed (Turborepo optional later)
- **editor/blocks/branded/:** one file per branded section mirrors the existing `src/sections/*.mjml` one-to-one; easy to track parity during Phase 1 spike
- **services/mjmlCompile.ts:** isolates `mjml` import to one place; swappable (e.g. `mjml-browser` for future client-side preview) without touching route logic
- **Existing `src/` stays:** legacy files remain as dev reference for re-authoring branded blocks; not served by the app

## Architectural Patterns

### Pattern 1: GrapesJS Project JSON as Source of Truth (Asymmetric Persistence)

**What:** `editor.getProjectData()` returns a JSON object encoding all component trees, styles, and plugin state. This is the authoritative persisted representation. MJML and compiled HTML are derived artifacts generated on demand.

**When to use:** Always. MJML is exportable from the editor but not reliably re-importable as arbitrary MJML (the plugin's #1 documented risk). Loading a saved newsletter must go through `loadProjectData()`, not through MJML re-parsing.

**Trade-offs:**
- Pro: Perfect round-trip fidelity; reliable reopen; no MJML import ambiguity
- Pro: MJML/HTML can be regenerated at any time — no storage duplication required for editability
- Con: Project JSON is opaque to non-GrapesJS tools; MJML is more readable if you ever need to inspect saved content
- Con: If grapesjs-mjml schema changes in a future plugin version, stored project JSON may need migration

**Persistence recommendation:** Store `project_data` (JSON) as the authoritative column. Optionally cache `mjml_source` and `compiled_html` as denormalized columns for fast export — but treat them as regenerable, not authoritative.

```typescript
// Save: client sends project JSON, server persists it
// GET /api/newsletters/:id → { id, name, project_data, updated_at }
// PUT /api/newsletters/:id → body: { project_data }

// Load in editor:
const { project_data } = await api.get(`/newsletters/${id}`);
editor.loadProjectData(project_data);
```

### Pattern 2: Manual Save via Authenticated API (not GrapesJS remote storageManager)

**What:** Disable GrapesJS's built-in `storageManager`, call `editor.getProjectData()` manually on save events, and POST to your own authenticated API endpoint. Load by fetching from API then calling `editor.loadProjectData()`.

**When to use:** When the editor is scoped to a named, owned resource (not anonymous scratch) and you need auth headers, newsletter IDs in the URL, and explicit user-triggered or debounced autosave. This app qualifies on all counts.

**Trade-offs:**
- Pro: Full control over auth headers, URL shape, error handling, conflict detection
- Pro: Explicit save model matches "named newsletter" UX better than background autosave
- Con: Must wire autosave manually (debounce on `editor.on('update', ...)`)
- Alternative: GrapesJS `storageManager: 'remote'` with `fetchOptions` to inject auth header — viable but loses flexibility over the URL scheme

```typescript
// Integration layer (GjsEditor.tsx)
grapesjs.init({
  storageManager: false,  // disable built-in storage
  projectData: initialData || undefined,
  // ...
});

// Autosave with debounce
editor.on('update', debounce(async () => {
  await api.put(`/newsletters/${newsletterId}`, {
    project_data: editor.getProjectData(),
  });
}, 2000));
```

### Pattern 3: Block Definitions as Static Data (Framework-Agnostic)

**What:** Each branded block is a TypeScript module exporting a `BlockDefinition` object: `{ id, label, category, content: '<mj-section>...</mj-section>' }`. The integration layer consumes these at editor init.

**When to use:** When blocks contain brand-specific MJML strings with exact colors, fonts, and client-workaround patterns (mj-spacer for Outlook, inline critical styles for Gmail). These must be authored by hand to preserve the `head.mjml` knowledge; they cannot be imported from existing source files.

**Trade-offs:**
- Pro: Blocks are testable without mounting GrapesJS; content is visible/reviewable outside the editor
- Pro: Bounded; re-authoring one block doesn't risk side effects on others
- Con: Block MJML content is static — dynamic token substitution (company name, date) requires a template step within the content string or post-processing

```typescript
// packages/client/src/editor/blocks/branded/hero.ts
export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'Hero Banner',
  category: 'DDROIDD Branded',
  content: `
    <mj-section background-color="#1a1a2e" padding="40px 20px">
      <mj-column>
        <mj-image src="https://assets.example.com/logo.png" width="160px" />
        <mj-text color="#ffffff" font-size="28px" font-family="Barlow, sans-serif">
          DDROIDD Digest
        </mj-text>
        <mj-spacer height="16px" />
      </mj-column>
    </mj-section>
  `,
};

// Integration layer — registered at init
import { heroBlock } from './blocks/branded/hero';
editor.BlockManager.add(heroBlock.id, heroBlock);
```

### Pattern 4: Stateless Server-Side MJML Compile (On-Demand)

**What:** A single Express endpoint accepts MJML string, calls `mjml(input, options)`, returns compiled HTML. Called for preview and for export. Never called on save.

**When to use:** Always for this stack. Server-side compile is the source of truth for client-safe HTML — the in-browser GrapesJS canvas renders MJML live but this is a development preview, not the output that survives Outlook/Gmail.

**Trade-offs:**
- Pro: All `mjml` lib options (fonts, validationLevel) set in one place; consistent output
- Pro: Can apply the same `mj-head` defaults (fonts, attribute defaults) from the existing `head.mjml` logic as compile options
- Con: Round-trip latency for every preview refresh — mitigate with debounce on preview panel; not a blocker at internal team scale

```typescript
// packages/server/src/services/mjmlCompile.ts
import mjml from 'mjml';

export function compileMjml(mjmlString: string): string {
  const result = mjml(mjmlString, {
    validationLevel: 'soft',  // warn, don't throw on non-fatal issues
    fonts: {
      Barlow: 'https://fonts.googleapis.com/css?family=Barlow',
    },
  });
  if (result.errors.length) {
    console.warn('MJML compile warnings:', result.errors);
  }
  return result.html;
}

// Route: POST /api/compile
router.post('/compile', requireAuth, async (req, res) => {
  const { mjml: mjmlSource } = req.body;
  const html = compileMjml(mjmlSource);
  res.json({ html });
});
```

## Data Model

### Tables

```
users
├── id          UUID PK
├── email       TEXT UNIQUE NOT NULL
├── name        TEXT NOT NULL
├── password_hash TEXT NOT NULL
├── role        TEXT DEFAULT 'editor'  -- 'admin' | 'editor'
└── created_at  TIMESTAMP

newsletters
├── id            UUID PK
├── owner_id      UUID FK → users.id
├── name          TEXT NOT NULL
├── project_data  JSONB NOT NULL        -- editor.getProjectData() — authoritative
├── mjml_source   TEXT                  -- cached, regenerable
├── compiled_html TEXT                  -- cached, regenerable
├── status        TEXT DEFAULT 'draft'  -- 'draft' | 'exported'
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP

assets
├── id          UUID PK
├── owner_id    UUID FK → users.id (nullable = system/seeded asset)
├── name        TEXT NOT NULL
├── url         TEXT NOT NULL           -- absolute public URL
├── mime_type   TEXT NOT NULL
├── size_bytes  INTEGER
└── created_at  TIMESTAMP
```

**Persistence rationale — `project_data` is authoritative:**
- GrapesJS `loadProjectData()` is the only reliable way to reopen a newsletter for editing. Re-parsing stored MJML as arbitrary input is the plugin's documented #1 risk (round-trip fidelity is not guaranteed for features like `mj-include`, `mj-attributes`, `css-class`, background-url — all present in the existing `head.mjml` and sections).
- `mjml_source` and `compiled_html` are denormalized for fast export; both are regenerable from `project_data` at any time by rendering the editor headlessly or via the compile endpoint.
- Do not persist only MJML and reconstruct project JSON on load — this is the trap.

## Data Flow

### Save Flow

```
Editor (user edits content)
    → debounced autosave OR explicit Save button
    → editor.getProjectData()  →  { pages, styles, ... }
    → POST /api/newsletters/:id  { project_data }
    → Server: persist to newsletters.project_data
    → [Optional] trigger async MJML export → cache mjml_source + compiled_html
    → 200 OK
```

### Load Flow

```
EditorPage mounts (user opens a newsletter)
    → GET /api/newsletters/:id
    → Server returns { id, name, project_data, ... }
    → editor.loadProjectData(project_data)
    → GrapesJS reconstructs component tree from JSON
    → Canvas renders MJML live (in-browser, fast)
```

### Preview Flow

```
User clicks Preview
    → editor.runCommand('mjml-export')  OR  integration layer reads editor's MJML getter
    → POST /api/compile  { mjml: mjmlString }
    → Server: compileMjml(mjmlString) → html
    → Client renders html in iframe (sandboxed)
    → User toggles desktop / mobile width
```

**Note:** The GrapesJS canvas provides a live in-browser MJML preview, but this is NOT the client-safe output. The server compile is the source of truth for what survives Outlook/Gmail.

### Export Flow

```
User clicks Export / Download HTML
    → Same as Preview flow: POST /api/compile
    → Server returns compiled html
    → Client triggers download as standalone .html file
        (or copies to clipboard)
```

### Compile timing: compile happens on-demand (preview / export), NOT on save.
- Save = persist project JSON (fast, no compile needed)
- Preview = compile current MJML (user-triggered, debounced)
- Export = compile final MJML → download

### Image Upload Flow

```
User drags image or uses asset panel upload
    → POST /api/assets/upload  (multipart/form-data)
    → Server validates mime/size
    → Writes to disk or S3
    → Inserts row into assets table with absolute public URL
    → Returns { url, id, name }
    → Client inserts absolute URL into mj-image block
```

**Critical constraint:** Image URLs must be absolute and publicly reachable. Email clients fetch images at render time. App-relative paths (e.g. `/uploads/foo.png`) will appear broken in Outlook/Gmail unless the server is publicly accessible. Use a CDN or S3 public URL from day one.

## Where Custom Blocks Live and How They Register

The block definitions module (`packages/client/src/editor/blocks/`) is a framework-agnostic static data layer:

```
blocks/
├── generic.ts       -- standard blocks (restates or filters grapesjs-mjml built-ins)
└── branded/
    ├── hero.ts
    ├── projects.ts
    ├── new-colleagues.ts
    ├── hiring.ts
    ├── initiatives.ts
    ├── want-to-know-more.ts
    └── disclaimer.ts
```

Each file exports a plain object (`{ id, label, category, content }`). The integration layer (`GjsEditor.tsx`) collects all branded blocks and registers them during `editor` init:

```typescript
// After editor is created:
import { allBrandedBlocks } from './blocks/branded';

allBrandedBlocks.forEach(block => {
  editor.BlockManager.add(block.id, {
    label: block.label,
    category: block.category,
    content: block.content,
  });
});
```

Branded blocks appear under "DDROIDD Branded" in the editor panel; generic blocks from `grapesjs-mjml` appear under standard categories. The plugin's `blocks` option controls which generic blocks are available.

## Suggested Build Order

**The grapesjs-mjml feasibility spike is Phase 1 — it is a hard gate, not optional prep.** Auth, DB, and storage are straightforward to build; the editor is the unknown. Do not build the infrastructure before proving the editor works for this use case.

### Phase 1 — Feasibility Spike (Editor Core) [GATE]

**Exit criteria — all must pass before proceeding:**
1. GrapesJS + grapesjs-mjml mounts in a React component without errors
2. At least 2 branded blocks (hero + one content section) are re-authored as block definitions and draggable in the editor
3. `editor.getProjectData()` → save to localStorage → reload → `editor.loadProjectData()` produces identical canvas state
4. Server-side `mjml(mjmlString)` on the exported MJML produces HTML that renders correctly in Outlook and Gmail (validates that the branded block MJML preserves the `head.mjml` client-safety knowledge)

**What gets built:** React shell (no auth, no DB, hardcoded data), GrapesJS integration layer, 2 branded block definitions, local-only storage, compile endpoint (stateless, no DB).

**Dependencies:** None — this is the first thing.

### Phase 2 — Database + Auth

**Depends on:** Phase 1 spike passing.

What gets built: Drizzle schema (users, newsletters, assets) + initial migration, Express app skeleton, auth routes (login/logout/session), newsletter CRUD endpoints, integration of GrapesJS save/load with real API (manual save pattern, auth via httpOnly cookie).

### Phase 3 — Remaining Branded Blocks + Asset Library

**Depends on:** Phase 2 (need newsletter persistence to test full flow).

What gets built: All remaining branded block definitions (5–7 sections), image upload endpoint + storage service, asset library panel in editor, absolute-URL image handling.

### Phase 4 — Preview + Export + Polish

**Depends on:** Phase 3 (need full block library to validate export quality).

What gets built: Server-side preview iframe flow, export/download, mobile/desktop width toggle, newsletter list page (list, duplicate, rename, delete), end-to-end QA against Outlook/Gmail.

**Dependency rationale:**
- Phase 1 first: unblocks everything; if the editor is not viable the project changes fundamentally
- Phase 2 before Phase 3: can't save/load assets without a DB and auth
- Phase 3 before Phase 4: export is only meaningful with the full block set
- Compile service appears in Phase 1 (stateless, no auth) and stays unchanged through Phase 4

## Monorepo vs Separate Repos / Dev Tooling

**Recommendation: npm workspaces monorepo (`packages/client` + `packages/server`) in the existing repo.**

Rationale:
- One git history covers MJML legacy, client, and server — traceability for the email-client rendering knowledge encoded in existing `src/` files
- No cross-repo import complications for shared TypeScript types (newsletter DTO, block definition shape)
- No Turborepo or Nx needed at this scale; plain `npm workspaces` with a root `package.json` is sufficient

**How the existing setup folds in:**
- `mjml` npm lib moves from root `dependencies` to `packages/server/package.json` — it is a server-only concern
- Legacy `build-pages`, `watch-pages`, `dev` scripts stay in root `package.json` for dev reference; they are not part of the web app
- `src/sections/*.mjml` files remain in repo as the ground truth for re-authoring branded blocks in Phase 1; they are not served or compiled by the app
- `assets/` directory is the seed source for the asset library — a migration script imports them into the DB/storage in Phase 3
- `browser-sync`, `concurrently`, `nodemon` remain dev tooling for the legacy compile workflow; the new app adds Vite (client) + `ts-node` / `tsx` (server dev)

**New dev workflow:**
```bash
# root
npm install                     # installs all workspaces

# two terminals:
npm -w packages/server run dev  # tsx watch → Express on :3001
npm -w packages/client run dev  # Vite → React on :5173, proxies /api to :3001
```

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React App ↔ GrapesJS Integration Layer | React renders the container div; integration layer owns the GrapesJS instance via `onEditor` callback from `@grapesjs/react`; events surface via editor event bus | Do not scatter `editor.*` calls outside the integration layer |
| Integration Layer ↔ Block Definitions Module | Import at module init; pass to `BlockManager.add` | Block definitions have no GrapesJS dependency — pure data |
| Client ↔ API Server | REST over HTTP; `Authorization: Bearer <token>` header on all newsletter/asset routes | Use a typed API client module (thin fetch wrapper) to avoid scattered raw fetch calls |
| API Server ↔ MJML Compile Service | Direct function call (same process); not a separate microservice | Microservice split is premature for internal team scale |
| API Server ↔ DB Layer | Drizzle client (type-safe queries) | Never raw SQL from routes; always through the service/query layer |
| API Server ↔ Storage Service | Module call returning public URL | Abstracts disk vs S3; swap without touching routes |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Fonts | CDN URL in MJML `<mj-font>` tag (via `fonts` option in compile service) | Already used in existing `head.mjml`; must be preserved in branded block MJML content |
| S3 / Object Storage (optional) | AWS SDK in storage service; presigned PUT URLs | Disk storage works for internal tool; S3 recommended if app is hosted on a server without persistent disk |
| Email client (Outlook/Gmail) | No direct integration — export HTML only; clients fetch images at render time via absolute URLs | Existing PowerShell scripts can still be used ad-hoc for final Outlook QA |

## Anti-Patterns

### Anti-Pattern 1: Persisting Only MJML and Re-Importing on Load

**What people do:** Save the MJML string from the editor export, then on re-open, pass that MJML string back into the editor as the initial document.

**Why it's wrong:** `grapesjs-mjml` does not reliably round-trip arbitrary MJML. Features used in the existing sections — `mj-include`, `mj-attributes`, `css-class`, `background-url` on sections, `mj-spacer` — have partial or lossy plugin support. Re-importing MJML is the project's documented #1 risk; it will cause silent data loss on re-open for complex blocks.

**Do this instead:** Persist `project_data` (GrapesJS JSON). Load with `editor.loadProjectData()`. MJML is a derived export, not the storage format.

### Anti-Pattern 2: Calling the MJML Compile Service on Every Save

**What people do:** On save, compile MJML to HTML and store both, treating compile as part of the save path.

**Why it's wrong:** Compile adds latency to every save (even when no export is needed), and couples two concerns. If compile fails (malformed MJML during editing), save fails too, trapping the user.

**Do this instead:** Save = persist project JSON only (fast, always succeeds). Compile = separate endpoint called on preview/export (on-demand, failure is isolated).

### Anti-Pattern 3: App-Relative Image URLs in Blocks

**What people do:** Upload an image, reference it as `/uploads/hero-bg.png` in the block content.

**Why it's wrong:** Email clients fetch images when the email is opened, from whatever server sent it. A relative URL resolves to nothing (or the wrong host) when the HTML is exported and sent.

**Do this instead:** The image upload endpoint always returns and stores the absolute public URL (e.g. `https://assets.ddroidd.com/uploads/hero-bg.png`). The integration layer enforces this in the asset panel.

### Anti-Pattern 4: Scattering GrapesJS API Calls Across React Components

**What people do:** Call `editor.getProjectData()` from a toolbar button component, `editor.BlockManager.add()` from another component, etc.

**Why it's wrong:** GrapesJS has its own lifecycle; calling its API before `onEditor` fires causes silent failures. React state and GrapesJS state diverge unpredictably.

**Do this instead:** The GrapesJS Integration Layer is the single place that holds and operates on the editor instance. React components communicate intent (save, export, preview) via callbacks passed down or context — the integration layer executes the GrapesJS call.

## Scaling Considerations

This is an internal team tool. Scaling to 1M users is not a realistic concern. Realistic concerns:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 5–15 internal users (launch) | Single Express process, SQLite or Postgres, disk storage — monolith is correct |
| 50–200 internal users (org growth) | Postgres required, S3 for images; MJML compile is CPU-bound — move to worker thread pool if compile latency becomes noticeable |
| Multi-team / multi-company | Add org/tenant column to all tables; scoped asset library per org — this is schema work, not architectural rework |

**First bottleneck:** MJML compile is synchronous and CPU-bound. At low concurrency this is fine. If multiple users preview simultaneously, compile blocks the event loop. Mitigation: `worker_threads` for compile, or `mjml`'s async option if available.

**Second bottleneck:** Image storage. Disk storage on a single server is fragile. Move to S3 or equivalent before hosting externally.

## Sources

- GrapesJS documentation — storage manager, project data, remote storage: https://github.com/grapesjs/grapesjs/blob/dev/docs/modules/Storage.md (HIGH confidence, Context7)
- grapesjs-mjml plugin — block registration, customComponents, PluginOptions: https://context7.com/grapesjs/mjml/llms.txt (HIGH confidence, Context7)
- @grapesjs/react — GjsEditor wrapper, onEditor callback, useEditor hook: https://github.com/grapesjs/react/blob/main/README.md (HIGH confidence, Context7)
- Project constraints and #1 risk: `.planning/PROJECT.md` Key Decisions section
- Existing composition model and email-client constraints: `CLAUDE.md`, `src/pages/index.mjml`, `src/sections/`

---
*Architecture research for: DDROIDD Newsletter Builder — GrapesJS/MJML visual editor*
*Researched: 2026-06-25*
