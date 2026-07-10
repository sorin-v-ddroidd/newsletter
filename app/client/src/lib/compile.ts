import mjml2html from 'mjml-browser';
import type { MjmlError } from 'mjml-browser';

// Compiler-agnostic shared module: the single canonical mj-head string and the pure
// wrap/strip/inject transform. Neither the server (mjml@4.18.0) nor the client
// (mjml-browser@4.18.0) compiler is imported here -- this module does NOT compile MJML, it
// only produces the full MJML document string that either compiler consumes. That is what
// keeps EXPORT-04 true across both runtimes: exactly ONE source of truth for the head.
//
// NOTE: unlike the legacy src/components/head.mjml, mj-style is a DIRECT child of mj-head
// (sibling of mj-attributes), not nested inside it -- nesting it inside mj-attributes silently
// drops the .tracking-pixel rule.
//
// The `a { color }` rule is a SEPARATE mj-style with inline="inline": <a> color does not
// inherit in email clients (UA forces link-blue; Outlook's Word engine ignores color:inherit),
// so naked anchors typed inside mj-text would render off-brand. inline="inline" makes juice
// inline it onto matching <a> at compile. It only lands where no higher-specificity inline
// color already exists -- branded-anchor inline colors and mj-button/mj-social anchor colors
// (which mjml renders inline) win, so buttons and pre-colored links are unchanged.
export const CANONICAL_HEAD = `
  <mj-head>
    <mj-title>DDROIDD Digest</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:wght@400;700" />
    <mj-attributes>
      <mj-text color="#ffffff" line-height="24px" font-size="16px" />
      <mj-all font-family="Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif" />
    </mj-attributes>
    <mj-style>.tracking-pixel { display: none; }</mj-style>
    <mj-style inline="inline">a { color: #ffffff; text-decoration: underline; }</mj-style>
  </mj-head>
`;

// Substrings that must survive compile when the canonical head is correctly injected.
// Used by verify-compile.ts, verify-parity.ts, and any caller that wants to assert head
// presence.
export const HEAD_MARKERS: string[] = ['family=Roboto', '.tracking-pixel'];

/**
 * @description Pure transform: takes whatever MJML string an editor emits (a bare fragment
 * or a full document, with or without its own mj-head) and returns a full MJML document with
 * exactly one mj-head -- the CANONICAL_HEAD above. Does NOT compile to HTML; that is left to
 * the caller's chosen engine (mjml on the server, mjml-browser in the browser) so this module
 * has zero compiler dependency and can be imported by both.
 */
export const buildFullMjml = (editorOutput: string): string => {
  const trimmed = editorOutput.trim();

  // Conditional wrap: prevent double-nesting if editor.getHtml() already returns a full
  // <mjml> doc. A bare fragment (no <mjml> root) is wrapped to form a valid MJML document.
  const wrapped = /<mjml/i.test(trimmed)
    ? trimmed
    : `<mjml>\n  <mj-body>\n    ${trimmed}\n  </mj-body>\n</mjml>`;

  // Strip any mj-head the editor emitted (case-insensitive, dot-matches-newline) so exactly
  // one head source remains before injection.
  const withoutHead = wrapped.replace(/<mj-head[\s\S]*?<\/mj-head>/gi, '');

  // Inject the canonical head immediately after the opening <mjml...> tag.
  return withoutHead.replace(/(<mjml[^>]*>)/i, `$1${CANONICAL_HEAD}`);
};

export type CompileResult = {
  html: string;
  errors: MjmlError[];
};

/**
 * @description Compiles editor-emitted MJML into client-safe HTML entirely in-browser via
 * mjml-browser@4.18.0 -- the same version + compile options as the server's mjml@4.18.0 path
 * (app/server/src/services/compile.ts), fed the identical buildFullMjml transform (app/shared/
 * mjml-head.ts) so both engines only differ in the compiler itself (proven by
 * app/server/scripts/verify-parity.ts). MUST stay synchronous: mjml-browser is sync at
 * runtime, and the Task 3 "Preview & Compile" flow calls window.open() in the same user
 * gesture as this call -- awaiting a Promise here would move window.open() outside the
 * gesture and trigger popup blockers.
 */
export const compileNewsletter = (editorOutput: string): CompileResult => {
  const result = mjml2html(buildFullMjml(editorOutput), {
    validationLevel: 'soft',
    minify: false,
  });

  return { html: result.html, errors: result.errors };
};
