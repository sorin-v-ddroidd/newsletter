import { useEffect, useState } from 'react';
import type { Component } from 'grapesjs';
import { useEditor } from '@grapesjs/react';
import { duplicateComponents, flattenLayerTree } from '../actions';

/**
 * @description Return shape for useLayerSelection — a thin React wrapper over GrapesJS's
 * own selection model (never mirrored into React state, per grapesjs.md) plus the one
 * genuinely React-only concept, the shift-click anchor.
 */
type UseLayerSelectionReturn = {
  isSelected: (component: Component) => boolean;
  handleRowClick: (component: Component, event: React.MouseEvent) => void;
  handleDuplicate: () => void;
};

// Owns Layers-panel multi-select: ctrl/cmd-click toggles a row, shift-click selects the
// contiguous rendered range from the last-clicked anchor, and Ctrl/Cmd+D-equivalent
// duplication of the current GrapesJS selection. Selection itself lives in GrapesJS
// (editor.getSelectedAll()) — this hook only re-renders on selection change and tracks
// the shift-click anchor, which isn't a GrapesJS concept. `root` is the Layers tree root,
// needed to compute the flattened pre-order list for shift-range.
export const useLayerSelection = (root: Component | undefined): UseLayerSelectionReturn => {
  const editor = useEditor();
  const [, setVersion] = useState(0);
  const [anchor, setAnchor] = useState<Component | null>(null);

  useEffect(() => {
    const update = () => { setVersion((v) => v + 1); };
    editor.on('component:selected', update);
    editor.on('component:deselected', update);
    return () => {
      editor.off('component:selected', update);
      editor.off('component:deselected', update);
    };
  }, [editor]);

  const isSelected = (component: Component): boolean => editor.getSelectedAll().includes(component);

  const handleRowClick = (component: Component, event: React.MouseEvent): void => {
    if (event.shiftKey && anchor) {
      const flat = root ? flattenLayerTree(root) : [];
      const anchorIndex = flat.indexOf(anchor);
      const clickedIndex = flat.indexOf(component);
      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const [start, end] = anchorIndex <= clickedIndex ? [anchorIndex, clickedIndex] : [clickedIndex, anchorIndex];
        editor.select(flat.slice(start, end + 1));
        return;
      }
    }
    if (event.ctrlKey || event.metaKey) {
      editor.selectToggle(component);
      setAnchor(component);
      return;
    }
    editor.select(component);
    setAnchor(component);
  };

  const handleDuplicate = (): void => {
    duplicateComponents(editor, editor.getSelectedAll());
  };

  return { isSelected, handleRowClick, handleDuplicate };
};
