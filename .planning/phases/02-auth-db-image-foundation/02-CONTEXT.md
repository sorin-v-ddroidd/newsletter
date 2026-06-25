# Phase 2: Auth + DB + Image Foundation - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the authenticated API + persistence + image foundation that the Phase 1 editor sits on top of:
- Email/password login, httpOnly-cookie session (persist across refresh), logout from any page; unauthenticated requests to editor/API rejected (AUTH-01..04)
- PostgreSQL + Drizzle schema; `project_data` JSONB is the canonical newsletter state (SAVE-01)
- GrapesJS save/load wired to a real server API — load restores the canvas from project JSON, **never** re-parsed from MJML (SAVE-02)
- Newsletter list + create-new + duplicate-as-starting-point (SAVE-03, SAVE-04)
- Image upload stored server-side, served from an absolute, public, **unauthenticated** HTTPS URL (IMG-01)
- Curated asset library panel: pick brand assets + uploaded images, insert into image blocks (IMG-02, IMG-03)

App shell (login page, newsletter dashboard/list, asset library) is built with **shadcn/Tailwind** per `styling.md`.

**Out of scope (deferred to later phases):**
- Rename/delete newsletters → **Phase 4** (SAVE-05)
- Autosave → **Phase 4** (SAVE-06); Phase 2 uses an **explicit Save button**
- Version history / restore → **Phase 4** (SAVE-07). Note: Phase 2 *does* add a `version`/`updatedAt` column for stale-save detection (see D-04), but no history-browsing UI.
- Full 6-block branded library, Style Manager restriction, raw-HTML removal → **Phase 3**
- Preview UI, HTML export/download, mj-head injection → **Phase 4**
- Real-time co-editing, roles/RBAC, in-app user management, public signup, S3 storage → **v2 / out of scope**

⚠ **PHASE-2 EXECUTION GATE (carried from STATE.md — do NOT skip):**
The load-bearing `grapesjs@0.22.16` + `grapesjs-mjml@1.0.8` runtime compatibility is still **unproven**. Before *executing* Phase 2, a human must confirm at `localhost:5173` (`cd app/server && npm run dev`; `cd app/client && npm run dev`) that the editor **MOUNTS** and **BLOCKS DROP**. Discussion/planning may proceed now; the planner/executor MUST treat this human runtime check as a prerequisite. See `01-VERIFICATION.md` + `CLIENT-RENDER-GATE.md`.

</domain>

<decisions>
## Implementation Decisions

### Newsletter Ownership & Visibility
- **D-01:** **Team-shared workspace.** Every authenticated user sees, opens, and edits **all** newsletters in the dashboard list — the list query is NOT scoped to the current user. `userId` is recorded only as the **creator** (provenance), not as an access boundary. Matches a Mailchimp-style shared team workspace and the "multiple internal users each manage newsletters" intent.

### Asset Library & Uploads (IMG-02, IMG-03)
- **D-02:** Library = **pre-seeded DDROIDD brand assets** (the existing files in `assets/` — logo, hero, team photos, signature) **+ one shared upload pool**. All team uploads land in the same shared pool, visible to everyone, and appear **together with** the brand assets in the picker. Distinguish brand vs uploaded with a `source`/`category` flag on the asset row so brand assets can be marked/grouped. Consistent with the team-shared model (D-01).

### Account Provisioning (AUTH)
- **D-03:** **Backend-seeded accounts only.** A fixed set of DDROIDD accounts is seeded server-side; **no in-app user management UI**, no roles/RBAC (all users are equal — consistent with D-01 team-shared). Adding a user = a dev runs the seed. Seed must include at least `sorin.vieriu@ddroidd.com`; the full team list is supplied at execution time. (Seed **mechanism** — script vs migration vs raw SQL — is Claude's discretion.)

### Concurrency (introduced by D-01 team-shared)
- **D-04:** **Optimistic concurrency on save.** Because two users can open the same newsletter, the save request carries the `version`/`updatedAt` it loaded; if the server has a newer one, reject with **409** and surface "a newer version exists — reload." No silent last-write-wins. Requires a `version` (or `updatedAt`) column on the newsletters table. (Full version-history browsing/restore stays Phase 4.)

### Save UX
- **D-05:** **Explicit Save button + dirty-state tracking.** Track unsaved changes; the Save button reflects dirty state; **warn before navigating away** from the editor route with unsaved work. Autosave is explicitly Phase 4 — do not build it here.

### Sessions
- **D-06:** httpOnly auth cookie **maxAge ≈ 7 days**. After successful login → redirect to the **dashboard**; expired/unauthenticated requests → redirect to **`/login`** (API returns 401, never a redirect-with-data leak per `security.md`/AUTH-04).

### Image Upload Rules (product side of IMG-01)
- **D-07:** Accept **png / jpg / gif / webp**, cap file size at **~5MB**, and have **sharp re-encode + downsize** anything wider than ~**600px** to an email-safe width (protects email weight and render). Magic-byte verification, server-generated storage key, and path-traversal protection per `security.md` remain mandatory.

### App Shell / Visual Direction
- **D-08:** Build the shell (login, dashboard/newsletter list, asset library) with **shadcn + Tailwind** (`styling.md`). Visual target is a Mailchimp/ActiveCampaign-style builder dashboard, reference: the **"Bubblee Email Builder Dashboard"** Dribbble shot (see canonical refs). **The detailed visual contract is `/gsd:ui-phase 2`'s job, not this CONTEXT.** Keep Phase 2 functional; do NOT pull in analytics/campaign-stat widgets shown in such dashboards (out of scope per REQUIREMENTS).

### Claude's Discretion
- Seed mechanism (script / migration / SQL) and exact seeded-account list beyond the known user.
- Local Postgres setup for dev (docker-compose is the obvious reproducible default).
- Exact Drizzle table shapes, column names, FK layout, and migration file structure.
- API route/service decomposition, zod schema placement, CSRF token mechanism (double-submit vs per-session) per `security.md`.
- `lib/api` wrapper internals; react-router route tree; dirty-state tracking implementation in the editor hook.
- Storage abstraction shape (local disk now, S3 swappable later per STORE-01).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project rules (authoritative — these PRE-DECIDE most of the "how" for this phase)
- `.claude/rules/security.md` — httpOnly-cookie JWT, cookie flags, **CSRF** (required because JWT is a cookie), CORS-with-credentials allowlist, bcrypt ≥12, **image-upload hardening** (magic bytes, size cap, filename sanitize, sharp re-encode), zod validation, secrets. **Most load-bearing ref for this phase.**
- `.claude/rules/backend-express.md` — thin routes / logic-in-services, zod at boundary, Express 5 async error handling, Drizzle schema/`db` client placement, and the concrete v1 Save / Load / Upload data flows.
- `.claude/rules/api-client.md` — typed `lib/api` wrapper, `credentials:'include'`, CSRF header on mutations, multipart upload variant.
- `.claude/rules/grapesjs.md` — **project JSON is canonical; never re-parse MJML** (SAVE-02 backbone), load via `loadProjectData(json)`, editor wiring belongs in a hook.
- `.claude/rules/react-patterns.md` — Vite SPA (no Next.js), react-router, flat folder convention, editor state owned by GrapesJS (don't mirror into React).
- `.claude/rules/styling.md` — shadcn + Tailwind for the shell; CLI-managed `components/ui`; email is NOT styled with Tailwind.
- `.claude/rules/forms.md` — react-hook-form + Zod + shadcn Form primitives (login form, rename later).
- `.claude/rules/versions.md` + `CLAUDE.md` — LOCKED version triple + Drizzle/pg/express/mjml pins; do not bump.
- `.claude/rules/component-patterns.md`, `code-style.md`, `typescript.md`, `performance.md`, `testing.md`, `gotchas.md` — conventions (useReducer thresholds, `type` over `interface`, `@/*` alias, lazy-load editor, what to test, common traps).
- `.claude/rules/no-commit.md` — never auto-commit; output changed files + suggested message.

### Project intent & constraints
- `.planning/PROJECT.md` — Key Decisions table (Drizzle over Prisma; project JSON canonical; internal-team auth; export-only; image upload + curated library; team-shared intent).
- `.planning/REQUIREMENTS.md` — AUTH-01..04, SAVE-01..04, IMG-01..03 (this phase); SAVE-05/06/07 (Phase 4); v2 (COLLAB/STORE/PERS/AI); "Out of Scope" table.
- `.planning/ROADMAP.md` §"Phase 2" — goal + 5 success criteria (the exit gate).
- `.planning/STATE.md` — Accumulated Decisions + the **PHASE-2 GATE** (human runtime check) + Deferred Items.
- `.planning/phases/01-feasibility-spike-editor-core/01-CONTEXT.md` — prior decisions (D-01 spike-as-foundation, `/app` monorepo layout, hero+projects blocks, D-05 PowerShell render gate).

### Phase 1 gate artifacts (the unverified-runtime blocker)
- `.planning/phases/01-feasibility-spike-editor-core/01-VERIFICATION.md` — viable-pending-human-runtime-check.
- `.planning/phases/01-feasibility-spike-editor-core/CLIENT-RENDER-GATE.md` — deferred client-render verification.

### Existing code to build on
- `app/server/src/index.ts` + `app/server/src/routes/compile.ts` — Express 5 app (CORS→:5173, 1mb json limit, `/api/compile`). Phase 2 adds auth/newsletters/assets/upload routes + helmet + cookie-parser + CSRF here.
- `app/client/src/` — App.tsx (editor), `lib/editorConfig.ts`, `blocks/` (BLOCK_DEFAULTS, hero, projects). Phase 2 adds router, login, dashboard, `lib/api`, asset library, save/load wiring.
- `assets/` (repo root) — DDROIDD brand assets to pre-seed into the curated library (D-02).

### Design reference (for /gsd:ui-phase 2, NOT a Phase 2 functional requirement)
- Dribbble: `https://dribbble.com/shots/26894693-Bubblee-Email-Builder-Dashboard` — "Bubblee Email Builder Dashboard" visual direction for the shell. **User-provided screenshot still pending** — attach during UI-SPEC.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/server/src/index.ts`: existing Express 5 + CORS + json-limit setup — extend, don't replace. CORS allowlist + `credentials:true` and helmet/cookie-parser go here (security.md).
- `app/server/src/routes/compile.ts`: pattern for a mounted router under `/api` — mirror for auth/newsletters/assets/upload.
- `app/client/src/lib/editorConfig.ts` + `blocks/`: editor already configured; Phase 2 wires its `getProjectData()`/`loadProjectData()` to the new API instead of localStorage.
- `assets/` brand files: the seed source for the curated library (D-02).
- `mjml@4.18.0` compile path: untouched by Phase 2 (export/preview is Phase 4).

### Established Patterns
- Project JSON canonical, never re-parse MJML (grapesjs.md) — the SAVE-01/02 contract.
- Thin routes, logic in services; all DB (Drizzle) access in services, never in route files (backend-express.md).
- Typed `lib/api` wrapper with `credentials:'include'` + CSRF header; no scattered raw fetch (api-client.md).
- Two styling worlds: shadcn/Tailwind for shell, MJML for email — never cross them (gotchas.md).

### Integration Points
- **Save:** editor `getProjectData()` → POST `/api/newsletters/:id` (with loaded version, D-04) → Drizzle persists `project_data` JSONB.
- **Load:** GET `/api/newsletters/:id` → return `project_data` verbatim → client `loadProjectData(json)`.
- **List/Create/Duplicate:** GET `/api/newsletters` (team-shared, unscoped) / POST new (blank) / POST duplicate (deep-copy project_data).
- **Upload:** authenticated multipart POST → magic-byte + size check → sharp re-encode/downsize → store on disk → return absolute public HTTPS URL.
- **Asset library:** GET assets (brand + shared uploads) → picker inserts URL into image block.
- **Auth:** login → bcrypt verify → set httpOnly JWT cookie (~7d) → middleware guards protected routes (401 on miss).

</code_context>

<specifics>
## Specific Ideas

- "Make everything dynamic — create a newsletter like Mailchimp / ActiveCampaign." The dynamic builder IS the GrapesJS editor (Phase 1 done, full blocks Phase 3); Phase 2 makes the **surrounding workflow** dynamic — log in, see a live shared list, create/duplicate, save to server, manage shared assets.
- Dashboard should look like the "Bubblee Email Builder Dashboard" Dribbble shot; build the shell with shadcn. (Visual fidelity → UI-SPEC.)
- Team-shared everything: shared newsletter list, shared asset pool, equal users — a single internal team workspace, not per-user silos.

</specifics>

<deferred>
## Deferred Ideas

- **Roles / in-app user management (admin vs editor)** — raised under account provisioning; maps to **COLLAB-01 (v2)**. Phase 2 stays flat/equal users, backend-seeded.
- **Real-time co-editing** — the collision discussion confirmed v2 (**COLLAB-02**); Phase 2 uses optimistic-concurrency 409 instead.
- **Dashboard analytics / campaign-stat widgets** — common in Mailchimp-style dashboards but **out of scope** (this is an authoring tool, not an ESP). Note for UI-SPEC so the Bubblee reference isn't copied wholesale.
- **Asset deletion/management UI** — not in IMG requirements; revisit if needed (likely Phase 4 polish).

</deferred>

---

*Phase: 2-Auth + DB + Image Foundation*
*Context gathered: 2026-06-25*
