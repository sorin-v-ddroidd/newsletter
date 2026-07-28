// Headless mjml@4.18.0 compile gate for every DDROIDD branded block + the full template.
// Runs in server context (tsx scripts/verify-blocks.ts from app/server) so it resolves
// mjml@4.18.0 from app/server/node_modules -- the SAME pinned version and compile options
// used in production (see app/server/src/routes/compile.ts).
//
// Imports block content strings via relative paths from the client editor/blocks directory
// (the 260705-h8h refactor moved blocks under editor/blocks/). This works headlessly because
// the block modules are alias-free (relative imports only) and browser-free (no react/grapesjs
// imports) -- see .claude/skills/new-branded-block/SKILL.md and .claude/rules/grapesjs.md.
import mjml2html from 'mjml';
import { heroBlock } from '../../client/src/editor/blocks/hero';
import { newColleguesBlock } from '../../client/src/editor/blocks/new-collegues';
import { projectsBlock } from '../../client/src/editor/blocks/projects';
import { initiativesBlock } from '../../client/src/editor/blocks/initiatives';
import { hiringBlock } from '../../client/src/editor/blocks/hiring';
import { wantToKnowMoreBlock } from '../../client/src/editor/blocks/want-to-know-more';
import { disclaimerBlock } from '../../client/src/editor/blocks/disclaimer';
import { TEMPLATE_MJML } from '../../client/src/editor/blocks/template';

type Block = { id: string; label: string; content: string };

// Strip GrapesJS instance-locking attributes (BLOCK-03) before the raw compile. In production
// the GrapesJS 0.22.16 parser moves any `data-gjs-*` attribute into the component MODEL at
// drop/parse time, so these NEVER reach mjml2html() (RESEARCH Pitfall 2 / Open Question 1).
// This gate compiles the raw block content strings directly, bypassing GrapesJS, so it would
// otherwise see them as illegal attrs and FAIL on an input that cannot occur in production.
// Matches both single- and double-quoted values (droppable uses a single-quoted JSON array).
const stripGjsAttrs = (mjmlSource: string): string =>
  mjmlSource.replace(/\s*data-gjs-[\w-]+=(?:"[^"]*"|'[^']*')/g, '');

// Mirrors the production conditional wrap in compile.ts exactly: a bare fragment (no <mjml>
// root) is wrapped into a minimal valid document; a string that already starts with <mjml is
// used as-is.
const wrapIfNeeded = (mjmlSource: string): string => {
  const trimmed = mjmlSource.trim();
  return /<mjml/i.test(trimmed)
    ? trimmed
    : `<mjml>\n  <mj-body>\n    ${trimmed}\n  </mj-body>\n</mjml>`;
};

const blocks: Block[] = [
  heroBlock,
  newColleguesBlock,
  projectsBlock,
  initiativesBlock,
  hiringBlock,
  wantToKnowMoreBlock,
  disclaimerBlock,
];

type Target = { name: string; mjmlSource: string };

const targets: Target[] = [
  ...blocks.map((b) => ({ name: b.label, mjmlSource: wrapIfNeeded(stripGjsAttrs(b.content)) })),
  { name: 'Full Template (TEMPLATE_MJML)', mjmlSource: stripGjsAttrs(TEMPLATE_MJML) },
];

let anyFailed = false;

for (const target of targets) {
  // validationLevel: 'soft' + minify: false -- identical options to the production compile
  // route (app/server/src/routes/compile.ts). With 'soft', mjml2html never throws; the gate
  // is the errors/html check below, not a try/catch.
  const result = mjml2html(target.mjmlSource, {
    validationLevel: 'soft',
    minify: false,
  });

  const hasNoErrors = result.errors.length === 0;
  // Non-empty-HTML check specifically guards against issue #194's silent-empty-document failure.
  const hasHtml = typeof result.html === 'string' && result.html.trim().length > 0;
  const pass = hasNoErrors && hasHtml;

  if (!pass) {
    anyFailed = true;
  }

  console.log(`${pass ? 'PASS' : 'FAIL'} -- ${target.name} (errors: ${result.errors.length})`);

  // Record every error entry as a warning line, even on PASS (errors.length === 0 means this
  // loop simply doesn't run for a clean PASS).
  for (const err of result.errors) {
    console.log(`  warning recorded: ${JSON.stringify(err)}`);
  }
}

if (anyFailed) {
  console.error('\nverify-blocks: one or more targets FAILED the compile gate.');
  process.exit(1);
}

console.log(`\nverify-blocks: all ${targets.length} targets PASSED.`);
process.exit(0);
