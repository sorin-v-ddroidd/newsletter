// Re-authored from src/sections/hero.mjml.
// Deliberate divergences from source:
//   1. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source accent (#F45E43)
//   2. line-height normalized to 24px (source has 20px on inner <p> — outlier; head.mjml says 24px)
// Tracking pixel omitted — css-class not panel-editable; tracking out of scope.
// The dashed-divider section from the source IS included (visible design element in dist).
// Images stay remote URLs — never inline as data URIs.
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'DDROIDD Hero',
  category: 'DDROIDD',
  content: `<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-image
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
      fluid-on-mobile="true"></mj-image>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        As we move into summer, June has been another month of growth, new connections, and exciting developments across ddroidd. We've welcomed new colleagues, continued expanding key projects, and represented ddroidd at one of the region's most important technology events.
        <br /><br />
        The highlights, achievements, and updates that shaped our June are gathered in this edition of the ddroidd Digest. Enjoy the read!
      </p>
    </mj-text>
  </mj-column>
</mj-section>
<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="#ffffff"></mj-divider>
  </mj-column>
</mj-section>`,
};
