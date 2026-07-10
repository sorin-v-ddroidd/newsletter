// TEMPLATE_MJML: composes all 7 DDROIDD branded blocks into one full <mjml><mj-body> document,
// in the same section order as src/pages/index.mjml (hero, new-collegues, projects, initiatives,
// hiring, want-to-know-more, disclaimer). Used by the "New from Template" toolbar button to seed
// a complete newsletter onto the canvas in one click -- this is a separate, explicit, button-click
// path and does NOT affect the empty-canvas default scaffold seed in App.tsx.
// Alias-free (all relative imports) and grapesjs/react-free so app/server/scripts/verify-blocks.ts
// can import it headlessly.
import { heroBlock } from './hero';
import { newColleguesBlock } from './new-collegues';
import { projectsBlock } from './projects';
import { initiativesBlock } from './initiatives';
import { hiringBlock } from './hiring';
import { wantToKnowMoreBlock } from './want-to-know-more';
import { disclaimerBlock } from './disclaimer';

export const TEMPLATE_MJML = `<mjml>\n  <mj-body>\n${[
  heroBlock,
  newColleguesBlock,
  projectsBlock,
  initiativesBlock,
  hiringBlock,
  wantToKnowMoreBlock,
  disclaimerBlock,
].map((b) => b.content).join('\n')}\n  </mj-body>\n</mjml>`;
