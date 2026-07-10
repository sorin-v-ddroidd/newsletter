---
type: quick
slug: 260704-ppr
title: Figma-style 3-panel editor UI (custom-UI mode)
phase: 01-feasibility-spike-editor-core
status: complete-pending-runtime-verification
one-liner: "Rebuilt the GrapesJS editor shell as a custom-UI 3-panel dark layout with panels CUSTOM-RENDERED from @grapesjs/react provider render-prop state (Container portals proved non-functional in custom-UI mode)."
key-files:
  created:
    - app/client/src/editor/editorOptions.ts
    - app/client/src/editor/NewsletterEditor.tsx
    - app/client/src/editor/TopBar.tsx
    - app/client/src/editor/LeftSidebar.tsx
    - app/client/src/editor/RightPanel.tsx
    - app/client/src/editor/editor-shell.css
    - app/client/src/editor/hooks/useSelectedComponent.ts
  modified:
    - app/client/src/App.tsx
tech-stack:
  patterns:
    - "@grapesjs/react custom-UI mode: <GjsEditor><Canvas/> direct child + provider render-props, panels CUSTOM-RENDERED from provider state (blocks via mapCategoryBlocks + dragStart/dragStop; layers via root recursion; styles via sectors/properties; traits via traits array)"
    - "Provider `Container` portals are UNUSABLE in custom-UI mode — GrapesJS emits a DETACHED container element and never renders default manager UI into it (verified in @grapesjs/react index.cjs.js). Container only works for ModalProvider/AssetsProvider."
    - "Editor event subscriptions live in hooks (editor/hooks/useSelectedComponent.ts), per component-patterns.md"
metrics:
  duration: "~75 min (incl. mid-task rework after runtime verification failure)"
  completed: 2026-07-04
---

# Quick Task 260704-ppr: Figma-style 3-panel editor UI Summary

Rebuilt the Phase-1 spike editor shell as a Figma/ActiveCampaign-style 3-panel dark UI
using @grapesjs/react **custom-UI mode**. First iteration used the provider `Container`
portals; the coordinator's runtime verification showed **all panels render empty** —
root cause (verified against `@grapesjs/react/dist/index.cjs.js`): each provider's
`Container` is `createPortal(children, containerEl)` where `containerEl` is a detached
element emitted by GrapesJS's custom-mode event. GrapesJS never attaches it to the DOM
and, in custom mode, never renders default manager UI into it — so `<Container>` shows
nothing (it only works for Modal/Assets, which GrapesJS attaches when the modal opens).

**Corrected approach (official @grapesjs/react custom-UI demo pattern): every panel is
custom-rendered from provider render-prop state.** All GrapesJS API methods used were
verified against `node_modules/grapesjs/dist/index.d.ts` before use.

## What was built (final state)

- **`editor/editorOptions.ts`** — single source of truth for GrapesJS wiring, moved
  verbatim from `App.tsx`: `onEditor` (window handles, empty-canvas `<mjml><mj-body>`
  scaffold seed, all 7 guarded DDROIDD block registrations), `save`/`load`/
  `assertRoundTrip`/`compileDraft`/`handleNewFromTemplate`, and the `editorOptions`
  config (storageManager:false, `plugins:[grapesjsMjml]`, hardcoded-string
  `pluginsOpts['grapesjs-mjml']`). Two additions:
  - `styleManager.sectors` email-safe allowlist (EDIT-06): Typography (font-family,
    font-size, color, line-height, text-align), Spacing (padding — declared as an
    explicit `type: 'text'` property, NOT the default composite type, so the custom
    renderer can edit it as a shorthand field), Background (background-color). No
    flex/position/box-shadow/grid sector or property.
  - **Stray device toolbar fix:** grapesjs-mjml calls `addPanel({id:'devices-c'})` at
    plugin init (verified in `grapesjs-mjml/dist/index.js`), which floats a mini
    Desktop/Tablet/Mobile toolbar over the canvas even in custom-UI mode. `onEditor` now
    removes it (`editor.Panels.getPanel('devices-c')` guard + `removePanel`), with a CSS
    fallback (`.ddroidd-shell__canvas .gjs-pn-panel { display:none }`) in editor-shell.css.
- **`editor/NewsletterEditor.tsx`** — `<GjsEditor grapesjs={grapesjs} onEditor={onEditor}
  options={editorOptions}>` with `<Canvas/>` as direct child; TopBar/LeftSidebar/RightPanel
  wrapped in `<WithEditor>`. `grapesjs/dist/css/grapes.min.css` imported from node_modules
  (no CDN `grapesjsCss` prop).
- **`editor/TopBar.tsx`** — unchanged from first iteration (this part worked): all 5
  buttons (Save, Load, Assert Round-Trip, Compile, New from Template) wired through
  `window.__ddroiddEditor` verbatim; Desktop/Tablet/Mobile switcher custom-rendered from
  `<DevicesProvider>` (`devices.map`, `select(id)`, active on `selected` — no hardcoded ids).
- **`editor/LeftSidebar.tsx`** — Blocks/Layers tabs (both always mounted, inactive hidden
  via CSS class):
  - **Blocks:** custom chips from `mapCategoryBlocks` (`Map<string, Block[]>`), grouped
    under category headers. Each chip is `draggable` with
    `onDragStart={(ev) => dragStart(block, ev.nativeEvent)}` /
    `onDragEnd={() => dragStop(false)}` — `dragStart` wires GrapesJS's native drop
    machinery. Chip renders `block.getMedia()` (SVG string) + `block.getLabel()` via
    `dangerouslySetInnerHTML` (see security note below).
  - **Layers:** recursive `LayerItem` tree from `LayersProvider`'s `root` —
    `component.getName()` label, children via `component.components()` (Backbone
    collection), click → `editor.select(component)`, selected row highlighted via the
    `useSelectedComponent` hook. No drag-reorder in v1 (spike).
- **`editor/RightPanel.tsx`** — custom-rendered, Traits-first (decision 3):
  - **Traits:** each trait → labeled input by `trait.getType()`: checkbox
    (`getValue({useType:true})`/`setValue(bool)`), select (`getOptions()` +
    `getOptionId`/`getOptionLabel`), default text (`getValue()`/`setValue()`).
  - **Styles:** visible sectors from `StylesProvider` → per-property inputs by
    `prop.getType()`: select/radio → `<select>` (PropertySelect `getOptions()`),
    color → `<input type="color">` + text fallback (`upValue()`), everything else →
    text input (`getValue()`/`upValue()`, placeholder from `getDefaultValue()`).
    **Composite/stack properties are skipped gracefully** — no composite editor in the
    spike (hence padding declared as text type in the allowlist).
  - **EDIT-06 defense in depth:** any sector whose name matches
    `/flex|position|box-shadow|grid/i` is (a) `console.warn`ed — the orchestrator's
    Playwright BLOCKING assertion greps for this — and (b) **filtered out of the render
    entirely**, so a leaked sector can never be visible even if grapesjs-mjml injects one
    past the config allowlist.
  - Empty state ("Select an element to edit its properties") derived at render time from
    `traits.length === 0 && sectors.length === 0` — no effects for derived state.
- **`editor/hooks/useSelectedComponent.ts`** — subscribes to `component:selected`/
  `component:deselected` (genuine subscription side effect, in a hook per
  component-patterns.md), returns the selected `Component | undefined`. Used for
  layer-row highlighting.
- **`editor/editor-shell.css`** — plain CSS, no new deps: dark 3-panel layout
  (260px / flex / 280px), tabs, block-chip grid, layer tree rows, trait/style field rows,
  color input, stray-panel fallback hide.
- **`App.tsx`** — thin wrapper rendering `<NewsletterEditor/>`.

## APIs verified against typings (not guessed)

| API | Where verified |
|-----|----------------|
| `BlocksState.mapCategoryBlocks: Map<string, Block[]>`, `dragStart(block, ev?)`, `dragStop(cancel?)` | `@grapesjs/react/dist/BlocksProvider.d.ts` |
| `Block.getId()/getLabel()/getMedia()` | grapesjs `index.d.ts` ~1712-1737 |
| `LayersState.root?: Component`; provider re-emits on `Layers.events.custom` | `LayersProvider.d.ts` + `index.js` source |
| `Component.getName()`, `components()` (Collection), `cid` | grapesjs `index.d.ts` (Component class) |
| `editor.select(component)`, `editor.getSelected()` | grapesjs `index.d.ts` 16027/16054 |
| `Trait.getType/getName/getLabel/getValue({useType})/setValue/getOptions/getOptionId/getOptionLabel` | grapesjs `index.d.ts` 1120-1205 |
| `Sector.getId/getName/getProperties()` | grapesjs `index.d.ts` 9854+ |
| `Property.getId/getType/getLabel/getValue/upValue/getDefaultValue`; `PropertySelect.getOptions/getOptionId/getOptionLabel` | grapesjs `index.d.ts` 10448+, 10152+ |
| `editor.Panels.getPanel(id)/removePanel(id)` | grapesjs `index.d.ts` 8959/8951 |
| `StyleManagerConfig.sectors[].properties` accepts string or `PropertyProps` object (`{id, property, label, type}`) | grapesjs `index.d.ts` 11720+, 10353+ |

## Deviations from Plan

### Coordinator-directed rework (mid-task course correction)

**1. Container portals replaced with full custom rendering of all four panels**
- **Found during:** coordinator's runtime verification (all panels empty).
- **Issue:** Plan decision 1 locked the `Container` portal path for Blocks/Layers/Styles/Traits; at runtime `Container` portals into a detached, never-populated element in custom-UI mode.
- **Fix:** Custom-render each panel per the official demo pattern (details above). Drag wiring preserved via the provider's `dragStart`/`dragStop`. The plan's decision-1 rationale (native drag machinery) is still honored — `dragStart` IS the native machinery hook.
- **Files:** `LeftSidebar.tsx`, `RightPanel.tsx` (rewritten), `hooks/useSelectedComponent.ts` (new).

**2. Stray `devices-c` mini-toolbar over canvas removed**
- **Found during:** coordinator's runtime verification (screenshot).
- **Root cause:** grapesjs-mjml `addPanel({id:'devices-c'})` at plugin init, bypassing custom-UI's `panels:{defaults:[]}`.
- **Fix:** `removePanel('devices-c')` in `onEditor` + CSS fallback.
- **Files:** `editorOptions.ts`, `editor-shell.css`.

### Auto-fixed Issues

**3. [Rule 3 - Blocking] `padding` is a composite property by default — invisible to a base-types-only renderer**
- **Fix:** Declared in the allowlist as `{ id:'padding', property:'padding', label:'Padding', type:'text' }` — shorthand text field (also the email-pragmatic form; per-side padding is unreliable in Outlook).

**4. [Rule 3 - Blocking] `Device` has no `getId()` method** (from first iteration, still applies)
- **Fix:** `device.get('id') ?? device.id` in `TopBar.tsx`; label via `getName()`.

**5. [Rule 3 - Blocking] `Components.map` callback param implicitly `any` under strict mode**
- **Fix:** Explicit `(child: Component)` annotation in `LayerItem`.

### Security note — `dangerouslySetInnerHTML` in block chips

`block.getMedia()`/`block.getLabel()` may contain markup (grapesjs-mjml ships SVG icons
as label/media strings), so chips render them via `dangerouslySetInnerHTML`. Trust
domain: these strings are exclusively developer-authored (`src/blocks/*.ts` +
grapesjs-mjml's bundled definitions) — the exact strings the stock GrapesJS Block
Manager itself injects into the DOM. No user, network, or persisted content flows
through them, and the plan forbids new dependencies (no DOMPurify). If blocks ever
become user-definable (post-v1), sanitization must be added at that boundary.

## What could NOT be verified by this executor (deferred to orchestrator's Playwright pass)

Per task constraints, no browser was run by this executor. Unverified empirically:
- Panels now actually render content (blocks chips, layer tree, trait/style fields) —
  the corrected pattern matches the official demo, but runtime confirmation is the
  orchestrator's.
- HTML5 drag from custom chips drops onto the canvas (programmatic proxy:
  `editor.Components.canMove(mjBody, block)`; human confirms mouse drag).
- Whether mj-text props surface as Traits vs Styles (panel is Traits-first per decision 3).
- `devices-c` panel removal actually eliminates the stray toolbar.
- The EDIT-06 leak assertion (no visible sector matching `/flex|position|box-shadow|grid/i`).

## Known Stubs

None. (Composite/stack style properties are intentionally not editable in the spike —
documented above, not a data stub.)

## Threat Flags

None. Pure client-side UI restructuring; `/api/compile` path unchanged. The
`dangerouslySetInnerHTML` usage is documented above with its trust-domain justification.

## Self-Check

```
FOUND: app/client/src/editor/editorOptions.ts
FOUND: app/client/src/editor/NewsletterEditor.tsx
FOUND: app/client/src/editor/TopBar.tsx
FOUND: app/client/src/editor/LeftSidebar.tsx
FOUND: app/client/src/editor/RightPanel.tsx
FOUND: app/client/src/editor/editor-shell.css
FOUND: app/client/src/editor/hooks/useSelectedComponent.ts
FOUND: app/client/src/App.tsx (modified — thin wrapper)
```

`npx tsc --noEmit` in `app/client`: **PASSED, zero output (clean)** — after rework.

## Self-Check: PASSED

## Changed Files (no-commit rule — developer commits manually)

```
 M app/client/src/App.tsx
?? app/client/src/editor/editorOptions.ts
?? app/client/src/editor/NewsletterEditor.tsx
?? app/client/src/editor/TopBar.tsx
?? app/client/src/editor/LeftSidebar.tsx
?? app/client/src/editor/RightPanel.tsx
?? app/client/src/editor/editor-shell.css
?? app/client/src/editor/hooks/useSelectedComponent.ts
```

**Suggested commit message:**

```
feat(01-quick-ppr): custom-UI 3-panel editor shell with custom-rendered panels

- Split App.tsx into editor/{editorOptions,NewsletterEditor,TopBar,LeftSidebar,RightPanel}
  + hooks/useSelectedComponent + editor-shell.css using @grapesjs/react custom-UI mode.
- Panels are custom-rendered from provider render-prop state (Container portals are
  non-functional in custom-UI mode — GrapesJS never populates the detached portal target):
  blocks via mapCategoryBlocks + dragStart/dragStop (native drop machinery preserved),
  layers via recursive root tree with click-select, traits/styles via typed field inputs.
- EDIT-06: email-safe styleManager allowlist (typography/padding-as-text/background-color)
  + runtime guard that warns AND hides any flex/position/box-shadow/grid sector.
- Removed grapesjs-mjml's stray 'devices-c' canvas toolbar (removePanel + CSS fallback);
  device switching lives in the TopBar via DevicesProvider.
- Preserves all 5 toolbar behaviors, window.__ddroiddEditor handles, scaffold seed, and
  7 block registrations verbatim. No new deps; no CDN CSS; tsc --noEmit clean.
```

(Not committed — project `no-commit.md` rule. Runtime verification deferred to the
orchestrator's Playwright pass.)
