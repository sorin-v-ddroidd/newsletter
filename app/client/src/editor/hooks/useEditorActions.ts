import { useState } from 'react';
import {
  assertRoundTrip,
  buildExportFilename,
  compileDraft,
  exportHtml,
  formatCompileError,
  handleNewFromTemplate,
  load,
  openHtmlPreview,
  save,
  triggerDownload,
} from '../actions';

type ExportWarningBanner = { html: string; warnings: string[] };

type UseEditorActionsReturn = {
  banner: ExportWarningBanner | null;
  handleSave: () => void;
  handleLoad: () => void;
  handleAssert: () => void;
  handleTemplate: () => void;
  handleCompile: () => void;
  handleExport: () => void;
  handleDownloadAnyway: () => void;
  handleDismissBanner: () => void;
};

// Owns the ExportWarningBanner state and every TopBar action handler. All actions run through
// window.__ddroiddEditor exactly as before (no partial migration of these handlers to useEditor).
// Non-visual stateful logic lives in a hook per component-patterns.md — TopBar.tsx only renders.
export const useEditorActions = (): UseEditorActionsReturn => {
  const [banner, setBanner] = useState<ExportWarningBanner | null>(null);

  const withEditor = (fn: (editor: NonNullable<typeof window.__ddroiddEditor>) => void) => () => {
    if (window.__ddroiddEditor) {
      fn(window.__ddroiddEditor);
    }
  };

  const handleSave = withEditor(save);
  const handleLoad = withEditor(load);
  const handleAssert = withEditor(assertRoundTrip);
  const handleTemplate = withEditor(handleNewFromTemplate);
  // Synchronous, called directly inside the click handler (no await) so window.open() stays
  // inside the user gesture -- awaiting first would move it out and trigger popup blockers.
  const handleCompile = withEditor((editor) => {
    try {
      const { html, errors } = compileDraft(editor);
      if (errors.length > 0) {
        setBanner({ html, warnings: errors.map(formatCompileError) });
        return;
      }
      openHtmlPreview(html);
      setBanner(null);
    } catch (err: unknown) {
      setBanner({ html: '', warnings: [err instanceof Error ? err.message : String(err)] });
    }
  });

  const handleExport = withEditor((editor) => {
    try {
      const { html, errors } = exportHtml(editor);
      if (errors.length > 0) {
        setBanner({ html, warnings: errors.map(formatCompileError) });
        return;
      }
      triggerDownload(html, buildExportFilename());
      setBanner(null);
    } catch (err: unknown) {
      setBanner({ html: '', warnings: [err instanceof Error ? err.message : String(err)] });
    }
  });

  const handleDownloadAnyway = () => {
    if (!banner || !banner.html) {
      return;
    }
    triggerDownload(banner.html, buildExportFilename());
    setBanner(null);
  };

  const handleDismissBanner = () => {
    setBanner(null);
  };

  return {
    banner,
    handleSave,
    handleLoad,
    handleAssert,
    handleTemplate,
    handleCompile,
    handleExport,
    handleDownloadAnyway,
    handleDismissBanner,
  };
};
