# Boilerplate: Custom Filter Hook + Consumer Component

Copy and adapt. Replace `[Domain]`, `[domain]`, and `[THING]` with your names.

---

## `hooks/[domain]/use[Domain]Filters.ts`

```typescript
"use client";

import { parseAsStringLiteral, parseAsString, parseAsInteger, useQueryStates } from "nuqs";

const [THING]_STATUSES = ["active", "inactive", "draft"] as const;

export function use[Domain]Filters() {
  const [filters, setFilters] = useQueryStates(
    {
      status: parseAsStringLiteral([THING]_STATUSES).withDefault("active"),
      q:      parseAsString.withDefault(""),
      page:   parseAsInteger.withDefault(1),
    },
    {
      history: "replace",  // "push" if you want back-button support per filter change
      shallow: false,      // false = server components re-fetch; true = client-only
    }
  );

  const clearFilters = () => setFilters({ status: null, q: null, page: null });

  const handleSearch = (query: string) =>
    setFilters({ q: query, page: 1 }); // reset page when search changes

  return { filters, setFilters, clearFilters, handleSearch };
}
```

---

## `components/[domain]/[Domain]Filters.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { use[Domain]Filters } from "@/hooks/[domain]/use[Domain]Filters";

export function [Domain]Filters() {
  const { filters, setFilters, clearFilters, handleSearch } = use[Domain]Filters();

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Input
        value={filters.q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
        className="w-48"
      />
      {(["active", "inactive", "draft"] as const).map((s) => (
        <Button
          key={s}
          variant={filters.status === s ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters({ status: s, page: 1 })}
        >
          {s}
        </Button>
      ))}
      <Button variant="ghost" size="sm" onClick={clearFilters}>
        Clear
      </Button>
    </div>
  );
}
```

---

## `app/[domain]/page.tsx`

```typescript
// Server Component — no "use client"
import { [Domain]Filters } from "@/components/[domain]/[Domain]Filters";
import { get[Domain]Items } from "@/queries/[domain]";

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function [Domain]Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const items = await get[Domain]Items({
    status: params.status,
    q:      params.q,
    page:   params.page ? Number(params.page) : 1,
  });

  return (
    <div>
      <[Domain]Filters />
      {/* render items */}
    </div>
  );
}
```
