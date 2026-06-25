# React Patterns

## This is a Vite + React 19 SPA

A client-side single-page app built with **Vite 8** + **React 19** + `@vitejs/plugin-react`. There is **no Next.js, no App Router, no Server Components, and no `'use client'`** — every component is a client component. Do not add `'use client'` directives or import from `next/*`.

The app talks to a separate **Express** API (see `backend-express.md`, `api-client.md`).

## Routing

Client-side routing with **react-router** (`react-router-dom`). Use `<Link>` for navigation and `useNavigate()` for programmatic routing. Guard authenticated routes with a route wrapper that checks session and redirects to `/login` (AUTH-04).

## Component / folder structure (the one convention — all rules assume this)

```
app/client/src/
  components/ui/     shadcn/ui primitives — CLI-managed, do not hand-edit
  components/        app feature components (NewsletterList, Toolbar, LoginForm, …)
  editor/            GrapesJS config: blocks/, BLOCK_DEFAULTS, plugin setup, locking
  pages/             route-level screens
  hooks/             shared custom hooks (use* prefix)
  lib/               api client, utils (cn), config
```

- **No atoms/molecules/organisms hierarchy.** This is an internal tool — keep it flat. A feature component is just a file (or a folder when it has co-located hook/types).
- A component grows a folder only when it needs co-located `hooks/`, `types.ts`, etc. — not by default.
- Path alias `@/*` → `app/client/src/*` (see `typescript.md`).

## State management

| Scenario | Solution |
|----------|----------|
| Local UI state | `useState` / `useReducer` (see `component-patterns.md`) |
| Cross-component UI | `useContext` |
| Server data (newsletters, assets) | fetch via the typed API client; cache with TanStack Query if/when refetch coordination is needed — not before |
| GrapesJS editor state | owned by GrapesJS itself; persisted as project JSON (see `grapesjs.md`) — do not mirror it into React state |

## Rules

- `memo` + `displayName` only on pure components with a measured re-render problem — not by default.
- Context over prop-drilling beyond 2 levels.
- No `setState` passed to children — use callback props (`onSelect`, `onChange`).
- Keep effects for genuine side effects (subscriptions, imperative editor wiring); never for derived state (see `component-patterns.md`).
