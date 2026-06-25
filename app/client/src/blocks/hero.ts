// Re-authored from src/sections/hero.mjml.
// Deliberate divergences from source (D-04 risk probes):
//   1. background-url added to mj-section (NOT in source — risk probe for round-trip survival)
//   2. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source accent (#F45E43)
//   3. line-height normalized to 24px (source has 20px on inner <p> — outlier; head.mjml says 24px)
// Tracking pixel section omitted — css-class not panel-editable; tracking out of scope.
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const heroBlock = {
  id: 'ddroidd-hero',
  label: 'DDROIDD Hero',
  category: 'DDROIDD',
  content: `<mj-section
  background-color="${D.backgroundColor}"
  background-url="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
>
  <mj-column>
    <mj-image
      src="https://a.storyblok.com/f/198446/1020x473/616abdc5e0/img-hero.png"
      fluid-on-mobile="true"
    />
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Insert hero text here.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
