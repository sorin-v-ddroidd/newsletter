import { useEffect, useState } from 'react';
import type { Component } from 'grapesjs';
import { useEditor } from '@grapesjs/react';

// Subscribes to GrapesJS selection events and returns the currently selected component
// (or undefined). Editor wiring lives in a hook per component-patterns.md — this is a
// genuine subscription side effect, not derived state. Must be used inside <WithEditor>.
export const useSelectedComponent = (): Component | undefined => {
  const editor = useEditor();
  const [selected, setSelected] = useState<Component | undefined>(() => editor.getSelected());

  useEffect(() => {
    const update = () => { setSelected(editor.getSelected()); };
    editor.on('component:selected', update);
    editor.on('component:deselected', update);
    return () => {
      editor.off('component:selected', update);
      editor.off('component:deselected', update);
    };
  }, [editor]);

  return selected;
};
