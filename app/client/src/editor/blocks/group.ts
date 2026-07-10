// mj-group: MJML standard body component missing from the plugin's default palette.
// Wraps columns that stay side-by-side on mobile (mj-group does not stack). Email-safe;
// no interactive children. Brand defaults inlined per element (mj-attributes unsupported —
// grapesjs.md). No self-closing mj-* tags (DOM parser swallows siblings).
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const mjGroupBlock = {
  id: 'mj-group-block',
  label: 'Group (side-by-side)',
  category: 'Layout',
  content: `<mj-section background-color="${D.backgroundColor}">
  <mj-group>
    <mj-column>
      <mj-text font-family="${D.fontFamily}" color="${D.textColor}" font-size="${D.fontSize}" line-height="${D.lineHeight}">
        <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">Left column — stays beside the right on mobile.</p>
      </mj-text>
    </mj-column>
    <mj-column>
      <mj-text font-family="${D.fontFamily}" color="${D.textColor}" font-size="${D.fontSize}" line-height="${D.lineHeight}">
        <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">Right column — edit this text.</p>
      </mj-text>
    </mj-column>
  </mj-group>
</mj-section>`,
};
