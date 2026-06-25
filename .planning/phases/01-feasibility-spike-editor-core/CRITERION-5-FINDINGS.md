# Criterion 5 Findings: mj-attributes Experiment + BLOCK_DEFAULTS Validation

**Outcome: CRITERION-5 PASS**
**Date:** 2026-06-25
**Plan:** 01-04 (Phase 01, Wave 2)

---

## Summary

- **Part A (negative confirmation):** `mj-attributes` is honored by the `mjml@4.18.0` compiler when present in raw MJML. This contrasts with the editor-level behavior where `mj-attributes` is silently dropped by `grapesjs-mjml` during save/load (issues #35/#17). The architectural implication: BLOCK_DEFAULTS inlining is required for all branded blocks.
- **Part B (positive validation):** The `ddroidd-hero` block with all brand defaults inlined via BLOCK_DEFAULTS compiles correctly with **NO mj-head injection** and **0 errors**. White text (`#ffffff`), the Calibri/Roboto font stack, and the `#0B1624` background all appear in the compiled HTML from inlined defaults alone. `fluid-on-mobile` renders as `mj-full-width-mobile` CSS. `background-url` is applied.
- **BLOCK_DEFAULTS mitigation: VALIDATED.** Inlined defaults compile correctly without mj-head. This is the architectural foundation for all Phase 3 branded blocks.

---

## Evidence Labeling Key

- **DIRECTLY-OBSERVED:** Run as a one-shot `node --input-type=module` script inside `app/server` using `mjml@4.18.0` (the locked server compiler). Output captured verbatim below.
- **INFERRED-FROM-SOURCE:** Claim derives from grapesjs-mjml source, GitHub issues, or RESEARCH.md analysis. Cannot be directly observed without a running browser + GrapesJS DOM.

---

## Part A: Negative Confirmation — mj-attributes and the Compiler/Editor Distinction

### What was tested

A full `<mjml>` document with `mj-attributes` setting all `mj-text` elements to `color="#ff0000"` was compiled directly via `mjml@4.18.0`:

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-text color="#ff0000" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section>
  </mj-body>
</mjml>
```

### Observed result — DIRECTLY-OBSERVED

```
PART A ERRORS: []
color:#ff0000 present in compiled HTML: true
```

Compiled HTML excerpt (extracted from output):

```html
<div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;line-height:1;text-align:left;color:#ff0000;">Test</div>
```

**Compile errors: 0. `color:#ff0000` IS present. `mj-attributes` IS honored by the mjml compiler.**

### Interpretation

The `mjml@4.18.0` compiler fully honors `mj-attributes`. The color is applied, no errors. This is expected — `mj-attributes` is a standard MJML feature at the compiler level.

The "silently dropped" behavior described in RESEARCH.md Pitfall 4 and CLAUDE.md ("mj-attributes: NO") refers exclusively to the **grapesjs-mjml editor layer**:

- **INFERRED-FROM-SOURCE (GitHub issue #35):** When MJML containing `mj-attributes` is loaded into `grapesjs-mjml`, the plugin's `mj-head` parsing corrupts the structure — `mj-head` gets relocated inside `mj-body`. The `mj-attributes` content is lost.
- **INFERRED-FROM-SOURCE (GitHub issue #17, Mautic forum moderator):** Global defaults via `mj-attributes` are architecturally broken in `grapesjs-mjml`; they are never applied through the editor component model.
- **INFERRED-FROM-SOURCE:** When `editor.getHtml()` is called after loading MJML with `mj-attributes`, the output no longer contains the `mj-attributes` block, so the defaults are not present for the server compile either.

**Conclusion:** The mj-attributes drop is an **editor-level behavior, not a compiler behavior**. The compiler would apply the defaults correctly if given the full MJML, but the editor strips them during save/load before the compiler ever sees them. This is why BLOCK_DEFAULTS (inlining all values per element) is the correct mitigation — it bypasses the editor's head-management layer entirely.

---

## Part B: Positive Validation — BLOCK_DEFAULTS Compile Confirmation

### What was tested

The `ddroidd-hero` block content string (from `app/client/src/blocks/hero.ts`, exactly as authored in Plan 01) was compiled via `mjml@4.18.0` **without any mj-head injection**. The fragment was wrapped as:

```xml
<mjml>
  <mj-body>
    <mj-section background-color="#0B1624" background-url="...">
      <mj-column>
        <mj-image src="..." fluid-on-mobile="true" />
        <mj-text color="#ffffff" font-family="Calibri, Roboto, ..." font-size="16px" line-height="24px">
          ...
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

All brand values come from `BLOCK_DEFAULTS` constants inlined in the block content string. No `mj-head`, no `mj-attributes`, no `mj-include`, no `mj-style`.

### Observed result — DIRECTLY-OBSERVED

```
PART B ERRORS: []
Errors count: 0
Has #0B1624 background: true
Has #ffffff text color: true
Has Calibri in font stack: true
Has mj-full-width-mobile (fluid-on-mobile rendered): true
Has background-url in compiled HTML: true
```

Compiled HTML excerpts (extracted from output):

**Background color (#0B1624):**
```html
<table ... bgcolor="#0B1624"><tr><td ...>
```

**White text (#ffffff):**
```html
style="...text-align:left;color:#ffffff;"
```

**Calibri font stack:**
```html
style="font-family:Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif;..."
```

**fluid-on-mobile → mj-full-width-mobile CSS media query:**
```css
@media only screen and (max-width:479px) {
  table.mj-full-width-mobile { width: 100% !important; }
  td.mj-full-width-mobile { width: auto !important; }
}
```

**background-url applied (img-hero.png in compiled output):**
```html
<v:background ... src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png" color="#0B1624" type="tile" />
```

### Conclusion

All six expected values appear in the compiled output from inlined BLOCK_DEFAULTS alone, with 0 compile errors and no mj-head injection. **BLOCK_DEFAULTS mitigation validated.**

---

## Criterion-5 Checklist

### 1. Does `fluid-on-mobile` on `mj-image` survive `getProjectData()`/`loadProjectData()`?

**INFERRED-FROM-SOURCE / Deferred to browser gate.**

The `fluid-on-mobile` attribute is part of the block's static content string (a hardcoded fragment stored in `hero.ts`). When the block is dropped onto the canvas, grapesjs-mjml stores the component tree including this attribute in the project JSON from `getProjectData()`. Because the attribute is inline in the authored content string and is a recognized MJML attribute (not a custom trait), it should survive the round-trip.

Evidence basis: `fluid-on-mobile` is listed in the grapesjs-mjml README as a supported `mj-image` attribute. Plan 01's `assertRoundTrip()` helper verifies byte-identical JSON round-trip for the hero block; the manual browser verification step includes checking this attribute.

**Deferred finding from 01-01-SUMMARY.md:** The round-trip was marked PENDING browser verification. This finding inherits that status. To directly confirm, run `window.__ddroiddAssertRoundTrip()` in the browser console and inspect the saved JSON for `fluid-on-mobile: "true"`.

### 2. Does `fluid-on-mobile` appear in compiled HTML output?

**DIRECTLY-OBSERVED: YES.**

The `mj-full-width-mobile` CSS rule appears in the compiled HTML output from the one-shot compile above. This confirms that `fluid-on-mobile="true"` on `mj-image` is processed by `mjml@4.18.0` and generates the correct responsive CSS rule for mobile client rendering.

```css
table.mj-full-width-mobile { width: 100% !important; }
td.mj-full-width-mobile { width: auto !important; }
```

### 3. Does `background-url` on `mj-section` survive round-trip as an attribute in block content?

**INFERRED-FROM-SOURCE / Deferred to browser gate.**

Same reasoning as `fluid-on-mobile` above. The `background-url` is in the authored block content string. It is NOT a default grapesjs-mjml panel trait (confirmed in CLAUDE.md component matrix), but it is a valid MJML attribute that passes through the component model as a raw attribute.

Round-trip survival for custom/non-trait attributes in grapesjs-mjml is not guaranteed from source alone. The browser gate (`assertRoundTrip()` + JSON inspection) is the definitive check.

### 4. Does `background-url` appear in compiled HTML output?

**DIRECTLY-OBSERVED: YES.**

`background-url` is processed by `mjml@4.18.0` and generates VML background markup (for Outlook) and CSS background in the compiled output. The `img-hero.png` URL appears in the compiled HTML context of VML `<v:background>` and as a CSS background on the section `<td>`.

### 5. Are there any MJML compile warnings or errors?

**DIRECTLY-OBSERVED: 0 errors, 0 warnings.**

Both Part A and Part B compiles returned `errors: []` with `validationLevel: 'soft'`. The hero fragment compiles cleanly with no deprecation warnings, no unknown-attribute warnings, and no structural errors.

### 6. What does `console.log(editor.getHtml())` show — bare fragment or full `<mjml>` document?

**INFERRED-FROM-SOURCE** (cannot observe without a running browser/DOM).

From RESEARCH.md Pitfall 2 (bundle inspection): grapesjs-mjml feeds `preMjml + editor.getHtml().trim() + postMjml` directly into the MJML parser, where both `preMjml` and `postMjml` default to empty strings. This implies `editor.getHtml()` returns the full `<mjml>...</mjml>` document (otherwise the plugin would be passing a fragment to a parser that requires an `<mjml>` root).

The `/api/compile` endpoint's conditional wrap (`/<mjml/i.test(trimmed) ? trimmed : wrap`) handles both cases safely regardless of which shape is returned.

**To directly confirm:** Run `console.log(editor.getHtml())` in the browser console while the GrapesJS editor is mounted with a block on canvas. The first characters will either be `<mjml` (full document) or `<mj-section` (bare fragment).

---

## BLOCK_DEFAULTS Mitigation: Validated

The architectural foundation for Phase 3 branded blocks is confirmed:

1. **mj-attributes cannot be used** — silently dropped by the editor layer (editor-level, not compiler-level; INFERRED-FROM-SOURCE #35/#17).
2. **BLOCK_DEFAULTS inlining works** — all brand values survive from block definition through compile to client-safe HTML (DIRECTLY-OBSERVED).
3. **fluid-on-mobile compiles correctly** (DIRECTLY-OBSERVED). Round-trip survival is inferred/deferred to browser gate.
4. **background-url compiles correctly** (DIRECTLY-OBSERVED). Round-trip survival is inferred/deferred to browser gate.
5. **0 compile errors** from the inlined-defaults hero fragment with no mj-head injection (DIRECTLY-OBSERVED).

**Criterion #5: PASS.**
Pending browser gate: round-trip byte-identity of `fluid-on-mobile` and `background-url` attributes (deferred to manual verification step in 01-01-SUMMARY.md D-04 Risk Probe section).

---

## Source References

- GitHub grapesjs/mjml issue #35: `mj-head`/`mj-attributes` import corruption
- GitHub grapesjs/mjml issue #17: global defaults via `mj-attributes` architecturally broken
- RESEARCH.md Pitfall 4 (lines 523-528): mj-attributes silently dropped
- CLAUDE.md component matrix: `mj-attributes: NO` (confirmed broken)
- RESEARCH.md Pitfall 2 (lines 506-514): getHtml() shape — bundle inspection of `preMjml/postMjml`
- One-shot compile script: `node --input-type=module` inside `app/server` using `mjml@4.18.0`
