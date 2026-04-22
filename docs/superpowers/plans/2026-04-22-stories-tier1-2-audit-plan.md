---
date: 2026-04-22
status: draft
spec: docs/superpowers/specs/2026-04-22-stories-tier1-2-audit-design.md
tracking: '#125'
---

# Storybook Tier 1 + 2 Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute
> this plan. Each task below dispatches one or more subagents; steps use checkbox (`- [ ]`) syntax for
> orchestrator tracking.

**Goal:** Ship 6 PRs against `master` — 1 batch PR auditing the 5 Tier 1 root stubs and 5 solo PRs
auditing the Tier 2 single-purpose components — each converging on the Playground pattern documented
in `.claude/skills/write-storybook/SKILL.md`.

**Architecture:** Orchestrator (main session) dispatches subagents in two waves. Wave 1 = 1 subagent
producing a single batch PR. Wave 2 = 5 subagents dispatched in parallel, one PR each. Every subagent
works in an isolated git worktree with its own `node_modules` and a dedicated Storybook port, runs the
verification gate locally, pushes, opens (or edits the auto-opened) PR referencing `#125`, and exits.
Agents do not block on merges. The orchestrator ticks `#125` checkboxes as PRs open.

**Tech Stack:** Storybook 9, React, TanStack Router, `storybook/test` `fn()` handlers, Vitest
test-runner, `gh` CLI, git worktrees, `yarn`.

---

## Source of truth

- **Spec (merged #149 at `52f57ae6`):** `docs/superpowers/specs/2026-04-22-stories-tier1-2-audit-design.md`
- **Tracker issue:** `#125`
- **Controls policy:** `.claude/skills/write-storybook/SKILL.md`
- **Shell-slim canonical:** `src/components/answer-game/AnswerGame/AnswerGame.stories.tsx`
- **Playground-collapse canonical:** `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx`
- **Trigger-button canonical (one-shot callbacks):** `src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx`
- **Precedent PRs:** `#124` (pilot), `#134` (batch 2 retrofit), `#141` (Playground collapse),
  `#143` (per-game wrapper refactor), `#154` (global `withDefaultSkin` decorator — merged
  `eada2163`, makes the per-file classic-skin wrapper obsolete).
- **In-flight PR `#155`** rewrites the SKILL.md to formalise the single-Playground discipline
  (auxiliary stories only for scenarios controls can't express) and demotes `play()` to
  optional. The amendments below fold in its policy direction; the only unresolved detail is
  the export name (`Playground` vs `Default`) — **see "Open question" below**.

Any deviation from the spec's scope (ten target files, worktree/branch/port table, two-wave
orchestration, flag-on-surprise contract) is a plan defect — fix the plan first.

### Open question: `Playground` vs `Default` naming

Spec `#149` and every existing canonical file (`AnswerGame`, `InstructionsOverlay`,
`EncouragementAnnouncer`, `ProgressHUD`, `Slot`, `GameOverOverlay`, `LevelCompleteOverlay`,
`ScoreAnimation`) export the main Controls-driven story as `Playground`. PR `#155`'s new
Minimal Template calls it `Default`, but `#155`'s own reference implementations all still use
`Playground`. **This plan standardises on `Playground`** (matches spec and existing code). If
you'd rather have subagents emit `Default`, call it out before approving the plan PR — it's a
single-word swap in the template below and the allocation table's PR titles.

## Allocation

| Wave | Agent id                | Target file(s)                                                           | Worktree                                    | Branch                                | Port | PR title                                                                 |
| ---- | ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------- | ---- | ------------------------------------------------------------------------ |
| 1    | `tier1-root`            | All 5 Tier 1 root stubs (see below)                                      | `./worktrees/stories-tier1-root`            | `stories/tier1-root-audit`            | 6106 | `stories(root): audit controls + Playground for 5 files`                 |
| 2a   | `audio-button`          | `src/components/questions/AudioButton/AudioButton.stories.tsx`           | `./worktrees/stories-audio-button`          | `stories/audio-button-audit`          | 6107 | `stories(questions/audio-button): audit controls + Playground`           |
| 2b   | `image-question`        | `src/components/questions/ImageQuestion/ImageQuestion.stories.tsx`       | `./worktrees/stories-image-question`        | `stories/image-question-audit`        | 6108 | `stories(questions/image-question): audit controls + Playground`         |
| 2c   | `text-question`         | `src/components/questions/TextQuestion/TextQuestion.stories.tsx`         | `./worktrees/stories-text-question`         | `stories/text-question-audit`         | 6109 | `stories(questions/text-question): audit controls + Playground`          |
| 2d   | `dot-group-question`    | `src/components/questions/DotGroupQuestion/DotGroupQuestion.stories.tsx` | `./worktrees/stories-dot-group-question`    | `stories/dot-group-question-audit`    | 6110 | `stories(questions/dot-group-question): audit controls + Playground`     |
| 2e   | `word-library-explorer` | `src/data/words/WordLibraryExplorer.stories.tsx`                         | `./worktrees/stories-word-library-explorer` | `stories/word-library-explorer-audit` | 6111 | `stories(data/words/word-library-explorer): audit controls + Playground` |

Tier 1 files for the `tier1-root` agent:

1. `src/components/ThemeToggle.stories.tsx`
2. `src/components/Footer.stories.tsx`
3. `src/components/Header.stories.tsx`
4. `src/components/OfflineIndicator.stories.tsx`
5. `src/components/UpdateBanner.stories.tsx`

## File structure

This plan document is the only file produced on `stories/tier1-2-audit-plan`. All code changes happen
inside the six subagent branches listed above. The orchestrator does not edit any source file
directly — the only orchestrator-side writes are to issue `#125` (checkbox ticks via `gh issue edit`).

---

## Shared subagent prompt template

Each subagent receives a self-contained prompt built from this template with the following
substitutions:

- `{{AGENT_ID}}` — from the allocation table (e.g., `tier1-root`, `audio-button`).
- `{{TARGET_FILES}}` — newline-separated list of story file paths in scope for that agent.
- `{{WORKTREE_PATH}}` — from the allocation table (e.g., `./worktrees/stories-tier1-root`).
- `{{BRANCH}}` — from the allocation table (e.g., `stories/tier1-root-audit`).
- `{{PORT}}` — from the allocation table (e.g., `6106`).
- `{{PR_TITLE}}` — from the allocation table.
- `{{BATCH_OR_SOLO}}` — `batch` for Wave 1, `solo` for each Wave 2 agent.

The template below is the exact text to dispatch, verbatim, with the above substitutions made. Do not
trim it; each subagent starts cold and requires the full context.

````text
You are the `{{AGENT_ID}}` Storybook audit subagent. Your job is to audit these story files
against the project's Storybook controls policy and the Playground pattern, then open a PR.

TARGET FILES (scope is strict — do not edit anything else):
{{TARGET_FILES}}

Reference material (read before editing):

- Spec: docs/superpowers/specs/2026-04-22-stories-tier1-2-audit-design.md
- Controls policy: .claude/skills/write-storybook/SKILL.md (note: the global
  `withDefaultSkin` decorator in `.storybook/preview.tsx` now applies
  `game-container skin-classic` with `classicSkin.tokens` to every story — per-file
  wrappers are redundant and must be removed, see PR #154 merge commit `eada2163`).
- Shell-slim canonical: src/components/answer-game/AnswerGame/AnswerGame.stories.tsx
- Playground-collapse canonical (audit pattern): src/components/answer-game/InstructionsOverlay/InstructionsOverlay.stories.tsx
- Trigger-button canonical (stateful one-shot callbacks): src/components/answer-game/EncouragementAnnouncer/EncouragementAnnouncer.stories.tsx
- Tracker issue: #125 (contains the 10 gates reproduced below)

If PR #155 (`docs(skill): adopt single-Default Playground pattern for storybook`) has
merged by the time you dispatch, the SKILL.md you read reflects the updated policy
verbatim. Either way the gates below are authoritative for this audit.

## Step 1 — Environment

From the project root `/Users/leocaseiro/Sites/base-skill`:

```bash
git worktree add {{WORKTREE_PATH}} -b {{BRANCH}} master
cd {{WORKTREE_PATH}}
yarn install
```

Do not reuse an existing worktree — fail loudly if the path is already taken and report back.

## Step 2 — Per-file audit

For each file in TARGET FILES, converge on the Playground pattern:

1. Declare a `StoryArgs` interface that exposes only the props the Controls panel should drive. For
   every raw component prop that must stay hidden (shadowed, derived internally, or JSX/function
   types), declare it on `StoryArgs` as `?: never` AND set
   `{ table: { disable: true } }` in `argTypes` for that row.
2. `meta.args` supplies defaults for every visible `StoryArgs` field, including `fn()` (imported from
   `storybook/test`) for every `on*` handler. Do NOT rely on the global `argTypesRegex` — it misses
   DOM-extended props under react-docgen.
3. `meta.argTypes` declares a structured control for each visible arg:
   - `boolean` for booleans
   - `select` + `options` (or `radio` + `options` for ≤4 options) for enums/string unions
   - `range` + `min`/`max`/`step` for bounded numbers
   - `text` only for legitimately free-text props that are visibly rendered
   - `{ table: { disable: true } }` for any hidden row
   No raw JSON controls.
4. `meta.render` destructures `StoryArgs`, derives any internal values (e.g., an id from a non-empty
   name — precedent: `InstructionsOverlay` derives `customGameId` from `customGameName`), and renders
   the component. **Do NOT add a per-file classic-skin wrapper.** The global `withDefaultSkin`
   decorator in `.storybook/preview.tsx` already wraps every story in
   `<div className="game-container skin-classic" style={classicSkin.tokens}>` (PR #154). If the
   file you're editing currently has an inline wrapper, remove it along with the
   `classicSkin`/`CSSProperties` imports that only existed for the wrapper. Keep `classicSkin`
   imports only if the component receives it as a prop (precedent: `AnswerGame.stories.tsx`
   passes `skin={classicSkin}`). Alt-skin previews for the same component must go in a sibling
   `*.skin.stories.tsx` file — none of the ten target files qualify.
5. `parameters.docs.description.component` documents what the Playground drives and points at
   `<Component>.test.tsx` for play-flow coverage (if such a test file exists).
6. Export a single `Playground` story: `export const Playground: Story = {}` (with minimal arg
   overrides only when a non-default seed aids first-load visuals). **Auxiliary named exports
   are justified only when a scenario truly cannot be expressed by toggling Playground
   controls** — specifically: a stateful one-shot sequence that needs replay (precedent:
   `EncouragementAnnouncer`'s `ReplayTrigger` with a `ShowTrigger` wrapper + `useState`), a
   pinned theme/viewport with meaningfully different visuals, or a `play()` assertion that
   Playwright e2e doesn't already cover. Do NOT add per-enum-value / per-state-reachable-via-prop /
   edge-case-text (`LongText`, `ManyItems`) named stories — those belong in controls.

### Collapse rule

If existing named stories in the file duplicate what a Playground control would toggle (per-enum
variants, per-state when the state is reachable via a prop, long-text/many-items scenarios) OR
duplicate `*.test.tsx` interaction coverage, delete them and fold into `Playground`. Keep an
auxiliary story only when it captures a scenario the Controls panel genuinely can't express
(see item 6 above).

## The 10 gates — every target file must pass

Reproduced from issue `#125`, updated to reflect the merged global skin decorator (PR `#154`)
and the in-flight single-Playground policy tightening (PR `#155`).

1. **Controls map to something visible.** Drop text controls for invisible values (ids, internal
   keys). If a value toggles behaviour, derive it from a visible control (precedent:
   `InstructionsOverlay` — `customGameId` derived from non-empty `customGameName`).
2. **Prefer structured inputs.** `select` / `radio` / `boolean` / `range` over raw text whenever
   the domain is enumerable. No raw JSON fallbacks.
3. **Every `on*` prop wired to `fn()`** from `storybook/test` in `args`. Do NOT rely on
   `argTypesRegex` alone — react-docgen misses DOM-extended props. Callbacks fire into the
   Actions panel by default; only add a UI trigger button in `render` if the callback requires a
   replayable one-shot sequence that controls alone can't invoke (precedent:
   `EncouragementAnnouncer`'s `ShowTrigger` helper).
4. **No per-file classic-skin wrapper.** The global `withDefaultSkin` decorator applies
   `game-container skin-classic` + `classicSkin.tokens` to every story. If the file has an
   existing inline wrapper, REMOVE it (and the now-orphaned `classicSkin`/`CSSProperties`
   imports). Keep `classicSkin` imports only if the component receives it as a prop.
5. **Hide shadowed/derived docgen rows** via `?: never` on `StoryArgs` AND
   `{ table: { disable: true } }` in `argTypes` for each hidden row.
6. **Collapse redundant named stories.** Delete per-enum-value / per-state-reachable-via-prop /
   edge-case-text stories that a control toggle would show. Also delete play-flow stories that
   duplicate `*.test.tsx` coverage. Keep only auxiliary stories the Controls panel genuinely
   can't express (stateful one-shot flow, pinned theme/viewport, `play()` assertion not covered
   by Playwright e2e).
7. **Real-game parity.** Compare the Storybook Playground render to how the component mounts at
   runtime (`src/routes/…` or `src/games/…`). The global `withDefaultSkin` decorator should make
   parity automatic for components that read `--skin-*`; any drift → flag in the PR body.
8. **Auxiliary-story discipline.** Auxiliary stories (if any) are justified only by the three
   reasons in gate #6. No required Default/per-enum/per-state/edge-case variant set — the
   Playground IS the Default, and every UI-affecting prop is a control on it.
9. **Decorators match current dependencies** — `withDb`, `withRouter` as the component
   requires. Do not add `classicSkin`-wrapping or `ThemeProvider` decorators — both are global.
10. **`play()` is OPTIONAL in this project.** Playwright e2e (`e2e/visual.spec.ts` and friends)
    already covers VR and flow assertions on live routes. Add a `play()` only when it asserts
    something Playwright doesn't (keyboard-only flow, focus management, validation-error
    visibility) and the assertion adds genuine value. Pure-display components never need one.

## Step 3 — Verification gate (run BEFORE pushing)

Run from inside `{{WORKTREE_PATH}}`:

```bash
yarn typecheck                                           # expect 0 errors
yarn lint                                                # expect 0 errors
PORT={{PORT}}
yarn storybook --port $PORT --ci &
STORYBOOK_PID=$!
until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
yarn test:storybook --url http://127.0.0.1:$PORT        # expect all suites green
TEST_EXIT=$?
if [ $TEST_EXIT -eq 0 ]; then kill $STORYBOOK_PID; fi
exit $TEST_EXIT
```

Then perform the real-game parity visual check: open the Storybook Playground for each target file
AND the live runtime mount of the same component (under `src/routes/…` or `src/games/…`), compare
visually, and record the result for the PR body. The global `withDefaultSkin` decorator should make
parity automatic for `--skin-*` consumers — any residual drift (beyond a single-pixel wrapper-div
shift) is a flag-on-surprise trigger.

Finally, if any markdown was edited: `yarn fix:md`.

- If the gate fails with an in-scope cause → fix and re-run.
- If the gate fails with an out-of-scope cause (global config, decorator, component source) → STOP
  and report (flag-on-surprise). Do not push.

## Step 4 — Flag-on-surprise triggers

Stop and report to the orchestrator (do not push) if any of these apply:

- Prop type is opaque (function-returning-JSX, complex branded type, render-prop) that can't be
  demoed via a primitive control.
- Real-game mount uses providers beyond `withDb` / `withRouter`.
- A `*.test.*` file imports from the story file — collapse would break tests.
- Verification gate fails with a root cause outside the audit scope (`.storybook/*`, component
  source, decorators, `yarn.lock`).
- Visual drift between Storybook Playground and real-game mount that exceeds a single-pixel
  wrapper offset (i.e., token / layout / theme drift, not the expected noise from the global
  `withDefaultSkin` wrapper).
- A callback prop requires a replayable one-shot sequence whose trigger-button wrapper would
  exceed a trivial `ShowTrigger`-style helper (e.g., it needs real providers beyond the allowed
  decorators).
- The allocated worktree path, branch name, or port is already in use.

Report format: target file(s), trigger category, one-paragraph diagnosis, proposed fix (if any),
state left on disk (branch created? commits? worktree left in place?).

## Step 5 — Commits

One commit per story file. Message: `stories(<area>/<name>): <imperative summary>` — e.g.
`stories(components/header): audit controls + Playground`. For Wave 1 (batch agent), five commits on
the same branch — do not squash.

## Step 6 — Rebase, push, open PR

```bash
git fetch origin master
git rebase origin/master                                # resolve conflicts → flag if any arise
git push -u origin {{BRANCH}}
```

If a workflow auto-opens a PR on push, edit its title/body in place with `gh pr edit` — do NOT open
a second PR.

Otherwise, open the PR:

```bash
gh pr create --base master --title "{{PR_TITLE}}" --body "$(cat <<'EOF'
## Summary

<one-paragraph narrative; list each target file and what changed>

## Playground shape

<per target file: list the controls exposed on Playground, any auxiliary stories kept and why,
any named stories deleted because a control now covers them>

## Skin wrapper cleanup

<per target file: "no inline wrapper found" OR "removed inline `game-container skin-classic`
wrapper and orphaned `classicSkin`/`CSSProperties` imports — global `withDefaultSkin` decorator
applies classic skin, PR #154">

## Real-game parity

<per target file: "match" or describe drift; link the runtime route you compared against>

## Verification

- [x] `yarn typecheck`
- [x] `yarn lint`
- [x] `yarn test:storybook --url http://127.0.0.1:{{PORT}}` (all suites green)
- [x] Real-game parity visual check

Refs #125.
EOF
)"
```

Do NOT wait for merge. Once the PR is open (or the auto-opened PR has been edited), the agent's work
is done.

## Step 7 — Report back

Respond to the orchestrator with a short summary (≤ 200 words):

- PR number + URL (or "flagged" + trigger).
- Target file(s) changed.
- Skin wrapper cleanup per file (none found / removed inline wrapper + orphaned imports).
- Auxiliary stories kept or deleted per file (and why).
- Real-game parity result per file.
- Any surprises, even if not blocking.

## Constraints

- **Named exports only** — `export default meta` is the single exception (framework config file).
- **Do not modify** `.storybook/*`, decorators, the component source, `yarn.lock`, or any file
  outside TARGET FILES. Any such need is a flag-on-surprise trigger. In particular, do NOT
  re-introduce or preserve a per-file classic-skin wrapper — the global `withDefaultSkin`
  decorator owns that.
- **Never commit directly to `master`.** Your work lives on `{{BRANCH}}`.
- **Never force-push.** If rebase creates conflicts, flag and stop.
- **Skip markdown `fix:md` unless you edited markdown** — this batch should not.
````

---

## Tasks

### Task 1: Verify preconditions and dispatch Wave 1

**Files:** orchestrator-only (no file edits by the orchestrator).

- [ ] **Step 1: Confirm master is current**

  Run from the project root:

  ```bash
  cd /Users/leocaseiro/Sites/base-skill
  git fetch origin --prune
  git log --oneline origin/master -3
  ```

  Expected: the three most recent commits on `origin/master` include `52f57ae6`
  (`docs(spec): tier 1 + tier 2 storybook audit batch design (#149)`). If not, stop and
  investigate — the spec is the source of truth and must be merged.

- [ ] **Step 2: Confirm Wave 1 resources are free**

  ```bash
  test ! -e ./worktrees/stories-tier1-root && echo "worktree path free"
  ! lsof -i :6106 > /dev/null 2>&1 && echo "port 6106 free"
  git show-ref --verify --quiet refs/heads/stories/tier1-root-audit \
    && echo "branch EXISTS — stop" \
    || echo "branch free"
  ```

  Expected: all three lines print "…free". If any resource is taken, stop and surface it to
  the user — do not attempt to clean it up automatically (it may be in-progress work).

- [ ] **Step 3: Dispatch the Wave 1 subagent**

  Use the `Agent` tool, `subagent_type: "general-purpose"`, `description: "Storybook Tier 1 root audit batch"`.
  The `prompt` is the Shared subagent prompt template above with these substitutions:
  - `{{AGENT_ID}}` → `tier1-root`
  - `{{TARGET_FILES}}` →

    ```text
    src/components/ThemeToggle.stories.tsx
    src/components/Footer.stories.tsx
    src/components/Header.stories.tsx
    src/components/OfflineIndicator.stories.tsx
    src/components/UpdateBanner.stories.tsx
    ```

  - `{{WORKTREE_PATH}}` → `./worktrees/stories-tier1-root`
  - `{{BRANCH}}` → `stories/tier1-root-audit`
  - `{{PORT}}` → `6106`
  - `{{PR_TITLE}}` → `stories(root): audit controls + Playground for 5 files`
  - `{{BATCH_OR_SOLO}}` → `batch`

  Dispatch in the **foreground** — Task 2 depends on the Wave 1 PR existing before it dispatches.

- [ ] **Step 4: Classify the subagent's return**

  Read the agent's summary. Two possible outcomes:
  - **Success** — the summary contains a PR URL. Continue to Step 5.
  - **Flagged** — the summary describes a flag-on-surprise trigger and names the state left on
    disk. Report the flag verbatim to the user, ask for guidance (retry / re-scope / drop the
    file), and stop the plan here. Do not auto-retry.

- [ ] **Step 5: Verify the PR exists**

  ```bash
  gh pr list --head stories/tier1-root-audit --state open \
    --json number,title,url,headRefName
  ```

  Expected: exactly one PR with `headRefName: "stories/tier1-root-audit"` and a title
  starting with `stories(root):`. If zero PRs are returned, investigate — the agent may have
  pushed without opening a PR, in which case open one manually using the PR template from
  Step 6 below. If more than one PR is returned (workflow double-open), close the duplicate.

- [ ] **Step 6: Tick the five Tier 1 checkboxes in issue #125**

  ```bash
  gh issue view 125 --json body -q .body > /tmp/125-body.md
  # Tick these five lines:
  #   - [ ] `Footer.stories.tsx`
  #   - [ ] `Header.stories.tsx`
  #   - [ ] `OfflineIndicator.stories.tsx`
  #   - [ ] `ThemeToggle.stories.tsx`
  #   - [ ] `UpdateBanner.stories.tsx`
  # by changing `- [ ]` → `- [x]` for each, in /tmp/125-body.md, then:
  gh issue edit 125 --body-file /tmp/125-body.md
  ```

  Confirm with `gh issue view 125 --json body -q .body | grep -E 'Footer|Header|OfflineIndicator|ThemeToggle|UpdateBanner'`
  — all five lines should now show `[x]`.

- [ ] **Step 7: Mark Wave 1 complete in orchestrator TaskList**

  Update the orchestrator's Wave 1 task to `completed`. Do not mark the PR itself merged — the
  user reviews and merges asynchronously.

### Task 2: Dispatch Wave 2 (5 subagents in parallel)

**Files:** orchestrator-only (no file edits by the orchestrator).

Wave 2 does **not** block on Wave 1 merge — only on Wave 1 PR being open (which Task 1 Step 5
verified). Disjoint directories guarantee no merge conflicts between branches.

- [ ] **Step 1: Verify Wave 2 resources are free**

  ```bash
  for path in stories-audio-button stories-image-question stories-text-question \
              stories-dot-group-question stories-word-library-explorer; do
    test ! -e "./worktrees/$path" || echo "COLLISION: ./worktrees/$path"
  done
  for port in 6107 6108 6109 6110 6111; do
    lsof -i :$port > /dev/null 2>&1 && echo "COLLISION: port $port in use"
  done
  for branch in stories/audio-button-audit stories/image-question-audit \
                stories/text-question-audit stories/dot-group-question-audit \
                stories/word-library-explorer-audit; do
    git show-ref --verify --quiet "refs/heads/$branch" \
      && echo "COLLISION: branch $branch exists"
  done
  ```

  Expected: no `COLLISION` lines. If any collision appears, stop and surface it — do not
  attempt to clean up automatically.

- [ ] **Step 2: Dispatch all 5 Wave 2 subagents in a single message**

  This step MUST use a single assistant message with 5 parallel `Agent` tool calls — that is
  the only way to run them concurrently per the subagent-driven-development contract.

  Each of the five calls uses:
  - `subagent_type: "general-purpose"`
  - `description: "Storybook Tier 2 <name> audit"` (where `<name>` is the agent id)
  - `run_in_background: false` (foreground — see Step 3)
  - `prompt:` the Shared subagent prompt template with the substitutions from the allocation
    table for that row. Recap:

    | Agent id              | `{{TARGET_FILES}}` (single file)                                         | `{{WORKTREE_PATH}}`                         | `{{BRANCH}}`                          | `{{PORT}}` | `{{PR_TITLE}}`                                                           |
    | --------------------- | ------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------- | ---------- | ------------------------------------------------------------------------ |
    | audio-button          | `src/components/questions/AudioButton/AudioButton.stories.tsx`           | `./worktrees/stories-audio-button`          | `stories/audio-button-audit`          | `6107`     | `stories(questions/audio-button): audit controls + Playground`           |
    | image-question        | `src/components/questions/ImageQuestion/ImageQuestion.stories.tsx`       | `./worktrees/stories-image-question`        | `stories/image-question-audit`        | `6108`     | `stories(questions/image-question): audit controls + Playground`         |
    | text-question         | `src/components/questions/TextQuestion/TextQuestion.stories.tsx`         | `./worktrees/stories-text-question`         | `stories/text-question-audit`         | `6109`     | `stories(questions/text-question): audit controls + Playground`          |
    | dot-group-question    | `src/components/questions/DotGroupQuestion/DotGroupQuestion.stories.tsx` | `./worktrees/stories-dot-group-question`    | `stories/dot-group-question-audit`    | `6110`     | `stories(questions/dot-group-question): audit controls + Playground`     |
    | word-library-explorer | `src/data/words/WordLibraryExplorer.stories.tsx`                         | `./worktrees/stories-word-library-explorer` | `stories/word-library-explorer-audit` | `6111`     | `stories(data/words/word-library-explorer): audit controls + Playground` |

    `{{BATCH_OR_SOLO}}` → `solo` for every Wave 2 agent.

- [ ] **Step 3: Classify each returned summary independently**

  All 5 agents run foreground in one tool batch; Claude receives all five results at once.
  Process each independently — a flag from agent 2a does not block 2b-2e. For each:
  - **Success** — record the PR URL. Continue.
  - **Flagged** — record the trigger and the on-disk state the agent reported. Surface all
    flags together after Step 6.

- [ ] **Step 4: Verify each Wave 2 PR exists**

  ```bash
  for branch in stories/audio-button-audit stories/image-question-audit \
                stories/text-question-audit stories/dot-group-question-audit \
                stories/word-library-explorer-audit; do
    echo "--- $branch ---"
    gh pr list --head "$branch" --state open --json number,title,url \
      --jq '.[] | "#\(.number) \(.title) \(.url)"'
  done
  ```

  Expected: one line per successful agent. Zero lines for an agent means "no PR opened" —
  cross-reference with Step 3's classification (it should have flagged) and investigate if
  the agent claimed success but the PR is missing.

- [ ] **Step 5: Tick the Tier 2 checkboxes in issue #125**

  Fetch the current body, tick one line per successful Wave 2 PR, write it back. Map:

  | Wave 2 agent          | Checkbox line in issue #125                     |
  | --------------------- | ----------------------------------------------- |
  | audio-button          | `AudioButton/AudioButton.stories.tsx`           |
  | image-question        | `ImageQuestion/ImageQuestion.stories.tsx`       |
  | text-question         | `TextQuestion/TextQuestion.stories.tsx`         |
  | dot-group-question    | `DotGroupQuestion/DotGroupQuestion.stories.tsx` |
  | word-library-explorer | `data/words/WordLibraryExplorer.stories.tsx`    |

  Use the same `gh issue view ... | edit --body-file -` pattern as Task 1 Step 6. Do not tick
  checkboxes for flagged agents.

- [ ] **Step 6: Surface flag summaries (if any)**

  If any Wave 2 agent flagged, post a consolidated report to the user: per-agent trigger,
  on-disk state, proposed fix. Ask for guidance (retry / re-scope / drop the file). Do not
  auto-retry.

- [ ] **Step 7: Mark Wave 2 complete in orchestrator TaskList**

  Mark Wave 2 complete once all PRs are open (or all flags reported). Wave 2 is "complete"
  when the orchestrator has nothing left to drive — user reviews PRs asynchronously.

### Task 3: Handoff to user

**Files:** orchestrator-only.

- [ ] **Step 1: Assemble the final report**

  One concise message to the user containing:
  - All 6 PR URLs (or 5 if Wave 1 was flagged; fewer if Wave 2 had flags too).
  - Per-PR: Skin wrapper cleanup line (none / removed) and auxiliary-stories kept/deleted summary, both lifted from the PR body.
  - Any flag-on-surprise summaries with the proposed follow-up.
  - Issue #125 checkbox state — number newly ticked vs. remaining.

- [ ] **Step 2: Stop**

  The orchestrator has no further action. PRs do not auto-merge; the user reviews and merges
  each asynchronously. If any flag was raised, the plan pauses here pending user guidance.

---

## Verification

The plan is considered successfully executed when:

- Six branches exist on `origin` (or 5, with reasons for the missing one documented as flags).
- Each branch has a corresponding open PR against `master` referencing `#125`.
- Issue #125 has ten new `[x]` checkboxes (or fewer, with flag reasons documented per skipped file).
- No direct commits on `master`.
- No edits outside the ten target story files across all six branches.
- Each PR body contains the Summary, Playground shape, Skin wrapper cleanup, Real-game parity,
  and Verification sections specified in the shared subagent prompt template.

## Out of scope (from the spec — do not expand)

- Design-token contrast work (separate VR-baseline PR).
- `.storybook/*` changes.
- Real-game component refactors beyond what `#143` shipped.
- Tier 3 / Tier 4 / Tier 5 files — future batches, tracked in `#125` and a separate spec.

## Rollback

If after dispatch a wave goes sideways (multiple flags, cascading rebase failures, etc.):

1. Do not force-push or delete remote branches — subagent branches are review artifacts even when
   flagged.
2. Close any PRs opened by a flagged wave with a comment linking to the flag report.
3. Remove the corresponding local worktrees cleanly:

   ```bash
   git worktree remove ./worktrees/<name>        # refuses if dirty — use --force only after review
   ```

4. Keep the branches until the user decides to delete them or rebase into a replacement plan.

## Execution handoff

Per the user's standing instruction (`project_storybook_audit_rollout` memory, plus the spec's
review model): after the plan PR opens, the orchestrator **pauses for review**. Do not dispatch any
subagent until the plan PR is approved or the user explicitly says "go".

Once approved, execution proceeds via `superpowers:subagent-driven-development` — dispatch Task 1,
review Wave 1 PR, then dispatch Task 2 (which itself parallelises).
