---
phase: quick-260713-mxb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/client/src/editor/editorConfig.ts
  - app/client/src/editor/RightPanel.tsx
  - app/client/src/editor/panelControls.tsx
  - app/client/src/editor/editorConfig.test.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Selecting an image shows an editable, prepopulated Image URL (src) field in the right panel Content section"
    - "The padding field shows the real padding value when only the four longhands exist (no shorthand)"
    - "Right-panel section headers (Content/Alignment/Layout/…) collapse and expand on click"
    - "Project-JSON round-trip stays byte-identical — no model mutation on selection or render"
  artifacts:
    - path: "app/client/src/editor/editorConfig.ts"
      provides: "mj-image trait extension + composePaddingShorthand pure helper"
    - path: "app/client/src/editor/RightPanel.tsx"
      provides: "collapsible Section + padding display fallback wiring"
    - path: "app/client/src/editor/panelControls.tsx"
      provides: "PairedField displayValue fallback prop"
  key_links:
    - from: "RightPanel padding fallback"
      to: "selected.getStyle() longhands"
      via: "composePaddingShorthand (read-only)"
      pattern: "composePaddingShorthand"
---

<objective>
Three right-panel fixes for the newsletter editor:
1. Add `src`/`href`/`alt` traits to `mj-image` so image blocks show editable, prepopulated fields.
2. Padding field shows nothing though longhand paddings exist — add a presentation-only shorthand display fallback derived from the four longhand styles.
3. Make right-panel section headers collapsible (chevron is currently static decoration).

Purpose: Non-devs can edit image URLs and see/edit padding, and can collapse panel sections. All presentation-layer — the Phase-1 project-JSON round-trip must stay byte-identical.
Output: Extended `mj-image` type + `composePaddingShorthand` helper (editorConfig.ts), collapsible `Section` + padding fallback (RightPanel.tsx), `displayValue` prop on `PairedField` (panelControls.tsx), unit test for the compose helper.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.claude/rules/grapesjs.md
@.claude/rules/code-style.md
@app/client/src/editor/editorConfig.ts
@app/client/src/editor/RightPanel.tsx
@app/client/src/editor/panelControls.tsx
@app/client/src/editor/hooks/useSelectedComponent.ts

<interfaces>
Established pattern for extending a plugin component type (editorConfig.ts:264-457):

```ts
const CAROUSEL_IMAGE_TRAITS = [
  { type: 'text', name: 'src', label: 'Image URL' },
  { type: 'text', name: 'alt', label: 'Alt text' },
  { type: 'text', name: 'href', label: 'Link URL (optional)' },
];

editor.Components.addType('mj-carousel-image', {
  isComponent: (el) => el.tagName === 'MJ-CAROUSEL-IMAGE',
  model: { defaults: { tagName: 'mj-carousel-image', droppable: false, traits: CAROUSEL_IMAGE_TRAITS } },
});
```

Padding shorthand parser already present (editorConfig.ts:194) — write the INVERSE next to it:
```ts
const parsePaddingShorthand = (value: string): [string, string, string, string] | null => { ... }
```
Rules: 1-value = all sides; 2-value = "vertical horizontal" → [v1,v2,v1,v2]; 3-value = [v1,v2,v3,v2]; 4-value = [v1,v2,v3,v4].

PairedField current signature (panelControls.tsx:140):
```ts
export const PairedField = ({ prop, glyph }: { prop: Property; glyph: ReactNode }) => {
  const value = String(prop.getValue() ?? '');
  // <Input value={value} placeholder={prop.getDefaultValue()} onChange={prop.upValue} />
}
```

Section current shape (RightPanel.tsx:39) — static ChevronDown, no state:
```tsx
const Section = ({ title, first, children }) => (
  <div className={cnFirst(first)}>
    <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
      <span ...>{title}</span>
      <ChevronDown className="size-3.5 text-muted-foreground" />
    </div>
    <div className="flex flex-col gap-3 px-3.5 pb-4">{children}</div>
  </div>
);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add src/href/alt traits to mj-image</name>
  <files>app/client/src/editor/editorConfig.ts</files>
  <action>
In onEditor (editorConfig.ts), extend the plugin-registered `mj-image` type so its right-panel Content section exposes editable src/href/alt fields. grapesjs-mjml@1.0.8 registers mj-image with traits `['href','rel','alt','title']` and NO `src` trait, so the image URL never appears in the panel. Mirror the existing CAROUSEL_IMAGE_TRAITS pattern: declare a module-level const `MJ_IMAGE_TRAITS = [{type:'text',name:'src',label:'Image URL'},{type:'text',name:'href',label:'Link URL'},{type:'text',name:'alt',label:'Alt text'}]` (dropping `rel`/`title` is deliberate — noise for non-devs). Then in onEditor call `editor.Components.addType('mj-image', { model: { defaults: { traits: MJ_IMAGE_TRAITS } } })`. Do NOT pass `isComponent`/`view`/`tagName` — addType on an EXISTING type shallow-merges `model.defaults`, so `traits` (array) is replaced while the plugin's `isComponent`, `view`, and `stylable` are inherited. Place it near the mj-carousel-image addType block for locality.

If running-editor verification shows the plugin's mj-image model/view is clobbered (image stops rendering on canvas, or drag/drop breaks), fall back to mutating the registered prototype instead of re-declaring: `const imgType = editor.Components.getType('mj-image'); imgType.model.prototype.defaults.traits = MJ_IMAGE_TRAITS;` — this replaces only the traits array and touches nothing else. Prefer the addType approach; use the fallback only if the running editor proves clobbering.

Follow code-style: `const`, curly braces on every `if`, `type` over `interface`.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
    Running editor (dev server on :5174): select an image on the canvas → the right-panel Content section shows an "Image URL" field prepopulated with the image's src, plus "Link URL" and "Alt text". Confirm the image still renders on canvas (view preserved) and an image block still drags/drops from the left panel (isComponent preserved).
  </verify>
  <done>Selecting an image shows editable, prepopulated src/href/alt fields; canvas render and drag/drop of images are unaffected; tsc clean.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Padding shorthand display fallback (presentation-only)</name>
  <files>app/client/src/editor/editorConfig.ts, app/client/src/editor/editorConfig.test.ts, app/client/src/editor/panelControls.tsx, app/client/src/editor/RightPanel.tsx</files>
  <behavior>
    composePaddingShorthand(top,right,bottom,left) — inverse of parsePaddingShorthand, collapsing per CSS rules:
    - Test: ('10px','10px','10px','10px') → '10px'   (all equal → 1 value)
    - Test: ('10px','25px','10px','25px') → '10px 25px'   (top==bottom && right==left → 2 values)
    - Test: ('10px','25px','30px','25px') → '10px 25px 30px'   (right==left, top!=bottom → 3 values)
    - Test: ('1px','2px','3px','4px') → '1px 2px 3px 4px'   (all distinct → 4 values)
  </behavior>
  <action>
Fix the padding field showing empty even though real padding exists. grapesjs-mjml's coreMjmlModel merges `style-default` LONGHANDS (padding-top/right/bottom/left) into the component; RightPanel reads only the shorthand `padding` Property via `getProp('padding')` → `prop.getValue()` returns empty, so the field looks blank.

Step 1 — Add an exported pure helper `composePaddingShorthand` in editorConfig.ts, directly BELOW the existing `parsePaddingShorthand` (do NOT modify parse). It takes the four longhand strings and returns the collapsed CSS shorthand per the behavior cases above. Pure string function, no React/GrapesJS imports.

Step 2 — Add a unit test `editorConfig.test.ts` co-located with the source (vitest) covering the four collapse cases above. This is the plan's real automated gate. Export whatever the test needs (`composePaddingShorthand`).

Step 3 — Add an optional `displayValue?: string` prop to `PairedField` (panelControls.tsx). When the live `prop.getValue()` is empty AND `displayValue` is provided, use `displayValue` as the input's `value` (so the field is readable/editable); keep `prop.getDefaultValue()` as the separate `placeholder`. The `onChange` still calls `prop.upValue` unchanged — a user edit flows through the existing `component:styleUpdate:padding` expansion listener (editorConfig.ts:345). PROHIBITED: no `addStyle`/`addAttributes`/`upValue`/model write on render — the fallback is display-only. This preserves round-trip byte-identity by construction (reads only; the sole write is user-driven onChange through the load-guarded listener).

Step 4 — In RightPanel.tsx, compute the padding display fallback from the selected component (already available via `useSelectedComponent` → `selected`). Derive it ONLY when `selected.getStyle()` has all four longhands present (`padding-top`,`padding-right`,`padding-bottom`,`padding-left`); otherwise leave it undefined (empty field). Pass the result as `displayValue` to the padding `PairedField` (both the grid branch at line ~192 and the standalone branch at line ~197). Use a small render-scope helper (e.g. `const paddingDisplay = ...`) — return early / guard with curly braces per code-style; never compute derived state in an effect.
  </action>
  <verify>
    <automated>cd app/client && npx vitest run src/editor/editorConfig.test.ts</automated>
    <automated>cd app/client && npx tsc --noEmit</automated>
    Running editor (:5174): select a text/image block whose padding exists only as longhands → the Appearance "P" field now shows the composed shorthand (e.g. "10px 25px"). Editing it still writes and updates canvas padding. Run `window.__ddroiddAssertRoundTrip()` in the console after selecting (no edit) → round-trip stays byte-identical.
  </automated>
  </verify>
  <done>composePaddingShorthand unit tests pass; padding field displays the real value when only longhands exist; no model write on render; round-trip assertion holds; tsc clean.</done>
</task>

<task type="auto">
  <name>Task 3: Collapsible right-panel section headers</name>
  <files>app/client/src/editor/RightPanel.tsx</files>
  <action>
Make each `Section` (RightPanel.tsx:39) collapsible. Currently the header renders a static `ChevronDown` with no state/onClick. Convert:
- Add local `const [open, setOpen] = useState(true)` per Section (import `useState`).
- Make the header row a `<button type="button">` that toggles `setOpen((v) => !v)`, with `aria-expanded={open}` and `cursor-pointer`.
- The `ChevronDown` gets `transition-transform` and rotates when closed (e.g. `-rotate-90` when `!open`) — curly-brace/`cn` conditional, no braceless ternary chains in JSX class strings beyond a simple `cn`.
- Conditionally render the children container only when `open` (return early inside a small render helper, or guard the JSX). Do not unmount the whole Section — keep the header always visible so it can be reopened.

Independent per-section `useState` is intentional — do NOT introduce shadcn Accordion (each section toggles independently).

Also remove the decorative chevron from `renderHeader` (RightPanel.tsx:71) — the top "Image"/selected-name header chevron is static decoration and misleading now that real chevrons toggle; delete just that `<ChevronDown>` (keep the name span). Keep the `ChevronDown` import if still used by Section (it is).

Follow code-style: `const`, curly braces on every `if`, render functions where the return grows.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
    Running editor (:5174): click a section header (e.g. "Typography") → its body collapses and the chevron rotates; click again → it expands. Sections toggle independently. The top selected-name header no longer shows a chevron.
  </verify>
  <done>Section headers collapse/expand independently on click with a rotating chevron and aria-expanded; the decorative top-header chevron is removed; tsc clean.</done>
</task>

</tasks>

<verification>
- `cd app/client && npx vitest run src/editor/editorConfig.test.ts` — compose helper cases pass.
- `cd app/client && npx tsc --noEmit` — no type errors across all three files.
- Running editor on :5174 (kill stale servers first — ports hold old code): image src field prepopulates/edits; padding field shows composed longhand value; section headers collapse/expand.
- `window.__ddroiddAssertRoundTrip()` after selection (no edit) confirms project-JSON byte-identity — no model mutation on selection/render.
</verification>

<success_criteria>
- mj-image exposes editable, prepopulated src/href/alt in the Content section; canvas render + drag/drop unaffected.
- Padding field displays the real value derived from the four longhands (presentation-only); user edits still flow through the existing shorthand-expansion listener.
- Right-panel section headers collapse/expand independently with a rotating chevron; decorative top-header chevron removed.
- Phase-1 round-trip stays byte-identical (no writes on selection/render).
</success_criteria>

<output>
Create `.planning/quick/260713-mxb-right-panel-add-mj-image-src-trait-paddi/260713-mxb-SUMMARY.md` when done.
</output>
