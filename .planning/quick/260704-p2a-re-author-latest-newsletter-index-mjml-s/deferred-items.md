# Deferred Items — 260704-p2a

Pre-existing issue discovered during Task 3 sanity-checking, out of scope for this quick task
(not caused by this plan's changes, not in `files_modified`):

- **`app/server/src/routes/compile.ts` fails `tsc` build** (`npm run build --prefix app/server`):
  `Property 'errors' does not exist on type 'Promise<MJMLParseResults>'` (and similarly for
  `.html`) at lines 38-53. The `@types/mjml` declaration for `mjml2html` appears to type it as
  returning `Promise<MJMLParseResults>` while the runtime (and this codebase's usage, matching
  `mjml@4.18.0`'s actual synchronous API) treats the return value as a synchronous
  `MJMLParseResults`. This predates this quick task (introduced in commit `b81bd32`,
  "implement POST /api/compile...").
  - `npm run dev` (tsx, no type-check) is unaffected — the running dev server compiles fine at
    runtime; only the `tsc` build step surfaces this.
  - `app/server/scripts/verify-blocks.ts` (this plan's Task 3 deliverable) uses the same
    `mjml2html` call shape and also runs via `tsx`, so it is unaffected at runtime — confirmed
    by the passing `npm run verify:blocks` gate (8/8 PASS).
  - Not fixed here: out of scope (pre-existing, unrelated file not listed in this plan's
    `files_modified`). Flagging for a future quick task or phase to add a type assertion / fix
    the `@types/mjml` version mismatch.
