# Forms

Forms use **react-hook-form** + **Zod** + shadcn **Form** primitives. Never hold form field values in `useState`. (v1 has few forms — login, newsletter rename, maybe asset metadata — so keep this lightweight; don't over-build.)

## shadcn Form primitives

Use the shadcn Form components from `@/components/ui/form` — they wire label/aria/error automatically:

| Component | Replaces |
|-----------|---------|
| `Form` | `FormProvider` — spread the `useForm` return: `<Form {...form}>` |
| `FormField` | `Controller` — provides `field` to the render prop |
| `FormItem` | wrapping `<div>` — shared id for label+input |
| `FormLabel` | `Label` — auto `htmlFor`, reddens on error |
| `FormControl` | input wrapper — auto `id`, `aria-invalid`, `aria-describedby` |
| `FormMessage` | error `<p>` — reads RHF context, `null` when clean |

Store the full `useForm` return as `form` (not destructured), so it spreads into `<Form>`:

```tsx
const form = useForm<LoginFields>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
<Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} noValidate>…</form></Form>
```

Always provide `defaultValues`. `FormField` + `FormControl` handle `Controller` + `aria-invalid` + `id`/`htmlFor` — don't add them manually.

## File structure (only when a form is non-trivial)

For a real form, co-locate:

| File | Purpose |
|------|---------|
| `validation.ts` | Zod schema only |
| `types.ts` | `z.infer<typeof schema>` + Props type |
| `[FormName].tsx` | component: `useForm` + `zodResolver` |

A trivial one-field form (e.g. rename) can be a single file — don't manufacture four files for one input.

## Rules

- Never `useState` for field values — use RHF.
- Always `zodResolver(schema)`; infer the field type: `type FooFields = z.infer<typeof fooSchema>`.
- `onSubmit` accepts the inferred field type, not an ad-hoc object.
- `noValidate` on `<form>` — Zod validates, not the browser.
- **The same zod schema (or an equivalent) must validate server-side too** — client validation is UX, not security (see `security.md`, `backend-express.md`).

## Example

```ts
// validation.ts
import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().email('Invalid email.'),
  password: z.string().min(8, 'At least 8 characters.'),
});
```

```tsx
// types.ts
import type { z } from 'zod';
import type { loginSchema } from './validation';
export type LoginFields = z.infer<typeof loginSchema>;
export type LoginFormProps = Readonly<{ onSubmit: (data: LoginFields) => void; isLoading?: boolean }>;
```
