# Handoff: config state sync (#254)

**Date:** 2026-04-30
**Branch:** feat/issue-254
**Worktree:** ~/.worktrees/base-skill/bs-14 (AO default; see Context to remember)
**Worktree path:** /Users/leocaseiro/.worktrees/base-skill/bs-14
**Git status:** 2 unpushed commits, 1 unrelated AO setup file (`.claude/settings.json` modified, `.claude/metadata-updater.sh` untracked)
**Last commit:** 39e38a1c docs(plan): config state sync implementation plan for #254
**PR:** none yet — Task 8 of the plan opens it

## Resume command

```
/resync
cd /Users/leocaseiro/.worktrees/base-skill/bs-14
# Then invoke subagent-driven-development against the plan:
/superpowers:subagent-driven-development docs/superpowers/plans/2026-04-30-config-state-sync.md
```

## Current state

**Task:** Implement issue #254 — unify simple ↔ advanced game-config state across WordSpell, SortNumbers, NumberMatch.
**Phase:** planning complete; implementation not yet started
**Progress:** spec written and committed; 8-task implementation plan written and committed; ready to execute Task 1.

## What we did

Diagnosed the existing simple/advanced fork in `AdvancedConfigModal` (`useState(initialConfig)` runs once at mount, modal is always rendered, so simple-form edits never propagate). Ran the brainstorming skill end-to-end, agreed on a shared-draft architecture lifted into `InstructionsOverlay` via a new `useConfigDraft` hook. Wrote design spec and a TDD implementation plan, both committed on this branch.

## Decisions made

- **Lift draft to `InstructionsOverlay` (not the route).** Modal becomes controlled. Route's `cfg` remains canonical config the engine consumes; overlay updates it via `onConfigChange`. — Smallest correct diff that fully fixes the bugs.
- **Snapshot on modal open; Discard reverts both views.** Cancel/Esc/outside-click revert the draft to the modal-open snapshot, which propagates back through `onConfigChange` so the simple form below the modal also visibly reverts. User explicitly confirmed this UX.
- **Dirty = !deepEqual(draft, savedBaseline).** Saved baseline = whatever the route loader returned (`custom_games` row for custom games; `saved_game_configs` last-session row for default games).
- **In-house `deepEqual` (no new dep).** Plain JSON shapes. Crucially: **two function values are treated as equal** so resolver-added artifacts like `levelMode.generateNextLevel` (regenerated on every resolve) don't produce false-positive dirty.
- **Replace `usePersistLastGameConfig` debounce with explicit calls.** Last-session is now persisted only on Play branches (clean play, save & play, save as new, update, play without saving). Auto-debounced writes per keystroke are retired.
- **Three-action prompt for dirty + custom game** (Update / Save as new / Play without saving). Two-action existing prompt for dirty + default game. Clean play skips prompt entirely.
- **Inline error banner + sonner toast** on persistence failures (Update, Save as new, last-session write).

## Spec / Plan

- `docs/superpowers/specs/2026-04-30-config-state-sync-design.md` (committed: 69ef7e93)
- `docs/superpowers/plans/2026-04-30-config-state-sync.md` (committed: 39e38a1c)

## Key files (touched by the plan)

- `src/lib/deep-equal.ts` — create — function-aware structural equality (Task 1)
- `src/components/answer-game/InstructionsOverlay/useConfigDraft.ts` — create — snapshot/discard/commit hook (Task 2)
- `src/components/AdvancedConfigModal.tsx:71-81` — refactor to controlled `value/onChange` (Task 3)
- `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx:130, 161-186, 303-362` — wire hook + dirty Play prompt (Tasks 4–5)
- `src/routes/$locale/_app/game/$gameId.tsx:469, 611, 752` — remove `usePersistLastGameConfig`, pass `onPersistLastSession` (Task 6)
- `src/db/hooks/usePersistLastGameConfig.ts` — delete (Task 6)

## Open questions / blockers

- [ ] **Worktree location.** This branch lives in AO's default `~/.worktrees/base-skill/bs-14` instead of the project-standard `<project-root>/worktrees/<branch>`. User flagged but did not require migration. Decision: continue here unless the user asks to migrate. Branch (`feat/issue-254`) and PR target are unaffected.

## Next steps

1. [ ] Execute Task 1 — `deepEqual` helper (TDD: write failing test → implement → commit).
2. [ ] Execute Tasks 2–7 in order, one commit per task. The plan is bite-sized (2–5 min per step) with full code shown.
3. [ ] Task 3 commit will leave `InstructionsOverlay.tsx` typecheck-RED for the controlled-prop API change — Task 4 closes it. Plan calls this out explicitly.
4. [ ] Task 8 — run pre-push gate, push, open PR with `Closes #254`.
5. [ ] If VR diffs appear: review images, run `yarn test:vr:update` locally with Docker, push baselines.

## Context to remember

- **No `export default`.** Named exports only. (Memory: feedback_no_default_export.)
- **TDD required.** Every behavior change is red→green→refactor; bug fixes need a failing regression test before the fix (CLAUDE.md).
- **Baby-step commits.** Multiple commits per PR is preferred (CLAUDE.md). Plan's 7 commits are the rollout; Task 8 is push/PR.
- **`SKIP_*` flags OK on minor checkpoint commits.** User prefers review checkpoints over every commit being locally green. Document the reason in the commit message.
- **VR tests run locally with Docker** (not via CI dispatch). Ensure Docker is running; if not, ask the user.
- **PRs always target `master`.** Workflows only fire on PRs against master.
- **Storybook titles are PascalCase** (`AnswerGame/InstructionsOverlay`, never the kebab filesystem path).
- **Confirm before push only on bug fixes.** Features push freely; this is a feature (#254 is labeled `bug` but the work introduces new behavior — closer to a feature). User judgment required at push time.
- **Two RxDB stores at play.** `custom_games` = named saves. `saved_game_configs` = last-session "remember my panel state". The plan removes auto-debounce on the latter; explicit Play-branch writes replace it.
- **The `levelMode.generateNextLevel` function** in resolved SortNumbers configs is the reason `deepEqual` ignores function-vs-function comparisons. RxDB strips functions on save anyway; resolver regenerates them on load.
