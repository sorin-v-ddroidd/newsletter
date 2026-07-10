import { DevicesProvider } from '@grapesjs/react';
import { useState } from 'react';
import { Check, Download, FileDown, FileText, Monitor, MoreVertical, Save, Smartphone, Tablet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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
} from './actions';

type ExportWarningBanner = { html: string; warnings: string[] };

// Top toolbar: brand + doc status (left) · device switcher (center) · actions (right).
// All actions run through window.__ddroiddEditor exactly as before (no partial migration
// of these handlers to useEditor). Dev-only tools (Load, Assert Round-Trip) live in the
// overflow menu; Save and Preview & Compile are the primary surfaces.
export const TopBar = () => {
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

  const deviceIcon = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('mobile') || key.includes('phone')) {
      return <Smartphone className="size-4" />;
    }
    if (key.includes('tablet')) {
      return <Tablet className="size-4" />;
    }
    return <Monitor className="size-4" />;
  };

  const renderBrand = () => {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-8 flex-none place-items-center rounded-lg bg-primary font-extrabold text-primary-foreground shadow-sm">
          D
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold">DDROIDD Newsletter Builder</span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Draft — changes saved locally
          </span>
        </div>
      </div>
    );
  };

  const renderDeviceSwitcher = () => {
    return (
      <DevicesProvider>
        {({ devices, selected, select }) => (
          <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
            {devices.map((device) => {
              const id = String(device.get('id') ?? device.id);
              const name = device.getName() ?? id;
              const isActive = id === selected;
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={name}
                      aria-pressed={isActive}
                      onClick={() => { select(id); }}
                      className={cn(
                        'grid h-7 w-9 place-items-center rounded-md text-muted-foreground transition-colors',
                        'hover:text-foreground',
                        isActive && 'bg-accent text-foreground',
                      )}
                    >
                      {deviceIcon(name)}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{name}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </DevicesProvider>
    );
  };

  const renderWarningBanner = () => {
    if (!banner) {
      return null;
    }
    return (
      <div className="flex items-start gap-3 border-b bg-amber-50 px-4 py-2 text-amber-900">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Compile finished with warnings</p>
          <ul className="mt-1 list-inside list-disc text-[12px]">
            {banner.warnings.map((warning, index) => (
              <li key={`${index}-${warning}`} className="truncate">{warning}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-none items-center gap-2">
          {banner.html ? (
            <Button variant="outline" size="sm" onClick={handleDownloadAnyway}>
              Download anyway
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" aria-label="Dismiss warning" onClick={handleDismissBanner}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleTemplate}>
          <FileText className="size-4" />
          New from Template
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSave}>
          <Save className="size-4" />
          Save
        </Button>
        <Button size="sm" onClick={handleCompile}>
          <Check className="size-4" />
          Preview &amp; Compile
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          Export HTML
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="More actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Draft</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleLoad}>
              <FileDown className="size-4" />
              Load last saved
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Developer</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleAssert}>Assert round-trip</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-card px-4">
        {renderBrand()}
        {renderDeviceSwitcher()}
        {renderActions()}
      </header>
      {renderWarningBanner()}
    </div>
  );
};
