import type { Editor as GrapesEditor } from 'grapesjs';
import { heroBlock } from './hero';
import { projectsBlock } from './projects';
import { newColleguesBlock } from './new-collegues';
import { initiativesBlock } from './initiatives';
import { hiringBlock } from './hiring';
import { wantToKnowMoreBlock } from './want-to-know-more';
import { disclaimerBlock } from './disclaimer';
import { mjGroupBlock } from './group';
import { mjCarouselBlock } from './carousel';
import { mjAccordionBlock } from './accordion';

// registerBlocks: the 7 DDROIDD branded-block registration guards, extracted from
// onEditor for separation of concerns. The `editor.Blocks.get(id)` guard prevents
// duplicate block registration on React StrictMode double-invocation.
export const registerBlocks = (editor: GrapesEditor): void => {
  if (!editor.Blocks.get('ddroidd-hero')) {
    editor.Blocks.add('ddroidd-hero', heroBlock);
  }

  if (!editor.Blocks.get('ddroidd-projects')) {
    editor.Blocks.add('ddroidd-projects', projectsBlock);
  }

  if (!editor.Blocks.get('ddroidd-new-collegues')) {
    editor.Blocks.add('ddroidd-new-collegues', newColleguesBlock);
  }

  if (!editor.Blocks.get('ddroidd-initiatives')) {
    editor.Blocks.add('ddroidd-initiatives', initiativesBlock);
  }

  if (!editor.Blocks.get('ddroidd-hiring')) {
    editor.Blocks.add('ddroidd-hiring', hiringBlock);
  }

  if (!editor.Blocks.get('ddroidd-want-to-know-more')) {
    editor.Blocks.add('ddroidd-want-to-know-more', wantToKnowMoreBlock);
  }

  if (!editor.Blocks.get('ddroidd-disclaimer')) {
    editor.Blocks.add('ddroidd-disclaimer', disclaimerBlock);
  }

  // Generic MJML standard-body components missing from the plugin's default palette
  // (mj-group/mj-carousel/mj-accordion). The plugin ships their component models but no
  // block defs — see .planning/quick/260710-et7. mj-table is deferred (tr/td stripping).
  if (!editor.Blocks.get('mj-group-block')) {
    editor.Blocks.add('mj-group-block', mjGroupBlock);
  }

  if (!editor.Blocks.get('mj-carousel-block')) {
    editor.Blocks.add('mj-carousel-block', mjCarouselBlock);
  }

  if (!editor.Blocks.get('mj-accordion-block')) {
    editor.Blocks.add('mj-accordion-block', mjAccordionBlock);
  }
};
