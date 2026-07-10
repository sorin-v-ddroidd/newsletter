# Gotchas & Habits

Consult before writing code. The big domain traps live in `mjml-email-safety.md` and `grapesjs.md` — read those before touching blocks or compile.

## This is a Vite SPA — not Next.js
- **No `'use client'`** anywhere. No Server Components, no `next/*` imports. (Inherited rules from a Next.js project don't apply.)
- Env vars reach the browser only with a `VITE_` prefix (`import.meta.env.VITE_API_URL`). Secrets stay unprefixed and server-side.

## Two styling worlds — don't cross them
- **App shell** = Tailwind + shadcn (`styling.md`).
- **Email** = MJML compiled to HTML (`mjml-email-safety.md`). Never style the email with Tailwind; never put MJML constraints on the shell.

## GrapesJS
- Persist `getProjectData()` JSON — **never** reload from the MJML string (`grapesjs.md`).
- Plugin options: use `usePlugin(grapesjsMjml, opts)` — `pluginsOpts` with a string key while passing the plugin as a function is a silent no-op (options never reach the plugin; `resetStyleManager` then defaults true and clobbers the email-safe sectors).
- No `mj-attributes` / `mj-include` / `mj-style` inside block content strings.

## Auth / API
- Client fetch needs `credentials: 'include'` or the cookie is dropped → silent 401s.
- JWT is httpOnly — you cannot read it in JS. Don't try.
- Mutations need the CSRF header (`security.md`).

## shadcn/ui
- Run the CLI (`npx shadcn@latest add <c>`) before writing a primitive that may already exist; never hand-edit `components/ui/`.

## Code style
- Curly braces on every `if` — no braceless one-liners.
- Return early, avoid `else` — check the fail condition first.
- No `setState` passed to children — use callback props.

## Before writing code
- Read an existing feature component before creating a new one.
- For anything email-related, re-read `mjml-email-safety.md` + `grapesjs.md` — guessing breaks client rendering.
