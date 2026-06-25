# Phase 2: Auth + DB + Image Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-25
**Phase:** 02-auth-db-image-foundation
**Areas discussed:** Newsletter visibility, Asset library + uploads, User provisioning, Concurrent edit collisions, Save UX, Session lifetime, Image upload constraints

---

## Newsletter Visibility (D-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Team-shared (all) | Everyone sees/opens/edits all newsletters; userId = creator only; list unscoped | ✓ |
| Private per-user | Each user sees only own newsletters; list scoped by userId | |
| Shared, creator-owned edits | All see all; only creator edits/deletes; others duplicate | |

**User's choice:** Team-shared (all)
**Notes:** Matches Mailchimp-style shared team workspace. Shaped subsequent asset/account answers.

---

## Asset Library + Uploads (D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Brand assets + shared uploads | /assets pre-seeded + shared upload pool, shown together | ✓ |
| Brand assets only, uploads separate | Curated = brand only; uploads in separate "My uploads" | |
| Everything is one shared library | Flat shared lib, no brand vs upload distinction | |

**User's choice:** Brand assets + shared uploads
**Notes:** Use a source/category flag to mark brand vs uploaded within the shared picker.

---

## User Provisioning (D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Backend-seeded only | Fixed seeded accounts, no in-app user mgmt, no roles | ✓ |
| Seeded + in-app admin | Seeded + admin screen to add/remove users + roles | |
| Self-service first-run | First visit creates account, then invites — signup-like | |

**User's choice:** Backend-seeded only
**Notes:** No roles/RBAC — all users equal (consistent with team-shared). Seed mechanism = Claude's discretion; must include sorin.vieriu@ddroidd.com.

---

## Concurrent Edit Collisions (D-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Warn on stale save | Optimistic concurrency: 409 if server has newer version | ✓ |
| Last-write-wins | No version check; silent overwrite | |

**User's choice:** Warn on stale save
**Notes:** Requires version/updatedAt column. Surfaced by the team-shared decision (two users, same newsletter). Full history/restore remains Phase 4.

---

## Save UX (D-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Dirty indicator + leave warning | Track dirty state, Save reflects it, warn on navigate-away | ✓ |
| Save button only | Plain Save button, no dirty tracking | |

**User's choice:** Dirty indicator + leave warning
**Notes:** Explicit Save in Phase 2; autosave is Phase 4.

---

## Session Lifetime (D-06)

| Option | Description | Selected |
|--------|-------------|----------|
| 7 days | Cookie maxAge ~7d; login→dashboard; expired→/login | ✓ |
| 30 days | Longer sessions | |
| 1 day | Tighter, daily re-login | |

**User's choice:** 7 days

---

## Image Upload Constraints (D-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Common formats + auto-resize | png/jpg/gif/webp, ~5MB cap, sharp downsize >600px | ✓ |
| Common formats, no resize | Same formats/cap, re-encode but keep dimensions | |
| You decide | Defer to planner + security.md defaults | |

**User's choice:** Common formats + auto-resize
**Notes:** Magic-byte verify, server-generated key, traversal protection (security.md) remain mandatory regardless.

---

## App Shell / Visual Direction (D-08)

Not a multiSelect decision — captured from the user's freeform steer: "make everything dynamic like Mailchimp/ActiveCampaign," build the dashboard with shadcn, styled after the "Bubblee Email Builder Dashboard" Dribbble shot (https://dribbble.com/shots/26894693-Bubblee-Email-Builder-Dashboard). User will attach a screenshot. Scope-marked: detailed visual contract → `/gsd:ui-phase 2`; Phase 2 stays functional; no analytics/campaign widgets (out of scope).

---

## Claude's Discretion

- Seed mechanism (script/migration/SQL) + full seeded-account list beyond the known user.
- Local Postgres dev setup (docker-compose default).
- Drizzle table shapes, column names, FK layout, migration structure.
- API route/service decomposition, zod placement, CSRF token mechanism.
- `lib/api` internals, react-router tree, dirty-state implementation, storage abstraction shape.

## Deferred Ideas

- Roles / in-app user management → COLLAB-01 (v2).
- Real-time co-editing → COLLAB-02 (v2); replaced here by optimistic-concurrency 409.
- Dashboard analytics/campaign-stat widgets → out of scope (authoring tool, not ESP).
- Asset deletion/management UI → not in IMG requirements; revisit Phase 4.
