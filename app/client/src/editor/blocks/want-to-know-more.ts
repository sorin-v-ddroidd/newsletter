// Re-authored from src/sections/want-to-know-more.mjml.
// Deliberate divergences from source:
//   1. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source's mj-text `color="#F45E43"`
//      attribute (same pattern as hero.ts/projects.ts).
// Preserved verbatim: the `newsletter@ddroidd.com` mailto link in the closing paragraph.
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const wantToKnowMoreBlock = {
  id: 'ddroidd-want-to-know-more',
  label: 'DDROIDD Want To Know More',
  category: 'DDROIDD',
  content: `<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="white" ></mj-divider>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-image
      align="left"
      width="200px"
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/406x24/243dcda045/img-signature.png"
      alt="Signature"></mj-image>

    <mj-text
      align="left"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-bottom="0"
    >
      <h2 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 30px; color: ${D.textColor}; text-transform: uppercase; margin: 0;">
        WANT TO KNOW MORE OR HAVE A STORY TO SHARE?
      </h2>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}" padding-top="0" padding-bottom="0">
  <mj-column>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        This monthly newsletter is designed to keep you informed on what is happening within ddroidd. It will evolve as we go along, but we need your feedback to make this happen. Is there something else you would like to see within these updates, or do you have a successful story to share? Then please do let us know, email <a style="color: ${D.textColor}" href="mailto:newsletter@ddroidd.com">newsletter@ddroidd.com</a> with your stories and feedback. Until next month...
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
