// Re-authored from src/sections/initiatives.mjml.
// Deliberate divergences from source:
//   1. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source's mj-text `color="#F45E43"`
//      attribute (same pattern as hero.ts/projects.ts).
// Preserved verbatim: the two sub-story links (Internal Newsletter Feedback survey link,
// underline styling) and the Codecamp image.
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const initiativesBlock = {
  id: 'ddroidd-initiatives',
  label: 'DDROIDD Initiatives',
  category: 'DDROIDD',
  content: `<mj-section data-gjs-custom-name="Initiatives — divider" background-color="${D.backgroundColor}">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="white" ></mj-divider>
  </mj-column>
</mj-section>

<mj-section data-gjs-custom-name="Initiatives — heading" background-color="${D.backgroundColor}">
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
        MEET-UPS AND INITIATIVES
      </h2>
      <br />
    </mj-text>
  </mj-column>
</mj-section>

<mj-section data-gjs-custom-name="Initiatives — stories" background-color="${D.backgroundColor}" padding-top="0" padding-bottom="0">
  <mj-column>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <h3 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 24px; color: ${D.textColor}; margin: 0;">
        Internal Newsletter Feedback
      </h3>
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        We're always looking for ways to improve how we share news, updates, and opportunities across the company. Take a moment to tell us what's working, what isn't, and what you'd like to see more of.
        <br /><br />
        The survey is anonymous and should take less than 2 minutes.
        <br /><br />
        Share your feedback, <a href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=7rx3YAQRGUG8mFOYcMZu72KI3py4jFtKpFtY952CYzdUMTdCVk8zWDEyMExTWTRDREdHRlBJM0FOUC4u" target="_blank" style="text-decoration: underline; color: ${D.textColor};">here</a>.
      </p>
    </mj-text>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <h3 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 24px; color: ${D.textColor}; margin: 0;">
        Techsylvania 2026
      </h3>
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Cosmin Cristea and Andrei Marginean recently attended Techsylvania 2026, one of the leading technology and innovation events in the region.
        <br /><br />
        The event brought together founders, technology leaders, innovators, and industry experts to explore the trends shaping the future of business and technology. It was a valuable opportunity to exchange ideas, gain new insights into AI and digital transformation, and strengthen connections within the tech community.
        <br /><br />
        We're excited to bring these learnings back to ddroidd and continue driving innovation for our clients and partners.
      </p>
    </mj-text>
    <mj-image
      src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a16895a7d388bd010fff015_Codecamp.png"></mj-image>
  </mj-column>
</mj-section>`,
};
