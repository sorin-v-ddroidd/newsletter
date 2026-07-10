// mj-carousel: MJML standard body component missing from the plugin's default palette.
// Image gallery. Children are registered mj-carousel-image types (parse cleanly, unlike the
// mj-table tr/td stripping — spike 260710). Interactive (thumbnails/arrows) via a CSS :checked
// hack: degrades to the FIRST image only in Outlook/Gmail (verify in real-client gate, do not
// assume).
//
// Behaviour mirrors the MJML documentation default (no overriding attributes → inherits all
// MJML carousel defaults incl align=center, border-radius=6px, thumbnails=hidden), so it works
// the same out-of-box as https://documentation.mjml.io/#mj-carousel. Ships with 3 DISTINCT
// labelled placeholder images (brand colours, .png so email clients accept them) — distinct so
// the cycling is visible, labelled "Slide N — replace me" so a non-dev knows to swap each src.
// No self-closing mj-* tags (DOM parser swallows siblings).
// picsum.photos = reliable, distinct, real raster images (loads in-canvas and in webmail; user
// swaps each via the src trait). Distinct seeds so the 3 slides differ and the cycling is visible.
const PLACEHOLDERS = [
  'https://picsum.photos/seed/ddroidd-slide-1/600/300',
  'https://picsum.photos/seed/ddroidd-slide-2/600/300',
  'https://picsum.photos/seed/ddroidd-slide-3/600/300',
];

export const mjCarouselBlock = {
  id: 'mj-carousel-block',
  label: 'Carousel',
  category: 'Content',
  content: `<mj-section background-color="#0B1624">
  <mj-column>
    <mj-carousel>
      <mj-carousel-image src="${PLACEHOLDERS[0]}"></mj-carousel-image>
      <mj-carousel-image src="${PLACEHOLDERS[1]}"></mj-carousel-image>
      <mj-carousel-image src="${PLACEHOLDERS[2]}"></mj-carousel-image>
    </mj-carousel>
  </mj-column>
</mj-section>`,
};
