# Rules Index

Rules for the **DDROIDD Newsletter Builder** — a Vite + React 19 SPA + Express 5 + GrapesJS/grapesjs-mjml + Drizzle/PostgreSQL internal tool. Stack and intent live in `.planning/` and the root `CLAUDE.md`.

## Domain (the bulletproofing — read these before any email/editor work)

| File | Covers |
|------|--------|
| `mjml-email-safety.md` | Outlook/Gmail/Yahoo constraints, mj-spacer, inline CSS, white-default-text, preview↔export parity, real-client verification |
| `grapesjs.md` | Project-JSON canonical (never re-parse MJML), BLOCK_DEFAULTS (no mj-attributes/include/style), `pluginsOpts` string-key, editor guardrails, locking |
| `versions.md` | The LOCKED version triple + what-not-to-use; canonical tables in CLAUDE.md |
| `security.md` | httpOnly-cookie JWT, **CSRF**, CORS-with-credentials, bcrypt, **image-upload hardening**, zod validation, secrets |

## Architecture

| File | Covers |
|------|--------|
| `react-patterns.md` | Vite SPA (no Next.js/`'use client'`), react-router, the one flat folder convention, state management |
| `api-client.md` | Typed `lib/api` fetch wrapper, `credentials: 'include'`, CSRF header, uploads |
| `backend-express.md` | Thin routes / logic-in-services, zod at the boundary, Express 5 error handling, the v1 data flows |
| `component-patterns.md` | Custom hooks, useReducer, compound components, HOC-vs-hooks, Suspense |
| `forms.md` | react-hook-form + Zod + shadcn Form primitives (kept lightweight) |
| `styling.md` | Tailwind + shadcn/ui on Vite; app-shell vs email are separate worlds |
| `performance.md` | Named imports, `React.lazy` code-split (the editor is the split point) |

## Conventions

| File | Covers |
|------|--------|
| `code-style.md` | `type` over `interface`, destructuring, `const`, composition, render functions |
| `typescript.md` | Strict mode, `@/*` → `app/client/src/*`, shared client/server types |
| `jsdoc.md` | Document intent where non-obvious (calibrated down for an internal tool) |
| `testing.md` | Vitest only (no Storybook); test compile, round-trip, services, routes, schemas |
| `gotchas.md` | Common traps — read before writing any code |
| `plan-before-implement.md` | Route through GSD; reach shared understanding before code |
| `no-commit.md` | Never auto-commit; output changed files + suggested message |
