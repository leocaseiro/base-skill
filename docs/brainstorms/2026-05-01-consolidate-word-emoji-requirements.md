---
date: 2026-05-01
topic: consolidate-word-emoji
---

# Consolidate Word and Emoji Data

## Summary

Embed optional `emoji` and `image` fields directly into curriculum JSON entries so
that any word in the library can carry a visual. Picture mode switches from a
hardcoded 8-word pool to library-sourced rounds filtered by visual availability.

---

## Problem Frame

WordSpell's picture mode shows an emoji or image alongside each word, but the
visual data lives in a hardcoded array (`WORD_SPELL_ROUND_POOL`) of 8 words in
the route loader — completely disconnected from the curriculum word library. This
means picture mode is locked to those 8 words regardless of what the teacher
configures, and adding new picture-mode words requires a code change rather than
a data edit.

The word library already powers recall mode with rich filtering (region, level,
graphemes, phonemes), but none of that infrastructure is available to picture
mode because the visual data isn't part of the word data.

---

## Requirements

**Data structure**

- R1. `CurriculumEntry` gains optional `emoji?: string` and `image?: string`
  fields. Both are optional — most words will have neither.
- R2. `WordHit` gains matching optional `emoji?` and `image?` fields, populated
  from the curriculum entry during filtering.
- R3. `DraftEntry` gains optional `emoji?` and `image?` fields for authoring
  parity.
- R4. The `toWordSpellRound` adapter maps `emoji` and `image` from `WordHit`
  through to `WordSpellRound`.

**Curriculum data**

- R5. The 7 existing hardcoded emoji words (ant, can, cat, dog, pin, sad, sun)
  gain an `emoji` field in their respective `aus/level1.json` or
  `aus/level2.json` curriculum entries.
- R6. "mum" is added as a new `CurriculumEntry` in `aus/level2.json` (level 2
  covers graphemes `m` and `u`) with its emoji `🤱`.

**Filtering**

- R7. `WordFilter` gains a `hasVisual?: boolean` option. When `true`,
  `filterWords` returns only words where `emoji` or `image` is set.

**Picture mode behavior**

- R8. When WordSpell is in picture mode, the config resolver uses
  library-sourced rounds with `hasVisual: true` in the filter, instead of
  falling back to the hardcoded pool.
- R9. The hardcoded `WORD_SPELL_ROUND_POOL` and `sliceWordSpellRounds` are
  removed.

---

## Acceptance Examples

- AE1. **Covers R4, R5, R8.** Given a WordSpell game in picture mode with
  default config, when the game loads, it pulls rounds from `aus/level2.json`
  (and `level1.json`) curriculum entries that have an `emoji` field set, and the
  emoji is rendered via `EmojiQuestion`.
- AE2. **Covers R7.** Given a `WordFilter` with `hasVisual: true` and
  `region: 'aus'`, when `filterWords` runs, only entries with a non-empty
  `emoji` or `image` field are returned.
- AE3. **Covers R1, R2.** Given a curriculum entry without `emoji` or `image`,
  when it appears in a `WordHit`, `emoji` and `image` are `undefined` and the
  word works normally in recall mode.

---

## Success Criteria

- Picture mode loads rounds from the word library instead of a hardcoded array.
- Adding a new picture-mode word requires only a data edit (adding `emoji` or
  `image` to a curriculum JSON entry), not a code change.
- Existing recall mode and sentence-gap mode are unaffected.

---

## Scope Boundaries

- Tagging additional words beyond the existing 8 with emojis
- Emoji/image editing UI in the AuthoringPanel
- Emoji display in WordLibraryExplorer cards
- Image upload or asset management
- Multi-region emoji support (only `aus` curriculum entries are tagged in this
  pass)

---

## Key Decisions

- **Embed in curriculum JSON, not a separate lookup:** single source of truth per
  word, no join at query time. Trades separation of concerns for simplicity.
- **Both emoji and image fields:** `WordSpellRound` already supports both; the
  curriculum entry should mirror that capability even though only emoji is used
  today.
- **Auto-filter, not configurable:** picture mode always filters to words with
  visuals. No teacher toggle for text-only fallback in picture mode.
- **No IndexedDB migration:** all new fields are optional. Existing drafts and
  saved configs remain valid without a schema version bump.

---

## Outstanding Questions

### Deferred to Planning

- Affects R6 · Needs research — What are the correct IPA transcription and
  grapheme mappings for "mum" in `aus` region?
- Affects R8 · Technical — Should the default picture-mode `WordFilter` constrain
  to specific levels/graphemes, or pull from all levels that have visuals?
