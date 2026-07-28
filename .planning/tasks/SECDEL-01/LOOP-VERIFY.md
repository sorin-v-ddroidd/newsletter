---
phase: 1-verification
ticket_id: SECDEL-01
branch: feat/app-ui
status: needs-iteration
verdict: FAIL
started_at: "2026-07-27"
completed_at: ""
resume_with: /gsd-goal-loop
---

# Verification Report — Iteration 1

Static gates all pass. SC-6/SC-7/SC-8 are runtime criteria and are **not yet verified** — the
dev server was not started (tool use declined), so they are recorded as UNVERIFIED, not PASS.
Verdict is therefore FAIL pending the browser pass.

## Success Criteria

| SC   | Verdict    | Evidence |
|------|------------|----------|
| SC-1 | PASS       | `grep -rn 'data-gjs-removable' app/client/src/editor/blocks/` → no matches. All 18 occurrences across 7 block files replaced with `data-gjs-custom-name` (hero 2, new-collegues 3, projects 3, initiatives 3, hiring 3, want-to-know-more 3, disclaimer 1). |
| SC-2 | PASS       | `grep -n "set('draggable'" app/client/src/editor/editorConfig.ts` → no matches. Listener removed at `editorConfig.ts:342`, replaced by a comment recording why a boolean `draggable` must never be reintroduced. |
| SC-3 | PASS       | `actions.ts:42` `unlockSectionsInProjectData` (definition), `actions.ts:100` call inside `load()` before `loadProjectData`. Deletes the keys instead of writing `true` — see design note below. |
| SC-4 | PASS       | `npx tsc --noEmit` in `app/client` → exit 0, no output. |
| SC-5 | PASS       | `npm run verify:blocks` → 8/8 targets PASS, 0 MJML errors (7 blocks + full TEMPLATE_MJML). |
| SC-6 | UNVERIFIED | Requires a running dev server + browser. Not run. |
| SC-7 | UNVERIFIED | Requires a running dev server + browser. Not run. |
| SC-8 | UNVERIFIED | Requires a running dev server + browser. Not run. |

## Extra checks run beyond the plan

| Check | Result |
|-------|--------|
| `draggable` default is NOT a boolean (would have made normalization write an invalid value) | CONFIRMED. `grapesjs-mjml/dist/index.js` defines `s = t => (Array.isArray(t)?t:[t]).map(t => '[data-gjs-type="'+t+'"]').join(', ')` and every component uses `draggable: s(...)`. So `draggable` is a target-selector string; writing `true` would have let a section drop into an `mj-column` and produce invalid MJML. Normalization deletes the key instead, restoring the registered type default. |
| `data-gjs-custom-name` does not leak into exported HTML | PASS. Compiled `TEMPLATE_MJML` through `mjml@4.18.0`: 0 occurrences of `data-gjs`, 0 of `custom-name`. |
| Migration idempotency (would otherwise leave `assertRoundTrip` permanently red) | PASS. Unit test asserts a second pass unlocks 0 and leaves the JSON byte-identical. |
| Unit tests | PASS. `npx vitest run` → 2 files, 9 tests passed (4 pre-existing + 5 new in `actions.test.ts`). |

## Standards

| Standard | Verdict | Notes |
|----------|---------|-------|
| No `@ts-ignore` / `any` | PASS | Migration walks `unknown` and narrows to `Record<string, unknown>`. |
| `const` over `let` | PASS | One `let unlocked` — a genuine accumulator. |
| No self-closed `mj-*` tags introduced | PASS | Attribute-value-only edits; no tag text touched. |
| Project JSON canonical, never re-parse MJML | PASS | Restore path is `loadProjectData`; the scaffold `setComponents` is seed-time only (pre-existing, blessed pattern). |
| No auto-commit | PASS | Nothing committed. |

## Known behavioural consequence (must be reported, not hidden)

Branded blocks are multi-section by design (Projects, Initiatives, Hiring, Want-To-Know-More,
New Collegues = 3 sections each; Hero = 2; Disclaimer = 1) — siblings stitched with
`padding-top="0"` / `padding-bottom="0"` to read as one visual unit. Unlocking delete makes each
sibling independently deletable, so "remove the Projects block" is 3 deletes, and deleting one
leaves a partial block. Mitigation applied: each section now carries a `data-gjs-custom-name`
("Projects — divider" / "Projects — heading" / "Projects — item"), so Layers rows are
distinguishable instead of 18 identical "Section" rows. A true one-click whole-block delete would
need an `mj-wrapper` around each block, which changes compiled output and requires re-running the
Outlook/Gmail render gate — deliberately not done here.

## Changed Files

- `app/client/src/editor/blocks/hero.ts`
- `app/client/src/editor/blocks/new-collegues.ts`
- `app/client/src/editor/blocks/projects.ts`
- `app/client/src/editor/blocks/initiatives.ts`
- `app/client/src/editor/blocks/hiring.ts`
- `app/client/src/editor/blocks/want-to-know-more.ts`
- `app/client/src/editor/blocks/disclaimer.ts`
- `app/client/src/editor/editorConfig.ts`
- `app/client/src/editor/actions.ts`
- `app/client/src/editor/actions.test.ts` (new)
- `.planning/tasks/SECDEL-01/{GOAL,LOOP-PLAN,LOOP-VERIFY}.md` (new)

## Remaining runtime checks (SC-6/7/8)

1. Seed the template, open Layers → rows read "Hero", "Projects — heading", … not 18× "Section".
2. Click a section's trash icon → that section disappears from the canvas.
3. Right-click a section row → Duplicate is enabled.
4. Drag a section row/section in canvas to reorder → lands, and does NOT nest inside a column.
5. Click Save, reload the page → the saved draft returns (not a blank canvas).
6. `localStorage.setItem('ddroidd_newsletter_draft','{bad')` then reload → console error, empty
   scaffold, editor still usable.
7. Backspace/Delete while inline-editing text must not delete the enclosing section.

## Verdict: FAIL (static PASS; runtime SC-6/7/8 unverified)
