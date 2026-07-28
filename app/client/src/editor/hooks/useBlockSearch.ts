import type { Block } from 'grapesjs';
import type { BlocksResultProps } from '@grapesjs/react';

// @grapesjs/react's package.json "exports" map only allows importing from the
// package root, so the MapCategoryBlocks type (only declared in the BlocksProvider
// subpath) isn't reachable directly — derive it from the re-exported BlocksResultProps
// shape instead.
type MapCategoryBlocks = BlocksResultProps['mapCategoryBlocks'];

// Branded category sorts to the top of the block list.
export const BRAND_CATEGORY = 'DDROIDD';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

// Pure derivation over its arguments (no event source to subscribe to, unlike
// useSelectedComponent/useLayerVisibility), so no useState/useEffect is needed here —
// still named/treated as a hook per component-patterns.md's "non-visual derived logic
// belongs in a hook, not inline in a component body" rule.
export const useBlockSearch = (
  mapCategoryBlocks: MapCategoryBlocks,
  query: string,
): Array<readonly [string, Block[]]> => {
  const q = query.trim().toLowerCase();

  return Array.from(mapCategoryBlocks)
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
};
