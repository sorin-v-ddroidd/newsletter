# Usage & Deployment

How the **DDROIDD Newsletter Builder** is used by the team and run as an internal tool.

> **Status: target / planned.** This describes the v1 product the roadmap builds toward (`.planning/ROADMAP.md`), not what exists today. The repo currently holds the legacy MJML pipeline (`docs/ARCHITECTURE.md`) plus the GSD planning artifacts. Phase 1 (feasibility spike) is a hard gate before any of the deployment infrastructure below is built. Revise this doc as phases ship.

## What it is

A web app that replaces the developer-in-the-loop newsletter workflow. A non-developer assembles an on-brand, client-safe email by dragging pre-built blocks onto a canvas, editing inline, and exporting production-ready HTML — no code, no developer.

It replaces today's loop: *ask dev → dev hand-edits `src/sections/*.mjml` → `npm run build-pages` → PowerShell-send through Outlook*.

## How a team member uses it

Browser-based — nothing to install per user. Open the internal URL → log in (pre-seeded account; **no public signup**) → newsletter list.

1. **New / duplicate** a newsletter — start blank or clone an existing one.
2. **Drag blocks** onto the canvas — branded sections (hero, projects, hiring, new colleagues, initiatives, disclaimer) and generic blocks (text, image, button, 1/2/3-column, divider, spacer).
3. **Edit inline** — text, links, images (upload or pick from the curated asset library).
4. **Stay on-brand by construction** — colors and fonts are constrained to the approved palette; there is no raw-HTML editor; the style controls exclude anything that breaks Outlook (flexbox, position, box-shadow).
5. **Preview** the compiled email at desktop and mobile widths — same server compile path the export uses, so preview matches what ships.
6. **Export HTML** — download / copy a standalone, client-safe HTML file.
7. **Send it externally** — paste into Outlook or an ESP. **Sending is out of scope**; the builder stops at export.

Work is autosaved (debounced) with version history/restore, so nothing is lost. Each team member manages their own newsletters; the data is shared server-side.

## System shape

Three deployed pieces, set up once, shared by the whole team:

| Piece | What | Notes |
|-------|------|-------|
| **Client** | Vite + React 19 SPA (GrapesJS editor) | Static assets; served by the server or a static host |
| **API** | Express 5 (Node) | Auth, save/load, MJML compile, image upload — one process |
| **Database** | PostgreSQL | Users, newsletters (canonical state = GrapesJS project JSON in JSONB), asset metadata |
| **Image storage** | Local disk (v1) → S3-compatible (later) | Files served from a **public, unauthenticated HTTPS URL** — recipients' mail clients must fetch them without login |

Canonical persisted state is the GrapesJS **project JSON**, never re-parsed from MJML. MJML is generated only at export/preview time and compiled server-side with `mjml@4.18.0`, with a fixed `mj-head` injected. (See `.claude/rules/grapesjs.md`, `.claude/rules/mjml-email-safety.md`.)

## Deployment

Internal scale is small (< 50 users) — no scaling or multi-tenant concern.

- **Host:** a single VM or container behind the company network/VPN, or a small cloud host. Reverse proxy (nginx/Caddy) terminates **HTTPS** in front of the Express process.
- **HTTPS is required**, not optional: the auth cookie is `Secure`, and image URLs must be HTTPS for mail clients to load them.
- **Env config** via `dotenv`: DB URL, JWT signing key, allowed CORS origin, asset base URL. Secrets stay server-side; only `VITE_`-prefixed vars reach the browser. (See `.claude/rules/security.md`.)
- **Dev split:** client at `:5173`, API at `:3000`, CORS with credentials. In production the client is built static and the API serves under one origin (or a configured CORS allowlist).

## Authentication & access

- Pre-seeded user accounts — no self-registration flow in v1.
- Login returns a JWT in an **httpOnly cookie**; session survives refresh; logout from any page.
- Unauthenticated requests to the editor or API are rejected.
- Mutating requests carry a CSRF token (the cookie is auto-sent → CSRF-exposed). (See `.claude/rules/security.md`.)

## Operating burden (small, but real)

- **Seed / manage accounts** — add team members, reset passwords (bcrypt-hashed).
- **Back up PostgreSQL** — the newsletters live there; this is the thing to protect.
- **Keep image storage durable** and its asset URLs publicly reachable over HTTPS.
- **Renew TLS** on the reverse proxy.

## Platform constraint

The **builder is OS-independent** (browser-based) — the whole point versus today's Windows-only PowerShell scripts. The one exception is the **email render gate** (`verify-email-render` skill): verifying real rendering in Outlook + Gmail still needs Windows + Outlook. That's a dev/QA-time check (`QuickEmailTest.ps1` / `EmailTester.ps1`), not something end users touch.

## References
- `.planning/PROJECT.md` — intent, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements (AUTH/SAVE/IMG/EXPORT/EDIT/BLOCK)
- `.planning/ROADMAP.md` — the 4-phase build order
- `.claude/rules/` — security, grapesjs, mjml-email-safety, backend-express, versions
