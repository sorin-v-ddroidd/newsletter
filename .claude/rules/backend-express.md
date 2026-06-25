# Backend (Express)

The server is **Express 5** + **Drizzle ORM / PostgreSQL**, TypeScript, run with `tsx`. There are **no Next.js Server Actions** here — that pattern does not exist in this stack. The layering principle from a Server-Actions world still applies, mapped onto Express.

## Thin routes, logic in services

**Routes/controllers orchestrate; services hold the work.** A route handler should read like an outline.

A route handler does only:
1. Validate input (zod) at the boundary.
2. Call one or more service functions.
3. Map the result to an HTTP response (status + body).
4. Pass errors to the error middleware (`next(err)` or just throw — Express 5 forwards async throws).

A route handler must **not** contain business logic, raw SQL, multi-step orchestration, or `mjml` compile calls inline. Keep handlers ≲ 20 lines.

```ts
// routes/newsletters.ts — thin
router.post('/', requireAuth, validate(createNewsletterSchema), async (req, res) => {
  const newsletter = await createNewsletter(req.user.id, req.body);
  res.status(201).json(newsletter);
});

// services/newsletters.ts — the work (Drizzle)
import { db } from '@/lib/db';
import { newsletters } from '@/db/schema';

export async function createNewsletter(userId: string, input: CreateNewsletterInput) {
  const [row] = await db
    .insert(newsletters)
    .values({ userId, title: input.title, projectData: input.projectData })
    .returning();
  return row;
}
```

## Service layer rules

- Services are pure-ish: given inputs, do the work; isolated, documented side effects (DB, filesystem, compile).
- Services **never** touch `req`/`res` and never set status codes — they return data or throw typed errors.
- Anything reused in 2+ routes, or testable in isolation (compile, auth, storage), is a service.
- All DB access (Drizzle queries) lives in services, never in route files. Routes never import `db` or the schema directly.

## Suggested layout (`app/server/src/`)

```
routes/        thin handlers, grouped by resource (auth, newsletters, assets, compile)
services/      business logic (newsletters, auth, compile, storage)
middleware/    requireAuth, validate(schema), error handler, csrf
db/            schema.ts (Drizzle table definitions), migrations/ (drizzle-kit output)
lib/           db (drizzle client), mjml compile wrapper, config
```

Drizzle specifics: define tables in `db/schema.ts` (use `jsonb()` for `newsletters.project_data`); the typed `db` client lives in `lib/db.ts` over the `pg` driver; generate + apply migrations with `drizzle-kit generate` / `migrate` and commit the migration files. Infer row types from the schema (`typeof newsletters.$inferSelect`) — no separate generated client.

## Validation

- Every route validates input with **zod** via a `validate(schema)` middleware before the handler runs. No handler trusts `req.body`. (See `security.md`.)
- Define schemas next to the route or in a shared `schemas/` module; infer the input type with `z.infer`.

## Errors

- Express 5 forwards rejected async handlers to the error middleware — no `try/catch` boilerplate needed in handlers; throw typed errors and let the central handler map them to status codes.
- One central error middleware maps known error types → status + safe JSON; never leak stack traces or internal messages to the client.

## The concrete v1 data flows (anchor to these, don't over-build)

- **Save:** client POSTs `editor.getProjectData()` → service persists `project_data` JSONB. Project JSON is canonical (see `grapesjs.md`).
- **Load:** GET → return `project_data` JSON verbatim → client calls `loadProjectData()`.
- **Compile/export:** client POSTs the MJML string (`editor.getHtml()`) → `/api/compile` service injects fixed `mj-head` + runs `mjml@4.18.0` → returns client-safe HTML.
- **Upload:** authenticated POST → harden (magic-byte/size/sanitize/sharp) → store → return absolute public HTTPS URL.

## Cross-references
- `security.md` — auth middleware, CSRF, CORS-with-credentials, upload hardening.
- `mjml-email-safety.md` — the compile path and mj-head injection contract.
- `versions.md` — Express 5 / Drizzle / mjml 4.18 are the backend pins.
