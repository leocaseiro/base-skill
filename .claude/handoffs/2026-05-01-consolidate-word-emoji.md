# Handoff: Consolidate Word and Emoji Data (#277)

**Date:** 2026-05-01
**Branch:** issue-277-consolidate-word-emoji
**Worktree:** worktrees/issue-277-consolidate-word-emoji
**Worktree path:** /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji
**Git status:** clean
**Last commit:** f02b8f9d docs(brainstorm): apply review findings to consolidate-word-emoji spec (#277)
**PR:** #281 — open

## Resume command

```
/resync
cd worktrees/issue-277-consolidate-word-emoji
# Execute implementation plan based on the requirements doc
```

## Current state

**Task:** Embed optional `emoji` and `image` fields into curriculum JSON so picture mode uses library-sourced rounds instead of a hardcoded 8-word pool.
**Phase:** planning
**Progress:** Requirements doc complete and reviewed. Next step is `ce-plan` to produce an implementation plan.

## What we did

Brainstormed and wrote a requirements document covering 9 requirements (R1-R9) for consolidating word and emoji data. Ran `ce-doc-review` with 5 reviewer personas, applied 6 findings, and deferred 1 (totalRounds silent truncation — SRS will address this later). Supersedes issue #266 with a comment linking it to #277.

## Decisions made

- **Embed in curriculum JSON, not a separate lookup** — single source of truth per word, no join at query time
- **Both emoji and image fields** — `WordSpellRound` already supports both; curriculum should mirror that capability
- **Auto-filter with `hasVisual: true`** — picture mode always filters to words with visuals, no teacher toggle
- **No IndexedDB migration needed** — all new fields are optional, existing drafts/configs remain valid
- **"mum" goes in level 2** — level 2 covers graphemes `m` and `u`; needs both `CurriculumEntry` in `aus/level2.json` and `WordCore` in `core/level2.json`
- **Zero-results fallback to recall mode** — if `hasVisual` filtering returns nothing, fall back to audio-only rather than blank screen
- **Defer totalRounds silent truncation** — SRS for rounds is coming soon, making this moot

## Spec / Plan

- docs/brainstorms/2026-05-01-consolidate-word-emoji-requirements.md

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

- [ ] What are the correct IPA transcription and grapheme mappings for "mum" in `aus` region? (affects R6, needs research during planning)
- [ ] Should the default picture-mode `WordFilter` constrain to specific levels/graphemes, or pull from all levels that have visuals? (affects R8)

## Next steps

1. [ ] Review and merge PR #281 (requirements doc)
2. [ ] Run `ce-plan` to produce an implementation plan from the requirements
3. [ ] Execute the plan using TDD (tests first for each requirement)

## Context to remember

- `joinHits` joins curriculum entries against core entries by word — if a `WordCore` entry is missing, the curriculum entry is silently discarded. "mum" must be added to both `aus/level2.json` AND `core/level2.json`.
- The mode invariant in `resolveWordSpellConfig` currently _deletes_ `source` for picture mode — it must be _inverted_ so picture mode becomes source-defined with `hasVisual: true`.
- `WordSpell.tsx` already renders emoji/image from rounds correctly — no changes needed there.
- Issue #266 was superseded by #277 — a comment was added to #266 linking to this work.
