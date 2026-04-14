# Mobile Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dark mode colour derivation, guard against iOS Brave voice
crashes, and add layered error boundaries to prevent white-screen failures.

**Architecture:** Three independent fixes in a single branch. Dark mode fixes
the `.dark` CSS block to derive from `--bs-*` tokens. Voice crash is solved by
a shared `safeGetVoices` helper. Error handling adds a global React
`ErrorBoundary` + TanStack Router's `defaultErrorComponent`.

**Tech Stack:** CSS custom properties, Web Speech API, React class components,
TanStack Router `ErrorComponentProps`

---

## File Structure

| Action | Path                                                             | Responsibility                                      |
| ------ | ---------------------------------------------------------------- | --------------------------------------------------- |
| Modify | `src/styles.css`                                                 | `.dark` block: derive from `--bs-*` tokens          |
| Modify | `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` | Replace `text-white` with `text-primary-foreground` |
| Create | `src/lib/speech/safe-get-voices.ts`                              | Shared `safeGetVoices` helper                       |
| Create | `src/lib/speech/safe-get-voices.test.ts`                         | Tests for `safeGetVoices`                           |
| Modify | `src/lib/speech/SpeechOutput.ts`                                 | Use `safeGetVoices`                                 |
| Modify | `src/lib/speech/voices.ts`                                       | Use `safeGetVoices`                                 |
| Modify | `src/routes/$locale/_app/settings.tsx`                           | Use `safeGetVoices`                                 |
| Create | `src/components/RouteErrorFallback.tsx`                          | Shared error fallback UI                            |
| Create | `src/components/ErrorBoundary.tsx`                               | Global React error boundary                         |
| Modify | `src/routes/__root.tsx`                                          | Wrap content in `ErrorBoundary`                     |
| Modify | `src/router.tsx`                                                 | Set `defaultErrorComponent`                         |

---

### Task 1: Fix `.dark` CSS block to derive from `--bs-*` tokens

**Files:**

- Modify: `src/styles.css:518-564`

- [ ] **Step 1: Replace hardcoded `.dark` values with `var(--bs-*, fallback)`**

In `src/styles.css`, replace the `.dark` block (lines 518-564) with:

```css
.dark {
  /*
   * Derive from --bs-* tokens with dark-mode fallbacks.
   * --bs-* vars are set as inline styles on <html> by ThemeRuntimeProvider
   * and by the Storybook withTheme decorator. The fallback values match the
   * Galaxy dark palette for when no inline --bs-* vars are present.
   */
  --background: var(--bs-background, oklch(14.5% 0 0deg));
  --foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --card: var(--bs-surface, oklch(20.5% 0 0deg));
  --card-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --popover: var(--bs-surface, oklch(20.5% 0 0deg));
  --popover-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --primary: var(--bs-primary, oklch(92.2% 0 0deg));
  --primary-foreground: var(--bs-surface, oklch(20.5% 0 0deg));
  --secondary: var(--bs-secondary, oklch(26.9% 0 0deg));
  --secondary-foreground: var(--bs-surface, oklch(98.5% 0 0deg));
  --muted: var(--bs-surface, oklch(26.9% 0 0deg));
  --muted-foreground: oklch(70.8% 0 0deg);
  --accent: var(--bs-accent, oklch(26.9% 0 0deg));
  --accent-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --destructive: oklch(70.4% 0.191 22.216deg);
  --border: oklch(100% 0 0deg / 10%);
  --input: oklch(100% 0 0deg / 15%);
  --ring: var(--bs-primary, oklch(55.6% 0 0deg));
  --chart-1: oklch(87% 0 0deg);
  --chart-2: oklch(55.6% 0 0deg);
  --chart-3: oklch(43.9% 0 0deg);
  --chart-4: oklch(37.1% 0 0deg);
  --chart-5: oklch(26.9% 0 0deg);
  --sidebar: var(--bs-surface, oklch(20.5% 0 0deg));
  --sidebar-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --sidebar-primary: oklch(48.8% 0.243 264.376deg);
  --sidebar-primary-foreground: oklch(98.5% 0 0deg);
  --sidebar-accent: var(--bs-surface, oklch(26.9% 0 0deg));
  --sidebar-accent-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --sidebar-border: oklch(100% 0 0deg / 10%);
  --sidebar-ring: oklch(55.6% 0 0deg);

  /* Skeuomorphic tile tokens — dark */
  --skeuo-highlight: rgb(255 255 255 / 6%);
  --skeuo-ring: rgb(255 255 255 / 10%);
  --skeuo-inset-bottom: rgb(255 255 255 / 4%);
  --skeuo-inset-top: rgb(255 255 255 / 8%);
  --skeuo-text-shadow: rgb(0 0 0 / 40%);
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS (CSS-only change, no TS impact)

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "fix(theme): derive .dark shadcn vars from --bs-* tokens

The .dark block was hardcoding all shadcn CSS variables with generic
oklch() values, overriding the --bs-* token derivations. Now uses
var(--bs-*, fallback) so Storybook themes and ThemeRuntimeProvider
colours flow through correctly in dark mode."
```

---

### Task 2: Fix DotGroupQuestion hardcoded `text-white`

**Files:**

- Modify: `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx:76`

- [ ] **Step 1: Replace `text-white` with `text-primary-foreground`**

In `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`, change
line 76 from:

```tsx
<span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
```

to:

```tsx
<span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-foreground">
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx
git commit -m "fix(dots): use text-primary-foreground instead of text-white

Hardcoded text-white was invisible against light primary backgrounds
in dark themes. text-primary-foreground derives from --bs-surface and
adapts to the active theme."
```

---

### Task 3: Create `safeGetVoices` helper with tests (TDD)

**Files:**

- Create: `src/lib/speech/safe-get-voices.ts`
- Create: `src/lib/speech/safe-get-voices.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/speech/safe-get-voices.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeGetVoices } from './safe-get-voices';

describe('safeGetVoices', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns voices when getVoices() works normally', () => {
    const voice = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([voice]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out null entries', () => {
    const voice = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([null, voice, null]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out undefined entries', () => {
    const voice = {
      name: 'Samantha',
      lang: 'en-US',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([undefined, voice]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out entries without a string name', () => {
    const good = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const bad = { lang: 'en-US' } as unknown as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([good, bad]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([good]);
  });

  it('returns empty array when getVoices() throws', () => {
    const synth = {
      getVoices: vi.fn().mockImplementation(() => {
        throw new Error('iOS Brave crash');
      }),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([]);
  });

  it('returns empty array when getVoices() returns empty', () => {
    const synth = {
      getVoices: vi.fn().mockReturnValue([]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/speech/safe-get-voices.test.ts`
Expected: FAIL — module `./safe-get-voices` not found

- [ ] **Step 3: Write the implementation**

Create `src/lib/speech/safe-get-voices.ts`:

```ts
/**
 * Safely retrieve voices from SpeechSynthesis.
 *
 * iOS Brave returns broken/undefined voice objects from getVoices().
 * This helper filters out null, undefined, and entries without a valid
 * `.name` property, and catches getVoices() throwing entirely.
 */
export const safeGetVoices = (
  synth: SpeechSynthesis,
): SpeechSynthesisVoice[] => {
  try {
    return synth
      .getVoices()
      .filter(
        (v): v is SpeechSynthesisVoice =>
          v != null && typeof v.name === 'string',
      );
  } catch {
    return [];
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/speech/safe-get-voices.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/speech/safe-get-voices.ts src/lib/speech/safe-get-voices.test.ts
git commit -m "feat(speech): add safeGetVoices helper for iOS Brave

iOS Brave exposes speechSynthesis but returns broken voice objects.
This helper filters out null/undefined entries and catches throws."
```

---

### Task 4: Update SpeechOutput.ts to use `safeGetVoices`

**Files:**

- Modify: `src/lib/speech/SpeechOutput.ts:47,67`

- [ ] **Step 1: Replace `synth.getVoices()` calls**

In `src/lib/speech/SpeechOutput.ts`, add the import at the top (after the
existing imports/declarations, before `let pendingVoicesChangedHandler`):

```ts
import { safeGetVoices } from './safe-get-voices';
```

Then replace line 47:

```ts
const voices = synth.getVoices();
```

with:

```ts
const voices = safeGetVoices(synth);
```

And replace line 67:

```ts
const loadedVoices = synth.getVoices();
```

with:

```ts
const loadedVoices = safeGetVoices(synth);
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npx vitest run src/lib/speech/SpeechOutput.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/speech/SpeechOutput.ts
git commit -m "fix(speech): use safeGetVoices in SpeechOutput

Prevents crash when iOS Brave returns broken voice objects."
```

---

### Task 5: Update voices.ts to use `safeGetVoices`

**Files:**

- Modify: `src/lib/speech/voices.ts:10,22`

- [ ] **Step 1: Replace `synth.getVoices()` calls**

In `src/lib/speech/voices.ts`, add the import at the top:

```ts
import { safeGetVoices } from './safe-get-voices';
```

Replace line 10:

```ts
return synth.getVoices().find((v) => v.name === name);
```

with:

```ts
return safeGetVoices(synth).find((v) => v.name === name);
```

Replace line 22:

```ts
const voices = synth.getVoices();
```

with:

```ts
const voices = safeGetVoices(synth);
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npx vitest run src/lib/speech/voices.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/speech/voices.ts
git commit -m "fix(speech): use safeGetVoices in voices.ts

Prevents crash when iOS Brave returns broken voice objects."
```

---

### Task 6: Update settings.tsx to use `safeGetVoices`

**Files:**

- Modify: `src/routes/$locale/_app/settings.tsx:1,42-50`

- [ ] **Step 1: Replace `synth.getVoices()` call**

In `src/routes/$locale/_app/settings.tsx`, add the import at the top (with the
other imports):

```ts
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
```

Replace lines 42-50 (the `useEffect` block):

```tsx
useEffect(() => {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) return;
  const load = () => setVoices(synth.getVoices());
  load();
  synth.addEventListener('voiceschanged', load);
  return () => synth.removeEventListener('voiceschanged', load);
}, []);
```

with:

```tsx
useEffect(() => {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) return;
  const load = () => setVoices(safeGetVoices(synth));
  load();
  synth.addEventListener('voiceschanged', load);
  return () => synth.removeEventListener('voiceschanged', load);
}, []);
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/\$locale/_app/settings.tsx
git commit -m "fix(settings): use safeGetVoices in voice picker

Prevents crash when iOS Brave returns broken voice objects."
```

---

### Task 7: Create `RouteErrorFallback` component

**Files:**

- Create: `src/components/RouteErrorFallback.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RouteErrorFallback.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/RouteErrorFallback.tsx
git commit -m "feat(error): add RouteErrorFallback and GlobalErrorFallback

Shared error UI used by both the TanStack Router defaultErrorComponent
and the global React ErrorBoundary."
```

---

### Task 8: Create global `ErrorBoundary` component

**Files:**

- Create: `src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create the class component**

Create `src/components/ErrorBoundary.tsx`:

```tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { GlobalErrorFallback } from './RouteErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: unknown | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.error !== null) {
      return <GlobalErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat(error): add global ErrorBoundary class component

Catches unhandled React errors and shows GlobalErrorFallback with a
reload button. Prevents full white-screen failures."
```

---

### Task 9: Integrate ErrorBoundary into `__root.tsx`

**Files:**

- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Wrap content with ErrorBoundary**

In `src/routes/__root.tsx`, add the import after the existing imports:

```ts
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

Then wrap the `ServiceWorkerProvider` inside the `<body>` with
`<ErrorBoundary>`. Change the body content from:

```tsx
    <body className="font-sans antialiased">
      <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
      <TanStackDevtools
```

to:

```tsx
    <body className="font-sans antialiased">
      <ErrorBoundary>
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
      </ErrorBoundary>
      <TanStackDevtools
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat(error): wrap app content in global ErrorBoundary

Top-level safety net — catches any unhandled React error and shows
a reload button instead of a white screen."
```

---

### Task 10: Set `defaultErrorComponent` on router

**Files:**

- Modify: `src/router.tsx`

- [ ] **Step 1: Add defaultErrorComponent to router config**

In `src/router.tsx`, add the import at the top:

```ts
import { RouteErrorFallback } from './components/RouteErrorFallback';
```

Then add `defaultErrorComponent` to the `createTanStackRouter` call. Change:

```ts
const router = createTanStackRouter({
  routeTree,
  history,
  basepath,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});
```

to:

```ts
const router = createTanStackRouter({
  routeTree,
  history,
  basepath,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: RouteErrorFallback,
});
```

- [ ] **Step 2: Verify typecheck passes**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 3: Run all unit tests**

Run: `yarn test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/router.tsx
git commit -m "feat(error): add defaultErrorComponent to router

Route-level errors now render inside the existing layout (Header/Footer
stay intact) with a retry button, instead of bubbling to the global
ErrorBoundary."
```
