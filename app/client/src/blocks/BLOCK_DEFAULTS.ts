// Derived from src/components/head.mjml mj-attributes.
// mj-attributes is NOT supported in grapesjs-mjml (issue #35) -- these values MUST be
// inlined per element in every block content string. This is the single source of truth
// for DDROIDD brand defaults across all block definitions.
export const BLOCK_DEFAULTS = {
  backgroundColor: '#0B1624',
  fontFamily: 'Calibri, Roboto, Lato, Avenir Next, Verdana, Helvetica, Arial, sans-serif',
  fontSize: '16px',
  // head.mjml + projects.mjml = 24px; hero.mjml inner <p> says 20px (outlier — normalize to 24)
  lineHeight: '24px',
  textColor: '#ffffff',
  accentColor: '#F45E43',
} as const;
