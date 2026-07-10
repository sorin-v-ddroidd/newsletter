// mj-accordion: MJML standard body component missing from the plugin's default palette.
// Collapsible panels. mj-accordion-title/-text are type=text → render + inline-editable in the
// canvas (verified headless 260710). Interactive (collapse) via a CSS :checked hack: degrades to
// EXPANDED panels in Outlook/Gmail (verify in real-client gate, do not assume).
//
// Default styling mirrors the MJML documentation example (readable clickable tabs): white title
// panels with dark text, light-grey text panels, a hairline border, and the docs' arrow icons for
// the expand/unwrap affordance. All inlined per element — mj-attributes is unsupported
// (grapesjs.md). This deliberately does NOT use the dark brand background: accordion titles/text
// need clear contrast + a visible clickable affordance (white-on-dark reads as flat text, not a
// tab). It renders as a light island on the newsletter, same precedent as the disclaimer block.
// User can recolour per element via the panel.
//
// Icons come from the MJML docs CDN (stable public assets) so the +/- arrows show out-of-box; set
// on each mj-accordion-element (icon attrs are element-level). No self-closing mj-* tags (DOM
// parser swallows siblings).
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

const ICON_WRAPPED = 'https://static.mailjet.com/mjml-website/documentation/accordion-arrow-down.png';
const ICON_UNWRAPPED = 'https://static.mailjet.com/mjml-website/documentation/accordion-arrow-up.png';
const TITLE_BG = '#ffffff';
const TITLE_COLOR = '#031017';
const TEXT_BG = '#fafafa';
const TEXT_COLOR = '#505050';

const element = (title: string, text: string): string => `
      <mj-accordion-element icon-wrapped-url="${ICON_WRAPPED}" icon-unwrapped-url="${ICON_UNWRAPPED}" icon-height="24px" icon-width="24px">
        <mj-accordion-title font-family="${D.fontFamily}" background-color="${TITLE_BG}" color="${TITLE_COLOR}" font-size="16px" padding="15px">${title}</mj-accordion-title>
        <mj-accordion-text font-family="${D.fontFamily}" background-color="${TEXT_BG}" color="${TEXT_COLOR}" font-size="14px" line-height="20px" padding="15px">${text}</mj-accordion-text>
      </mj-accordion-element>`;

export const mjAccordionBlock = {
  id: 'mj-accordion-block',
  label: 'Accordion',
  category: 'Content',
  content: `<mj-section background-color="#ffffff" padding="20px">
  <mj-column>
    <mj-accordion font-family="${D.fontFamily}" border="1px solid #e0e0e0" icon-position="right">${
      element('First section title', 'Content for the first section. Edit this text.') +
      element('Second section title', 'Content for the second section. Edit this text.')
    }
    </mj-accordion>
  </mj-column>
</mj-section>`,
};
