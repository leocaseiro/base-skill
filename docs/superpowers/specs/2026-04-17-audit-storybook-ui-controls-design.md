# Audit pilot — retrofit `src/components/ui/*` stories to the new Controls Policy

## Goal

Bring the 10 `src/components/ui/*.stories.tsx` files into compliance with the
Controls Policy and Required Variants gates added to
`.claude/skills/write-storybook/SKILL.md` (PR #119). This is a pilot — small,
contained, easy to review — meant to prove the skill end-to-end on a realistic
set before scaling the audit to the remaining 34 story files.

## Background

PR #119 updated the `write-storybook` skill to require:

- Proper `argTypes` controls (`select` / `radio` / `boolean` / `range`) for any
  enum / union / boolean / number prop — no raw JSON fallbacks.
- Removal of per-story `{ action: 'xxx' }` wiring on `on[A-Z]*` handlers,
  since `.storybook/preview.tsx` sets `actions.argTypesRegex: '^on[A-Z].*'`
  globally (every matching prop is auto-wired to the Actions panel).
- At least one `play()` interaction story on every interactive component.
- Presence of the `Required Variants` gates (Default, enum-per-value where
  visuals differ, state variants, edge cases).

A fast survey of the existing 44 stories showed:

- 36 files have no `argTypes` at all — they rely on Storybook's auto-inference,
  which renders raw text inputs for union types.
- 9 files manually wire `{ action: '...' }` on handler props.
- Many interactive components lack a `play()` interaction story.

The audit is large enough that we split it into stages; this spec covers stage
one: `src/components/ui/*`.

## In scope

Ten story files:

```text
src/components/ui/alert-dialog.stories.tsx
src/components/ui/button.stories.tsx
src/components/ui/card.stories.tsx
src/components/ui/dropdown-menu.stories.tsx
src/components/ui/input.stories.tsx
src/components/ui/label.stories.tsx
src/components/ui/select.stories.tsx
src/components/ui/sheet.stories.tsx
src/components/ui/slider.stories.tsx
src/components/ui/sonner.stories.tsx
```

Each file is audited against the seven gates in the `Audit / Upgrade Checklist`
section of `.claude/skills/write-storybook/SKILL.md`. Per-file work is
summarised in the _Per-file Audit_ section below.

## Out of scope

- **Design-token contrast fix.** `button.stories.tsx` and `input.stories.tsx`
  currently opt out of the `color-contrast` axe rule via
  `parameters.a11y.config.rules` because `text-secondary-foreground` on
  `bg-secondary` (Secondary button variant) and `muted-foreground` helper text
  on `bg-background` (Invalid input variant) both score 4.34:1 — just below
  4.5:1. The opt-outs carry `TODO` comments explaining the problem. This audit
  leaves them unchanged. A separate token-fix PR will raise the contrast to
  WCAG AA across all five themes and remove the opt-outs; that PR also needs
  VR baseline regeneration.

- **The other 34 story files.** `answer-game/*`, `questions/*`, `games/*`,
  plus the component-root stories (`GameCard`, `GameGrid`, `Footer`, etc.).
  Follow-up PRs after this pilot lands and the pattern is proven.

- **Fixture extraction, theme pins, viewport pins.** Touch a story with one of
  these only if the file obviously calls for it while we're in there (e.g., a
  test fixture that's clearly too large to inline). Don't retrofit speculatively.

## Non-goals

- No new components. No refactors to the underlying `ui/*` components
  themselves. The audit is story-only.
- No changes to `.storybook/preview.tsx` or global config.
- No changes to the SKILL.md — if a gap is discovered mid-audit, the fix goes
  into a separate skill-update PR so the audit doesn't widen.

## Per-file Audit

Per-file summary of planned work. Columns correspond to the SKILL.md checklist
gates. A dash (`—`) means the file already passes that gate (or the gate is
N/A for a pure-display component).

| #   | File            | Controls retrofit                                              | Action cleanup                          | `play()`                                | State variants added      |
| --- | --------------- | -------------------------------------------------------------- | --------------------------------------- | --------------------------------------- | ------------------------- |
| 1   | `button`        | `variant` select, `size` select, `disabled` boolean            | remove `onClick: { action: 'clicked' }` | `ClicksButton`                          | —                         |
| 2   | `input`         | `type` select, `disabled` boolean, `aria-invalid` boolean      | —                                       | `TypesAndReflectsValue`                 | `Required`, `ReadOnly`    |
| 3   | `slider`        | `min` / `max` / `step` range, `disabled` boolean               | —                                       | `KeyboardIncrement` (ArrowRight)        | `Disabled`                |
| 4   | `card`          | text args for title / description                              | —                                       | — (pure display)                        | —                         |
| 5   | `label`         | `htmlFor`, `children` text                                     | —                                       | — (pure display)                        | —                         |
| 6   | `alert-dialog`  | text args for trigger / title / description / confirm / cancel | —                                       | `OpensAndConfirms`, `CancelsWithEscape` | `Cancelled`               |
| 7   | `dropdown-menu` | text args for trigger + items                                  | —                                       | `OpensAndSelects`                       | `WithDestructiveItem`     |
| 8   | `select`        | text args for trigger label, options                           | —                                       | `SelectsOption`                         | `Disabled`, `Preselected` |
| 9   | `sheet`         | `side` select (right / left / top / bottom), text args         | —                                       | `OpensAndClosesOnEscape`                | `FromTop`, `FromBottom`   |
| 10  | `sonner`        | `variant` select (default / success / error), `message` text   | —                                       | `ShowsToast`                            | —                         |

### Radix portal gotcha (implementer note)

`alert-dialog`, `dropdown-menu`, `select`, and `sheet` render their open
content through a portal onto `document.body`. Queries scoped to
`within(canvasElement)` from `storybook/test` will not find that content. Use
`within(document.body)` for assertions that follow an open-trigger action. If
a `play()` still proves brittle (focus flicker, animation races, Radix API
surfaces not compatible), the implementer is allowed to drop that specific
`play()` story, but must document the reason in the commit body.

### "Pure display" rationale

`card` and `label` take no interactive props (no `on*` handlers beyond
standard DOM, no user-settable state). A single `Default` render is
sufficient; no `play()` story is required by the Required Variants gate. The
minor controls retrofit is limited to exposing the child text as args so the
controls panel has something meaningful to drive.

### Naming

All new stories follow PascalCase and describe state, per the SKILL.md
convention: `TypesAndReflectsValue`, `KeyboardIncrement`, `OpensAndConfirms`,
`CancelsWithEscape`, `SelectsOption`, `OpensAndClosesOnEscape`. No
`ButtonWithClickAndLabel`-style combinatorial names.

## Workflow

**Branch:** `audit/storybook-controls` (worktree
`worktrees/audit-storybook-controls`). The branch already carries one
unrelated commit — the `.claude/settings.json` permission allowlist added
during a previous session's `/less-permission-prompts` sweep. That commit
lands as the first commit on this branch.

**Execution:** `superpowers:subagent-driven-development`, one task per story
file (10 tasks), commits as `stories(ui/<name>): retrofit per controls
policy`. Task flow:

1. **Implementer subagent (Sonnet)** reads the story + component source,
   applies the audit checklist, commits.
2. **Spec-compliance reviewer (Haiku)** — confirms the commit matches the
   per-file row in the _Per-file Audit_ table.
3. **Code-quality reviewer (Haiku)** — confirms `argTypes` align with the
   component's TypeScript prop types, `play()` assertions are meaningful
   (not tautologies), names follow convention.
4. Review loop: if either reviewer flags issues, the same implementer
   subagent fixes in a new commit, both reviewers re-review. Repeat until
   both approve. Never skip the re-review.

**Per-commit verification** (implementer runs before reporting done):

- `yarn typecheck` — exit 0.
- `yarn lint` — exit 0.
- `yarn test:storybook` is **not** run per-file (too slow); one end-of-PR
  run covers it.

**End-of-PR verification** (before pushing):

- Launch Storybook on a free port, run `yarn test:storybook --url
http://127.0.0.1:$PORT`. All stories (not just `ui/*`) must pass the
  test-runner (a11y + `play()`).
- `yarn typecheck`, `yarn lint`, `yarn lint:md` — all exit 0.
- `git log --oneline origin/master..HEAD` — 10 story-audit commits plus the
  settings commit, plus any fix-ups the review loop required.

## Acceptance Criteria

1. Every in-scope story file passes every applicable gate in the SKILL.md
   Audit Checklist.
2. No regression: `yarn test:storybook` passes against all stories in the
   project (not just `ui/*`).
3. No regression in typecheck, lint, or markdown lint.
4. PR body links to `.claude/skills/write-storybook/SKILL.md` and includes
   the _Per-file Audit_ table for reviewer orientation.
5. Radix-portal `play()` stories that were dropped (if any) are documented
   in their task's commit message with a specific reason.

## Review Checkpoints

- After Task 5 (`label`, the halfway trivia point): pause and sanity-check
  the review cadence. If the implementer-reviewer loop is churning (e.g.,
  the same kind of fix keeps being flagged), update the SKILL.md in a
  separate small PR before continuing.
- Before opening the PR: self-verify by running through the _Per-file
  Audit_ table and ticking every row.

## Risks and Mitigations

| Risk                                                                        | Likelihood | Mitigation                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radix-portal `play()` stories are brittle                                   | Medium     | Drop the `play()` with a documented reason; the audit checklist allows this if justified.                                                                                          |
| `argTypes` drift from component TS types after a future component refactor  | Low        | Code-quality reviewer spot-checks type alignment; typecheck catches the rest.                                                                                                      |
| End-of-PR test-runner surfaces a pre-existing failure in a non-`ui/*` story | Medium     | Treat as out-of-scope — log it, leave the fix for a separate PR, proceed. Do not fix unrelated failures inside this audit.                                                         |
| VR snapshots shift from cosmetic-only story edits                           | Low        | Stories are not a VR mechanism in this project; VR lives in `e2e/visual.spec.ts`. Story-only edits should not change VR output. If they do, investigate before updating baselines. |

## Deliverables

- 10 retrofitted story files — compliance confirmed by the two-stage review.
- PR against `master`, title `stories(ui): audit retrofit per new controls
policy`.
- This spec checked in at
  `docs/superpowers/specs/2026-04-17-audit-storybook-ui-controls-design.md`.
- A companion implementation plan written by the `superpowers:writing-plans`
  skill after this spec is approved.
