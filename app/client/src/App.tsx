import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EditorSkeleton } from '@/editor/EditorSkeleton';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

// The GrapesJS editor bundle is the heaviest dependency in the app (performance.md) —
// code-split it off the initial critical path. Named export is re-mapped to `default`
// so React.lazy can consume it.
const NewsletterEditor = lazy(() =>
  import('@/editor/NewsletterEditor').then((m) => ({ default: m.NewsletterEditor })),
);

export default function App() {
  // Composition seam: ErrorBoundary > Suspense > lazy editor. A future auth-guard HOC /
  // react-router route wrapper slots in around <NewsletterEditor /> here — no auth or
  // routing is added now (Phase 1 gate; see plan-before-implement.md).
  return (
    <ErrorBoundary>
      <Analytics />
      <SpeedInsights />
      <Suspense fallback={<EditorSkeleton />}>
        <NewsletterEditor />
      </Suspense>
    </ErrorBoundary>
  );
}
