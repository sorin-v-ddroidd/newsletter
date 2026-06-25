# Example: Trip Status Filters

A complete, real-world example. A custom hook centralises all filter state; a consumer component reads from it.

---

## 1. The Hook — `hooks/trips/useTripFilters.ts`

```typescript
"use client";
// ^ Must be first line — useQueryState requires a client component

import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { TripStatusType } from "@/infrastructure/database/schema/enums";

// Const tuple — required for parseAsStringLiteral type inference
const TRIP_STATUSES = ["planning", "active", "completed", "archived"] as const;

export function useTripFilters() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(TRIP_STATUSES).withDefault("planning")
    //                                   ^^^^^^^^^^^^^^^^^^^
    //                                   Without .withDefault(), status can be null
  );

  const clearFilters = () => {
    setStatus(null); // null removes the param from the URL entirely
  };

  return {
    status: status as TripStatusType | null,
    setStatus,
    clearFilters,
  };
}
```

**Why a custom hook?**
One place owns the param name (`"status"`) and the allowed values. Components import the hook — they never call `useQueryState` directly.

---

## 2. The Consumer — `components/trips/TripFilters.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { useTripFilters } from "@/hooks/trips/useTripFilters";
import type { TripStatusType } from "@/infrastructure/database/schema/enums";

// Explicit label list keeps the filter UI independent from the hook's value list
const FILTER_OPTIONS: { value: TripStatusType | "all"; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "planning",  label: "Planning"  },
  { value: "active",    label: "Active"    },
  { value: "completed", label: "Completed" },
  { value: "archived",  label: "Archived"  },
];

export function TripFilters() {
  const { status, setStatus } = useTripFilters();

  return (
    <div className="flex gap-2 flex-wrap">
      {FILTER_OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          variant={
            (value === "all" && !status) || status === value
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() => setStatus(value === "all" ? null : value)}
          //                                          ^^^^
          //                                          "all" means no filter — clear the param
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
```

---

## 3. The Server Page — `app/trips/page.tsx`

```typescript
// No "use client" — this is a Server Component
import { TripFilters } from "@/components/trips/TripFilters";
import { TripsList }   from "@/components/trips/TripsList";
import { getTrips }    from "@/queries/handlers/trips/GetTripsHandler";
import type { TripStatusType } from "@/infrastructure/database/schema/enums";

// Next.js 15: searchParams is a Promise
interface TripsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = await searchParams;

  // Manually cast — or validate with Zod if stricter safety is needed
  const statusFilter = params.status as TripStatusType | undefined;

  const result = await getTrips(statusFilter);

  if (!result.success) {
    return <div>Error loading trips</div>;
  }

  return (
    <div>
      <TripFilters />           {/* client component, reads/writes URL */}
      <TripsList initialTrips={result.data} />
    </div>
  );
}
```

**Note:** The server page reads `searchParams` directly — it does not import anything from nuqs. The client hook and the server page both look at the same `?status=` param, so they stay in sync automatically.

---

## URL Behaviour

| Action | URL before | URL after |
|---|---|---|
| Click "Active" | `/trips` | `/trips?status=active` |
| Click "All" | `/trips?status=active` | `/trips` |
| Click "Archived" | `/trips?status=active` | `/trips?status=archived` |
