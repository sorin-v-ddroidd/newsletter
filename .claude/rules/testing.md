# Testing

Stack: **Vitest** only. No Storybook, no Jest, no separate RTL setup. (The inherited "stories-as-tests" rule does not apply — there are no organisms or stories in this project.)

```bash
npx vitest          # run
npx vitest --ui     # interactive
```

## What to test (priority — the things that actually break)

The highest-value tests target the domain risks, not UI chrome:

1. **MJML compile** — given a block's MJML (or a full document), compiling produces valid client-safe HTML with no errors, fonts/colors inlined, `mj-head` injected. This is the product's core promise.
2. **Project-JSON round-trip** — `getProjectData()` → persist → `loadProjectData()` is lossless (the Phase 1 gate; keep it as a regression test).
3. **Services** — newsletter CRUD, auth, storage, upload hardening (rejects bad magic bytes / oversized / traversal filenames) — pure-ish, unit-testable without HTTP (see `backend-express.md`).
4. **API routes** — auth required, validation rejects bad input, CSRF enforced on mutations.
5. **Form validation** — zod schemas accept valid and reject invalid input.

## Rules

- Co-locate `*.test.ts(x)` next to the unit under test.
- Test behavior and contracts, not implementation details.
- Component tests use React Testing Library *through Vitest* (jsdom) only where a component has real logic — don't snapshot-test static shell markup.
- Do not add another test framework unless explicitly asked.

## Cross-references
- `mjml-email-safety.md` — a passing compile test is **not** proof the email renders; the real client gate is Outlook + Gmail via the PowerShell scripts.
