# Handoff: Consolidate Word and Emoji Data (#277)

**Date:** 2026-05-01
**Branch:** issue-277-consolidate-word-emoji
**Worktree:** worktrees/issue-277-consolidate-word-emoji
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji
**Git status:** clean
**Last commit:** 49c8277e docs: require full worktree paths in agent output (#277)
**PR:** #281 — open

## Resume command

```
/resync
cd worktrees/issue-277-consolidate-word-emoji
# Execute the implementation plan — choose subagent-driven or inline
# Plan: worktrees/issue-277-consolidate-word-emoji/docs/superpowers/plans/2026-05-01-consolidate-word-emoji.md
```

## Current state

**Task:** Embed optional `emoji` and `image` fields into curriculum JSON so picture mode uses library-sourced rounds instead of a hardcoded 8-word pool.
**Phase:** ready to execute
**Progress:** Requirements doc and implementation plan complete and reviewed. Ready for execution.

## What we did

Brainstormed and wrote a requirements document covering 9 requirements (R1-R9) for consolidating word and emoji data. Ran `ce-doc-review` on both the requirements doc and the implementation plan. Supersedes issue #266 with a comment linking it to #277. Implementation plan written with 9 TDD tasks, reviewed with 5 reviewer personas (5 findings resolved: 2 fixed, 2 skipped, 1 noted as known limitation). Also added "full worktree paths in output" rule to CLAUDE.md, AGENTS.md, and `.cursor/rules/git-workflow.mdc`.

## Decisions made

- **Embed in curriculum JSON, not a separate lookup** — single source of truth per word, no join at query time
- **Both emoji and image fields** — `WordSpellRound` already supports both; curriculum should mirror that capability
- **Auto-filter with `hasVisual: true`** — picture mode always filters to words with visuals, no teacher toggle
- **No IndexedDB migration needed** — all new fields are optional, existing drafts/configs remain valid
- **"mum" goes in level 2** — level 2 covers graphemes `m` and `u`; needs both `CurriculumEntry` in `aus/level2.json` and `WordCore` in `core/level2.json`
- **Zero-results fallback to recall mode** — if `hasVisual` filtering returns nothing, fall back to audio-only rather than blank screen
- **Defer totalRounds silent truncation** — SRS for rounds is coming soon, making this moot

## Spec / Plan

- worktrees/issue-277-consolidate-word-emoji/docs/brainstorms/2026-05-01-consolidate-word-emoji-requirements.md
- worktrees/issue-277-consolidate-word-emoji/docs/superpowers/plans/2026-05-01-consolidate-word-emoji.md

## Key files

- `src/data/words/types.ts` — `CurriculumEntry`, `WordHit`, `DraftEntry`, `WordFilter` types need emoji/image fields (R1-R3, R7)
- `src/data/words/filter.ts:173-189` — `joinHits` must propagate emoji/image from curriculum to `WordHit` (R2)
- `src/data/words/filter.ts` — `draftToHit` must propagate emoji/image from `DraftEntry` (R2)
- `src/data/words/adapters.ts` — `toWordSpellRound` must map emoji/image through (R4)
- `src/data/words/curriculum/aus/level1.json` — add emoji to ant, pin (R5)
- `src/data/words/curriculum/aus/level2.json` — add emoji to can, cat, dog, sad, sun; add mum entry (R5, R6)
- `src/data/words/core/level2.json` — add mum `WordCore` entry (R6)
- `src/routes/$locale/_app/game/$gameId.tsx:83-92` — `WORD_SPELL_ROUND_POOL` to be removed (R9)
- `src/routes/$locale/_app/game/$gameId.tsx:286-298` — picture mode invariant must be inverted to use `source` with `hasVisual: true` (R8)
- `src/games/word-spell/useLibraryRounds.ts` — already maps via `toWordSpellRound`, will pick up emoji/image automatically

## Open questions / blockers

- [x] "mum" IPA/graphemes: `/mʌm/` with graphemes `m/m`, `u/ʌ`, `m/m` (resolved — follows pattern of "mug")
- [x] Default picture-mode filter scope: Pull from all levels with visuals, `region: 'aus'` + `hasVisual: true` (resolved)

## Next steps

1. [ ] Review and merge PR #281 (requirements doc + plan)
2. [ ] Execute the plan using TDD — choose subagent-driven or inline execution

## Context to remember

- `joinHits` joins curriculum entries against core entries by word — if a `WordCore` entry is missing, the curriculum entry is silently discarded. "mum" must be added to both `aus/level2.json` AND `core/level2.json`.
- The mode invariant in `resolveWordSpellConfig` currently _deletes_ `source` for picture mode — it must be _inverted_ so picture mode becomes source-defined with `hasVisual: true`.
- `WordSpell.tsx` already renders emoji/image from rounds correctly — no changes needed there.
- Issue #266 was superseded by #277 — a comment was added to #266 linking to this work.
- Doc review findings from the plan: sentence-gap hasVisual injection (skipped), totalRounds cap removal (skipped — deferred to SRS), fallback test fix (applied — use level 8), filterSignature mismatch on fallback (applied — `activeFilter` tracking), region hardcoded to aus (noted as known limitation).
