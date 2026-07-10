// Re-authored from src/sections/disclaimer.mjml.
// DECISION (faithful re-author, documented per plan): the source has NO section
// background-color and black text (#000000) -- in the full email this renders black-on-white
// because mj-body defaults to white. This block sets an explicit background-color="#ffffff" on
// the section (satisfies the every-section-explicit-bg rule and avoids the white-default-text
// trap) and KEEPS the black italic centered text as-is. This is NOT re-branded dark-with-light-text
// -- that would diverge from source intent (a legal disclaimer meant to read as plain print text).
// MUST NOT contain mj-attributes, mj-include, or mj-style.
import { BLOCK_DEFAULTS as D } from './BLOCK_DEFAULTS';

export const disclaimerBlock = {
  id: 'ddroidd-disclaimer',
  label: 'DDROIDD Disclaimer',
  category: 'DDROIDD',
  content: `<mj-section background-color="#ffffff">
  <mj-column>
    <mj-text
      align="center"
      font-family="${D.fontFamily}"
      color="#000000"
    >
      <p style="font-family: ${D.fontFamily}; font-size: 12px; line-height: 18px; font-style: italic; color: #000000; text-align: center;">
        The content of this email is confidential and intended only for the recipient specified in this message. It is strictly forbidden to share any part of this message with any third party, without written consent of the sender. If you received this message by mistake, please reply to this message and follow with its permanent deletion, so that we can ensure such a mistake does not occur in the future.
      </p>
    </mj-text>
  </mj-column>
</mj-section>`,
};
