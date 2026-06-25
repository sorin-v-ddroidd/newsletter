---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript, React, and Node.js development.
triggers:
  - "coding standards"
  - "best practices"
  - "code quality guidelines"
allowed-tools: [Read, Write, Edit, Bash]
---

# Coding Standards — Quick Checklist

For detailed patterns and examples: read `references/full-guide.md`

---

## Naming
- [ ] Variables and functions: descriptive verb-noun (`fetchMarketData`, `isUserAuthenticated`)
- [ ] No single-letter names or abbreviations (`q`, `flag`, `x`)
- [ ] Components: PascalCase. Hooks: `useCamelCase`. Files: match export name

## Immutability
- [ ] Always use spread: `{ ...obj, key: value }` and `[...arr, item]`
- [ ] Never mutate objects or arrays directly (`obj.key =` or `arr.push()`)
- [ ] State updates via functional form when depending on previous value: `setState(prev => ...)`

## Error Handling
- [ ] All async functions have try/catch with meaningful error messages
- [ ] Errors logged server-side; generic messages shown to users
- [ ] `if (!condition) return` early — avoid deep nesting

## Async/Await
- [ ] Use `Promise.all()` for independent parallel fetches
- [ ] Never `await` in a loop when calls are independent

## TypeScript
- [ ] Strict mode — no `any`, no `@ts-ignore` without a documented reason
- [ ] `import type` for type-only imports
- [ ] Optional chaining always: `user?.profile?.name ?? 'fallback'`
- [ ] API response types wrapped in `Readonly<{ ... }>`
- [ ] Path aliases only — never relative paths going up more than one level

## React
- [ ] `memo` + `displayName` on pure components with stable props
- [ ] `useCallback` for functions passed as props; `useMemo` for expensive computations
- [ ] `form.watch(['field'])` — never bare `form.watch()` (re-renders on every keystroke)
- [ ] No `setState` passed to children — use callback props (`onSelect`, `onChange`)
- [ ] Always use curly braces on `if` statements, even single-line
- [ ] Use render functions for JSX sub-sections (`renderHeader()`, `renderRow()`)
- [ ] Avoid `else` — check fail condition first and return early

## YellowGrid-Specific Rules
- [ ] Validation: **Yup** schemas in `validation.ts` — not Zod, not inline
- [ ] REST calls: `apiClient` from `@fd-tenant/api` — never raw `fetch`
- [ ] GraphQL: Apollo Client with colocated `.gql` files — never raw `fetch`
- [ ] Path aliases from `tsconfig.base.json` — see `nx-monorepo.md` rule
- [ ] User-visible text: `t('key')` from `useTranslation()` — no hardcoded strings
- [ ] New tables: TanStack Table. New backend calls: TanStack Query v5

## Code Smells to Avoid
- Functions over ~50 lines — split into smaller focused functions
- Nesting deeper than 3 levels — use early returns
- Magic numbers — extract as named constants
- Comments that restate the code — explain *why*, not *what*
