# GrapesJS + grapesjs-mjml

The editor is GrapesJS `0.22.16` + `grapesjs-mjml@1.0.8` + `@grapesjs/react@2.0.0`. The plugin supports its own MJML subset and **does not reliably import arbitrary hand-authored MJML**. These rules encode hard-won, evidence-backed constraints. Violating them corrupts the canvas or produces empty saves.

## Project JSON is canonical — never re-parse MJML

- The authoritative persisted state is **`editor.getProjectData()`** (GrapesJS component JSON), stored as JSONB. Load with **`editor.loadProjectData(json)`**.
- **Never** persist the MJML/HTML string and reload it into the editor. `setComponents(mjmlString)` loses component-type metadata and produces an empty document on re-edit (issue #194). MJML is generated **at export time only** (`editor.getHtml()`), never read back in.
- Do not attempt to import the legacy `src/sections/*.mjml` into the editor. Round-trip is confirmed lossy (issues #35, #194, #388). Branded sections are **re-authored as block definitions**, not imported.

## BLOCK_DEFAULTS — inline everything, no head dependencies

`mj-attributes` is **not supported** — importing it corrupts `mj-head` (relocates it inside `mj-body`, issue #35). So blocks cannot inherit global defaults.

- Every branded/generic block's content string must **inline all styling per element**: `font-family` (with fallbacks), `color`, `font-size`, `line-height`, plus `background-color` on every section (white-default-text trap — see `mjml-email-safety.md`).
- Share these via a single **`BLOCK_DEFAULTS`** constant interpolated into block content strings — one place to change brand defaults across all blocks.
- **Never** put `mj-include`, `mj-attributes`, or `mj-style` inside block content strings — they fail silently or corrupt the canvas.
- A block must compile correctly **in isolation** (no mj-head injection) — verify by compiling the block alone (BLOCK-02).

```js
const BLOCK_DEFAULTS = {
  fontFamily: 'Calibri, Roboto, Lato, "Avenir Next", Verdana, Helvetica, Arial, sans-serif',
  textColor: '#ffffff',
  fontSize: '16px',
  lineHeight: '20px',
};

editor.Blocks.add('ddroidd-hero', {
  label: 'Hero',
  category: 'DDROIDD Branded',
  content: `
    <mj-section background-color="#0B1624">
      <mj-column>
        <mj-image src="..." width="600px" />
        <mj-text font-family="${BLOCK_DEFAULTS.fontFamily}" color="${BLOCK_DEFAULTS.textColor}"
                 font-size="${BLOCK_DEFAULTS.fontSize}" line-height="${BLOCK_DEFAULTS.lineHeight}">
          <p>Edit your intro text here.</p>
        </mj-text>
      </mj-column>
    </mj-section>`,
});
```

## Plugin init — the string-key trap

Use the **hardcoded string** `'grapesjs-mjml'` as the `pluginsOpts` key. Using `[grapesjsMjml]` (the function as a computed key) causes "canvas loads but blocks can't be dropped" (issue #223).

```jsx
<GjsEditor
  grapesjs={grapesjs}                 // the imported module object, not the string
  options={{
    height: '100%',
    storageManager: false,            // we save via our own API, not GrapesJS storage
    plugins: [grapesjsMjml],
    pluginsOpts: { 'grapesjs-mjml': { resetBlocks: false, resetDevices: false } },
  }}
>
  <Canvas />
</GjsEditor>
```

If the `0.22.16` + `@grapesjs/react` triple fails at runtime, the documented fallback is `grapesjs@0.21.2` + direct mount (`grapesjs.init()` in an effect with manual cleanup). Do not switch fallbacks casually — it's a last resort.

## Editor guardrails (non-dev safety)

- **No raw-HTML escape hatch** (EDIT-07): remove the `mj-raw` block, the code/export-code panel, and any MJML import UI. A non-dev must not reach raw markup.
- **Restricted Style Manager** (EDIT-06): expose only an email-safe allowlist (color, font-size, font-family, line-height, align, padding-as-spacer, background-color). Never expose flexbox, `position`, `box-shadow`, grid — they break Outlook.
- **Constrained pickers** (EDIT-08): color and font pickers offer only the approved DDROIDD brand palette, not free-form.
- **Component locking** (BLOCK-03): branded blocks lock layout/structure; only intended content regions (text, images) are editable/movable/removable. Use GrapesJS component definitions with `draggable`/`droppable`/`removable`/`editable`/`selectable` flags to enforce this.

## Attribute gaps to handle manually
- `background-url` on `mj-section` — not a default panel trait; add as a custom trait or bake into block content.
- `fluid-on-mobile` on `mj-image` — not exposed; bake into block content.
- `css-class` (e.g. tracking pixel) — passes through compile but isn't panel-editable; hardcode (`width="1px" height="1px"`) in the block.

## Cross-references
- `mjml-email-safety.md` — why the Style Manager allowlist and white-default rules exist.
- `versions.md` — the locked version triple and the compatibility triangle.
- CLAUDE.md → full grapesjs-mjml component support matrix (authoritative).
