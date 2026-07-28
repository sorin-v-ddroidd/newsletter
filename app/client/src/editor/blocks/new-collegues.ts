// Re-authored from src/sections/new-collegues.mjml.
// Deliberate divergences from source:
//   1. Normalized the source typo `#ffffffff` (8-digit hex) -> `#ffffff` on the caption <p> tags.
//   2. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source's mj-text `color="#F45E43"`
//      attribute (same pattern as hero.ts/projects.ts -- the wrapper attribute is a fallback,
//      the inner <h2>/<p> style carries the real rendered color).
//   3. Intro paragraph flattened to default mj-text padding (25px) instead of the source's
//      column 15px + p 10px stack — same 25px left edge, but renders consistently in the
//      editor canvas (the canvas doesn't apply all three padding layers like the compiler does).
// Structure: ONE intro section (signature image + heading + intro paragraph in the same
// column — source split heading and paragraph into two sections; merged per user request),
// then a 3-column colleague row and a 2-column colleague row (5 new colleagues, matching source).
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const newColleguesBlock = {
  id: 'ddroidd-new-collegues',
  label: 'DDROIDD New Collegues',
  category: 'DDROIDD',
  content: `<mj-section data-gjs-custom-name="New Collegues — heading" background-color="${D.backgroundColor}" padding-top="50px">
  <mj-column>
    <mj-image
      align="left"
      width="200px"
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/406x24/243dcda045/img-signature.png"
      alt="Signature"></mj-image>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-bottom="0"
    >
      <h2 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 30px; color: ${D.textColor}; margin-bottom: 20px; text-transform: uppercase;">
        New Collegues
      </h2>
    </mj-text>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        We would like to say a huge team welcome to our new colleagues who joined us in June:
      </p>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section data-gjs-custom-name="New Collegues — row 1" background-color="${D.backgroundColor}">
  <mj-column>
    <mj-image width="86px" src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd114bce33c3e05089e7b_img-diana-pojar.png" ></mj-image>
    <mj-text
      align="center"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; font-weight: bold; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Diana Pojar
      </p>
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Customer Technical <br /> Support Analyst (L1)
      </p>
    </mj-text>
  </mj-column>
  <mj-column>
    <mj-image width="86px" src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd11427db2a45f9bae90f_img-adrian-suciu.png" ></mj-image>
    <mj-text
      align="center"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; font-weight: bold; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Adi Suciu
      </p>
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Customer Technical <br /> Support Team Lead
      </p>
    </mj-text>
  </mj-column>
  <mj-column>
    <mj-image width="86px" src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd11405e607536c62b45f_img-mihnea-valeanu.png" ></mj-image>
    <mj-text
      align="center"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; font-weight: bold; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Mihnea Valeanu
      </p>
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Customer Technical <br /> Support Analyst (L1)
      </p>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section data-gjs-custom-name="New Collegues — row 2" background-color="${D.backgroundColor}">
  <mj-column>
    <mj-image width="86px" src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd114791f460881598d0b_img-nicoleta-p.png" ></mj-image>
    <mj-text
      align="center"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; font-weight: bold; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Nicoleta Patachi
      </p>
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Back Office Support Analyst
      </p>
    </mj-text>
  </mj-column>
  <mj-column>
    <mj-image width="86px" src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd11439b716990adfb18f_img-anatoli.png" ></mj-image>
    <mj-text
      align="center"
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; font-weight: bold; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Anatolii Guzovatii
      </p>
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; color: ${D.textColor}; margin: 0; padding: 0;">
        Software Developer
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
