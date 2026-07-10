import type { Editor as GrapesEditor, Component } from 'grapesjs';
import { compileNewsletter } from '@/lib/compile';
import type { CompileResult } from '@/lib/compile';
import { TEMPLATE_MJML } from './blocks/template';

// Action "service" layer — these functions take the editor as an argument and never
// touch React. That is the separation-of-concerns boundary: UI (TopBar) calls these,
// these never import components/hooks.

const STORAGE_KEY = 'ddroidd_newsletter_draft';

// Guard flag: true only while a loadProjectData() call is in flight. Listeners that mutate
// component styles/attrs (e.g. the padding-shorthand expansion in editorConfig.ts) must bail
// while this is true — mutating during a load would inject derived state into a document that
// never had it, breaking the Phase-1 byte-identical round-trip gate (assertRoundTrip below).
let loadingProject = false;
export const isLoadingProject = (): boolean => loadingProject;

// Save the current canvas state to localStorage.
export const save = (editor: GrapesEditor): void => {
  const data = editor.getProjectData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log('[ddroidd] Saved project data to localStorage');
};

// Load the canvas state from localStorage.
export const load = (editor: GrapesEditor): void => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    loadingProject = true;
    try {
      editor.loadProjectData(JSON.parse(raw) as object);
    } finally {
      loadingProject = false;
    }
    console.log('[ddroidd] Loaded project data from localStorage');
  } else {
    console.log('[ddroidd] No saved project data found');
  }
};

// Recursively collect every component in the tree (rooted at `component`) whose Layers
// visibility is false. Depth-first; order does not matter for removal.
const collectHidden = (editor: GrapesEditor, component: Component, hidden: Component[]): void => {
  if (!editor.Layers.isVisible(component)) {
    hidden.push(component);
  }
  component.components().forEach((child: Component) => { collectHidden(editor, child, hidden); });
};

// getExportMjml: the ONLY MJML source that should ever be sent to the compiler/downloaded.
// Hidden layers (eye off, editor.Layers.setVisible(cmp, false)) are shown in the canvas via a
// display:none base-media style, but display:none is NOT MJML-native and Outlook (Word engine)
// does not reliably honor it -- a "hidden" section could still render in a recipient's inbox
// (see mjml-email-safety.md). So at export time hidden components are physically REMOVED from
// the component tree before getHtml(), then the pre-removal project data is restored in a
// finally block so the user's document (including hidden sections + their hidden state) is
// never left mutated -- even if getHtml() throws. Do NOT "simplify" this back to shipping
// display:none; that breaks canvas === export in Outlook.
export const getExportMjml = (editor: GrapesEditor): string => {
  const wrapper = editor.getWrapper();
  const hidden: Component[] = [];
  if (wrapper) {
    collectHidden(editor, wrapper, hidden);
  }

  if (hidden.length === 0) {
    return editor.getHtml();
  }

  const snapshot = editor.getProjectData();
  try {
    hidden.forEach((c) => { c.remove(); });
    return editor.getHtml();
  } finally {
    loadingProject = true;
    try {
      editor.loadProjectData(snapshot);
    } finally {
      loadingProject = false;
    }
  }
};

// compileDraft: compiles the current canvas entirely in-browser via mjml-browser (no server
// round-trip -- STATIC-DEPLOY: the client has zero runtime dependency on the Express server).
// Synchronous by contract (see lib/compile.ts) -- TopBar's "Preview & Compile" handler relies
// on this to stay inside the click's user gesture so window.open() isn't popup-blocked.
export const compileDraft = (editor: GrapesEditor): CompileResult => {
  const mjml = getExportMjml(editor);
  return compileNewsletter(mjml);
};

// Pure download helper: creates a Blob + object URL, clicks a temporary anchor, then revokes
// the URL. No React — safe to call from anywhere in the action layer or the UI.
export const triggerDownload = (html: string, filename: string): void => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

// Opens compiled HTML in a new tab for preview. Unlike triggerDownload, the object URL is NOT
// revoked immediately -- the new tab needs it alive to load the document. Revoked after 60s,
// long enough for the tab to finish loading in every realistic case.
export const openHtmlPreview = (html: string): void => {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => { URL.revokeObjectURL(url); }, 60_000);
};

// Produces "newsletter-YYYY-MM-DD.html" from the current date.
export const buildExportFilename = (date: Date = new Date()): string => {
  const isoDate = date.toISOString().slice(0, 10);
  return `newsletter-${isoDate}.html`;
};

// Formats a single compile error/warning for display. MJML errors are objects shaped like
// { line, message, tagName, formattedMessage } — String(error) on that shape yields
// "[object Object]", so this narrows the unknown value and prefers formattedMessage, then
// message, before falling back to String() for genuinely unknown shapes (e.g. thrown Errors).
export const formatCompileError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    if ('formattedMessage' in error && typeof error.formattedMessage === 'string') {
      return error.formattedMessage;
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return String(error);
};

// exportHtml: compiles the current canvas and returns { html, errors } to the caller. Does NOT
// download — the caller (TopBar) decides download-vs-warn UX (never silently ship partial HTML,
// per mjml-email-safety.md). Synchronous -- compileNewsletter is sync (see lib/compile.ts).
export const exportHtml = (editor: GrapesEditor): CompileResult => {
  const mjml = getExportMjml(editor);
  return compileNewsletter(mjml);
};

// Assert that a save→load cycle produces byte-identical JSON.
// Criterion 3 procedure: drop the hero block, make an inline text edit, then run:
//   window.__ddroiddAssertRoundTrip()
// Expected console output: [ddroidd] Round-trip identical: true
export const assertRoundTrip = (editor: GrapesEditor): void => {
  const before = JSON.stringify(editor.getProjectData());
  save(editor);
  load(editor);
  const after = JSON.stringify(editor.getProjectData());
  const identical = before === after;
  console.assert(identical, 'Round-trip mismatch!', { before, after });
  console.log(`[ddroidd] Round-trip identical: ${String(identical)}`);
};

// Seed the full 7-section TEMPLATE_MJML onto the canvas. This is seed-time authoring --
// the SAME blessed mechanism as the empty-scaffold seed and block drops (editor.setComponents
// with a literal MJML string, invoked explicitly at button-click time) -- NOT the forbidden
// "reload persisted state from an MJML string" pattern. Persisted state always stays project
// JSON (see .claude/rules/grapesjs.md); this only ever runs on an explicit user action.
export const handleNewFromTemplate = (editor: GrapesEditor): void => {
  editor.setComponents(TEMPLATE_MJML);
  editor.UndoManager.clear();
  console.log('[ddroidd] Seeded full template onto canvas');
};
