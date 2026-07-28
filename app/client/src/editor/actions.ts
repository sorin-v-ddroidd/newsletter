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

// SECDEL-01 legacy-draft migration. Branded blocks used to bake data-gjs-removable="false" onto
// their root mj-section, and editorConfig then set draggable:false off that marker -- so a section
// could be neither deleted nor reordered. Both are gone from the block sources, but drafts saved
// BEFORE the fix carry `removable: false` / `draggable: false` serialized in their project JSON,
// and loading one re-locks its sections. So the JSON is normalized on the way in.
//
// This DELETES the keys rather than writing `true`. `draggable` on an mjml component is not a
// boolean -- the plugin's default is a target SELECTOR string ("[data-gjs-type=\"mj-body\"]", built
// by the plugin's own selector helper) that constrains a section to legal parents. Writing `true`
// would replace that constraint with "droppable anywhere" and let a section land inside an
// mj-column, producing invalid MJML. Deleting the key makes GrapesJS construct the component from
// its registered type defaults, which is exactly what a freshly dropped section gets.
//
// Idempotent by construction: once the keys are absent, a re-save omits them, so a second pass is
// a no-op and assertRoundTrip converges (only the very first load of a pre-fix draft differs).
// Returns the number of sections unlocked (for the load log).
export const unlockSectionsInProjectData = (data: unknown): number => {
  let unlocked = 0;

  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value === null || typeof value !== 'object') {
      return;
    }
    const node = value as Record<string, unknown>;
    // Match on either key -- grapesjs serializes `type` for registered components and `tagName`
    // for parsed markup; a section can carry either depending on how it entered the tree.
    const isSection = node['type'] === 'mj-section' || node['tagName'] === 'mj-section';
    if (isSection) {
      if (node['removable'] === false) {
        delete node['removable'];
        unlocked += 1;
      }
      if (node['draggable'] === false) {
        delete node['draggable'];
      }
    }
    Object.values(node).forEach(walk);
  };

  walk(data);
  return unlocked;
};

// hasSavedDraft: true when localStorage holds a draft. Used by the mount-time auto-restore in
// editorConfig.onEditor to decide between restoring the user's last save and seeding an empty
// scaffold — checked BEFORE touching the canvas so the scaffold never overwrites a real draft.
export const hasSavedDraft = (): boolean => localStorage.getItem(STORAGE_KEY) !== null;

// Load the canvas state from localStorage. Returns true when a draft was found and loaded,
// false when there was nothing saved — the mount-time restore needs that answer to fall back
// to the empty scaffold. A corrupt/unparseable draft is reported and treated as "not loaded"
// rather than thrown, so a bad localStorage entry can never brick the editor on open.
export const load = (editor: GrapesEditor): boolean => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.log('[ddroidd] No saved project data found');
    return false;
  }

  let data: object;
  try {
    data = JSON.parse(raw) as object;
  } catch (err: unknown) {
    console.error('[ddroidd] Saved draft is not valid JSON — ignoring it', err);
    return false;
  }

  const unlocked = unlockSectionsInProjectData(data);

  loadingProject = true;
  try {
    editor.loadProjectData(data);
  } finally {
    loadingProject = false;
  }
  console.log(
    `[ddroidd] Loaded project data from localStorage (unlocked ${String(unlocked)} legacy section(s))`,
  );
  return true;
};

// Recursively collect every component in the tree (rooted at `component`) whose Layers
// visibility is false. Depth-first; order does not matter for removal.
const collectHidden = (editor: GrapesEditor, component: Component, hidden: Component[]): void => {
  if (!editor.Layers.isVisible(component)) {
    hidden.push(component);
  }
  component.components().forEach((child: Component) => { collectHidden(editor, child, hidden); });
};

// canDuplicate: the SINGLE source of truth for "is this component duplicable".
// Reused by the Layers context menu (disabled state), the Ctrl/Cmd+D handler,
// and the multi-select duplicate filter — must never be reimplemented inline
// elsewhere (see .planning/quick/260713-eou-multiselect-duplicate-layers/PLAN.md
// design decision 1). Mirrors LeftSidebar's existing isStructural/canDelete
// checks: no parent (root), <mjml>, <mj-body>, or an explicit removable:false
// are all excluded.
export const canDuplicate = (component: Component): boolean => {
  const parent = component.parent();
  if (!parent) {
    return false;
  }
  const tag = String(component.get('tagName') ?? '');
  if (tag === 'mjml' || tag === 'mj-body') {
    return false;
  }
  return component.get('removable') !== false;
};

// Clones each duplicable component in `components` as a sibling directly
// below itself, then selects the resulting clones. Non-duplicable components
// in the input are silently skipped (BLOCK-03 locking). `index()` is read
// live per-iteration so inserting one clone doesn't shift the position of a
// not-yet-processed sibling's insert point.
export const duplicateComponents = (editor: GrapesEditor, components: Component[]): void => {
  const clones = components
    .filter(canDuplicate)
    .map((component) => {
      const parent = component.parent();
      if (!parent) {
        return null;
      }
      const clone = component.clone();
      parent.append(clone, { at: component.index() + 1 });
      return clone;
    })
    .filter((c): c is Component => c !== null);

  if (clones.length > 0) {
    editor.select(clones);
  }
};

// Flattens the layer tree rooted at `root` into pre-order (component, then each child's
// subtree, in rendered order) — matches LayerItem's own recursive JSX rendering so index
// order lines up with what's on screen. Used to compute the shift-click contiguous range.
export const flattenLayerTree = (root: Component): Component[] => {
  const flat: Component[] = [root];
  root.components().forEach((child: Component) => {
    flat.push(...flattenLayerTree(child));
  });
  return flat;
};

// Global message width (WIDTH-01, AC-style 320–900, default 600). mj-body already models `width`
// as a real style property that round-trips through project JSON and compiles to `<mj-body width>`
// (buildFullMjml only rewrites mj-head, never mj-body attrs), so this wires an existing property
// into a clamped UI — NOT a new persistence blob. mj-body style.width is the SINGLE source of truth.
export const MESSAGE_WIDTH_MIN = 320;
export const MESSAGE_WIDTH_MAX = 900;
export const MESSAGE_WIDTH_DEFAULT = 600;

const clampMessageWidth = (px: number): number =>
  Math.min(MESSAGE_WIDTH_MAX, Math.max(MESSAGE_WIDTH_MIN, Math.round(px)));

// Depth-agnostic walk by tagName — do NOT hardcode a nesting index. getWrapper() may or may not
// collapse the mjml level depending on grapesjs-mjml config (RESEARCH Open Question 2), so search
// the whole subtree for the mj-body tag. forEach (not for..of) mirrors the tree walks above.
const findMjBody = (component: Component): Component | undefined => {
  if (String(component.get('tagName')) === 'mj-body') {
    return component;
  }
  let found: Component | undefined;
  component.components().forEach((child: Component) => {
    if (!found) {
      found = findMjBody(child);
    }
  });
  return found;
};


// getMessageWidth: parse mj-body style.width, falling back to 600 when unset/unparseable.
export const getMessageWidth = (editor: GrapesEditor): number => {
  const wrapper = editor.getWrapper();
  const mjBody = wrapper ? findMjBody(wrapper) : undefined;
  const raw = mjBody?.getStyle()['width'];
  const parsed = raw ? Number.parseInt(String(raw), 10) : MESSAGE_WIDTH_DEFAULT;
  return Number.isFinite(parsed) ? parsed : MESSAGE_WIDTH_DEFAULT;
};

// setMessageWidth: clamp to [320,900] then write mj-body style.width (the MJML property itself has
// no min/max, so the clamp lives here + in the WidthRangeField control).
export const setMessageWidth = (editor: GrapesEditor, px: number): void => {
  const wrapper = editor.getWrapper();
  const mjBody = wrapper ? findMjBody(wrapper) : undefined;
  if (!mjBody) {
    return;
  }
  mjBody.addStyle({ width: `${clampMessageWidth(px)}px` });
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
