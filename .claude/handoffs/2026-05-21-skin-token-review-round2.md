# Handoff: Skin Token Requirements — Ready for Review Round 2

**Date:** 2026-05-21
**Branch:** feat/multi-skin-config
**Worktree:** worktrees/feat-multi-skin-config
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
**Git status:** clean, 2 unpushed commits ahead of origin
**Last commit:** 2344e46 docs(requirements): apply review findings to skin
token architecture
**PR:** [#393](https://github.com/leocaseiro/base-skill/pull/393) — OPEN
**Issue:** [#359](https://github.com/leocaseiro/base-skill/issues/359) — OPEN

## Resume command

```text
/resync
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
```

Then run a fresh review round on the updated requirements doc:

```text
/ce-doc-review docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md
```

After round 2 synthesis + user walk-through:

```text
/ce-plan docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md
```

## Current state

**Task:** Unified skin token architecture for PR #393.
**Phase:** Review round 1 complete + synthesis applied → round 2 needed →
then planning.
**Progress:** 36 raw findings synthesized into 19 unique issues. 17 resolved
and applied to doc. 2 deferred to planning. Doc changed significantly enough
to warrant a fresh review round before planning.

## What we did

1. **Synthesized round 1 findings** from 6 reviewer agents (36 raw →
   19 unique issues after dedup, cross-persona agreement promotion, tier
   routing).

2. **Resolved the P0 architectural blocker:** CSS `@property` `initial-value`
   cannot contain `var()` references. Switched to Path 2 — `:root` defaults
   for color tokens (preserving Bootstrap `var()` cascade), `@property` only
   for animation timing tokens with literal values.

3. **Applied 17 fixes** to the requirements doc in one commit (95 insertions,
   28 deletions):
   - R1 rewritten for `:root` + `@property` hybrid model
   - R3 expanded to 7 states (added `idle` for bank tiles at rest)
   - R4 clarified as boolean presence modifiers with TS/ESLint enforcement
   - R5 clarified: motion shared, appearance stays separate per R6
   - R8 scoped: pure CSS animations need no JS; state changes → XState
   - R9 noted as net-new animation infrastructure (not a refactor)
   - R10 updated to 5 animations with state-to-animation mapping table
   - R12 acknowledged NumberMatch structural refactor scope
   - Added F5 (correct tile placement) and F6 (pickup/drag start)
   - Added AE5 (shared shake validation), fixed AE2 coverage
   - Success criteria expanded to all 7 token namespaces
   - Dragon Cave token counts corrected (21 overrides, 10 transparent)
   - XState timer/CSS token bridge → Key Decision

## Decisions made

- **Path 2 for inheritance:** `:root` defaults for colors (var() preserved),
  `@property` only for animation timing (literal initial-value). Allows skin
  authors to cross-reference tokens via `var()` freely.
- **All 7 namespaces stay in scope:** User clarified the vision is 100%
  tokenization. Every CSS property a skin might override should be a token.
  Success criteria now covers tile, slot, hud, chrome, question, scene, bank.
- **R8 animationend prohibition stays absolute:** All tile interactions route
  through XState (for SRS tracking too, not just animation). Pure CSS
  animations need no JS coordination.
- **XState timers stay hardcoded in JS:** CSS tokens control visual
  duration/easing only. Skins adjust animation feel within XState's timer
  window.
- **Boolean presence modifiers:** `[data-shaking]` not
  `[data-shaking="true"]`. TypeScript + ESLint enforce boolean-only values.
- **Semantic token naming direction:** User prefers role-based names over
  property-specific names (e.g., `--skin-tile-wrong-accent` not
  `--skin-tile-wrong-bg`). Stylelint alias enforcement is a follow-up.
- **Blink animation removed:** 5 animations (not 6). Pop reused for
  `data-speaking` (TBC).

## Spec / Plan

- `docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md`
  — the requirements doc (just updated)
- Raw findings:
  `.claude/review-findings/2026-05-20-skin-token-requirements-review-round1.json`

## Key files

- `docs/brainstorms/2026-05-16-unified-skin-token-architecture-requirements.md`
  — the doc to review (95 lines changed)

## Open questions / blockers

- [ ] @property syntax descriptors (`<time>`, `<number>`, `*`) — deferred to
      planning
- [ ] Eject-fly destination override mechanism for skin authors — deferred
      to planning (P3, low confidence)
- [ ] Semantic token naming convention (R2) — user wants role-based names,
      exact convention TBD during planning
- [ ] Stylelint alias enforcement — follow-up item, not blocking

## Next steps

1. [ ] Push current commits (`git push`)
2. [ ] New session: `/ce-doc-review` on the updated requirements doc (round 2)
3. [ ] Synthesize round 2 findings
4. [ ] Walk user through any new issues
5. [ ] Apply fixes + commit
6. [ ] `/ce-plan` on the finalized requirements doc
7. [ ] Execute Phase 1

## Context to remember

- **User has ADHD.** Expand all references inline (R5 = Requirement 5 —
  shared shake, etc.) on first use per response AND always inside
  AskUserQuestion text. The cramped question UI needs self-contained text.
- **Verbose one-by-one walk-through worked well.** Present each finding with
  full context, reviewer quotes, examples, pros/cons, then one
  AskUserQuestion. User preferred this over batch/section format.
- **Use converse for voice.** User sometimes wants voice interaction but may
  switch to text mid-flow.
- **Voice notifications are on** for this user session.
- **Commits = review checkpoints.** Commit often, push freely for features.
- **After any `.md` edit, run `yarn fix:md`.**
- **XState-first.** All animation sequencing via engine state machine. SRS
  tracking is an additional reason for XState on all paths including
  bank-reject.
- **100% tokenization vision.** Every CSS property a skin might override
  should be a token. No raw colors without variables.
