---
type: quick
slug: 260704-ppr
title: Figma-style 3-panel editor UI (custom-UI mode)
phase: 01-feasibility-spike-editor-core
autonomous: true
files_modified:
  - app/client/src/App.tsx
  - app/client/src/editor/NewsletterEditor.tsx
  - app/client/src/editor/TopBar.tsx
  - app/client/src/editor/LeftSidebar.tsx
  - app/client/src/editor/RightPanel.tsx
  - app/client/src/editor/editorOptions.ts
  - app/client/src/editor/editor-shell.css
requirements: [EDIT-06]
must_haves:
  truths:
    - "Editor mounts in custom-UI mode (<Canvas/> child) with a visible 3-panel dark layout"
    - "Left sidebar shows a Blocks tab (22 blocks) and a Layers tab; center is the canvas; right panel is selection-aware"
    - "All existing behavior survives: scaffold seed, 7 block registrations, save/load/round-trip, compile, New from Template, window.__ddroiddEditor"
    - "Right panel exposes ONLY email-safe style/trait controls — no flexbox/position/box-shadow/grid sector ever appears on selection"
    - "Top toolbar keeps Save, Load, Assert Round-Trip, Compile, New from Template + Desktop/Tablet/Mobile device switcher + title"
  artifacts:
    - path: "app/client/src/editor/NewsletterEditor.tsx"
      provides: "Custom-UI editor shell: GjsEditor + Canvas + provider-backed panels"
    - path: "app/client/src/editor/editorOptions.ts"
      provides: "Single source of GrapesJS options incl. email-safe styleManager sector allowlist + onEditor"
    - path: "app/client/src/editor/RightPanel.tsx"
      provides: "Selection-aware Traits + restricted Styles panel with empty state"
  key_links:
    - from: "app/client/src/editor/NewsletterEditor.tsx"
      to: "@grapesjs/react providers"
      via: "BlocksProvider/LayersProvider/StylesProvider/TraitsProvider/DevicesProvider Container portals"
      pattern: "Provider>[\\s\\S]*Container"
---

<objective>
Rebuild the Phase-1 spike editor shell as a Figma-style 3-panel dark UI using
@grapesjs/react **custom-UI mode** (`<GjsEditor><Canvas/></GjsEditor>` + provider
components), replacing the current default-UI `<Editor>` (no child).

Layout: left sidebar (~260px, Layers/Blocks tab switch) · center canvas (flex) ·
right panel (~280px, selection-aware email-safe Styles + Traits) · top toolbar
(title + Save/Load/Assert Round-Trip/Compile/New from Template + Desktop/Tablet/Mobile).

Purpose: The earlier custom-UI attempt failed (01-UAT) because `<Canvas/>` was
rendered without any provider, suppressing all panel chrome — blocks existed in
`editor.Blocks` but had no UI surface. This plan does custom-UI *correctly* via
the render-prop providers, proving the ActiveCampaign-style shell the user wants
while keeping every proven behavior intact.

Output: split `editor/` components + one stylesheet; App.tsx becomes a thin wrapper.
</objective>

<execution_context>
This is a spike-phase quick task (not a full GSD phase plan). Execute directly.
Do NOT run git commit (project no-commit rule) — end by listing changed files.
</execution_context>

<context>
@.claude/rules/grapesjs.md
@.claude/rules/mjml-email-safety.md
@.claude/rules/react-patterns.md
@.claude/rules/component-patterns.md
@.claude/rules/code-style.md
@app/client/src/App.tsx
@.planning/phases/01-feasibility-spike-editor-core/01-UAT.md

<interfaces>
Verified from node_modules/@grapesjs/react/dist/*.d.ts (v2.0.0). Each provider is a
render-prop component: `<XProvider>{(state) => ReactElement}</XProvider>`. Every
provider state carries a `Container` (a portal component) that mounts the STOCK
GrapesJS manager widget — use `Container` to render native UI inside your own panel
(low-risk, verifiable path chosen for this spike).

BlocksProvider   -> { blocks: Block[], dragStart, dragStop, Container, mapCategoryBlocks }
LayersProvider   -> { root?: Component, Container }
StylesProvider   -> { sectors: Sector[], Container }
TraitsProvider   -> { traits: Trait[], Container }
SelectorsProvider-> { selectors, states, ..., Container }
DevicesProvider  -> { devices: Device[], selected: string, select(id) }   // NO Container — custom render
Canvas           -> renders the GrapesJS canvas where placed
WithEditor       -> renders children only after editor is created
useEditor()      -> editor (always defined inside WithEditor)

Exports (from index.d.ts): default (=Editor/GjsEditor), Canvas, BlocksProvider,
LayersProvider, StylesProvider, TraitsProvider, SelectorsProvider, DevicesProvider,
AssetsProvider, ModalProvider, PagesProvider, WithEditor, useEditor, useEditorMaybe.
</interfaces>

<decisions>
1. Use the `Container` portal for Blocks, Layers, Styles, Traits — NOT custom-rendered
   chips. Rationale (locked): (a) the native block Container keeps GrapesJS-internal
   drag wiring, which is the exact thing that broke before; custom `dragStart`/`dragStop`
   wiring would move the risk into human-only verification. (b) Playwright/CDP cannot
   drive cross-iframe HTML5 drag (proven in 01-UAT), so custom drag would be untestable.
   Achieve the Figma look by CSS-overriding `.gjs-*` classes for the dark theme.
2. DevicesProvider has no Container — render Desktop/Tablet/Mobile as custom buttons
   calling `select(deviceId)`, highlighting `selected`.
3. Right panel is Traits-primary + restricted-Styles-secondary. For MJML components
   most editable props (font-size, color, align, padding) surface as TRAITS, not
   StyleManager CSS — verify empirically (Task 2) and order the panel accordingly.
4. DROP the `grapesjsCss="https://unpkg.com/..."` prop. App.tsx already imports
   `grapesjs/dist/css/grapes.min.css` from node_modules — keep that only (01-UAT hit
   ERR_NAME_NOT_RESOLVED on the CDN; Container portals render nothing without this CSS).
5. Preserve the `window.__ddroiddEditor` + `window.__ddroiddAssertRoundTrip` debug
   handles and all 5 handlers exactly. Keep the window-handle pattern (do NOT half-migrate
   toolbar handlers to `useEditor` — a partial refactor is where a handler silently drops).
</decisions>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Split the editor into custom-UI 3-panel shell components</name>
  <files>app/client/src/App.tsx, app/client/src/editor/editorOptions.ts, app/client/src/editor/NewsletterEditor.tsx, app/client/src/editor/TopBar.tsx, app/client/src/editor/LeftSidebar.tsx, app/client/src/editor/RightPanel.tsx, app/client/src/editor/editor-shell.css</files>
  <action>
    Move all GrapesJS wiring out of App.tsx into an `editor/` folder (per react-patterns.md flat convention; components split per code-style.md render-function style).

    editorOptions.ts — single source of truth (kills the dead lib/editorConfig.ts drift risk noted in 01-UAT):
    - Export `onEditor(editor)` VERBATIM from current App.tsx lines 90-134: window handle assignment, the `getComponents().length === 0` scaffold seed `<mjml><mj-body></mj-body></mjml>` + `UndoManager.clear()`, and all 7 `editor.Blocks.get(id)`-guarded registrations (hero, projects, new-collegues, initiatives, hiring, want-to-know-more, disclaimer). Do NOT change this logic.
    - Export `editorOptions` = the current inline options object (height '100%', storageManager:false, plugins:[grapesjsMjml], pluginsOpts with HARDCODED STRING key 'grapesjs-mjml' {resetBlocks:false,resetDevices:false}). Task 2 adds the styleManager allowlist here.
    - Export the save/load/assertRoundTrip/compileDraft/handleNewFromTemplate helpers (moved verbatim from App.tsx). Keep `import 'grapesjs/dist/css/grapes.min.css'` somewhere in the module graph (main.tsx or NewsletterEditor). Do NOT re-add the CDN grapesjsCss prop.

    NewsletterEditor.tsx — the custom-UI shell:
    - `<GjsEditor grapesjs={grapesjs} onEditor={onEditor} options={editorOptions}>` with children (custom-UI mode). NO grapesjsCss prop.
    - Layout: outer flex column, height 100vh. Row 1 = <TopBar/>. Row 2 = flex row: <LeftSidebar/> (~260px) | <Canvas/> wrapper (flex:1, overflow hidden) | <RightPanel/> (~280px).
    - Wrap the whole thing / panels needing the editor in <WithEditor> so providers have a live editor.
    - Lazy-load per performance.md is NOT required for the spike (single route); keep it simple.

    TopBar.tsx — dark bar (#1a1a2e), keeps ALL 5 buttons wired through window.__ddroiddEditor exactly as App.tsx does (Save, Load, Assert Round-Trip, Compile [orange #F45E43], New from Template [#0B1624]) + title "DDROIDD Newsletter Builder". Add device switcher: wrap in <DevicesProvider>{({devices,selected,select}) => ...} rendering Desktop/Tablet/Mobile buttons calling `select(id)`, active state on `selected`. (Device ids come from grapesjs defaults — render `devices.map` labels; do not hardcode ids.)

    LeftSidebar.tsx — ~260px dark panel with a two-tab switch (local useState 'blocks'|'layers'):
    - Blocks tab: <BlocksProvider>{({Container}) => <Container/>}</BlocksProvider>
    - Layers tab: <LayersProvider>{({Container}) => <Container/>}</LayersProvider>
    - Render BOTH providers always-mounted but hide the inactive one with CSS display:none (do NOT unmount — remounting the blocks Container can drop drag state).

    RightPanel.tsx — ~280px dark panel, selection-aware:
    - Show an "empty state" ("Select an element to edit its properties") when nothing is selected. Detect selection via editor.getSelected() + subscribe to 'component:selected'/'component:deselected' (or read TraitsProvider traits.length / StylesProvider sectors.length — if both empty, show empty state).
    - When selected: render <TraitsProvider>{({Container}) => <Container/>} then <StylesProvider>{({Container}) => <Container/>} (Traits first per decision 3). SelectorsProvider Container is optional — include only if it renders cleanly.

    editor-shell.css — plain CSS (NO Tailwind/shadcn, NO new deps). Dark theme (#1a1a2e shell to match top bar, darker panels, light text), panel widths, tab styles, and `.gjs-*` overrides to darken the native block/layer/style/trait Containers so they read as one dark UI. Keep it pragmatic — spike, not pixel-perfect.

    App.tsx — reduce to a thin wrapper that renders <NewsletterEditor/>.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
    (Passes with zero client errors. The pre-existing SERVER tsc error is out of scope — run tsc in app/client only.)
  </verify>
  <done>
    tsc --noEmit clean in app/client. App.tsx is a thin wrapper. editor/ contains
    NewsletterEditor/TopBar/LeftSidebar/RightPanel/editorOptions/editor-shell.css.
    onEditor logic (scaffold seed, 7 registrations, window handles) is byte-for-byte
    preserved. No CDN grapesjsCss prop. No new npm dependencies added.
  </done>
</task>

<task type="auto">
  <name>Task 2: Enforce + prove the email-safe right-panel allowlist (EDIT-06)</name>
  <files>app/client/src/editor/editorOptions.ts, app/client/src/editor/RightPanel.tsx</files>
  <action>
    Restrict the right panel to email-safe controls only, per mjml-email-safety.md (Outlook: no flexbox/position/box-shadow/grid).

    1. In editorOptions.ts add a `styleManager: { sectors: [...] }` allowlist exposing ONLY:
       typography (font-family, font-size, color, line-height, text-align), spacing as
       padding, and background-color. Do NOT include any sector/property for display/flex,
       position, box-shadow, or grid. Use grapesjs Style Manager sector/property config shape.
    2. EMPIRICALLY determine, at runtime, whether MJML props surface as Traits or Styles:
       select an mj-text and observe which provider populates. grapesjs-mjml drives most
       props through Traits — order RightPanel Traits-first accordingly (decision 3). If a
       forbidden CSS sector still appears (grapesjs-mjml can inject its own sectors that
       clobber the allowlist), remove/hide it — the config alone is NOT trusted.
    3. Add a runtime guard/assertion (spike-acceptable): after selecting a component, the
       set of visible StyleManager sector names must be a subset of the allowlist. Log a
       console warning if any forbidden sector name (matching /flex|position|box-shadow|grid|display/i)
       is present, so the orchestrator's Playwright run can assert its ABSENCE.
  </action>
  <verify>
    <automated>cd app/client && npx tsc --noEmit</automated>
    Plus the runtime leak assertion below — the orchestrator runs it via Playwright:
    with a template loaded, select an mj-text, then in console evaluate the visible
    StyleManager sectors and assert NONE match /flex|position|box-shadow|grid/i.
  </verify>
  <done>
    styleManager allowlist configured in editorOptions.ts (typography + padding +
    background-color only). RightPanel is Traits-primary. No forbidden sector
    (flex/position/box-shadow/grid) appears when any element is selected — verified
    empirically, not assumed. tsc --noEmit clean.
  </done>
</task>

</tasks>

<verification>
Runtime checklist for the orchestrator's post-execution Playwright pass. NOTE the
drag caveat: CDP CANNOT drive cross-iframe HTML5 drag (proven in 01-UAT). Use the
programmatic proxy, not a mouse-drag, for the drop check.

1. Cold start: `npm run dev` from app/ — client :5173 (or next free port) + server :3000, no red console errors, editor mounts.
2. Layout: 3-panel dark shell visible — left sidebar ~260px, center canvas, right panel ~280px, top toolbar with title + 5 buttons + device switcher.
3. Blocks tab: `editor.BlockManager.getAll().length === 22` (15 generic grapesjs-mjml + 7 DDROIDD) AND the blocks Container is visible in the left sidebar under the Blocks tab.
4. Layers tab: switching to Layers shows a layer tree; after "New from Template" the tree reflects the 7 template sections.
5. Drop works (PROGRAMMATIC PROXY — not mouse drag): `editor.Components.canMove(mjBody, block)` returns `{result:true}` for an mjml block, and `editor.addComponents(block.get('content'))` renders on canvas. Human confirms actual mouse drag separately.
6. Selection populates right panel: select an mj-text → right panel leaves empty state and shows Traits (+ restricted Styles). With nothing selected → "Select an element" empty state.
7. Email-safe leak assertion (BLOCKING): with an element selected, NO visible StyleManager sector matches /flex|position|box-shadow|grid/i.
8. Device switcher: clicking Tablet/Mobile changes `editor.Devices.getSelected()` and canvas width; Desktop restores.
9. Compile: click Compile → POST /api/compile returns 200; console logs "Compile succeeded".
10. Preserved behavior: `window.__ddroiddEditor` defined; Save/Load/Assert Round-Trip work; `window.__ddroiddAssertRoundTrip()` logs "Round-trip identical: true".
</verification>

<success_criteria>
- `npx tsc --noEmit` in app/client passes (pre-existing server error out of scope).
- Custom-UI 3-panel dark shell renders with Blocks/Layers tabs, canvas, selection-aware right panel, full toolbar + device switcher.
- 22 blocks present; drop path valid via programmatic proxy.
- No forbidden style sector leaks into the right panel on selection (EDIT-06).
- All 5 toolbar behaviors + window debug handles + scaffold seed + 7 registrations preserved.
- No new npm dependencies; plain CSS only; no CDN CSS prop.
- Executor does NOT git commit — lists changed files + suggested message.
</success_criteria>

<output>
Changed files list + suggested commit message returned to the developer (no-commit rule).
</output>
