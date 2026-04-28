---
name: write-storybook
description: Use when adding or writing Storybook stories for React components in this project — covers file structure, meta config, named exports, decorators, and required variants
---

# Write Storybook

## Overview

Stories live co-located with their component (`ComponentName.stories.tsx`). Each story file exports a `default` meta object and named `Story` exports for each variant. This project uses `@storybook/react` with TanStack Router and `next-themes`.

## Rules

- **Always use `export default meta`** for the meta object (framework config file — the one exception to the named-export rule)
- **All story variants use named exports**: `export const Default: Story = {}`
- Every story file **must include a `Default` story**
- Use `tags: ['autodocs']` in meta unless there's a reason not to
- Do NOT import `React` — JSX transform handles it

## File Structure

```
src/components/MyComponent.stories.tsx
```

## Minimal Template

```tsx
import { MyComponent } from './MyComponent';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  tags: ['autodocs'],
  args: {
    // shared default props
  },
  argTypes: {
    // Add a control for every non-callback, non-JSX prop. See "Controls Policy" below.
  },
};
export default meta;

type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {};

export const SomeVariant: Story = {
  args: { propName: value },
};
```

## Decorators

Use decorators when the component depends on context providers:

| Needs                                                   | Decorator                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| TanStack Router (`useNavigate`, `Link`, params)         | `withRouter` from `../../.storybook/decorators/withRouter` |
| Database / RxDB (`useSettings`, `useRxDB`, any DB hook) | `withDb` from `../../.storybook/decorators/withDb`         |
| Theme toggle                                            | `withTheme` — already applied globally via `preview.tsx`   |
| ThemeProvider                                           | Already applied globally — do NOT add again                |

When both are needed, put `withDb` first (outermost), then `withRouter`:

```tsx
import { withDb } from '../../.storybook/decorators/withDb';
import { withRouter } from '../../.storybook/decorators/withRouter';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
};
```

When a story wraps in `AnswerGameProvider`, `withDb` must come **before** the provider wrapper:

```tsx
decorators: [
  withDb,
  (Story) => (
    <AnswerGameProvider config={storyConfig}>
      <Story />
    </AnswerGameProvider>
  ),
],
```

## Controls Policy

Every prop that isn't a callback, JSX node, or complex object MUST have an explicit `argTypes` entry with a proper interactive control. **Raw JSON object inputs in the Controls panel are not acceptable** — they make stories useless as a playground for designers and QA.

### Mapping

| Prop type                    | Control                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| String union / enum          | `control: { type: 'select' }` with `options: [...]` (or `'radio'` for ≤4 options)               |
| Boolean                      | `control: 'boolean'`                                                                            |
| Bounded number               | `control: { type: 'range', min, max, step }`                                                    |
| Free-text                    | `control: 'text'`                                                                               |
| Color                        | `control: 'color'`                                                                              |
| Multi-select array of unions | `control: 'multi-select'` with `options`                                                        |
| Callback (`onFoo`)           | `args: { onFoo: fn() }` from `storybook/test` (spy shows in Actions panel + usable in `play()`) |
| JSX / ReactNode              | `control: false`                                                                                |

### Example

```tsx
const meta: Meta<typeof MyButton> = {
  component: MyButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'radio' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    rounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    icon: { control: false }, // ReactNode
  },
  args: {
    onClick: fn(), // from 'storybook/test' — spy shows in Actions panel + usable in play()
  },
};
```

> **Why `fn()` and not `argTypes: { onClick: { action: 'clicked' } }`?** Both log to the Actions panel, but `fn()` doubles as a spy you can assert on from `play()` (`await expect(args.onClick).toHaveBeenCalled()`). Prefer `fn()` for consistency.
>
> **Note:** `.storybook/preview.tsx` sets `actions.argTypesRegex: '^on[A-Z].*'` globally, but it only wires props already in `argTypes`. Since this repo uses the default react-docgen (which does not expand `React.ComponentProps<'button'>` and similar DOM-extended types), most handler props never appear in inferred `argTypes` — so the regex matches nothing for them. Always wire `fn()` explicitly.

## Complex Object Props

When a component takes a config-shaped object (e.g., a game `config` with mode + difficulty + counts), do NOT expose the whole object as a single JSON control. Break each meaningful field into a top-level arg and assemble the object in a custom `render` function.

```tsx
import { type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GameConfigForm } from './GameConfigForm';

type GameMode = 'easy' | 'hard';

interface GameConfig {
  mode: GameMode;
  rounds: number;
}

interface GameConfigFormProps {
  config: GameConfig;
  onSubmit: (config: GameConfig) => void;
}

interface StoryArgs {
  mode: GameMode;
  rounds: number;
  onSubmit: (config: GameConfig) => void;
}

// Double cast required: StoryArgs is a flat subset of GameConfigFormProps,
// so TypeScript requires `as unknown as ComponentType<StoryArgs>` to bridge
// the incompatible shapes. This is safe because the render function fully
// controls how StoryArgs maps to props — component is only used for autodocs.
const meta: Meta<StoryArgs> = {
  component: GameConfigForm as unknown as ComponentType<StoryArgs>,
  args: {
    mode: 'easy',
    rounds: 5,
  },
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['easy', 'hard'] satisfies GameMode[],
    },
    rounds: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
  },
  render: ({ mode, rounds, onSubmit }) => (
    <GameConfigForm config={{ mode, rounds }} onSubmit={onSubmit} />
  ),
};
```

The Controls panel now shows individual `mode` and `rounds` inputs, and the rendered story reflects them. Reuse this pattern for any nested object — never let a JSON blob appear in Controls.

## Required Variants

Every story file MUST cover the following, treating each as a gate. If you decide to skip one, comment why in the story file.

- **`Default`** — happy path, all required props supplied.
- **One story per enum value** of any string-union prop, _if_ the visual differs by value. Identical pixels across values? Skip and document.
- **State variants** — one story per distinct visible state the component can render: `Loading`, `Error`, `Empty`, `Disabled`, `Submitted`, `ReadOnly`, etc.
- **Edge cases** — at least one for components that take user-controllable text or list props: `LongText`, `ManyItems`, `OneItem`, `MaxLength`. These catch overflow, truncation, and layout regressions.
- **Interaction** — at least one `play()` story exercising the primary user flow (see "Rich Interaction with `play()`" below). Pure-display components (icons, labels) are exempt.

Story names use PascalCase and describe the _state_, not the prop combination: prefer `LoadingWithItems` over `LoadingTrueAndItemsArray`.

## Rich Interaction with `play()`

Every interactive component (forms, dialogs, anything with click or keyboard handlers) MUST have at least one `play()` story exercising the primary flow. Pure-display components are exempt.

Import helpers from `storybook/test`:

```tsx
import { userEvent, within, expect } from 'storybook/test';
```

### Patterns

**Form submit happy path:**

```tsx
export const SubmitsValidName: Story = {
  args: { mode: 'create' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'My Game');
    await userEvent.click(
      canvas.getByRole('button', { name: /save/i }),
    );
    await expect(canvas.getByText(/saved/i)).toBeVisible();
  },
};
```

**Form validation:**

```tsx
export const ShowsErrorOnEmptyName: Story = {
  args: { mode: 'create' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /save/i }),
    );
    await expect(canvas.getByText(/name is required/i)).toBeVisible();
    await expect(canvas.getByLabelText('Name')).toHaveFocus();
  },
};
```

**Disabled-state assertion:**

```tsx
export const SubmitDisabledWhenInvalid: Story = {
  args: { mode: 'create' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /save/i }),
    ).toBeDisabled();
  },
};
```

**Keyboard-only flow:**

```tsx
export const ClosesOnEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};
```

### Naming Convention

Name interaction stories after the flow, not the input: `SubmitsValidForm`, `ShowsErrorOnEmptyName`, `ClosesOnEscape`. Keep them small and single-purpose — one assertion path per story makes failures self-explanatory.

## A11y Is Enforced

`.storybook/preview.tsx` sets `parameters.a11y.test: 'error'` globally. Every story is axe-checked, and any violation (including color-contrast) **fails `yarn test:storybook` and CI**. You cannot opt out for a new story.

To tune a story that legitimately needs a violation (e.g., demonstrating fallback rendering of broken markup), override at the story level — sparingly, with a comment explaining why:

```tsx
export const LegacyMarkup: Story = {
  args: {
    /* ... */
  },
  // Demonstrates the deprecated <table> layout we still support for
  // in-flight content; axe correctly flags the missing <th>.
  parameters: { a11y: { test: 'todo' } },
};
```

The default behavior is the right one — fix the violation in the component or in the story args before reaching for `test: 'todo'`.

## Themes per Story

Five themes are registered as global toolbar items in `.storybook/preview.tsx`: `light` (default), `dark`, `forest-light`, `forest-dark`, `high-contrast`. The toolbar lets users switch interactively.

Pin a story to a specific theme when a variant is meaningfully different in that theme (e.g., a high-contrast-only edge case):

```tsx
export const HighContrast: Story = {
  globals: { theme: 'high-contrast' },
};
```

Don't add a `Dark` story for every component — the toolbar already covers that. Add per-story theme pins only when the variant exercises something theme-specific.

## Viewport per Story

Five viewports are registered globally in `.storybook/preview.tsx`:

| Name              | Size                 |
| ----------------- | -------------------- |
| `mobileSm`        | 360×640              |
| `mobileLg`        | 390×844              |
| `tabletPortrait`  | 768×1024             |
| `tabletLandscape` | 1024×768 _(default)_ |
| `desktop`         | 1280×800             |

Pin a story when a layout meaningfully differs at a breakpoint:

```tsx
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobileSm' } },
};
```

The toolbar lets users switch interactively, so add per-story viewport pins only when the variant is breakpoint-specific.

## Mocking & Fixtures

### Fixtures

Don't inline large data blobs (word lists, configs, sample sentences) in stories. Move them to a co-located file and import:

```tsx
// MyComponent.fixtures.ts
export const longWordList = ['antidisestablishmentarianism' /* ... */];

// MyComponent.stories.tsx
import { longWordList } from './MyComponent.fixtures';

export const ManyItems: Story = {
  args: { items: longWordList },
};
```

There is no top-level `src/test/fixtures/` directory in the project; co-locate by default. If a fixture is reused across components, lift it to a sibling shared file when the second consumer appears, not before.

### Randomness in `play()`

For reproducible interaction tests, stub `Math.random` inside `play()`:

```tsx
export const PicksTheFirstOption: Story = {
  play: async ({ canvasElement }) => {
    globalThis.Math.random = () => 0.42;
    // ... drive the interaction
  },
};
```

This mirrors the pattern in `e2e/visual.spec.ts` and `e2e/seed-math-random.ts`.

### Timers

Use `vi.useFakeTimers()` from Vitest if a story needs to advance time (the Storybook test-runner shares the Vitest runtime).

### Network

There is no MSW addon installed. If a story needs network mocking, install `msw-storybook-addon` first and document the addition; until then, prefer prop-injecting the data the component would have fetched.

## Visual Regression Boundary

**Stories are NOT a VR mechanism in this project.** Visual regression is hand-curated Playwright tests in `e2e/visual.spec.ts` that drive the live app routes through Docker (`yarn test:vr`). Adding a new story does not add a VR snapshot.

What this means for authors:

- Do **not** add `parameters: { chromatic: ... }` to stories — chromatic is not configured.
- If a new component or visual state needs regression coverage, add a `test('@visual …', …)` block in `e2e/visual.spec.ts` that loads the relevant route (`/en/game/...`, etc.) and calls `expect(page).toHaveScreenshot(...)`.
- Storybook covers development, manual review, a11y, and `play()` interaction tests. VR covers pixel guards on user-facing routes. The two layers don't overlap.

Mounting components directly in Playwright (component testing) is not currently set up; if a future story needs an isolated VR shot, add Playwright Component Testing to the project first.

## Running Storybook Tests

Multiple agents may be running Storybook simultaneously (e.g. parallel worktrees). **Never assume an existing Storybook instance is yours.** Always start a fresh one.

### Workflow

```bash
# 1. Find a free port (start at 6006, scan upward)
PORT=6006
while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done

# 2. Start Storybook on that port
yarn storybook --port $PORT --ci &
STORYBOOK_PID=$!

# 3. Wait until it responds
until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done

# 4. Run tests against that port
yarn test:storybook --url http://127.0.0.1:$PORT
TEST_EXIT=$?

# 5. Kill only on success — leave running on failure so you can debug
if [ $TEST_EXIT -eq 0 ]; then
  kill $STORYBOOK_PID
fi

exit $TEST_EXIT
```

### Rules

- **Always start your own instance** — never use a Storybook you didn't start
- **Always pass `--url`** when running `yarn test:storybook` so it targets your port
- **Kill on green, leave on red** — a running Storybook lets you inspect failures in the browser
- **Never use `SKIP_STORYBOOK=1` to work around a port conflict** — that skips the tests entirely; find a free port instead

## Audit / Upgrade Checklist

When you edit an existing story file for any reason, run this checklist before opening the PR. Each item is a yes/no gate — if any answer is "no," either fix or justify in the PR description.

- [ ] All non-callback, non-JSX props have proper `argTypes` controls (no raw JSON for enums/booleans/numbers/colors)
- [ ] Every `onFoo` handler wired to a `fn()` spy in `args` (shows in Actions panel + usable in `play()`) — do NOT rely on the global `argTypesRegex` alone; it only covers props already in `argTypes`, which react-docgen doesn't produce for DOM-extended props
- [ ] No `{ action: '...' }` for `onFoo` handlers — use `fn()` from `storybook/test` instead (it doubles as a spy)
- [ ] Required variants are present (Default, enum-per-value where the visual differs, state variants, edge cases — see "Required Variants")
- [ ] At least one `play()` interaction story if the component is interactive
- [ ] Decorators match current component dependencies (e.g., if the component started using `useSettings`, `withDb` is now required)
- [ ] No `parameters.chromatic` (we don't use it)
- [ ] Story file passes `yarn test:storybook --url <port>` locally

If you're touching the file, leave it better than you found it.

## Common Mistakes

| Mistake                                               | Fix                                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import React from 'react'` at top                    | Remove — not needed                                                                                                                                                              |
| Named export for meta (`export const meta`)           | Use `export default meta`                                                                                                                                                        |
| Default export for stories (`export default Default`) | Use `export const Default: Story = {}`                                                                                                                                           |
| Missing `Default` story                               | Always add one                                                                                                                                                                   |
| Forgetting `withRouter` for routing components        | Check if component calls `useNavigate`, `Link`, or reads route params                                                                                                            |
| Forgetting `withDb` for DB/settings hooks             | Check if component (or any provider it uses) calls `useRxDB`, `useSettings`, or any DB hook — includes `AnswerGameProvider` which calls `useGameTTS` → `useSettings` → `useRxDB` |
| Adding `ThemeProvider` decorator                      | Already global — skip                                                                                                                                                            |
| `SKIP_STORYBOOK=1` because port 6006 is in use        | Find a free port and start your own instance — never skip to avoid a conflict                                                                                                    |
| Running `yarn test:storybook` without `--url`         | Without `--url` it defaults to 6006 and may hit the wrong agent's Storybook                                                                                                      |
| Raw JSON control for an enum/union prop               | Add `argTypes` with `select`/`radio` and explicit `options`                                                                                                                      |
| Whole-config JSON blob as a single control            | Break into individual args + custom `render` (see "Complex Object Props")                                                                                                        |
| Relying on global `argTypesRegex` for Actions panel   | Doesn't work for DOM-extended props under react-docgen — wire `args: { onFoo: fn() }` from `storybook/test` explicitly                                                           |
| Adding `parameters.chromatic`                         | Remove — VR is in `e2e/visual.spec.ts`, not Storybook                                                                                                                            |
| Trying to opt out of a11y on a new story              | Don't — it's enforced. Fix the violation, or use `test: 'todo'` only with documented justification                                                                               |
| Inlining `Math.random()` results in story args        | Pin via `globalThis.Math.random = () => N` inside `play()` for reproducibility                                                                                                   |
