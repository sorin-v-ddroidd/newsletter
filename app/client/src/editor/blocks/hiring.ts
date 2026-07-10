// Re-authored from src/sections/hiring.mjml.
// Deliberate divergences from source:
//   1. mj-text wrapper uses BLOCK_DEFAULTS (#ffffff) instead of source's mj-text `color="#F45E43"`
//      attribute (same pattern as hero.ts/projects.ts).
// Preserved verbatim: the 40%/60% two-column layout, the `mj-spacer height="50px"`, the yellow
// (#FCD400) role <ul> with `padding-left: 20px`, and the mailto/sharepoint links in the
// full-width referral-process paragraph.
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const hiringBlock = {
  id: 'ddroidd-hiring',
  label: 'DDROIDD Hiring',
  category: 'DDROIDD',
  content: `<mj-section background-color="${D.backgroundColor}">
  <mj-column>
    <mj-divider border-width="1px" border-style="dashed" border-color="white" ></mj-divider>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}" padding-bottom="0">
  <mj-column width="40%">
    <mj-spacer height="50px" ></mj-spacer>
    <mj-image
      align="left"
      width="200px"
      fluid-on-mobile="true"
      src="https://a.storyblok.com/f/198446/358x527/f7a8be729c/img-placeholder-01.png"
      alt="Signature"></mj-image>
  </mj-column>
  <mj-column width="60%">
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
    >
      <h2 style="font-family: ${D.fontFamily}; font-size: 20px; line-height: 30px; color: ${D.textColor}; text-transform: uppercase; margin: 0;">
        WE'RE HIRING!
      </h2>
    </mj-text>
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        Looking ahead to new opportunities, we are expanding our talent pipeline <br /><br />
      </p>
      <ul style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: #FCD400; margin-left: 0; padding-left: 20px;">
        <li>Senior QA Automation Engineer </li>
        <li>Senior Java Developer</li>
        <li>Senior Fullstack Developer</li>
        <li>Senior AI Developer</li>
      </ul>
    </mj-text>
  </mj-column>
</mj-section>

<mj-section background-color="${D.backgroundColor}" padding-top="0">
  <mj-column width="100%">
    <mj-text
      color="${D.textColor}"
      font-family="${D.fontFamily}"
      font-size="${D.fontSize}"
      line-height="${D.lineHeight}"
      padding-top="0"
    >
      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        We're always eager to welcome talented new colleagues to our team. If you have any other recommendations, feel free to let us know! <br /><br />
        Please make sure all internal referrals are submitted <strong>via email</strong>, so we can keep the process clear and easy to follow.
        When sending a referral, include the <strong>candidate's name and the role</strong> either in the <strong>email subject line</strong> or <strong>message body</strong>.   <br /><br />
        Please note that our preference is to hire under individual employment contracts.  <br /><br />
        If you know someone who would be perfect for any of these roles or would like further details, then please get in touch with the recruitment team: <a href="mailto:recruitment@ddroidd.com&subject=Seeking Referrals for Exciting Opportunities" style="text-decoration: underline; color: ${D.textColor};">recruitment@ddroidd.com</a>
      </p>

      <p style="font-family: ${D.fontFamily}; font-size: ${D.fontSize}; line-height: ${D.lineHeight}; color: ${D.textColor};">
        For more relevant details, please see the <a href="https://ddroidd.sharepoint.com/Shared%20Documents/Forms/AllItems.aspx?id=%2FShared%20Documents%2FReferral%20bonus%20Scheme%2Epdf&parent=%2FShared%20Documents&isSPOFile=1&OR=Teams%2DHL&CT=1730727643676&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiI0OS8yNDEwMDMyNDkxNiIsIkhhc0ZlZGVyYXRlZFVzZXIiOmZhbHNlfQ%3D%3D" style="color: ${D.textColor}; text-decoration: underline" target="_blank">attached link</a>.<br />
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
