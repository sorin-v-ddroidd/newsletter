import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

// DDROIDD Projects branded block.
// Re-authors src/sections/projects.mjml as a bare MJML fragment for the GrapesJS canvas.
// Rules followed:
//   - No mj-attributes / mj-include / mj-style (grapesjs-mjml issue #35)
//   - All BLOCK_DEFAULTS brand constants inlined per element (mj-attributes not supported)
//   - fluid-on-mobile="true" on signature image (D-04 risk probe)
//   - mj-text wrapper uses BLOCK_DEFAULTS values (not source's #F45E43 accent)
//   - Bare fragment (no <mjml> root) — conditional wrap happens server-side at compile time
export const projectsBlock = {
  id: 'ddroidd-projects',
  label: 'DDROIDD Projects',
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
        Projects
      </h2>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}" padding-top="0" padding-bottom="0">
  <mj-column width="100%">
    <mj-image
      width="200px"
      align="left"
      src="https://cdn.prod.website-files.com/671741f56fde401410e14e91/6a3cd34dd66e91c8f6ae9a03_elsevier-logo-orange.png"
      alt="Project logo"></mj-image>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Project description. Edit inline to describe your project update here.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
