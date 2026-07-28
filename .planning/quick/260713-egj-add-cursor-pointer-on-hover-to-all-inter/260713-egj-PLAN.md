---
phase: quick-260713-egj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/client/src/components/ui/button.tsx
  - app/client/src/components/ui/tabs.tsx
  - app/client/src/components/ui/dropdown-menu.tsx
  - app/client/src/components/ui/accordion.tsx
  - app/client/src/editor/LeftSidebar.tsx
  - app/client/src/editor/panelControls.tsx
  - app/client/src/editor/TopBar.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Hovering any shadcn Button (any variant/size, in enabled state) shows a pointer cursor"
    - "Hovering a disabled shadcn Button shows not-allowed cursor, not pointer"
    - "Hovering Tabs triggers, Accordion triggers, and DropdownMenu items/sub-triggers/checkbox/radio items shows a pointer cursor"
    - "Hovering every raw <button type=\"button\"> in editor/LeftSidebar.tsx, editor/panelControls.tsx, editor/TopBar.tsx shows a pointer cursor"
    - "No MJML block content string or email-canvas-rendered element is touched"
  artifacts:
    - path: "app/client/src/components/ui/button.tsx"
      provides: "cursor-pointer + disabled:cursor-not-allowed on buttonVariants base"
    - path: "app/client/src/components/ui/tabs.tsx"
      provides: "cursor-pointer + disabled:cursor-not-allowed on TabsTrigger"
    - path: "app/client/src/components/ui/dropdown-menu.tsx"
      provides: "cursor-default replaced with cursor-pointer + data-[disabled]:cursor-not-allowed on Item/CheckboxItem/RadioItem/SubTrigger"
    - path: "app/client/src/components/ui/accordion.tsx"
      provides: "cursor-pointer + disabled:cursor-not-allowed on AccordionTrigger"
    - path: "app/client/src/editor/LeftSidebar.tsx"
      provides: "cursor-pointer on 3 raw buttons (layer visibility toggle, layer delete, layer select)"
    - path: "app/client/src/editor/panelControls.tsx"
      provides: "cursor-pointer on SegmentedIconGroup raw button"
    - path: "app/client/src/editor/TopBar.tsx"
      provides: "cursor-pointer on device-switcher raw button"
  key_links: []
---

<objective>
Add `cursor-pointer` (with `disabled:cursor-not-allowed` / `data-[disabled]:cursor-not-allowed` where the element supports a disabled state) to every interactive button/clickable-role element in the app shell, so hovering any clickable control shows a pointer cursor instead of Tailwind 4 preflight's default arrow (`button { cursor: default }`).

Purpose: Restore the standard visual affordance that these elements are clickable — a pure CSS-class change, no behavior/logic change.
Output: Updated className strings across the shadcn Button/Tabs/DropdownMenu/Accordion primitives and the raw `<button>` elements in the GrapesJS editor UI (LeftSidebar, TopBar, panelControls). Nothing in `src/sections/*.mjml`, MJML block content strings, or the compiled email canvas is touched — that is a separate styling world (see `.claude/rules/mjml-email-safety.md`).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/rules/styling.md
@.claude/rules/code-style.md
@.claude/rules/gotchas.md

# Grep audit performed during planning — every raw <button in app/client/src (excludes components/ui, handled separately below):
# app/client/src/editor/LeftSidebar.tsx:41   (layer visibility toggle)
# app/client/src/editor/LeftSidebar.tsx:50   (layer delete, conditionally rendered when canDelete)
# app/client/src/editor/LeftSidebar.tsx:72   (layer row select)
# app/client/src/editor/panelControls.tsx:66 (SegmentedIconGroup option button)
# app/client/src/editor/TopBar.tsx:74         (device switcher button, inside renderDeviceSwitcher)
# No other raw <button occurrences exist under app/client/src.
</context>

<interfaces>
<!-- Exact current class strings the executor is editing. Copy-edit only — add tokens, do not restructure. -->

From app/client/src/components/ui/button.tsx (buttonVariants base, line 8):
```
"inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
```

From app/client/src/components/ui/tabs.tsx (TabsTrigger, line 65):
```
"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 ..."
```

From app/client/src/components/ui/accordion.tsx (AccordionTrigger, line 38):
```
"flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180"
```

From app/client/src/components/ui/dropdown-menu.tsx (4 occurrences of `cursor-default`, lines 75, 93, 129, 212 — DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuSubTrigger). These items already explicitly override the default cursor with `cursor-default` — replace with `cursor-pointer`; add `data-[disabled]:cursor-not-allowed` alongside the existing `data-[disabled]:pointer-events-none data-[disabled]:opacity-50` (only DropdownMenuItem and DropdownMenuCheckboxItem/DropdownMenuRadioItem expose `data-[disabled]`; DropdownMenuSubTrigger has no disabled state in this file — skip the not-allowed addition there).

DropdownMenuTrigger (line 21-30) has no explicit className/styling — it is a pure passthrough wrapper; in this codebase it is always used with `asChild` wrapping a `Button` (see TopBar.tsx), so the Button fix covers it. No edit needed there.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add cursor-pointer to shadcn UI primitives (Button, Tabs, Accordion, DropdownMenu)</name>
  <files>app/client/src/components/ui/button.tsx, app/client/src/components/ui/tabs.tsx, app/client/src/components/ui/accordion.tsx, app/client/src/components/ui/dropdown-menu.tsx</files>
  <action>
Edit each file's className string in place — additive only, do not reorder or remove existing tokens, do not restructure the component beyond the class-string edit:

1. `button.tsx` line 8 (`buttonVariants` base cva string): append `cursor-pointer` and add `disabled:cursor-not-allowed` immediately after the existing `disabled:pointer-events-none disabled:opacity-50` pair.
2. `tabs.tsx` line 65 (`TabsTrigger` className, first string in the `cn()` call): append `cursor-pointer` and add `disabled:cursor-not-allowed` after the existing `disabled:pointer-events-none disabled:opacity-50`.
3. `accordion.tsx` line 38 (`AccordionTrigger` className): append `cursor-pointer` and add `disabled:cursor-not-allowed` after the existing `disabled:pointer-events-none disabled:opacity-50`.
4. `dropdown-menu.tsx`: in each of the 4 className strings that currently contain `cursor-default` (DropdownMenuItem line 75, DropdownMenuCheckboxItem line 93, DropdownMenuRadioItem line 129, DropdownMenuSubTrigger line 212), replace `cursor-default` with `cursor-pointer`. For DropdownMenuItem, DropdownMenuCheckboxItem, and DropdownMenuRadioItem (all three already have `data-[disabled]:pointer-events-none data-[disabled]:opacity-50`), add `data-[disabled]:cursor-not-allowed` immediately after that pair. DropdownMenuSubTrigger has no disabled-state classes in this file — do not add a not-allowed class there, only swap `cursor-default` → `cursor-pointer`.

Do not touch DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuContent, DropdownMenuPortal, DropdownMenuGroup, DropdownMenuRadioGroup, Tabs, TabsList, TabsContent, Accordion, AccordionItem, AccordionContent — none of these render a clickable button-like element themselves (they are layout/container/portal/label pieces).

This is the one sanctioned exception to "never hand-edit components/ui" (see .claude/rules/styling.md) — keep every edit to exactly the cursor-related utility classes described above, nothing else in these files changes.
  </action>
  <verify>
    <automated>grep -c "cursor-pointer" app/client/src/components/ui/button.tsx app/client/src/components/ui/tabs.tsx app/client/src/components/ui/accordion.tsx app/client/src/components/ui/dropdown-menu.tsx</automated>
  </verify>
  <done>button.tsx, tabs.tsx, accordion.tsx each have exactly one new `cursor-pointer` + `disabled:cursor-not-allowed` pair on their clickable trigger; dropdown-menu.tsx has `cursor-pointer` (not `cursor-default`) on all 4 item/trigger variants with `data-[disabled]:cursor-not-allowed` added to the 3 that support a disabled state. `npx tsc --noEmit` (or equivalent project typecheck) has no new errors from these files.</done>
</task>

<task type="auto">
  <name>Task 2: Add cursor-pointer to raw editor buttons (LeftSidebar, panelControls, TopBar)</name>
  <files>app/client/src/editor/LeftSidebar.tsx, app/client/src/editor/panelControls.tsx, app/client/src/editor/TopBar.tsx</files>
  <action>
Add `cursor-pointer` to the `className` of every raw `<button type="button">` found by the audit grep (none of these are disabled-capable, so no `disabled:cursor-not-allowed` is needed for these three files — confirm no `disabled` prop is passed to any of them before skipping it; if any raw button here does receive a `disabled` prop, add `disabled:cursor-not-allowed` too):

1. `LeftSidebar.tsx` line 41 — layer visibility toggle button (`className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"`): prepend or append `cursor-pointer`.
2. `LeftSidebar.tsx` line 50 — layer delete button (`className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"`): add `cursor-pointer`.
3. `LeftSidebar.tsx` line 72 — layer row select button (className starting `"block min-w-0 flex-1 truncate rounded-md py-1.5 text-left text-xs text-foreground/80 transition-colors"`): add `cursor-pointer`.
4. `panelControls.tsx` line 66 — `SegmentedIconGroup` option button (className starting `"grid h-7 min-w-7 place-items-center rounded-md text-muted-foreground transition-colors"`): add `cursor-pointer`.
5. `TopBar.tsx` line 74 — device switcher button inside `renderDeviceSwitcher` (className starting `"grid h-7 w-9 place-items-center rounded-md text-muted-foreground transition-colors"`): add `cursor-pointer`.

Do not touch the `<input type="color">` in panelControls.tsx `SwatchRow` (already has `cursor-pointer` at line 101 — confirm, do not duplicate) or any `<select>`/`<input type="checkbox">`/`<label>` elements in panelControls.tsx — those are not in scope (native form controls already show correct cursors; the ask is buttons only). Do not touch any shadcn `<Button>` usage in TopBar.tsx (renderActions, renderWarningBanner) — those are covered by Task 1's button.tsx edit already.
  </action>
  <verify>
    <automated>grep -c "cursor-pointer" app/client/src/editor/LeftSidebar.tsx app/client/src/editor/panelControls.tsx app/client/src/editor/TopBar.tsx</automated>
  </verify>
  <done>All 5 raw buttons identified by the audit (3 in LeftSidebar.tsx, 1 in panelControls.tsx, 1 in TopBar.tsx) carry `cursor-pointer` in their className. `npx tsc --noEmit` has no new errors from these files. No MJML/email-canvas file was modified.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| n/a | Pure client-side CSS utility-class change; no new trust boundary, no user input, no data flow change |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-260713-01 | n/a | className edits | accept | No new attack surface — additive Tailwind utility classes only, no logic/behavior change, no new dependency |
</threat_model>

<verification>
1. Run `grep -rn "cursor-pointer" app/client/src/components/ui/button.tsx app/client/src/components/ui/tabs.tsx app/client/src/components/ui/accordion.tsx app/client/src/components/ui/dropdown-menu.tsx app/client/src/editor/LeftSidebar.tsx app/client/src/editor/panelControls.tsx app/client/src/editor/TopBar.tsx` — expect matches in all 7 files.
2. Run `grep -n "cursor-default" app/client/src/components/ui/dropdown-menu.tsx` — expect zero matches (all 4 replaced).
3. `npx tsc --noEmit` (or the project's existing typecheck script) — no new errors.
4. Manual spot-check (optional, not required for automated pass): run `npm run dev` for the app client, open the editor, hover the Save/Export buttons in TopBar, the Blocks/Layers tabs, a layer row's eye/trash icons, and the device switcher — cursor should be a pointer on all of them, and `not-allowed` on any disabled Button.
5. Confirm no file under `app/client/src` outside the 7 listed files was modified, and nothing under `src/sections/*.mjml` or any MJML block content string changed.
</verification>

<success_criteria>
- All 7 files listed in `files_modified` have `cursor-pointer` added to their relevant clickable-element class strings.
- `dropdown-menu.tsx` no longer contains `cursor-default` anywhere.
- No behavior, layout, or non-cursor styling changed in any of the 7 files.
- No MJML/email-canvas file touched.
- Typecheck passes with no new errors.
</success_criteria>

<output>
Create `.planning/quick/260713-egj-add-cursor-pointer-on-hover-to-all-inter/260713-egj-SUMMARY.md` when done
</output>
