import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type ErrorBoundaryProps = Readonly<{
  children: ReactNode;
  fallback?: ReactNode;
}>;

type ErrorBoundaryState = {
  hasError: boolean;
};

// Sanctioned exception to code-style.md's arrow-function/`type`-only conventions: React
// error boundaries require `getDerivedStateFromError` + `componentDidCatch`, which only
// exist on class components — there is no hook equivalent.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ddroidd] ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred while rendering the newsletter editor.
        </p>
        <Button onClick={() => { window.location.reload(); }}>Reload</Button>
      </div>
    );
  }
}
