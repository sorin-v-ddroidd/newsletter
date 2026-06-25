# Component Patterns

> For folder structure and routing see `react-patterns.md`.
> For slot-based JSX composition see `code-style.md`.
> For `React.lazy` and code-splitting see `performance.md`.

> Folder note: this project is flat (`components/`, `hooks/`, `editor/`) — there is **no** atoms/molecules/organisms hierarchy. A multi-file feature component lives in its own folder under `components/` (e.g. `components/MyWizard/`).

## Custom Hooks

- Extract non-visual stateful logic into custom hooks — do not inline complex logic inside components
- Every custom hook must be prefixed with `use`
- Hooks must be called at the top level only — never inside loops, conditions, or nested functions
- **Hook location:**
  - Logic shared across multiple components → `hooks/` at `app/client/src/`
  - Logic specific to one feature component → a `hooks/` subfolder in that component's folder (e.g. `components/NewsletterList/hooks/useNewsletterList.ts`)
- A feature component's hook owns all form setup, field-array management, derived state, and submit handlers — the component file contains only JSX and render functions
- **Editor wiring** (subscribing to GrapesJS events, debounced autosave) belongs in a hook (e.g. `editor/hooks/useEditorAutosave.ts`), not inline in the editor component

```ts
// correct — logic lives in a hook, component stays declarative
function useStudentFilter(students: Student[]) {
  const [query, setQuery] = useState('');
  const filtered = students.filter(s => s.name.includes(query)); // derived — computed here, not in an effect
  return { query, setQuery, filtered };
}

// wrong — derived state computed in an effect
useEffect(() => {
  setFiltered(students.filter(s => s.name.includes(query)));
}, [query, students]);
```

- **Never use `useEffect` to compute derived state** — if a value can be calculated from existing state or props, calculate it directly in the render body
- Do not overuse `useCallback` / `useMemo` for every function or value — add them only when profiling identifies a concrete re-render problem

## useReducer for Complex State

Use `useReducer` instead of multiple `useState` calls when **any two of these conditions are true**:

- 3+ `useState` calls in a single hook
- Two or more state values must change together in one transition (atomically)
- A navigation action (e.g. "Back") must reset several pieces of state at once
- The same state value is read as a guard before another state update

**File structure** — keep the reducer out of the `hooks/` folder; it is a pure function, not a hook:

```
components/MyWizard/
  types.ts       ← WizardState + WizardAction live here alongside all other types
  reducer.ts     ← buildInitialState + wizardReducer (pure functions, no React imports)
  hooks/
    useMyWizard.ts   ← useReducer wires state + dispatch; exposes named handlers
```

**Example — PackageAllocationWizard** (`components/PackageAllocationWizard/`):

```ts
// types.ts — state shape and action union alongside the rest of the component's types
export type WizardState = {
  currentStep: 1 | 2;
  selectedPeriod: Period | null;
  selectedIds: string[];
  classFilter: string;
  seriesFilter: string;
};

export type WizardAction =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SELECT_PERIOD"; period: Period }
  | { type: "TOGGLE_PACKAGE"; id: string }
  | { type: "SET_CLASS_FILTER"; value: string }
  | { type: "SET_SERIES_FILTER"; value: string };
```

```ts
// reducer.ts — pure transitions, no React imports
export const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case "NEXT":
      // guard: only advance when the prerequisite state is met
      return state.selectedPeriod === null ? state : { ...state, currentStep: 2 };

    case "BACK":
      // atomic reset — step + both filters change together in one dispatch
      return { ...state, currentStep: 1, classFilter: "all", seriesFilter: "all" };

    case "SELECT_PERIOD":
      return { ...state, selectedPeriod: action.period };

    case "TOGGLE_PACKAGE": {
      const already = state.selectedIds.includes(action.id);
      return {
        ...state,
        selectedIds: already
          ? state.selectedIds.filter((x) => x !== action.id)
          : [...state.selectedIds, action.id],
      };
    }

    case "SET_CLASS_FILTER":
      return { ...state, classFilter: action.value };

    case "SET_SERIES_FILTER":
      return { ...state, seriesFilter: action.value };
  }
};
```

```ts
// hooks/useMyWizard.ts — dispatch is internal; the hook exposes named handler functions
export const usePackageAllocationWizard = ({ onConfirm, initialStep, initialPeriod, initialSelectedIds }) => {
  const [state, dispatch] = useReducer(wizardReducer, { currentStep: initialStep, ... }, buildInitialState);

  return {
    // expose state values directly, not the whole state object
    currentStep: state.currentStep,
    selectedPeriod: state.selectedPeriod,
    // expose named handlers, not dispatch
    handleNext: () => dispatch({ type: "NEXT" }),
    handleBack: () => dispatch({ type: "BACK" }),
    handleSelectPeriod: (period) => dispatch({ type: "SELECT_PERIOD", period }),
  };
};
```

**Rules:**
- `dispatch` must never be passed to child components — always wrap it in a named handler
- `WizardState` and `WizardAction` belong in `types.ts`, not in `reducer.ts`
- `reducer.ts` must have zero React imports — if it needs `useReducer`, it's in the wrong file
- Use the lazy initializer (`buildInitialState`) as the third argument to `useReducer` so initial props are applied once at mount, not on every render

## Compound Components

Use the compound pattern when a group of sibling components must share state without prop-drilling (e.g. tabs, accordions, step indicators).

**Always use Context API — never `React.cloneElement`:**

```tsx
// correct — Context-based compound component
type StepContextValue = { active: number; setActive: (i: number) => void };
const StepContext = createContext<StepContextValue | null>(null);

function StepIndicator({ children, defaultActive = 0 }: StepIndicatorProps) {
  const [active, setActive] = useState(defaultActive);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
}

function StepDot({ index }: { index: number }) {
  const { active, setActive } = useContext(StepContext)!;
  return <button onClick={() => setActive(index)} aria-current={active === index} />;
}

// wrong — React.cloneElement breaks when children are wrapped
function StepIndicator({ children }) {
  return React.Children.map(children, (child, i) =>
    React.cloneElement(child, { active: i === 0 })
  );
}
```

- Always memoize the context value (`useMemo`) to avoid unnecessary re-renders of all consumers on every parent render
- Export the child components as named exports alongside the parent — not as dot-notation sub-properties

## HOC → Prefer Hooks

Higher-order components are valid but hooks are the default choice in modern React.

**Use a hook when:**
- The behavior needs different configuration per component
- Only one or two components use the logic
- You want to avoid adding wrapper nodes to the tree

**Use a HOC only when:**
- Identical, uncustomizable behavior must be applied uniformly across many components (e.g. an auth guard wrapping every protected page)
- The wrapped component must function independently without the added logic

```tsx
// prefer — hook, no wrapper overhead
function BookCard({ bookId }: BookCardProps) {
  const { isVisible, ref } = useIntersectionObserver();
  // ...
}

// acceptable HOC use — identical guard across all protected pages
export default withAuthGuard(DashboardPage);
```

- Never create HOCs that inject more than 2–3 props — the naming collision risk outweighs the benefit; use hooks instead
- Do not stack more than one HOC on a single component

## Render Props → Use Hooks

The `(data) => JSX` render prop pattern is superseded by hooks in modern React. Do not introduce it.

**Clarification — this is NOT the same as slot-based composition:**

```tsx
// slot-based composition (allowed — see code-style.md)
<WizardLayout header={<WizardHeader />} footer={<WizardFooter />} />

// render prop (avoid — extract the logic into a hook instead)
<DataProvider render={({ data }) => <Chart data={data} />} />
```

**Refactor render props to hooks:**

```tsx
// wrong — render prop
<MouseTracker render={({ x, y }) => <Cursor x={x} y={y} />} />

// correct — custom hook
function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => { /* listener */ }, []);
  return pos;
}

function Cursor() {
  const { x, y } = useMouse();
  return <div style={{ left: x, top: y }} />;
}
```

## Suspense Boundaries

Wrap every `React.lazy` component in a `<Suspense>` boundary with a meaningful `fallback`. This pairs with the code-splitting in `performance.md` (the GrapesJS editor is the main split point).

```tsx
import { Suspense, lazy } from 'react';

const NewsletterEditor = lazy(() => import('@/editor/NewsletterEditor'));

function EditorRoute() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewsletterEditor />
    </Suspense>
  );
}
```

- Place the `<Suspense>` boundary as close to the lazy component as possible — do not wrap entire page sections unless the whole section should show a single skeleton
- Never use an empty `fallback={null}` for components with visible layout presence — always show a skeleton that matches the component's dimensions to prevent layout shift
