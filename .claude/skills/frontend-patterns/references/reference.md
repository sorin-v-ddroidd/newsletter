# Frontend Patterns — Reference

Detailed patterns for SOLID principles beyond SRP, hooks, type organization, and feature folder structure.

---

## Open/Closed Principle

Components should be open for extension, closed for modification.

**Pattern: Composition over Configuration**
```tsx
function Button({ type }: { type: 'primary' | 'secondary' | 'danger' }) {
  const styles = type === 'primary' ? '...' : type === 'secondary' ? '...' : '...';
  return <button className={styles}>Click</button>;
}

function Button({ variant, children, ...props }: ButtonProps) {
  return <button className={cn(baseStyles, variant)} {...props}>{children}</button>;
}

function PrimaryButton(props: ButtonProps) {
  return <Button variant='primary' {...props} />;
}
```

---

## Dependency Inversion

Depend on abstractions, not concrete implementations.

```tsx
function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
  return users;
}

interface UserRepository {
  getUsers: () => Promise<User[]>;
}

function useUsers(repository: UserRepository) {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { repository.getUsers().then(setUsers); }, [repository]);
  return users;
}
```

---

## Custom Hooks Patterns

### Encapsulate Complex State + Side Effects

```tsx
function useModalState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  return { isOpen, open, close, toggle };
}
```

### Compound State Hooks

```tsx
function useCategoryActions(selectedDomainId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!selectedDomainId) return;
    setIsLoading(true); setError(null);
    const result = await getCategories(selectedDomainId);
    if (result.success) { setCategories(result.data); } else { setError(result.error); }
    setIsLoading(false);
  }, [selectedDomainId]);

  const deleteCategory = useCallback(async (id: number) => {
    const result = await deleteCategoryApi(id);
    if (result.success) await loadCategories();
    return result;
  }, [loadCategories]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  return { categories, isLoading, error, actions: { reload: loadCategories, delete: deleteCategory } };
}
```
---

## Type Organization

**Principle:** Types live near usage; shared types go in dedicated files.

```
src/
├── types/
│   ├── common.types.ts        # Shared domain types
│   ├── api.types.ts           # API response types
│   └── ui.types.ts            # UI-specific types
├── features/
│   └── categories/
│       ├── types.ts           # Feature-specific types
│       ├── CategoryList.tsx
│       └── useCategoryData.ts
```

```tsx
export type Category = { id: number; domainId: number; name: string; description: string | null; createdAt: Date; };
export type CategoryExtended = Category & { isDeprecated: boolean; displayOrder?: number; flashcardCount?: number; };
export type ApiCategory = Omit<Category, 'createdAt'> & { createdAt: string; };
export type ApiResult<T> = | { success: true; data: T } | { success: false; error: string };
```

---

## Feature Folder / Vertical Slice Structure

```
src/features/
├── categories/
│   └── CategoryManager/
│       ├── CategoryManager.tsx          # UI (~70 lines)
│       ├── hooks/useCategoryManager.ts  # Orchestration (~105 lines)
│       ├── hooks/useCategoryData.ts     # Data/CRUD (~120 lines)
│       ├── hooks/useModalState.ts       # UI state (~67 lines)
│       ├── mappers.ts                   # API to UI transforms (~49 lines)
│       ├── types/index.ts               # All types (~77 lines)
│       ├── index.ts                     # Public API
│       └── README.md
├── users/ └── UserProfile/ ...
└── dashboard/ └── Dashboard/ ...
```

**Use feature-based when:** building product features, code is tightly coupled within a feature, team organized by product area.
**Use layer-based when:** enforcing strict layered architecture, code is highly reusable across features.

### File Responsibilities

| File | Responsibility | Exports |
|------|---------------|---------|
| `CategoryManager.tsx` | Render UI structure | `CategoryManager` component |
| `useCategoryManager.ts` | Orchestrate business logic | `useCategoryManager` hook |
| `useCategoryData.ts` | Data fetching and CRUD | `useCategoryData` hook |
| `useModalState.ts` | Modal state management | `useModalState` hook |
| `mappers.ts` | Transform API to UI types | Mapper functions |
| `types.ts` | Type contracts | All types |
| `index.ts` | Public API | Everything |

### Implementation Example

```tsx
// CategoryManager.tsx - Pure UI (~70 lines)
export function CategoryManager({ initialDomains, initialSelectedDomainId }: CategoryManagerProps) {
  const state = useCategoryManager(initialDomains, initialSelectedDomainId);
  return (
    <div className='space-y-6'>
      <CategoriesHeader onCreateClick={state.modals.create.open} />
      <ErrorMessage message={state.error} />
      <CategoriesContent categories={state.categories} />
    </div>
  );
}
```

```tsx
// useCategoryManager.ts - Business logic (~105 lines)
export function useCategoryManager(initialDomains: ApiDomain[], initialSelectedDomainId: number | null) {
  const [domains] = useState(() => toDomains(initialDomains));
  const [selectedDomainId, setSelectedDomainId] = useState(initialSelectedDomainId);
  const { categories, isLoading, error, actions } = useCategoryData(selectedDomainId);
  const modals = useModalState();

  const handleDelete = useCallback((id: number) => {
    const category = categories.find(c => c.id === id);
    if (category) modals.delete.open(category);
  }, [categories, modals.delete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!modals.delete.category) return;
    const result = await actions.deleteCategory(modals.delete.category.id);
    if (result.success) modals.delete.close();
  }, [modals.delete, actions]);

  return { domains, selectedDomainId, setSelectedDomainId, categories, isLoading, error, modals, actions };
}
```

```tsx
// index.ts - Public API
export { CategoryManager } from './CategoryManager';
export { useCategoryManager, useCategoryData, useModalState } from './hooks';
export { toCategory, toDomain } from './mappers';
export type { Category, Domain, CategoryManagerProps } from './types';
```

### Decision Matrix

| Aspect | Layer-Based | Feature-Based |
|--------|-------------|---------------|
| Organization | By tech layer | By feature/domain |
| Navigation | Jump between folders | Everything in one folder |
| Scalability | Gets messy with growth | Stays organized |
| Moving code | Update many imports | Move one folder |

**Hybrid rule:** Features are vertical slices, shared code is horizontal layers.

```
src/
├── features/    # Feature-based (vertical slices)
├── shared/      # Layer-based (Button, Input, useDebounce, formatDate)
└── lib/         # Infrastructure (api, auth)
```
---

## Compound Components

```tsx
const ModalContext = createContext<{ isOpen: boolean; close: () => void } | null>(null);

function Modal({ children, isOpen, onClose }: ModalProps) {
  return (
    <ModalContext.Provider value={{ isOpen, close: onClose }}>
      {isOpen && <div className='modal-overlay'><div className='modal-content'>{children}</div></div>}
    </ModalContext.Provider>
  );
}

Modal.Header = function ModalHeader({ children }: { children: ReactNode }) {
  const ctx = useContext(ModalContext);
  return <div className='modal-header'>{children}<button onClick={ctx?.close}>x</button></div>;
};
Modal.Body = ({ children }: { children: ReactNode }) => <div className='modal-body'>{children}</div>;
Modal.Footer = ({ children }: { children: ReactNode }) => <div className='modal-footer'>{children}</div>;
```

---

## State Management Patterns

```tsx
// 1. Local first
const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

// 2. Lift when shared
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  return (
    <>
      <TodoInput onAdd={(todo) => setTodos(prev => [...prev, todo])} />
      <TodoList todos={todos} onToggle={handleToggle} />
      <TodoStats todos={todos} />
    </>
  );
}

// 3. Context for deep trees
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
} | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

---

## Performance Patterns

```tsx
// Memo only expensive components with stable props
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <ExpensiveItem key={item.id} item={item} />)}</ul>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback((id: number) => { console.log('Clicked', id); }, []);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ExpensiveList items={items} onClick={handleClick} />
    </>
  );
}

// Code splitting with dynamic imports
const HeavyChart = dynamic(() => import('./HeavyChart'), { loading: () => <Skeleton />, ssr: false });
```

---

## Error Boundaries

```tsx
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ComponentType<{ error: Error }> },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```