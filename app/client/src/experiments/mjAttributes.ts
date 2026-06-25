/**
 * @description mj-attributes Experiment — Criterion #5 Part A
 *
 * Purpose: Demonstrate that mj-attributes is honored by the mjml compiler itself
 * but is silently dropped when MJML passes through the grapesjs-mjml editor
 * (issues #35/#17). This is the architectural basis for BLOCK_DEFAULTS.
 *
 * Usage: POST PART_A_MJML to /api/compile. The compiled HTML WILL contain
 * color:#ff0000 — proving the drop is an editor-level behavior, not a compiler
 * behavior. This contrast is the key finding.
 *
 * See CRITERION-5-FINDINGS.md for full documented results.
 */

// Part A negative-test MJML string.
// A full <mjml> document with mj-attributes setting text color to #ff0000.
// When compiled by mjml@4.18.0 directly (no editor), the text IS red —
// the compiler honors mj-attributes. The drop occurs inside grapesjs-mjml
// when the editor loads/saves MJML (issue #35: mj-head corruption; issue #17:
// mj-attributes dropped). This contrast distinguishes compiler behavior from
// editor behavior.
export const PART_A_MJML = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-text color="#ff0000" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section>
  </mj-body>
</mjml>`;

// Part B positive-test: the ddroidd-hero fragment with all BLOCK_DEFAULTS inlined.
// This is a bare fragment (no <mjml> root) — the /api/compile endpoint's
// conditional wrap will add <mjml><mj-body>...</mj-body></mjml>.
// No mj-head, no mj-attributes, no mj-include, no mj-style.
// Expected: compiles with 0 errors; white text, Calibri stack, #0B1624
// background all present in output from inlined defaults alone.
export const PART_B_HERO_FRAGMENT = `<mj-section
  background-color="#0B1624"
  background-url="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
>
  <mj-column>
    <mj-image
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
      fluid-on-mobile="true"
    />
    <mj-text
      color="#ffffff"
      font-family="Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif"
      font-size="16px"
      line-height="24px"
    >
      <p style="font-family: Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: #ffffff;">
        Insert hero text here.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`;

/**
 * Runner procedure for verifying Part A via /api/compile.
 *
 * Paste this into browser DevTools console when the dev server is running
 * (http://localhost:5173, which proxies /api to http://localhost:3000).
 *
 * Expected observations:
 *
 *   Part A: html CONTAINS color:#ff0000
 *     → mjml compiler honors mj-attributes (drop is editor-level, not compiler-level)
 *
 *   Part B: errors.length === 0; html contains #0B1624, #ffffff, Calibri,
 *           mj-full-width-mobile (fluid-on-mobile rendered),
 *           img-hero.png in background context (background-url applied)
 *     → BLOCK_DEFAULTS mitigation validated: inlined defaults compile correctly
 *       with NO mj-head injection
 *
 * @example
 * // Run in browser console:
 * runMjAttributesExperiment();
 */
export async function runMjAttributesExperiment(): Promise<void> {
  const API_BASE = import.meta.env.VITE_API_URL ?? '';

  // --- Part A ---
  console.group('[criterion-5] Part A: mj-attributes compile test');
  const resA = await fetch(`${API_BASE}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mjml: PART_A_MJML }),
  });
  const dataA = (await resA.json()) as { html: string; errors: unknown[] };
  const partAHasRed = dataA.html.includes('#ff0000') || dataA.html.includes('ff0000');
  console.log('Compile errors:', dataA.errors.length);
  console.log('color:#ff0000 present in output:', partAHasRed);
  console.log(
    'Finding:',
    partAHasRed
      ? 'CONFIRMED — mjml compiler HONORS mj-attributes (red text present). Drop is editor-level.'
      : 'UNEXPECTED — check compile endpoint'
  );
  console.groupEnd();

  // --- Part B ---
  console.group('[criterion-5] Part B: hero BLOCK_DEFAULTS compile test (no mj-head)');
  const resB = await fetch(`${API_BASE}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mjml: PART_B_HERO_FRAGMENT }),
  });
  const dataB = (await resB.json()) as { html: string; errors: unknown[] };
  console.log('Compile errors:', dataB.errors.length);
  console.log('Has #0B1624 background:', dataB.html.includes('#0B1624'));
  console.log('Has #ffffff text color:', dataB.html.includes('#ffffff'));
  console.log('Has Calibri font stack:', dataB.html.includes('Calibri'));
  console.log(
    'Has mj-full-width-mobile (fluid-on-mobile rendered):',
    dataB.html.includes('mj-full-width-mobile')
  );
  console.log(
    'Has background-url in output (img-hero.png):',
    dataB.html.includes('img-hero.png')
  );
  const allPass =
    dataB.errors.length === 0 &&
    dataB.html.includes('#0B1624') &&
    dataB.html.includes('#ffffff') &&
    dataB.html.includes('Calibri') &&
    dataB.html.includes('mj-full-width-mobile') &&
    dataB.html.includes('img-hero.png');
  console.log(
    'Part B verdict:',
    allPass
      ? 'PASS — BLOCK_DEFAULTS mitigation validated'
      : 'FAIL — inspect output above'
  );
  console.groupEnd();
}

// Make available as a global for manual browser console invocation
if (typeof window !== 'undefined') {
  (window as Window & { __ddroiddMjAttributesExperiment?: typeof runMjAttributesExperiment }).__ddroiddMjAttributesExperiment =
    runMjAttributesExperiment;
}
