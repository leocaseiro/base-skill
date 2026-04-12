import type { ErrorComponentProps } from '@tanstack/react-router';

interface RouteErrorFallbackProps {
  error: unknown;
  onRetry: () => void;
}

const ErrorFallbackContent = ({
  error,
  onRetry,
}: RouteErrorFallbackProps) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 className="text-2xl font-bold text-foreground">
      Something went wrong
    </h1>
    <p className="max-w-md text-muted-foreground">
      An unexpected error occurred. Please try again.
    </p>
    {import.meta.env.DEV && error instanceof Error && (
      <pre className="max-w-full overflow-auto rounded-lg bg-muted p-4 text-left text-sm text-muted-foreground">
        {error.message}
      </pre>
    )}
    <button
      type="button"
      className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground"
      onClick={onRetry}
    >
      Try again
    </button>
  </div>
);

/** Route-level error component for TanStack Router's defaultErrorComponent. */
export const RouteErrorFallback = ({
  error,
  reset,
}: ErrorComponentProps) => (
  <ErrorFallbackContent error={error} onRetry={reset} />
);

/** Global error fallback — used by the top-level ErrorBoundary. */
export const GlobalErrorFallback = ({ error }: { error: unknown }) => (
  <ErrorFallbackContent
    error={error}
    onRetry={() => globalThis.location.reload()}
  />
);
