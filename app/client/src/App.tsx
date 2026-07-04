import grapesjs, { type Editor as GrapesEditor } from 'grapesjs';
import grapesjsMjml from 'grapesjs-mjml';
import { Editor } from '@grapesjs/react';
import 'grapesjs/dist/css/grapes.min.css';
import { heroBlock } from './blocks/hero';
import { projectsBlock } from './blocks/projects';

// Augment window with spike-only debug helpers exposed for manual console verification.
declare global {
  interface Window {
    __ddroiddEditor?: GrapesEditor;
    __ddroiddAssertRoundTrip?: () => void;
  }
}

const STORAGE_KEY = 'ddroidd_newsletter_draft';

// Save the current canvas state to localStorage.
const save = (editor: GrapesEditor): void => {
  const data = editor.getProjectData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log('[ddroidd] Saved project data to localStorage');
};

// Load the canvas state from localStorage.
const load = (editor: GrapesEditor): void => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    editor.loadProjectData(JSON.parse(raw) as object);
    console.log('[ddroidd] Loaded project data from localStorage');
  } else {
    console.log('[ddroidd] No saved project data found');
  }
};

// compileDraft: POST editor.getHtml() to /api/compile; server writes dist/spike-output.html.
// Open question #2 (getHtml shape) is documented here: the function logs the first 200 chars
// of the output before sending so the developer can observe whether it starts with <mjml or is
// a bare fragment. The server conditional-wrap (/<mjml/i test) handles either case transparently.
const compileDraft = async (editor: GrapesEditor): Promise<void> => {
  const mjml = editor.getHtml();
  console.log('[ddroidd] editor.getHtml() first 200 chars:', mjml.slice(0, 200));
  console.log('[ddroidd] getHtml() starts with <mjml:', /^<mjml/i.test(mjml.trim()));

  const response = await fetch('/api/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mjml }),
  });

  if (!response.ok) {
    console.error('[ddroidd] /api/compile returned', response.status, await response.text());
    return;
  }

  const { html, errors } = (await response.json()) as { html: string; errors: unknown[] };

  if (errors && errors.length > 0) {
    console.warn('[ddroidd] MJML compile warnings:', errors);
  }

  console.log('[ddroidd] Compile succeeded. HTML length:', html.length);
  console.log('[ddroidd] HTML starts with <!doctype:', /^<!doctype html/i.test(html.trim()));
  console.log('[ddroidd] dist/spike-output.html written by server (see server console for path)');
};

// Assert that a save→load cycle produces byte-identical JSON.
// Criterion 3 procedure: drop the hero block, make an inline text edit, then run:
//   window.__ddroiddAssertRoundTrip()
// Expected console output: [ddroidd] Round-trip identical: true
const assertRoundTrip = (editor: GrapesEditor): void => {
  const before = JSON.stringify(editor.getProjectData());
  save(editor);
  load(editor);
  const after = JSON.stringify(editor.getProjectData());
  const identical = before === after;
  console.assert(identical, 'Round-trip mismatch!', { before, after });
  console.log(`[ddroidd] Round-trip identical: ${String(identical)}`);
};

// onEditor is called by @grapesjs/react after the editor is initialised.
// The `editor.Blocks.get(id)` guard prevents duplicate block registration
// on React StrictMode double-invocation.
const onEditor = (editor: GrapesEditor): void => {
  // Expose editor on window for manual console verification during the spike.
  window.__ddroiddEditor = editor;
  window.__ddroiddAssertRoundTrip = () => { assertRoundTrip(editor); };

  // StrictMode double-registration guard
  if (!editor.Blocks.get('ddroidd-hero')) {
    editor.Blocks.add('ddroidd-hero', heroBlock);
  }

  if (!editor.Blocks.get('ddroidd-projects')) {
    editor.Blocks.add('ddroidd-projects', projectsBlock);
  }
};

export default function App() {
  const handleSave = () => {
    if (window.__ddroiddEditor) {
      save(window.__ddroiddEditor);
    }
  };

  const handleLoad = () => {
    if (window.__ddroiddEditor) {
      load(window.__ddroiddEditor);
    }
  };

  const handleAssert = () => {
    if (window.__ddroiddEditor) {
      assertRoundTrip(window.__ddroiddEditor);
    }
  };

  const handleCompile = () => {
    if (window.__ddroiddEditor) {
      compileDraft(window.__ddroiddEditor).catch((err: unknown) => {
        console.error('[ddroidd] compileDraft error:', err);
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '8px', background: '#1a1a2e', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#ffffff', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '32px' }}>
          DDROIDD Newsletter Builder
        </span>
        <button onClick={handleSave} style={{ padding: '6px 14px', cursor: 'pointer' }}>
          Save
        </button>
        <button onClick={handleLoad} style={{ padding: '6px 14px', cursor: 'pointer' }}>
          Load
        </button>
        <button onClick={handleAssert} style={{ padding: '6px 14px', cursor: 'pointer' }}>
          Assert Round-Trip
        </button>
        <button onClick={handleCompile} style={{ padding: '6px 14px', cursor: 'pointer', background: '#F45E43', color: '#ffffff', border: 'none' }}>
          Compile
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Editor intentionally has no child components: an empty Editor element puts
            @grapesjs/react into default-UI mode, which renders the stock GrapesJS chrome
            (blocks panel, style manager, layers, device bar). The provider/render-prop
            custom-UI pattern (using sub-components from @grapesjs/react) is deferred to
            a later phase — see .claude/rules/grapesjs.md. */}
        <Editor
          grapesjs={grapesjs}
          grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
          onEditor={onEditor}
          options={{
            height: '100%',
            // Phase 1: no auto-save; explicit save/load via buttons + localStorage.
            storageManager: false,
            plugins: [grapesjsMjml],
            // CRITICAL: hardcoded string key 'grapesjs-mjml', NOT computed [grapesjsMjml].
            // Computed key causes issue #223 — blocks appear in panel but cannot be dropped.
            pluginsOpts: {
              'grapesjs-mjml': {
                // Keep the generic blocks shipped by the plugin (text, image, button, columns, divider/spacer)
                resetBlocks: false,
                resetDevices: false,
              },
            },
          }}
        />
      </div>
    </div>
  );
}
