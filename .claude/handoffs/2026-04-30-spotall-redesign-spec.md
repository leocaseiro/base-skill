# Handoff: SpotAll redesign — spec landed, implementation next

**Date:** 2026-04-30
**Branch:** `feat/confusable-spotall`
**Worktree:** `worktrees/feat/confusable-spotall`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat/confusable-spotall`
**Git status:** clean · 0 unpushed
**Last commit:** `a378b958` docs(spot-all): redesign spec for engine integration, R5b, distractor library
**PR:** [#252](https://github.com/leocaseiro/base-skill/pull/252) — open (description updated to reflect redesign + linked issues)

## Resume command

```bash
/resync
cd worktrees/feat/confusable-spotall
# Review the spec first:
#   docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md
# Then start implementation plan via the writing-plans skill:
#   /skill superpowers:writing-plans
```

## Current state

**Task:** Rewrite the SpotAll game per the redesign spec.
**Phase:** spec approved → ready for implementation plan
**Progress:** brainstorming + spec complete · plan + code not started

## What we did

Reviewed PR #252's initial SpotAll implementation, identified 12 gaps (notably missing
R5b, no `GameShell` / `GameEngineProvider` wiring, no `ProgressHUD`, no skin, no
Storybook/VR/E2E, broken custom config, wrong distractor rendering, and a "Check"
button mechanic that mismatches the rest of the app). Brainstormed the redesign over
several rounds with the visual companion. Wrote and committed the spec at
`docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`. Filed 6
follow-up GitHub issues with linked dependencies.

## Decisions made

- **Scope = A (this PR rewrites SpotAll only).** Issue #257 (generalise `Slot` +
  extract `useGameRound`) is a separate refactor; per-game adoption (#260, #261,
  #262) is blocked on #257.
- **Reuse `AnswerGame.Question/Answer/Choices` (pure layout) + `ProgressHUD` (leaf).**
  Don't touch `Slot` / `AnswerGameProvider` in this PR — issue #257 generalises them
  later.
- **Mechanic: per-tap auto-validate, no Check button.** Matches NumberMatch /
  WordSpell / SortNumbers rhythm. Confetti + 750 ms advance.
- **Wrong-tap = `reject`** with red flash + shake + `playWrong()` + 600 ms tile
  cooldown. Bounce on `lock-*` modes is a separate AnswerGame issue (#258).
- **R5b dataset** = `2, 3, 5, 6, 7, 9, J, S, Z`, all `mirror-horizontal`. **No
  conflict** with `confusable-sets.json` — the user explicitly wanted both `6 ↔ 9`
  (rotation, in confusable-sets) AND `6 ↔ backwards-6` (mirror, in reversibles)
  because they're different mistakes children make.
- **Distractor render rule (bug fix in current PR):** confusable distractors render
  upright with **no CSS transform** (their character shape is the visual difference).
  Self-reversal distractors render the **target** character with a CSS transform.
  The current code applies transforms to confusable distractors too, which makes
  e.g. a `9` look like the target `6`.
- **Visual variation applies to ALL tiles** (correct + distractor) when enabled.
  Otherwise kids learn "varied = correct" instead of recognising shape.
- **Curated 6-font pool** (Andika, Edu NSW ACT Foundation, Nunito, Fraunces,
  Manrope, Monospace) — all already loaded by the app, no new web-font imports.
  Generic `cursive` / `serif` / `system-ui` strings (non-deterministic across
  systems) are removed.
- **WordSpell-style grouped picker** for the config form. 6 group rows (5
  relationship types + Reversible). Each chip = one pair (or 3-way set, e.g. `I, l, 1`).
  No easy/medium/hard preset row — simple form **is** the picker, default selection =
  Mirror Horizontal group.
- **New `src/lib/distractors/` library** (option α, not the inline option β).
  Game-agnostic with `DistractorSource` interface, `registry`, `compose`. Future
  sources slot in via #259 sub-issues without changing consumers.
- **Distractor compose accepts seeded RNG** (`composeDistractors(..., rng?)`) so
  SpotAll's existing `seed` prop deterministically drives tile order — same pattern
  as `src/games/build-round-order.ts`.

## Spec / Plan

- **Spec (this session):** [`docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`](../../docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md)
- **Origin brainstorm:** [`docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md`](../../docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md)
- **Original plan (superseded for the listed components):** [`docs/plans/2026-04-30-001-feat-confusable-spotall-plan.md`](../../docs/plans/2026-04-30-001-feat-confusable-spotall-plan.md)

## Key files (in current PR — disposition table is in spec section 10)

- `src/data/confusables/confusable-sets.json` — keep as-is
- `src/data/confusables/reversible-characters.json` — **NEW (R5b)**
- `src/data/confusables/query.ts` — extend with `getAllReversibles`,
  `getReversalTransform`, `isReversible`
- `src/lib/distractors/**` — **NEW** subtree (types, registry, compose, sources/)
- `src/games/spot-all/build-spot-all-round.ts` — rewrite (uses `compose`, fixes
  transform bug, applies variation to all tiles)
- `src/games/spot-all/spot-all-reducer.ts` — rewrite (TAP_TILE auto-validate,
  `wrongCooldownIds: Set<string>`, no SUBMIT)
- `src/games/spot-all/SpotAll/SpotAll.tsx` — rewrite (wraps in
  `GameEngineProvider` + `GameShell`, centred `ProgressHUD`, skin tokens,
  confetti + game-over overlay)
- `src/games/spot-all/SpotAllTile/SpotAllTile.tsx` — rewrite (uses
  `--skin-tile-*` tokens, `inCooldown` prop, 6 visual states)
- `src/games/spot-all/SpotAllGrid/SpotAllGrid.tsx` — responsive
  `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10`
- `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx` — rewrite (grouped
  picker, mirrors `WordSpellLibrarySource` pattern at `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`)
- `src/games/spot-all/visual-variation/{pools,pick-variation}.ts` — **NEW**
- `src/games/spot-all/confusable-pair-groups.ts` — **NEW** (groups
  `confusable-sets.json` by relationship type for the picker UI)
- `src/lib/skin/registry.ts` — register `spot-all` with `classicSkin`
- `src/lib/i18n/locales/{en,pt-BR}/games.json` — add `spot-all`,
  `spot-all-description`, `instructions.spot-all`, `spot-all-ui.*` keys
- `tests-vr/spot-all/spot-all.test.ts` — **NEW** (deterministic-seed VR)
- `tests-e2e/spot-all/spot-all.e2e.ts` — **NEW** (full flow E2E)

## Follow-up issues filed (with dependencies)

- [#257](https://github.com/leocaseiro/base-skill/issues/257) — Generalise `Slot`
  with `mode='tap-select'` + extract `useGameRound`. **Blocks #260 #261 #262.**
- [#258](https://github.com/leocaseiro/base-skill/issues/258) — AnswerGame: bounce
  animation for `lock-manual` / `lock-auto-eject`. Independent.
- [#259](https://github.com/leocaseiro/base-skill/issues/259) — Distractor library
  future sources meta-issue (random-other, phonemic, case). Independent.
- [#260](https://github.com/leocaseiro/base-skill/issues/260) — WordSpell adopt
  `useGameRound`. Blocked by #257.
- [#261](https://github.com/leocaseiro/base-skill/issues/261) — NumberMatch adopt
  `useGameRound`. Blocked by #257.
- [#262](https://github.com/leocaseiro/base-skill/issues/262) — SortNumbers adopt
  `useGameRound`. Blocked by #257.

## Open questions / blockers

- [ ] `GameEngineProvider` may demand richer state than SpotAll's opaque
      `{phase: 'playing'}` stub. Discovered during U6 implementation; the spec's
      risk table flags a fallback path (SpotAll persists sessions itself, as it does
      today).
- [ ] Some `(font, character)` combos in the variation pool may render
      ambiguously (e.g. lower-case `d` in Edu NSW cursive may shape-shift toward
      `b`). Validate during U6 by viewing the six-state Storybook of `SpotAllTile`.
      If a combo is genuinely confusing, drop the font from the default
      `enabledFontIds`.
- [ ] User wants to **review the spec** before plan execution starts. Don't run
      writing-plans until the user gives the green light in the new session.

## Next steps

1. [ ] **User review** of `docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`.
       Adjust spec if needed; re-commit + re-push if so.
2. [ ] Invoke `superpowers:writing-plans` to produce the implementation plan
       (U1, U2, …). The plan must respect:
   - `write-storybook` skill for any `*.stories.tsx`
   - `write-e2e-vr-tests` skill for `tests-vr/**` and `tests-e2e/**`
   - Markdown rules in CLAUDE.md (`yarn fix:md` after writing each `.md`)
   - TDD per CLAUDE.md (failing test first for any bugfix portion)
3. [ ] Execute the plan via `superpowers:executing-plans` (or
       `superpowers:subagent-driven-development` if dispatching parallel work).
4. [ ] After implementation lands, request `superpowers:requesting-code-review`
       before merging PR #252.

## Context to remember

- **Worktree workflow:** all work stays on this worktree (`worktrees/feat/confusable-spotall`).
  PR #252 is the single delivery vehicle. Per CLAUDE.md, never commit to `master`.
- **User commit/push preference:** commit freely; push freely for features (this is
  a feature). Always commit before asking for review — "easier to undo later". See
  memory: `feedback_confirm_before_push.md`.
- **HUD must be centred**, like NumberMatch / WordSpell / SortNumbers — not in the
  top-bar row. Exit X is portaled separately by `GameShell`.
- **Distractor library is the architectural seed** for cross-game distractor reuse.
  Don't be tempted to inline the sources back into `src/games/spot-all/` to save a
  few files — the user explicitly approved option α (full subsystem at
  `src/lib/distractors/`) over option β (inline) for exactly this future-proofing
  reason.
- **Issue #259 is a meta-issue.** When implementing future distractor sources, file
  individual sub-issues that reference it. Each new source should be one PR.
- **Visual companion** is at `.superpowers/brainstorm/24212-1777519610/content/`
  with mockups generated this session (architecture, mechanic, self-reversal,
  grouped config, advanced config, visual variation, UI states, config form). Open
  <http://localhost:53114> (server may have timed out — restart with
  `superpowers:brainstorming` server script if needed).
- **The `rng?` parameter** on `composeDistractors` is intentionally optional. Tests
  pass `mulberry32(seed)`; production omits it and uses `Math.random` internally.
  Same pattern as `src/games/build-round-order.ts`.
- **Empty-selection guard:** if the picker has no pairs and no reversibles,
  `<SpotAllConfigForm>` shows the invalid message. The route's `resolveSpotAllConfig`
  also has a defensive fallback to Mirror Horizontal default.
