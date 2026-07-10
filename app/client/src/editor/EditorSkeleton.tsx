// Sized 3-panel Suspense fallback for the lazily-loaded NewsletterEditor. Dimensions
// match NewsletterEditor's layout (top bar h-14, left rail w-[280px], right panel
// w-[300px]) so nothing shifts once the real editor chunk mounts (performance.md).
export const EditorSkeleton = () => {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex h-14 flex-none items-center gap-4 border-b bg-card px-4">
        <div className="h-8 w-8 flex-none animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="ml-auto flex gap-2">
          <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[280px] flex-none border-r bg-card p-3">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1 bg-muted/30 p-6">
          <div className="mx-auto h-full max-w-2xl animate-pulse rounded-md bg-muted" />
        </div>
        <div className="w-[300px] flex-none border-l bg-card p-3">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
