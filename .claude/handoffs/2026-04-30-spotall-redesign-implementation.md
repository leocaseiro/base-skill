# Handoff: SpotAll redesign — plan landed, execute next

**Date:** 2026-04-30
**Branch:** `feat/confusable-spotall`
**Worktree:** `worktrees/feat/confusable-spotall`
**Worktree path:** `/Users/leocaseiro/Sites/base-skill/worktrees/feat/confusable-spotall`
**Git status:** clean · 0 unpushed
**Last commit:** `8f1ff838` docs(spot-all): implementation plan for confusable-spotall redesign
**PR:** [#252](https://github.com/leocaseiro/base-skill/pull/252) — open

## Resume command

```bash
/resync
cd worktrees/feat/confusable-spotall
# Execute plan with parallel subagent dispatch (user-confirmed approach):
#   superpowers:subagent-driven-development
# Plan to execute:
#   docs/superpowers/plans/2026-04-30-confusable-spotall-redesign.md
```

## Current state

**Task:** Implement the confusable-spotall redesign per the approved plan.
**Phase:** plan committed → ready for implementation
**Progress:** spec ✓ · plan ✓ · code: not started

## What we did this session

Reviewed the approved spec, made two amendments (CSS-token `COLOR_POOL` →
`var(--skin-variation-N)` and Section 11 marked as "follow-ups already filed"
with #257–#262 links), then wrote the full implementation plan with TDD
discipline and bite-sized steps. Plan totals 13 units (9 sequential + 3
parallel tail + final close-out) over ~3000 lines, committed as
`8f1ff838` and pushed.

## Decisions made

- **Plan slicing:** vertical units sequenced bottom-up (data → distractor lib
  → skin tokens + variation → picker groups → reducer/buildRound → leaf UI →
  SpotAll integration → config form → wiring/i18n) with a parallelizable
  tail of three independent units (Storybook · VR · E2E). Confirmed as
  user-preferred over horizontal slicing.
- **Subagent-driven execution:** user confirmed parallel subagents work for
  this codebase, so plan was authored to be executor-friendly with self-
  contained tasks and exact code samples.
- **CSS variation tokens are skin-scoped, not SpotAll-scoped:** named
  `--skin-variation-1..6` so SortNumbers / WordSpell can reuse them without a
  rename later. Defined on `classicSkin` in `src/lib/skin/classic-skin.ts`.
- **Spec Delta — VR/E2E paths follow the project skill, not the spec:** spec
  said `tests-vr/spot-all/...` and `tests-e2e/spot-all/...`; project skill
  `write-e2e-vr-tests` mandates `e2e/visual.spec.ts` (append) and
  `e2e/spot-all.spec.ts` (new). Plan follows the skill — flagged in PR
  description template.
- **`SKIP_TYPECHECK=1` is intentional** on U5/U6/U7/U8 intermediate commits:
  reducer + types land before the route catches up in U9. The plan documents
  this in each affected commit message so reviewers (and the executor) don't
  treat it as a regression.

## Spec / Plan

- **Spec:** [`docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md`](../../docs/superpowers/specs/2026-04-30-confusable-spotall-redesign-design.md)
- **Plan:** [`docs/superpowers/plans/2026-04-30-confusable-spotall-redesign.md`](../../docs/superpowers/plans/2026-04-30-confusable-spotall-redesign.md)
- **Origin brainstorm:** [`docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md`](../../docs/brainstorms/2026-04-30-confusable-characters-spotall-requirements.md)

## Key files (executor will touch these)

The plan's File Structure section is canonical. Highlights:

- `src/data/confusables/reversible-characters.json` — NEW (R5b dataset)
- `src/lib/distractors/**` — NEW subtree (game-agnostic library)
- `src/lib/skin/classic-skin.ts` — extend with 6 `--skin-variation-N` tokens
- `src/games/spot-all/types.ts` — full schema rewrite
- `src/games/spot-all/spot-all-reducer.ts` — TAP_TILE auto-validate +
  `wrongCooldownIds: Set<string>` + `retryCount`
- `src/games/spot-all/build-spot-all-round.ts` — uses `composeDistractors`,
  fixes the transform-on-confusable bug, applies variation universally
- `src/games/spot-all/SpotAll/SpotAll.tsx` — wraps in `GameShell` + skin +
  `ProgressHUD`, per-tap auto-validate (no Check button)
- `src/games/spot-all/SpotAllConfigForm/SpotAllConfigForm.tsx` — grouped
  picker (mirrors WordSpell pattern)
- `e2e/visual.spec.ts` — APPEND `@visual` SpotAll test
- `e2e/spot-all.spec.ts` — NEW functional flow

## Open questions / blockers

- [ ] **`GameEngineProvider` state contract** — the spec passes
      `initialState = { phase: 'playing' }` as an opaque stub. If the
      provider rejects it during U7 implementation, fall back to SpotAll
      persisting sessions itself (as it does today). Risk noted in spec
      §Risks. Don't burn time fighting it — record the constraint and
      degrade gracefully.
- [ ] **Font + character ambiguity** — some `(font, character)` combos may
      render confusingly (e.g., `d` in Edu NSW cursive shape-shifts toward
      `b`). Storybook six-state pass during UT-A is the validation step. If
      a combo is unreadable, drop the font from `DEFAULT_ENABLED_FONT_IDS`.
      Worst-case: shrink the pool to the four sans-serif faces.
- [ ] **Test harness imports** — plan references `@/test/MemoryRouter` and
      `@/test/i18n`. Grep first; if neither exists, mirror an existing
      route-test or component-test pattern (e.g.,
      `src/routes/$locale/_app/game/$gameId.test.tsx`,
      `src/components/AdvancedConfigModal.test.tsx`). Don't create new
      test infrastructure unless absolutely necessary.

## Next steps

1. [ ] **Execute the plan.** Use `superpowers:subagent-driven-development`
       (one subagent per task, review between tasks). Sequential chain:
       U1 → U2 → U3 → U4 → U5 → U6 → U7 → U8 → U9. Then dispatch UT-A,
       UT-B, UT-C in parallel, then U-Final.
2. [ ] **Manual smoke test after U9.** Plan flags this — start `yarn dev`,
       go to `/en/game/spot-all`, walk the full flow before the parallel
       tail. If broken, debug before kicking off stories/VR/E2E.
3. [ ] **VR baseline generation** (UT-B) requires Docker. Confirm Docker is
       running before that subagent kicks off, or split UT-B from the
       parallel batch and run it on the local host with Docker available.
4. [ ] **PR description** at U-Final references issues #257–#262 — they're
       already filed, plan just needs to link them. No need to refile.
5. [ ] **Code review** via `superpowers:requesting-code-review` once CI is
       green on PR #252.

## Context to remember

- **Worktree workflow** — all work stays on this worktree. PR #252 is the
  delivery vehicle. Per CLAUDE.md, never commit to `master`.
- **User commit/push preference** — commit freely; push freely for features
  (this is a feature). User memory: `feedback_confirm_before_push.md`.
- **Skip flags on intermediate commits are OK** if reasoned in the commit
  message. User memory: `feedback_skip_hooks_minor.md`. The plan uses
  `SKIP_TYPECHECK=1` on U5/U6/U7/U8 deliberately.
- **Don't run `yarn fix:md` repo-wide while the prior handoff exists.**
  Prettier reflows
  `.claude/handoffs/2026-04-30-spotall-redesign-spec.md` and breaks
  list-continuation indentation. Always scope formatting to your own
  edited files: `npx prettier --write <file>`. Confirmed bug encountered
  this session.
- **The `rng?` parameter on `composeDistractors` is intentionally optional.**
  Tests pass `mulberry32(seed)`; production omits it and uses `Math.random`
  internally. Same pattern as `src/games/build-round-order.ts`. Spec §3
  documents it.
- **Six follow-up issues are already filed** (#257 #258 #259 #260 #261
  #262); spec §11 lists them with links and dependencies. Do NOT refile.
- **HUD must be centred**, not top-bar — matches NumberMatch / WordSpell /
  SortNumbers. Exit X comes from `GameShell`'s portal.
- **Storybook titles use PascalCase** segments: `Games/SpotAll/SpotAllTile`,
  not `games/spot-all/SpotAllTile`. CLAUDE.md rule. User memory:
  `feedback_storybook_title_pascalcase.md`.
- **`write-storybook` and `write-e2e-vr-tests` skills are authoritative**
  when their globs match. Plan flags this in U6/U7 (storybook) and UT-A/B/C
  (E2E + VR).
