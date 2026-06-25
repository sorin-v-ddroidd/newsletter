# Styling

Styling the **app shell** (login, newsletter list, toolbar, dialogs) — *not* the email canvas. GrapesJS ships its own canvas CSS and grapesjs-mjml controls the editing surface; the rendered email is MJML-compiled HTML, which is governed by `mjml-email-safety.md`, **never** Tailwind. Keep these two worlds separate: Tailwind/shadcn for the chrome, MJML for the email.

## Stack

- **Tailwind CSS** via the Vite plugin (`@tailwindcss/vite`) — utility-first.
- **shadcn/ui** for primitives, on Vite (configured via `components.json`, alias `@/components/ui`).
- `cn()` from `lib/utils.ts` for conditional class composition.
- Theme tokens are shadcn's CSS variables in the global stylesheet (`:root` / `.dark`). There is **no `lib/design-tokens.ts`** and no `tailwind.config.js` ceremony — Tailwind 4 config is CSS-first.

## Rules

- No inline `style={{}}` in shell components — use Tailwind utilities or `cn()`. (Inline styles are unavoidable inside GrapesJS block content strings — that's MJML, a different rule.)
- No hardcoded brand hex in shell components — use the shadcn theme CSS variables / Tailwind theme. Brand hex values **do** appear in MJML block definitions (email needs literal hex inlined) — that's expected and governed by `grapesjs.md` BLOCK_DEFAULTS.
- New component variants use `class-variance-authority` (`cva`).
- Dark mode via Tailwind `dark:` if/when needed — not required for v1.

## Adding shadcn components

**Always use the CLI — never hand-create files in `components/ui/`:**

```bash
npx shadcn@latest add button dialog input form sonner
```

- The CLI writes to `components/ui/` and wires deps; manual edits get overwritten on the next `add`.
- Customize via `className` + `cn()` at the feature-component level — don't fork `components/ui/` files.

## Cross-references
- `mjml-email-safety.md` — the email is NOT styled with Tailwind.
- `forms.md` — shadcn Form primitives.
