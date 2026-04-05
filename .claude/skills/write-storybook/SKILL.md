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
    onSomeAction: { action: 'someAction' },
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

## Required Story Variants

Cover these states to give Storybook meaningful value:

- **Default** — happy path, all required props
- **Empty / no data** — if component renders a list or optional content
- **Loading / error** — if component has async states
- **Edge case** — long text, zero items, boundary values
- **Interaction states** — selected, bookmarked, disabled, etc.

## argTypes for Event Handlers

Any prop starting with `on` should use `{ action: '...' }`:

```tsx
argTypes: {
  onBookmarkToggle: { action: 'bookmarkToggled' },
  onPlay: { action: 'played' },
},
```

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
