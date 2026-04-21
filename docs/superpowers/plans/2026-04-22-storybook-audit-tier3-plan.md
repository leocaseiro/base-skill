# Tier 3 Storybook Controls Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit the 5 Tier-3 Storybook files (4 root `src/components/*` + 1 `src/stories/ThemeShowcase.stories.tsx`) to the Controls Policy + Required Variants gates defined in [`.claude/skills/write-storybook/SKILL.md`](../../../.claude/skills/write-storybook/SKILL.md) and the 10 rollout gates in issue #125.

**Architecture:** Two waves of independent subagents, one worktree/branch/PR per file. No shared files are touched across tasks — each task is fully self-contained, so the 5 tasks are safe to run in parallel in principle. Serialising into two waves (3 files → review checkpoint → 2 files) limits review load and catches pattern drift before Wave 2 starts. Each task writes exactly one `.stories.tsx` file, runs `yarn typecheck` + `yarn lint`, commits, pushes, and opens a PR against `master`.

**Tech Stack:** Storybook 10.3.3 (`@storybook/react-vite`), `storybook/test` subpath (exposes `fn`), `@storybook/addon-a11y` (global `a11y.test: 'error'`), `react-i18next` (wired globally via `.storybook/preview.tsx` — stories don't need a decorator), TanStack Router (only for `ThemeShowcase` via `withRouter`).

**Canonical references:**

- Controls policy: `.claude/skills/write-storybook/SKILL.md`
- Shell-slim `Playground` (no skin): `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`
- Skin-wrapped canonical (NOT used in Tier 3): `src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx`
- Batch 2 retrofit precedent: `docs/superpowers/plans/2026-04-21-audit-storybook-answer-game-plan.md`
- Colour keys: `src/lib/game-colors.ts` exports `GAME_COLOR_KEYS` and `GameColorKey`
- Tracking issue: #125

---

## Shared Conventions (applies to every task)

- **One worktree per file.** From the repo root on `master`:

  ```bash
  git worktree add ./worktrees/stories-tier3-<slug> -b stories/<slug>-audit master
  cd ./worktrees/stories-tier3-<slug> && yarn install
  ```

  Slugs: `game-grid`, `game-card`, `game-name-chip`, `config-form-fields`, `theme-showcase`.

- **No skin wrapper in Tier 3.** All 5 target components read theme tokens (`bg-background`, `text-foreground`, etc.) only — none reference `--skin-*` or `skin.tokens`. Verified by `grep -rn 'skin\|--skin-\|game-container\|skin\.tokens'` on each source file. Each PR body must include an explicit line: _"No skin wrapper — `<Component>` uses theme tokens only, verified by grep."_
- **Handler wiring.** Every callback prop wired via `args: { onFoo: fn(), ... }` from `storybook/test` and hidden from the Controls panel via `argTypes: { onFoo: { table: { disable: true } } }`. Do not use `argTypes: { onFoo: { action: '…' } }`. Do not rely on the global `argTypesRegex` alone — react-docgen does not expand DOM-extended prop types, so the regex matches nothing for most handler props.
- **`StoryArgs` pattern.** When the component takes complex object props or has docgen-inferred rows we want to hide, declare an explicit `interface StoryArgs { … }` with controllable args, mark shadowed raw props as `?: never`, and double-cast `component: Foo as unknown as ComponentType<StoryArgs>`. See `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx` for the canonical shape.
- **Controls map (reminder).** Enum / union → `control: { type: 'select' }` + `options` (or `'radio'` for ≤4 options); boolean → `control: 'boolean'`; bounded number → `control: { type: 'range', min, max, step }`; free text → `control: 'text'`; callback → disabled in Controls and wired via `fn()` in `args`; JSX / complex object → `control: false` or `table: { disable: true }`. Never a raw JSON control for an enumerable domain.
- **Playground convention.** When existing scenario stories can be reproduced by tweaking args on a single default, collapse them into one `Playground: Story = {}` and keep scenario exports only for states the Controls panel cannot easily reach (survey stories like `AllColors`, per-theme VR shots, `visibleWhen` branches that require a specific fixture). This convention is established by precedent (PR #141 for `InstructionsOverlay`, Task 1 in the Batch 2 plan for `Slot`) and is captured under "Audit / Upgrade Checklist" + "Collapse redundant stories" in the write-storybook skill.
- **Dark-mode stories.** The theme toolbar (registered globally in `.storybook/preview.tsx`) lets reviewers toggle themes interactively — do not add `DefaultDark` / `WithXDark` duplicates. Pin a story to a specific theme only when the variant exercises something theme-specific that the toolbar can't reproduce in one tap (surveys like `AllColorsDark`, VR baseline stories like `ThemeShowcase`'s 4 theme-pinned stories). Prefer `globals: { theme: '<name>' }` over the legacy `withDarkMode` decorator.
- **Import order (ESLint `import/order`).** Value imports alphabetical → relative imports alphabetical → `storybook/test` → `@storybook/react` type import → `react` / JSX type imports last. If lint complains, regroup.
- **Per-task verification (always before commit).** `yarn typecheck` → exit 0; `yarn lint` → exit 0. Do **not** run `yarn test:storybook` per file — too slow; the full run lives in CI when the PR opens.
- **Optional local visual check.** Each subagent may (but is not required to) start a Storybook on a free port (6106+) inside its worktree and navigate to the target stories in a browser — or run a Playwright script to screenshot them — before writing diffs. Kill the Storybook process when done. Use the workflow from `.claude/skills/write-storybook/SKILL.md` ("Running Storybook Tests"). Skip this step if Docker/Storybook bootstrap is flaky; the CI `yarn test:storybook` run is the authoritative gate.
- **Commit message shape.** `stories(<area>/<name>): retrofit per controls policy`. Body lists the gates applied and any variant dropped with reason. Co-authored trailer.
- **One commit per file. One PR per file.** PRs always target `master`. Push freely for Tier 3 (feature work). If the push triggers an automation that auto-opens a PR, edit that PR's title/body instead of creating a new one.
- **Markdown.** No Markdown edits expected in these tasks. Skip `yarn fix:md`.
- **Do not extract shared helpers across tasks.** Each story file is self-contained — keep fixtures + wrapper components inline. Shared-helper drift is the main risk if Wave 1 and Wave 2 run in parallel; avoid by design.

---

## Wave 1 — 3 parallel subagents

Dispatch Tasks 1, 2, 3 concurrently. Each writes its own worktree, commits once, pushes, opens a PR. After all three PRs are approved (or at minimum code-reviewed), proceed to the Wave 1 Checkpoint.

---

### Task 1: Retrofit `GameGrid.stories.tsx`

**Files:**

- Create worktree: `./worktrees/stories-tier3-game-grid` on branch `stories/game-grid-audit`
- Modify: `src/components/GameGrid.stories.tsx`
- Read (for context): `src/components/GameGrid.tsx`, `src/components/GameCard.tsx`, `src/components/GameGrid.test.tsx`

**Gates applied (from issue #125):**

- Gate 1 — Controls map to something visible: `cards: ReactNode[]` is invisible as a control; hidden and derived from `cardCount` range.
- Gate 3 — Handler wiring: sample cards inside the render use `fn()` spies on `onPlay` / `onOpenCog`.
- Gate 4 — No skin wrapper (theme tokens only; `GameGrid` has no CSS of its own beyond layout classes).
- Gate 5 — Hide shadowed docgen row for `cards`.
- Gate 6 — Collapse: 2 existing stories (`Default`, `Empty`) become `Playground` + `Empty` + `ManyCards` for visual range (0 / 3 / 12 cards).
- Gate 8 — Required Variants: `Playground` (Default) + `Empty` edge case. No interactive component → no `play()`.

**Steps:**

- [ ] **Step 1: Create worktree.**

  ```bash
  git worktree add ./worktrees/stories-tier3-game-grid -b stories/game-grid-audit master
  cd ./worktrees/stories-tier3-game-grid && yarn install
  ```

- [ ] **Step 2: Replace `src/components/GameGrid.stories.tsx`** with:

  ```tsx
  import { fn } from 'storybook/test';

  import { GameCard } from './GameCard';
  import { GameGrid } from './GameGrid';
  import type { ComponentType } from 'react';
  import type { Meta, StoryObj } from '@storybook/react';

  interface StoryArgs {
    cardCount: number;
    // Raw GameGrid prop shadowed by the cardCount bridge — hidden from Controls.
    cards?: never;
  }

  const meta: Meta<StoryArgs> = {
    component: GameGrid as unknown as ComponentType<StoryArgs>,
    tags: ['autodocs'],
    args: {
      cardCount: 3,
    },
    argTypes: {
      cardCount: {
        control: { type: 'range', min: 0, max: 12, step: 1 },
      },
      cards: { table: { disable: true } },
    },
    render: ({ cardCount }) => (
      <GameGrid
        cards={Array.from({ length: cardCount }, (_, i) => (
          <GameCard
            key={`card-${String(i)}`}
            variant="default"
            gameId="sort-numbers"
            title={`Card ${String(i + 1)}`}
            chips={['K', '1', '2']}
            onPlay={fn()}
            onOpenCog={fn()}
          />
        ))}
      />
    ),
  };
  export default meta;

  type Story = StoryObj<StoryArgs>;

  export const Playground: Story = {};

  export const Empty: Story = {
    args: { cardCount: 0 },
  };

  export const ManyCards: Story = {
    args: { cardCount: 12 },
  };
  ```

- [ ] **Step 3: Verify.** Run in the worktree:

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. If `import/order` fails, regroup per the Shared Conventions rule.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/components/GameGrid.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(components/GameGrid): retrofit per controls policy

  StoryArgs exposes a cardCount range (0–12); cards is shadowed and
  hidden from Controls. Sample GameCards inside the render wire
  onPlay/onOpenCog to fn() spies.

  No skin wrapper — GameGrid is a grid container, uses theme tokens only.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-grid-audit
  gh pr create --base master --title "stories(components/GameGrid): retrofit per controls policy" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 1 of 5 — retrofits `src/components/GameGrid.stories.tsx` to the
  Controls Policy + Required Variants gates
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md), issue #125).

  - `cardCount` range (0–12) drives how many GameCards render.
  - `cards` is shadowed (`?: never` + `table: { disable: true }`) — never meaningful as a control.
  - Sample cards wire `onPlay` / `onOpenCog` to `fn()` spies.
  - No skin wrapper — `GameGrid.tsx` has no `--skin-*` or `skin.tokens` references (verified by grep); uses theme layout classes only.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel drives the Playground (cardCount slider produces 0, 3, 12 cards visibly)
  EOF
  )"
  ```

---

### Task 2: Retrofit `GameCard.stories.tsx`

**Files:**

- Create worktree: `./worktrees/stories-tier3-game-card` on branch `stories/game-card-audit`
- Modify: `src/components/GameCard.stories.tsx`
- Read (for context): `src/components/GameCard.tsx`, `src/components/GameCard.test.tsx`, `src/lib/game-colors.ts`

**Gates applied:**

- Gate 1 — Controls map: `variant` union, `customGameColor` enum, `isBookmarked` boolean, `bookmarkable` derived-boolean (controls whether `onToggleBookmark` is passed).
- Gate 2 — Structured inputs: `variant` → radio, `customGameColor` → select of `GAME_COLOR_KEYS`, `chipsText` → free text (split on commas → `chips: string[]`).
- Gate 3 — Handler wiring: convert `{ action: '…' }` → `fn()` in `args`; hide from Controls. Call `fn()` inside `render` for per-render spy instances (OK for Actions-only; no play() stories here).
- Gate 4 — No skin wrapper (theme tokens only; verified by grep).
- Gate 5 — Hide shadowed docgen rows for `chips`, `cover`, `onPlay`, `onOpenCog`, `onToggleBookmark`.
- Gate 6 — Keep the 7 existing scenario stories (visual coverage, not play-flow duplicates) + their roles.
- Gate 8 — Required Variants: Default, CustomGame, CustomGamePurple, NotBookmarked, Bookmarked, NotBookmarkedCustomGame, BookmarkedCustomGame.

**Steps:**

- [ ] **Step 1: Create worktree.**

  ```bash
  git worktree add ./worktrees/stories-tier3-game-card -b stories/game-card-audit master
  cd ./worktrees/stories-tier3-game-card && yarn install
  ```

- [ ] **Step 2: Replace `src/components/GameCard.stories.tsx`** with:

  ```tsx
  import { fn } from 'storybook/test';

  import { GameCard } from './GameCard';
  import { GAME_COLOR_KEYS } from '@/lib/game-colors';
  import type { GameColorKey } from '@/lib/game-colors';
  import type { ComponentType } from 'react';
  import type { Meta, StoryObj } from '@storybook/react';

  type Variant = 'default' | 'customGame';

  interface StoryArgs {
    variant: Variant;
    gameId: string;
    title: string;
    chipsText: string;
    customGameName: string;
    customGameColor: GameColorKey;
    bookmarkable: boolean;
    isBookmarked: boolean;
    // Shadowed raw props — driven by StoryArgs above; hidden from Controls.
    chips?: never;
    cover?: never;
    onPlay?: never;
    onOpenCog?: never;
    onToggleBookmark?: never;
  }

  const meta: Meta<StoryArgs> = {
    component: GameCard as unknown as ComponentType<StoryArgs>,
    tags: ['autodocs'],
    args: {
      variant: 'default',
      gameId: 'sort-numbers',
      title: 'Count in Order',
      chipsText: '🚀 Up, 5 numbers, 2s',
      customGameName: 'Skip by 2',
      customGameColor: 'indigo',
      bookmarkable: false,
      isBookmarked: false,
    },
    argTypes: {
      variant: {
        control: { type: 'radio' },
        options: ['default', 'customGame'] satisfies Variant[],
      },
      gameId: { control: 'text' },
      title: { control: 'text' },
      chipsText: { control: 'text' },
      customGameName: { control: 'text' },
      customGameColor: {
        control: { type: 'select' },
        options: GAME_COLOR_KEYS,
      },
      bookmarkable: { control: 'boolean' },
      isBookmarked: { control: 'boolean' },
      chips: { table: { disable: true } },
      cover: { table: { disable: true } },
      onPlay: { table: { disable: true } },
      onOpenCog: { table: { disable: true } },
      onToggleBookmark: { table: { disable: true } },
    },
    render: ({
      variant,
      gameId,
      title,
      chipsText,
      customGameName,
      customGameColor,
      bookmarkable,
      isBookmarked,
    }) => {
      const chips = chipsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const bookmarkProps = bookmarkable
        ? { isBookmarked, onToggleBookmark: fn() }
        : {};

      if (variant === 'customGame') {
        return (
          <GameCard
            variant="customGame"
            gameId={gameId}
            title={title}
            chips={chips}
            customGameName={customGameName || 'Custom'}
            customGameColor={customGameColor}
            onPlay={fn()}
            onOpenCog={fn()}
            {...bookmarkProps}
          />
        );
      }
      return (
        <GameCard
          variant="default"
          gameId={gameId}
          title={title}
          chips={chips}
          onPlay={fn()}
          onOpenCog={fn()}
          {...bookmarkProps}
        />
      );
    },
  };
  export default meta;

  type Story = StoryObj<StoryArgs>;

  export const Default: Story = {};

  export const CustomGame: Story = {
    args: {
      variant: 'customGame',
      customGameName: 'Skip by 2',
      customGameColor: 'amber',
    },
  };

  export const CustomGamePurple: Story = {
    args: {
      variant: 'customGame',
      customGameName: 'Big to Small',
      customGameColor: 'purple',
      chipsText: '⬇️ Down, 10 numbers, 3s',
    },
  };

  export const NotBookmarked: Story = {
    args: { bookmarkable: true, isBookmarked: false },
  };

  export const Bookmarked: Story = {
    args: { bookmarkable: true, isBookmarked: true },
  };

  export const NotBookmarkedCustomGame: Story = {
    args: {
      variant: 'customGame',
      customGameName: 'Skip by 2',
      customGameColor: 'amber',
      bookmarkable: true,
      isBookmarked: false,
    },
  };

  export const BookmarkedCustomGame: Story = {
    args: {
      variant: 'customGame',
      customGameName: 'Skip by 2',
      customGameColor: 'amber',
      bookmarkable: true,
      isBookmarked: true,
    },
  };
  ```

- [ ] **Step 3: Verify.**

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. The discriminated union in `GameCardProps` is the most likely source of a typecheck error — if so, the `variant === 'customGame'` branch in `render` is the source of truth; align the `customGameName` / `customGameColor` requirements there.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/components/GameCard.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(components/GameCard): retrofit per controls policy

  StoryArgs with proper controls: variant radio, customGameColor select
  from GAME_COLOR_KEYS, chipsText split on commas, isBookmarked +
  bookmarkable booleans. All handlers (onPlay, onOpenCog,
  onToggleBookmark) wired via fn() in render; hidden from Controls via
  table.disable. Shadowed raw props (chips, cover, onPlay, onOpenCog,
  onToggleBookmark) hidden via ?: never + table.disable.

  Keeps 7 existing scenario exports (Default, CustomGame,
  CustomGamePurple, NotBookmarked, Bookmarked, NotBookmarkedCustomGame,
  BookmarkedCustomGame) — they each capture a distinct visual state.

  No skin wrapper — GameCard uses theme tokens (bg-card,
  text-foreground, bg-muted) only.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-card-audit
  gh pr create --base master --title "stories(components/GameCard): retrofit per controls policy" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 2 of 5 — retrofits `src/components/GameCard.stories.tsx` to the
  Controls Policy + Required Variants gates
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md), issue #125).

  - `variant` radio, `customGameColor` select from `GAME_COLOR_KEYS`, `chipsText` splits on commas.
  - `isBookmarked` + `bookmarkable` expose the full bookmark matrix via args.
  - Handlers wired via `fn()` in the render function; raw prop rows hidden from Controls.
  - Keeps 7 scenario exports — each captures a distinct visual state, not a play-flow duplicate.
  - No skin wrapper — `GameCard.tsx` uses theme tokens only (verified by grep).

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel drives variant / customGameColor / bookmark combinations
  EOF
  )"
  ```

---

### Task 3: Retrofit `GameNameChip.stories.tsx`

**Files:**

- Create worktree: `./worktrees/stories-tier3-game-name-chip` on branch `stories/game-name-chip-audit`
- Modify: `src/components/GameNameChip.stories.tsx`
- Read (for context): `src/components/GameNameChip.tsx`, `src/components/GameNameChip.test.tsx`, `src/lib/game-colors.ts`, `.storybook/decorators.tsx` (verifies the legacy `withDarkMode` export)

**Gates applied:**

- Gate 1 — Controls map to something visible: add controls for `title`, `customGameName`, `customGameColor`, `subject`.
- Gate 2 — Structured inputs: `customGameColor` → select.
- Gate 3 — Handler wiring: N/A (no callbacks on `GameNameChipProps`).
- Gate 4 — No skin wrapper (theme tokens only; `--game-play` is the **game-colors palette**, not the skin system).
- Gate 5 — N/A (no shadowed props — all props are primitive and controllable).
- Gate 6 — Collapse: drop the 3 `*Dark` duplicates (`DefaultDark`, `WithCustomGameDark`, `WithSubjectDark`) — the global theme toolbar covers dark review. Keep `AllColors` + `AllColorsDark` as surveys (not reachable by flipping a single toggle) — use `globals: { theme: 'dark' }` instead of `withDarkMode`.
- Gate 8 — Required Variants: Default, WithCustomGame, WithSubject, AllColors, AllColorsDark.
- Gate 9 — Decorators: no `withDb` / `withRouter` needed.

**Steps:**

- [ ] **Step 1: Create worktree.**

  ```bash
  git worktree add ./worktrees/stories-tier3-game-name-chip -b stories/game-name-chip-audit master
  cd ./worktrees/stories-tier3-game-name-chip && yarn install
  ```

- [ ] **Step 2: Replace `src/components/GameNameChip.stories.tsx`** with:

  ```tsx
  import { GameNameChip } from './GameNameChip';
  import { GAME_COLOR_KEYS } from '@/lib/game-colors';
  import type { GameColorKey } from '@/lib/game-colors';
  import type { Meta, StoryObj } from '@storybook/react';

  const meta: Meta<typeof GameNameChip> = {
    component: GameNameChip,
    tags: ['autodocs'],
    args: {
      title: 'Word Spell',
    },
    argTypes: {
      title: { control: 'text' },
      customGameName: { control: 'text' },
      customGameColor: {
        control: { type: 'select' },
        options: GAME_COLOR_KEYS,
      },
      subject: { control: 'text' },
    },
  };
  export default meta;

  type Story = StoryObj<typeof GameNameChip>;

  export const Default: Story = {};

  export const WithCustomGame: Story = {
    args: {
      customGameName: 'Easy Mode',
      customGameColor: 'indigo' as GameColorKey,
    },
  };

  export const WithSubject: Story = {
    args: { subject: 'reading' },
  };

  export const AllColors: Story = {
    render: () => (
      <div className="flex flex-col gap-2">
        {GAME_COLOR_KEYS.map((color) => (
          <GameNameChip
            key={color}
            title="Word Spell"
            customGameName={color}
            customGameColor={color}
          />
        ))}
      </div>
    ),
  };

  export const AllColorsDark: Story = {
    ...AllColors,
    globals: { theme: 'dark' },
  };
  ```

- [ ] **Step 3: Verify.**

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. If `globals: { theme: 'dark' }` reports a type error, fall back to `parameters: { globals: { theme: 'dark' } }` — both forms are accepted by Storybook 8+; the former is the story-level shorthand, the latter is the parameters form used in `ThemeShowcase.stories.tsx`. Align with whichever the type-checker accepts.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/components/GameNameChip.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(components/GameNameChip): retrofit per controls policy

  Add argTypes controls for title, customGameName, customGameColor
  (select from GAME_COLOR_KEYS), subject. Drop 3 redundant *Dark
  duplicates (DefaultDark, WithCustomGameDark, WithSubjectDark) — the
  global theme toolbar covers that. Keep AllColors + AllColorsDark as
  surveys; AllColorsDark uses globals.theme='dark' instead of the
  legacy withDarkMode decorator.

  No skin wrapper — GameNameChip uses theme tokens + the game-colors
  palette (--game-play / game-bg / game-text utilities), not skin tokens.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-name-chip-audit
  gh pr create --base master --title "stories(components/GameNameChip): retrofit per controls policy" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 3 of 5 — retrofits `src/components/GameNameChip.stories.tsx` to the
  Controls Policy + Required Variants gates
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md), issue #125).

  - `customGameColor` → select from `GAME_COLOR_KEYS`; `title`, `customGameName`, `subject` → text controls.
  - Dropped 3 redundant `*Dark` duplicates (global theme toolbar covers that).
  - Kept `AllColors` + `AllColorsDark` as palette surveys — `AllColorsDark` uses `globals: { theme: 'dark' }` instead of `withDarkMode`.
  - No skin wrapper — `GameNameChip` uses theme tokens + the game-colors palette (`--game-play` / `game-bg` / `game-text`), not skin tokens.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel drives customGameColor select across all 12 keys
  EOF
  )"
  ```

---

## Wave 1 Checkpoint

Before dispatching Wave 2, confirm the reviewer has approved (or at minimum reviewed) all three Wave 1 PRs. In particular:

- The `StoryArgs` double-cast (`as unknown as ComponentType<StoryArgs>`) and `?: never` pattern are applied correctly.
- `fn()` wiring works inside the render function for handlers that would otherwise collide with StoryArgs (GameCard / GameGrid).
- No `withDarkMode` decorator in any new story (GameNameChip).
- No skin wrapper added anywhere — each PR body explicitly notes the theme-tokens-only status.

If any of these patterns diverges between the three PRs, reconcile by editing this plan's Wave 2 tasks before dispatching, so Tasks 4 and 5 use the agreed shape.

If all three land cleanly, proceed.

---

## Wave 2 — 2 parallel subagents

Dispatch Tasks 4 and 5 concurrently. Same discipline as Wave 1: own worktree, one commit, one PR.

---

### Task 4: Retrofit `ConfigFormFields.stories.tsx`

**Files:**

- Create worktree: `./worktrees/stories-tier3-config-form-fields` on branch `stories/config-form-fields-audit`
- Modify: `src/components/ConfigFormFields.stories.tsx`
- Read (for context): `src/components/ConfigFormFields.tsx`, `src/components/ConfigFormFields.test.tsx`, `src/lib/config-fields.ts` (if present — check for `ConfigField` union shape)

**Gates applied:**

- Gate 1 — Controls map: `fields` and `config` are complex objects → hidden from Controls, driven by a `scenario` select.
- Gate 2 — Structured inputs: `scenario` → select with 4 presets.
- Gate 3 — Handler wiring: `onChange` wired to `fn()` in `args`; hidden from Controls.
- Gate 4 — No skin wrapper (theme tokens only).
- Gate 5 — Hide shadowed rows for `fields`, `config`.
- Gate 6 — Keep 4 scenarios (AllFieldTypes, SortNumbersFieldsExact/ByMode/Distractors) — each exercises a distinct `visibleWhen` branch that args can't reach without a preset. Drop `AllFieldTypesDark` — global theme toolbar covers dark review.
- Gate 8 — Required Variants: Default (AllFieldTypes), plus the 3 Sort presets (state variants that surface `visibleWhen` branches).
- Gate 9 — Decorators: N/A (no router/DB deps).

**Steps:**

- [ ] **Step 1: Create worktree.**

  ```bash
  git worktree add ./worktrees/stories-tier3-config-form-fields -b stories/config-form-fields-audit master
  cd ./worktrees/stories-tier3-config-form-fields && yarn install
  ```

- [ ] **Step 2: Replace `src/components/ConfigFormFields.stories.tsx`** with:

  ```tsx
  import { fn } from 'storybook/test';

  import { ConfigFormFields } from './ConfigFormFields';
  import type { ConfigField } from '@/lib/config-fields';
  import type { ComponentType } from 'react';
  import type { Meta, StoryObj } from '@storybook/react';

  type Scenario =
    | 'all-types'
    | 'sort-numbers-random'
    | 'sort-numbers-by'
    | 'sort-numbers-distractors';

  interface StoryArgs {
    scenario: Scenario;
    onChange: (config: Record<string, unknown>) => void;
    // Shadowed raw props — driven by scenario; hidden from Controls.
    fields?: never;
    config?: never;
  }

  const allFields: ConfigField[] = [
    {
      type: 'select',
      key: 'mode',
      label: 'Mode',
      options: [
        { value: 'picture', label: 'Picture' },
        { value: 'text', label: 'Text' },
      ],
    },
    {
      type: 'number',
      key: 'totalRounds',
      label: 'Total rounds',
      min: 1,
      max: 20,
    },
    {
      type: 'checkbox',
      key: 'ttsEnabled',
      label: 'Text-to-speech',
    },
  ];

  const sortFields: ConfigField[] = [
    {
      type: 'nested-select',
      key: 'skip',
      subKey: 'mode',
      label: 'Skip mode',
      options: [
        { value: 'random', label: 'random' },
        { value: 'consecutive', label: 'consecutive' },
        { value: 'by', label: 'by' },
      ],
    },
    {
      type: 'nested-number',
      key: 'skip',
      subKey: 'step',
      label: 'Skip step',
      min: 2,
      max: 100,
      visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
    },
    {
      type: 'nested-select',
      key: 'skip',
      subKey: 'start',
      label: 'Skip start',
      options: [
        { value: 'range-min', label: 'range-min' },
        { value: 'random', label: 'random' },
      ],
      visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
    },
    {
      type: 'select',
      key: 'tileBankMode',
      label: 'Tile bank mode',
      options: [
        { value: 'exact', label: 'exact' },
        { value: 'distractors', label: 'distractors' },
      ],
    },
    {
      type: 'nested-select',
      key: 'distractors',
      subKey: 'source',
      label: 'Distractor source',
      options: [
        { value: 'random', label: 'random' },
        { value: 'gaps-only', label: 'gaps-only' },
        { value: 'full-range', label: 'full-range' },
      ],
      visibleWhen: { key: 'tileBankMode', value: 'distractors' },
    },
    {
      type: 'nested-select-or-number',
      key: 'distractors',
      subKey: 'count',
      label: 'Distractor count',
      min: 1,
      max: 20,
      visibleWhen: { key: 'tileBankMode', value: 'distractors' },
    },
  ];

  const scenarioData: Record<
    Scenario,
    { fields: ConfigField[]; config: Record<string, unknown> }
  > = {
    'all-types': {
      fields: allFields,
      config: { mode: 'picture', totalRounds: 8, ttsEnabled: true },
    },
    'sort-numbers-random': {
      fields: sortFields,
      config: {
        skip: { mode: 'random' },
        tileBankMode: 'exact',
        distractors: { source: 'random', count: 2 },
      },
    },
    'sort-numbers-by': {
      fields: sortFields,
      config: {
        skip: { mode: 'by', step: 5, start: 'range-min' },
        tileBankMode: 'exact',
        distractors: { source: 'random', count: 2 },
      },
    },
    'sort-numbers-distractors': {
      fields: sortFields,
      config: {
        skip: { mode: 'random' },
        tileBankMode: 'distractors',
        distractors: { source: 'gaps-only', count: 3 },
      },
    },
  };

  const meta: Meta<StoryArgs> = {
    component: ConfigFormFields as unknown as ComponentType<StoryArgs>,
    tags: ['autodocs'],
    args: {
      scenario: 'all-types',
      onChange: fn(),
    },
    argTypes: {
      scenario: {
        control: { type: 'select' },
        options: [
          'all-types',
          'sort-numbers-random',
          'sort-numbers-by',
          'sort-numbers-distractors',
        ] satisfies Scenario[],
      },
      onChange: { table: { disable: true } },
      fields: { table: { disable: true } },
      config: { table: { disable: true } },
    },
    render: ({ scenario, onChange }) => {
      const { fields, config } = scenarioData[scenario];
      return (
        <ConfigFormFields
          fields={fields}
          config={config}
          onChange={onChange}
        />
      );
    },
  };
  export default meta;

  type Story = StoryObj<StoryArgs>;

  export const AllFieldTypes: Story = {
    args: { scenario: 'all-types' },
  };

  export const SortNumbersFieldsExact: Story = {
    args: { scenario: 'sort-numbers-random' },
  };

  export const SortNumbersFieldsByMode: Story = {
    args: { scenario: 'sort-numbers-by' },
  };

  export const SortNumbersFieldsDistractors: Story = {
    args: { scenario: 'sort-numbers-distractors' },
  };
  ```

- [ ] **Step 3: Verify.**

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. If the `ConfigField` import path differs, adjust — `src/lib/config-fields.ts` is the canonical module based on the existing story's import.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/components/ConfigFormFields.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(components/ConfigFormFields): retrofit per controls policy

  StoryArgs with scenario select (all-types / sort-numbers-random /
  sort-numbers-by / sort-numbers-distractors) — each scenario preset
  exercises a distinct visibleWhen branch. onChange wired to fn() spy
  and hidden from Controls. Complex props (fields, config) shadowed
  via ?: never + table.disable.

  Drop AllFieldTypesDark — global theme toolbar covers dark review.
  Keep the 4 scenario stories that each surface a unique visibleWhen
  state.

  No skin wrapper — ConfigFormFields uses theme tokens
  (bg-background, text-foreground, border-input) only.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/config-form-fields-audit
  gh pr create --base master --title "stories(components/ConfigFormFields): retrofit per controls policy" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 4 of 5 — retrofits `src/components/ConfigFormFields.stories.tsx` to the
  Controls Policy + Required Variants gates
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md), issue #125).

  - `scenario` select drives 4 presets — each surfaces a distinct `visibleWhen` branch the Controls panel cannot easily reach without a preset.
  - `onChange` wired to `fn()`; hidden from Controls.
  - Complex props (`fields`, `config`) shadowed via `?: never` + `table.disable`.
  - Dropped `AllFieldTypesDark` — global theme toolbar covers that.
  - No skin wrapper — `ConfigFormFields.tsx` uses theme tokens only (verified by grep).

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] scenario select drives the 4 presets; visibleWhen branches render correctly
  EOF
  )"
  ```

---

### Task 5: Retrofit `ThemeShowcase.stories.tsx`

**Files:**

- Create worktree: `./worktrees/stories-tier3-theme-showcase` on branch `stories/theme-showcase-audit`
- Modify: `src/stories/ThemeShowcase.stories.tsx`
- Read (for context): `src/components/game/GameShell.tsx`, `src/lib/game-engine/types.ts` (confirm `GameEngineState`, `ResolvedContent`, `ResolvedGameConfig`, `SessionMeta` shapes still match)

**Gates applied:**

- Gate 1 — Controls map: none of the `GameShell` props are meaningful to control in this showcase context (they're fixtures); hide all of them.
- Gate 3 — Handler wiring: N/A (no callbacks on `GameShell`; `ShowcaseBody`'s inline `onChange={() => {}}` stays inside the fixture).
- Gate 4 — No skin wrapper (theme tokens only; `ThemeShowcase` is by design a theme-token showcase — this is the flagship "do NOT wrap" case).
- Gate 5 — Hide shadowed rows for `config`, `moves`, `initialState`, `sessionId`, `meta`, `initialLog`, `children`.
- Gate 8 — Required Variants: 4 theme-pinned VR stories (OceanLight, OceanDark, ForestLight, ForestDark) — each is a theme-specific variant the toolbar reproduces but the VR baseline captures as distinct snapshots.
- Gate 9 — Decorators: `withDb` + `withRouter` (already present; keep).

**Steps:**

- [ ] **Step 1: Create worktree.**

  ```bash
  git worktree add ./worktrees/stories-tier3-theme-showcase -b stories/theme-showcase-audit master
  cd ./worktrees/stories-tier3-theme-showcase && yarn install
  ```

- [ ] **Step 2: Replace `src/stories/ThemeShowcase.stories.tsx`** with:

  ```tsx
  import { withDb } from '../../.storybook/decorators/withDb';
  import { withRouter } from '../../.storybook/decorators/withRouter';
  import type { ConfigField } from '@/lib/config-fields';
  import type {
    GameEngineState,
    ResolvedContent,
    ResolvedGameConfig,
    SessionMeta,
  } from '@/lib/game-engine/types';
  import type { Meta, StoryObj } from '@storybook/react';
  import { ConfigFormFields } from '@/components/ConfigFormFields';
  import { GameShell } from '@/components/game/GameShell';
  import { GameNameChip } from '@/components/GameNameChip';

  // ── GameShell fixture data ────────────────────────────────────────────────

  const content: ResolvedContent = {
    rounds: [
      {
        id: 'r1',
        prompt: { en: 'Sort the numbers' },
        correctAnswer: '1',
      },
    ],
  };

  const shellConfig: ResolvedGameConfig = {
    gameId: 'theme-showcase',
    title: { en: 'Theme Showcase' },
    gradeBand: 'year1-2',
    maxRounds: 3,
    maxRetries: 1,
    maxUndoDepth: 3,
    timerVisible: true,
    timerDurationSeconds: 60,
    difficulty: 'medium',
  };

  const initialState: GameEngineState = {
    phase: 'playing',
    roundIndex: 0,
    score: 0,
    streak: 0,
    retryCount: 0,
    content,
    currentRound: { roundId: 'r1', answer: null, hintsUsed: 0 },
  };

  const sessionMeta: SessionMeta = {
    profileId: 'storybook-user',
    gameId: 'theme-showcase',
    gradeBand: 'year1-2',
    seed: 'storybook-seed',
    initialContent: content,
    initialState,
  };

  // ── Custom game component fixture data ──────────────────────────────────────

  const configFields: ConfigField[] = [
    {
      type: 'select',
      key: 'inputMethod',
      label: 'Input method',
      options: [
        { value: 'drag', label: 'Drag' },
        { value: 'type', label: 'Type' },
      ],
    },
    {
      type: 'number',
      key: 'totalRounds',
      label: 'Total rounds',
      min: 1,
      max: 20,
    },
    {
      type: 'checkbox',
      key: 'ttsEnabled',
      label: 'Text-to-speech',
    },
  ];

  // ── Story body ────────────────────────────────────────────────────────────

  const ShowcaseBody = () => (
    <div className="flex flex-col gap-4 p-4">
      <GameNameChip
        title="Sort Numbers"
        customGameName="Easy Numbers"
        customGameColor="teal"
      />
      <GameNameChip title="Word Spell" subject="reading" />
      <ConfigFormFields
        fields={configFields}
        config={{
          inputMethod: 'drag',
          totalRounds: 8,
          ttsEnabled: true,
        }}
        onChange={() => {}}
      />
    </div>
  );

  // ── Meta ──────────────────────────────────────────────────────────────────

  const meta = {
    component: GameShell,
    title: 'Pages/ThemeShowcase',
    tags: ['autodocs'],
    decorators: [withDb, withRouter],
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'Token-only page composed from GameShell + GameNameChip + ConfigFormFields. Pinned to 4 theme variants for VR parity. No skin wrapper — renders against theme tokens only.',
        },
      },
    },
    args: {
      config: shellConfig,
      moves: {},
      initialState,
      sessionId: 'showcase-session',
      meta: sessionMeta,
      children: <ShowcaseBody />,
    },
    argTypes: {
      config: { table: { disable: true } },
      moves: { table: { disable: true } },
      initialState: { table: { disable: true } },
      sessionId: { table: { disable: true } },
      meta: { table: { disable: true } },
      initialLog: { table: { disable: true } },
      children: { table: { disable: true } },
    },
  } satisfies Meta<typeof GameShell>;
  export default meta;

  type Story = StoryObj<typeof GameShell>;

  // ── 4 locked-theme VR stories ─────────────────────────────────────────────

  export const OceanLight: Story = {
    parameters: { globals: { theme: 'light' } },
  };

  export const OceanDark: Story = {
    parameters: { globals: { theme: 'dark' } },
  };

  export const ForestLight: Story = {
    parameters: { globals: { theme: 'forest-light' } },
  };

  export const ForestDark: Story = {
    parameters: { globals: { theme: 'forest-dark' } },
  };
  ```

- [ ] **Step 3: Verify.**

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. The `satisfies Meta<typeof GameShell>` means docgen sees every real prop — `argTypes.table.disable` on the 7 hidden props is what actually removes them from the Controls panel. If any of the fixture type shapes (`GameEngineState`, `ResolvedContent`, `ResolvedGameConfig`, `SessionMeta`) has drifted since the previous version of the file, align to the current `src/lib/game-engine/types.ts`.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/stories/ThemeShowcase.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(stories/ThemeShowcase): retrofit per controls policy

  Hide all 7 GameShell-prop docgen rows from the Controls panel
  (config, moves, initialState, sessionId, meta, initialLog, children)
  via argTypes.table.disable. Keep the 4 theme-pinned VR stories
  (OceanLight, OceanDark, ForestLight, ForestDark).

  No skin wrapper — this file is the flagship theme-token showcase; no
  --skin-* / skin.tokens references. Explicit note in the component
  docs description.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/theme-showcase-audit
  gh pr create --base master --title "stories(stories/ThemeShowcase): retrofit per controls policy" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 5 of 5 — retrofits `src/stories/ThemeShowcase.stories.tsx` to the
  Controls Policy gates
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md), issue #125).

  - Hide all 7 GameShell-prop rows from Controls (`config`, `moves`, `initialState`, `sessionId`, `meta`, `initialLog`, `children`) via `argTypes.table.disable`.
  - Keep the 4 theme-pinned VR stories (OceanLight, OceanDark, ForestLight, ForestDark) — each produces a distinct VR snapshot the toolbar can't baseline.
  - No skin wrapper — flagship theme-token showcase; `ThemeShowcase.tsx` / `GameShell.tsx` have no `--skin-*` / `skin.tokens` references (verified by grep). Explicit "no skin wrapper" note added to the `docs.description.component` string.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel is empty for all 4 theme-pinned stories (docgen rows hidden)
  - [ ] Theme toolbar still works for unpinned preview
  EOF
  )"
  ```

---

## Post-PR cleanup

After all 5 PRs merge:

- [ ] **Update issue #125.** Tick the 5 boxes in the issue body:

  ```text
  - [x] ConfigFormFields.stories.tsx
  - [x] GameCard.stories.tsx
  - [x] GameGrid.stories.tsx
  - [x] GameNameChip.stories.tsx
  - [x] stories/ThemeShowcase.stories.tsx
  ```

  ```bash
  gh issue view 125 --json body --jq '.body' > /tmp/issue-125-body.md
  # Edit the 5 checkboxes in /tmp/issue-125-body.md, then:
  gh issue edit 125 --body-file /tmp/issue-125-body.md
  ```

- [ ] **Remove merged worktrees.** The repo's `.husky` / `prune-merged-worktrees` script runs on post-merge, but verify:

  ```bash
  git worktree list | grep stories-tier3
  # If any remain after their PR merges:
  git worktree remove worktrees/stories-tier3-<slug>
  ```

- [ ] **Plan's own worktree.** Remove this plan's worktree after the plan PR merges:

  ```bash
  git worktree remove worktrees/plan-tier3-storybook-audit
  ```

---

## Scope explicitly excluded

- Any `.md` / docs edits outside this plan file.
- Any changes to `.storybook/preview.tsx`, `.storybook/decorators.tsx`, or global Storybook config.
- Adding a "Playground pattern" section to `.claude/skills/write-storybook/SKILL.md` — consider as a follow-up PR after Tier 3 completes, so the pattern is captured explicitly in the skill rather than only by precedent.
- Retrofitting the remaining 4 root-components files (`Footer`, `Header`, `OfflineIndicator`, `ThemeToggle`, `UpdateBanner`) — they are still in the Tier 5 / Batch 5 bucket on #125 and should get their own plan.

---

## Self-review

- **Spec coverage:** The 5 Tier 3 files named in #125 are each covered by exactly one task (Tasks 1–5). Each task applies the 10 gates from #125 (mapping shown in the "Gates applied" block). ✓
- **Placeholders:** No `TBD`, `TODO`, "implement later", "appropriate error handling", or stub-only steps. Every code block is complete and runnable. ✓
- **Type consistency:** `StoryArgs` double-cast uses `ComponentType<StoryArgs>` consistently. `GAME_COLOR_KEYS` imported from `@/lib/game-colors` in Tasks 2 and 3. `ConfigField` import path matches the existing story file in Task 4. `GameEngineState` / `ResolvedContent` / `ResolvedGameConfig` / `SessionMeta` import paths preserved from the existing ThemeShowcase file in Task 5. ✓
- **Cross-task coupling:** None. Each task touches exactly one file and pins its own worktree. ✓

Plan is ready for execution handoff.
