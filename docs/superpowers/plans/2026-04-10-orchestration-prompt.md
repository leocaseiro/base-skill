# Match Number Improvements — Orchestration Prompt

Use this prompt in a new Claude Code session to execute the implementation
plans. Copy everything below the `---` line.

---

## Task

Implement the MatchNumber game improvements across 5 plans, using parallel
sub-agents where dependencies allow. Each agent works in its own git worktree
branched from `match-number-improvements` and raises a PR back into
`match-number-improvements` when done.

## Source branch

All worktrees branch from `match-number-improvements` (NOT `master`). PRs
target `match-number-improvements`.

## Plans location

All plans live in `docs/superpowers/plans/` and follow the checkbox step
format. Each agent must follow its plan exactly — tick off each step as it
completes.

## Dependency graph

```text
Wave 1 (parallel, no dependencies):
  ├── Agent A: 2026-04-10-number-words-utility.md     → branch: feat/number-words-utility
  └── Agent B: 2026-04-10-domino-tile-overhaul.md      → branch: feat/domino-tile-overhaul

  ⏳ Merge both Wave 1 PRs before starting Wave 2

Wave 2 (parallel, depends on Wave 1 merges):
  ├── Agent C: 2026-04-10-countable-dots.md             → branch: feat/countable-dots
  └── Agent D: 2026-04-10-mode-bugfix-new-modes.md      → branch: feat/mode-bugfix-new-modes

  ⏳ Merge both Wave 2 PRs before starting Wave 3

Wave 3 (single agent, depends on Wave 2 merges):
  └── Agent E: 2026-04-10-hover-preview-fix.md          → branch: feat/hover-preview-fix
```

## Agent instructions (applies to every agent)

Each agent must:

1. Create a worktree from the current state of `match-number-improvements`:

   ```bash
   cd /Users/leocaseiro/Sites/base-skill
   git worktree add ./worktrees/<branch-name> -b <branch-name> match-number-improvements
   cd ./worktrees/<branch-name>
   yarn install
   ```

2. Read its assigned plan from `docs/superpowers/plans/`.
3. Implement each step, ticking off checkboxes as it goes.
4. After all steps pass, run the verification gate:

   ```bash
   yarn typecheck && yarn lint && yarn test
   ```

5. Commit with a descriptive message (no `--amend`).
6. Push the branch and create a PR targeting `match-number-improvements`:

   ```bash
   git push -u origin <branch-name>
   gh pr create --base match-number-improvements \
     --title "<short title>" \
     --body "$(cat <<'EOF'
   ## Summary
   <what this PR does, 1-3 bullets>

   ## Plan
   Implements `docs/superpowers/plans/<plan-file>.md`

   ## Verification
   - [ ] `yarn typecheck` passes
   - [ ] `yarn lint` passes
   - [ ] `yarn test` passes

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

7. Do NOT merge the PR — leave it for review.

## Execution flow

### Wave 1 — dispatch agents A and B in parallel

Dispatch two sub-agents simultaneously using the Agent tool with
`isolation: "worktree"`. Both are independent and can run at the same time.

**Agent A prompt:**

> You are implementing the Number Words Utility for the MatchNumber game.
>
> Working directory: `/Users/leocaseiro/Sites/base-skill`
>
> 1. Create a worktree: `git worktree add ./worktrees/feat/number-words-utility -b feat/number-words-utility match-number-improvements`
> 2. `cd ./worktrees/feat/number-words-utility && yarn install`
> 3. Read and follow every step in `docs/superpowers/plans/2026-04-10-number-words-utility.md`
> 4. Run `yarn typecheck && yarn lint && yarn test` — all must pass
> 5. Commit, push, and create a PR targeting `match-number-improvements`
> 6. Do NOT merge the PR
>
> Follow the plan exactly. Use named exports only (no default exports).
> Analyse `eslint.config.js` for code style (const arrow functions, not
> function declarations).

**Agent B prompt:**

> You are implementing the Domino Tile Overhaul for the MatchNumber game.
>
> Working directory: `/Users/leocaseiro/Sites/base-skill`
>
> 1. Create a worktree: `git worktree add ./worktrees/feat/domino-tile-overhaul -b feat/domino-tile-overhaul match-number-improvements`
> 2. `cd ./worktrees/feat/domino-tile-overhaul && yarn install`
> 3. Read and follow every step in `docs/superpowers/plans/2026-04-10-domino-tile-overhaul.md`
> 4. Run `yarn typecheck && yarn lint && yarn test` — all must pass
> 5. Commit, push, and create a PR targeting `match-number-improvements`
> 6. Do NOT merge the PR
>
> Follow the plan exactly. Use named exports only (no default exports).
> Analyse `eslint.config.js` for code style (const arrow functions, not
> function declarations).

**After both PRs are reviewed and merged**, proceed to Wave 2.

### Wave 2 — dispatch agents C and D in parallel

After Wave 1 merges are on `match-number-improvements`, dispatch two more
sub-agents simultaneously.

**Agent C prompt:**

> You are implementing Countable Dots for the MatchNumber game.
>
> Working directory: `/Users/leocaseiro/Sites/base-skill`
>
> 1. Create a worktree: `git worktree add ./worktrees/feat/countable-dots -b feat/countable-dots match-number-improvements`
> 2. `cd ./worktrees/feat/countable-dots && yarn install`
> 3. Read and follow every step in `docs/superpowers/plans/2026-04-10-countable-dots.md`
> 4. The `number-words.ts` utility is already merged — import `toCardinalText` from it
> 5. Run `yarn typecheck && yarn lint && yarn test` — all must pass
> 6. Commit, push, and create a PR targeting `match-number-improvements`
> 7. Do NOT merge the PR
>
> Follow the plan exactly. Use named exports only (no default exports).
> Analyse `eslint.config.js` for code style (const arrow functions, not
> function declarations).

**Agent D prompt:**

> You are implementing Mode Bug Fix + New Modes for the MatchNumber game.
>
> Working directory: `/Users/leocaseiro/Sites/base-skill`
>
> 1. Create a worktree: `git worktree add ./worktrees/feat/mode-bugfix-new-modes -b feat/mode-bugfix-new-modes match-number-improvements`
> 2. `cd ./worktrees/feat/mode-bugfix-new-modes && yarn install`
> 3. Read and follow every step in `docs/superpowers/plans/2026-04-10-mode-bugfix-new-modes.md`
> 4. Both the `number-words.ts` utility and Domino Tile Overhaul are already merged — build on them
> 5. Run `yarn typecheck && yarn lint && yarn test` — all must pass
> 6. Commit, push, and create a PR targeting `match-number-improvements`
> 7. Do NOT merge the PR
>
> Follow the plan exactly. Use named exports only (no default exports).
> Analyse `eslint.config.js` for code style (const arrow functions, not
> function declarations).

**After both PRs are reviewed and merged**, proceed to Wave 3.

### Wave 3 — dispatch agent E

**Agent E prompt:**

> You are implementing the Hover Preview Fix for the MatchNumber game.
>
> Working directory: `/Users/leocaseiro/Sites/base-skill`
>
> 1. Create a worktree: `git worktree add ./worktrees/feat/hover-preview-fix -b feat/hover-preview-fix match-number-improvements`
> 2. `cd ./worktrees/feat/hover-preview-fix && yarn install`
> 3. Read and follow every step in `docs/superpowers/plans/2026-04-10-hover-preview-fix.md`
> 4. The Domino Overhaul and Mode Bug Fix are already merged — `tilesShowGroup` and the new `DominoTile` are available
> 5. Run `yarn typecheck && yarn lint && yarn test` — all must pass
> 6. Commit, push, and create a PR targeting `match-number-improvements`
> 7. Do NOT merge the PR
>
> Follow the plan exactly. Use named exports only (no default exports).
> Analyse `eslint.config.js` for code style (const arrow functions, not
> function declarations).

## Between waves

After each wave's PRs are created:

1. Review the PRs (or ask the user to review)
2. Merge them into `match-number-improvements`
3. Clean up worktrees: `git worktree remove ./worktrees/feat/<name>`
4. Then dispatch the next wave
