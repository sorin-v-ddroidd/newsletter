# Phase 1: Feasibility Spike (Editor Core) - Pattern Map

**Mapped:** 2026-06-25
**Files analyzed:** 13 (all net-new under `/app`; no existing `src/` file is modified)
**Analogs found:** 4 / 13 (hero, projects, BLOCK_DEFAULTS, compile endpoint have in-repo analogs; all other files have no analog and must follow RESEARCH.md patterns)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `app/client/src/blocks/hero.ts` | block definition | transform | `src/sections/hero.mjml` | role-match (MJML source → JS block) |
| `app/client/src/blocks/projects.ts` | block definition | transform | `src/sections/projects.mjml` | role-match (MJML source → JS block) |
| `app/client/src/blocks/BLOCK_DEFAULTS.ts` | constants | — | `src/components/head.mjml` | role-match (mj-attributes → inlined consts) |
| `app/server/src/routes/compile.ts` | route | request-response | `package.json` scripts (`mjml` CLI) | partial (compiler reused, invocation model changes) |
| `app/server/src/index.ts` | server entry | request-response | none | no analog |
| `app/client/src/main.tsx` | React entry | — | none | no analog |
| `app/client/src/App.tsx` | React mount component | event-driven | none | no analog |
| `app/client/src/lib/editorConfig.ts` | config utility | — | none | no analog |
| `app/client/vite.config.ts` | config | — | none | no analog |
| `app/client/index.html` | HTML entry | — | none | no analog |
| `app/client/package.json` | package manifest | — | `package.json` (root) | partial (root shows mjml dep pattern) |
| `app/server/package.json` | package manifest | — | `package.json` (root) | partial |
| `app/client/tsconfig.json` | TS config | — | none | no analog |
| `app/server/tsconfig.json` | TS config | — | none | no analog |

---

## Pattern Assignments

### `app/client/src/blocks/BLOCK_DEFAULTS.ts` (constants)

**Analog:** `src/components/head.mjml` (lines 1-14)

**Source values to extract** (head.mjml lines 5-13):
```xml
<mj-attributes>
  <mj-text color="#ffffff" line-height="24px" font-size="16px" />
  <mj-all font-family="Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif" />
</mj-attributes>
```

**Additional values from section inline styles** (hero.mjml line 22, projects.mjml lines 31-38):
```
color: #ffffff
font-size: 16px
line-height: 24px   <-- use 24px (head.mjml and projects.mjml both say 24; hero.mjml's inner <p> says 20px — 20 is the OUTLIER, normalize to 24)
font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif
background-color on all sections: #0B1624
accent color (used on mj-text wrappers and h2 text): #F45E43
```

**Concrete BLOCK_DEFAULTS.ts to author:**
```typescript
// app/client/src/blocks/BLOCK_DEFAULTS.ts
// Derived from src/components/head.mjml mj-attributes.
// mj-attributes is NOT supported in grapesjs-mjml -- these values MUST be
// inlined per element in every block content string.
export const BLOCK_DEFAULTS = {
  backgroundColor: '#0B1624',
  fontFamily: 'Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '24px',      // head.mjml + projects.mjml = 24px; hero.mjml <p> says 20px (outlier — normalize to 24)
  textColor: '#ffffff',    // head.mjml mj-text color="#ffffff"
  accentColor: '#F45E43',  // hero.mjml / projects.mjml mj-text color attribute
} as const;
```

**Critical note on outlier:** `hero.mjml` line 20 has `line-height: 20px` on its inner `<p>`. `head.mjml` line 6 specifies `line-height="24px"` as the global default. `projects.mjml` line 65 also uses `24px`. Use `24px` — the hero source's `20px` is an editorial slip, not the brand standard.

---

### `app/client/src/blocks/hero.ts` (block definition, transform)

**Analog:** `src/sections/hero.mjml` (lines 1-30)

**Full source markup to re-author from** (hero.mjml lines 1-29):
```xml
<mj-section background-color="#0B1624">
  <mj-column>
    <mj-image
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
    />
    <mj-text font-family="Helvetica" color="#F45E43">
      <p style="
        font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 20px;   <!-- NOTE: outlier — normalize to 24px in block -->
        color: #ffffff;
      ">
        As we move into summer...
      </p>
    </mj-text>
  </mj-column>
</mj-section>
```

**What to include in the block (first mj-section only):**
The hero source has two `mj-section` elements. The second (lines 32-43) is a divider + tracking pixel (`css-class="tracking-pixel"` 1px image). **Drop it** — `css-class` is not panel-editable and tracking is out of scope for Phase 1.

**Three deliberate divergences from the source (required by D-04 risk coverage):**

1. **`background-url` on `mj-section` — intentionally added (not in source).** The source uses `background-color` only. The block adds `background-url` with the same storyblok hero image URL to exercise the risk flag from D-04. This attribute is NOT a default panel trait in grapesjs-mjml. Its survival through `getProjectData()`/`loadProjectData()` and appearance in compiled HTML must be verified and documented in criterion #5.

2. **`mj-text` wrapper attributes normalized.** The source has `color="#F45E43"` (accent) + `font-family="Helvetica"` on the `mj-text` wrapper, with the full stack and `color: #ffffff` on the inner `<p>` style. In the block, the `mj-text` wrapper should carry the full font stack and `color="#ffffff"` from BLOCK_DEFAULTS — the source's wrapper accent is a left-over artifact that would be overridden by the inner `<p>` style anyway.

3. **line-height normalized to 24px** (from 20px in source — see BLOCK_DEFAULTS note above).

**Concrete block content string to author:**
```typescript
// app/client/src/blocks/hero.ts
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'DDROIDD Hero',
  category: 'DDROIDD',
  content: `<mj-section
  background-color="${D.backgroundColor}"
  background-url="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
>
  <mj-column>
    <mj-image
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
    />
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Insert hero text here.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
```

**Authoring rules (from CLAUDE.md Custom Block Authoring Pattern):**
- No `mj-attributes`, `mj-include`, or `mj-style` inside the content string — they fail silently or corrupt the canvas.
- `fluid-on-mobile` is NOT a panel trait but IS valid MJML — include it and document in criterion #5 whether it survives round-trip and appears in compiled output.
- `background-url` is NOT a panel trait — include it to exercise the risk; document survival in criterion #5.
- The 1px tracking pixel image (`css-class="tracking-pixel"`) from the source is omitted — `css-class` is not panel-editable.

---

### `app/client/src/blocks/projects.ts` (block definition, transform)

**Analog:** `src/sections/projects.mjml` (lines 1-79)

**Full source markup** (projects.mjml — the complete file):
```xml
<!-- Section 1: divider -->
<mj-section background-color="#0B1624">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="white" />
  </mj-column>
</mj-section>

<!-- Section 2: header with signature image + "Projects" h2 -->
<mj-section background-color="#0B1624">
  <mj-column>
    <mj-image
      align="left"
      width="200px"
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/406x24/243dcda045/img-signature.png"
      alt="Signature"
    />
    <mj-text align="left" font-family="Helvetica" color="#F45E43" padding-bottom="0">
      <h2 style="
        font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif;
        font-size: 20px;
        line-height: 30px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
      ">
        Projects
      </h2>
    </mj-text>
  </mj-column>
</mj-section>

<!-- Section 3: project entry (Elsevier logo + body text) -->
<mj-section background-color="#0B1624" padding-top="0" padding-bottom="0">
  <mj-column width="100%">
    <mj-image
      width="200px"
      align="left"
      src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd34dd66e91c8f6ae9a03_elsevier-logo-orange.png"
    />
    <mj-text font-family="Helvetica" color="#F45E43" padding-top="0">
      <p style="
        font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 24px;
        color: #ffffff;
      ">
        We're glad to share that the LeapSpace account is growing steadily...
      </p>
    </mj-text>
  </mj-column>
</mj-section>
```

**Key reference values from source (use verbatim in block):**
- `background-color` on all sections: `#0B1624`
- Signature image: `src="https://a.storyblok.com/f/198446/406x24/243dcda045/img-signature.png"` width=200px, align=left
- Section header h2 style: `font-size: 20px; line-height: 30px; color: #ffffff; text-transform: uppercase; margin: 0`
- Project logo: `src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd34dd66e91c8f6ae9a03_elsevier-logo-orange.png"` width=200px, align=left
- `fluid-on-mobile="true"` on the signature image (verify round-trip in criterion #5)
- Body text `<p>`: same BLOCK_DEFAULTS values (16px, 24px line-height, #ffffff, full font stack)

**mj-text wrapper normalization (same issue as hero):** Source has `color="#F45E43"` + `font-family="Helvetica"` on `mj-text` wrappers; inner `<p>` and `<h2>` carry the correct brand values. In the block, put BLOCK_DEFAULTS values directly on the `mj-text` wrapper, not the accent color.

**What to include:** All three source `mj-section` blocks — the divider, the header with signature, and the project entry. The first section's divider establishes the visual separator. The project entry body text should be a placeholder (not the Elsevier copy).

**Concrete block content string to author:**
```typescript
// app/client/src/blocks/projects.ts
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const projectsBlock = {
  id: 'ddroidd-projects',
  label: 'DDROIDD Projects',
  category: 'DDROIDD',
  content: `<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="white" />
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-image
      align="left"
      width="200px"
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/406x24/243dcda045/img-signature.png"
      alt="Signature"
    />
    <mj-text
      align="left"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-bottom="0"
    >
      <h2 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 30px; color: ${D.textColor}; text-transform: uppercase; margin: 0;">
        Projects
      </h2>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}" padding-top="0" padding-bottom="0">
  <mj-column width="100%">
    <mj-image
      width="200px"
      align="left"
      src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd34dd66e91c8f6ae9a03_elsevier-logo-orange.png"
      alt="Project logo"
    />
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Project description. Edit inline.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
```

---

### `app/server/src/routes/compile.ts` (route, request-response)

**Analog:** `package.json` scripts (thin analog — compiler invocation only)

**Existing compiler invocation** (package.json lines 8-9):
```json
"build": "mjml src/pages/**.mjml -o dist/index.html",
"build-pages": "mjml src/pages/**/**.mjml -o dist/"
```
**Existing mjml dependency** (package.json line 18):
```json
"mjml": "^4.15.3"
```

**What the analog shows:** The project already uses the `mjml` npm package to compile MJML → HTML via CLI. The compile route reuses the same package programmatically via the Node API (`mjml2html()`) instead of the CLI. Pin server to `mjml@4.18.0` (not `^4.15.3` — the server must match `mjml-browser@4.18.0` bundled in grapesjs-mjml for preview/export parity).

**Pattern from RESEARCH.md Pattern 3** (no in-repo code analog; use research pattern verbatim):
```typescript
// app/server/src/routes/compile.ts
import express from 'express';
import mjml2html from 'mjml';

const router = express.Router();

router.post('/compile', async (req, res) => {
  const { mjml: editorOutput } = req.body as { mjml: string };
  const trimmed = editorOutput.trim();

  // Conditional wrap: editor.getHtml() return shape must be verified in-spike
  // via console.log(editor.getHtml()) BEFORE relying on this logic.
  // If getHtml() returns full <mjml> doc: skip wrap (prevents double-nesting).
  // If getHtml() returns bare fragment: wrap to form valid MJML document.
  const fullMjml = /<mjml/i.test(trimmed)
    ? trimmed
    : `<mjml>\n  <mj-body>\n    ${trimmed}\n  </mj-body>\n</mjml>`;

  const result = mjml2html(fullMjml, {
    validationLevel: 'soft',
    minify: false,
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('MJML compile warnings:', result.errors);
  }

  res.json({ html: result.html, errors: result.errors });
});

export default router;
```

---

## Files With No In-Repo Analog

These files have no existing codebase analog. The planner should reference the RESEARCH.md pattern number noted.

| File | Role | Data Flow | RESEARCH Pattern |
|------|------|-----------|-----------------|
| `app/client/src/main.tsx` | React entry | — | RESEARCH Pattern 1 (GjsEditor mount) |
| `app/client/src/App.tsx` | React mount component | event-driven | RESEARCH Pattern 1 (GjsEditor mount, onEditor callback, localStorage save/load) |
| `app/client/src/lib/editorConfig.ts` | config utility | — | RESEARCH Pattern 1 (pluginsOpts, storageManager: false) |
| `app/server/src/index.ts` | Express server entry | request-response | RESEARCH §"Express Compile Endpoint (Conditional Wrap)" |
| `app/client/vite.config.ts` | Vite config | — | RESEARCH §"Wave 0 Gaps" (proxy `/api` → `http://localhost:3000`) |
| `app/client/index.html` | HTML entry | — | Standard Vite SPA scaffold |
| `app/client/package.json` | package manifest | — | RESEARCH §"Standard Stack" install commands |
| `app/server/package.json` | package manifest | — | RESEARCH §"Standard Stack" install commands |
| `app/client/tsconfig.json` | TS config | — | TypeScript strict mode; Vite app target |
| `app/server/tsconfig.json` | TS config | — | TypeScript strict mode; Node ESM target; `tsx` runner |

---

## Shared Patterns

### Block Content Authoring Rules
**Source:** `src/components/head.mjml` (mj-attributes) + CLAUDE.md (Custom Block Authoring Pattern)
**Apply to:** `hero.ts`, `projects.ts`, and all future block definitions

- `mj-attributes` is architecturally broken in grapesjs-mjml — defaults are silently dropped. Every attribute that `head.mjml`'s `mj-attributes` would apply globally (`color`, `line-height`, `font-size`, `font-family`) MUST be inlined on every `mj-text` wrapper and repeated in every inline `style` attribute on inner HTML elements.
- Do NOT include `mj-attributes`, `mj-include`, or `mj-style` inside block content strings.
- `background-url` belongs on `mj-section`, not on a `div`.
- Block content strings are bare MJML fragments, not full `<mjml>` documents.

### StrictMode Double-Registration Guard
**Source:** RESEARCH.md Pattern 1 + A1 assumption
**Apply to:** `App.tsx` (or wherever `editor.Blocks.add()` is called in `onEditor`)

```typescript
// In onEditor callback — guards against React StrictMode double-invocation
if (!editor.Blocks.get('ddroidd-hero')) {
  editor.Blocks.add('ddroidd-hero', heroBlock);
}
if (!editor.Blocks.get('ddroidd-projects')) {
  editor.Blocks.add('ddroidd-projects', projectsBlock);
}
```

### pluginsOpts Key Rule
**Source:** CLAUDE.md ("What NOT to Use") + RESEARCH.md Pitfall 1
**Apply to:** `App.tsx` / `editorConfig.ts`

Always hardcode the string key `'grapesjs-mjml'` in `pluginsOpts`. Never use the computed key `[grapesjsMjml]` — it causes issue #223 where blocks appear in the panel but cannot be dropped onto the canvas.

### localStorage Round-Trip Key
**Source:** RESEARCH.md Pattern 4
**Apply to:** `App.tsx`

```typescript
const STORAGE_KEY = 'ddroidd_newsletter_draft';
```

### MJML Compile: body size limit + CORS
**Source:** RESEARCH.md §"Security Domain"
**Apply to:** `app/server/src/index.ts`

```typescript
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
```

---

## Source Reconciliation Notes for the Planner

These are divergences between the actual MJML sources and the RESEARCH.md idealized examples. The executor must use these reconciled values, not the raw sources or research examples in isolation.

| Issue | Source says | RESEARCH says | Use |
|-------|------------|---------------|-----|
| Hero `<p>` line-height | `20px` (hero.mjml line 20) | `24px` (BLOCK_DEFAULTS) | `24px` — head.mjml + projects.mjml both say 24; hero's 20 is the outlier |
| `background-url` on mj-section | Not in source (source uses only `background-color`) | Added to heroBlock intentionally | Include it — D-04 deliberate risk probe; document result in criterion #5 |
| `mj-text` wrapper color | `#F45E43` (accent) in source | `#ffffff` from BLOCK_DEFAULTS | Use BLOCK_DEFAULTS `#ffffff` on wrapper; inner `<p>` already overrides to white anyway |
| Tracking pixel section | Second `mj-section` in hero.mjml | Not included in heroBlock | Drop — `css-class` not panel-editable; tracking out of scope |

---

## Metadata

**Analog search scope:** `src/sections/`, `src/components/`, `package.json` (project root)
**Files read:** `hero.mjml`, `projects.mjml`, `head.mjml`, `package.json`, `01-CONTEXT.md`, `01-RESEARCH.md`, `CLAUDE.md`
**Pattern extraction date:** 2026-06-25
