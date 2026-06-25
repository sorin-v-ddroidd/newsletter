# Code Style

## TypeScript

- Use `type` instead of `interface` — types compose better and do not merge unexpectedly
- Use `import type` for type-only imports

```ts
// correct
type ButtonProps = {
  label: string;
  onClick: () => void;
};

// wrong
interface ButtonProps {
  label: string;
  onClick: () => void;
}
```

## Variables

- Always prefer `const` over `let`; only use `let` when reassignment is genuinely required
- Never use `var`

```ts
// correct
const label = props.label;

// wrong
let label = props.label;
```

## Destructuring

- Always destructure objects and arrays at the top of functions instead of using dot notation throughout the body
- Destructure props at the function signature level for components

```ts
// correct
const { label, onClick, disabled = false } = props;

// wrong
const label = props.label;
const onClick = props.onClick;
```

```tsx
// correct
function Button({ label, onClick, disabled = false }: ButtonProps) { ... }

// wrong
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

## Composition Pattern

- Build complex components by composing smaller, single-responsibility pieces — not by adding conditionals inside a monolithic component
- A component that accepts a `variant` with 4+ branches is a signal to split into separate composed components
- Prefer passing composed children or render-prop slots over large `if/switch` trees inside a single component

```tsx
// correct — compose small pieces
function WizardLayout({ header, body, footer }: WizardLayoutProps) {
  return (
    <div>
      {header}
      <main>{body}</main>
      {footer}
    </div>
  );
}

// wrong — monolith with branching
function Wizard({ step, ...props }) {
  if (step === 1) return <Step1 {...props} />;
  if (step === 2) return <Step2 {...props} />;
  // ...
}
```

- When composing, each piece should be independently testable (see `testing.md`)

## Render Functions

When a component's `return` statement becomes long or contains conditional/complex sections, extract each section into a named `function render*()` inside the component body. This keeps the return statement a flat, readable list of calls.

- Name render functions with the `render` prefix: `renderHeader`, `renderAvatarPicker`, `renderCnpField`
- Always define render functions as `const` arrow functions, not `function` declarations
- Define them inside the component so they close over props, state, and form context naturally — no need to pass arguments
- Use early `return null` inside a render function instead of ternary wrapping at the call site
- The `return` of the component should read like an outline: `{renderHeader()} {renderBody()} {renderFooter()}`

```tsx
// correct — flat return, logic in named functions
function ChildProfileSetupForm({ requiresCNP, ... }) {
  const renderCnpField = () => {
    if (!requiresCNP) return null;
    return <div>...</div>;
  }

  return (
    <form>
      {renderAvatarPicker()}
      {renderFirstNameField()}
      {renderCnpField()}
    </form>
  );
}

// wrong — inline branching clutters the return
function ChildProfileSetupForm({ requiresCNP, ... }) {
  return (
    <form>
      <div>...avatar picker...</div>
      <div>...first name...</div>
      {requiresCNP && (
        <div>...long cnp section...</div>
      )}
    </form>
  );
}
```
