import grapesjsMjml from 'grapesjs-mjml';

// GrapesJS options for the newsletter editor.
// IMPORTANT: pluginsOpts key MUST be the hardcoded string 'grapesjs-mjml'.
// Using the computed key [grapesjsMjml] causes issue #223 where blocks appear
// in the panel but cannot be dropped onto the canvas.
export const editorOptions = {
  height: '100vh',
  // Phase 1: no auto-save; we use explicit localStorage save/load in App.tsx
  storageManager: false,
  plugins: [grapesjsMjml],
  pluginsOpts: {
    'grapesjs-mjml': {
      // Keep the generic blocks shipped by the plugin (text, image, button, columns, divider/spacer)
      resetBlocks: false,
      resetDevices: false,
    },
  },
} as const;
