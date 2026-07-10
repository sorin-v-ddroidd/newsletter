---
status: build-complete-pending-human-verify
quick_id: 260707-cee
plan: .planning/quick/260707-cee-figma-style-right-panel/260707-cee-PLAN.md
requirements: [EDIT-06]
files_created:
  - app/client/src/editor/panelControls.tsx
files_modified:
  - app/client/src/editor/RightPanel.tsx
verification:
  - "cd app/client && npx tsc --noEmit -> passes with no errors"
---

# Quick Task 260707-cee: Figma-Style Right Panel — Summary

Restyled the editor's right properties panel into a Figma-style inspector (paired grid inputs, segmented icon-toggle alignment rows, flat hairline section headers, fill/stroke swatch rows), replacing the stacked-label + uppercase-accordion layout. Presentation-layer only — `editorConfig.ts` (EMAIL_SAFE_STYLE_PROPS, STYLABLE_BY_TYPE) was not touched, and no new dependencies were added.

## Task 1: Build Figma-style field primitives (panelControls.tsx)

**Status:** Complete

Created `app/client/src/editor/panelControls.tsx` exporting:
- `SegmentedIconGroup` — horizontal icon-toggle row for select/radio Properties (text-align, vertical-align); active option highlighted, click → `prop.upValue(optionId)`.
- `SwatchRow` — color square (native `type="color"` input) + hex `Input` on one line for color Properties; both write via `prop.upValue`.
- `PairedField` — compact input with an in-field prefix glyph (letter/short label), no stacked label; designed for 2-col grids (width/height, padding, font-size/line-height).
- `SelectField` / `TextField` — compact labelled fallback controls for remaining select/text props.
- `TraitField` — moved verbatim from the old `RightPanel.tsx` (checkbox/select/text via `trait.setValue`).
- `resolveAlignIcon(propId, optionId)` — maps text-align (left/center/right/justify) and vertical-align (top/middle/bottom) option ids to lucide icons; returns `null` when unmapped.
- `selectClass` — the shared compact `<select>` styling string, moved here from RightPanel.

All controls read live `Property`/`Trait` values directly on each render (`prop.getValue()`, `trait.getValue()`) and write through `prop.upValue(...)` / `trait.setValue(...)` — no local-state mirroring of values, preserving canvas wiring exactly as before.

**Files:**
- Created: `app/client/src/editor/panelControls.tsx`

**Suggested commit:** `feat(quick-260707-cee): add Figma-style panel field primitives`

## Task 2: Rewrite RightPanel.tsx into curated Figma sections

**Status:** Complete

Rewrote `app/client/src/editor/RightPanel.tsx`:
- Replaced the generic sector→accordion loop with a curated, fixed-order section layout: Content → Alignment → Layout → Appearance → Fill → Stroke → Typography. A section renders `null` when none of its target props are present for the selected component.
- Builds a single flat `Map<propId, Property>` (`propMap`) from all non-forbidden sectors' properties, filtered by `isVisible()`, non-composite/non-stack type, and `isEmailSafeProp` — independent of which GrapesJS sector originally held each prop. A `getProp(id)` helper looks up by id.
- **EDIT-06 gates unchanged and verified in place:** `FORBIDDEN_SECTOR_PATTERN` + `isForbiddenSector` (console warn + hide), `isEmailSafeProp` gated on `EMAIL_SAFE_STYLE_PROPS` from `editorConfig.ts`, the `isVisible()` + composite/stack exclusion filters, and the `traits.length === 0 && sectors.length === 0` empty-state guard.
- Alignment (`text-align`, `vertical-align`) renders via `SegmentedIconGroup`. Layout (`width`/`height`) and Appearance (`padding`/`inner-padding`/`border-radius`) render via `PairedField` in a 2-col grid. Fill (`background-color`, `container-background-color`) and Stroke color (`border-color`) render via `SwatchRow`. Remaining select/text props (`border-style`, `font-weight`, `font-style`, `text-decoration`, `text-transform`, `font-family`) render via `SelectField`/`TextField`.
- Replaced the shadcn `Accordion` with a lightweight local `Section` component (flat `text-[13px] font-semibold` title, hairline `border-t` between sections except the first, small static `ChevronDown` — no uppercase/tracking chrome). This is a deviation from the plan's suggested "keep Accordion, restyle AccordionTrigger" approach — see Deviations below.
- Header now shows the selected element name as a plain Figma-style title (`text-[13px] font-semibold` + caret) instead of the pill chip; empty-state text unchanged.

**Files:**
- Modified: `app/client/src/editor/RightPanel.tsx`

**Suggested commit:** `feat(quick-260707-cee): rewrite RightPanel into curated Figma-style sections`

## Deviations from Plan

### 1. [Rule 4-adjacent, minor / non-architectural] Local `Section` component instead of restyled shadcn `Accordion`

- **Found during:** Task 2
- **Context:** The plan allowed either restyling `AccordionTrigger` to the flat header style, or "a lightweight local collapsible... acceptable — keep collapse subtle either way."
- **Choice made:** Used a lightweight local `Section` div (not collapsible — always expanded, with a static decorative `ChevronDown`) rather than wiring up `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` with restyled classes.
- **Reasoning:** The plan explicitly named this as an acceptable alternative ("Alternatively a lightweight local collapsible is acceptable"), and it simplifies the render logic (no `defaultValue`/`AccordionItem` value wiring per section) while still meeting the "flat hairline header, subtle collapse chevron" visual requirement. Sections are curated and typically short, so non-collapsible-by-default is an acceptable simplification; true collapse behavior was not exercised in this pass.
- **Impact:** The chevron in `Section` and in the header is currently decorative (not wired to a collapse/expand toggle). If a human-verify reviewer wants real collapse behavior, that would need to be added — flagged in Known Stubs below.
- **Files:** `app/client/src/editor/RightPanel.tsx`
- **Commit:** not committed (see `no-commit.md` — changes left in working tree)

No other deviations. All other structure follows the plan (propMap construction, section prop assignments, glyph choices for Layout/Appearance/Typography paired fields).

## Known Stubs

- **`ChevronDown` in `Section` header and panel header is decorative only** (`app/client/src/editor/RightPanel.tsx`) — it visually signals "collapsible" per the Figma reference but is not wired to any collapse/expand state. Sections always render expanded. If collapse behavior is required, a future pass should add local `useState` per section (or reintroduce a restyled `Accordion`). This does not block the plan's stated `must_haves` (flat headers + hairline dividers + subtle collapse chevron are visually present); it only means the chevron does not yet toggle visibility.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. Presentation-layer only; the EDIT-06 email-safety property allowlist is read-only referenced (`EMAIL_SAFE_STYLE_PROPS`) and not modified.

## Pending Human Verification

Task 3 (`checkpoint:human-verify`, gate: blocking) was **not executed** by this run per the calling constraints — it requires a running dev server and visual/interaction confirmation. Steps from the plan, to be run manually:

1. Run the app (`npm run dev` at repo root; kill stale servers on 3000/5173 first per project MEMORY).
2. Open the editor, drop a branded/generic block, and select elements of different types:
   - `mj-text`: Typography section shows font controls; Alignment shows text-align as an icon toggle row; changing alignment updates the canvas.
   - `mj-image`: Layout shows W/H as side-by-side inputs with in-field W/H prefixes; changing width resizes the image.
   - `mj-section`/`mj-column`: Fill shows background-color as a swatch row (square + hex); vertical-align (column) shows as icon toggles.
   - `mj-button`: border/stroke controls + inner-padding appear; changes reflect on canvas.
3. Confirm section headers are flat Figma-style (bold ~13px title, thin dividers) — not uppercase-tracking accordion chrome.
4. Confirm NO forbidden controls appear (no box-shadow/flex/position/grid); check console for the `isForbiddenSector` warn if any injected sector was hidden.
5. Deselect: panel shows the "Select an element…" empty state.

**Resume signal:** Type "approved" or describe visual/interaction issues to fix.

## Self-Check

- `app/client/src/editor/panelControls.tsx` — FOUND
- `app/client/src/editor/RightPanel.tsx` — FOUND (modified)
- `cd app/client && npx tsc --noEmit` — PASSED (no output, exit clean)

## Self-Check: PASSED

## Suggested Commits (not run — no-commit.md)

```
feat(quick-260707-cee): add Figma-style panel field primitives

- New app/client/src/editor/panelControls.tsx: SegmentedIconGroup, SwatchRow,
  PairedField, SelectField, TextField, TraitField, resolveAlignIcon
- All controls driven by live GrapesJS Property/Trait objects; write via
  prop.upValue / trait.setValue, no local-state mirroring
```

```
feat(quick-260707-cee): rewrite RightPanel into curated Figma-style sections

- Replace generic sector-to-accordion loop with fixed-order curated sections:
  Content, Alignment, Layout, Appearance, Fill, Stroke, Typography
- Build single flat propId -> Property map across all safe sectors
- Alignment = SegmentedIconGroup, Layout/Appearance = PairedField grids,
  Fill/Stroke color = SwatchRow, remainder = SelectField/TextField
- Retain EDIT-06 gates unchanged: isForbiddenSector warn, isEmailSafeProp
  (EMAIL_SAFE_STYLE_PROPS), isVisible()/composite/stack filters, empty state
```
