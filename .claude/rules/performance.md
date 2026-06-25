# Performance

Vite SPA. GrapesJS + grapesjs-mjml is the heaviest dependency in the app — code-splitting it is the one perf move that actually matters here.

## Named imports only (tree shaking)

```ts
// correct
import { formatDate, parseISO } from 'date-fns';
import { BookOpen, ChevronRight } from 'lucide-react';

// wrong — pulls in the whole library
import * as dateFns from 'date-fns';
import * as Icons from 'lucide-react';
```

## Lazy-load the editor

The GrapesJS editor bundle is large and only needed on the edit screen — never on login or the newsletter list. Split it with `React.lazy` + dynamic `import()` (Vite splits the chunk automatically) behind a `<Suspense>` boundary.

```tsx
import { lazy, Suspense } from 'react';

const NewsletterEditor = lazy(() => import('@/editor/NewsletterEditor'));

function EditorRoute() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewsletterEditor />
    </Suspense>
  );
}
```

- Always give `<Suspense>` a meaningful `fallback` sized to the component — never `null` for something with layout presence (avoids layout shift).
- Same for other heavy-but-occasional UI: large dialogs, the asset-library picker, preview iframe panel.
- Do **not** lazy-load small/always-visible components — the chunk overhead isn't worth it.

## Editor-specific
- Don't mirror GrapesJS internal state into React state and re-render on every keystroke — let GrapesJS own it; sync only on save/autosave (debounced — SAVE-06).
- Autosave is debounced, not per-change.

## Notes
- No `next/dynamic`, no `next/script` — those are Next.js. Use `React.lazy` and standard `<script>`/Vite asset handling.
