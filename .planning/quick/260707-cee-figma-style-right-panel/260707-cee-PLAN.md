---
phase: quick-260707-cee
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/client/src/editor/panelControls.tsx
  - app/client/src/editor/RightPanel.tsx
autonomous: false
requirements: [EDIT-06]
must_haves:
  truths:
    - "The right panel renders as flat Figma-style sections (bold ~13px title, hairline divider) instead of uppercase-tracking accordion headers"
    - "width/height (and padding-family props) render as compact two-column grid inputs with an in-field letter/icon prefix"
    - "text-align and vertical-align render as segmented lucide-icon toggle rows, not <select> elements"
    - "background-color / container-background-color / border-color render as compact swatch rows (color square + hex input on one line)"
    - "Only email-safe props (EMAIL_SAFE_STYLE_PROPS) that are live-visible for the selected component render — no widening of exposed properties"
    - "Selecting an element still updates all controls (prop.upValue wiring intact); empty selection shows the empty-state message"
  artifacts:
    - path: "app/client/src/editor/panelControls.tsx"
      provides: "Figma-style field primitives (segmented icon group, swatch row, paired grid input, select/text field, trait field) driven by live GrapesJS Property/Trait objects"
    - path: "app/client/src/editor/RightPanel.tsx"
      provides: "Curated Figma-style section composition over TraitsProvider + StylesProvider"
  key_links:
    - from: "app/client/src/editor/RightPanel.tsx"
      to: "GrapesJS Property.upValue / Trait.setValue"
      via: "field primitives receive live Property/Trait objects and call upValue/setValue on change"
      pattern: "upValue|setValue"
    - from: "app/client/src/editor/RightPanel.tsx"
      to: "EMAIL_SAFE_STYLE_PROPS"
      via: "isEmailSafeProp gate on every rendered style property"
      pattern: "EMAIL_SAFE_STYLE_PROPS|isEmailSafeProp"
---

<objective>
Restyle the editor's right properties panel into a Figma-style inspector: compact paired grid inputs, segmented icon-toggle alignment rows, flat hairline section headers, and fill/stroke swatch rows — replacing the current stacked-label + uppercase-accordion layout.

Purpose: Make the non-dev property panel feel like a modern design tool (Figma) while keeping every EDIT-06 email-safety guarantee intact.
Output: A rewritten `RightPanel.tsx` composing curated sections from a new `panelControls.tsx` field-primitive module. Presentation-layer only — no changes to `editorConfig.ts` sector definitions or the email-safe allowlist.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/rules/grapesjs.md
@.claude/rules/styling.md
@.claude/rules/code-style.md
@.claude/rules/component-patterns.md
@app/client/src/editor/RightPanel.tsx
@app/client/src/editor/editorConfig.ts
@app/client/src/editor/LeftSidebar.tsx
@app/client/src/editor/TopBar.tsx

<interfaces>
<!-- Live from the codebase — executor should use these directly, no exploration needed. -->

editorConfig.ts exports (do NOT modify this file):
- `EMAIL_SAFE_STYLE_PROPS: ReadonlySet<string>` — the EDIT-06 allowlist gate.
- `STYLABLE_BY_TYPE` — scopes visible props per component type (already applied in onEditor).

GrapesJS Property API used by field primitives (from `grapesjs` types):
- `prop.getId()`, `prop.getType()` ('select' | 'radio' | 'color' | 'text' | 'composite' | 'stack' | ...)
- `prop.getLabel()`, `prop.getValue()`, `prop.getDefaultValue()`, `prop.isVisible()`
- `prop.upValue(value: string)` — the write path (triggers canvas + re-render).
- PropertySelect adds: `getOptions()`, `getOptionId(opt)`, `getOptionLabel(opt)`.

Trait API (from `grapesjs`): `trait.getType()`, `trait.getLabel()`, `trait.getName()`,
`trait.getValue({useType})`, `trait.setValue(v)`, `trait.getOptions()`, `trait.getOptionId/Label`.

Providers (from `@grapesjs/react`): `TraitsProvider` → `{ traits }`, `StylesProvider` → `{ sectors }`.
Each Sector: `sector.getName()`, `sector.getId()`, `sector.getProperties()`.

Selection hook: `useSelectedComponent()` → `Component | undefined`.

lucide-react (v1.23.0, installed) icons available for toggles:
- text-align: `AlignLeft`, `AlignCenter`, `AlignRight`, `AlignJustify`
- vertical-align top/middle/bottom: `AlignStartHorizontal`, `AlignCenterHorizontal`, `AlignEndHorizontal`
- section collapse chevron: `ChevronDown`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Build Figma-style field primitives (panelControls.tsx)</name>
  <files>app/client/src/editor/panelControls.tsx</files>
  <behavior>
    - `SegmentedIconGroup` given a select/radio Property renders one toggle button per option; the active option (matching prop.getValue()) is highlighted; clicking calls prop.upValue(optionId). Options with a known icon show the lucide icon; unknown options fall back to the option label text.
    - `SwatchRow` given a color Property renders a color square (native color input) + hex text Input on one line; both write via prop.upValue.
    - `PairedField` renders a single compact input with an in-field prefix glyph (letter or icon) and no stacked label; writes via prop.upValue on change. Designed to sit inside a two-column grid.
    - `SelectField` / `TextField` render compact labelled controls for remaining select/text props (Typography, appearance) preserving current select/text behavior + prop.upValue wiring.
    - `TraitField` (moved from RightPanel) renders checkbox/select/text traits via trait.setValue.
    - A `resolveAlignIcon(propId, optionId)` map returns the correct lucide icon for text-align (left/center/right/justify) and vertical-align (top/middle/bottom); returns null when unmapped.
  </behavior>
  <action>
    Create `app/client/src/editor/panelControls.tsx` exporting the field-primitive components that the rewritten RightPanel composes. All controls are driven by LIVE GrapesJS `Property`/`Trait` objects passed in as props — they must call `prop.upValue(...)` / `trait.setValue(...)` on change exactly as the current `StyleProperty`/`TraitField` do (this preserves canvas wiring and re-render). Do NOT clone values into local state.

    Components to export:
    - `SegmentedIconGroup({ prop }: { prop: Property })` — cast to `PropertySelect`, map `getOptions()`. Render a horizontal row of small square toggle buttons (h-7, rounded-md, border on the group, active = bg-accent text-foreground; inactive = text-muted-foreground hover:text-foreground) mirroring TopBar's device switcher styling. Each button: if `resolveAlignIcon(prop.getId(), optionId)` returns an icon component, render it at `size-4`; else render `getOptionLabel(option)` as text. `aria-pressed` + `aria-label` per button; onClick → `prop.upValue(optionId)`.
    - `SwatchRow({ prop }: { prop: Property })` — one flex row: a `type="color"` input styled as a `size-7` rounded square (reuse the current color-input classes, shrunk) + a hex `Input` (h-8) filling the rest. Guard the color input value with the existing `HEX_COLOR` regex fallback to `#000000`. Both onChange → `prop.upValue(...)`.
    - `PairedField({ prop, glyph }: { prop: Property; glyph: ReactNode })` — a relative wrapper: an absolutely-positioned prefix glyph on the left (text-[11px] text-muted-foreground or an icon) + an `Input` with left padding to clear the glyph (h-8, text-[13px]). No `<span>` label above. onChange → `prop.upValue(...)`, placeholder = `prop.getDefaultValue()`.
    - `SelectField({ prop })` and `TextField({ prop })` — compact labelled controls for the remaining Typography/appearance props. Keep the existing `selectClass` string (move it here) for selects; label is a `text-[11px] text-muted-foreground` above a h-8 control. These are the fallback for props not handled by the specialized rows.
    - `TraitField({ trait })` — move verbatim from RightPanel.tsx (checkbox/select/text via trait.setValue), keeping its label/aria behavior.
    - `resolveAlignIcon(propId, optionId)` helper + an internal icon lookup: text-align → { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }; vertical-align → { top: AlignStartHorizontal, middle: AlignCenterHorizontal, bottom: AlignEndHorizontal }.

    Conventions: `type` not `interface`; `import type` for Property/PropertySelect/Trait/ReactNode; named lucide imports only (performance.md); `const` arrow components; curly braces on every `if`; Tailwind + `cn()` only — NO inline `style={{}}` objects (styling.md) except the unavoidable native color-input case already present. Add concise JSDoc one-liners on exported components per jsdoc.md.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
  </verify>
  <done>panelControls.tsx compiles with no type errors; exports SegmentedIconGroup, SwatchRow, PairedField, SelectField, TextField, TraitField, resolveAlignIcon; every control writes through prop.upValue / trait.setValue; no local-state mirroring of values; no new libraries added.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Rewrite RightPanel.tsx into curated Figma sections</name>
  <files>app/client/src/editor/RightPanel.tsx</files>
  <behavior>
    - Panel builds a `Map<propId, Property>` from all non-forbidden sectors' properties, filtered by `isVisible()`, non-composite/non-stack, and `isEmailSafeProp` — a single flat lookup independent of which sector GrapesJS placed each prop in.
    - Curated sections render in fixed order, each pulling specific prop ids from the map; a section with zero present props renders nothing (returns null). Order: Content (traits) → Alignment (text-align, vertical-align) → Layout (width, height) → Appearance (border-radius, padding, inner-padding) → Fill (background-color, container-background-color) → Stroke (border, border-width, border-style, border-color) → Typography (font-family, font-size, font-weight, font-style, color, line-height, letter-spacing, text-decoration, text-transform). NO Effects/box-shadow section.
    - Section headers are flat: bold ~13px title, hairline top border between sections, subtle collapse (small ChevronDown), no uppercase tracking.
    - Alignment props render via SegmentedIconGroup; width/height via PairedField in a 2-col grid (glyph W / H); padding-family via PairedField grid; Fill/Stroke color props via SwatchRow; remaining props via SelectField/TextField.
    - Header shows the selected element name as the panel title (Figma "Group ▾" style), restyled from the existing chip. Empty selection → existing empty-state message. isForbiddenSector warn stays.
  </behavior>
  <action>
    Rewrite `RightPanel.tsx` to replace the generic sector→accordion loop with a curated Figma layout, importing the primitives from `./panelControls`.

    Keep intact (EDIT-06 — do not weaken): `FORBIDDEN_SECTOR_PATTERN` + `isForbiddenSector` warn; `isEmailSafeProp` using `EMAIL_SAFE_STYLE_PROPS`; the composite/stack + `isVisible()` filters; `useSelectedComponent`; the empty-state text and the `traits.length === 0 && sectors.length === 0` guard.

    Structure:
    - Inside the `StylesProvider` render prop, filter to `safeSectors` (existing isForbiddenSector), then build `const propMap = new Map<string, Property>()` by iterating each safe sector's `getProperties()` and adding every prop that passes `isVisible()`, is not composite/stack, and passes `isEmailSafeProp`. Key by `prop.getId()`.
    - Define a `getProp = (id: string) => propMap.get(id)` helper and a small `renderSection` helper (a `const` arrow, per code-style render-function rule) that takes a title + children and returns null when children are empty. Use it to build each curated section so the return statement reads as a flat outline.
    - Sections & controls:
      - Content: keep TraitsProvider mapping `traits` → `TraitField` (first section). Only render when `traits.length > 0`.
      - Alignment: `getProp('text-align')` and `getProp('vertical-align')`, each via `SegmentedIconGroup`; render section only if at least one exists.
      - Layout: `width` + `height` via `PairedField` (glyph 'W' / 'H') inside `grid grid-cols-2 gap-2`.
      - Appearance: `border-radius`, `padding`, `inner-padding` — width/padding use `PairedField` in a 2-col grid where two are present; border-radius via PairedField (glyph a corner icon or 'R'). Any missing prop is simply skipped.
      - Fill: `background-color`, `container-background-color` via `SwatchRow`.
      - Stroke: `border-color` via `SwatchRow`; `border`, `border-width` via TextField/PairedField; `border-style` via SelectField.
      - Typography: `font-family`, `font-size`, `font-weight`, `font-style`, `color`, `line-height`, `letter-spacing`, `text-decoration`, `text-transform` — font-size/line-height/letter-spacing via PairedField grid where sensible; `color` via SwatchRow; selects via SelectField; font-family via SelectField/TextField.
    - Collapsible: keep shadcn `Accordion type="multiple"` (already a dependency) with all curated sections open by default, BUT restyle `AccordionTrigger` to the flat Figma header — `text-[13px] font-semibold text-foreground`, `border-t` hairline (except the first), no uppercase/tracking; the built-in chevron is fine (small). Alternatively a lightweight local collapsible is acceptable — keep collapse subtle either way.
    - Header (`renderHeader`): show `selectedName` as a Figma-style title (e.g. `text-[13px] font-semibold` with a subtle caret) instead of the pill chip; keep the "Select an element…" empty state when nothing is selected.

    Conventions: destructure render-prop args; `const` arrow render helpers defined inside the component (close over propMap); early `return null` inside renderSection; curly braces on every if; no inline style objects; keep the ~300px `aside` width and `overflow-y-auto`.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
  </verify>
  <done>RightPanel.tsx compiles; renders curated ordered sections from a propId→Property map; only email-safe visible props appear (isEmailSafeProp + isVisible + non-composite/stack gates unchanged); isForbiddenSector warn retained; alignment = icon toggles, width/height = paired grid, fill/stroke = swatch rows; empty-state preserved; no changes to editorConfig.ts.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Figma-style right inspector panel: flat hairline section headers, paired W/H grid inputs, segmented icon-toggle alignment rows, and fill/stroke swatch rows — composed over the same email-safe GrapesJS property set.</what-built>
  <how-to-verify>
    1. Run the app (`npm run dev` at repo root; kill stale servers on 3000/5173 first per MEMORY).
    2. Open the editor, drop a branded/generic block, and select elements of different types:
       - Select an `mj-text`: Typography section shows font controls; Alignment shows text-align as an icon toggle row; changing alignment updates the canvas.
       - Select an `mj-image`: Layout shows W/H as side-by-side inputs with in-field W/H prefixes; changing width resizes the image.
       - Select an `mj-section`/`mj-column`: Fill shows background-color as a swatch row (square + hex); vertical-align (column) shows as icon toggles.
       - Select an `mj-button`: border/stroke controls + inner-padding appear; changes reflect on canvas.
    3. Confirm section headers are flat Figma-style (bold ~13px title, thin dividers, subtle collapse) — not uppercase-tracking accordion chrome.
    4. Confirm NO forbidden controls appear (no box-shadow/flex/position/grid); check the console for the isForbiddenSector warn if any injected sector was hidden.
    5. Deselect: panel shows the "Select an element…" empty state.
  </how-to-verify>
  <resume-signal>Type "approved" or describe visual/interaction issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- `cd app/client && npx tsc --noEmit` passes (both new/edited files typecheck).
- EDIT-06 gates unchanged: `isEmailSafeProp` (EMAIL_SAFE_STYLE_PROPS), `isForbiddenSector` warn, composite/stack + `isVisible()` filters all retained.
- No edits to `editorConfig.ts`; no new npm dependencies (lucide-react + shadcn accordion already present).
- Human verify checkpoint confirms Figma look + live wiring across mj-text/image/section/column/button.
</verification>

<success_criteria>
- Right panel renders curated Figma-style sections (Content, Alignment, Layout, Appearance, Fill, Stroke, Typography) in fixed order, each empty-collapsing.
- Alignment = lucide icon toggle rows; Layout = paired grid inputs with in-field prefixes; Fill/Stroke = swatch rows; headers = flat hairline style.
- Only email-safe, live-visible props render; prop.upValue / trait.setValue wiring intact; selection + empty state behave as before.
</success_criteria>

<output>
Create `.planning/quick/260707-cee-figma-style-right-panel/260707-cee-SUMMARY.md` when done.
</output>
