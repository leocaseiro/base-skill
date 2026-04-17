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

| Prop type                    | Control                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| String union / enum          | `control: { type: 'select' }` with `options: [...]` (or `'radio'` for ≤4 options) |
| Boolean                      | `control: 'boolean'`                                                              |
| Bounded number               | `control: { type: 'range', min, max, step }`                                      |
| Free-text                    | `control: 'text'`                                                                 |
| Color                        | `control: 'color'`                                                                |
| Multi-select array of unions | `control: 'multi-select'` with `options`                                          |
| Callback (`onFoo`)           | `control: false` (auto-mocked by global `argTypesRegex`)                          |
| JSX / ReactNode              | `control: false`                                                                  |

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
    onClick: { control: false }, // auto-mocked
  },
};
```

> **Don't add** `argTypes: { onClick: { action: 'clicked' } }` — `.storybook/preview.tsx` sets `actions: { argTypesRegex: '^on[A-Z].*' }` globally, which already wires every `onFoo` prop to the Actions panel. Adding it manually is harmless but noisy.

## Complex Object Props

When a component takes a config-shaped object (e.g., a game `config` with mode + difficulty + counts), do NOT expose the whole object as a single JSON control. Break each meaningful field into a top-level arg and assemble the object in a custom `render` function.

```tsx
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

const meta: Meta<StoryArgs> = {
  component: GameConfigForm,
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
