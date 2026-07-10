// Minimal polyfill so mjml-browser's UMD wrapper (which attaches its export to the global
// `window` object) can load under plain Node/tsx. mjml-browser does no real DOM manipulation --
// it is pure string/HTML-tree logic bundled as a browser UMD module -- so aliasing `window` to
// `globalThis` is sufficient; no jsdom is required. Must be imported BEFORE `mjml-browser` (see
// verify-parity.ts) -- ES module imports evaluate in declaration order, so this has to be its
// own module and the first import.
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;
