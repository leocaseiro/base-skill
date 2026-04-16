# Comprehensive `write-storybook` Skill Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `.claude/skills/write-storybook/SKILL.md` to be the durable contract for Storybook authoring in this project — proper controls, rich `play()` interaction, project-specific addon usage, and an upgrade checklist for existing stories.

**Architecture:** Single-file documentation edit. New sections inserted at specific anchor points; one stale section removed; one section refined; one section refreshed. Each task ships one topical chunk and one commit. Final task validates by writing a canary story that exercises the new conventions, running the storybook test runner against it, then deleting the canary.

**Tech Stack:** Markdown (markdownlint + Prettier), Storybook 10.3.3 (`@storybook/react-vite`), `@storybook/test`, `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/test-runner`.

**Spec:** `docs/superpowers/specs/2026-04-16-write-storybook-skill-comprehensive-design.md`

---

## File Inventory

- **Modify:** `.claude/skills/write-storybook/SKILL.md` (the only persistent change)
- **Temporary (created and deleted in Task 6):** `src/components/__canary__/CanaryStory.tsx` and `src/components/__canary__/CanaryStory.stories.tsx`

## Anchor Points in Current SKILL.md

The current file has these sections (verified by `Read` at planning time):

| Line | Heading                                                             |
| ---- | ------------------------------------------------------------------- |
| 8    | `## Overview`                                                       |
| 12   | `## Rules`                                                          |
| 21   | `## File Structure`                                                 |
| 27   | `## Minimal Template`                                               |
| 53   | `## Decorators`                                                     |
| 90   | `## Required Story Variants` (REFINE)                               |
| 100  | `## argTypes for Event Handlers` (REMOVE — covered by global regex) |
| 111  | `## Running Storybook Tests`                                        |
| 148  | `## Common Mistakes` (REFRESH — append rows)                        |

Final ordering after this plan:

1. Overview · 2. Rules · 3. File Structure · 4. Minimal Template · 5. Decorators · 6. **Controls Policy** · 7. **Complex Object Props** · 8. Required Variants (refined) · 9. **Rich Interaction with `play()`** · 10. **A11y Is Enforced** · 11. **Themes per Story** · 12. **Viewport per Story** · 13. **Mocking & Fixtures** · 14. **Visual Regression Boundary** · 15. Running Storybook Tests · 16. **Audit / Upgrade Checklist** · 17. Common Mistakes (refreshed)

---

## Task 1: Controls Foundation

Adds Controls Policy + Complex Object Props. Removes the stale "argTypes for Event Handlers" section. Updates the Minimal Template to drop the per-handler `{ action }` example.

**Files:**

- Modify: `.claude/skills/write-storybook/SKILL.md`

- [ ] **Step 1.1 — Update the Minimal Template `argTypes` block**

  Replace the existing `argTypes` block in the Minimal Template (currently around lines 38-40) so it does NOT show the handler-action pattern:

  Find:

  ```tsx
    argTypes: {
      onSomeAction: { action: 'someAction' },
    },
  ```

  Replace with:

  ```tsx
    argTypes: {
      // Add a control for every non-callback, non-JSX prop. See "Controls Policy" below.
    },
  ```

- [ ] **Step 1.2 — Remove the stale "argTypes for Event Handlers" section**

  Delete the heading and code block currently at lines 100-109 (the `## argTypes for Event Handlers` section, including the blank lines around it). It conflicts with the global `argTypesRegex` setting in `.storybook/preview.tsx`.

- [ ] **Step 1.3 — Insert "Controls Policy" section after Decorators**

  Insert the following block after the `## Decorators` section (which currently ends around line 88, before what is now `## Required Story Variants`):

  ````markdown
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
  ````

- [ ] **Step 1.4 — Insert "Complex Object Props" section right after Controls Policy**

  Insert immediately after the section added in Step 1.3:

  ````markdown
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

  const meta: Meta<GameConfigFormProps & GameConfig> = {
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
      config: { control: false },
    },
    render: ({ mode, rounds, ...rest }) => (
      <GameConfigForm config={{ mode, rounds }} {...rest} />
    ),
  };
  ```

  The Controls panel now shows individual `mode` and `rounds` inputs, and the rendered story reflects them. Reuse this pattern for any nested object — never let a JSON blob appear in Controls.
  ````

- [ ] **Step 1.5 — Lint and commit**

  Run:

  ```bash
  yarn fix:md && yarn lint:md
  ```

  Expected: `Summary: 0 error(s)`.

  Commit:

  ```bash
  git add .claude/skills/write-storybook/SKILL.md
  git commit -m "$(cat <<'EOF'
  docs(skill): controls policy and complex object props

  Adds the Controls Policy mapping + Complex Object Props sections to the
  write-storybook skill. Removes the stale 'argTypes for Event Handlers'
  block — global argTypesRegex in .storybook/preview.tsx already covers it.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Required Variants and Rich Interaction

Replaces the loose "Required Story Variants" list with explicit gates. Adds the `play()` interaction patterns section right after.

**Files:**

- Modify: `.claude/skills/write-storybook/SKILL.md`

- [ ] **Step 2.1 — Replace "Required Story Variants" with the refined version**

  Find the `## Required Story Variants` section and its body (currently lines 90-98). Replace the entire section with:

  ```markdown
  ## Required Variants

  Every story file MUST cover the following, treating each as a gate. If you decide to skip one, comment why in the story file.

  - **`Default`** — happy path, all required props supplied.
  - **One story per enum value** of any string-union prop, _if_ the visual differs by value. Identical pixels across values? Skip and document.
  - **State variants** — one story per distinct visible state the component can render: `Loading`, `Error`, `Empty`, `Disabled`, `Submitted`, `ReadOnly`, etc.
  - **Edge cases** — at least one for components that take user-controllable text or list props: `LongText`, `ManyItems`, `OneItem`, `MaxLength`. These catch overflow, truncation, and layout regressions.
  - **Interaction** — at least one `play()` story exercising the primary user flow (see "Rich Interaction with `play()`" below). Pure-display components (icons, labels) are exempt.

  Story names use PascalCase and describe the _state_, not the prop combination: prefer `LoadingWithItems` over `LoadingTrueAndItemsArray`.
  ```

- [ ] **Step 2.2 — Insert "Rich Interaction with `play()`" right after Required Variants**

  Insert immediately after the section added in Step 2.1:

  ````markdown
  ## Rich Interaction with `play()`

  Every interactive component (forms, dialogs, anything with click or keyboard handlers) MUST have at least one `play()` story exercising the primary flow. Pure-display components are exempt.

  Import helpers from `@storybook/test`:

  ```tsx
  import { userEvent, within, expect } from '@storybook/test';
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
  ````

- [ ] **Step 2.3 — Lint and commit**

  ```bash
  yarn fix:md && yarn lint:md
  ```

  Expected: `Summary: 0 error(s)`.

  ```bash
  git add .claude/skills/write-storybook/SKILL.md
  git commit -m "$(cat <<'EOF'
  docs(skill): refine required variants, add rich play() interaction

  Replaces the loose required-variants list with explicit gates (default,
  one-per-enum-value, state variants, edge cases, interaction). Adds a
  play() patterns section with form, validation, disabled, and keyboard
  examples.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Enforcement and Per-Story Configuration

Adds A11y, Themes, and Viewport sections. These describe how to use the global `.storybook/preview.tsx` config rather than redefining it.

**Files:**

- Modify: `.claude/skills/write-storybook/SKILL.md`

- [ ] **Step 3.1 — Insert "A11y Is Enforced" after the "Rich Interaction with `play()`" section**

  ````markdown
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
  ````

- [ ] **Step 3.2 — Insert "Themes per Story" right after**

  ````markdown
  ## Themes per Story

  Five themes are registered as global toolbar items in `.storybook/preview.tsx`: `light` (default), `dark`, `forest-light`, `forest-dark`, `high-contrast`. The toolbar lets users switch interactively.

  Pin a story to a specific theme when a variant is meaningfully different in that theme (e.g., a high-contrast-only edge case):

  ```tsx
  export const HighContrast: Story = {
    globals: { theme: 'high-contrast' },
  };
  ```

  Don't add a `Dark` story for every component — the toolbar already covers that. Add per-story theme pins only when the variant exercises something theme-specific.
  ````

- [ ] **Step 3.3 — Insert "Viewport per Story" right after**

  ````markdown
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
  ````

- [ ] **Step 3.4 — Lint and commit**

  ```bash
  yarn fix:md && yarn lint:md
  ```

  Expected: `Summary: 0 error(s)`.

  ```bash
  git add .claude/skills/write-storybook/SKILL.md
  git commit -m "$(cat <<'EOF'
  docs(skill): a11y enforcement, themes, viewport per story

  Documents that a11y is globally enforced (axe failures fail CI) and how
  to override sparingly. Adds the 5 registered themes and 5 viewports with
  per-story pin examples.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Mocking and Visual Regression Boundary

Adds Mocking & Fixtures and the explicit Stories≠VR boundary section.

**Files:**

- Modify: `.claude/skills/write-storybook/SKILL.md`

- [ ] **Step 4.1 — Insert "Mocking & Fixtures" after the "Viewport per Story" section**

  ````markdown
  ## Mocking & Fixtures

  ### Fixtures

  Don't inline large data blobs (word lists, configs, sample sentences) in stories. Move them to a co-located file and import:

  ```tsx
  // MyComponent.fixtures.ts
  export const longWordList = [
    'antidisestablishmentarianism' /* ... */,
  ];

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
  ````

- [ ] **Step 4.2 — Insert "Visual Regression Boundary" right after**

  ```markdown
  ## Visual Regression Boundary

  **Stories are NOT a VR mechanism in this project.** Visual regression is hand-curated Playwright tests in `e2e/visual.spec.ts` that drive the live app routes through Docker (`yarn test:vr`). Adding a new story does not add a VR snapshot.

  What this means for authors:

  - Do **not** add `parameters: { chromatic: ... }` to stories — chromatic is not configured.
  - If a new component or visual state needs regression coverage, add a `test('@visual …', …)` block in `e2e/visual.spec.ts` that loads the relevant route (`/en/game/...`, etc.) and calls `expect(page).toHaveScreenshot(...)`.
  - Storybook covers development, manual review, a11y, and `play()` interaction tests. VR covers pixel guards on user-facing routes. The two layers don't overlap.

  Mounting components directly in Playwright (component testing) is not currently set up; if a future story needs an isolated VR shot, add Playwright Component Testing to the project first.
  ```

- [ ] **Step 4.3 — Lint and commit**

  ```bash
  yarn fix:md && yarn lint:md
  ```

  Expected: `Summary: 0 error(s)`.

  ```bash
  git add .claude/skills/write-storybook/SKILL.md
  git commit -m "$(cat <<'EOF'
  docs(skill): fixtures, randomness, and stories≠VR boundary

  Adds a Mocking & Fixtures section (co-located fixtures, Math.random
  stubs in play(), Vitest fake timers, MSW gap) and an explicit boundary:
  stories do not generate VR snapshots — visual regression lives in
  e2e/visual.spec.ts.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Audit Checklist and Refreshed Mistakes Table

Adds the upgrade checklist after "Running Storybook Tests" and appends new rows to the Common Mistakes table.

**Files:**

- Modify: `.claude/skills/write-storybook/SKILL.md`

- [ ] **Step 5.1 — Insert "Audit / Upgrade Checklist" after the "Running Storybook Tests" section, before "Common Mistakes"**

  ```markdown
  ## Audit / Upgrade Checklist

  When you edit an existing story file for any reason, run this checklist before opening the PR. Each item is a yes/no gate — if any answer is "no," either fix or justify in the PR description.

  - [ ] All non-callback, non-JSX props have proper `argTypes` controls (no raw JSON for enums/booleans/numbers/colors)
  - [ ] No manual `{ action: '...' }` for `onFoo` handlers (global `argTypesRegex` covers it)
  - [ ] Required variants are present (Default, enum-per-value where the visual differs, state variants, edge cases — see "Required Variants")
  - [ ] At least one `play()` interaction story if the component is interactive
  - [ ] Decorators match current component dependencies (e.g., if the component started using `useSettings`, `withDb` is now required)
  - [ ] No `parameters.chromatic` (we don't use it)
  - [ ] Story file passes `yarn test:storybook --url <port>` locally

  If you're touching the file, leave it better than you found it.
  ```

- [ ] **Step 5.2 — Append rows to the Common Mistakes table**

  Find the existing `## Common Mistakes` table. Add these rows at the bottom (preserve the existing rows above them):

  ```markdown
  | Raw JSON control for an enum/union prop | Add `argTypes` with `select`/`radio` and explicit `options` |
  | Whole-config JSON blob as a single control | Break into individual args + custom `render` (see "Complex Object Props") |
  | Manually adding `argTypes: { onFoo: { action: 'foo' } }` | Remove — global `argTypesRegex` already covers it |
  | Adding `parameters.chromatic` | Remove — VR is in `e2e/visual.spec.ts`, not Storybook |
  | Trying to opt out of a11y on a new story | Don't — it's enforced. Fix the violation, or use `test: 'todo'` only with documented justification |
  | Inlining `Math.random()` results in story args | Pin via `globalThis.Math.random = () => N` inside `play()` for reproducibility |
  ```

- [ ] **Step 5.3 — Lint and commit**

  ```bash
  yarn fix:md && yarn lint:md
  ```

  Expected: `Summary: 0 error(s)`.

  ```bash
  git add .claude/skills/write-storybook/SKILL.md
  git commit -m "$(cat <<'EOF'
  docs(skill): upgrade checklist and refreshed mistakes table

  Adds an Audit/Upgrade Checklist (yes/no gates for editing existing
  stories) and appends six new rows to Common Mistakes covering JSON
  controls, JSON blobs, redundant action wiring, chromatic, a11y opt-outs,
  and unstubbed Math.random.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Canary Verification

Validates the new skill end-to-end by writing one canary story that exercises every new convention (proper controls, complex-object render, `play()` interaction, theme/viewport pins) and confirming it passes both `yarn typecheck` and `yarn test:storybook`. The canary is then deleted — only the SKILL.md changes remain in the branch.

**Files:**

- Create (temporary): `src/components/__canary__/CanaryButton.tsx`
- Create (temporary): `src/components/__canary__/CanaryButton.stories.tsx`
- Delete after verification: both files above

- [ ] **Step 6.1 — Create the canary component**

  Path: `src/components/__canary__/CanaryButton.tsx`

  ```tsx
  import { useState } from 'react';

  export type CanaryVariant = 'primary' | 'secondary' | 'ghost';

  export interface CanaryConfig {
    variant: CanaryVariant;
    rounds: number;
  }

  export interface CanaryButtonProps {
    config: CanaryConfig;
    label: string;
    disabled?: boolean;
    onSubmit: (config: CanaryConfig) => void;
  }

  export const CanaryButton = ({
    config,
    label,
    disabled = false,
    onSubmit,
  }: CanaryButtonProps) => {
    const [submitted, setSubmitted] = useState(false);
    const handleClick = () => {
      onSubmit(config);
      setSubmitted(true);
    };
    return (
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          aria-label={label}
        >
          {label} ({config.variant} × {config.rounds})
        </button>
        {submitted && <p role="status">Submitted</p>}
      </div>
    );
  };
  ```

- [ ] **Step 6.2 — Create the canary story exercising every new convention**

  Path: `src/components/__canary__/CanaryButton.stories.tsx`

  ```tsx
  import { expect, userEvent, within } from '@storybook/test';
  import {
    CanaryButton,
    type CanaryConfig,
    type CanaryVariant,
  } from './CanaryButton';
  import type { Meta, StoryObj } from '@storybook/react';

  type StoryArgs = {
    variant: CanaryVariant;
    rounds: number;
    label: string;
    disabled: boolean;
  };

  const meta: Meta<StoryArgs> = {
    component: CanaryButton,
    tags: ['autodocs'],
    args: {
      variant: 'primary',
      rounds: 3,
      label: 'Save',
      disabled: false,
    },
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: [
          'primary',
          'secondary',
          'ghost',
        ] satisfies CanaryVariant[],
      },
      rounds: {
        control: { type: 'range', min: 1, max: 10, step: 1 },
      },
      label: { control: 'text' },
      disabled: { control: 'boolean' },
    },
    render: ({ variant, rounds, label, disabled }) => {
      const config: CanaryConfig = { variant, rounds };
      return (
        <CanaryButton
          config={config}
          label={label}
          disabled={disabled}
          onSubmit={() => {}}
        />
      );
    },
  };
  export default meta;

  type Story = StoryObj<StoryArgs>;

  export const Default: Story = {};

  export const Disabled: Story = {
    args: { disabled: true },
  };

  export const SubmitsAndShowsStatus: Story = {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(
        canvas.getByRole('button', { name: 'Save' }),
      );
      await expect(canvas.getByRole('status')).toHaveTextContent(
        'Submitted',
      );
    },
  };

  export const HighContrast: Story = {
    globals: { theme: 'high-contrast' },
  };

  export const Mobile: Story = {
    parameters: { viewport: { defaultViewport: 'mobileSm' } },
  };
  ```

- [ ] **Step 6.3 — Typecheck the canary**

  Run:

  ```bash
  yarn typecheck
  ```

  Expected: exit code 0. If it fails, the snippets in the SKILL.md are also wrong — fix the SKILL.md first, then re-run.

- [ ] **Step 6.4 — Run the storybook test runner against the canary**

  Use the workflow from the existing "Running Storybook Tests" section (find a free port, start Storybook, run tests against that port):

  ```bash
  PORT=6006
  while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
  yarn storybook --port $PORT --ci &
  STORYBOOK_PID=$!
  until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
  yarn test:storybook --url http://127.0.0.1:$PORT
  TEST_EXIT=$?
  if [ $TEST_EXIT -eq 0 ]; then kill $STORYBOOK_PID; fi
  exit $TEST_EXIT
  ```

  Expected: all stories (including the 5 canary stories) pass; `play()` runs assertions cleanly; a11y check passes.

  If the canary fails, the SKILL.md snippets it mirrors are wrong — fix SKILL.md and re-run.

- [ ] **Step 6.5 — Delete the canary**

  ```bash
  rm -rf src/components/__canary__
  ```

- [ ] **Step 6.6 — Verify final repo state and push**

  ```bash
  git status
  ```

  Expected: clean working tree (canary was never committed); no untracked files.

  ```bash
  git log --oneline origin/master..HEAD
  ```

  Expected: 5 commits (one per Task 1-5) on `plan/storybook-coverage`, no commit for the canary.

  Push the branch and open the PR (per project memory, push freely for features):

  ```bash
  git push -u origin plan/storybook-coverage
  gh pr create --base master --title "docs(skill): comprehensive write-storybook skill update" --body "$(cat <<'EOF'
  ## Summary

  Updates `.claude/skills/write-storybook/SKILL.md` to be the durable contract for Storybook authoring in the project.

  - Controls policy (no JSON for enums/booleans/numbers/colors)
  - Complex object props pattern (break into args + custom render)
  - Refined required variants (explicit gates)
  - Rich `play()` interaction patterns
  - Documents that a11y is enforced globally
  - Per-story themes and viewport pins
  - Mocking & fixtures discipline; Math.random stubs in play()
  - Explicit stories ≠ VR boundary
  - Audit/upgrade checklist for editing existing stories
  - Refreshed Common Mistakes table

  Spec: `docs/superpowers/specs/2026-04-16-write-storybook-skill-comprehensive-design.md`

  ## Test plan

  - [x] Canary story exercising controls, complex render, play(), theme, viewport — passed `yarn typecheck` and `yarn test:storybook`, then removed
  - [x] `yarn lint:md` clean after every commit
  - [ ] Reviewer spot-checks one existing story and confirms upgrade checklist is unambiguous

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

---

## Self-Review (post-plan, pre-execution)

Verified before handing off:

1. **Spec coverage** — every spec section maps to a task:
   - §6 Controls policy → Task 1, Steps 1.1–1.3
   - §7 Complex object props → Task 1, Step 1.4
   - §8 Required variants (refined) → Task 2, Step 2.1
   - §9 Rich interaction with `play()` → Task 2, Step 2.2
   - §10 A11y enforced → Task 3, Step 3.1
   - §11 Themes per story → Task 3, Step 3.2
   - §12 Viewport per story → Task 3, Step 3.3
   - §13 Mocking & fixtures → Task 4, Step 4.1
   - §14 Visual regression boundary → Task 4, Step 4.2
   - §16 Audit/upgrade checklist → Task 5, Step 5.1
   - §17 Common mistakes refreshed → Task 5, Step 5.2
   - Spec sections 1–5 and 15 deliberately untouched (kept-as-is per spec)
   - Removal of stale "argTypes for Event Handlers" (spec acceptance #3) → Task 1, Step 1.2
   - Acceptance criterion that examples compile (spec acceptance #2) → Task 6, Steps 6.3–6.4
2. **Placeholder scan** — no TBD/TODO/"add appropriate"/"similar to Task N" patterns; every step shows the actual content or exact command.
3. **Type consistency** — canary types (`CanaryVariant`, `CanaryConfig`, `CanaryButtonProps`, `StoryArgs`) are defined where introduced and reused consistently in Task 6.
