# Coding Standards — Extended Reference

## Naming Conventions

### Variables

```typescript
// GOOD: descriptive names
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// BAD: unclear names
const q = 'election'
const flag = true
const x = 1000
```

### Functions — verb-noun pattern

```typescript
// GOOD
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// BAD
async function market(id: string) { }
function similarity(a: any, b: any) { }
```

### Files

```
components/Button.tsx          # PascalCase for components
hooks/useAuth.ts               # camelCase with 'use' prefix
lib/formatDate.ts              # camelCase for utilities
types/market.types.ts          # camelCase with .types suffix
```

---

## React Patterns

### Component Structure — typed functional components

```typescript
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>
      {children}
    </button>
  )
}

// BAD: no types
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### Custom Hooks

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage
const debouncedQuery = useDebounce(searchQuery, 500)
```

### State Updates — always use functional form when depending on previous state

```typescript
// GOOD: functional update
setCount(prev => prev + 1)

// BAD: can be stale in async scenarios
setCount(count + 1)
```

### Conditional Rendering — avoid ternary hell

```typescript
// GOOD
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// BAD
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

---

## Error Handling

### JSDoc for public APIs

```typescript
/**
 * Searches markets using semantic similarity.
 *
 * @param query - Natural language search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of markets sorted by similarity score
 * @throws {Error} If OpenAI API fails or Redis unavailable
 *
 * @example
 * const results = await searchMarkets('election', 5)
 */
export async function searchMarkets(
  query: string,
  limit: number = 10,
): Promise<Market[]> { }
```

### Domain error types — prefer typed errors over generic Error

```typescript
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`)
    this.name = 'NotFoundError'
  }
}

class ValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}
```

---

## Testing Standards

### Test Structure — AAA pattern

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### Test Naming — describe the behaviour, not the implementation

```typescript
// GOOD: descriptive
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// BAD: vague
test('works', () => { })
test('test search', () => { })
```

---

## File Organization

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── (auth)/            # Auth pages (route groups)
├── components/            # React components
│   ├── ui/               # Generic UI components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configs
│   ├── api/             # API clients
│   ├── utils/           # Helper functions
│   └── constants/       # Constants
├── types/                # TypeScript types
└── styles/              # Global styles
```

---

## Performance

### Memoization — only when expensive

```typescript
// Memoize expensive computations
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// Memoize callbacks passed to child components
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### Lazy Loading

```typescript
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### Database Queries

```typescript
// GOOD: select only needed columns
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// BAD: select everything
const { data } = await supabase.from('markets').select('*')
```

---

## Code Smells — Full Examples

### Long Functions (>50 lines)

```typescript
// BAD: one monolithic function
function processMarketData() {
  // 100 lines of code
}

// GOOD: compose smaller functions
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### Deep Nesting — use early returns

```typescript
// BAD: 5+ levels
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) {
        if (hasPermission) {
          doSomething()
        }
      }
    }
  }
}

// GOOD: early returns flatten the structure
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
if (!hasPermission) return

doSomething()
```

### Magic Numbers — use named constants

```typescript
// BAD
if (retryCount > 3) { }
setTimeout(callback, 500)

// GOOD
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
```
