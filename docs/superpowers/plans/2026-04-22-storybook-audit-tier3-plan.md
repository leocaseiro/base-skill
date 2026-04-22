# Tier 3 Storybook Controls Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrofit the 5 Tier-3 Storybook files (4 root `src/components/*` + 1 `src/stories/ThemeShowcase.stories.tsx`) to the single-Default Playground pattern and Controls Policy defined in [`.claude/skills/write-storybook/SKILL.md`](../../../.claude/skills/write-storybook/SKILL.md) (as updated in PR #155) and the 10 rollout gates in issue #125.

**Architecture:** Two waves of independent subagents, one worktree/branch/PR per file. No shared files are touched across tasks — each task is fully self-contained, so the 5 tasks are safe to run in parallel in principle. Serialising into two waves (3 files → review checkpoint → 2 files) limits review load and catches pattern drift before Wave 2 starts. Each task writes exactly one `.stories.tsx` file, runs `yarn typecheck` + `yarn lint`, commits, pushes, and opens a PR against `master`.

**Tech Stack:** Storybook 10.3.3 (`@storybook/react-vite`), `storybook/test` subpath (exposes `fn`), `@storybook/addon-a11y` (global `a11y.test: 'error'`), `react-i18next` (wired globally via `.storybook/preview.tsx` — stories don't need a decorator), TanStack Router (only for `ThemeShowcase` via `withRouter`).

**Canonical references:**

- Controls policy: `.claude/skills/write-storybook/SKILL.md`
- Playground pattern spec: `.claude/skills/write-storybook/SKILL.md` — "Playground Pattern" + "When to Add Auxiliary Stories" sections (added in PR #155)
- Global skin decorator: `.storybook/decorators.tsx` `withDefaultSkin` (added in PR #154) — already applied to every story; Tier 3 stories inherit it automatically and must NOT add a per-file skin wrapper
- Shell-slim Default reference: `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx` (post-#154; per-file skin wrapper removed)
- Trigger-button pattern reference (for callbacks the Controls panel can't invoke): `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx`
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

- **Skin wrapping is global (PR #154).** The `withDefaultSkin` decorator in `.storybook/preview.tsx` wraps every story in `<div className="game-container skin-classic" style={classicSkin.tokens}>`. No Tier 3 task adds a per-file skin wrapper — doing so would create a double-wrap. None of the 5 target components consume `--skin-*` tokens themselves, so the global decorator's effect is inert for their visuals; we simply inherit it.
- **Handler wiring.** Every callback prop wired via `args: { onFoo: fn(), ... }` from `storybook/test` and hidden from the Controls panel via `argTypes: { onFoo: { table: { disable: true } } }`. Do not use `argTypes: { onFoo: { action: '…' } }`. Do not rely on the global `argTypesRegex` alone — react-docgen does not expand DOM-extended prop types, so the regex matches nothing for most handler props.
- **`StoryArgs` pattern.** When the component takes complex object props or has docgen-inferred rows we want to hide, declare an explicit `interface StoryArgs { … }` with controllable args, mark shadowed raw props as `?: never`, and double-cast `component: Foo as unknown as ComponentType<StoryArgs>`. See `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx` for the canonical shape.
- **Controls map (reminder).** Enum / union → `control: { type: 'select' }` + `options` (or `'radio'` for ≤4 options); boolean → `control: 'boolean'`; bounded number → `control: { type: 'range', min, max, step }`; free text → `control: 'text'`; callback → disabled in Controls and wired via `fn()` in `args`; JSX / complex object → `control: false` or `table: { disable: true }`. Never a raw JSON control for an enumerable domain.
- **Single-Default Playground pattern (PR #155).** Every Tier 3 file ships exactly one `Default: Story = {}` driven by proper interactive controls. Auxiliary named stories are added only for scenarios the Playground's controls cannot express — the skill's "When to Add Auxiliary Stories" section enumerates legitimate exceptions (surveys like `AllColors`, pinned themes or viewports for `play()` assertions, stateful trigger-button wrappers). Enum-per-value, state-variant, and edge-case snapshots that a control toggle reaches are NOT legitimate auxiliaries — delete them. Story name is `Default` (not `Playground`); "Playground" is the conceptual label per the skill.
- **Dark-mode stories.** The theme toolbar (registered globally in `.storybook/preview.tsx`) lets reviewers toggle themes interactively — do not add `DefaultDark` / `WithXDark` duplicates. Pin a story to a specific theme only when the variant exercises something theme-specific that the toolbar can't reproduce in one tap (surveys like `AllColorsDark`, VR baseline stories like `ThemeShowcase`'s 4 theme-pinned stories). Prefer `globals: { theme: '<name>' }` over the legacy `withDarkMode` decorator.
- **Import order (ESLint `import/order`).** Value imports alphabetical → relative imports alphabetical → `storybook/test` → `@storybook/react` type import → `react` / JSX type imports last. If lint complains, regroup.
- **Per-task verification (always before commit).** `yarn typecheck` → exit 0; `yarn lint` → exit 0. Do **not** run `yarn test:storybook` per file — too slow; the full run lives in CI when the PR opens.
- **Optional local visual check.** Each subagent may (but is not required to) start a Storybook on a free port (6106+) inside its worktree and navigate to the target stories in a browser — or run a Playwright script to screenshot them — before writing diffs. Kill the Storybook process when done. Use the workflow from `.claude/skills/write-storybook/SKILL.md` ("Running Storybook Tests"). Skip this step if Docker/Storybook bootstrap is flaky; the CI `yarn test:storybook` run is the authoritative gate.
- **Commit message shape.** `stories(<area>/<name>): retrofit per single-Default Playground`. Body lists the gates applied and any variant dropped with reason. Co-authored trailer.
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
- Gate 4 — Global skin (PR #154) — no per-file wrapper.
- Gate 5 — Hide shadowed docgen row for `cards`.
- Gate 6 — Collapse: 2 existing stories (`Default`, `Empty`) collapse into the single `Default` Playground — `cardCount` range (0–12) reaches every state from Controls in one click; no scenario exports are needed.
- Gate 8 — Single-Default pattern (PR #155): one `Default` story. Edge cases (empty / many) reachable via the `cardCount` range — no separate exports. No interactive component → no `play()`.

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

  export const Default: Story = {};
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
  stories(components/GameGrid): retrofit per single-Default Playground

  StoryArgs exposes a cardCount range (0–12); cards is shadowed and
  hidden from Controls. Sample GameCards inside the render wire
  onPlay/onOpenCog to fn() spies. Single Default story per the
  Playground pattern in .claude/skills/write-storybook/SKILL.md
  (added in PR #155).

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-grid-audit
  gh pr create --base master --title "stories(components/GameGrid): retrofit per single-Default Playground" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 1 of 5 — retrofits `src/components/GameGrid.stories.tsx` to the single-Default Playground pattern defined in
  [`.claude/skills/write-storybook/SKILL.md`](../blob/master/.claude/skills/write-storybook/SKILL.md) (added in PR #155) and
  the Controls Policy in issue #125.

  - `cardCount` range (0–12) drives how many GameCards render.
  - `cards` is shadowed (`?: never` + `table: { disable: true }`) — never meaningful as a control.
  - Sample cards wire `onPlay` / `onOpenCog` to `fn()` spies.
  - Single `Default` story — the `cardCount` range reaches every prior state (0, 3, 12).
  - Skin wrapping is handled by the global `withDefaultSkin` decorator (PR #154); no per-file wrapper.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel drives the single `Default` export (cardCount slider reaches 0, 3, and 12 cards visibly)
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
- Gate 4 — Global skin (PR #154) — no per-file wrapper.
- Gate 5 — Hide shadowed docgen rows for `chips`, `cover`, `onPlay`, `onOpenCog`, `onToggleBookmark`.
- Gate 6 — Collapse: 7 existing scenario exports (Default, CustomGame, CustomGamePurple, NotBookmarked, Bookmarked, NotBookmarkedCustomGame, BookmarkedCustomGame) all reduce to arg tweaks on a single `Default` Playground — the `variant` radio, `customGameColor` select, `bookmarkable` + `isBookmarked` booleans, and `chipsText` text control reach every state from Controls in ≤2 clicks. Drop all 7; keep only `Default`.
- Gate 7 — Real-game parity: in production, `GameCard` renders inside `GameGrid`'s responsive columns (~260–300px wide at xl/2xl breakpoints). In isolation it has no width constraint and stretches to the full canvas, so the cover image dominates. The `Default` story's `render` wraps the card in `<div className="w-64">` (256px) and the meta pins `parameters: { layout: 'centered' }` so the card renders at a realistic grid-cell size, centred in the preview.
- Gate 8 — Single-Default pattern (PR #155): one `Default` story. Enum-per-value (variant), state variants (bookmark on/off), and colour variations are all reachable from the Controls panel — no separate exports.

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
    parameters: { layout: 'centered' },
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

      // w-64 (256px) ≈ a typical GameGrid cell width at xl/2xl breakpoints.
      // Without this wrapper GameCard stretches to the full canvas and the
      // cover image dwarfs the card chrome.
      return (
        <div className="w-64">
          {variant === 'customGame' ? (
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
          ) : (
            <GameCard
              variant="default"
              gameId={gameId}
              title={title}
              chips={chips}
              onPlay={fn()}
              onOpenCog={fn()}
              {...bookmarkProps}
            />
          )}
        </div>
      );
    },
  };
  export default meta;

  type Story = StoryObj<StoryArgs>;

  export const Default: Story = {};

  // deleted-for-reference — every prior export is reachable from Default's Controls:
  //   CustomGame               → variant='customGame', customGameColor='amber'
  //   CustomGamePurple         → variant='customGame', customGameColor='purple', chipsText='⬇️ Down, 10 numbers, 3s'
  //   NotBookmarked            → bookmarkable=true, isBookmarked=false
  //   Bookmarked               → bookmarkable=true, isBookmarked=true
  //   NotBookmarkedCustomGame  → variant='customGame', customGameColor='amber', bookmarkable=true, isBookmarked=false
  //   BookmarkedCustomGame     → variant='customGame', customGameColor='amber', bookmarkable=true, isBookmarked=true
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
  stories(components/GameCard): retrofit per single-Default Playground

  StoryArgs with proper controls: variant radio, customGameColor select
  from GAME_COLOR_KEYS, chipsText split on commas, isBookmarked +
  bookmarkable booleans. All handlers (onPlay, onOpenCog,
  onToggleBookmark) wired via fn() in render; hidden from Controls via
  table.disable. Shadowed raw props (chips, cover, onPlay, onOpenCog,
  onToggleBookmark) hidden via ?: never + table.disable.

  Collapse the 7 prior scenario exports into a single Default story —
  variant radio, customGameColor select, bookmarkable + isBookmarked
  booleans, and chipsText text reach every prior state from Controls
  in ≤2 clicks. Matches the single-Default Playground pattern in
  .claude/skills/write-storybook/SKILL.md (added in PR #155).

  Render realism: wrap the card in <div className="w-64"> (256px ≈ a
  typical GameGrid cell width at xl/2xl breakpoints) and pin
  parameters.layout to 'centered' so the card renders at a realistic
  size instead of stretching to the full Storybook canvas.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-card-audit
  gh pr create --base master --title "stories(components/GameCard): retrofit per single-Default Playground" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 2 of 5 — retrofits `src/components/GameCard.stories.tsx` to the single-Default Playground pattern
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md) — added in PR #155) and the Controls Policy in issue #125.

  - `variant` radio, `customGameColor` select from `GAME_COLOR_KEYS`, `chipsText` splits on commas.
  - `isBookmarked` + `bookmarkable` expose the full bookmark matrix via args.
  - Handlers wired via `fn()` in the render function; raw prop rows hidden from Controls.
  - Collapse 7 prior scenario exports into a single `Default` story — every prior state is reachable from Controls in ≤2 clicks.
  - Render realism: card is wrapped in `<div className="w-64">` (~grid-cell size) and the meta pins `layout: 'centered'` so it no longer stretches to the full canvas (the pre-retrofit story rendered at ~1200px wide, dominated by the cover image).
  - Skin wrapping is handled by the global `withDefaultSkin` decorator (PR #154); no per-file wrapper.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel drives variant / customGameColor / bookmark combinations
  - [ ] Card renders at realistic grid-cell width (not stretched to full canvas)
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
- Gate 4 — Global skin (PR #154) — no per-file wrapper. Note that `--game-play` + `game-bg` / `game-text` are the game-colors palette, not skin tokens; they live at the component level and are unaffected by the global decorator.
- Gate 5 — N/A (no shadowed props — all props are primitive and controllable).
- Gate 6 — Collapse: drop `Default` (keep as the canonical name — see below), `WithCustomGame` (reachable via `customGameName` + `customGameColor` controls), `WithSubject` (reachable via `subject` control), and the 3 `*Dark` duplicates (`DefaultDark`, `WithCustomGameDark`, `WithSubjectDark` — theme toolbar covers dark review). Drop `AllColorsDark` too — a single toolbar flip reproduces it. Keep the single `Default` Playground + `AllColors` (12-colour survey is NOT reachable from Controls in one click; per the skill's "When to Add Auxiliary Stories", surveys are a legitimate auxiliary).
- Gate 8 — Single-Default pattern (PR #155): one `Default` Playground + one legitimate auxiliary (`AllColors`). Per-value enum (`customGameColor`) and state variants (custom-game on/off, subject on/off) are reachable from Controls without separate exports.
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
  ```

- [ ] **Step 3: Verify.**

  ```bash
  yarn typecheck
  yarn lint
  ```

  Both must exit 0. If lint flags the `GameColorKey` import as unused, it's because we dropped all `customGameColor`-typed scenario args in the collapse — the cleanup is already reflected in Step 2's code block.

- [ ] **Step 4: Commit.**

  ```bash
  git add src/components/GameNameChip.stories.tsx
  git commit -m "$(cat <<'EOF'
  stories(components/GameNameChip): retrofit per single-Default Playground

  Add argTypes controls for title, customGameName, customGameColor
  (select from GAME_COLOR_KEYS), subject. Collapse to Default +
  AllColors — drop WithCustomGame, WithSubject, DefaultDark,
  WithCustomGameDark, WithSubjectDark, AllColorsDark. WithCustomGame
  and WithSubject are reachable from Controls; the four *Dark variants
  are reachable by a theme-toolbar flip. Keep AllColors as a 12-colour
  palette survey — a legitimate auxiliary per the skill's "When to
  Add Auxiliary Stories" section (PR #155): it's not reachable from
  Controls in one click.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/game-name-chip-audit
  gh pr create --base master --title "stories(components/GameNameChip): retrofit per single-Default Playground" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 3 of 5 — retrofits `src/components/GameNameChip.stories.tsx` to the single-Default Playground pattern
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md) — added in PR #155) and the Controls Policy in issue #125.

  - `customGameColor` → select from `GAME_COLOR_KEYS`; `title`, `customGameName`, `subject` → text controls.
  - Collapse to `Default` + `AllColors` only. Drop `WithCustomGame`, `WithSubject` (reachable from Controls) and all 4 `*Dark` variants (theme toolbar reproduces them).
  - Kept `AllColors` as a legitimate auxiliary per the skill's "When to Add Auxiliary Stories" — a 12-colour palette survey is NOT reachable from Controls in one click.
  - Skin wrapping is handled by the global `withDefaultSkin` decorator (PR #154); no per-file wrapper.

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
- No per-file skin wrapper added anywhere — the global `withDefaultSkin` decorator (PR #154) handles it. If a Wave 1 PR contains a `<div className="game-container skin-...">` wrapper, it's a bug and must be removed.

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
- Gate 2 — Structured inputs: `scenario` → select with 5 generic presets (one per rendering branch of `ConfigFormFields.tsx`: primitive field types, nested types, dual select-or-number, visibleWhen-hidden, visibleWhen-shown). No game-specific vocabulary in this generic story file — per-game fixtures are an additive follow-up in #153.
- Gate 3 — Handler wiring: `onChange` wired to `fn()` in `args`; hidden from Controls.
- Gate 4 — Global skin (PR #154) — no per-file wrapper.
- Gate 5 — Hide shadowed rows for `fields`, `config`.
- Gate 6 — Collapse + genericise: the 4 SortNumbers-flavoured scenario exports + `AllFieldTypesDark` all reduce to a single `Default` Playground. Simultaneously, the SortNumbers-specific `sortFields` fixture is REPLACED by 4 small generic fixtures (one per rendering branch of `ConfigFormFields.tsx`), each selectable via the `scenario` control. Per-game fixtures (SortNumbers, NumberMatch, etc.) live in their own co-located stories under `src/games/<game>/` — added additively in #153.
- Gate 8 — Single-Default pattern (PR #155): one `Default` story. Every rendering branch (primitive / nested / select-or-number / visibleWhen hidden / visibleWhen shown) is reachable from the scenario select — no separate exports.
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
    | 'primitive-types'
    | 'nested-types'
    | 'nested-select-or-number'
    | 'visible-when-hidden'
    | 'visible-when-shown';

  interface StoryArgs {
    scenario: Scenario;
    onChange: (config: Record<string, unknown>) => void;
    // Shadowed raw props — driven by scenario; hidden from Controls.
    fields?: never;
    config?: never;
  }

  // Generic fixtures — one per rendering branch of ConfigFormFields.tsx.
  // Per-game fixtures (SortNumbers etc.) live in co-located game stories
  // under src/games/<game>/ (see #153), not here.

  const primitiveFields: ConfigField[] = [
    {
      type: 'select',
      key: 'size',
      label: 'Size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
    },
    {
      type: 'number',
      key: 'count',
      label: 'Count',
      min: 1,
      max: 20,
    },
    {
      type: 'checkbox',
      key: 'enabled',
      label: 'Enabled',
    },
  ];

  const nestedFields: ConfigField[] = [
    {
      type: 'nested-select',
      key: 'group',
      subKey: 'mode',
      label: 'Group mode',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'manual', label: 'Manual' },
      ],
    },
    {
      type: 'nested-number',
      key: 'group',
      subKey: 'size',
      label: 'Group size',
      min: 1,
      max: 10,
    },
  ];

  const selectOrNumberFields: ConfigField[] = [
    {
      type: 'nested-select-or-number',
      key: 'range',
      subKey: 'max',
      label: 'Max range',
      min: 1,
      max: 100,
    },
  ];

  const visibleWhenFields: ConfigField[] = [
    {
      type: 'select',
      key: 'mode',
      label: 'Mode',
      options: [
        { value: 'simple', label: 'Simple' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
    {
      type: 'nested-number',
      key: 'advanced',
      subKey: 'threshold',
      label: 'Threshold',
      min: 1,
      max: 100,
      visibleWhen: { key: 'mode', value: 'advanced' },
    },
  ];

  const scenarioData: Record<
    Scenario,
    { fields: ConfigField[]; config: Record<string, unknown> }
  > = {
    'primitive-types': {
      fields: primitiveFields,
      config: { size: 'medium', count: 5, enabled: true },
    },
    'nested-types': {
      fields: nestedFields,
      config: { group: { mode: 'auto', size: 4 } },
    },
    'nested-select-or-number': {
      fields: selectOrNumberFields,
      config: { range: { max: 10 } },
    },
    'visible-when-hidden': {
      fields: visibleWhenFields,
      config: { mode: 'simple', advanced: { threshold: 50 } },
    },
    'visible-when-shown': {
      fields: visibleWhenFields,
      config: { mode: 'advanced', advanced: { threshold: 50 } },
    },
  };

  const meta: Meta<StoryArgs> = {
    component: ConfigFormFields as unknown as ComponentType<StoryArgs>,
    tags: ['autodocs'],
    args: {
      scenario: 'primitive-types',
      onChange: fn(),
    },
    argTypes: {
      scenario: {
        control: { type: 'select' },
        options: [
          'primitive-types',
          'nested-types',
          'nested-select-or-number',
          'visible-when-hidden',
          'visible-when-shown',
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

  export const Default: Story = {};

  // The prior 4 scenario exports (AllFieldTypes + 3 SortNumbers presets) and
  // AllFieldTypesDark are all removed. The `scenario` select in Controls
  // reaches every rendering branch of ConfigFormFields generically. Per-game
  // form previews (SortNumbers' real fixtures, NumberMatch, WordSpell, etc.)
  // live as co-located stories in each game's src/games/<game>/ directory —
  // see issue #153 for the additive follow-up.
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
  stories(components/ConfigFormFields): retrofit per single-Default Playground

  StoryArgs with scenario select (primitive-types / nested-types /
  nested-select-or-number / visible-when-hidden / visible-when-shown)
  — each preset exercises one rendering branch of ConfigFormFields.tsx
  with generic field fixtures. onChange wired to fn() spy and hidden
  from Controls. Complex props (fields, config) shadowed via ?: never
  + table.disable.

  Collapse the 4 prior SortNumbers-flavoured scenario exports +
  AllFieldTypesDark into a single Default story — the scenario select
  reaches every rendering branch from Controls in one click; the theme
  toolbar reproduces dark. Simultaneously replace the SortNumbers-
  specific sortFields fixture with 4 generic fixtures; the SortNumbers
  fixtures now only belong in their own co-located game story (added
  additively in #153). Matches the single-Default Playground pattern
  in the skill (added in PR #155).

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/config-form-fields-audit
  gh pr create --base master --title "stories(components/ConfigFormFields): retrofit per single-Default Playground" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 4 of 5 — retrofits `src/components/ConfigFormFields.stories.tsx` to the single-Default Playground pattern
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md) — added in PR #155) and the Controls Policy in issue #125.

  - `scenario` select in Controls drives 5 generic presets — one per rendering branch of `ConfigFormFields.tsx` (primitive / nested / select-or-number / visibleWhen hidden / visibleWhen shown). No game-specific vocabulary.
  - `onChange` wired to `fn()`; hidden from Controls.
  - Complex props (`fields`, `config`) shadowed via `?: never` + `table.disable`.
  - Collapse the 4 prior SortNumbers-flavoured scenario exports + `AllFieldTypesDark` into a single `Default` story, and replace the SortNumbers-specific `sortFields` fixture with 5 generic fixtures. Theme toolbar reproduces dark.
  - Skin wrapping is handled by the global `withDefaultSkin` decorator (PR #154); no per-file wrapper.
  - Follow-up tracked in #153 is now additive: add per-game `*.config-form.stories.tsx` files (SortNumbers, NumberMatch, etc.) using each game's real fixtures, mirroring PR #143's `InstructionsOverlay` per-game pattern. No further edits to this generic story are required by #153.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] scenario select on the `Default` story cycles through all 5 generic branches (primitive / nested / select-or-number / visibleWhen hidden / visibleWhen shown); theme toolbar cycles dark/light
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
- Gate 4 — Global skin (PR #154) — no per-file wrapper. `ThemeShowcase` is a theme-token showcase; the skin decorator's CSS vars don't conflict with theme-token rendering.
- Gate 5 — Hide shadowed rows for `config`, `moves`, `initialState`, `sessionId`, `meta`, `initialLog`, `children`.
- Gate 6 — Collapse: drop 3 of the 4 theme-pinned stories (OceanDark, ForestLight, ForestDark). The theme toolbar (5 themes registered globally in `.storybook/preview.tsx`) lets the reviewer cycle through every theme from the single `Default` story in one tap each. VR in this project is Playwright-driven (`e2e/visual.spec.ts`) — Storybook stories do not double as VR baselines, so the "distinct snapshots" argument doesn't hold.
- Gate 8 — Single-Default pattern (PR #155): one `Default` story. The toolbar provides the per-theme "different views" control.
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
            'Token-only page composed from GameShell + GameNameChip + ConfigFormFields. Cycle through the 5 registered themes via the toolbar. The global `withDefaultSkin` decorator wraps the preview — unaffected here because this file renders against theme tokens, not skin tokens.',
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

  export const Default: Story = {};

  // deleted-for-reference — the theme toolbar reproduces every prior pin in one tap:
  //   OceanLight  → toolbar theme='light'  (default)
  //   OceanDark   → toolbar theme='dark'
  //   ForestLight → toolbar theme='forest-light'
  //   ForestDark  → toolbar theme='forest-dark'
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
  stories(stories/ThemeShowcase): retrofit per single-Default Playground

  Hide all 7 GameShell-prop docgen rows from the Controls panel
  (config, moves, initialState, sessionId, meta, initialLog, children)
  via argTypes.table.disable. Collapse the 4 theme-pinned exports
  (OceanLight, OceanDark, ForestLight, ForestDark) into a single
  Default story — the theme toolbar reproduces each pin in one tap.
  VR in this project is Playwright (e2e/visual.spec.ts), not Storybook,
  so the "distinct VR snapshots" argument doesn't hold. Matches the
  single-Default Playground pattern in the skill (added in PR #155).

  Skin wrapping handled globally by the withDefaultSkin decorator
  (PR #154). Docs description updated to note the theme-toolbar
  workflow.

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 5: Push and open PR.**

  ```bash
  git push -u origin stories/theme-showcase-audit
  gh pr create --base master --title "stories(stories/ThemeShowcase): retrofit per single-Default Playground" --body "$(cat <<'EOF'
  ## Summary

  Tier 3, file 5 of 5 — retrofits `src/stories/ThemeShowcase.stories.tsx` to the single-Default Playground pattern
  ([skill](../blob/master/.claude/skills/write-storybook/SKILL.md) — added in PR #155) and the Controls Policy in issue #125.

  - Hide all 7 GameShell-prop rows from Controls (`config`, `moves`, `initialState`, `sessionId`, `meta`, `initialLog`, `children`) via `argTypes.table.disable`.
  - Collapse the 4 theme-pinned exports into a single `Default` — the theme toolbar reproduces every pin in one tap. VR is Playwright (`e2e/visual.spec.ts`), not Storybook, so a distinct-snapshot-per-story argument doesn't apply.
  - Skin wrapping handled globally by `withDefaultSkin` (PR #154); no per-file wrapper.

  Closes part of #125.

  ## Test plan

  - [ ] `yarn typecheck` green
  - [ ] `yarn lint` green
  - [ ] `yarn test:storybook` green (runs in CI)
  - [ ] Controls panel is empty on the `Default` story (all 7 docgen rows hidden)
  - [ ] Theme toolbar cycles through all 5 registered themes on the single `Default` story
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
- Retrofitting the remaining 4 root-components files (`Footer`, `Header`, `OfflineIndicator`, `ThemeToggle`, `UpdateBanner`) — they are still in the Tier 5 / Batch 5 bucket on #125 and should get their own plan.
- Adding per-game `*.config-form.stories.tsx` files (e.g. `src/games/sort-numbers/SortNumbers.config-form.stories.tsx`) using each game's real `ConfigField[]` fixtures — tracked in #153 as an additive follow-up, mirroring #143's per-game `InstructionsOverlay` pattern. Task 4 ships the generic `ConfigFormFields` story with 5 generic fixtures only; no SortNumbers vocabulary — so #153 adds new files without needing to remove anything from the generic story.

---

## Upstream work already merged (informs this plan)

- **PR #154** — `classicSkin` is now applied globally via `withDefaultSkin` in `.storybook/preview.tsx`. No Tier 3 task adds a per-file skin wrapper. Per-file wrappers previously present on `AnswerGame`, `ProgressHUD`, `Slot` were removed in #154; they are the current shell-slim references.
- **PR #155** — The `.claude/skills/write-storybook/SKILL.md` skill now has explicit "Playground Pattern" + "When to Add Auxiliary Stories" sections. Every Tier 3 task ships a single `Default` story and auxiliary exports only when the Controls panel can't reach the scenario (e.g., Task 3's `AllColors` palette survey).

---

## Self-review

- **Spec coverage:** The 5 Tier 3 files named in #125 are each covered by exactly one task (Tasks 1–5). Each task applies the 10 gates from #125 (mapping shown in the "Gates applied" block). ✓
- **Placeholders:** No `TBD`, `TODO`, "implement later", "appropriate error handling", or stub-only steps. Every code block is complete and runnable. ✓
- **Type consistency:** `StoryArgs` double-cast uses `ComponentType<StoryArgs>` consistently. `GAME_COLOR_KEYS` imported from `@/lib/game-colors` in Tasks 2 and 3. `ConfigField` import path matches the existing story file in Task 4. `GameEngineState` / `ResolvedContent` / `ResolvedGameConfig` / `SessionMeta` import paths preserved from the existing ThemeShowcase file in Task 5. ✓
- **Cross-task coupling:** None. Each task touches exactly one file and pins its own worktree. ✓
- **Single-Default Playground consistency (PR #155):** Every task ships a single `Default` story (the Playground) plus auxiliary stories only for scenarios the Controls panel or theme toolbar can't reach. Task 1 (GameGrid): `Default` only. Task 2 (GameCard): `Default` only. Task 3 (GameNameChip): `Default` + `AllColors` survey (12-colour palette — Controls can't reach it in one click; legitimate auxiliary per the skill). Task 4 (ConfigFormFields): `Default` only — the `scenario` select covers every `visibleWhen` branch. Task 5 (ThemeShowcase): `Default` only — the theme toolbar cycles through all 5 themes. ✓
- **Skin wrapping (PR #154):** Zero per-file wrappers added; every story inherits `withDefaultSkin` from `.storybook/preview.tsx`. ✓

Plan is ready for execution handoff.
