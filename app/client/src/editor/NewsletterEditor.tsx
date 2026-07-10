import grapesjs from 'grapesjs';
import GjsEditor, { Canvas, WithEditor } from '@grapesjs/react';
import 'grapesjs/dist/css/grapes.min.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { editorOptions, onEditor } from './editorConfig';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import './editor-shell.css';

// Custom-UI 3-panel Figma/ActiveCampaign-style shell. <Canvas/> is a direct child of
// <GjsEditor> (required composition per @grapesjs/react README — deferring it behind
// <WithEditor> would deadlock the mount). Provider-backed panels (Blocks/Layers/Styles/
// Traits/Devices) are wrapped in <WithEditor> since they need a live editor instance.
// Chrome is Tailwind + shadcn; the <Canvas/> is GrapesJS/MJML and is never styled here.
export const NewsletterEditor = () => {
  return (
    <TooltipProvider delayDuration={300}>
      <GjsEditor grapesjs={grapesjs} onEditor={onEditor} options={editorOptions}>
        <div className="flex h-screen flex-col bg-background text-foreground">
          <WithEditor>
            <TopBar />
          </WithEditor>
          <div className="flex min-h-0 flex-1">
            <WithEditor>
              <LeftSidebar />
            </WithEditor>
            <div className="ddroidd-shell__canvas min-w-0 flex-1 overflow-hidden">
              <Canvas />
            </div>
            <WithEditor>
              <RightPanel />
            </WithEditor>
          </div>
        </div>
      </GjsEditor>
    </TooltipProvider>
  );
};
