---
date: 2026-04-30
topic: confusable-characters-spotall
---

# Confusable Characters Data Layer + SpotAll Game

## Problem Frame

Young children frequently confuse visually similar characters — writing `b`
as `d`, mixing up `3` and `E`, or reversing `p`/`q`. Existing games in
BaseSkill don't target this specific skill. We need a dedicated data model
for confusable characters and a new game (SpotAll) that exercises visual
discrimination.

---

## Requirements

**Confusable characters data layer**

- R1. A confusable-sets data structure stores groups of characters or sequences that children commonly confuse (e.g. `{b, d, p, q}`, `{I, l, 1}`, `{6, 9}`, `{3, E}`, `{15, 51}`, `{oa, ao}`).
- R2. Each set contains pairwise relationship metadata tagging how each pair within the group is confusable: `mirror-horizontal`, `mirror-vertical`, `rotation-180`, `visual-similarity`, or `transposition` (inverted order, e.g. `15` vs `51`, `oa` vs `ao`).
- R3. A set may contain any number of members (not limited to pairs). Members can be single characters or multi-character sequences (digraphs, number pairs).
- R4. Games can query the data by character ("give me confusables for 'b'") and optionally filter by relationship type ("only mirrors").
- R5. The data layer ships with a curated initial dataset covering common letter and number confusions relevant to early learners.
- R5b. A separate "reversible characters" list identifies characters commonly written backwards by children (e.g. `6`, `2`, `3`, `5`, `7`, `J`, `S`, `Z`). Each entry specifies the transform that produces the incorrect form (e.g. `mirror-horizontal`). This is distinct from confusable sets — it represents the same character rendered incorrectly, not confusion between two different characters.

**SpotAll game — v1 ("select all correct")**

- R6. The game presents a prompt (e.g. "Select all the **d** tiles") and a grid of character tiles.
- R7. The grid contains multiple correct tiles (showing the prompted character) and distractor tiles drawn from two sources: confusable characters (different characters that look similar) and/or reversed versions of the target character itself (same character, CSS-flipped).
- R8. Correct tiles are displayed in varied visual styles (different fonts, sizes, colors) to force shape recognition rather than pixel-matching.
- R9. The child taps/selects all tiles they believe are correct. The game validates when the child submits or after all correct tiles are found.
- R10. Distractor tiles are rendered using CSS transforms (mirror, rotate) or show visually similar characters, depending on the relationship type in the confusable set.

**Presets and configuration**

- R11. The system provides preset game configurations for SpotAll (e.g. "Mirror Letters Easy", "All Confusables Hard") that bundle: which confusable sets to use, how many correct/distractor tiles, which relationship types to include.
- R12. Presets are reusable — designed so future games can reference the same confusable-set data and preset structure when adding distractor support.

---

## Success Criteria

- A child using SpotAll consistently demonstrates improved ability to distinguish confusable characters (measured by game accuracy over time).
- The confusable-sets data is decoupled from SpotAll and queryable by any game, making future integration into WordSpell/NumberMatch straightforward.

---

## Scope Boundaries

- Existing game integration (WordSpell, NumberMatch distractor injection) is deferred — the data layer supports it but we don't wire it up in v1.
- The "find the imposter" mode is already covered by NumberMatch's existing mechanic.
- The "sort into buckets" mode is out of scope — it overlaps with issue #228 (connect/categorize game).
- Automatic difficulty progression (auto-escalating relationship types by level) is deferred to a later pass.
- SVG/image-based rendering of mirrored characters is deferred — v1 uses CSS transforms on text.

---

## Key Decisions

- **Data model:** Approach A (confusable sets with pairwise relationship metadata) chosen over tagged-groups-only or character-centric metadata, because it preserves family groupings while expressing mixed relationship types without redundancy.
- **Self-reversal as separate data:** Characters commonly written backwards (6, 2, 3, etc.) are stored in a separate "reversible characters" list rather than forced into the confusable-sets model. Rationale: a pair of ["6", "6"] in confusable sets would make the query API confusing; separating the concepts keeps each data source clean and independently queryable.
- **Game name:** SpotAll — avoids confusion with NumberMatch, communicates the "find all correct" mechanic.
- **v1 game mode:** "Select all correct" only. Other modes (imposter, sort) are either covered elsewhere or deferred.
- **Visual variation purpose:** Preventing pattern-matching. Correct tiles intentionally vary in surface appearance so the child must recognize the underlying shape.

---

## Dependencies / Assumptions

- CSS transforms (`scaleX(-1)`, `rotate(180deg)`, etc.) render readable mirrored/rotated characters in the fonts used by the app.
- The curated confusable-sets dataset is manageable in size (estimated 10-20 families) and can be authored as static JSON.

---

## Outstanding Questions

### Deferred to Planning

- _(Affects R5, needs research)_ What is the full initial dataset of confusable character families for early learners? Literature review may help prioritize.
- _(Affects R8, technical)_ Which fonts render mirrored characters readably via CSS transform? Some fonts may produce ambiguous or ugly results when flipped.
- _(Affects R10, technical)_ Should rotation/mirror transforms be applied at the character level (CSS on a `<span>`) or at the tile level (entire tile flipped)?
- _(Affects R11, technical)_ How do presets integrate with the existing game config/registration system?
- _(Affects R9, needs research)_ What feedback model works best pedagogically — validate on submit, validate on each tap, or validate after all correct found?

---

## Next Steps

-> `ce-plan` for structured implementation planning
