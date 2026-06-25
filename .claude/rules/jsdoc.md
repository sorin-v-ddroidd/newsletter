# JSDoc

Internal tool — document **intent where it isn't obvious**, don't blanket-annotate. A JSDoc comment is required on: exported Props/shared types whose purpose isn't self-evident, exported components with non-trivial behavior, and any shared API-contract type. Skip it for one-off internal components and types whose name + shape already say everything. Keep comments concise — explain *why*, never restate the TypeScript.

When you do write one, follow the rules below.

## Rules

### `types.ts` files
- Every exported Props type gets exactly one `@description` (1–2 sentences: what the component does and why it exists)
- Add `@property` tags **only for non-obvious props** — explain *why* the prop exists, not what its TypeScript type already says
- Never document what is self-evident from the prop name and type (e.g. `label: string` needs no comment)
- Never use `@extends` — the type definition itself is the source of truth for inheritance
- Never repeat the full description on a simple type alias (e.g. `type NavBadgeVariant = AlertVariant` needs at most a one-liner)
- Hook input/return types (`UseXxxInput`, `UseXxxReturn`) get a one-line `@description` only — no `@property` tags unless the return value is genuinely surprising

### Component `.tsx` files
- Every exported component function gets a one-line `@description` placed directly above the `export`
- No `@param` tags — individual props are documented in `types.ts`
- Sub-components exported from the same file each get their own one-liner
- Internal helper components (not exported) do not need JSDoc

## Good example

```ts
/**
 * @description Props for the FavoriteButton. Replaces the native onClick with
 * a semantic onToggle so callers don't need to handle the event object.
 * @property {() => void} [onToggle] - Called when the button is activated; replaces onClick.
 */
export type FavoriteButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">
> & {
  isFavorite?: boolean;
  onToggle?: () => void;
};
```

## Bad example (avoid)

```ts
/**
 * @description Props for the FavoriteButton component, which represents a button
 * that allows users to mark an item as a favorite. It includes a boolean to indicate
 * whether the item is currently a favorite...
 * @property {boolean} [isFavorite] - An optional boolean indicating whether the item
 * is currently marked as a favorite...
 * @extends {Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">} - Extends standard
 * button attributes while omitting the onClick handler...
 * @extends {Readonly} - The props are wrapped in Readonly to ensure that they are immutable...
 */
```
