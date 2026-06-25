# TypeScript

Strict mode always on. Never use `@ts-ignore` or `any` without a documented reason.

## Rules
- Path alias `@/*` maps to `app/client/src/*` (client) — configure in both `tsconfig.json` and `vite.config.ts`. Never use relative paths that traverse more than one level.
- `import type` for type-only imports
- Optional chaining always: `user?.profile?.name ?? 'fallback'`
- Prefer `React.ComponentProps<typeof X>` to infer prop types before defining new types
- `type` over `interface` (see `code-style.md`)
- TypeScript end-to-end — same language client + server. Share request/response types from one place so the API contract can't drift (see `api-client.md`).
- Do not silence the compiler. Fix type errors; no `@ts-ignore`/`any` without a documented reason.
