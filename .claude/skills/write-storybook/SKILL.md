---
name: write-storybook
description: Use when adding, writing, or refactoring Storybook stories for React components in this project — enforces the single-Playground pattern, controls policy, decorators, and a11y rules
---

# Write Storybook

## Overview

Stories live co-located with their component (`ComponentName.stories.tsx`). This project uses `@storybook/react` with TanStack Router and `next-themes`.

**The standard pattern is the "Playground"**: every component gets a **single `Playground` story** driven by proper interactive controls (selects, booleans, ranges, color pickers, text inputs). The control surface is the playground — designers, QA, and developers explore every UI behaviour by tweaking controls, not by clicking between a dozen named stories.

This pattern applies when:

1. Creating a new story file.
2. Auditing or refactoring an existing story file.
3. Making changes to a component whose UI/API surface affects its story.

Additional named stories are only added when a scenario genuinely **cannot** be expressed through the Playground's controls (see "When to Add Auxiliary Stories" below). Reference implementations:

- [AnswerGame.stories.tsx](../../../src/components/answer-game/AnswerGame/AnswerGame.stories.tsx)
- [InstructionsOverlay.stories.tsx](../../../src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx)
- [ProgressHUD.stories.tsx](../../../src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx)
- [EncouragementAnnouncer.stories.tsx](../../../src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx) (shows the trigger-button pattern for callbacks that can't be reached by controls alone)

## Rules

- **Always use `export default meta`** for the meta object (framework config file — the one exception to the named-export rule)
- **All story variants use named exports**: `export const Playground: Story = {}`
- Every story file **must include a `Playground` story** — every prop that affects UI must be driveable from its controls
- The Playground export **must be named exactly `Playground`** (not `Default`). Every reference story in this project uses this name — see [InstructionsOverlay](../../../src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx)
- Use `tags: ['autodocs']` in meta unless there's a reason not to
- Do NOT import `React` — JSX transform handles it
- Auxiliary named stories are allowed only when a scenario can't be expressed by toggling controls on `Playground` (see "When to Add Auxiliary Stories")

## File Structure

```
src/components/MyComponent.stories.tsx
```

## Minimal Template

The Playground pattern: a single `Playground` story, with every UI-affecting prop wired as a control on `meta`. Props are set once in `meta.args` so they serve as the Playground's baseline.

```tsx
import { fn } from 'storybook/test';
import { MyComponent } from './MyComponent';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  tags: ['autodocs'],
  args: {
    // Baseline values for the Playground — one place, drives Playground.
    onClick: fn(), // Actions panel logs every invocation (see "Callbacks & Listeners")
  },
  argTypes: {
    // A control for every non-callback, non-JSX prop. See "Controls Policy" below.
  },
};
export default meta;

type Story = StoryObj<typeof MyComponent>;

// The Playground. Empty body — it inherits meta.args and renders the
// interactive control surface.
export const Playground: Story = {};
```

Extra named stories are only added when a scenario can't be expressed by flipping controls on `Playground` — see "When to Add Auxiliary Stories".

## Decorators

Use decorators when the component depends on context providers:

| Needs                                                   | Decorator                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| TanStack Router (`useNavigate`, `Link`, params)         | `withRouter` from `../../.storybook/decorators/withRouter` |
| Database / RxDB (`useSettings`, `useRxDB`, any DB hook) | `withDb` from `../../.storybook/decorators/withDb`         |
| Theme toggle                                            | `withTheme` — already applied globally via `preview.tsx`   |
| ThemeProvider                                           | Already applied globally — do NOT add again                |
| Classic skin tokens (`--skin-*`)                        | Applied globally via `preview.tsx` — do NOT add again      |

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

## Playground Pattern

The goal: one `Playground` story where **every** UI behaviour is reachable by flipping controls. Designers and QA get a single URL to explore the full component surface.

### What belongs in `Playground`

- Every string-union / enum prop → `select` or `radio` control, so switching values swaps the visual in place.
- Every boolean prop → `boolean` control.
- Every bounded numeric prop → `range` control.
- Every text / list / color prop → appropriate control.
- Every callback → `fn()` spy in `args` (logs to [Actions panel](https://storybook.js.org/docs/essentials/actions)).
- Nested config objects → flattened into top-level args and reassembled in a `render` function (see "Complex Object Props").

If a UI behaviour isn't reachable through the Playground, the Playground is incomplete — add the control before adding a new story.

### When to Add Auxiliary Stories

Only add a named story beyond `Playground` when the scenario **cannot** be expressed by the Playground's control surface. Typical reasons:

- **Stateful wrappers that can't be modeled as a prop.** Example: `EncouragementAnnouncer` has a `ReplayTrigger` story because the component's `visible` prop is toggled by a local `useState` wrapper — the Playground shows the "start visible" state; `ReplayTrigger` shows the "user must click to show it" flow. Both are useful; neither is expressible purely through controls.
- **Pinned theme or viewport** that's meaningfully different (e.g., a high-contrast-only edge case). See "Themes per Story" and "Viewport per Story".
- **`play()` assertions** that drive a specific interaction sequence (see "Optional: Interaction Tests with `play()`").

Do **not** add auxiliary stories for:

- Per-enum-value snapshots (the `variant` select control already covers these).
- State variants like `Loading` / `Error` / `Empty` when those states are reachable by toggling a prop.
- Edge cases like `LongText` / `ManyItems` — change the value in the control; if it's a common demo input, add it as a preset via `argTypes: { foo: { options: [...], mapping: {...} } }` rather than a new story.
- **Alt-skin previews.** The classic skin is already applied globally (see "Default Skin Is Applied Globally"). If you need to preview a different skin, put it in a sibling `*.skin.stories.tsx` file — not as a named story in the main file.

Auxiliary story names use PascalCase and describe what they uniquely add: `ReplayTrigger`, `HighContrast`, `SubmitsValidForm`.

## Callbacks & Listeners

### Default: rely on the Actions panel

Wire every callback prop to a [`fn()` spy](https://storybook.js.org/docs/essentials/actions) from `storybook/test`:

```tsx
import { fn } from 'storybook/test';

const meta: Meta<typeof MyComponent> = {
  args: {
    onClick: fn(),
    onSubmit: fn(),
    onDismiss: fn(),
  },
};
```

The Actions panel logs every invocation with arguments — enough for most components to verify callbacks fire. The same spy is assertable from `play()` if you later add interaction tests.

> **Note:** `.storybook/preview.tsx` sets `actions.argTypesRegex: '^on[A-Z].*'` globally, but it only wires props already in `argTypes`. Since this repo uses the default react-docgen (which does not expand `React.ComponentProps<'button'>` and similar DOM-extended types), most handler props never appear in inferred `argTypes` — so the regex matches nothing for them. Always wire `fn()` explicitly.

### Add trigger buttons only when a callback can't be reached through controls

If a component subscribes to something, runs an effect, or fires a callback that the Playground's controls alone can't invoke, add a UI trigger button in the `render` function. Example: [EncouragementAnnouncer](../../../src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx) wraps the component in a `ShowTrigger` helper with "Show" + "Dismiss" buttons because the component's visibility is driven by a one-shot state transition that no single control can replay.

Rule of thumb: if you can observe the callback by toggling a control, use controls. If you need to replay a one-shot sequence (show → dismiss → show again) to see the effect run, add a trigger button.

## Optional: Interaction Tests with `play()`

`play()` is **optional** in this project. Visual regression and end-to-end coverage live in Playwright (`e2e/visual.spec.ts`, `e2e/*.spec.ts`) against live app routes — see "Visual Regression Boundary". `play()` remains useful as supplementary in-Storybook interaction assertions when:

- The component's primary flow is non-trivial and not already covered by an e2e test.
- You want an assertion (keyboard-only flow, validation error appearing, focus management) that the Actions panel can't express.

Add a `play()` to `Playground` when the interaction is central, or create a dedicated named story per flow. Skip `play()` for pure-display components or when e2e coverage already asserts the same behaviour.

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

## Default Skin Is Applied Globally

`.storybook/preview.tsx` registers a `withDefaultSkin` decorator that wraps every
story in:

```tsx
<div className="game-container skin-classic" style={classicSkin.tokens}>
  <Story />
</div>
```

Components that consume `--skin-*` tokens (tiles, slots, HUD, question bar,
celebration overlays) render with sensible defaults **without any per-file
wrapper**. Do not add your own classic-skin wrapper — it's redundant.

### Overriding the default skin

Alt-skin test files (`*.skin.stories.tsx` — see
`src/games/sort-numbers/SortNumbers/SortNumbers.skin.stories.tsx`) register a
different skin with `registerSkin('<gameId>', demoSkin)` and let the game
component mount its own inner `skin-${skin.id}` wrapper. CSS custom-property
cascade on the inner wrapper overrides the outer classic defaults — no opt-out
parameter or `decorators: []` override is needed.

If a future story needs to visually preview alt-skin tokens **without mounting
a game component** (e.g. a bare token-swatch preview), add an opt-out parameter
to `withDefaultSkin` at that time. Until then, YAGNI.

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

- [ ] A single `Playground` story exists and every UI-affecting prop is reachable from its controls (the Playground)
- [ ] All non-callback, non-JSX props have proper `argTypes` controls (no raw JSON for enums/booleans/numbers/colors)
- [ ] Every `onFoo` handler wired to a `fn()` spy in `args` (shows in [Actions panel](https://storybook.js.org/docs/essentials/actions); usable in `play()` if needed) — do NOT rely on the global `argTypesRegex` alone; it only covers props already in `argTypes`, which react-docgen doesn't produce for DOM-extended props
- [ ] Auxiliary named stories (if any) exist only for scenarios the Playground's controls can't express — see "When to Add Auxiliary Stories". Remove named stories that duplicate what a control toggle would show.
- [ ] Callbacks that can't be triggered via controls have a UI trigger button in `render` (see "Callbacks & Listeners"); otherwise Actions panel is enough
- [ ] `play()` is used only where it adds assertion value not covered by Playwright e2e — it's optional, not required
- [ ] Decorators match current component dependencies (e.g., if the component started using `useSettings`, `withDb` is now required)
- [ ] No per-file classic-skin wrapper (`<div className="game-container skin-classic" style={classicSkin.tokens}>`) — the global `withDefaultSkin` decorator already applies this. Remove inline wrappers; keep `classicSkin` imports only if passed as a component prop.
- [ ] No `parameters.chromatic` (we don't use it)
- [ ] Story file passes `yarn test:storybook --url <port>` locally

If you're touching the file, leave it better than you found it.

## Common Mistakes

| Mistake                                                  | Fix                                                                                                                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import React from 'react'` at top                       | Remove — not needed                                                                                                                                                                                     |
| Named export for meta (`export const meta`)              | Use `export default meta`                                                                                                                                                                               |
| Default export for stories (`export default Playground`) | Use `export const Playground: Story = {}`                                                                                                                                                               |
| Story export named `Default`                             | Use `Playground` — the canonical name across all reference stories (InstructionsOverlay, AnswerGame, ProgressHUD, Footer, Header, etc.). The pattern is _called_ "Playground"; the export name matches. |
| Missing `Playground` story                               | Always add one — it is the Playground                                                                                                                                                                   |
| Multiple stories duplicating what a control would toggle | Delete them; wire the prop as a control on `Playground` instead (see "Playground Pattern")                                                                                                              |
| Named story for every enum value                         | Use a `select`/`radio` control; enum-per-value stories are only justified for pinned-theme/viewport or `play()` assertions                                                                              |
| Callback only reachable by a one-shot interaction        | Add a trigger button in `render` (see EncouragementAnnouncer) — don't rely on a static prop                                                                                                             |
| Forgetting `withRouter` for routing components           | Check if component calls `useNavigate`, `Link`, or reads route params                                                                                                                                   |
| Forgetting `withDb` for DB/settings hooks                | Check if component (or any provider it uses) calls `useRxDB`, `useSettings`, or any DB hook — includes `AnswerGameProvider` which calls `useGameTTS` → `useSettings` → `useRxDB`                        |
| Adding `ThemeProvider` decorator                         | Already global — skip                                                                                                                                                                                   |
| `SKIP_STORYBOOK=1` because port 6006 is in use           | Find a free port and start your own instance — never skip to avoid a conflict                                                                                                                           |
| Running `yarn test:storybook` without `--url`            | Without `--url` it defaults to 6006 and may hit the wrong agent's Storybook                                                                                                                             |
| Raw JSON control for an enum/union prop                  | Add `argTypes` with `select`/`radio` and explicit `options`                                                                                                                                             |
| Whole-config JSON blob as a single control               | Break into individual args + custom `render` (see "Complex Object Props")                                                                                                                               |
| Relying on global `argTypesRegex` for Actions panel      | Doesn't work for DOM-extended props under react-docgen — wire `args: { onFoo: fn() }` from `storybook/test` explicitly                                                                                  |
| Adding `parameters.chromatic`                            | Remove — VR is in `e2e/visual.spec.ts`, not Storybook                                                                                                                                                   |
| Trying to opt out of a11y on a new story                 | Don't — it's enforced. Fix the violation, or use `test: 'todo'` only with documented justification                                                                                                      |
| Inlining `Math.random()` results in story args           | Pin via `globalThis.Math.random = () => N` inside `play()` for reproducibility                                                                                                                          |
