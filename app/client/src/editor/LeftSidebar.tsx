import { useState } from 'react';
import type { Block } from 'grapesjs';
import type { Component } from 'grapesjs';
import { BlocksProvider, LayersProvider, useEditor } from '@grapesjs/react';
import { Eye, EyeOff, Search, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSelectedComponent } from './hooks/useSelectedComponent';
import { useLayerVisibility } from './hooks/useLayerVisibility';

// Branded category sorts to the top of the block list.
const BRAND_CATEGORY = 'DDROIDD';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

// Recursive layer tree node: name + click-select + selected highlight. No drag-reorder
// in v1 (spike). component.components() returns a Backbone Collection (has .map).
const LayerItem = ({ component, depth }: { component: Component; depth: number }) => {
  const editor = useEditor();
  const selected = useSelectedComponent();
  const { visible, toggle } = useLayerVisibility(component);
  const children = component.components();
  const isSelected = selected === component;
  const name = String(component.getName() ?? component.get('tagName') ?? 'Element');

  const isRoot = depth === 0;
  const tag = String(component.get('tagName') ?? component.get('type') ?? '');
  const isStructural = isRoot || tag === 'mjml' || tag === 'mj-body';
  const canDelete = component.get('removable') !== false;

  const renderControls = () => {
    if (isStructural) {
      return null;
    }
    return (
      <div
        className={cn(
          'flex items-center gap-0.5 opacity-0 transition-opacity',
          'group-hover:opacity-100',
          (isSelected || !visible) && 'opacity-100',
        )}
      >
        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); toggle(); }}
          aria-label={visible ? 'Hide layer' : 'Show layer'}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={(ev) => { ev.stopPropagation(); component.remove(); }}
            aria-label="Delete layer"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md pr-1 transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-accent',
        )}
      >
        <button
          type="button"
          onClick={() => { editor.select(component); }}
          style={{ paddingLeft: `${String(8 + depth * 12)}px` }}
          className={cn(
            'block min-w-0 flex-1 truncate rounded-md py-1.5 text-left text-xs text-foreground/80 transition-colors',
            isSelected && 'font-medium text-foreground',
            !visible && 'opacity-60',
          )}
        >
          {name}
        </button>
        {renderControls()}
      </div>
      {children.map((child: Component) => (
        <LayerItem key={child.cid} component={child} depth={depth + 1} />
      ))}
    </div>
  );
};

// Single draggable block chip. Media/label are GrapesJS-authored strings (may contain SVG
// icons) — same trust domain as the stock Block Manager. dragStart/dragStop preserve the
// native GrapesJS drop machinery.
const BlockChip = ({
  block,
  brand,
  onDragStart,
  onDragEnd,
}: {
  block: Block;
  brand: boolean;
  onDragStart: (ev: React.DragEvent) => void;
  onDragEnd: () => void;
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'flex cursor-grab select-none flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all',
        'hover:-translate-y-px hover:border-primary hover:bg-accent',
        brand ? 'border-primary/30 bg-accent/40' : 'border-border bg-secondary',
      )}
    >
      <div
        className={cn(
          '[&_img]:max-h-6 [&_img]:max-w-6 [&_svg]:size-[22px]',
          brand ? 'text-primary' : 'text-muted-foreground',
        )}
        dangerouslySetInnerHTML={{ __html: block.getMedia() ?? '' }}
      />
      <span
        className="text-[11.5px] leading-tight text-foreground"
        dangerouslySetInnerHTML={{ __html: block.getLabel() }}
      />
    </div>
  );
};

// ~280px left panel: Blocks/Layers tabs. Panels are custom-rendered from provider
// render-prop state — the provider Container portals CANNOT be used in custom-UI mode
// (GrapesJS emits a detached container and never renders the default manager UI into it).
export const LeftSidebar = () => {
  const [query, setQuery] = useState('');

  const renderBlocks = () => {
    return (
      <BlocksProvider>
        {({ mapCategoryBlocks, dragStart, dragStop }) => {
          const q = query.trim().toLowerCase();
          const categories = Array.from(mapCategoryBlocks)
            .map(([category, blocks]) => {
              const filtered = q
                ? blocks.filter((b) => stripHtml(b.getLabel()).toLowerCase().includes(q))
                : blocks;
              return [category, filtered] as const;
            })
            .filter(([, blocks]) => blocks.length > 0)
            .sort(([a], [b]) => {
              if (a === BRAND_CATEGORY) return -1;
              if (b === BRAND_CATEGORY) return 1;
              return 0;
            });

          if (categories.length === 0) {
            return <p className="px-1 py-8 text-center text-xs text-muted-foreground">No blocks match “{query}”.</p>;
          }

          return (
            <>
              {categories.map(([category, blocks]) => {
                const brand = category === BRAND_CATEGORY;
                return (
                  <div key={category} className="mb-6">
                <div className="mb-2.5 ml-0.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {category || 'Blocks'}
                  </span>
                  {brand && (
                    <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-px text-[9.5px] font-medium tracking-wide text-primary">
                      On-brand
                    </span>
                  )}
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {blocks.map((block) => (
                    <BlockChip
                      key={block.getId()}
                      block={block}
                      brand={brand}
                      onDragStart={(ev) => { dragStart(block, ev.nativeEvent); }}
                      onDragEnd={() => { dragStop(false); }}
                    />
                  ))}
                    </div>
                  </div>
                );
              })}
            </>
          );
        }}
      </BlocksProvider>
    );
  };

  const renderLayers = () => {
    return (
      <LayersProvider>
        {({ root }) =>
          root ? (
            <LayerItem component={root} depth={0} />
          ) : (
            <p className="py-8 text-center text-xs text-muted-foreground">No layers yet</p>
          )
        }
      </LayersProvider>
    );
  };

  return (
    <aside className="flex w-[280px] flex-none flex-col border-r bg-card">
      <Tabs defaultValue="blocks" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2 bg-transparent p-0">
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="min-h-0 flex-1">
          <div className="border-y px-3.5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(ev) => { setQuery(ev.target.value); }}
                placeholder="Search blocks…"
                className="h-9 bg-background pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-61px)]">
            <div className="p-3.5">{renderBlocks()}</div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layers" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="p-2">{renderLayers()}</div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
};
