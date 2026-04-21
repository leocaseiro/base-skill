---
date: 2026-04-22
status: draft
tracking: '#125'
---

# Storybook Controls Audit — Tier 1 + Tier 2 Batch Design

## Purpose

Audit the ten simplest story files flagged in [#125](https://github.com/leocaseiro/base-skill/issues/125) against the Storybook controls policy (`.claude/skills/write-storybook/SKILL.md`) and the enforcement rules proven in Batch 2 (`answer-game/*`, shipped via #134, #141, #143).

Scope is strictly the ten files below. Any refactor outside these files (e.g., `.storybook/preview.tsx`, global config, real-game components) is out of scope and must be flagged back to the orchestrator.

## Files in scope

### Tier 1 — root component stubs (single batch PR)

1. `src/components/ThemeToggle.stories.tsx`
2. `src/components/Footer.stories.tsx`
3. `src/components/Header.stories.tsx`
4. `src/components/OfflineIndicator.stories.tsx`
5. `src/components/UpdateBanner.stories.tsx`

### Tier 2 — small single-purpose components (one PR each)

1. `src/components/questions/AudioButton/AudioButton.stories.tsx`
2. `src/components/questions/ImageQuestion/ImageQuestion.stories.tsx`
3. `src/components/questions/TextQuestion/TextQuestion.stories.tsx`
4. `src/components/questions/DotGroupQuestion/DotGroupQuestion.stories.tsx`
5. `src/data/words/WordLibraryExplorer.stories.tsx`

## Execution shape

The orchestrator (main session) dispatches subagents. Each subagent runs in its own git worktree with its own `node_modules` and a dedicated Storybook port.

| Wave   | Agents                                                     | Dispatch trigger                                                    |
| ------ | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Wave 1 | 1 agent auditing all 5 Tier 1 files into a single batch PR | Spec merged (or approved-in-flight)                                 |
| Wave 2 | 5 parallel agents, one Tier 2 file each                    | Wave 1's PR opened (not merged) — disjoint directories, no conflict |

Wave 2 agents do **not** block on Wave 1 merge. They branch from `master` at dispatch time and rebase before `git push`.

## Worktree + branch + port allocation

| Wave | Path                                        | Branch                                | Port |
| ---- | ------------------------------------------- | ------------------------------------- | ---- |
| 1    | `./worktrees/stories-tier1-root`            | `stories/tier1-root-audit`            | 6106 |
| 2a   | `./worktrees/stories-audio-button`          | `stories/audio-button-audit`          | 6107 |
| 2b   | `./worktrees/stories-image-question`        | `stories/image-question-audit`        | 6108 |
| 2c   | `./worktrees/stories-text-question`         | `stories/text-question-audit`         | 6109 |
| 2d   | `./worktrees/stories-dot-group-question`    | `stories/dot-group-question-audit`    | 6110 |
| 2e   | `./worktrees/stories-word-library-explorer` | `stories/word-library-explorer-audit` | 6111 |

## Canonical Playground pattern

**Every audited story file converges on the Playground shape.** Precedent:
`src/components/answer-game/AnswerGame/AnswerGame.stories.tsx` (shell-slim)
and `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`
(Playground collapse, #141).

### Required structure

1. **`StoryArgs` interface** declares only the props the Controls panel should expose, plus `?: never` shadows for raw component props that must stay hidden.
2. **`meta.args`** sets default values for every `StoryArgs` field, including `fn()` wiring for every `on*` handler (imported from `storybook/test`).
3. **`meta.argTypes`** declares a structured `control` for each visible arg (`boolean`, `text`, `select` + `options`, `radio` + `options`, `range` + `min`/`max`/`step`) and `{ table: { disable: true } }` for every hidden row.
4. **`meta.render`** destructures `StoryArgs`, derives any internal values (e.g., an id derived from a non-empty name), and renders the component. If the component consumes `--skin-*` / `skin.tokens`, wrap in `<div className={\`game-container skin-${classicSkin.id}\`} style={classicSkin.tokens as CSSProperties}>`.
5. **`parameters.docs.description.component`** documents what the Playground drives and points at `<Component>.test.tsx` for play-flow coverage.
6. **Single `export const Playground: Story = {}`** (or with minimal arg overrides when a non-default seed aids first-load visuals). Additional named exports only when they add per-game / per-mode visual coverage not otherwise captured.

### Collapse rule

If existing named stories replicate `*.test.tsx` interaction coverage, **collapse them into `Playground`**. Keep a scenario story only when it captures a visual state (variant, skin, edge case) that the Controls panel can't express from the Playground seed.

### Controls policy enforcement

- **Drop text controls for invisible values** (ids, opaque keys). If the value toggles behaviour, derive it inside `render` from a visible control (precedent: `InstructionsOverlay` — `customGameId` derived from non-empty `customGameName`).
- **Prefer structured inputs** — `select` / `radio` / `boolean` / `range` over raw text when the domain is enumerable.
- **No raw JSON fallbacks.**
- **Every `on*` prop wired to `fn()`** from `storybook/test` in `args`. Do not rely on `argTypesRegex` alone — it misses DOM-extended props under react-docgen.
- **Decorators match current dependencies** — include `withDb` and/or `withRouter` as the component requires.

### Skin wrapper decision

- Grep the component source for `--skin-*` or `skin.tokens`.
- If present → wrap the render in the `classicSkin` div above.
- If absent (component uses only theme tokens such as `bg-background`) → do **not** wrap. Flag the decision in the PR body under a `Skin decision` heading.

## Per-agent contract

Each subagent receives:

- **Target file(s)** and the component source path.
- **Canonical refs:** the SKILL.md path, shell-slim canonical, Playground-collapse canonical.
- **The full policy above** (Playground pattern + controls enforcement + skin wrapper rule).
- **Verification gate** (see below).
- **Commit shape:** one commit per story file, message `stories(<area>/<name>): <imperative summary>`.
- **PR template:** title `stories(<area>/<name>): audit controls + Playground` (batch: `stories(root): audit controls + Playground for 5 files`); body sections Summary, Skin decision, Real-game parity, Verification.
- **Flag-on-surprise triggers** (see below).

## Verification gate (per agent, before pushing)

Run locally inside the worktree, against a Storybook dev server on the allocated port:

1. `yarn typecheck` — 0 errors.
2. `yarn lint` — 0 errors.
3. `yarn storybook --port <allocated-port> --ci` in the background.
4. `yarn test:storybook --url http://127.0.0.1:<allocated-port>` — all suites green.
5. Real-game parity visual check — compare Storybook render against the component's runtime mount (`src/routes/…` or `src/games/…`). Use Playwright screenshots from inside the worktree if helpful. Any drift → flag.
6. Kill the Storybook process.
7. `yarn fix:md` if any markdown touched (not expected in this batch).

## Flag-on-surprise triggers

Agent pauses and reports back to the orchestrator if:

- Prop type is opaque (function-returning-JSX, complex branded type, render-prop that can't be demoed via a primitive control).
- Component reads `--skin-*` **and** theme tokens — ambiguous wrap decision.
- Real-game mount uses Providers beyond `withDb` / `withRouter`.
- A `*.test.*` file imports from the story file — collapse into Playground would break tests.
- Verification gate fails with a root cause outside the audit scope.
- Visual drift between Storybook Playground and real-game mount.

On flag: agent does **not** push. It reports the finding, proposed fix (if any), and stops. Other agents continue.

## Conflict safety

- Ten story files are disjoint — no shared-file edits between branches.
- `.storybook/preview.tsx`, `.storybook/main.ts`, `yarn.lock`, decorators, and all non-story source files are **out of scope**. Any need to touch them is a flag-on-surprise trigger.
- Each agent runs `git fetch origin master && git rebase origin/master` before `git push -u`.
- Ports are stable per agent so background-process logs are scannable.
- Dependency PRs are allowed if an agent discovers a prerequisite (e.g., a missing decorator export), in which case the agent opens the dependency PR first and pauses; the story-file PR lists the dependency in its body.

## Review model

- Wave 1 batch PR opens → orchestrator relays to user for review.
- Wave 2's 5 PRs open roughly together → reviewed asynchronously.
- Agents do not block on merges. They push, open the PR (or edit the auto-opened PR if a workflow creates one), and exit. The PR body must reference `#125` so the file is traceable. The orchestrator ticks the checkbox in issue #125 once the PR is open (GitHub does not support partial-close syntax for checklists).

## Failure modes

| Scenario                                        | Agent behavior                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Surprise triggered                              | Stop before push; report findings to orchestrator.                  |
| Storybook fails to start                        | Retry once on same port. If still failing, report port + error log. |
| Verification gate fails with in-scope cause     | Fix, re-run gate, continue.                                         |
| Verification gate fails with out-of-scope cause | Stop; report.                                                       |
| `git push` rejected                             | Report branch state. Do not force-push.                             |
| PR auto-opened by workflow on push              | Edit title/body in place rather than opening a second PR.           |
| Rebase conflict                                 | Stop; report conflicting files. Orchestrator resolves or reassigns. |

## Deliverables

- 6 branches, 6 PRs against `master` (1 batch + 5 solo).
- Issue #125 checkboxes updated for all 10 files (via PR bodies referencing `#125`).
- Zero direct commits to `master`.
- Zero edits outside the 10 target story files.

## Out of scope

- Design-token contrast work (separate VR-baseline PR).
- `.storybook/*` changes.
- Real-game component refactors beyond what #143 shipped.
- Tier 3 / Tier 4 / Tier 5 files — future batches.
