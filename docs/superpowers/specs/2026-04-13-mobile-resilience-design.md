# Mobile Resilience: Dark Mode Fix, Voice Crash Guard, ErrorBoundary

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._

**Date:** 2026-04-13
**Status:** Approved

## Problem

Three independent issues degrade the mobile/tablet experience:

1. **Dark mode colours broken in Storybook (and partially in-app):** The `.dark`
   CSS block in `styles.css` hardcodes all shadcn variables with generic `oklch()`
   values, overriding the `--bs-*` token derivations from `:root`. When a Storybook
   dark theme sets `--bs-primary: #48CAE4` via inline styles, `.dark` replaces
   `--primary` with near-white `oklch(92.2%)`, making `bg-primary` elements
   invisible. Additionally, `DotGroupQuestion.tsx` hardcodes `text-white` on dot
   numbers regardless of theme.

2. **iOS Brave crash on `getVoices()`:** Brave on iOS exposes `speechSynthesis`
   but returns broken/undefined voice objects from `getVoices()`. Accessing
   properties on these objects throws
   `undefined is not an object (evaluating 'Object.getPrototypeOf(voice)')`,
   crashing the app on any page that uses TTS or the settings voice picker.

3. **No ErrorBoundary:** An unhandled React error anywhere white-screens the
   entire app. There is no recovery path — users must manually reload.

## Section 1: Dark Mode `.dark` CSS Fix

### Approach

Make the `.dark` block derive shadcn variables from `--bs-*` tokens (same as
`:root`), with dark-appropriate fallback values for when no `--bs-*` vars are set
inline.

### Changes

**`src/styles.css` — `.dark` block (lines 518-564):**

Replace hardcoded values with `var(--bs-*, fallback)`:

```css
.dark {
  --foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --background: var(--bs-background, oklch(14.5% 0 0deg));
  --card: var(--bs-surface, oklch(20.5% 0 0deg));
  --card-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --primary: var(--bs-primary, oklch(92.2% 0 0deg));
  --primary-foreground: var(--bs-surface, oklch(20.5% 0 0deg));
  --secondary: var(--bs-secondary, oklch(26.9% 0 0deg));
  --secondary-foreground: var(--bs-surface, oklch(98.5% 0 0deg));
  --muted: var(--bs-surface, oklch(26.9% 0 0deg));
  --muted-foreground: oklch(70.8% 0 0deg);
  --accent: var(--bs-accent, oklch(26.9% 0 0deg));
  --accent-foreground: var(--bs-text, oklch(98.5% 0 0deg));
  --border: oklch(100% 0 0deg / 10%);
  --input: oklch(100% 0 0deg / 15%);
  --ring: var(--bs-primary, oklch(55.6% 0 0deg));
  /* ... keep skeuo tokens, chart, sidebar, destructive as-is */
}
```

The skeuo tokens (`--skeuo-highlight`, etc.) already work correctly in `.dark`
and do not need changes.

**`src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx` (line 76):**

Replace `text-white` with `text-primary-foreground` so dot numbers contrast
against `bg-primary` in all themes.

### Files

- `src/styles.css`
- `src/components/questions/DotGroupQuestion/DotGroupQuestion.tsx`

## Section 2: iOS Brave `getVoices()` Crash Guard

### Approach

Create a single safe helper that filters out broken voice objects, used by all
call sites. The helper wraps `getVoices()` in a try/catch and filters out
null/undefined entries or entries without a valid `.name` property.

### Helper

```ts
function safeGetVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  try {
    return synth
      .getVoices()
      .filter((v) => v != null && typeof v.name === 'string');
  } catch {
    return [];
  }
}
```

The helper lives in `src/lib/speech/safe-get-voices.ts` and is imported by the
three consumers.

### Call sites to update

| File                                   | Lines  | Current call        |
| -------------------------------------- | ------ | ------------------- |
| `src/lib/speech/SpeechOutput.ts`       | 47, 67 | `synth.getVoices()` |
| `src/lib/speech/voices.ts`             | 10, 22 | `synth.getVoices()` |
| `src/routes/$locale/_app/settings.tsx` | 47     | `synth.getVoices()` |

### Files

- `src/lib/speech/safe-get-voices.ts` (new)
- `src/lib/speech/SpeechOutput.ts`
- `src/lib/speech/voices.ts`
- `src/routes/$locale/_app/settings.tsx`

## Section 3: Layered ErrorBoundary

### Approach

Two layers of error catching:

1. **Global ErrorBoundary** — a React class component wrapping the app content
   in `__root.tsx`. Catches anything that slips past route-level handling.
   Recovery action: `window.location.reload()`.

2. **Route-level error component** — set via `defaultErrorComponent` in the
   router config (`router.tsx`). Renders the error UI inside the existing layout
   (Header/Footer stay intact). Recovery action: `router.invalidate()` /
   `reset()`.

Both layers use a shared `RouteErrorFallback` UI component.

### Components

**`src/components/ErrorBoundary.tsx`** — React class component (required by
React's error boundary API). Wraps children, catches errors via
`componentDidCatch`, renders `RouteErrorFallback` with a reload action.

**`src/components/RouteErrorFallback.tsx`** — Shared fallback UI:

- Error message (generic user-friendly text, not the raw error)
- "Try again" button
- Styled with design tokens (`text-foreground`, `bg-background`) — works in
  light and dark mode
- Accepts `onRetry` prop for the recovery action

### Integration

**`src/routes/__root.tsx`:**

Wrap `ServiceWorkerProvider` children with `<ErrorBoundary>`:

```tsx
<body>
  <ErrorBoundary>
    <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
  </ErrorBoundary>
  ...
</body>
```

**`src/router.tsx`:**

Add `defaultErrorComponent` to the router config:

```tsx
createTanStackRouter({
  routeTree,
  defaultErrorComponent: RouteErrorFallback,
  // ... existing config
});
```

### Files

- `src/components/ErrorBoundary.tsx` (new)
- `src/components/RouteErrorFallback.tsx` (new)
- `src/routes/__root.tsx`
- `src/router.tsx`

## Relationship to Existing Specs

The dark mode fix in Section 1 overlaps with the approved spec at
`docs/superpowers/specs/2026-04-07-dark-mode-a11y-vr-design.md` (Section 1: CSS
Variable Architecture Fix). This spec narrows scope to just the `.dark` block
fix and the `DotGroupQuestion` hardcoded color. The broader custom game colour,
linting enforcement, and VR test work from that spec remain for a future branch.
