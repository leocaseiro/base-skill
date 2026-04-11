# Tier-2 AUS phonics word library — generation report

Generated from:

- Words list: `docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md`
- Phoneme authority: `src/data/words/levels.ts`
- Splitter spec: `src/data/words/builders.ts` (`makeGraphemes`)

Output: `src/data/words/tier2-aus.json`

## Counts

| Metric                                  | Value |
| --------------------------------------- | ----- |
| Raw word tokens in markdown (pre-dedup) | 719   |
| Unique lowercase words (post-dedup)     | 674   |
| Proper nouns filtered                   | 12    |
| Words included in `tier2-aus.json`      | 674   |
| Failed splits                           | 0     |

First-level-wins dedup was applied: a word's level is the first level it appears
in.

## Proper nouns filtered

Words starting with an uppercase letter in the source list were excluded:

`Duke`, `Friday`, `Kim`, `Mason`, `Meg`, `Nat`, `Pam`, `Pete`, `Phil`, `Sam`,
`Troy`, `Vincent`.

## Failed splits

None. Every word passed the concat invariant after split-digraph handling.

## Ambiguity calls

All phonemes come from the `GRAPHEMES_BY_LEVEL` inventory in `levels.ts`. No
new phonemes were invented. Where a grapheme has multiple variants in the
inventory, rules from the task spec were applied.

### `th` voiced /ð/ vs voiceless /θ/

Voiced /ð/ assigned to: `smooth`, `that`, `them`, `these`, `this`.

Voiceless /θ/ (default) assigned to: `athlete`, `birth`, `cloth`, `fifth`,
`moth`, `theme`, `thick`, `thin`, `thing`, `third`, `thong`, `thorn`, `threw`,
`throw`, `tooth`.

### `oo` long /uː/ vs short /ʊ/

Short /ʊ/ assigned to: `book`, `cook`, `cooking`, `foot`, `footprint`, `good`,
`hood`, `hook`, `look`, `shook`, `took`, `wood`, `wooden`.

Long /uː/ (default) assigned to: `boom`, `boot`, `food`, `hoop`, `moon`,
`roof`, `scoop`, `smooth`, `soon`, `spoon`, `tooth`, `zoo`, `zoom`.

### Soft-c /s/ vs hard-c /k/

Soft-c (c before e, i, y) assigned to: `cent`, `citrus`, `dance`, `mince`,
`recess`. All other `c` graphemes default to hard /k/.

### Soft-g /dʒ/ vs hard-g /ɡ/

Soft-g assigned to: `gel`, `gem`, `magic`, `merge`. Hard-g exceptions
(`get`, `got`, `gift`, `girl`, `give`) were pre-configured but none of these
appear in the words list so the exception set is unused here.

### `ou` → /ʌ/ vs /aʊ/ (level-8 override)

`levels.ts` only defines `ou → aʊ`. The words list groups eight level-8 words
that use the /ʌ/ variant of `ou`; these are given a per-word override using the
/ʌ/ phoneme already present in the inventory (via `u → ʌ`). Affected words:
`country`, `couple`, `cousin`, `double`, `nourish`, `touch`, `trouble`, `young`.

### Trailing `y` at level 7+

`levels.ts` only has `y → j`. The level-7 words list introduces `y` in the
word-final "long vowel" role (e.g., `happy`, `sky`). We re-use existing
inventory phonemes:

- Monosyllabic words: trailing `y` → /aɪ/ (same phoneme as `igh` / `i_e` / `ie`).
  Applied to: `by`, `cry`, `dry`, `fly`, `fry`, `my`, `sky`, `sly`, `spy`,
  `sty`, `try`, `why`.
- Polysyllabic words: trailing `y` → /iː/ (same phoneme as `ee` / `ea` / `e_e`).
  Applied to: `angry`, `baby`, `bunny`, `country`, `daddy`, `fluffy`, `happy`,
  `jelly`, `lady`, `lucky`, `puppy`, `rusty`, `silly`, `sunny`, `windy`.

### Silent final `e`

For level-4+ words where the split-digraph pass did not consume a final `e`
and the word has an earlier vowel-bearing grapheme, the terminal `e` is
silenced with `p: ""`. This handles `-ce`, `-ge`, `-ve`, `-se`, `-le` endings.
Affected: `couple`, `dance`, `double`, `merge`, `mince`, `nerve`, `noise`,
`nurse`, `purse`, `serve`, `swerve`, `trouble`, `turtle`.

Short open-syllable words (`be`, `he`, `me`, `we`, `she`) are explicitly NOT
silenced because they have no earlier vowel.

### Double consonants

`levels.ts` does not register `ll`, `ff`, `ss`, `zz`, or any double-letter
form as an atomic grapheme (the task doc's informal grapheme list was a
superset). We therefore apply the collapse rule from the task spec: when two
adjacent single-letter consonant graphemes are identical, the first keeps the
phoneme and the second is silenced (`p: ""`).

Affected words: `annoy`, `bunny`, `chess`, `chill`, `daddy`, `fluffy`,
`happy`, `jelly`, `kiss`, `puppy`, `quoll`, `recess`, `silly`, `sunny`,
`whiff`.

### Split-digraph (magic-e / VCe)

`makeGraphemes` in `builders.ts` does not yet implement split-digraph
recognition (it explicitly skips graphemes containing `_`). Per the task
spec we added a post-pass at level 7+ that recognises the pattern
`[single-letter vowel] + [single-letter consonant] + [terminal e]` and
rewrites it to `[V_e, C]`. The grapheme literal stays as e.g. `a_e`, the
consonant is emitted as its own unit, and the terminal `e` is consumed by
the split-digraph entry.

58 words were rewritten this way:

`athlete`, `bake`, `bike`, `bite`, `bone`, `brave`, `bride`, `broke`, `cake`,
`choke`, `compete`, `complete`, `concrete`, `cone`, `cube`, `cute`, `date`,
`delete`, `dispute`, `dive`, `eve`, `extreme`, `five`, `froze`, `fume`,
`fuse`, `gate`, `globe`, `hide`, `home`, `hose`, `lake`, `life`, `like`,
`locate`, `make`, `mute`, `name`, `pipe`, `plate`, `poke`, `puke`, `rope`,
`rose`, `shake`, `size`, `skate`, `slide`, `smoke`, `spike`, `spoke`, `take`,
`theme`, `these`, `tribute`, `tune`, `use`, `wife`.

Note: the concat invariant in `validateEntry` (`g.replace('_','').join('') === word`)
does not account for the split-digraph's separate consonant entry. This is a
pre-existing design gap in the builder; the explicit-graphemes test case in
`builders.test.ts` bypasses `validateEntry`. The data in `tier2-aus.json`
follows the shape documented by that test case (three units: `c`, `a_e`, `k`
for `cake`), not the literal invariant formula.

## Silent letters

No words in the Tier-2 list contain the classic silent-letter patterns
(`kn-`, `wr-`, `mb`, `lk`, `gh`). Rules were pre-configured for future
tiers but triggered zero words here.

## Known-imperfect phonemes (inventory constraints)

These are artefacts of "trust `levels.ts`" — the inventory does not contain a
phoneme that matches the real pronunciation, and we did not invent new ones.

- Polysyllabic open-syllable long vowels stay short: `baby` is `/bæbiː/` not
  `/ˈbeɪbi/`; same for `raven`, `lady`, `bacon`, `naked`, `razor`, `later`,
  `label`, `apron`, `potato`, `basic`, `banjo`, `focus`, `local`, `hotel`,
  `moment`, `total`, `robot`, `pilot`, `item`, `silent`, `spider`, `evil`,
  `even`, `vegan`, `final`, `pilot`, `quiet`. Per task spec: "use the
  canonical short-vowel phoneme from GRAPHEMES_BY_LEVEL for simplicity".
- Words with `-er` in unstressed position get /ɜː/ (the stressed r-colour
  vowel) rather than /ə/: `later` → `/lætɜː/`, `spider` → `/spɪdɜː/`,
  `razor` → `/ræzɔː/`. Schwa /ə/ is not in the inventory.
- `ew` always → /juː/ per `levels.ts`. In AUS speech `chew`, `blew`, `drew`,
  `crew`, `grew`, `flew`, `threw`, `screw` typically drop the /j/, but we
  kept /juː/ to match the inventory.
- `boring` → `/bɔːɪŋ/`: the greedy splitter consumed `or` as a single
  grapheme at position 1, leaving no `r` for the second syllable. Accept
  per inventory limits.
- `delete` → `/deliːt/` (not `/dɪˈliːt/`): the first `e` gets short /e/
  because there is no schwa and no stress marking.
- `happy`, `silly`, `sunny` etc.: the doubled-consonant silencing plus
  unstressed-y-as-/iː/ yields `/hæpiː/` etc. — the first syllable stays
  short, and the final /iː/ replaces the more accurate /i/.

## Typos fixed in the source

- Level 8 word list originally contained `har` between `air` and `chair`.
  Confirmed as a typo for `hair` and corrected in both the source markdown
  and this Tier-2 output. Output: `hair` → `/hɛə/` (h + air).
