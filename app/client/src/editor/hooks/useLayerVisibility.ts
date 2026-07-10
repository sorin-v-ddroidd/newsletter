import { useEffect, useState } from 'react';
import type { Component } from 'grapesjs';
import { useEditor } from '@grapesjs/react';

type UseLayerVisibilityReturn = { visible: boolean; toggle: () => void };

// Subscribes to GrapesJS's 'component:toggled' event (fired by editor.Layers.setVisible) and
// returns the live visible/hidden state for a single component, plus a toggle callback. Editor
// wiring lives in a hook per component-patterns.md — mirrors useSelectedComponent.ts exactly.
export const useLayerVisibility = (component: Component): UseLayerVisibilityReturn => {
  const editor = useEditor();
  const [visible, setVisible] = useState<boolean>(() => editor.Layers.isVisible(component));

  useEffect(() => {
    const update = () => { setVisible(editor.Layers.isVisible(component)); };
    editor.on('component:toggled', update);
    return () => {
      editor.off('component:toggled', update);
    };
  }, [editor, component]);

  const toggle = () => {
    editor.Layers.setVisible(component, !editor.Layers.isVisible(component));
  };

  return { visible, toggle };
};
