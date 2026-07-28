// Headless gate for the compile service (app/server/src/services/compile.ts). Mirrors the
// style of verify-blocks.ts: runs via tsx in server context, exits non-zero on any failed
// assertion, prints PASS lines otherwise.
//
// Proves EXPORT-04: the server always injects the single canonical mj-head (Roboto font,
// white/16px text defaults, .tracking-pixel rule), regardless of what the editor emits, and
// any mj-head the editor emits is stripped -- not merged.
import { compileNewsletter, HEAD_MARKERS } from '../src/services/compile';

let anyFailed = false;

const assertTrue = (condition: boolean, label: string): void => {
  if (condition) {
    console.log(`PASS -- ${label}`);
    return;
  }
  anyFailed = true;
  console.log(`FAIL -- ${label}`);
};

// Fixture 1: a bare fragment (no <mjml> root, no mj-head at all). Proves the canonical head
// injects cleanly into the conditional-wrap path AND that the injected head is itself valid
// MJML (errors.length === 0) -- otherwise the export warning banner would cry wolf on every
// valid newsletter.
const fragment = '<mj-section><mj-column><mj-text>hi</mj-text></mj-column></mj-section>';
const fragmentResult = compileNewsletter(fragment);

for (const marker of HEAD_MARKERS) {
  assertTrue(fragmentResult.html.includes(marker), `fragment fixture -- html contains marker "${marker}"`);
}
assertTrue(fragmentResult.errors.length === 0, 'fragment fixture -- compiles with errors: []');

// Fixture 2: a full document that ships its OWN mj-head carrying a unique sentinel. Proves
// strip+replace: the canonical head markers must be present AND the sentinel from the
// editor-emitted head must be absent. A <head> tag count can't discriminate this -- MJML
// always merges to exactly one <head> in the compiled HTML regardless of whether the emitted
// head was stripped -- so we assert on content, not tag count.
const docWithOwnHead = `
  <mjml>
    <mj-head>
      <mj-title>SHOULD-BE-STRIPPED</mj-title>
      <mj-font name="Sentinel" href="https://fonts.googleapis.com/css?family=SENTINEL" />
    </mj-head>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>hello</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`;
const docResult = compileNewsletter(docWithOwnHead);

for (const marker of HEAD_MARKERS) {
  assertTrue(docResult.html.includes(marker), `own-head fixture -- html contains canonical marker "${marker}"`);
}
assertTrue(!docResult.html.includes('family=SENTINEL'), 'own-head fixture -- sentinel font URL absent (stripped)');
assertTrue(!docResult.html.includes('SHOULD-BE-STRIPPED'), 'own-head fixture -- sentinel title text absent (stripped)');

// Fixture 3: anchors inside mj-text (260710-67u). The canonical head carries an inline
// `a { color:#ffffff }` rule so a NAKED <a> renders on-brand instead of link-blue, while an
// anchor that sets its OWN inline color keeps it (juice specificity: inline style beats the
// type selector). Proves the fix works AND does not clobber pre-colored links.
const anchorDoc =
  '<mj-section><mj-column>' +
  '<mj-text>naked <a href="https://a.example">link</a></mj-text>' +
  '<mj-text>colored <a href="https://b.example" style="color:#ff0000">link</a></mj-text>' +
  '</mj-column></mj-section>';
const anchorResult = compileNewsletter(anchorDoc);

assertTrue(anchorResult.errors.length === 0, 'anchor fixture -- compiles with errors: []');
// Naked anchor picked up the brand color inline (juice normalizes hex case/spacing, so match
// case-insensitively on the compressed form).
assertTrue(
  /color:\s*#ffffff/i.test(anchorResult.html),
  'anchor fixture -- naked <a> received inline color:#ffffff',
);
// The self-colored anchor kept its own red — the injected rule did not override it.
assertTrue(
  /color:\s*#ff0000/i.test(anchorResult.html),
  'anchor fixture -- pre-colored <a> keeps its own color:#ff0000',
);

// Fixture 4: a non-default mj-body width reaches the compiled container (WIDTH-01, Plan 03-04).
// The Global Settings width control writes mj-body style.width, which getHtml serializes to
// <mj-body width="…"> ; buildFullMjml only rewrites mj-head, never mj-body attrs, so a user width
// must survive to compiled HTML on BOTH the server and client paths. Closes VALIDATION Wave 0 gap
// #2 (no prior fixture exercised a non-default width). This is the ONE automatable part of the
// width feature — the 320–900 clamp UX stays human-verify.
const widthDoc =
  '<mjml><mj-body width="750px"><mj-section><mj-column>' +
  '<mj-text>width probe</mj-text>' +
  '</mj-column></mj-section></mj-body></mjml>';
const widthResult = compileNewsletter(widthDoc);

assertTrue(widthResult.errors.length === 0, 'width fixture -- compiles with errors: []');
assertTrue(
  /max-width:\s*750px/i.test(widthResult.html),
  'width fixture -- compiled container reflects mj-body width 750px',
);

if (anyFailed) {
  console.error('\nverify-compile: one or more assertions FAILED.');
  process.exit(1);
}

console.log('\nverify-compile: all assertions PASSED.');
process.exit(0);
