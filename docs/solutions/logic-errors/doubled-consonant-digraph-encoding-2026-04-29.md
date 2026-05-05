---
title: 'Doubled-consonant words encoded as letter + silent letter instead of digraphs'
date: '2026-04-29'
category: logic-errors
module: word-spell
problem_type: logic_error
component: frontend_stimulus
severity: medium
symptoms:
  - 'Doubled-consonant words (kiss, fluffy, happy) encoded as single consonant + silent letter instead of digraph'
  - "GRAPHEMES_BY_LEVEL contained placeholder 'silent doubled X' entries with empty phonemes"
  - "WordSpellSimpleConfigForm test regex matched both 'd' and 'dd' buttons due to unanchored pattern"
root_cause: logic_error
resolution_type: seed_data_update
tags:
  - digraph
  - grapheme
  - phoneme
  - curriculum
  - doubled-consonant
  - data-encoding
  - word-spell
  - levels
---

## Problem

Fifteen words containing doubled consonants across four curriculum levels were
incorrectly encoded in the curriculum JSON files as a single consonant followed
by a silent letter, rather than as a proper digraph. This meant the phonics data
was semantically wrong — doubled consonants are digraphs that produce a single
sound, not a letter plus a silent placeholder.

## Symptoms

- PR #219's audit invariant (`levels-vs-data-invariant.test.ts`) flagged
  mismatches between `GRAPHEMES_BY_LEVEL` in `levels.ts` and the actual
  grapheme-phoneme pairs in the curriculum JSON.
- Words like `kiss` were stored as four separate entries `[k, i, s, s(silent)]`
  instead of three entries `[k, i, ss]`, inflating the grapheme count and
  misrepresenting the phonics structure.
- `GRAPHEMES_BY_LEVEL` contained 6 entries with `name: 'silent doubled X'` (for
  s, f, l, n, d, p) — a category that does not exist in English phonics. These
  entries had `p: ''` (empty phoneme), implying the second consonant is silent.
- The WordSpell game renders one button per grapheme-phoneme pair, so it would
  have displayed an extra silent-letter button for every doubled-consonant word.

## What Didn't Work

**PR #219's tactical workaround:** Rather than fixing the data encoding, PR #219
added placeholder entries like `{ g: 's', p: '', name: 'silent doubled s' }` to
`GRAPHEMES_BY_LEVEL` so the audit invariant would pass. This failed because:

- It enshrined an incorrect phonics model. Doubled consonants are not silent
  letters; they are digraphs (two letters representing one sound).
- It only satisfied the invariant mechanically (the test passed) without fixing
  the underlying data — the game would still render words incorrectly with an
  extra empty-phoneme button.
- It violated the project's own invariant that `GRAPHEMES_BY_LEVEL` must
  accurately reflect curriculum content — both sides of the contract were wrong.

(session history) The issue was first detected during issue #216 work
(reconciling `GRAPHEMES_BY_LEVEL` with curriculum JSON). That session produced
the invariant test and explicitly flagged doubled-consonant re-encoding as a
known follow-up item, but deferred it.

(session history) The dedicated #232 session started by cross-referencing
curriculum against the reference word list at
`docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md`. A Python
audit script was run across all 8 level JSONs to separate 15 genuine encoding
errors (doubled consonants) from 13 correct magic-e entries.

## Solution

The fix involved three coordinated changes across PR #245:

### A. Replace placeholder entries in GRAPHEMES_BY_LEVEL

Six "silent doubled" entries in `src/data/words/levels.ts` were replaced with
proper digraph entries:

```typescript
// Before (wrong) — Level 2 example
{ g: 's', p: '', name: 'silent doubled s' }

// After (correct)
{ g: 'ss', p: 's' }
```

All six replacements: `ss` (L2), `ff` (L4), `ll` (L4), `nn` (L6), `dd` (L7),
`pp` (L7).

### B. Re-encode 15 words across curriculum JSON files

Each affected word was changed from a two-entry "letter + silent letter" pattern
to a single digraph entry. Example for `kiss` in `level2.json`:

```json
// Before (wrong): 4 entries, last consonant treated as silent
[
  { "g": "k", "p": "k" },
  { "g": "i", "p": "ɪ" },
  { "g": "s", "p": "s" },
  { "g": "s", "p": "" }
]

// After (correct): 3 entries, doubled consonant is one digraph
[
  { "g": "k", "p": "k" },
  { "g": "i", "p": "ɪ" },
  { "g": "ss", "p": "s" }
]
```

The same pattern was applied to all 15 words:

- **L2:** kiss
- **L4:** chess, chill, quoll, whiff
- **L6:** annoy
- **L7:** bunny, daddy, fluffy, happy, jelly, puppy, recess, silly, sunny

### C. Anchor test regex

Adding `dd` to Level 7 caused an unanchored regex `/d \/d\//` to match both the
`d /d/` and `dd /d/` buttons in `WordSpellSimpleConfigForm.test.tsx`:

```tsx
// Before (ambiguous): matches both "d /d/" and "dd /d/"
screen.getByRole('button', { name: /d \/d\//i });

// After (precise): matches only "d /d/"
screen.getByRole('button', { name: /^d \/d\/$/i });
```

## Why This Works

The original data entry process encoded doubled consonants by splitting them into
two separate grapheme-phoneme pairs — the first with the correct phoneme, the
second with an empty phoneme (`p: ""`). This treated the second letter as silent,
which is phonetically incorrect. In English phonics, doubled consonants like
`ss`, `ff`, `ll` are digraphs: two letters that together represent a single
phoneme.

By collapsing the two-entry pattern into a single digraph entry
(`{ "g": "ss", "p": "s" }`), the data now correctly represents the phonics
model. The `GRAPHEMES_BY_LEVEL` registry matches with real digraph definitions,
the game renders the correct number of buttons per word (one per actual phoneme),
and the audit invariant passes because both sides of the contract agree on the
correct encoding.

(session history) A key decision during investigation: magic-e `(e, '')` entries
in words like `dance`, `nerve`, `turtle` are correct and should not be changed —
they represent a different phonics concept (silent trailing e), not a
doubled-consonant encoding error.

(session history) Level assignment follows the highest-level grapheme in the
word. For example, `fluffy` belongs at Level 7 because `(y, iː)` is a Level 7
unit — the `ff` digraph itself was already available from Level 4. This framing
validated placement decisions across all the re-encoded words.

## Prevention

- **Invariant test guard:** `levels-vs-data-invariant.test.ts` ensures any new
  word's grapheme-phoneme pairs must be declared in `GRAPHEMES_BY_LEVEL`. This
  prevents workarounds — reviewers should reject entries with `p: ''` that do not
  represent genuinely silent letters (auto memory [claude]).
- **Phonics-aware review:** When reviewing curriculum data changes, verify
  doubled consonants (ss, ff, ll, nn, dd, pp, tt, bb, gg, rr, zz, mm, cc) are
  encoded as single digraph entries `{ "g": "XX", "p": "X" }`, never as two
  separate entries where the second has an empty phoneme.
- **Regex anchoring discipline:** Test assertions matching UI element labels by
  name should use anchored regexes (`/^...$/`) to avoid ambiguous matches when
  new graphemes are added.
- **No "silent doubled" as a phonics category:** The `name` field in grapheme
  entries should only use recognized phonics terminology. "Silent doubled X"
  should be flagged in review as a data modeling error.
- **Pair-aware filtering:** Any code that filters or matches graphemes must check
  both `g` (grapheme) and `p` (phoneme) fields together, never just the letter
  (auto memory [claude]).

## Related Issues

- [#232](https://github.com/leocaseiro/base-skill/issues/232) — the issue this
  fix addresses
- [PR #245](https://github.com/leocaseiro/base-skill/pull/245) — the fix PR
- [PR #219](https://github.com/leocaseiro/base-skill/pull/219) — origin of the
  placeholder workaround
- [#243](https://github.com/leocaseiro/base-skill/issues/243) — follow-up audit
  (missing words, IPA accuracy, proper names)
- [#231](https://github.com/leocaseiro/base-skill/issues/231) — related future
  work with genuinely silent letters (know, knife, lamb)
- Spec:
  `docs/superpowers/specs/2026-04-29-doubled-consonant-digraph-reencode-design.md`
- Plan:
  `docs/superpowers/plans/2026-04-29-doubled-consonant-digraph-reencode.md`
