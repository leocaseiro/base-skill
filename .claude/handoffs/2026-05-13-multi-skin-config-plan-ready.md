# Handoff: multi-skin config — spec reviewed, plan ready to execute

**Date:** 2026-05-13
**Branch:** `feat/multi-skin-config`
**Worktree:** `worktrees/feat-multi-skin-config`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config`
**Git status:** clean
**Commits ahead of `origin/master`:** 4
**Last commit:** `bdafaf753 docs(spec): drop (TBD) from follow-up-plan frontmatter`
**PR:** none yet

---

## Paste this into a new session

Use the block below as the **first message** in a fresh Claude Code (or Cursor) session — it tells the agent who you are, where the worktree is, what the goal is, and which plan to execute. Edit the "Execution mode" line to pick subagent-driven vs inline before pasting if you have a preference; otherwise the agent will ask.

```
You are resuming the feat/multi-skin-config branch on BaseSkill (React + TypeScript phonics game for kids). Read CLAUDE.md and AGENTS.md at the project root before doing anything else.

WORKTREE
  cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
  Confirm clean: git status
  Confirm HEAD: git log -1 --oneline (should be bdafaf753 or a descendant)

CONTEXT (full background lives in these files — read them in this order)
  1. docs/superpowers/specs/2026-05-13-multi-skin-config-design.md  — the spec (post-review)
  2. docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md     — the implementation plan (16 tasks, 9 phases)
  3. .claude/handoffs/2026-05-13-multi-skin-config-plan-ready.md     — this handoff doc

GOAL
  Ship Phase 1 of multi-skin support: wire the Dragon Cave skin into the production WordSpell route via a user-pickable skin radio in config forms, and seed a default custom game ("The Floor is Lava") that surfaces the skin on the home screen. This PR absorbs PR #358 (the original cave-dragon Storybook skin).

EXECUTION
  The plan at docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md is the binding source of truth. It sequences 16 tasks across 9 phases (1a → 1i) with TDD steps and exact file paths. Two execution-mode options:

  - Subagent-driven (recommended): invoke superpowers:subagent-driven-development and dispatch a fresh subagent per task with two-stage review.
  - Inline: invoke superpowers:executing-plans and run tasks sequentially with checkpoints.

  Pick one and announce it before starting Task 1.

GUARDRAILS (project conventions you MUST honor)
  - Worktrees live at <project-root>/worktrees/<branch>/ (never .claude/worktrees/...).
  - Commit per phase boundary (baby-step commits). Skip pre-commit hooks only when documented (SKIP_* flags).
  - TDD strict for the wrongTileBehavior bug fix (Task 9): red test before fix.
  - Markdown must pass `yarn fix:md` + `yarn lint:md`. Run `yarn fix:md` after editing any .md file.
  - Storybook titles use PascalCase segments (e.g., Games/WordSpell/SkinHarness). Filesystem paths stay kebab-case.
  - When the plan prescribes *.stories.tsx, load the project skill `write-storybook` as authoritative.
  - When the plan prescribes e2e/**, load `write-e2e-vr-tests` as authoritative.
  - VR tests need Docker running; use `yarn test:vr` / `yarn test:vr:update`.
  - User preference: commit freely, push freely for features (this is a feature PR, not a bug fix). Confirm before push only on bug-fix-only branches.

OPEN ITEMS surfaced during the review (don't lose track)
  - Spawn task pending: open a GitHub issue tracking "Skins should be able to override behavioral config (Phase 2+ — not just visuals)". A spawn_task chip exists in this session; if it didn't get spawned, use `gh issue create` per the chip's prompt body.
  - PR #358 absorption is Task 4 of the plan. Mechanics: cherry-pick #358's commits onto this branch with the rename applied. The spec's "Relationship to PR #358" section names every renamed identifier.
  - Cover image: Phase 1 ships a placeholder generated from a Storybook screenshot crop (Task 12). Final cover asset is a deferred follow-up — user will supply it later.

START
  Begin Task 1 (Type system — per-game SkinId unions + narrowing the base skin? field). After the commit, pause for review unless the user has set the execution mode to fully autonomous.
```

---

## Resume command (short form)

If you don't want the full pasteable prompt, this is the minimal sequence:

```
/resync
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
# Read the plan, then start Task 1:
# docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md
```

---

## Current state

**Task:** Multi-skin config Phase 1 — Dragon Cave skin reaches production via skin radio in WordSpell config forms + seeded "The Floor is Lava" custom game.
**Phase:** Planning complete; ready for implementation.
**Progress:** 4 commits on the branch — spec + spec-review-pass + plan + frontmatter cleanup. Zero implementation code yet.

## What we did this session

1. Ran `ce-doc-review` on the spec with 6 personas (coherence, feasibility, product-lens, design-lens, scope-guardian, adversarial). 47 raw findings → 29 actionable + 7 FYI + 2 false positives.
2. Walked through all 29 findings one-by-one per the user's Option-A preference. Result: 22 applied, 5 skipped, 2 auto-resolved by upstream decisions.
3. Drafted the implementation plan with 16 bite-sized TDD-style tasks across 9 phases.

## Decisions made (the load-bearing ones)

- **`app_meta` seed flag uses singleton + `incrementalPatch`, schema v2 bump.** Open Question 3 closed. Per-profile flag is a `theFloorIsLavaSeeded?: Record<profileId, true>` map on `AppMetaDoc`. Reason: the existing schema is `additionalProperties: false` so a k/v insert doesn't work; this mirrors `migrate-custom-games.ts`'s precedent.
- **`registerSkin` becomes generic over `GameSkinIdMap`.** Reason: user explicitly wanted compile-time enforcement, not test-time. Storage stays `Map<string, GameSkin>`; only the public signature narrows.
- **`ConfigField` gains a `radio` variant with `optionsSource: () => …` callable** (resolves at render time). Solves both the advanced-form rendering (no radio existed) and the static-vs-runtime gate together.
- **Skin registration is a module-load side effect of `src/games/word-spell/definition.ts`.** No separate `main.tsx` bootstrap. Importing the game's definition guarantees registration. Open Question 1 closed.
- **PR #358 absorbed into this PR**, not a prerequisite. Reason: a Storybook-only skin doesn't ship anything user-visible, so #358 on its own won't merge. Frontmatter: `depends-on` → `absorbs`.
- **SpotAll dropped from the symmetry sweep.** Its config doesn't extend `AnswerGameConfig` and `SpotAll.tsx` doesn't read `config.skin` today. Its own future skin PR adds both.
- **Image optimization limited to lossless PNG only.** Sprite sheet + SVG conversion deferred to a follow-up PR. Reason: regression risk + the VR baselines update in this PR can't simultaneously be the comparison point.
- **Padding tweaks are skin-scoped via `.skin-dragon-cave` CSS** so classic-skin baselines stay byte-stable. Only Dragon Cave VR baselines move.
- **Seeded row uses a deterministic id** (`seed:the-floor-is-lava:${profileId}`) so multi-tab races fail at the RxDB primary-key layer.
- **Seeder runs from the home-route component, not a route loader.** Active profile is in scope at component-mount; route loaders don't have it.
- **Skins do not yet override behavioral config in Phase 1.** "Skin owns behavior" (e.g., wrongTileBehavior, tileBankMode) is named as a Phase 2+ direction in out-of-scope. A separate GH issue tracks it (spawn-task chip in the previous session).

## Spec / Plan files

- **Spec:** `docs/superpowers/specs/2026-05-13-multi-skin-config-design.md`
- **Plan:** `docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md`

## Plan phase map

| Phase | Tasks | Title                                      |
| ----- | ----- | ------------------------------------------ |
| 1a    | 1–3   | Types + typed registry + ConfigField radio |
| 1b    | 4–5   | Absorb PR #358 + production registration   |
| 1c    | 6–8   | i18n + simple-form radio + advanced-form   |
| 1d    | 9     | TDD-strict `wrongTileBehavior` fix         |
| 1e    | 10    | `app_meta` v2 + migration                  |
| 1f    | 11–13 | Seeder + cover placeholder + home wiring   |
| 1g    | 14    | Padding (skin-scoped) + VR baselines       |
| 1h    | 15    | Lossless PNG compression                   |
| 1i    | 16    | Full play-through E2E                      |

## Spec Deltas flagged at top of the plan

1. **Test paths** — spec says `tests-vr/` and `tests-e2e/`; project uses `e2e/visual.spec.ts` (with `@visual` prefix) and `e2e/<feature>.spec.ts`. Plan uses the project layout.
2. **Storybook entry for the new radio variant** — spec doesn't prescribe one; plan adds it per the `write-storybook` convention ("any new primitive gets a Playground").

## Open questions / blockers

- [ ] PR #358 absorption mechanic — cherry-pick vs. merge. Plan task 4 documents both; pick at execution time.
- [ ] i18n key location — placeholder is `games.instructions.skin`; plan author may relocate to a `config.*` subsection if a cleaner namespace lands during implementation.
- [ ] Cover-placeholder image source — Task 12 takes a Storybook screenshot crop. Could also be hand-composed; either works. Final cover image is a deferred follow-up (user to supply).
- [ ] **Tracking task chip:** spawn the GH issue for "Skins should own behavior config (Phase 2+)" if it wasn't already created. Body lives in the previous session's spawn_task call; if lost, summary is in `docs/superpowers/specs/.../out-of-scope` (the new bullet about skins not yet overriding behavioral config).

## Next steps

1. [ ] Open the plan; pick execution mode (subagent-driven recommended).
2. [ ] Run Task 1 — type system: WordSpellSkinId, NumberMatchSkinId, SortNumbersSkinId unions; narrow `skin?` per-game; add a type-level test.
3. [ ] Continue phase-by-phase. Each task ends with a commit; pause for review between phases unless told otherwise.
4. [ ] Before pushing, run `yarn fix:md` if any docs were edited and verify the pre-push gate passes.
5. [ ] Open the PR with body summarising the absorbed PR #358 work + the multi-skin Phase 1 deliverables + the wrongTileBehavior release-notes line ("If your saved WordSpell configs feel different from new ones, re-save them to pick up the latest defaults.").

## Context to remember

- BaseSkill is a phonics game for kids; this PR's discoverability target is "a child can encounter Dragon Cave today" via two paths — the seeded home card AND the in-session simple-form skin radio (which is kid-accessible).
- The simple form (`WordSpellSimpleConfigForm`) is the kid-accessible config surface; the advanced form is parent-oriented. The skin radio appears on both surfaces when ≥2 skins are registered.
- This PR ships a placeholder cover image; user will supply the final asset later.
- User's commit preference: baby steps, multiple commits per PR. Skip flags OK on minor checkpoint commits, document the reason.
- Markdown gate is enforced — every `.md` edit must pass `yarn lint:md` + `npx prettier --check`.
- VR tests require Docker. If Docker isn't running, the pre-push check skips with a warning; CI will catch any drift.
- User prefers AskUserQuestion (with voice readout in parallel when voice-notify is on) over numbered-list-in-text for decision prompts. The plan's TDD steps are non-interactive — agents shouldn't ask for confirmation between TDD steps.
- One global preference worth honoring across this work: when giving copy-paste artifacts (like the prompt block above), state boundaries explicitly so the user doesn't have to guess where the artifact ends.
