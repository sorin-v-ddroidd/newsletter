// Automated server-vs-client HTML parity proof (STATIC-DEPLOY / EXPORT-04). Proves that the
// server's mjml@4.18.0 compile path and the browser's mjml-browser@4.18.0 compile path
// (app/client/src/lib/compile.ts) produce IDENTICAL HTML for the same input -- the load-
// bearing guarantee that lets the client compile in-browser with no server at deploy time
// while still matching what the (still-kept) server compile path would have produced.
//
// Mirrors verify-compile.ts's PASS/FAIL style: prints PASS/FAIL lines, process.exit(1) on any
// failure. A structural diff here is a BLOCKER for the static-deploy plan -- do not weaken this
// gate to pass a real difference.
// mjml-browser ships as a UMD bundle that references the global `window` object as its export
// target (`(window, function(){...}))`). It is otherwise pure string/DOM-parsing logic with no
// real browser API dependency, but the UMD wrapper itself throws under plain Node/tsx without
// a `window` global to attach to. This script is server-only tooling (excluded from the
// server's tsc `include`, same as verify-blocks.ts). Static `import` declarations are hoisted
// and evaluated before any of this module's own top-level statements, in declaration order --
// so the polyfill MUST be its own module, imported first, for it to run before mjml-browser's
// UMD wrapper evaluates.
import './window-polyfill';
import mjml2html from 'mjml';
import mjmlBrowser from 'mjml-browser';
import { buildFullMjml } from '../../shared/mjml-head';
// NOTE the `editor/blocks/` segment -- the blocks were moved there (260705-h8h). Do NOT copy
// verify-blocks.ts's stale `../../client/src/blocks/` paths; that script is already known-red
// and out of scope for this plan.
import { TEMPLATE_MJML } from '../../client/src/editor/blocks/template';

let anyFailed = false;

const assertTrue = (condition: boolean, label: string): void => {
  if (condition) {
    console.log(`PASS -- ${label}`);
    return;
  }
  anyFailed = true;
  console.log(`FAIL -- ${label}`);
};

// Collapse whitespace runs and trim so a whitespace-only difference (e.g. differing
// pretty-printing between the two mjml builds) does not fail the gate -- only a STRUCTURAL
// diff should fail.
const normalize = (html: string): string => html.replace(/\s+/g, ' ').trim();

// Build the input ONCE and feed the identical string to both engines -- the transform must
// not be applied twice or applied differently per engine, only the compiler should differ.
const full = buildFullMjml(TEMPLATE_MJML);

const serverResult = mjml2html(full, {
  validationLevel: 'soft',
  minify: false,
}) as unknown as { html: string; errors: unknown[] };

const clientResult = mjmlBrowser(full, {
  validationLevel: 'soft',
  minify: false,
});

const serverHtml = normalize(serverResult.html);
const clientHtml = normalize(clientResult.html);

const identical = serverHtml === clientHtml;

if (!identical) {
  // Find the first differing index and print a short window of context from each side so a
  // human can see exactly where the two compilers diverged.
  let firstDiff = 0;
  const maxLen = Math.max(serverHtml.length, clientHtml.length);
  while (firstDiff < maxLen && serverHtml[firstDiff] === clientHtml[firstDiff]) {
    firstDiff += 1;
  }
  const windowStart = Math.max(0, firstDiff - 40);
  const windowEnd = firstDiff + 80;
  console.log(`\nFirst differing index: ${firstDiff}`);
  console.log(`server : ...${serverHtml.slice(windowStart, windowEnd)}...`);
  console.log(`client : ...${clientHtml.slice(windowStart, windowEnd)}...`);
}

assertTrue(identical, 'server mjml === client mjml-browser HTML (whitespace-normalized) for TEMPLATE_MJML');

if (anyFailed) {
  console.error('\nverify-parity: server/client HTML diverge -- BLOCKER.');
  process.exit(1);
}

console.log('\nverify-parity: all assertions PASSED.');
process.exit(0);
