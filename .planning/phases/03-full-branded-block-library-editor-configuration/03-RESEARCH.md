# Phase 3: Full Branded Block Library + Editor Configuration - Research

**Researched:** 2026-07-13
**Domain:** GrapesJS 0.22.16 + grapesjs-mjml 1.0.8 component-locking, custom Style Manager pickers, and MJML `mj-body` width persistence
**Confidence:** HIGH for BLOCK-03 mechanism and Global Width persistence (verified directly against bundled `node_modules` source); MEDIUM for EDIT-08 UI wiring (verified against existing custom panel code, some behavior inferred); HIGH for EDIT-07 (ready plan + confirmed no other raw surface)

## Summary

This phase's open work is narrower and more mechanical than it looks, because two of the four items resolve to "wire up state that already exists" rather than "build new persistence." Direct inspection of `node_modules/grapesjs/dist/grapes.min.js` and `node_modules/grapesjs-mjml/dist/index.js` (the actual shipped, minified source — not docs) turned up two load-bearing facts CLAUDE.md/grapesjs.md do not mention:

1. **GrapesJS's core HTML parser has a built-in `data-gjs-<prop>` attribute convention** (`modelAttrStart = 'data-gjs-'`, confirmed in the parser's `splitPropsFromAttr`/`getPropAttribute` functions). Any HTML attribute prefixed `data-gjs-` on a tag inside a block's `content` string is extracted into the component **model property** (not left as a DOM/MJML attribute) at parse time, including array-valued props via JSON parsing (`'['..']'` strings are `JSON.parse`'d). This is the correct, already-available mechanism for BLOCK-03 locking — no custom `editor.Components.addType` per-tag override is needed (and a per-tag override would be wrong here, see Pitfall 1).
2. **`mj-body` already models `width` as a real Style Manager property** with `'style-default': {width: '600px'}` and `stylable: ['width', 'background-color']` (grapesjs-mjml's own `addType('mj-body', ...)` defaults). This means the "global width" the user wants is not a new piece of state to invent — it is the existing, already-round-tripped `style.width` on the `mj-body` component. Project JSON already carries it losslessly through `getProjectData`/`loadProjectData` today, with zero new code. The only real work is (a) exposing it in `STYLABLE_BY_TYPE` + the RightPanel so it's reachable, and (b) giving it a friendlier entry point than "find mj-body three levels deep in the Layers tree."

EDIT-07 is confirmed light: the ready `260709-iw7` plan removes the `mj-raw` block, and a source-level check of `editorConfig.ts` (no `panels.add`/`commands.add` for a code view, no MJML-import UI) confirms no other raw-HTML surface exists in the custom shell.

**Primary recommendation:** For BLOCK-03, attach `data-gjs-draggable="false" data-gjs-removable="false"` to the outer `<mj-section>` of each of the 7 branded blocks, and `data-gjs-droppable='["mj-text","mj-image"]'` to their `<mj-column>` tags (an allowlist, not a boolean) so existing text/image children stay reorderable while new arbitrary drops are rejected. For the width panel, add `'mj-body': ['width']` to `STYLABLE_BY_TYPE`, surface it through a new lightweight "Global Settings" popover in `TopBar.tsx` that resolves the `mj-body` component programmatically and renders a clamped 320–900 range control bound to the same GrapesJS `Property` object the Style Manager already uses — not a parallel state store.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Structural locking of branded blocks (BLOCK-03) | Browser / Client (GrapesJS component model) | — | Locking is a component-model concern (`draggable`/`droppable`/`removable`), resolved entirely client-side at parse/select time; nothing crosses to the server |
| Constrained color/font pickers (EDIT-08) | Browser / Client (custom RightPanel) | — | Pure UI constraint on the existing custom inspector; reads live GrapesJS `Property` objects, no new backend contract |
| Global message width | Browser / Client (GrapesJS component style on `mj-body`) | — | Lives in `editor.getProjectData()` exactly like every other style; the export/compile path (already client-side per `260710-lty`) picks it up automatically via `getHtml()` |
| EDIT-07 raw-HTML removal | Browser / Client (Block Manager) | — | `editor.Blocks.remove('mj-raw')` — no server involvement |

## Standard Stack

No new packages. This phase is 100% configuration/wiring against the already-locked triple (`grapesjs@0.22.16`, `grapesjs-mjml@1.0.8`, `@grapesjs/react@2.0.0`). Do not add a dependency for any of BLOCK-03/EDIT-08/global-width — every mechanism needed is already present in the installed packages.

### Package Legitimacy Audit

Not applicable — no new packages are introduced by this phase's open work.

## Architecture Patterns

### BLOCK-03 — the `data-gjs-*` attribute mechanism (verified against source)

**What:** GrapesJS's DOM→component parser (used both for `editor.setComponents()` and for Block Manager `content` strings dropped onto the canvas) recognizes any HTML attribute whose name starts with the literal prefix `data-gjs-` and treats it as a **component model property assignment**, not a DOM/MJML attribute. Confirmed in `node_modules/grapesjs/dist/grapes.min.js`:

```js
// (deobfuscated excerpt, verified present in the shipped 0.22.16 bundle)
me = 'data-gjs-';
const be = function (n, o) {
  return {
    modelAttrStart: me,
    parseAttributeValue: function (t) {
      // 'true'/'false' strings -> booleans; '[...]'/'{...}' strings -> JSON.parse
    },
    splitPropsFromAttr: function (e) {
      // every attribute matching modelAttrStart is moved into `props`,
      // everything else stays in `attrs` (i.e. survives into the real MJML output)
    },
  };
};
```

This `splitPropsFromAttr` call site is in the generic component-definition normalizer (`i.attributes = p.attrs`), which runs for every parsed node regardless of tag name or registered type — so it applies uniformly to `mj-section`/`mj-column`/`mj-text`/etc., not just plugin-registered types.

**Why this matters for BLOCK-03 over a type-level override:** The obvious-looking alternative — `editor.Components.addType('mj-section', { model: { defaults: { draggable: false } } })` — would lock **every** `mj-section` in the document globally, including ones dropped from the generic "1 Column"/"2 Columns" blocks that EDIT-01/02 require to stay fully drag/drop/removable. Branded blocks and generic blocks share the same underlying MJML tags, so locking must be **per-instance** (attached only to the branded block's own content string), not per-type. `data-gjs-*` attributes on the block's own `content` HTML are exactly that: instance-level, and they are stripped before the string is treated as MJML, so they cannot leak into compiled output or the block-isolation compile gate (`verify:blocks`) as literal invalid attributes — they never survive to `attrs`.

**When to use:** Any time a *specific* dropped instance (not a whole tag family) needs a locking flag. This is the correct mechanism for all 7 branded blocks.

**Recommended flag assignment per component region (per user's locked decision):**

| Element in a branded block | Flags to set | Effect |
|---|---|---|
| Outer `<mj-section>` | `data-gjs-draggable="false" data-gjs-removable="false"` | Can't be dragged out of position or deleted; children inside are unaffected |
| `<mj-column>` | `data-gjs-droppable='["mj-text","mj-image"]'` | Existing `mj-text`/`mj-image` children can still be reordered among themselves (a move is still a "drop" that must match the allowlist); a *new* arbitrary block from the palette (Button, Divider, a different section, etc.) does not match the allowlist and is rejected on drop — this is what "no arbitrary drops" means in practice |
| `<mj-text>` / `<mj-image>` regions | *(no `data-gjs-*` attributes — leave at framework defaults)* | Stay `editable`/`removable`/`draggable` (movable within the allowed column) per the user's locked decision |

`droppable` accepts an array of type/tag selectors (not just a boolean) — this is the exact same style grapesjs-mjml itself uses internally for `mj-body`'s own `droppable: [...]` allowlist, so it is a proven, in-ecosystem pattern, not a novel workaround.

**Example (`hero.ts`, illustrative — do not implement without a plan task, this is the researched pattern only):**

```ts
content: `<mj-section background-color="${D.backgroundColor}" data-gjs-draggable="false" data-gjs-removable="false">
  <mj-column data-gjs-droppable='["mj-text","mj-image"]'>
    <mj-image src="..." fluid-on-mobile="true"></mj-image>
    <mj-text color="${D.textColor}" font-family="${D.fontFamily}" ...>
      <p>...</p>
    </mj-text>
  </mj-column>
</mj-section>`
```

### Existing LeftSidebar delete-gate consistency (already correct, verify only)

`LeftSidebar.tsx`'s `LayerItem` already gates the delete button on `component.get('removable') !== false`, and `actions.ts`'s `canDuplicate` mirrors the same check plus excludes `mjml`/`mj-body` tags. Once `data-gjs-removable="false"` lands on the branded `<mj-section>`, both the Layers-panel delete icon and the duplicate action automatically respect it with **zero code changes** — this is the payoff of using the framework's own `removable` model property instead of a bespoke "is this a locked block" flag. Confirm this in-editor after the attribute change (see Validation Architecture) rather than assuming it from the code read alone.

### Global Width — where it lives and how it reaches export

**Verified from `grapesjs-mjml/dist/index.js`:** the `mj-body` component type (internal alias `ft = 'mj-body'`) is registered with:

```js
// deobfuscated excerpt
t.Components.addType('mj-body', {
  isComponent: o('mj-body'),
  model: {
    defaults: {
      droppable: [/* mj-section, mj-hero, mj-raw, ... */],
      draggable: false,
      copyable: false,
      removable: false,
      highlightable: false,
      'style-default': { width: '600px' },
      stylable: ['width', 'background-color'],
    },
  },
  // toHTML/getAttrToHTML: merges style + style-default into `attributes`,
  // and OMITS any attribute whose value equals the style-default (so an
  // untouched width never appears in output — MJML's own 600px default applies)
});
```

Consequences (all HIGH confidence, source-verified):

- **No new persistence mechanism is needed.** `mj-body.style.width` is a normal GrapesJS style property. It is already included in `editor.getProjectData()` and restored by `editor.loadProjectData()` — the existing Phase-1 round-trip gate (`assertRoundTrip` in `actions.ts`) already covers it structurally; it just isn't exercised because nothing sets it yet.
- **No new compile-path code is needed.** `editor.getHtml()` serializes the `mj-body` component's `attributes` (merged from style + style-default), so a user-set width flows straight through as `<mj-body width="750px">` in the string `getExportMjml()`/`compileDraft()` already produce. `buildFullMjml()` in `app/shared/mjml-head.ts` only touches `<mj-head>` (it explicitly strips and reinjects only the head, via regex scoped to `<mj-head>...</mj-head>`) — it does not touch `<mj-body>` or its attributes, so the width survives untouched through `CANONICAL_HEAD` injection on both the server (`mjml@4.18.0`) and client (`mjml-browser@4.18.0`) compile paths, preserving EXPORT-04 parity.
- **The property is not currently reachable in the UI**, because `mj-body` is absent from `STYLABLE_BY_TYPE` in `editorConfig.ts`. The `component:selected` handler only calls `component.set('stylable', props)` when a `STYLABLE_BY_TYPE` entry exists for the selected type; since none exists for `'mj-body'`, the component keeps grapesjs-mjml's own default `stylable: ['width', 'background-color']` — meaning `width` is *technically already visible* today if a user manages to select `mj-body` and open the (currently generic) "Dimension" sector. It is not disabled, just undiscoverable and unconstrained to the 320–900 range.
- **`mj-body` is already selectable.** It has no `selectable: false` in its defaults (only `draggable`/`copyable`/`removable`/`highlightable` are locked), and `LeftSidebar.tsx`'s `LayerItem` `onClick` calls `editor.select(component)` unconditionally — the `isStructural` check there only hides the delete/visibility icons, it does not block selection. Confirmed structurally: `mj-body` appears in the Layers tree (nested under the artificial `wrapper` → `mjml` root), so `useSelectedComponent()` + `RightPanel` already work for it with no changes to selection plumbing.

**Recommended approach:**
1. Add `'mj-body': ['width']` to `STYLABLE_BY_TYPE` in `editorConfig.ts` — deliberately **omit** `'background-color'` from this instance-scoped list even though the plugin default includes it, because the user's decision is WIDTH ONLY (no global color control this round). Setting `stylable` explicitly to `['width']` on selection enforces that scope narrowing for free.
2. Do **not** rely on the user finding `mj-body` in the Layers tree as the primary UX (poor discoverability — it's nested 2+ levels under structural rows that are deliberately de-emphasized). Add a dedicated **"Global Settings" entry point** — a gear/settings item in `TopBar.tsx`'s existing overflow `DropdownMenu` (or a small popover) that:
   - Programmatically resolves the `mj-body` component (walk from `editor.getWrapper()` down to the first component whose `get('tagName')` is `'mj-body'` — a small recursive helper, same shape as `actions.ts`'s existing `collectHidden`/`flattenLayerTree` walkers).
   - Reads/writes the **same** GrapesJS style property the Style Manager would (`component.getStyle().width` / `component.addStyle({ width: ... })`), so there is exactly one source of truth and the panel and this shortcut can never disagree.
   - Renders a range/slider or a clamped number input (320–900, default/fallback 600) — clamp in the `onChange` handler before calling `addStyle`, since the underlying MJML/GrapesJS property itself has no min/max enforcement (it's a plain `text`-typed property in the Style Manager's `dimension` sector).
3. Existing `RightPanel.tsx` `renderLayout()` will also start showing a generic `width` field whenever `mj-body` is selected (harmless, but has no 320–900 clamp) — either scope `renderLayout`'s width control to exclude `mj-body` (favor the dedicated Global Settings surface only) or give it the same clamped control component so behavior is consistent whichever path the user takes. Recommend a single shared `WidthRangeField` component used by both surfaces to avoid drift.

### EDIT-08 — constrained pickers, plugged into the existing custom panel

**Current state (verified by reading `panelControls.tsx`):** `SwatchRow` renders a native `<input type="color">` (fully free-form OS color picker) plus a free-text hex `<Input>` — no constraint today. The `font-family` Style Manager property is not overridden in `editorConfig.ts`'s `styleManagerSectors` (it's referenced as the bare string `'font-family'`), so GrapesJS falls back to its **built-in** core property definition, which ships `default: 'Arial, Helvetica, sans-serif'` with a generic `optsFonts` list of common web-safe stacks (Arial, Helvetica, Times New Roman, Courier New, Georgia, etc.) — none of which is the DDROIDD brand stack. Today a user can pick an off-brand font from that default list; this is the actual EDIT-08 gap for fonts, not merely "the widget is too open."

**Recommended approach:**
1. **Colors:** Replace free-form `SwatchRow` with a constrained variant (or a new `ConstrainedSwatchRow`) that renders a fixed row of swatch buttons — one per `BLOCK_DEFAULTS` color (`backgroundColor` `#0B1624`, `accentColor` `#F45E43`, `textColor` `#ffffff`) — each calling `prop.upValue(hex)` on click, with the currently active value highlighted (compare `prop.getValue()` against each candidate, case-insensitive). Do not keep the native `<input type="color">` swatch (it is definitionally free-form) or the free-text hex `<Input>`. `BLOCK_DEFAULTS` is already imported by `editorConfig.ts`; import it into `panelControls.tsx` as the single source of truth (no parallel palette constant, per the locked decision).
2. **Fonts:** Override the `font-family` sector entry in `editorConfig.ts`'s `styleManagerSectors` from the bare string `'font-family'` to an explicit property definition with `type: 'select'` and `options` restricted to `[{ id: BLOCK_DEFAULTS.fontFamily, label: 'Brand font' }]` (a single-option constrained dropdown, matching the fact that `BLOCK_DEFAULTS` defines exactly one approved stack). This reuses the existing `SelectField` component in `panelControls.tsx` unchanged — no new control needed, just a correctly-scoped `options` list. If, during planning, a second/monospace variant is deemed necessary, add it to `BLOCK_DEFAULTS` first (one source of truth) and then to this `options` array — never a separate constant.
3. Both changes are pure `editorConfig.ts`/`panelControls.tsx` edits; no GrapesJS API beyond what's already used (`Property.upValue`, `PropertySelect.getOptions`) is needed.

### EDIT-07 — confirmed scope (light)

- The ready plan at `.planning/quick/260709-iw7-remove-the-mj-raw-block-from-the-editor-/260709-iw7-PLAN.md` is directly executable as-is: `editor.Blocks.remove('mj-raw')` guarded by `editor.Blocks.get('mj-raw')`, placed next to the existing `devices-c` panel removal in `onEditor`.
- Confirmed via reading `editorConfig.ts` end-to-end: there is no `editor.Panels.add(...)` for an export-code/view-code button, no `commands.add('core:open-code')` or similar, and no MJML-import UI (no file input, no textarea-based "paste MJML" affordance) anywhere in the custom shell (`TopBar.tsx`, `LeftSidebar.tsx`, `RightPanel.tsx`). grapesjs-mjml's own default UI (which does ship an export/code-view command in some configurations) is never mounted — this app runs in `@grapesjs/react` custom-UI mode with `<Canvas />` only, so the plugin's default panels never render. No additional removal work is needed beyond the `mj-raw` block itself.
- Action for this phase: execute the existing plan (fold it in, per CONTEXT.md), then add one explicit verification pass confirming no other raw-markup surface is reachable (the checkpoint in the iw7 plan already does most of this — the only addition is explicitly asserting "no code/view-source button exists anywhere in TopBar/RightPanel", which is a look-and-confirm, not new code).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-instance component locking | A custom `editor.Components.addType` override keyed by tag name | `data-gjs-<prop>` attributes directly in the block's own `content` string | Type-level overrides lock every instance of that tag globally, including generic (non-branded) uses of the same MJML tags — breaks EDIT-01/02 for generic blocks |
| "Allow only some children to be dropped" | A custom drop-validation `editor.on('component:drop')` listener with manual type checks | `droppable: [...]` array value on the parent (native GrapesJS/grapesjs-mjml feature) | The array-allowlist form is a first-class, already-used-internally GrapesJS feature (`mj-body` itself uses it) — reinventing it in a listener duplicates logic GrapesJS already runs on every drag operation and is easy to get subtly wrong (e.g. missing the "existing child reorder is also a drop" case) |
| A separate "global newsletter settings" JSON blob for width | A parallel state object saved alongside `getProjectData()` | The existing `mj-body` component's `style.width`, already inside `getProjectData()` | Two sources of truth for the same value (component style vs. a side-channel) is exactly the canonical-state violation `.claude/rules/grapesjs.md` exists to prevent; it would also require new merge/apply logic at load and at compile that the existing pipeline doesn't need |
| A second brand-color/font constant for pickers | A new `PICKER_PALETTE` or similar constant | `BLOCK_DEFAULTS` (already exists, already imported by `editorConfig.ts`) | Explicit locked decision: "one source of truth — do NOT author a separate parallel palette constant" |

**Key insight:** every open item in this phase is solvable by *scoping* an existing GrapesJS/grapesjs-mjml mechanism (attribute-based instance props, array-valued `droppable`, `mj-body`'s own style property, the existing custom `Property`/`Trait` render primitives) rather than by adding new machinery. The risk in this phase is not "can we build it" but "did we accidentally lock/unlock the wrong scope" (type vs. instance) or "did we introduce a second source of truth."

## Common Pitfalls

### Pitfall 1: Type-level locking silently breaks generic blocks
**What goes wrong:** Locking `mj-section`/`mj-column` via `editor.Components.addType(...)` (as the grapesjs.md example snippet literally shows) applies to *every* component of that type in the whole document, not just the branded ones.
**Why it happens:** The example in `.claude/rules/grapesjs.md` "Component locking" section is generic/illustrative, not scoped — it's easy to copy it verbatim and get global locking by accident.
**How to avoid:** Use `data-gjs-*` attributes inside each branded block's own `content` string (instance-level) instead of `addType` overrides (type-level) for BLOCK-03.
**Warning signs:** After implementing, drag a generic "1 Column" block from the palette and confirm it is still fully draggable/removable/droppable — if it silently isn't, the lock was applied at the type level.

### Pitfall 2: `data-gjs-*` attributes leaking into the headless compile gate
**What goes wrong:** `app/server/scripts/verify-blocks.ts` compiles each block's raw `content` string **directly** through the real `mjml` npm package — it does not go through GrapesJS's parser, so `data-gjs-draggable="false"` etc. are NOT stripped in that path; they reach `mjml2html()` as literal, unrecognized attributes on `<mj-section>`/`<mj-column>`.
**Why it happens:** Two different parsers see the same string: GrapesJS's DOM parser (strips `data-gjs-*` into props) when the block is dropped in-editor, and the raw XML-based `mjml` compiler (does not know about `data-gjs-*`) when `verify-blocks.ts` compiles the string directly for the isolation gate.
**How to avoid:** After adding the attributes, run (a fixed — see Pitfall 3) `verify:blocks` and check `result.errors` for each affected block. MJML 4.x's soft validation is generally lenient about unrecognized attributes (they are typically ignored, not hard errors), but this must be *confirmed*, not assumed — do not treat "MJML tolerates unknown attrs" as a verified fact in this research (LOW confidence, flagged in Open Questions).
**Warning signs:** `verify:blocks` reporting new warnings/errors on branded blocks after the locking attributes are added that were not present before.

### Pitfall 3: `verify:blocks`/`verify:compile` reference stale import paths
**What goes wrong:** `app/server/scripts/verify-blocks.ts` imports block modules from `../../client/src/blocks/hero` (and siblings) — this path no longer exists. The `260705-h8h` refactor moved these files to `app/client/src/editor/blocks/`. Running `npm run verify:blocks` today from `app/server` will fail to resolve these imports.
**Why it happens:** The refactor updated the editor's own imports (`registerBlocks.ts` etc.) but the standalone verify script, which reaches across package boundaries via relative paths, was missed.
**How to avoid:** This phase's plan should include a small task to fix the import paths in `verify-blocks.ts` (and check `verify-compile.ts`/`verify-parity.ts` for the same staleness) *before* relying on it as a compile gate for the BLOCK-03 attribute changes — otherwise the gate silently can't run at all (module-not-found), not merely "passes trivially."
**Warning signs:** `tsx scripts/verify-blocks.ts` throwing a module-resolution error rather than a PASS/FAIL report.

### Pitfall 4: Locking `droppable` as a plain `false` boolean on `mj-column` blocks reordering, not just new drops
**What goes wrong:** If `mj-column`'s `droppable` is set to boolean `false` (rather than an allowlist array) to stop "arbitrary drops," it also blocks a user from dragging an existing `mj-text`/`mj-image` child to reorder it within the same column, because GrapesJS's move-via-drag uses the same droppable check on the target as a new external drop.
**Why it happens:** `droppable: false` and `droppable: [...]` look similar but have very different semantics — only the array form discriminates by the dragged item's type.
**How to avoid:** Use the array-allowlist form (`data-gjs-droppable='["mj-text","mj-image"]'`), matching the pattern grapesjs-mjml itself uses for `mj-body`.
**Warning signs:** In-editor test: try to drag the hero block's image below its text within the same column — if it silently fails/snaps back, `droppable` was set as a boolean, not an allowlist.

### Pitfall 5: `renderLayout()`'s generic `width` field showing up unconstrained for `mj-body`
**What goes wrong:** Simply adding `'mj-body': ['width']` to `STYLABLE_BY_TYPE` makes `RightPanel.tsx`'s existing `PairedField`-based width control appear whenever `mj-body` is selected — but that control is a raw text input with no 320–900 clamp, undermining the "AC-style range control" intent.
**Why it happens:** `RightPanel` is generic-by-design (any component with a `width` stylable prop gets the same `PairedField`); it has no per-component-type special-casing today.
**How to avoid:** Either exclude `mj-body` from the generic Layout section's width rendering (steer users to the dedicated Global Settings entry point only) or build one shared clamped `WidthRangeField` and use it in both places, keyed off `selected.get('tagName') === 'mj-body'`.
**Warning signs:** Two different-looking width controls for the same underlying property, or a user typing `50` into the generic field with no clamp/feedback.

## Code Examples

### Reading/writing `mj-body` width programmatically (Global Settings entry point)

```ts
// Source: derived from actions.ts's existing tree-walk patterns (collectHidden, flattenLayerTree)
// plus grapesjs-mjml's verified mj-body model defaults (style-default.width = '600px').
import type { Editor as GrapesEditor, Component } from 'grapesjs';

const findMjBody = (component: Component): Component | undefined => {
  if (String(component.get('tagName')) === 'mj-body') {
    return component;
  }
  for (const child of component.components()) {
    const found = findMjBody(child);
    if (found) {
      return found;
    }
  }
  return undefined;
};

export const getMessageWidth = (editor: GrapesEditor): number => {
  const wrapper = editor.getWrapper();
  const mjBody = wrapper && findMjBody(wrapper);
  const raw = mjBody?.getStyle()['width'];
  const parsed = raw ? Number.parseInt(String(raw), 10) : 600;
  return Number.isFinite(parsed) ? parsed : 600;
};

export const setMessageWidth = (editor: GrapesEditor, px: number): void => {
  const clamped = Math.min(900, Math.max(320, px));
  const wrapper = editor.getWrapper();
  const mjBody = wrapper && findMjBody(wrapper);
  mjBody?.addStyle({ width: `${clamped}px` });
};
```

### `data-gjs-*` locking attributes in a branded block (BLOCK-03 pattern)

```ts
// Source: verified data-gjs- parser mechanism (grapesjs core 0.22.16 bundle) + existing
// hero.ts block shape. Illustrative only — implement via a planned task, not verbatim.
export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'DDROIDD Hero',
  category: 'DDROIDD',
  content: `<mj-section background-color="${D.backgroundColor}" data-gjs-draggable="false" data-gjs-removable="false">
  <mj-column data-gjs-droppable='["mj-text","mj-image"]'>
    <mj-image src="..." fluid-on-mobile="true"></mj-image>
    <mj-text color="${D.textColor}" font-family="${D.fontFamily}" font-size="${D.fontSize}" line-height="${D.lineHeight}">
      <p>...</p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
```

## State of the Art

Not applicable in the "old vs new library approach" sense — this is a single-vendor, version-locked stack. The relevant "state of the art" finding is intra-project: the codebase's own `grapesjs.md` documents the `editor.Components.addType` locking pattern as *the* mechanism, but that pattern is the wrong scope for per-instance branded-block locking (see Pitfall 1) — the correct, narrower mechanism (`data-gjs-*` instance attributes) is not yet documented anywhere in the repo. Recommend the plan add this to `.claude/rules/grapesjs.md` once implemented, so future block authors don't reach for the type-level pattern by default.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MJML 4.18.0's `validationLevel: 'soft'` compiler treats unrecognized `data-gjs-*` attributes on `mj-section`/`mj-column` as silently ignorable, not as errors, when the raw block string is compiled directly (bypassing GrapesJS's parser) in `verify-blocks.ts`. | Common Pitfalls (Pitfall 2) | If wrong, the fixed `verify:blocks` gate would start failing on every branded block after BLOCK-03 lands, blocking the phase's own verification step until addressed (e.g. stripping the attributes before the direct-mjml-compile check, or accepting the warning as expected noise) |
| A2 | A single-option `font-family` `select` (one approved brand stack) satisfies the EDIT-08 "dropdown of approved values" requirement even though there is only one value to choose from. | Architecture Patterns (EDIT-08) | If the user actually wants 2+ selectable brand font variants, this under-scopes the control; low risk since CONTEXT.md explicitly frames additional colors/fonts as "only if a clear need is found" |

## Open Questions

1. **Does raw `mjml@4.18.0`/`mjml-browser@4.18.0` compile emit an error or silently ignore an unrecognized `data-gjs-*` attribute on `mj-section`/`mj-column`?**
   - What we know: MJML's validator primarily checks *known* attributes against expected types; unknown attribute names are not itemized anywhere in the CLAUDE.md research as a documented failure mode.
   - What's unclear: whether MJML 4.x's soft validation mode ever flags unrecognized attributes as errors (vs. silently passing them through/ignoring them).
   - Recommendation: the plan should include a task step that runs the (path-fixed) `verify:blocks` script immediately after adding the `data-gjs-*` attributes to one block, before doing all seven, and inspect the actual `result.errors` output rather than assuming either outcome.

2. **Exact depth/path to `mj-body` in the live Layers tree for the recursive `findMjBody` walk.**
   - What we know: the seed HTML is `<mjml><mj-body></mj-body></mjml>`, and `LayerItem`'s `isStructural` check treats `root`, `mjml`, and `mj-body` as three distinct tags/levels, implying `wrapper → mjml → mj-body` as the real nesting.
   - What's unclear: whether `editor.getWrapper()` returns the artificial GrapesJS `wrapper` (parent of `mjml`) or is itself remapped to `mjml` by grapesjs-mjml's config (some MJML editor configs set `wrapperIsBody`/similar to collapse a level). The provided `findMjBody` recursive walker in Code Examples is depth-agnostic and works either way, so this only matters if a plan task tries to hardcode an index path instead.
   - Recommendation: use the depth-agnostic recursive walk (as shown), not an index-based traversal — the exact depth doesn't matter if the walk always searches by `tagName === 'mj-body'`.

## Environment Availability

Skipped — this phase is entirely in-repo code/config changes (GrapesJS block content, `editorConfig.ts`, `panelControls.tsx`, `TopBar.tsx`); no new external tool, service, or runtime dependency is introduced.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` (not disabled), so this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None currently wired for the client (`app/client/package.json` has no `vitest`/test runner despite `.claude/rules/testing.md` mandating Vitest-only). Server has headless script-style gates (`tsx scripts/verify-*.ts`), not a test framework. |
| Config file | none — see Wave 0 |
| Quick run command | `cd app/server && npm run verify:blocks` (once import paths are fixed — see Pitfall 3) |
| Full suite command | `cd app/server && npm run verify:blocks && npm run verify:compile && npm run verify:parity` |

This phase's changes (component locking flags, picker constraints, a style property) are fundamentally **in-editor/DOM-parse behaviors** that the grapesjs.md gotcha explicitly says a headless compile gate *cannot* catch (only in-editor canvas parsing can). This means the primary verification for BLOCK-03 and the width control is necessarily a `checkpoint:human-verify` gate in the plan (drag/attempt-to-delete/attempt-to-drop tests against the live canvas), not an automated test. The headless `verify:blocks` gate remains useful only as a secondary "did we accidentally break MJML validity" check (Open Question 1).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BLOCK-03 | Branded `mj-section`/`mj-column` reject drag-out/delete/arbitrary-drop; text/image children remain movable/removable | manual-only (in-editor canvas parse — headless compile cannot observe drag/drop/removable behavior) | none — `checkpoint:human-verify` | N/A |
| BLOCK-03 (secondary) | Branded block content string with new `data-gjs-*` attributes still compiles to valid MJML | smoke | `cd app/server && npm run verify:blocks` (after Pitfall 3 fix) | ✅ (path-broken, needs Wave 0 fix) |
| EDIT-08 | Color swatches offer only `BLOCK_DEFAULTS` values; font dropdown offers only the brand stack | manual-only (visual/UI interaction) | none — `checkpoint:human-verify` | N/A |
| Global width | Range control clamps to 320–900, default 600, and the compiled export reflects the chosen `mj-body` width | manual-only for the UI clamp; automated possible for compile reflection | `cd app/server && npm run verify:compile` after manually setting a width in a saved project fixture — ❌ not currently parameterized for this | ❌ Wave 0 (no existing fixture exercises a non-default `mj-body` width) |
| EDIT-07 | `mj-raw` block absent from panel; no other raw-HTML surface reachable | manual-only (UI panel scan) + the iw7 plan's own automated `grep`/`tsc` check | `grep -q "Blocks.remove('mj-raw')" app/client/src/editor/editorConfig.ts` | ✅ (per ready iw7 plan) |

### Sampling Rate
- **Per task commit:** `cd app/server && npm run verify:blocks` (light compile smoke, once path-fixed) + `cd app/client && npx tsc --noEmit`
- **Per wave merge:** full `verify:blocks`/`verify:compile`/`verify:parity` + the `checkpoint:human-verify` in-editor pass for BLOCK-03/EDIT-08/width
- **Phase gate:** all of the above green, plus explicit confirmation that generic (non-branded) blocks are still fully draggable/droppable/removable after BLOCK-03 lands (Pitfall 1 regression check)

### Wave 0 Gaps
- [ ] `app/server/scripts/verify-blocks.ts` (and check `verify-compile.ts`/`verify-parity.ts`) — fix stale `../../client/src/blocks/*` import paths to `../../client/src/editor/blocks/*` before relying on this as a gate (Pitfall 3)
- [ ] No fixture/project-JSON sample currently exercises a non-default `mj-body` width — add one (or a quick manual save) so `verify:compile`/`verify:parity` can be re-run against it once the width control exists
- [ ] No Vitest/test-runner infra exists on the client despite `.claude/rules/testing.md` mandating it — out of scope to install here (not requested by this phase's decisions), but the plan should note that BLOCK-03/EDIT-08 verification stays human-only until that gap is closed in a later phase

## Sources

### Primary (HIGH confidence — direct source inspection)
- `node_modules/grapesjs/dist/grapes.min.js` (installed `grapesjs@0.22.16`) — `data-gjs-` (`modelAttrStart`) parser mechanism, `splitPropsFromAttr`/`getPropAttribute`/`parseAttributeValue`, `editable`/`draggable`/`droppable`/`removable` default property names, built-in `font-family` core Style Manager property definition
- `node_modules/grapesjs-mjml/dist/index.js` (installed `grapesjs-mjml@1.0.8`) — `mj-body` component type defaults (`droppable` allowlist array, `draggable:false`, `copyable:false`, `removable:false`, `highlightable:false`, `'style-default':{width:'600px'}`, `stylable:['width','background-color']`), `mj-divider`/`mj-spacer` `droppable:false` boolean usage, `getAttrToHTML` style-default-omission logic
- `app/client/src/editor/editorConfig.ts`, `RightPanel.tsx`, `panelControls.tsx`, `LeftSidebar.tsx`, `actions.ts` (this repo) — current styleManager sectors, `STYLABLE_BY_TYPE`, `EMAIL_SAFE_STYLE_PROPS`, selection/deletion gating, project-JSON round-trip guard
- `app/shared/mjml-head.ts` (this repo) — `buildFullMjml`/`CANONICAL_HEAD` scope (head-only, confirms `mj-body` attributes pass through untouched)
- `.planning/quick/260709-iw7-.../260709-iw7-PLAN.md` (this repo) — ready EDIT-07 plan with its own verified `grapesjs-mjml` default-blocks-array evidence
- `app/server/scripts/verify-blocks.ts`, `app/server/package.json` (this repo) — confirmed stale import paths (Pitfall 3)

### Secondary (MEDIUM confidence)
- None separately verified beyond primary source reads for this phase — the domain is narrow enough that direct source inspection covered everything needed.

### Tertiary (LOW confidence)
- MJML 4.x's tolerance for unrecognized attributes during direct (non-GrapesJS) compile (Open Question 1, Assumption A1) — based on general familiarity with MJML's soft-validation behavior, not confirmed against this specific case in this session.

## Metadata

**Confidence breakdown:**
- BLOCK-03 mechanism (`data-gjs-*`, array `droppable`): HIGH — verified directly in the installed, shipped `grapesjs` bundle source, cross-checked against grapesjs-mjml's own internal use of the same pattern
- Global width persistence path: HIGH — verified directly in the installed `grapesjs-mjml` bundle source (`mj-body` defaults) and cross-checked against this repo's own `mjml-head.ts`/`actions.ts` compile pipeline
- EDIT-08 picker wiring: MEDIUM — the *gap* (free-form color input, unrestricted font default list) is verified by reading the actual current code; the *recommended fix* is a straightforward extension of existing, already-verified patterns in the same files, but the exact final UI (single-option dropdown UX) is a design call, not a hard technical fact
- EDIT-07 scope confirmation: HIGH — verified by reading `editorConfig.ts`/`TopBar.tsx`/`RightPanel.tsx`/`LeftSidebar.tsx` in full and finding no other raw-HTML surface, plus the pre-existing verified ready plan
- Pitfall 3 (stale verify-blocks paths): HIGH — verified by directly comparing the import paths in `verify-blocks.ts` against the actual current file tree

**Research date:** 2026-07-13
**Valid until:** No fixed expiry — this research is tied to the LOCKED version triple (`grapesjs@0.22.16`/`grapesjs-mjml@1.0.8`/`@grapesjs/react@2.0.0`) per `.claude/rules/versions.md`. Re-verify against source if any of those pins change (per `versions.md`'s own re-verification protocol), otherwise this research does not go stale on a calendar basis.
