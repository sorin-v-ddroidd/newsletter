---
ticket_id: SECDEL-01
branch: feat/app-ui
last_iteration: 0
goal_status: in-progress
---

## Objective

A non-developer cannot delete a branded section from the newsletter canvas — only inner
content (text, images). Every branded block bakes `data-gjs-removable="false"` on its root
`mj-section`, which hides the Layers trash icon (`LeftSidebar.tsx:39,61`) and disables
Duplicate (`actions.ts:58 canDuplicate`), and a `component:add` listener
(`editorConfig.ts:350-358`) additionally locks `draggable` off that same marker. End state:
sections are fully manageable — deletable, duplicable, and drag-reorderable — both for newly
dropped/seeded blocks and for drafts already saved in localStorage.

## Success Criteria

- [ ] SC-1: No `data-gjs-removable="false"` remains anywhere in `app/client/src/editor/blocks/`
      (grep returns zero matches), so freshly dropped/seeded sections have `removable !== false`.
- [ ] SC-2: The `component:add` draggable lock in `editorConfig.ts` is removed — no code sets
      `draggable: false` keyed off `removable === false`; sections are drag-reorderable.
- [ ] SC-3: `actions.ts` exposes a normalization pass that clears `removable === false` /
      `draggable === false` on `mj-section` components, and `load()` runs it after
      `loadProjectData()`, so previously-saved drafts unlock too.
- [ ] SC-4: `npx tsc --noEmit` passes for `app/client` with zero errors.
- [ ] SC-5: `app/server/scripts/verify-blocks.ts` still passes — all blocks compile with no
      MJML errors (removing a `data-gjs-*` attr must not change compiled output).
- [ ] SC-6: Runtime check in the browser: selecting a branded section in Layers shows the
      trash icon, clicking it removes the section from the canvas, and Duplicate is enabled.
- [ ] SC-7: Clicking Save writes the draft to localStorage, and reopening the app (fresh page
      load / after closing the browser) restores that draft onto the canvas instead of an
      empty scaffold. No saved draft → empty mjml/mj-body scaffold as before.
- [ ] SC-8: A corrupt localStorage draft does not brick the editor on open — it is logged and
      the empty scaffold is seeded instead.

## Standards

- No `@ts-ignore`, no `any` (typescript.md).
- Path alias `@/*` only; no `../../` traversal.
- `type` over `interface`; `const` over `let` (code-style.md).
- Never self-close `mj-*` tags in block content strings (grapesjs.md) — edits must not
  disturb existing explicit close pairs.
- Project JSON stays canonical; never reload persisted state from an MJML string (grapesjs.md).
- No auto-commit (no-commit.md) — report changed files + suggested message.

## Out of Scope

- Debounced autosave (SAVE-06). Save stays an explicit button click per the user's ask
  ("when I click save"); only the *restore* becomes automatic.
- Server-side persistence — drafts remain localStorage-only at this stage.
- Inner-content locking (text/image editability inside sections) — unchanged.
- Adding a canvas-hover toolbar or a Delete keybinding.
- Undo/redo behaviour changes.
- Server persistence (drafts are localStorage-only at this stage).

## Iteration Log

<!-- append-only: each iteration appended here after VERIFY -->
