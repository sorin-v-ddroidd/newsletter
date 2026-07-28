---
phase: quick-260713-egj
plan: 01
status: complete
subsystem: ui
tags: [styling, tailwind, cursor, shadcn, editor]
dependency-graph:
  requires: []
  provides: [cursor-pointer-affordance]
  affects: [app/client/src/components/ui/button.tsx, app/client/src/components/ui/tabs.tsx, app/client/src/components/ui/accordion.tsx, app/client/src/components/ui/dropdown-menu.tsx, app/client/src/editor/LeftSidebar.tsx, app/client/src/editor/panelControls.tsx, app/client/src/editor/TopBar.tsx]
tech-stack:
  added: []
  patterns: [tailwind-cursor-utility]
key-files:
  created: []
  modified:
    - app/client/src/components/ui/button.tsx
    - app/client/src/components/ui/tabs.tsx
    - app/client/src/components/ui/accordion.tsx
    - app/client/src/components/ui/dropdown-menu.tsx
    - app/client/src/editor/LeftSidebar.tsx
    - app/client/src/editor/panelControls.tsx
    - app/client/src/editor/TopBar.tsx
decisions: []
metrics:
  duration: "~15 minutes"
  completed: 2026-07-13
---

# Phase quick-260713-egj Plan 01: Add cursor-pointer on hover to interactive elements Summary

Added `cursor-pointer` (and `disabled:cursor-not-allowed` / `data-[disabled]:cursor-not-allowed` where a disabled state exists) to shadcn Button/Tabs/Accordion/DropdownMenu primitives and 5 raw editor `<button>` elements, restoring the pointer-cursor affordance that Tailwind 4 preflight (`button { cursor: default }`) removes.

## What was done

**Task 1 — shadcn UI primitives:**
- `button.tsx`: `buttonVariants` base cva string gained `cursor-pointer` and `disabled:cursor-not-allowed` (added right after the existing `disabled:pointer-events-none disabled:opacity-50` pair).
- `tabs.tsx`: `TabsTrigger` className gained the same pair.
- `accordion.tsx`: `AccordionTrigger` className gained the same pair.
- `dropdown-menu.tsx`: replaced `cursor-default` → `cursor-pointer` in all 4 occurrences (`DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuSubTrigger`). Added `data-[disabled]:cursor-not-allowed` to the 3 that expose a `data-[disabled]` state (`DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`); `DropdownMenuSubTrigger` has no disabled state in this file so only the cursor swap was applied there, per plan.

**Task 2 — raw editor buttons:**
- `LeftSidebar.tsx`: added `cursor-pointer` to the layer-visibility-toggle button, the layer-delete button, and the layer-row-select button (`LayerItem`). None of these three receive a `disabled` prop, so no `disabled:cursor-not-allowed` was added, per plan.
- `panelControls.tsx`: added `cursor-pointer` to the `SegmentedIconGroup` option button.
- `TopBar.tsx`: added `cursor-pointer` to the device-switcher button inside `renderDeviceSwitcher`.

No behavior/logic changes — every edit is an additive Tailwind utility-class insertion into an existing className string/array, exactly per the plan's interfaces section.

## Deviations from Plan

None - plan executed exactly as written.

Note: `git diff` on `LeftSidebar.tsx` and `TopBar.tsx` shows additional unrelated hunks (hook-extraction refactors: `useBlockSearch`, `useEditorActions`). These are pre-existing uncommitted changes from separate prior quick tasks (`260713-dl2-leftsidebar-block-hook`, `260713-dwk-topbar-actions-hook`) already present in the working tree before this task started — confirmed by inspecting `git diff` for exactly the lines this plan touched (each file has precisely the `cursor-pointer` additions specified, nothing else attributable to this task).

## Verification

- `grep -c "cursor-pointer"` across all 7 target files: button.tsx(1), tabs.tsx(1), accordion.tsx(1), dropdown-menu.tsx(4), LeftSidebar.tsx(3), panelControls.tsx(2 — includes the pre-existing SwatchRow color-input cursor-pointer plus the new SegmentedIconGroup one), TopBar.tsx(1). All 7 files confirmed to contain the expected new occurrences.
- `grep -n "cursor-default" app/client/src/components/ui/dropdown-menu.tsx` → zero matches (all 4 replaced).
- `npx tsc --noEmit` (run from `app/client/`) → no output, no errors.
- Manually reviewed `git diff` for every modified file — confirmed each diff contains only the cursor-related class-string edits described in the plan (plus pre-existing unrelated hook-refactor hunks in LeftSidebar.tsx/TopBar.tsx, noted above as out of scope for this task).
- No file under `src/sections/*.mjml` or any MJML block content string was touched.

## Self-Check: PASSED

- FOUND: app/client/src/components/ui/button.tsx
- FOUND: app/client/src/components/ui/tabs.tsx
- FOUND: app/client/src/components/ui/accordion.tsx
- FOUND: app/client/src/components/ui/dropdown-menu.tsx
- FOUND: app/client/src/editor/LeftSidebar.tsx
- FOUND: app/client/src/editor/panelControls.tsx
- FOUND: app/client/src/editor/TopBar.tsx
- Typecheck: PASSED (no errors)
- No commits made per `.claude/rules/no-commit.md`

## Changed Files (not committed — see no-commit.md)

- `app/client/src/components/ui/button.tsx`
- `app/client/src/components/ui/tabs.tsx`
- `app/client/src/components/ui/accordion.tsx`
- `app/client/src/components/ui/dropdown-menu.tsx`
- `app/client/src/editor/LeftSidebar.tsx`
- `app/client/src/editor/panelControls.tsx`
- `app/client/src/editor/TopBar.tsx`

### Suggested commit message

```
style(ui): add cursor-pointer affordance to interactive triggers

- Add cursor-pointer + disabled:cursor-not-allowed to Button, TabsTrigger, AccordionTrigger
- Replace cursor-default with cursor-pointer on DropdownMenu Item/CheckboxItem/RadioItem/SubTrigger,
  add data-[disabled]:cursor-not-allowed where a disabled state exists
- Add cursor-pointer to raw editor buttons in LeftSidebar, panelControls, TopBar
```
