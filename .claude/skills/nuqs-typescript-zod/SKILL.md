---
name: nuqs-typescript-zod
description: Master type-safe URL query parameters in Next.js using Nuqs and Zod validation. Use when implementing URL-based state management for filters, pagination, search, tabs, or any UI state that should persist in the URL. Triggers on tasks involving URL query params, filter synchronization, or Next.js state management.
allowed-tools: [Read, Write, Edit, Bash]
---

# Nuqs + TypeScript + Zod — Quick Reference

## Supporting Files

Read these alongside this skill:

- `examples/sample.md` — annotated real example: trip status filters (hook + consumer component)
- `template.md` — boilerplate for a custom filter hook + consumer component
- `references/full-guide.md` — all patterns: parsers, Zod, arrays, forms, debounce, server-side, troubleshooting

For detailed patterns and edge cases: read `references/full-guide.md`

---

## Setup

```bash
npm install nuqs
```

Wrap the app once with `NuqsAdapter`:

```typescript
// components/providers.tsx
"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <NuqsAdapter>{children}</NuqsAdapter>
);
```

---

## Key Rules Checklist

- [ ] Add `"use client"` to every file that calls `useQueryState` / `useQueryStates`
- [ ] Use `parseAsStringLiteral` for enums — never raw `parseAsString` with a cast
- [ ] Always call `.withDefault()` — avoid `null` returns wherever a fallback makes sense
- [ ] Set `null` to remove a param from the URL (not empty string)
- [ ] Set `shallow: false` when server components need to re-fetch on param change
- [ ] Centralise filter logic in a custom hook (e.g. `useProductFilters`) — do not scatter `useQueryState` calls across components
- [ ] Use Zod `createParser` only for complex objects or cross-boundary validation; use built-ins for simple scalars

---

## Skeletons

### Single param

```typescript
"use client";
import { parseAsStringLiteral, useQueryState } from "nuqs";

const STATUSES = ["active", "archived", "draft"] as const;

const [status, setStatus] = useQueryState(
  "status",
  parseAsStringLiteral(STATUSES).withDefault("active")
);
```

### Multiple params

```typescript
"use client";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

const [filters, setFilters] = useQueryStates(
  {
    q:    parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  },
  { history: "replace", shallow: false }
);

// Update multiple at once
setFilters({ q: "hello", page: 1 });

// Clear all
setFilters({ q: null, page: null });
```

### Zod custom parser

```typescript
import { z } from "zod";
import { createParser, useQueryState } from "nuqs";

const SortSchema = z.enum(["price-asc", "price-desc", "rating", "newest"]);
type SortOption = z.infer<typeof SortSchema>;

const sortParser = createParser({
  parse: (value: string | null) => {
    const r = SortSchema.safeParse(value);
    return r.success ? r.data : "newest";
  },
  serialize: (v: SortOption) => v,
});

const [sort, setSort] = useQueryState("sort", sortParser);
```

---

## Built-in Parsers (at a glance)

| Parser | Return type |
|---|---|
| `parseAsString` | `string \| null` |
| `parseAsInteger` | `number \| null` |
| `parseAsFloat` | `number \| null` |
| `parseAsBoolean` | `boolean \| null` |
| `parseAsTimestamp` | `number \| null` |
| `parseAsIsoDateTime` | `Date \| null` |
| `parseAsArrayOf(T)` | `T[] \| null` |
| `parseAsJson` | `any \| null` |
| `parseAsStringLiteral(['a','b'])` | `"a" \| "b" \| null` |

---

## Anti-Patterns

| Avoid | Use instead |
|---|---|
| `useQueryState('status')` with manual cast | `parseAsStringLiteral(STATUSES)` |
| `setStatus("")` to clear | `setStatus(null)` |
| `shallow: true` with RSC data dependencies | `shallow: false` |
| Spread `useQueryState` calls across components | Single custom hook |
| `createParser` for a simple enum | `parseAsStringLiteral` |

---

## After Writing Hooks

Check:
1. `NuqsAdapter` wraps the app root
2. Every file using hooks has `"use client"` as its **first** line (before all imports)
3. Server page props typed as `searchParams: Promise<{ key?: string }>`
4. Params reset to `null` (not `""`) when clearing filters
