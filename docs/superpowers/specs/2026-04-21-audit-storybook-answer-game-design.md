# Audit Batch 2 — retrofit `src/components/answer-game/*` stories to the new Controls Policy

## Goal

Bring the 8 `src/components/answer-game/*.stories.tsx` files into compliance with
the Controls Policy and Required Variants gates in
`.claude/skills/write-storybook/SKILL.md`. This is Batch 2 of the audit rollout
tracked in issue #125 — following the pilot (`src/components/ui/*`, PR #124)
which proved the pattern end-to-end.

Three of the eight files are upgraded beyond minimal compliance: their current
stories are static render dumps with no meaningful controls or interaction.
Those get rebuilt as genuine interactive playgrounds so designers and QA can
actually drive state from the Controls panel and `play()` assertions prove the
primary flows still work.

## Background

PR #124 merged the pilot audit for `src/components/ui/*`, and PR #119 had
established the Controls Policy itself. Key rules carried forward:

- Every non-callback, non-JSX prop has a proper `argTypes` control
  (`select` / `radio` / `boolean` / `range` / `text`) — no raw JSON fallbacks.
- Every `onFoo` handler is wired to `args: { onFoo: fn() }` from
  `storybook/test`, NOT to `{ action: 'xxx' }`. (`.storybook/preview.tsx` sets a
  global `argTypesRegex`, but react-docgen does not expand DOM-extended prop
  types, so handler wiring must be explicit.)
- At least one `play()` interaction story on every interactive component.
- Required Variants gates are present (Default, enum-per-value where visuals
  differ, state variants, edge cases).

The answer-game batch is materially different from the pilot in three ways:

1. **Config-object props.** `AnswerGame` and `InstructionsOverlay` both accept
   a `config` object. The Complex Object Props pattern from SKILL.md applies —
   each meaningful field becomes a top-level `StoryArgs` entry.
2. **Compound / scene components.** `AnswerGame` uses a compound API
   (`AnswerGame.Question/Answer/Choices`). `Slot` is currently 8 fully-bespoke
   scene stories that build their own `AnswerGameProvider` config. These
   require rendering strategies that don't appear in the pilot.
3. **Timer / animation side effects.** `EncouragementAnnouncer` auto-dismisses
   after 2s. `GameOverOverlay`, `LevelCompleteOverlay`, and `ScoreAnimation`
   fire `canvas-confetti` on mount. `InstructionsOverlay` calls `speak()` when
   `ttsEnabled` is true. These shape which `play()` flows are feasible.

## In scope

Eight story files:

```text
src/components/answer-game/AnswerGame/AnswerGame.stories.tsx
src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx
src/components/answer-game/GameOverOverlay/GameOverOverlay.stories.tsx
src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx
src/components/answer-game/LevelCompleteOverlay/LevelCompleteOverlay.stories.tsx
src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx
src/components/answer-game/ScoreAnimation/ScoreAnimation.stories.tsx
src/components/answer-game/Slot/Slot.stories.tsx
```

Each file is audited against the seven gates in the `Audit / Upgrade Checklist`
section of `.claude/skills/write-storybook/SKILL.md`. Three files are upgraded
beyond minimal compliance per the "make nice ones" directive:

- `AnswerGame` becomes a real interactive playground — live
  `AnswerGameProvider`, real tile bank, real slots, driven by Controls.
- `InstructionsOverlay` becomes actually clickable (real `StoryArgs` controls
  and `play()` flows for Start / Bookmark / Settings).
- `Slot`'s 8 scene stories collapse into a single `Playground` story whose
  controls reproduce every prior scene through arg toggles.

## Out of scope

- **Remaining 26 story files.** `questions/*`, `games/*`, component roots
  (`GameCard`, `GameGrid`, `Footer`, etc.) stay on issue #125 for later
  batches.
- **Component fixes.** If the `Slot` playground reveals broken tokens (you
  flagged these; they may stem from the skin pattern rollout), log as a
  follow-up issue. This audit is story-only.
- **`AnswerGame.play()` drag-and-drop.** HTML5 DnD events aren't reliably
  synthesised by `userEvent` in jsdom; skip the `play()` rather than fight
  it. The controls-driven playground is sufficient to meet "nice playground"
  without a brittle drag assertion.
- **InstructionsOverlay TTS crash.** Tracked separately. Every story keeps
  `ttsEnabled: false` so no `play()` triggers the `speak()` path.
- **Design-token contrast.** Same posture as the pilot — don't touch axe
  opt-outs if any show up; raise a separate token-fix PR if needed.
- **Fixture extraction, theme pins, viewport pins.** Only retrofit
  speculatively if a file obviously calls for it while we're already in
  there.

## Non-goals

- No refactors of the underlying answer-game components (reducers,
  `AnswerGameProvider`, `Slot`, `SlotRow`, overlays).
- No changes to `.storybook/preview.tsx` or global config.
- No changes to `.claude/skills/write-storybook/SKILL.md`. If a gap surfaces
  mid-audit, it lands as a separate SKILL-update PR.

## Per-file audit

Summary. Full detail per file below.

| #   | File                     | Tier    | `play()`                                             | Tag      |
| --- | ------------------------ | ------- | ---------------------------------------------------- | -------- |
| 1   | `EncouragementAnnouncer` | Simple  | `AutoDismissesAfter2s` (fake timers)                 | upgrade  |
| 2   | `GameOverOverlay`        | Simple  | `ClicksPlayAgain`, `ClicksHome`                      | retrofit |
| 3   | `LevelCompleteOverlay`   | Simple  | `ClicksNextLevel`, `ClicksDone`                      | retrofit |
| 4   | `ProgressHUD`            | Simple  | — (pure display)                                     | retrofit |
| 5   | `ScoreAnimation`         | Simple  | — (pure display)                                     | retrofit |
| 6   | `InstructionsOverlay`    | Complex | `StartsGame`, `TogglesBookmark`, `OpensSettings`     | upgrade  |
| 7   | `AnswerGame`             | Complex | — (DnD unreliable in jsdom)                          | upgrade  |
| 8   | `Slot`                   | Complex | — (scene manipulation via dispatch, not user events) | upgrade  |

### 1. `EncouragementAnnouncer` (upgrade)

- **Controls retrofit.** `StoryArgs`: `message` (text), `visible` (boolean).
- **`fn()` cleanup.** Replace `onDismiss: { action: 'dismissed' }` with
  `args: { onDismiss: fn() }`.
- **State variants.** Keep `Hidden`, `Visible`; add **`ReplayTrigger`** — a
  render-wrapped `ShowTrigger` button that re-fires the card so the story is
  interactive rather than a static card.
- **`play()`.** **`AutoDismissesAfter2s`** — `vi.useFakeTimers()` inside
  `play()`, click the trigger, `vi.advanceTimersByTime(2000)`, assert the
  `onDismiss` spy was called and the card is gone. `vi.useRealTimers()` in
  cleanup so neighbouring stories are unaffected.

### 2. `GameOverOverlay`

- **Controls retrofit.** `StoryArgs`: `retryCount` range (0–10, step 1).
- **`fn()` cleanup.** Replace `{ action: 'playAgain' }` /
  `{ action: 'home' }` with `onPlayAgain: fn()`, `onHome: fn()`.
- **State variants.** One per visible star count —
  `FiveStars` (retryCount 0), `FourStars` (1–2), `ThreeStars` (3–4),
  `TwoStars` (5–6), `OneStar` (7+).
- **`play()`.** **`ClicksPlayAgain`**, **`ClicksHome`** — click the button,
  assert the spy called once.

### 3. `LevelCompleteOverlay`

- **Controls retrofit.** `StoryArgs`: `level` range (1–20).
- **`fn()` cleanup.** Replace `{ action: 'nextLevel' }` / `{ action: 'done' }`
  with `onNextLevel: fn()`, `onDone: fn()`.
- **State variants.** Keep `Level1`, `Level3`, `Level10`.
- **`play()`.** **`ClicksNextLevel`**, **`ClicksDone`** — click + assert spy.
- **Note.** Confetti fires on mount; no timer work required for `play()`.

### 4. `ProgressHUD`

- **Controls retrofit.** `StoryArgs`: `roundIndex` range, `totalRounds` range
  (1–20), `totalRoundsIsNull` boolean (when true, the render function passes
  `null` as `totalRounds` to the component — used to exercise the unbounded
  level-mode path), `levelIndex` range, `isLevelMode` boolean, `phase` select
  (`playing` / `round-complete`), `showDots` boolean, `showFraction` boolean,
  `showLevel` boolean.
- **`fn()` cleanup.** N/A — no handlers.
- **State variants.** All existing 9 stories kept and re-typed against
  `StoryArgs`.
- **`play()`.** N/A — pure display.
- **Note.** Fix `@storybook/react-vite` → `@storybook/react` import to match
  project convention.

### 5. `ScoreAnimation`

- **Controls retrofit.** `StoryArgs`: `visible` boolean.
- **`fn()` cleanup.** N/A.
- **State variants.** Keep `Playing`, `Complete`.
- **`play()`.** N/A — pure display with a confetti side effect, no flow to
  drive.

### 6. `InstructionsOverlay` (upgrade)

- **Controls retrofit.** `StoryArgs`: `text`, `gameTitle`, `gameId`,
  `customGameColor` select (options drawn from `GAME_COLORS`), `ttsEnabled`
  boolean, `isBookmarked` boolean, `config.totalRounds` range,
  `customGameName` text, `customGameId` text.
- **`fn()` cleanup.** Replace all `{ action: '…' }` entries with
  `args: { onStart: fn(), onSaveCustomGame: fn(), onUpdateCustomGame: fn(),
onToggleBookmark: fn() }`.
- **Decorators.** `withDb` + `withRouter` (the component uses `useNavigate`).
- **State variants.** Keep the existing seven stories (`Default`,
  `WithCustomGame`, `WordSpellDefault`, `NotBookmarked`, `Bookmarked`,
  `NotBookmarkedCustomGame`, `BookmarkedCustomGame`), re-typed against
  `StoryArgs`.
- **`play()`.**
  - **`StartsGame`** — click the Start button, assert `onStart` spy called.
  - **`TogglesBookmark`** — click the bookmark button, assert
    `onToggleBookmark` spy called.
  - **`OpensSettings`** — click Settings, scope assertion to
    `within(document.body)` (Radix portal), assert the modal dialog is
    visible, press Escape, assert it closes.
- **TTS guard.** Every story keeps `ttsEnabled: false` so no `play()` triggers
  `speak()`. This avoids the known Chrome TTS crash path (tracked separately).

### 7. `AnswerGame` (upgrade — real playground)

- **Controls retrofit.** `StoryArgs` breaks `config` into individual controls:
  - `inputMethod` select — `drag` / `type`.
  - `wrongTileBehavior` select — `reject` / `lock-manual` / `lock-auto-eject`.
  - `tileBankMode` select — `exact` / `extra`.
  - `totalRounds` range (1–20).
  - `ttsEnabled` boolean.
- **`fn()` cleanup.** N/A — the shell has no handlers; children carry them.
- **Decorators.** `withDb`.
- **State variants.** Keep four stories matching the main
  `wrongTileBehavior` / `inputMethod` combinations: `Default` (drag +
  lock-auto-eject), `TextQuestionMode` (type), `RejectMode`, `LockManualMode`.
- **`play()`.** **Skipped.** HTML5 drag-and-drop is unreliable in jsdom; the
  playground meets the "nice" bar without a brittle DnD assertion.
- **Render.** Wires a real `AnswerGameProvider` + minimal real `Slot`s +
  minimal real `TileBank` (same primitives used by NumberMatch). The story
  becomes a playable mini-game whose `config` is drivable from the Controls
  panel.

### 8. `Slot` (upgrade — single playground)

- **Controls retrofit.** `StoryArgs`:
  - `variant` select — `letter` / `dice` / `domino` / `inline-gap`.
  - `label` text.
  - `filled` boolean.
  - `isWrong` boolean.
  - `dragPreview` select — `none` / `target-empty` / `target-swap`.
- **`fn()` cleanup.** N/A.
- **Decorators.** `withDb`.
- **State variants.** Single **`Playground`** story replaces all 8 existing
  scenes. The old scenes are dropped (git history is the inventory).
- **`play()`.** N/A — drag state is simulated by dispatch, not user events.
- **Render.** Wraps in `AnswerGameProvider`, assembles zones/tiles from args,
  dispatches drag state when `dragPreview !== 'none'`. Remove the
  `import React from 'react'` at line 1 (use a named `useEffect` import).

### Rationale for upgrades

**`AnswerGame` as real playground.** The shell renders nothing interactive by
itself — its children carry all user input. A placeholder-child story shows a
layout but isn't drivable. Wiring a minimal real `AnswerGameProvider` + real
`Slot`s + real `TileBank` turns the story into a working mini-game whose
`config` is drivable from the Controls panel. Cost: one render function is
longer; benefit: the story does what a designer/QA would expect.

**`InstructionsOverlay` as interactive story.** The existing stories pass
`onStart: () => {}` so clicking Start does nothing visible. Replacing with
`fn()` spies + three `play()` stories covering Start / Bookmark / Settings
turns the story into a proof-of-behaviour, and the Controls panel surfaces the
props that actually matter (`gameTitle`, `customGameColor`, `isBookmarked`,
`config.totalRounds`).

**`Slot` single playground.** The 8 existing scenes duplicate the same
`AnswerGameProvider` boilerplate and are each a one-off demo. Collapsing them
into one parametrised playground where `variant` + `filled` + `isWrong` +
`dragPreview` reproduce every scene trims ~250 lines of duplication, gives the
Controls panel real power, and surfaces the broken-token concern you flagged
because the playground exercises every variant in one place.

### `play()` feasibility notes

- **Radix portal gotcha.** `InstructionsOverlay.OpensSettings` opens
  `AdvancedConfigModal`, which is Radix-based and portals into `document.body`.
  Use `within(document.body)` for the post-open assertions. Wrap visibility
  assertions in `waitFor()` to tolerate animation races. If the flow remains
  brittle after reasonable attempts, drop that specific `play()` with a
  commit-body reason — the pilot precedent allows this.
- **Fake timers scoping.** `EncouragementAnnouncer.AutoDismissesAfter2s` uses
  `vi.useFakeTimers()` inside `play()` and calls `vi.useRealTimers()` before
  returning so neighbouring stories aren't affected.
- **AnswerGame DnD skipped.** Acknowledged limitation: `userEvent` doesn't
  reliably synthesise HTML5 drag-and-drop events in jsdom. The playground
  remains visually demonstrable; interactive correctness of DnD is covered at
  the e2e layer, not here.

## Workflow

**Branch & worktree:**

- Worktree: `worktrees/storybook-audit-batch-2-answer-game/`
- Branch: `audit/storybook-batch-2-answer-game` (branched from `origin/master`)

**Tiered execution:**

**Tier 1 — Complex (subagent-driven, Sonnet implementer + two-stage Haiku
review per file):**

1. `Slot` — collapse 8 scenes to a single `Playground` story with args-driven
   zone/tile/drag-hover assembly
2. `AnswerGame` — real-Provider playground with drivable `config` controls
3. `InstructionsOverlay` — interactive stories + `play()` for Start / Bookmark
   / Settings

Each task flow:

- Implementer subagent reads the story + component source, applies the per-file
  row, commits.
- Spec-compliance reviewer (Haiku) — confirms the commit matches the per-file
  row in the audit table.
- Code-quality reviewer (Haiku) — confirms `argTypes` align with TS prop
  types, `play()` assertions are meaningful (not tautologies), names follow
  convention.
- Loop: if either reviewer flags issues, the same implementer subagent fixes
  in a new commit, both reviewers re-review. Never skip re-review.

**Tier 2 — Simple (consolidated single implementer, one pass, end-of-tier
review):**

1. `EncouragementAnnouncer`
2. `GameOverOverlay`
3. `LevelCompleteOverlay`
4. `ProgressHUD`
5. `ScoreAnimation`

One commit per file, same commit shape. A single Haiku code-quality reviewer
pass covers the entire tier at the end. If the reviewer flags anything, fix
and re-review the whole tier.

**Commit shape (both tiers):** `stories(answer-game/<name>): retrofit per
controls policy`. Commit body lists which gates were applied and why any
`play()` was dropped (if applicable).

**Per-commit verification** (every commit, before reporting done):

- `yarn typecheck` → exit 0
- `yarn lint` → exit 0
- Do NOT run `yarn test:storybook` per file — too slow; end-of-PR task covers
  it.

**Shared conventions** (same as pilot — carried into the plan's Shared
Conventions block):

- `import { userEvent, within, expect, fn } from 'storybook/test';` — the
  subpath, NOT `@storybook/test`.
- Radix portal: `within(document.body)` after opening a trigger.
- Wrap `toBeVisible()` / `queryByRole(...).toBeNull()` in `waitFor()` for
  animation races.
- ESLint `import/order`: value imports alphabetical → relative imports →
  `storybook/test` → `@storybook/react` type import last → `react` type import.
- `export default meta` is the one allowed default export (framework config
  exception).
- StoryArgs-wrapper components: extend the interface with handler fields,
  thread through `render`, hide from Controls with
  `argTypes: { onFoo: { table: { disable: true } } }`.

**End-of-PR verification:**

- `yarn typecheck`, `yarn lint`, `yarn lint:md` — all exit 0.
- Storybook test-runner against a free port:

  ```bash
  PORT=6006
  while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
  yarn storybook --port $PORT --ci &
  STORYBOOK_PID=$!
  until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
  yarn test:storybook --url http://127.0.0.1:$PORT
  TEST_EXIT=$?
  [ $TEST_EXIT -eq 0 ] && kill $STORYBOOK_PID
  ```

  All stories (not just `answer-game/*`) must pass a11y + `play()`. Treat
  pre-existing failures in out-of-scope files as out-of-scope — log in PR body.

- `git log --oneline origin/master..HEAD` — 8 story-audit commits plus any
  review-loop fix-up commits.

## Acceptance Criteria

1. Every in-scope file passes every applicable SKILL.md Audit Checklist gate.
2. The three upgraded stories (`AnswerGame`, `InstructionsOverlay`, `Slot`)
   are demonstrably interactive in the Storybook UI — driven from the Controls
   panel, not static render dumps.
3. `EncouragementAnnouncer.AutoDismissesAfter2s` and the GameOver /
   LevelComplete / InstructionsOverlay `play()` stories all pass in the
   test-runner.
4. No regression: typecheck, lint, lint:md, test:storybook all green.
5. PR body includes the per-file audit table and links to
   `.claude/skills/write-storybook/SKILL.md`.
6. Issue #125 checkboxes for Batch 2 files ticked.
7. Any `play()` stories dropped (e.g., `InstructionsOverlay.OpensSettings` if
   it proves brittle) are documented in their commit body with a specific
   reason.

## Review Checkpoints

- After Tier 1 completes (Slot, AnswerGame, InstructionsOverlay all merged
  into the branch): sanity-check whether the Tier 2 files can go consolidated
  as planned, or whether one of them needs to be promoted to subagent-driven
  (unlikely — they're all small).
- Before opening the PR: self-verify by running through the per-file audit
  table and ticking every row.

## Risks and Mitigations

| Risk                                                                             | Likelihood | Mitigation                                                                                                                    |
| -------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `InstructionsOverlay.OpensSettings` portal flaky (`AdvancedConfigModal` → Radix) | Medium     | `within(document.body)` + `waitFor()`. If still brittle, drop the `play()` with a documented reason — pilot precedent allows. |
| `EncouragementAnnouncer` fake timers leak into neighbouring stories              | Low        | Scope `vi.useFakeTimers()` inside `play()`, call `vi.useRealTimers()` in cleanup.                                             |
| `AnswerGame` real-Provider playground surfaces an existing component bug         | Medium     | Log as follow-up issue, don't fix in this PR — scope-creep prevention.                                                        |
| `Slot` playground reveals broken tokens                                          | Medium     | Out of scope; log follow-up issue referenced in the PR body.                                                                  |
| `InstructionsOverlay` TTS crash triggered                                        | Low        | `ttsEnabled: false` in all args; never drive a `play()` flow that would invoke `speak()`.                                     |
| Test-runner surfaces pre-existing a11y failure in an out-of-scope file           | Medium     | Log in PR body; proceed — same policy as pilot.                                                                               |
| `argTypes` drift from component TS types after a future component refactor       | Low        | Code-quality reviewer spot-checks type alignment; `yarn typecheck` catches the rest.                                          |

## Deliverables

- 8 retrofitted story files (3 upgrades, 5 minimal retrofits), review-loop
  compliance confirmed.
- This spec at
  `docs/superpowers/specs/2026-04-21-audit-storybook-answer-game-design.md`.
- Companion implementation plan at
  `docs/superpowers/plans/2026-04-21-audit-storybook-answer-game-plan.md`
  (written by the `superpowers:writing-plans` skill after this spec is
  approved).
- PR against `master`, title
  `stories(answer-game): audit retrofit per new controls policy`.
- PR body: per-file audit table, link to SKILL.md, list of any `play()` drops
  with reasons, list of any out-of-scope pre-existing failures surfaced by the
  test-runner.
- Issue #125 checkboxes ticked for Batch 2 files.
