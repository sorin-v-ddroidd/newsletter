# Full Guide: Nuqs + TypeScript + Zod

Deep-dive reference. Start with `SKILL.md` for the quick version.

---

## Parser Selection Guide

| Scenario | Parser to use |
|---|---|
| Free-text string | `parseAsString` |
| Integer (page, count) | `parseAsInteger` |
| Float | `parseAsFloat` |
| Boolean flag | `parseAsBoolean` |
| Fixed set of string values | `parseAsStringLiteral(VALUES)` |
| Comma/bracket-separated list | `parseAsArrayOf(T)` |
| Date from ISO string | `parseAsIsoDateTime` |
| Complex object / cross-boundary validation | `createParser` with Zod |

---

## Pattern 1 — String Literals (Enums)

```typescript
"use client";
import { parseAsStringLiteral, useQueryState } from "nuqs";

const TRIP_STATUSES = ["planning", "active", "completed", "archived"] as const;

export function useTripFilters() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(TRIP_STATUSES).withDefault("planning")
  );
  return { status, setStatus };
}
```

The `as const` tuple is required — without it TypeScript widens the type to `string[]` and you lose inference.

---

## Pattern 2 — Multiple Params with `useQueryStates`

```typescript
"use client";
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringLiteral } from "nuqs";

const SORT_OPTIONS = ["price-asc", "price-desc", "rating", "newest"] as const;

export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      sort:     parseAsStringLiteral(SORT_OPTIONS).withDefault("newest"),
      q:        parseAsString.withDefault(""),
      page:     parseAsInteger.withDefault(1),
      category: parseAsString, // nullable — no default
    },
    {
      history: "push",    // "push" adds a history entry; "replace" avoids back-button per keystroke
      shallow: false,     // false = triggers RSC data fetching
    }
  );

  return {
    filters,
    setFilters,
    handleSearch: (q: string) => setFilters({ q, page: 1 }),
    clearFilters: () => setFilters({ sort: null, q: null, page: null, category: null }),
  };
}
```

---

## Pattern 3 — Zod Parser (Complex Validation)

Use when you need cross-boundary type safety, nested objects, or detailed error handling.

```typescript
import { z } from "zod";
import { createParser, useQueryState } from "nuqs";

// 1. Schema
const SortSchema = z.enum(["price-asc", "price-desc", "rating", "newest"]);
type SortOption = z.infer<typeof SortSchema>;

// 2. Parser
export const sortParser = createParser({
  parse: (value: string | null) => {
    const result = SortSchema.safeParse(value);
    return result.success ? result.data : "newest"; // graceful fallback
  },
  serialize: (v: SortOption) => v,
});

// 3. Usage
const [sort, setSort] = useQueryState("sort", sortParser);
// sort: SortOption — fully typed
```

**Complex object example:**

```typescript
const PriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().max(10000),
});
type PriceRange = z.infer<typeof PriceRangeSchema>;

const DEFAULT: PriceRange = { min: 0, max: 10000 };

export const priceRangeParser = createParser<PriceRange>({
  parse: (value) => {
    if (!value) return DEFAULT;
    try {
      const r = PriceRangeSchema.safeParse(JSON.parse(value));
      return r.success ? r.data : DEFAULT;
    } catch {
      return DEFAULT;
    }
  },
  serialize: (v) => JSON.stringify(v),
});

// URL: ?price={"min":100,"max":500}
const [priceRange, setPriceRange] = useQueryState("price", priceRangeParser);
```

---

## Pattern 4 — Array Parameters

```typescript
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

export function useTagFilter() {
  const [tags, setTags] = useQueryState(
    "tags",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  return { tags, toggleTag, clearTags: () => setTags(null) };
}

// URL: ?tags=travel&tags=food
```

---

## Pattern 5 — Server-Side (Next.js 15)

In Next.js 15, `searchParams` is a `Promise`. The server page never imports nuqs — it reads the raw string values directly.

```typescript
// app/trips/page.tsx — Server Component
interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function TripsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const status = params.status ?? "planning";
  const page   = params.page ? Number(params.page) : 1;

  const trips = await getTrips({ status, page });
  return <TripsList trips={trips} />;
}
```

The client hook and server page read the same URL params — they stay in sync without any extra wiring.

---

## Pattern 6 — Debounced Search

Avoid writing to the URL on every keystroke by keeping local state for the input value.

```typescript
"use client";
import { useQueryState, parseAsString } from "nuqs";
import { useEffect, useState } from "react";

export function DebouncedSearch() {
  const [search, setSearch] = useQueryState("q", parseAsString);
  const [local, setLocal]   = useState(search ?? "");

  useEffect(() => {
    const id = setTimeout(() => setSearch(local || null), 500);
    return () => clearTimeout(id);
  }, [local, setSearch]);

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Pattern 7 — Form Integration

```typescript
"use client";
import { useQueryState, parseAsString } from "nuqs";

export function SearchForm() {
  const [search, setSearch] = useQueryState("q", parseAsString);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    setSearch((data.get("search") as string) || null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="search" defaultValue={search ?? ""} placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  );
}
```

---

## Shallow Routing Reference

| Option | Effect |
|---|---|
| `shallow: true` (default) | URL updates client-side only — Server Components do not re-render |
| `shallow: false` | URL change triggers a full Next.js navigation — Server Components re-fetch |
| `history: "push"` | Adds a browser history entry (back button works) |
| `history: "replace"` | Replaces current history entry (no back-button entry per filter change) |

Use `shallow: false` whenever the server page reads `searchParams` to filter data.
Use `history: "replace"` for search-as-you-type to avoid polluting history.

---

## Troubleshooting

### `useQueryState must be used in a client component`

Add `"use client"` as the **very first line** of the file, before all imports.

### URL doesn't update when calling the setter

`NuqsAdapter` is missing. Wrap your app root:

```typescript
// components/providers.tsx
"use client";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <NuqsAdapter>{children}</NuqsAdapter>
);
```

### TypeScript error: argument not assignable to enum type

Use `parseAsStringLiteral` with a `const` tuple, not a plain `string[]`:

```typescript
// ✅
const STATUSES = ["active", "inactive"] as const;
parseAsStringLiteral(STATUSES)

// ❌
const STATUSES = ["active", "inactive"];
parseAsStringLiteral(STATUSES) // type error — string[] not assignable
```

### Server component doesn't re-fetch when params change

Set `shallow: false`:

```typescript
useQueryStates({ status: statusParser }, { shallow: false });
```

### Default value ignored, param returns `null`

Chain `.withDefault()` on the parser:

```typescript
parseAsInteger.withDefault(1) // always number, never null
parseAsInteger               // number | null — null when param is absent
```

### Clearing a param leaves `?status=` in the URL (empty string)

Set to `null`, not `""`:

```typescript
setStatus(null);  // removes ?status from URL
setStatus("");    // leaves ?status= in URL (empty string, not removed)
```
