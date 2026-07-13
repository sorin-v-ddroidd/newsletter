import { usePlugin, type Editor as GrapesEditor, type EditorConfig, type Component } from 'grapesjs';
import grapesjsMjml from 'grapesjs-mjml';
import { registerBlocks } from './blocks/registerBlocks';
import { assertRoundTrip, isLoadingProject } from './actions';
import { BLOCK_DEFAULTS } from './blocks/BLOCK_DEFAULTS';

// Augment window with spike-only debug helpers exposed for manual console verification.
declare global {
  interface Window {
    __ddroiddEditor?: GrapesEditor;
    __ddroiddAssertRoundTrip?: () => void;
  }
}

// Email-safe StyleManager sectors (EDIT-06). Every property here is a genuine MJML
// attribute (see https://documentation.mjml.io) — MJML compiles them to table-based,
// client-safe HTML, so they are safe by construction. What we DON'T expose are raw CSS
// props MJML can't guarantee cross-client (flexbox/position/box-shadow/grid/margin).
// The union below is the full palette; each component only shows the subset in its
// STYLABLE_BY_TYPE list (applied in onEditor), so e.g. an image never shows line-height.
const opts = (...vals: string[]) => vals.map((v) => ({ id: v, label: v }));

const styleManagerSectors: NonNullable<EditorConfig['styleManager']>['sectors'] = [
  {
    id: 'typography',
    name: 'Typography',
    open: true,
    properties: [
      'font-family',
      'font-size',
      { id: 'font-weight', property: 'font-weight', name: 'Font weight', type: 'select',
        default: 'normal', options: opts('normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900') },
      { id: 'font-style', property: 'font-style', name: 'Font style', type: 'select',
        default: 'normal', options: opts('normal', 'italic') },
      'color',
      'line-height',
      { id: 'letter-spacing', property: 'letter-spacing', name: 'Letter spacing', type: 'text' },
      // `align` is the legal MJML horizontal-align attribute for mj-text/mj-button/mj-image/
      // mj-divider/mj-social-element (see mjml-email-safety.md). `text-align` is legal ONLY on
      // mj-section. Both live in this sector; STYLABLE_BY_TYPE scopes which one each component
      // actually shows. `justify` is deliberately excluded — not valid on image/button/divider.
      { id: 'align', property: 'align', name: 'Align', type: 'select',
        default: 'left', options: opts('left', 'center', 'right') },
      'text-align',
      { id: 'text-decoration', property: 'text-decoration', name: 'Decoration', type: 'select',
        default: 'none', options: opts('none', 'underline', 'overline', 'line-through') },
      { id: 'text-transform', property: 'text-transform', name: 'Transform', type: 'select',
        default: 'none', options: opts('none', 'uppercase', 'lowercase', 'capitalize') },
    ],
  },
  {
    id: 'spacing',
    name: 'Spacing',
    open: false,
    // Shorthand text fields (not composite): the custom right panel renders base inputs,
    // and shorthand is the email-pragmatic form. inner-padding applies to mj-button/hero.
    properties: [
      { id: 'padding', property: 'padding', name: 'Padding', type: 'text' },
      { id: 'inner-padding', property: 'inner-padding', name: 'Inner padding', type: 'text' },
    ],
  },
  {
    id: 'background',
    name: 'Background',
    open: false,
    properties: [
      'background-color',
      { id: 'container-background-color', property: 'container-background-color', name: 'Container background', type: 'color' },
    ],
  },
  {
    id: 'border',
    name: 'Border',
    open: false,
    // mj-divider uses border-color/style/width; sections/buttons/images use border + radius.
    properties: [
      { id: 'border', property: 'border', name: 'Border', type: 'text' },
      { id: 'border-radius', property: 'border-radius', name: 'Radius', type: 'text' },
      { id: 'border-width', property: 'border-width', name: 'Width', type: 'text' },
      { id: 'border-style', property: 'border-style', name: 'Style', type: 'select',
        default: 'solid', options: opts('solid', 'dashed', 'dotted', 'none') },
      { id: 'border-color', property: 'border-color', name: 'Color', type: 'color' },
    ],
  },
  {
    id: 'dimension',
    name: 'Dimension',
    open: false,
    // width/height are valid MJML attributes on images/buttons/dividers/columns.
    properties: [
      { id: 'width', property: 'width', name: 'Width', type: 'text' },
      { id: 'height', property: 'height', name: 'Height', type: 'text' },
      { id: 'vertical-align', property: 'vertical-align', name: 'Vertical align', type: 'select',
        default: 'top', options: opts('top', 'middle', 'bottom') },
    ],
  },
  {
    // mj-section-only MJML attributes (260710-et7). All are genuine MJML attributes → table-safe
    // by construction. NOTE on background image: background-url is Outlook-safe on mj-section
    // (VML fallback), but background-size/-position/-repeat route through Outlook VML and don't
    // all translate (cover/contain/position) — verify bg-image in a real Outlook render, don't
    // assume. Explicit `type: 'text'` forces simple inputs so GrapesJS doesn't auto-type
    // background-position/-size as `composite` (which RightPanel filters out).
    id: 'section',
    name: 'Section',
    open: false,
    properties: [
      { id: 'background-url', property: 'background-url', name: 'Background image URL', type: 'text' },
      { id: 'background-position', property: 'background-position', name: 'Background position', type: 'text' },
      { id: 'background-size', property: 'background-size', name: 'Background size', type: 'text' },
      { id: 'background-repeat', property: 'background-repeat', name: 'Background repeat', type: 'select',
        default: 'repeat', options: opts('repeat', 'no-repeat') },
      { id: 'full-width', property: 'full-width', name: 'Full width', type: 'select',
        default: '', options: [{ id: '', label: 'Normal' }, { id: 'full-width', label: 'Full width' }] },
      { id: 'direction', property: 'direction', name: 'Direction', type: 'select',
        default: 'ltr', options: opts('ltr', 'rtl') },
    ],
  },
];

// Per-component email-safe style props (MJML attribute tables). A GrapesJS style property
// only renders when it appears in BOTH a sector above AND the selected component's
// `stylable` list — so this is what scopes each component to its real MJML attributes.
// Applied to each component type's defaults in onEditor.
export const STYLABLE_BY_TYPE: Record<string, string[]> = {
  'mj-text': ['font-family', 'font-size', 'font-weight', 'font-style', 'color', 'line-height',
    'letter-spacing', 'align', 'text-decoration', 'text-transform', 'padding', 'container-background-color'],
  'mj-button': ['font-family', 'font-size', 'font-weight', 'font-style', 'color', 'line-height',
    'letter-spacing', 'align', 'text-decoration', 'text-transform', 'padding', 'inner-padding',
    'background-color', 'border', 'border-radius', 'width', 'height', 'container-background-color'],
  'mj-image': ['align', 'padding', 'border', 'border-radius', 'width', 'height', 'container-background-color'],
  'mj-divider': ['align', 'border-color', 'border-style', 'border-width', 'width', 'padding', 'container-background-color'],
  'mj-section': ['background-color', 'padding', 'border', 'border-radius', 'text-align',
    'background-url', 'background-position', 'background-size', 'background-repeat',
    'full-width', 'direction'],
  'mj-column': ['background-color', 'padding', 'border', 'border-radius', 'vertical-align', 'width'],
  'mj-wrapper': ['background-color', 'padding', 'border', 'border-radius'],
  'mj-hero': ['background-color', 'padding', 'inner-padding', 'border-radius', 'height', 'vertical-align'],
  'mj-social-element': ['align', 'font-family', 'font-size', 'font-weight', 'color', 'line-height',
    'letter-spacing', 'text-decoration', 'padding', 'background-color', 'border-radius'],
  // Generic MJML standard-body components added to the palette (260710-et7). Email-safe
  // subsets only — same BOTH-lists rule as above (sector ∩ this list).
  'mj-group': ['background-color', 'width', 'vertical-align'],
  'mj-carousel': ['border-radius', 'container-background-color'],
  'mj-carousel-image': ['border-radius'],
  'mj-accordion': ['font-family', 'border', 'padding', 'container-background-color'],
  'mj-accordion-element': ['font-family', 'border', 'background-color'],
  'mj-accordion-title': ['font-family', 'font-size', 'color', 'padding', 'background-color'],
  'mj-accordion-text': ['font-family', 'font-size', 'color', 'line-height', 'padding', 'background-color'],
};

// Font-bearing component types — derived from STYLABLE_BY_TYPE so "which components render
// text in a font" has ONE source of truth (the entries whose stylable list includes
// 'font-family': mj-text, mj-button, mj-social-element).
const FONT_BEARING_TYPES: ReadonlySet<string> = new Set(
  Object.entries(STYLABLE_BY_TYPE)
    .filter(([, props]) => props.includes('font-family'))
    .map(([type]) => type),
);

// applyDroppedDefaults: on block drop, fill MISSING (1) brand font attrs on every font-bearing
// component and (2) explicit padding on mj-section. Generic plugin blocks (Text/Button/Social/
// columns, kept via resetBlocks:false) drop with NO font attrs (→ plugin default font on canvas)
// and NO padding attr (→ invisible MJML default, unremovable in the panel). (Exported HTML fonts
// are already correct — the server mj-head sets them via mj-attributes; the canvas has no injected
// head, hence the gap.)
//
// Fill-MISSING only (never overwrite): branded blocks already carry these attrs, so they're
// untouched; idempotent. color is deliberately NOT set — BLOCK_DEFAULTS.textColor is #ffffff and
// a generic block can land in a light section (white-on-white; the white-default-text trap in
// mjml-email-safety.md). Text color is owned by the server head at export.
// MJML's OWN default paddings, made explicit on drop (see applyDroppedDefaults). Values match the
// MJML spec exactly, so writing them explicitly is a zero-visual-change no-op that simply surfaces
// the padding in the Style Manager (empty field → concrete value the user can edit down to 0).
const MJML_DEFAULT_PADDING: Record<string, string> = {
  'mj-section': '20px 0',
  'mj-text': '10px 25px',
  'mj-image': '10px 25px',
  'mj-button': '10px 25px',
};

// Splits a CSS padding shorthand into explicit [top, right, bottom, left] longhands per the
// standard 1/2/3/4-value CSS shorthand rules. Returns null for anything that isn't 1-4
// whitespace-separated tokens (defensive — callers skip the mutation on null).
const parsePaddingShorthand = (value: string): [string, string, string, string] | null => {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    const [v1] = tokens;
    return [v1, v1, v1, v1];
  }
  if (tokens.length === 2) {
    const [v1, v2] = tokens;
    return [v1, v2, v1, v2];
  }
  if (tokens.length === 3) {
    const [v1, v2, v3] = tokens;
    return [v1, v2, v3, v2];
  }
  if (tokens.length === 4) {
    const [v1, v2, v3, v4] = tokens;
    return [v1, v2, v3, v4];
  }
  return null;
};

// Re-entrancy guard for the padding-shorthand expansion listener below. Cheap insurance only —
// the handler writes just the four longhands, and `padding-top`/etc. changes do not match the
// `component:styleUpdate:padding` event, so re-entrancy should not occur by construction.
let expandingPadding = false;

const applyDroppedDefaults = (component: Component): void => {
  const type = String(component.get('type'));
  if (FONT_BEARING_TYPES.has(type)) {
    const attrs = component.getAttributes();
    const missing: Record<string, string> = {};
    if (!attrs['font-family']) {
      missing['font-family'] = BLOCK_DEFAULTS.fontFamily;
    }
    if (!attrs['font-size']) {
      missing['font-size'] = BLOCK_DEFAULTS.fontSize;
    }
    if (!attrs['line-height']) {
      missing['line-height'] = BLOCK_DEFAULTS.lineHeight;
    }
    if (Object.keys(missing).length > 0) {
      component.addAttributes(missing);
    }
  }
  // Make MJML's IMPLICIT default padding EXPLICIT on drop (260710). Generic plugin blocks
  // (sections, text, image, button) drop with NO padding attribute, so MJML applies its default at
  // compile (section 20px 0; text/image/button 10px 25px) — but the Style Manager "Padding" field
  // is then empty, so a non-dev can't SEE the padding to remove it (and clearing the empty field
  // just re-applies the default). Writing the default explicitly surfaces it in the panel →
  // editable down to 0. Fill-MISSING only, value equals MJML's own default → zero visual change.
  // Branded blocks already set their own padding, so they're untouched.
  const defaultPadding = MJML_DEFAULT_PADDING[type];
  if (defaultPadding && component.getAttributes()['padding'] === undefined) {
    component.addAttributes({ padding: defaultPadding });
  }
  component.components().forEach((child: Component) => { applyDroppedDefaults(child); });
};

// EDIT-06 hard gate — the email-safe style-property allowlist, derived from the sole
// styleManagerSectors definition above so there is ONE source of truth. grapesjs-mjml
// injects its own sectors (Dimension/Typography/Decorations) that clobber the config
// allowlist, surfacing Outlook-unsafe props (width, border-radius, box-shadow, margin…).
// The right panel filters rendered style properties against this set, so an injected
// sector can only ever show properties we bless — a blocklist of sector NAMES cannot.
export const EMAIL_SAFE_STYLE_PROPS: ReadonlySet<string> = new Set(
  styleManagerSectors.flatMap((sector) =>
    (sector.properties ?? []).map((prop) => (typeof prop === 'string' ? prop : String(prop.property ?? prop.id))),
  ),
);

// Editable traits for each carousel slide (260710-et7). Registered via the mj-carousel-image
// type defaults in onEditor (grapesjs-mjml ships the type with no traits).
const CAROUSEL_IMAGE_TRAITS = [
  { type: 'text', name: 'src', label: 'Image URL' },
  { type: 'text', name: 'alt', label: 'Alt text' },
  { type: 'text', name: 'href', label: 'Link URL (optional)' },
];

// mj-image traits (260713-mxb): grapesjs-mjml@1.0.8 registers mj-image with traits
// ['href','rel','alt','title'] and NO `src` trait, so the image URL never appears in the
// Content section. `rel`/`title` are dropped deliberately — noise for non-devs.
const MJ_IMAGE_TRAITS = [
  { type: 'text', name: 'src', label: 'Image URL' },
  { type: 'text', name: 'href', label: 'Link URL' },
  { type: 'text', name: 'alt', label: 'Alt text' },
];

// onEditor is called by @grapesjs/react after the editor is initialised.
// The `editor.Blocks.get(id)` guard prevents duplicate block registration
// on React StrictMode double-invocation.
export const onEditor = (editor: GrapesEditor): void => {
  // Expose editor on window for manual console verification during the spike.
  window.__ddroiddEditor = editor;
  window.__ddroiddAssertRoundTrip = () => { assertRoundTrip(editor); };

  // Seed the mjml/mj-body scaffold on an empty canvas. Every mjml component's
  // `draggable` rule targets `[data-gjs-type="mj-body"]` (or a descendant), so
  // without an mj-body in the document NO block has a legal drop target and
  // every drag is silently rejected. This is the plugin's standard init shape;
  // it is NOT the forbidden "reload user content from MJML string" pattern
  // (persisted state remains project JSON — see .claude/rules/grapesjs.md).
  if (editor.getComponents().length === 0) {
    editor.setComponents('<mjml><mj-body></mj-body></mjml>');
    editor.UndoManager.clear();
  }

  // Belt-and-braces: re-assert the email-safe sectors. The real fix is
  // resetStyleManager: false in pluginsOpts — the plugin's sector reset runs in
  // editor.onReady(), i.e. AFTER this hook, so this reset alone cannot win.
  editor.StyleManager.getSectors().reset(styleManagerSectors as object[]);

  // Scope each component to its real MJML attributes (STYLABLE_BY_TYPE). A style property
  // renders only when it is in BOTH a sector above AND the component's `stylable` list.
  // The plugin sets its own (broader) stylable on the model and it overrides prototype
  // defaults, so we set it per-instance on selection — this reliably wins. Result: an image
  // never shows line-height, text never shows border, etc. Types not listed keep plugin defaults.
  editor.on('component:selected', (component) => {
    const props = STYLABLE_BY_TYPE[String(component.get('type'))];
    if (props) {
      component.set('stylable', props);
    }
  });

  // Fill brand font attrs + explicit section padding on newly-dropped blocks (see
  // applyDroppedDefaults). block:drag:stop fires ONLY on a real block drop — NOT during
  // loadProjectData — so this never mutates loaded project data and the Phase-1 round-trip stays
  // byte-identical (actions.ts assertRoundTrip). The first arg is the dropped component, or a
  // falsy value when the drop was rejected (no legal target).
  editor.on('block:drag:stop', (component: Component | undefined) => {
    if (!component) {
      return;
    }
    applyDroppedDefaults(component);
  });

  // Mirror the `padding` shorthand into the four longhand styles (padding-top/right/bottom/left)
  // whenever the Style Manager's Padding field changes. grapesjs-mjml's style-default ships
  // LONGHAND paddings on the model, and at MJML compile longhand overrides shorthand — so without
  // this, editing the shorthand-only Padding field never changed the compiled/canvas padding
  // (see the verified_diagnosis in the 260710-kz8 plan). Bail during loadProjectData (isLoadingProject)
  // so this never mutates a document that lacked these longhands, keeping the Phase-1 round-trip
  // byte-identical.
  editor.on('component:styleUpdate:padding', (component: Component | undefined) => {
    if (isLoadingProject()) {
      return;
    }
    const target = component ?? editor.getSelected();
    if (!target) {
      return;
    }
    if (expandingPadding) {
      return;
    }
    expandingPadding = true;
    try {
      const paddingValue = target.getStyle()['padding'];
      if (!paddingValue || typeof paddingValue !== 'string') {
        ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'].forEach((prop) => {
          target.removeStyle(prop);
        });
        return;
      }
      const longhands = parsePaddingShorthand(paddingValue);
      if (!longhands) {
        return;
      }
      const [top, right, bottom, left] = longhands;
      target.addStyle({
        'padding-top': top,
        'padding-right': right,
        'padding-bottom': bottom,
        'padding-left': left,
      });
    } finally {
      expandingPadding = false;
    }
  });

  // grapesjs-mjml adds its own 'devices-c' panel with Desktop/Tablet/Mobile buttons at
  // plugin init (verified in grapesjs-mjml/dist/index.js: addPanel({id:'devices-c'})).
  // In custom-UI mode this renders as a stray mini-toolbar floating over the canvas —
  // our TopBar owns the device switcher (DevicesProvider), so remove the panel.
  // editor-shell.css also hides any leftover .gjs-pn-panel as a fallback.
  if (editor.Panels.getPanel('devices-c')) {
    editor.Panels.removePanel('devices-c');
  }

  // Canvas-only editing affordances. Injected DOM-direct into the canvas iframe document, NOT
  // via StyleManager/CssComposer/setStyle — so none of this enters getProjectData() and the
  // Phase-1 round-trip stays byte-identical (assertRoundTrip). Purely how the email LOOKS WHILE
  // EDITING; export is unaffected (compile.ts owns the exported HTML).
  //
  // 1. Anchor color (260710-67u): a naked <a> in mj-text renders link-blue on canvas because
  //    <a> color does not inherit. `a { color: inherit }` matches surrounding text while editing
  //    (canvas is Chrome, honors inherit). Export uses explicit #ffffff (Outlook ignores inherit).
  // 2. Carousel first slide (260710-et7): MJML hides every mj-carousel slide until a radio is
  //    :checked. A freshly-dropped carousel has none checked → it renders BLANK in the editor
  //    (confirmed 2026-07-10: getHtml has all 3 images, structure intact — canvas display quirk
  //    only). Reveal the first slide (.mj-carousel-image-1) so the block is visible while editing.
  //    Export is correct as-is (the compiled :checked/noinput fallback shows slide 1 in clients).
  editor.on('load', () => {
    const doc = editor.Canvas.getDocument();
    if (!doc || doc.getElementById('ddroidd-canvas-style')) {
      return;
    }
    const style = doc.createElement('style');
    style.id = 'ddroidd-canvas-style';
    // (3) Accordion: grapesjs-mjml does NOT compile mj-accordion in the canvas — it renders the RAW
    // custom tags (<mj-accordion-title> etc., confirmed 2026-07-10), which default to unstyled
    // display:inline → titles/text are present + inline-editable (type=text) but visually flat.
    // Style the raw tags so it reads as structured panels while editing (all expanded → all text
    // editable). Colours mirror the block default; real collapse + per-attr styling apply at export.
    // CSS only — no view override, so inline text editing is preserved.
    style.textContent = [
      'a { color: inherit; }',
      '.mj-carousel-image-1 { display: block !important; }',
      'mj-accordion { display: block; }',
      'mj-accordion-element { display: block; border: 1px solid #e0e0e0; }',
      'mj-accordion-element + mj-accordion-element { border-top: none; }',
      // Explicit font-size REQUIRED: the raw custom tags inherit font-size:0 in the canvas chain
      // (verified 2026-07-10 — text was present but 0px → invisible).
      'mj-accordion-title { display: block; background: #ffffff; color: #031017; padding: 15px; font-size: 16px; line-height: 1.3; font-weight: 600; }',
      'mj-accordion-text { display: block; background: #fafafa; color: #505050; padding: 15px; font-size: 14px; line-height: 1.4; }',
    ].join(' ');
    doc.head.appendChild(style);
  });

  // mj-carousel / mj-carousel-image: grapesjs-mjml does NOT register component TYPES for these
  // tags — dropped instances land as GENERIC components (get('type') === '', default id/title
  // traits), confirmed live 2026-07-10 by walking the tree. So every prior type-keyed hook silently
  // no-op'd. Register real types here with `isComponent` (matches the tag → instances become our
  // type) so our traits + canvas view actually apply. Export is unaffected: getHtml serializes by
  // tagName + attributes + children, which is already valid MJML regardless of the grapesjs type.
  //
  // mj-carousel-image: add src/alt/href as editable traits (plugin ships none) → RightPanel
  // "Content" section when a slide is selected via the Layers tree (canvas preview is a static paint).
  editor.Components.addType('mj-carousel-image', {
    isComponent: (el) => el.tagName === 'MJ-CAROUSEL-IMAGE',
    model: {
      defaults: {
        tagName: 'mj-carousel-image',
        droppable: false,
        traits: CAROUSEL_IMAGE_TRAITS,
      },
    },
  });

  // Custom canvas view for mj-carousel (260710-et7). The plugin can't render mj-carousel in the
  // editing canvas at all: its compiled form (radio <input>s + <label>s + scoped <style>) does not
  // survive grapesjs's canvas parsing, so no `.mj-carousel` / `.mj-carousel-images` container ever
  // exists to mount slide views into (confirmed live 2026-07-10). getChildrenSelector can't fix a
  // container that isn't there. So render a STATIC in-canvas preview directly: slide 1 + an "N
  // slides" badge, built from the child mj-carousel-image `src`s. This is presentation only —
  // export (getHtml, full-doc compile) and project JSON are untouched, so the real interactive
  // carousel still ships and the Phase-1 round-trip stays byte-identical. Slide URLs are edited via
  // the mj-carousel-image `src` trait (select a slide in the Layers tree). Preview re-renders when
  // slides are added/removed; a src edit on an existing slide refreshes on next render/reload.
  editor.Components.addType('mj-carousel', {
    isComponent: (el) => el.tagName === 'MJ-CAROUSEL',
    model: { defaults: { tagName: 'mj-carousel' } },
    view: {
      onRender() {
        // Safe DOM build (NOT innerHTML): `src` is a user-editable trait, so string-interpolating
        // it into markup would be an injection vector. Assigning img.src as a PROPERTY never parses
        // HTML, and images don't execute javascript: URLs — no XSS surface. Text via textContent.
        const srcs = this.model
          .components()
          .filter((c: Component) => String(c.get('type')) === 'mj-carousel-image')
          .map((c: Component) => c.getAttributes().src as string | undefined)
          .filter((s): s is string => Boolean(s));
        const el = this.el as HTMLElement;
        const doc = el.ownerDocument;
        el.textContent = '';
        if (!srcs.length) {
          const empty = doc.createElement('div');
          empty.style.cssText = 'padding:24px;text-align:center;color:#888;font-family:sans-serif';
          empty.textContent = 'Carousel — add image URLs in the panel';
          el.appendChild(empty);
          return;
        }
        const wrap = doc.createElement('div');
        wrap.style.cssText = 'position:relative;text-align:center';
        const img = doc.createElement('img');
        img.src = srcs[0];
        img.style.cssText = 'max-width:100%;display:block;margin:0 auto';
        const badge = doc.createElement('div');
        badge.style.cssText = 'position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;font-family:sans-serif';
        badge.textContent = `Carousel · ${srcs.length} slide${srcs.length === 1 ? '' : 's'} — preview to view all`;
        wrap.appendChild(img);
        wrap.appendChild(badge);
        el.appendChild(wrap);
      },
    },
  });

  // mj-image: add the missing `src` trait (plugin ships href/rel/alt/title, no src) so the
  // Content section shows an editable, prepopulated Image URL field. addType on an EXISTING
  // type shallow-merges model.defaults, so `traits` (array) is replaced while the plugin's
  // isComponent/view/stylable are inherited — canvas render and drag/drop are unaffected.
  editor.Components.addType('mj-image', {
    model: { defaults: { traits: MJ_IMAGE_TRAITS } },
  });

  // StrictMode-safe branded block registration (see registerBlocks.ts).
  registerBlocks(editor);
};

// Single source of truth for GrapesJS init options (kills the dead lib/editorConfig.ts
// drift risk noted in 01-UAT — this is now the ONLY options object in the app).
export const editorOptions: EditorConfig = {
  height: '100%',
  // Phase 1: no auto-save; explicit save/load via buttons + localStorage.
  storageManager: false,
  // usePlugin binds options to the plugin function directly. The old
  // pluginsOpts: { 'grapesjs-mjml': {...} } form silently NO-OPs when the plugin is passed
  // as a function: GrapesJS looks up pluginsOpts[<the function itself>], which never matches
  // the string key, so the plugin ran with ALL defaults (verified live 2026-07-05 —
  // resetStyleManager defaulted true and clobbered our email-safe sectors in onReady).
  plugins: [
    usePlugin(grapesjsMjml, {
      // Keep the generic blocks shipped by the plugin (text, image, button, columns, divider/spacer)
      resetBlocks: false,
      resetDevices: false,
      // Without this the plugin resets sectors inside editor.onReady() — AFTER onEditor's
      // re-assert — replacing our email-safe sectors with its Dimension/Typography/Decorations
      // (where padding is a composite prop the right panel filters out).
      resetStyleManager: false,
    }),
  ],
  // EDIT-06: email-safe Style Manager allowlist — see styleManagerSectors above.
  // These sectors only survive because resetStyleManager: false is set above; the plugin's
  // onReady reset would otherwise clobber them (verified live 2026-07-05). RightPanel keeps
  // its per-property allowlist + forbidden-sector warn as defense-in-depth.
  styleManager: {
    sectors: styleManagerSectors,
  },
};
