# Context Handoff — Unified Skin Token Architecture

## Branch

`feat/multi-skin-config` (worktree at `worktrees/feat-multi-skin-config`)

## Issue & PR

- Issue: [#359 — refactor: unified skin tokens for tile states + animations + drag-ghost consolidation](https://github.com/leocaseiro/base-skill/issues/359)
- PR: [#393 — feat(skin): multi-skin config Phase 1 + Dragon Cave](https://github.com/leocaseiro/base-skill/pull/393)

## Current State

**Plan reviewed and committed. Ready for implementation.**

No dedicated spec exists — requirements feed directly into the plan. The
`2026-05-13-multi-skin-config-design.md` spec covers the broader multi-skin
config but not this token migration specifically.

## What's Done

1. **Requirements doc** written and reviewed (2 rounds):
   `docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md`
   — R1-R13; R8/R9 deferred to XState migration (Spec 1a)

2. **Implementation plan** written and reviewed via `ce-doc-review` (5 personas):
   `docs/superpowers/plans/2026-05-21-unified-skin-token-architecture.md`
   — 19 findings applied, all P0/P1/P2 resolved, markdown lint clean

3. Key review decisions baked into the plan:
   - **P0 fix:** `--skin-tile-effective-bg` indirection for inline style vs
     `[data-tile-state]` specificity conflict
   - **Task 1b added:** `skin-tokens.ts` canonical token name registry
   - **Tasks 3+4 merged:** atomic commit for classic-skin empty + token rename
   - **SpotAllTile disabled** during migration (needs broader refactor)
   - **Task 13 prerequisite:** Dragon Cave `!important` removal depends on
     Task 2 landing first
   - **Pickup/ejecting motion tokens** added to `:root` + CSS rules
   - **bank-tile-reject-feedback.ts** refactored from snapshot/restore to
     `data-tile-state="reject"` set/unset

## What's Next

Implementation of the plan (14 tasks + Task 1b). The plan uses checkbox syntax
and is designed for `superpowers:subagent-driven-development` or
`superpowers:executing-plans`.

Task order matters — see dependency notes in the plan. Key constraint: Task 13
(Dragon Cave) requires Task 2 first.

## Key Files

| File                                                                          | Role                            |
| ----------------------------------------------------------------------------- | ------------------------------- |
| `docs/superpowers/plans/2026-05-21-unified-skin-token-architecture.md`        | Implementation plan (binding)   |
| `docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md` | Requirements (R1-R13)           |
| `src/lib/skin/classic-skin.ts`                                                | 63 tokens to migrate to `:root` |
| `src/components/answer-game/styles.ts`                                        | `tileStyle()` to simplify       |
| `src/components/answer-game/Slot/Slot.tsx`                                    | State styling migration         |
| `src/games/word-spell/skins/dragon-cave-skin.tsx`                             | Only custom skin                |

## Resume Commands

```bash
# 1. Sync
/resync

# 2. cd to worktree
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config

# 3. Start implementation
# Use superpowers:executing-plans or superpowers:subagent-driven-development
# on docs/superpowers/plans/2026-05-21-unified-skin-token-architecture.md
```
