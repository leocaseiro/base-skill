# Phonics Word Library (P1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the read-only phonics word library (**P1** only — types,
builders, codegen, ~650-word seed corpus, filter API with AUS fallback, and a
non-breaking WordSpell integration). **P2** (dev authoring form) and **P3**
(runtime user word bags) are separate projects — out of scope here.

**Architecture:** A normalized module at `src/data/words/` with two tables
joined on `word`: `WordCore` in `core/level{1..8}.json` and per-region
`CurriculumEntry` in `curriculum/<region>/level{1..8}.json`. A one-shot Node
codegen script parses
[`docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md`](./2026-04-11-phonic-word-library_words-list.md)
and emits JSON chunks using shared builder functions. An async
`filterWords()` performs a two-file hash join, supports grapheme/phoneme
subset filters, and falls back to AUS when the target region is empty. A
`useLibraryRounds` hook wraps WordSpell above its existing render so the
inner session code stays untouched.

**Tech Stack:** TypeScript, React 19, Vite (`import.meta.glob`), Vitest, IPA
Unicode characters, tsx for running the Node codegen script.

**Spec:** [2026-04-11-phonics-word-library-design.md](../specs/2026-04-11-phonics-word-library-design.md)

---

## File Map

### New files

- `src/data/words/types.ts` — `Region`, `Grapheme`, `WordCore`, `CurriculumEntry`, `WordHit`, `WordFilter`, `FilterResult`, `WordSpellSource`, `ValidationError`
- `src/data/words/levels.ts` — `LevelGraphemeUnit`, `LEVEL_LABELS` (per-region formatters), `GRAPHEMES_BY_LEVEL`, `cumulativeGraphemes(level)`, `graphemePool(level)`, `ALL_REGIONS`
- `src/data/words/phoneme-codes.ts` — teacher-friendly code → IPA map
- `src/data/words/builders.ts` — `makeWordCore`, `makeGraphemes`, `makeCurriculumEntry`, `validateEntry`
- `src/data/words/builders.test.ts` — unit tests
- `src/data/words/writer.ts` — pure `upsertCurriculumEntry`, `removeCurriculumEntry`, `upsertWordCore`, `removeWordCore`
- `src/data/words/writer.test.ts` — unit tests
- `src/data/words/filter.ts` — `entryMatches`, `filterWords`, chunk cache, `__resetChunkCacheForTests`
- `src/data/words/filter.test.ts` — unit + integration tests
- `src/data/words/adapters.ts` — `toWordSpellRound`
- `src/data/words/adapters.test.ts` — unit tests
- `src/data/words/words.test.ts` — invariant harness over all chunks
- `src/data/words/index.ts` — public API re-exports
- `src/data/words/core/level{1..8}.json` — 8 files of `WordCore[]`
- `src/data/words/curriculum/aus/level{1..8}.json` — 8 files of `CurriculumEntry[]`
- `src/data/words/curriculum/uk/.gitkeep` — empty stub
- `src/data/words/curriculum/us/.gitkeep` — empty stub
- `src/data/words/curriculum/br/.gitkeep` — empty stub
- `scripts/seed-word-library.ts` — one-shot codegen
- `docs/superpowers/plans/2026-04-11-phonics-word-library_codegen-review.md` — auto-generated list of Tier-1-only words (hand-review follow-up)
- `src/games/word-spell/useLibraryRounds.ts` — hook resolving `config.rounds` or `config.source` → rounds
- `src/games/word-spell/useLibraryRounds.test.tsx` — hook tests

### Modified files

- `src/games/word-spell/types.ts` — `rounds` becomes optional; add `source?: WordSpellSource`
- `src/games/word-spell/WordSpell/WordSpell.tsx` — mount `useLibraryRounds`, render loading state
- `src/games/word-spell/WordSpell/WordSpell.stories.tsx` — add `LibrarySourced` story
- `package.json` — add `tsx` devDep (if not already present) and `"word:seed": "tsx scripts/seed-word-library.ts"` script

---

## Conventions

- **Named exports only** — no `export default` in `.ts` files, per
  `eslint.config.js` and [CLAUDE.md](../../../CLAUDE.md). JSON chunk files
  export via default automatically (they're not `.ts`).
- **Arrow-function components** (`const X = () => {}`) per project convention.
- **IPA broad phonemic** — no narrow detail, no secondary stress unless
  disambiguating.
- **`syllables.join('') === word`** when present.
- **`graphemes.map(g => g.g.replace('_', '')).join('') === word`** when
  present (the `replace('_','')` accounts for split-digraph notation like
  `a_e`).
- **Digraphs are one grapheme.** `ch` is `{ g: 'ch', p: 'tʃ' }`, never two.
- **Silent letters** use `p: ''`.
- **Level pools are grapheme-phoneme units**, not strings. A single
  orthographic form like `c` can appear twice in the cumulative pool —
  once as `{ g: 'c', p: 'k' }` (level 2, as in `cat`) and once as
  `{ g: 'c', p: 's' }` (level 4, as in `cent`). The structural splitter
  derives a deduped string pool via `graphemePool(level)`; filter
  queries keep both variants addressable via
  `graphemesRequired: ['c']` + `phonemesRequired: ['k']`.
- **Proper nouns are filtered out** by the codegen via first-letter uppercase
  check.
- **Commit after every task.** Task 17 intentionally bundles Tasks 14–17 into
  one commit because the WordSpell type change breaks typecheck until the
  hook and wiring land.

---

## Steps

### Task 1 — Types module

**Files:**

- Create: `src/data/words/types.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// src/data/words/types.ts

export type Region = 'aus' | 'uk' | 'us' | 'br';

export interface WordCore {
  word: string;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
}

export interface Grapheme {
  g: string;
  p: string;
  span?: [number, number];
}

export interface CurriculumEntry {
  word: string;
  level: number;
  ipa: string;
  graphemes: Grapheme[];
}

export interface WordHit {
  word: string;
  region: Region;
  level: number;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
  ipa?: string;
  graphemes?: Grapheme[];
}

export interface WordFilter {
  region: Region;
  level?: number;
  levels?: number[];
  levelRange?: [number, number];
  syllableCountEq?: number;
  syllableCountRange?: [number, number];
  graphemesAllowed?: string[];
  graphemesRequired?: string[];
  phonemesAllowed?: string[];
  phonemesRequired?: string[];
  fallbackToAus?: boolean;
}

export interface FilterResult {
  hits: WordHit[];
  usedFallback?: { from: Region; to: 'aus' };
}

export type WordSpellSource = {
  type: 'word-library';
  filter: WordFilter;
  limit?: number;
};

export type ValidationErrorField =
  | 'word'
  | 'syllables'
  | 'graphemes'
  | 'ipa'
  | 'level';

export interface ValidationError {
  field: ValidationErrorField;
  message: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: passes. No callers yet.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/types.ts
git commit -m "feat(words): add phonics library type definitions"
```

---

### Task 2 — Levels + phoneme codes

**Files:**

- Create: `src/data/words/levels.ts`
- Create: `src/data/words/phoneme-codes.ts`

- [ ] **Step 1: Write `levels.ts`**

```ts
// src/data/words/levels.ts
import type { Region } from './types';

export const ALL_REGIONS: readonly Region[] = ['aus', 'uk', 'us', 'br'];

export const LEVEL_LABELS: Record<Region, (level: number) => string> = {
  aus: (n) => `Level ${n}`,
  uk: (n) => `Phase ${n}`,
  us: (n) => `K Unit ${n}`,
  br: (n) => `Unidade ${n}`,
};

/**
 * A single grapheme-phoneme pairing taught at a given level. A grapheme like
 * `c` appears twice across the AUS progression — once at level 2 teaching /k/,
 * once at level 4 teaching /s/. Modelling each as its own unit keeps both
 * variants addressable in the cumulative pool and in filter queries.
 */
export interface LevelGraphemeUnit {
  /** Orthographic form: `c`, `sh`, `igh`, `a_e`. */
  g: string;
  /** IPA of the sound this unit teaches at this level: `k`, `s`, `ʃ`, `aɪ`. */
  p: string;
  /** Optional teacher label: `soft c`, `th voiced`. */
  name?: string;
}

/**
 * Grapheme-phoneme units newly introduced at each level of the AUS
 * progression. Source:
 * docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md
 * Cumulative sets use `cumulativeGraphemes(level)` below.
 */
export const GRAPHEMES_BY_LEVEL: Record<
  number,
  readonly LevelGraphemeUnit[]
> = {
  1: [
    { g: 's', p: 's' },
    { g: 'a', p: 'æ' },
    { g: 't', p: 't' },
    { g: 'p', p: 'p' },
    { g: 'i', p: 'ɪ' },
    { g: 'n', p: 'n' },
  ],
  2: [
    { g: 'm', p: 'm' },
    { g: 'd', p: 'd' },
    { g: 'g', p: 'g' },
    { g: 'o', p: 'ɒ' },
    { g: 'c', p: 'k' },
    { g: 'k', p: 'k' },
    { g: 'ck', p: 'k' },
    { g: 'e', p: 'e' },
    { g: 'u', p: 'ʌ' },
    { g: 'r', p: 'r' },
  ],
  3: [
    { g: 'b', p: 'b' },
    { g: 'h', p: 'h' },
    { g: 'f', p: 'f' },
    { g: 'l', p: 'l' },
    { g: 'j', p: 'dʒ' },
    { g: 'v', p: 'v' },
    { g: 'w', p: 'w' },
    { g: 'x', p: 'ks' },
    { g: 'y', p: 'j' },
    { g: 'z', p: 'z' },
  ],
  4: [
    { g: 'sh', p: 'ʃ' },
    { g: 'ch', p: 'tʃ' },
    { g: 'th', p: 'θ', name: 'th voiceless' },
    { g: 'th', p: 'ð', name: 'th voiced' },
    { g: 'qu', p: 'kw' },
    { g: 'ng', p: 'ŋ' },
    { g: 'wh', p: 'w' },
    { g: 'ph', p: 'f' },
    { g: 'g', p: 'dʒ', name: 'soft g' },
    { g: 'c', p: 's', name: 'soft c' },
  ],
  5: [
    { g: 'ai', p: 'eɪ' },
    { g: 'ay', p: 'eɪ' },
    { g: 'ea', p: 'iː' },
    { g: 'ee', p: 'iː' },
    { g: 'ie', p: 'aɪ' },
    { g: 'igh', p: 'aɪ' },
    { g: 'oa', p: 'oʊ' },
    { g: 'ow', p: 'oʊ' },
    { g: 'ew', p: 'juː' },
    { g: 'ue', p: 'juː' },
  ],
  6: [
    { g: 'oi', p: 'ɔɪ' },
    { g: 'oy', p: 'ɔɪ' },
    { g: 'oo', p: 'uː', name: 'oo long' },
    { g: 'oo', p: 'ʊ', name: 'oo short' },
    { g: 'ou', p: 'aʊ' },
    { g: 'er', p: 'ɜː' },
    { g: 'ir', p: 'ɜː' },
    { g: 'ur', p: 'ɜː' },
    { g: 'ar', p: 'ɑː' },
    { g: 'or', p: 'ɔː' },
  ],
  7: [
    { g: 'a_e', p: 'eɪ' },
    { g: 'e_e', p: 'iː' },
    { g: 'i_e', p: 'aɪ' },
    { g: 'o_e', p: 'oʊ' },
    { g: 'u_e', p: 'juː' },
  ],
  8: [
    { g: 'aw', p: 'ɔː' },
    { g: 'air', p: 'eə' },
    { g: 'are', p: 'eə' },
    { g: 'ear', p: 'ɪə' },
    { g: 'eer', p: 'ɪə' },
    { g: 'ore', p: 'ɔː' },
    { g: 'dge', p: 'dʒ' },
    { g: 'tch', p: 'tʃ' },
  ],
};

/**
 * Returns all LevelGraphemeUnits introduced at or before `level`, preserving
 * introduction order and keeping multiple variants of the same orthography
 * (e.g. both `c=/k/` and `c=/s/` at level 4+).
 */
export const cumulativeGraphemes = (
  level: number,
): LevelGraphemeUnit[] => {
  const out: LevelGraphemeUnit[] = [];
  const seen = new Set<string>();
  for (let l = 1; l <= level; l++) {
    for (const unit of GRAPHEMES_BY_LEVEL[l] ?? []) {
      const key = `${unit.g}|${unit.p}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(unit);
    }
  }
  return out;
};

/**
 * Deduped orthographic pool for structural word splitting. Used by
 * `makeGraphemes` — the splitter only needs to know which grapheme forms
 * exist, not which phoneme each one teaches.
 */
export const graphemePool = (level: number): string[] => {
  const seen = new Set<string>();
  for (const unit of cumulativeGraphemes(level)) seen.add(unit.g);
  return [...seen];
};
```

- [ ] **Step 2: Write `phoneme-codes.ts`**

```ts
// src/data/words/phoneme-codes.ts

/** Teacher-friendly codes → IPA. Used by filter UIs that prefer plain text. */
export const PHONEME_CODE_TO_IPA: Record<string, string> = {
  sh: 'ʃ',
  ch: 'tʃ',
  th_voiceless: 'θ',
  th_voiced: 'ð',
  ng: 'ŋ',
  zh: 'ʒ',
  oo_long: 'uː',
  oo_short: 'ʊ',
  schwa: 'ə',
};

export const IPA_TO_PHONEME_CODE: Record<string, string> =
  Object.fromEntries(
    Object.entries(PHONEME_CODE_TO_IPA).map(([code, ipa]) => [
      ipa,
      code,
    ]),
  );
```

- [ ] **Step 3: Typecheck**

Run: `yarn typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/data/words/levels.ts src/data/words/phoneme-codes.ts
git commit -m "feat(words): add levels + phoneme code tables"
```

---

### Task 3 — Builders: `makeWordCore`

**Files:**

- Create: `src/data/words/builders.ts`
- Create: `src/data/words/builders.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/data/words/builders.test.ts
import { describe, expect, it } from 'vitest';
import { makeWordCore } from './builders';

describe('makeWordCore', () => {
  it('counts one syllable for simple CVC', () => {
    expect(makeWordCore('cat')).toEqual({
      word: 'cat',
      syllableCount: 1,
    });
  });

  it('counts silent-e as not a syllable', () => {
    expect(makeWordCore('cake')).toEqual({
      word: 'cake',
      syllableCount: 1,
    });
  });

  it('counts two syllables for sunset', () => {
    const result = makeWordCore('sunset');
    expect(result.syllableCount).toBe(2);
  });

  it('counts three syllables for elephant', () => {
    const result = makeWordCore('elephant');
    expect(result.syllableCount).toBe(3);
  });

  it('accepts explicit syllables override', () => {
    const result = makeWordCore('chicken', {
      syllables: ['chick', 'en'],
    });
    expect(result.syllableCount).toBe(2);
    expect(result.syllables).toEqual(['chick', 'en']);
  });

  it('records variants when provided', () => {
    const result = makeWordCore('colour', { variants: ['color'] });
    expect(result.variants).toEqual(['color']);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test src/data/words/builders.test.ts`
Expected: fails with `makeWordCore` not exported.

- [ ] **Step 3: Implement `makeWordCore`**

```ts
// src/data/words/builders.ts
import type { Grapheme, WordCore, CurriculumEntry } from './types';

/**
 * Counts syllables via vowel-group heuristic with silent-e subtraction.
 * Good enough for K–Y2 English. Caller can override via opts.syllables.
 */
const countSyllables = (word: string): number => {
  const lower = word.toLowerCase();
  const groups = lower.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  if (count > 1 && /e$/.test(lower) && !/[aeiouy]e$/.test(lower)) {
    count -= 1;
  }
  return Math.max(count, 1);
};

export const makeWordCore = (
  word: string,
  opts: { syllables?: string[]; variants?: string[] } = {},
): WordCore => {
  const base: WordCore = {
    word,
    syllableCount: opts.syllables
      ? opts.syllables.length
      : countSyllables(word),
  };
  if (opts.syllables) base.syllables = opts.syllables;
  if (opts.variants) base.variants = opts.variants;
  return base;
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/builders.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/builders.ts src/data/words/builders.test.ts
git commit -m "feat(words): add makeWordCore builder"
```

---

### Task 4 — Builders: `makeGraphemes`

**Files:**

- Modify: `src/data/words/builders.ts`
- Modify: `src/data/words/builders.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
// append to src/data/words/builders.test.ts
import { makeGraphemes } from './builders';
import { graphemePool } from './levels';

describe('makeGraphemes', () => {
  // graphemePool dedupes the orthographic forms; the phoneme each form
  // teaches at its level comes from GRAPHEMES_BY_LEVEL itself and is not
  // needed by the structural splitter.
  const L2 = graphemePool(2);
  const L4 = graphemePool(4);

  it('splits simple CVC letter-by-letter', () => {
    const result = makeGraphemes('cat', L2);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['c', 'a', 't']);
  });

  it('prefers longest match (ck over c+k)', () => {
    const result = makeGraphemes('pack', L2);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['p', 'a', 'ck']);
  });

  it('recognises sh as a single grapheme', () => {
    const result = makeGraphemes('ship', L4);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['sh', 'i', 'p']);
  });

  it('recognises th + ng in thing', () => {
    const result = makeGraphemes('thing', L4);
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.g)).toEqual(['th', 'i', 'ng']);
  });

  it('populates phonemes from phonemeByGrapheme map', () => {
    const result = makeGraphemes('ship', L4, {
      sh: 'ʃ',
      i: 'ɪ',
      p: 'p',
    });
    expect(result).not.toBeNull();
    expect(result!.map((x) => x.p)).toEqual(['ʃ', 'ɪ', 'p']);
  });

  it('leaves phonemes blank when no map supplied', () => {
    const result = makeGraphemes('cat', L2);
    expect(result!.map((x) => x.p)).toEqual(['', '', '']);
  });

  it('returns null when a letter is outside the level grapheme set', () => {
    expect(makeGraphemes('zip', L2)).toBeNull();
  });

  it('invariant: graphemes concat equals word', () => {
    for (const word of ['cat', 'ship', 'thing', 'pack']) {
      const result = makeGraphemes(word, L4);
      expect(result!.map((g) => g.g).join('')).toBe(word);
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test src/data/words/builders.test.ts`
Expected: fails — `makeGraphemes` not exported.

- [ ] **Step 3: Implement `makeGraphemes`**

Append to `src/data/words/builders.ts`:

```ts
/**
 * Longest-match-first split of `word` into graphemes drawn from
 * `levelGraphemes`. Returns null if the word contains a character sequence
 * that can't be explained by any grapheme in the set.
 * Case-insensitive on the input; output preserves lowercase.
 */
export const makeGraphemes = (
  word: string,
  levelGraphemes: readonly string[],
  phonemeByGrapheme?: Record<string, string>,
): Grapheme[] | null => {
  const lower = word.toLowerCase();
  // Sort by length desc so the greedy scan prefers digraphs/trigraphs.
  const sorted = [...levelGraphemes].toSorted(
    (a, b) => b.length - a.length,
  );
  const graphemes: Grapheme[] = [];
  let i = 0;

  while (i < lower.length) {
    let matched: string | null = null;
    for (const g of sorted) {
      // Split digraph notation like 'a_e' isn't a contiguous substring
      // at codegen time — we handle those in a dedicated step (Task 6).
      if (g.includes('_')) continue;
      if (lower.startsWith(g, i)) {
        matched = g;
        break;
      }
    }
    if (matched === null) return null;
    graphemes.push({
      g: matched,
      p: phonemeByGrapheme?.[matched] ?? '',
    });
    i += matched.length;
  }

  return graphemes;
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/builders.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/builders.ts src/data/words/builders.test.ts
git commit -m "feat(words): add makeGraphemes longest-match splitter"
```

---

### Task 5 — Builders: `makeCurriculumEntry` + `validateEntry`

**Files:**

- Modify: `src/data/words/builders.ts`
- Modify: `src/data/words/builders.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
// append to src/data/words/builders.test.ts
import { makeCurriculumEntry, validateEntry } from './builders';

describe('makeCurriculumEntry', () => {
  const L2 = graphemePool(2);

  it('builds a CurriculumEntry with graphemes derived from the level set', () => {
    const entry = makeCurriculumEntry('cat', 2, {
      levelGraphemes: L2,
      ipa: 'kæt',
    });
    expect(entry).not.toBeNull();
    expect(entry!.word).toBe('cat');
    expect(entry!.level).toBe(2);
    expect(entry!.ipa).toBe('kæt');
    expect(entry!.graphemes.map((g) => g.g)).toEqual(['c', 'a', 't']);
  });

  it('returns null when graphemes cannot be derived', () => {
    const entry = makeCurriculumEntry('zip', 2, { levelGraphemes: L2 });
    expect(entry).toBeNull();
  });

  it('accepts explicit graphemes override', () => {
    const entry = makeCurriculumEntry('cake', 7, {
      levelGraphemes: [...L2, 'a_e'],
      ipa: 'keɪk',
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a_e', p: 'eɪ', span: [1, 3] },
        { g: 'k', p: 'k' },
      ],
    });
    expect(entry!.graphemes).toHaveLength(3);
    expect(entry!.graphemes[1]!.g).toBe('a_e');
  });
});

describe('validateEntry', () => {
  const core = { word: 'cat', syllableCount: 1 };
  const good = {
    word: 'cat',
    level: 2,
    ipa: 'kæt',
    graphemes: [
      { g: 'c', p: 'k' },
      { g: 'a', p: 'æ' },
      { g: 't', p: 't' },
    ],
  };

  it('passes valid entries', () => {
    expect(validateEntry(core, good)).toEqual({ ok: true });
  });

  it('rejects grapheme mismatch', () => {
    const bad = { ...good, graphemes: [{ g: 'c', p: 'k' }] };
    const result = validateEntry(core, bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]!.field).toBe('graphemes');
    }
  });

  it('rejects word mismatch between core and curriculum', () => {
    const mismatched = { ...good, word: 'dog' };
    const result = validateEntry(core, mismatched);
    expect(result.ok).toBe(false);
  });

  it('rejects syllables that do not join to the word', () => {
    const badCore = {
      word: 'cat',
      syllableCount: 1,
      syllables: ['ca'],
    };
    const result = validateEntry(badCore, good);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'syllables')).toBe(
        true,
      );
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test src/data/words/builders.test.ts`
Expected: fails on `makeCurriculumEntry` and `validateEntry` missing.

- [ ] **Step 3: Implement both**

Append to `src/data/words/builders.ts`:

```ts
import type { ValidationError } from './types';

export const makeCurriculumEntry = (
  word: string,
  level: number,
  opts: {
    levelGraphemes: readonly string[];
    ipa?: string;
    graphemes?: Grapheme[];
    phonemeByGrapheme?: Record<string, string>;
  },
): CurriculumEntry | null => {
  const graphemes =
    opts.graphemes ??
    makeGraphemes(word, opts.levelGraphemes, opts.phonemeByGrapheme);
  if (graphemes === null) return null;
  return {
    word,
    level,
    ipa: opts.ipa ?? graphemes.map((g) => g.p).join(''),
    graphemes,
  };
};

export const validateEntry = (
  core: WordCore,
  curriculum: CurriculumEntry,
): { ok: true } | { ok: false; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  if (core.word !== curriculum.word) {
    errors.push({
      field: 'word',
      message: `core.word "${core.word}" !== curriculum.word "${curriculum.word}"`,
    });
  }

  if (core.syllables && core.syllables.join('') !== core.word) {
    errors.push({
      field: 'syllables',
      message: `syllables.join('') "${core.syllables.join('')}" !== word "${core.word}"`,
    });
  }

  if (core.syllables && core.syllables.length !== core.syllableCount) {
    errors.push({
      field: 'syllables',
      message: `syllables.length (${core.syllables.length}) !== syllableCount (${core.syllableCount})`,
    });
  }

  const concat = curriculum.graphemes
    .map((g) => g.g.replace('_', ''))
    .join('');
  if (concat !== curriculum.word) {
    errors.push({
      field: 'graphemes',
      message: `graphemes concat "${concat}" !== word "${curriculum.word}"`,
    });
  }

  if (!curriculum.ipa || curriculum.ipa.trim() === '') {
    errors.push({ field: 'ipa', message: 'ipa is empty' });
  }

  if (curriculum.level < 1 || !Number.isInteger(curriculum.level)) {
    errors.push({
      field: 'level',
      message: `level must be a positive integer, got ${curriculum.level}`,
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/builders.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/builders.ts src/data/words/builders.test.ts
git commit -m "feat(words): add makeCurriculumEntry + validateEntry"
```

---

### Task 6 — Writer module (pure upsert/remove)

**Files:**

- Create: `src/data/words/writer.ts`
- Create: `src/data/words/writer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/data/words/writer.test.ts
import { describe, expect, it } from 'vitest';
import {
  upsertCurriculumEntry,
  removeCurriculumEntry,
  upsertWordCore,
  removeWordCore,
} from './writer';
import type { CurriculumEntry, WordCore } from './types';

const e = (word: string, level: number): CurriculumEntry => ({
  word,
  level,
  ipa: word,
  graphemes: word.split('').map((c) => ({ g: c, p: '' })),
});

const c = (word: string): WordCore => ({ word, syllableCount: 1 });

describe('upsertCurriculumEntry', () => {
  it('appends a new entry to an empty chunk', () => {
    const next = upsertCurriculumEntry([], e('cat', 2));
    expect(next).toHaveLength(1);
    expect(next[0]!.word).toBe('cat');
  });

  it('replaces an existing entry matched by word', () => {
    const before = [e('cat', 2)];
    const updated = { ...e('cat', 2), ipa: 'kæt' };
    const after = upsertCurriculumEntry(before, updated);
    expect(after).toHaveLength(1);
    expect(after[0]!.ipa).toBe('kæt');
  });

  it('sorts alphabetically so output is deterministic', () => {
    const chunk = upsertCurriculumEntry(
      [e('pin', 2), e('cat', 2)],
      e('bat', 2),
    );
    expect(chunk.map((x) => x.word)).toEqual(['bat', 'cat', 'pin']);
  });
});

describe('removeCurriculumEntry', () => {
  it('removes a matching word', () => {
    const chunk = [e('cat', 2), e('dog', 2)];
    const after = removeCurriculumEntry(chunk, 'cat');
    expect(after.map((x) => x.word)).toEqual(['dog']);
  });

  it('is idempotent when the word is absent', () => {
    const chunk = [e('cat', 2)];
    const after = removeCurriculumEntry(chunk, 'zebra');
    expect(after).toEqual(chunk);
  });
});

describe('upsertWordCore + removeWordCore', () => {
  it('upserts by word', () => {
    const chunk = upsertWordCore([c('cat')], {
      ...c('cat'),
      syllables: ['cat'],
    });
    expect(chunk[0]!.syllables).toEqual(['cat']);
  });

  it('removes by word', () => {
    const chunk = removeWordCore([c('cat'), c('dog')], 'cat');
    expect(chunk.map((x) => x.word)).toEqual(['dog']);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test src/data/words/writer.test.ts`
Expected: fails — module missing.

- [ ] **Step 3: Implement `writer.ts`**

```ts
// src/data/words/writer.ts
import type { CurriculumEntry, WordCore } from './types';

const byWord = <T extends { word: string }>(a: T, b: T): number =>
  a.word.localeCompare(b.word);

export const upsertCurriculumEntry = (
  chunk: readonly CurriculumEntry[],
  entry: CurriculumEntry,
): CurriculumEntry[] => {
  const next = chunk.filter((e) => e.word !== entry.word);
  next.push(entry);
  return next.toSorted(byWord);
};

export const removeCurriculumEntry = (
  chunk: readonly CurriculumEntry[],
  word: string,
): CurriculumEntry[] =>
  chunk.filter((e) => e.word !== word).toSorted(byWord);

export const upsertWordCore = (
  chunk: readonly WordCore[],
  entry: WordCore,
): WordCore[] => {
  const next = chunk.filter((e) => e.word !== entry.word);
  next.push(entry);
  return next.toSorted(byWord);
};

export const removeWordCore = (
  chunk: readonly WordCore[],
  word: string,
): WordCore[] => chunk.filter((e) => e.word !== word).toSorted(byWord);
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/writer.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/writer.ts src/data/words/writer.test.ts
git commit -m "feat(words): add pure writer helpers"
```

---

### Task 7 — Invariant harness (empty-chunks stub)

**Files:**

- Create: `src/data/words/words.test.ts`

- [ ] **Step 1: Write the harness**

The test walks the chunks directory lazily — chunks may not exist yet
(codegen runs in Task 9). Use `import.meta.glob` with `eager: true` so
vitest picks up whatever JSON lives under `core/` and `curriculum/<region>/`
at test time.

```ts
// src/data/words/words.test.ts
import { describe, expect, it } from 'vitest';
import type { CurriculumEntry, Region, WordCore } from './types';
import { ALL_REGIONS } from './levels';

const coreChunks = import.meta.glob<{ default: WordCore[] }>(
  './core/level*.json',
  { eager: true },
);
const curriculumChunks = import.meta.glob<{
  default: CurriculumEntry[];
}>('./curriculum/*/level*.json', { eager: true });

const coreByLevel: Record<number, WordCore[]> = {};
for (const [path, mod] of Object.entries(coreChunks)) {
  const match = /level(\d+)\.json$/.exec(path);
  if (!match) continue;
  coreByLevel[Number(match[1])] = mod.default;
}

interface CurriculumFile {
  region: Region;
  level: number;
  entries: CurriculumEntry[];
}

const curriculumFiles: CurriculumFile[] = [];
for (const [path, mod] of Object.entries(curriculumChunks)) {
  const match = /curriculum\/(\w+)\/level(\d+)\.json$/.exec(path);
  if (!match) continue;
  const region = match[1] as Region;
  if (!ALL_REGIONS.includes(region)) continue;
  curriculumFiles.push({
    region,
    level: Number(match[2]),
    entries: mod.default,
  });
}

describe('word library invariants', () => {
  it('has at most one core entry per (word, level)', () => {
    for (const [level, entries] of Object.entries(coreByLevel)) {
      const seen = new Set<string>();
      for (const e of entries) {
        expect(seen.has(e.word)).toBe(false);
        seen.add(e.word);
      }
      expect(level).toBeDefined();
    }
  });

  it('WordCore.syllables joins to word when present', () => {
    for (const entries of Object.values(coreByLevel)) {
      for (const e of entries) {
        if (e.syllables) {
          expect(e.syllables.join('')).toBe(e.word);
          expect(e.syllables.length).toBe(e.syllableCount);
        }
      }
    }
  });

  it('CurriculumEntry.graphemes joins to word', () => {
    for (const { entries } of curriculumFiles) {
      for (const e of entries) {
        const concat = e.graphemes
          .map((g) => g.g.replace('_', ''))
          .join('');
        expect(concat).toBe(e.word);
      }
    }
  });

  it('CurriculumEntry has a matching WordCore in the same level', () => {
    for (const { level, entries } of curriculumFiles) {
      const coreWords = new Set(
        (coreByLevel[level] ?? []).map((c) => c.word),
      );
      for (const e of entries) {
        expect(coreWords.has(e.word)).toBe(true);
      }
    }
  });

  it('CurriculumEntry.level matches the filename level', () => {
    for (const { level, entries } of curriculumFiles) {
      for (const e of entries) expect(e.level).toBe(level);
    }
  });

  it('variants are bidirectional', () => {
    const allCore = Object.values(coreByLevel).flat();
    const byWord = new Map(allCore.map((c) => [c.word, c]));
    for (const c of allCore) {
      for (const v of c.variants ?? []) {
        const linked = byWord.get(v);
        expect(linked, `variant "${v}" missing`).toBeDefined();
        expect(linked!.variants?.includes(c.word)).toBe(true);
      }
    }
  });

  it('no proper nouns (first letter must be lowercase)', () => {
    for (const entries of Object.values(coreByLevel)) {
      for (const e of entries) {
        expect(e.word[0]).toBe(e.word[0]!.toLowerCase());
      }
    }
  });
});
```

- [ ] **Step 2: Run the harness**

Run: `yarn test src/data/words/words.test.ts`
Expected: passes vacuously (no chunks exist yet; the `for` loops find
nothing). All `it` blocks still execute.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/words.test.ts
git commit -m "feat(words): add invariant harness over chunk files"
```

---

### Task 8 — Codegen script

**Files:**

- Create: `scripts/seed-word-library.ts`
- Modify: `package.json` (add `word:seed` script + tsx devDep if missing)

- [ ] **Step 1: Confirm `tsx` availability**

Run: `yarn tsx --version`
Expected: prints a version. If it fails, run
`yarn add -D tsx` and re-run.

- [ ] **Step 2: Write `scripts/seed-word-library.ts`**

```ts
// scripts/seed-word-library.ts
/* eslint-disable no-console */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeCurriculumEntry,
  makeWordCore,
  validateEntry,
} from '../src/data/words/builders';
import { graphemePool } from '../src/data/words/levels';
import type {
  CurriculumEntry,
  WordCore,
} from '../src/data/words/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const sourceFile = join(
  repoRoot,
  'docs/superpowers/plans/2026-04-11-phonic-word-library_words-list.md',
);
const wordsDir = join(repoRoot, 'src/data/words');
const reviewFile = join(
  repoRoot,
  'docs/superpowers/plans/2026-04-11-phonics-word-library_codegen-review.md',
);

interface LevelBlock {
  level: number;
  words: string[];
}

const parseSource = (md: string): LevelBlock[] => {
  const blocks: LevelBlock[] = [];
  const levelRegex = /##\s+level\s+(\d+)/gi;
  const matches = [...md.matchAll(levelRegex)];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const level = Number(match[1]);
    const start = match.index! + match[0].length;
    const end =
      i + 1 < matches.length ? matches[i + 1]!.index! : md.length;
    const chunk = md.slice(start, end);
    const wordsLine = /\*\s+words:\s+\[([^\]]+)\]/i.exec(chunk);
    if (!wordsLine) continue;
    const words = wordsLine[1]!
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);
    blocks.push({ level, words });
  }
  return blocks;
};

const isProperNoun = (word: string): boolean => /^[A-Z]/.test(word);

interface SeedResult {
  coreByLevel: Map<number, WordCore[]>;
  curriculumByLevel: Map<number, CurriculumEntry[]>;
  review: string[];
}

const seed = (blocks: LevelBlock[]): SeedResult => {
  const coreByLevel = new Map<number, WordCore[]>();
  const curriculumByLevel = new Map<number, CurriculumEntry[]>();
  const review: string[] = [];
  const seen = new Map<string, number>(); // word → level first assigned

  for (const block of blocks) {
    const pool = graphemePool(block.level);
    for (const rawWord of block.words) {
      if (isProperNoun(rawWord)) continue;
      const word = rawWord.toLowerCase();
      if (seen.has(word)) continue; // dedup: first level wins
      seen.set(word, block.level);

      const core = makeWordCore(word);
      if (!coreByLevel.has(block.level))
        coreByLevel.set(block.level, []);
      coreByLevel.get(block.level)!.push(core);

      const entry = makeCurriculumEntry(word, block.level, {
        levelGraphemes: pool,
      });

      if (entry === null) {
        review.push(
          `- \`${word}\` (level ${block.level}) — could not derive graphemes from set [${pool.join(', ')}]`,
        );
        continue;
      }

      const v = validateEntry(core, entry);
      if (!v.ok) {
        review.push(
          `- \`${word}\` (level ${block.level}) — ${v.errors.map((e) => e.message).join('; ')}`,
        );
        continue;
      }

      if (!curriculumByLevel.has(block.level))
        curriculumByLevel.set(block.level, []);
      curriculumByLevel.get(block.level)!.push(entry);
    }
  }

  // Deterministic output: alphabetical by word.
  for (const arr of coreByLevel.values())
    arr.sort((a, b) => a.word.localeCompare(b.word));
  for (const arr of curriculumByLevel.values())
    arr.sort((a, b) => a.word.localeCompare(b.word));

  return { coreByLevel, curriculumByLevel, review };
};

const writeJson = (path: string, data: unknown): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
};

const writeStub = (region: string): void => {
  const path = join(wordsDir, 'curriculum', region, '.gitkeep');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, '', 'utf-8');
};

const main = (): void => {
  const md = readFileSync(sourceFile, 'utf-8');
  const blocks = parseSource(md);
  const { coreByLevel, curriculumByLevel, review } = seed(blocks);

  for (const [level, entries] of coreByLevel.entries()) {
    writeJson(join(wordsDir, 'core', `level${level}.json`), entries);
  }
  for (const [level, entries] of curriculumByLevel.entries()) {
    writeJson(
      join(wordsDir, 'curriculum', 'aus', `level${level}.json`),
      entries,
    );
  }

  for (const region of ['uk', 'us', 'br']) writeStub(region);

  const reviewMd = [
    '# Phonics Library Codegen Review',
    '',
    '> Auto-generated by `scripts/seed-word-library.ts`. This lists words',
    '> that could not be auto-enriched with Tier 2 data (IPA + graphemes)',
    '> during seeding. Each entry needs hand-review, typically via P2',
    '> (the dev authoring form) once it lands.',
    '',
    `Total flagged: **${review.length}**`,
    '',
    ...review,
    '',
  ].join('\n');
  writeFileSync(reviewFile, reviewMd, 'utf-8');

  const coreTotal = [...coreByLevel.values()].reduce(
    (n, arr) => n + arr.length,
    0,
  );
  const curriculumTotal = [...curriculumByLevel.values()].reduce(
    (n, arr) => n + arr.length,
    0,
  );
  console.log(
    `Seeded ${coreTotal} core words; ${curriculumTotal} enriched AUS curriculum entries; ${review.length} flagged for review.`,
  );
};

main();
```

- [ ] **Step 3: Add script to `package.json`**

Edit `package.json` — add under `"scripts"`:

```json
"word:seed": "tsx scripts/seed-word-library.ts"
```

- [ ] **Step 4: Commit the script (chunks come in Task 9)**

```bash
git add scripts/seed-word-library.ts package.json
git commit -m "feat(words): add seed codegen script"
```

---

### Task 9 — Run codegen and commit chunks

**Files:**

- Create: `src/data/words/core/level{1..8}.json`
- Create: `src/data/words/curriculum/aus/level{1..8}.json`
- Create: `src/data/words/curriculum/{uk,us,br}/.gitkeep`
- Create: `docs/superpowers/plans/2026-04-11-phonics-word-library_codegen-review.md`

- [ ] **Step 1: Run the codegen**

Run: `yarn word:seed`
Expected: console prints e.g. `Seeded 612 core words; 481 enriched AUS
curriculum entries; 131 flagged for review.` Exact numbers depend on the
word list and the grapheme-set completeness.

- [ ] **Step 2: Run the invariant harness**

Run: `yarn test src/data/words/words.test.ts`
Expected: all assertions pass against the newly seeded chunks. If any fail,
fix the **codegen script** (not the JSON files by hand) and re-run.

- [ ] **Step 3: Run Prettier over the new JSON**

Run: `npx prettier --write "src/data/words/**/*.json"`
Expected: files are already JSON-formatted; Prettier may only adjust
trailing whitespace.

- [ ] **Step 4: Spot-check a few chunks**

Open `src/data/words/core/level1.json` and confirm:

- All entries lowercase
- Every entry has `word` + `syllableCount`
- No `Nat`, `Sam`, etc.

Open `src/data/words/curriculum/aus/level4.json` and confirm a word like
`ship` is present with `graphemes: [{g:"sh",p:""},{g:"i",p:""},{g:"p",p:""}]`
(phonemes are empty strings because Tier-2 IPA is not yet filled — the
codegen only derives graphemes; IPA defaults to the empty concat).

> **Note:** The codegen leaves `ipa` as the join of empty phonemes, which
> fails `validateEntry`'s "ipa is empty" check. That means **all** entries
> are flagged for review in the initial pass. That is expected behavior —
> Tier 2 IPA lands later via P2's authoring form. For this reason,
> [Step 5 below] relaxes the codegen to emit Tier-1-only entries for all
> words and defer Tier 2 entirely.

- [ ] **Step 5: Adjust codegen to emit Tier-1-only entries**

The empty-IPA edge case makes every entry fail validation, which defeats
the split. Update `scripts/seed-word-library.ts` and the validator:

1. Remove the "ipa is empty" check from `validateEntry` — IPA presence is a
   Tier-2 concern that will be enforced by P2's authoring form and by an
   explicit Tier-2 coverage report (future work), not by the base validator.
2. Inside `seed()`, after `makeCurriculumEntry` returns non-null, emit the
   curriculum row with `ipa: ''` (Tier 1 only) and log the word to the
   review file so P2 can backfill IPA later.

Replace the relevant block in `seed()` with:

```ts
if (entry === null) {
  review.push(
    `- \`${word}\` (level ${block.level}) — could not derive graphemes from set [${pool.join(', ')}]`,
  );
  continue;
}

// Tier 1 ships now; Tier 2 IPA is added later via P2.
// Emit the curriculum row without `ipa` — consumers treat Tier-2 fields as optional.
const tier1Entry: CurriculumEntry = {
  word: entry.word,
  level: entry.level,
  ipa: '',
  graphemes: entry.graphemes,
};

if (!curriculumByLevel.has(block.level))
  curriculumByLevel.set(block.level, []);
curriculumByLevel.get(block.level)!.push(tier1Entry);

if (!entry.graphemes.every((g) => g.p !== '')) {
  review.push(
    `- \`${word}\` (level ${block.level}) — Tier 2 needed: IPA + phonemes`,
  );
}
```

Then update `validateEntry` in `src/data/words/builders.ts` — delete this
block entirely:

```ts
if (!curriculum.ipa || curriculum.ipa.trim() === '') {
  errors.push({ field: 'ipa', message: 'ipa is empty' });
}
```

`CurriculumEntry.ipa` is already typed `string` (Task 1), so no type
changes are needed. The builders test from Task 5 (`'passes valid entries'`)
still passes because that case uses a populated IPA.

- [ ] **Step 6: Re-run codegen**

Run: `yarn word:seed && yarn test src/data/words/`
Expected: invariant harness passes. The codegen review file lists roughly
all words (Tier 1 → Tier 2 is future work).

- [ ] **Step 7: Commit chunks + script adjustments**

```bash
git add src/data/words/core \
        src/data/words/curriculum \
        src/data/words/types.ts \
        src/data/words/builders.ts \
        src/data/words/builders.test.ts \
        scripts/seed-word-library.ts \
        docs/superpowers/plans/2026-04-11-phonics-word-library_codegen-review.md
git commit -m "feat(words): seed ~650-word AUS corpus via codegen"
```

---

### Task 10 — Filter: pure `entryMatches`

**Files:**

- Create: `src/data/words/filter.ts`
- Create: `src/data/words/filter.test.ts`

- [ ] **Step 1: Write failing tests for `entryMatches`**

```ts
// src/data/words/filter.test.ts
import { describe, expect, it } from 'vitest';
import { entryMatches } from './filter';
import type { WordHit } from './types';

const hit = (overrides: Partial<WordHit> = {}): WordHit => ({
  word: 'cat',
  region: 'aus',
  level: 2,
  syllableCount: 1,
  graphemes: [
    { g: 'c', p: 'k' },
    { g: 'a', p: 'æ' },
    { g: 't', p: 't' },
  ],
  ...overrides,
});

describe('entryMatches', () => {
  it('matches by exact level', () => {
    expect(entryMatches(hit(), { region: 'aus', level: 2 })).toBe(true);
    expect(entryMatches(hit(), { region: 'aus', level: 3 })).toBe(
      false,
    );
  });

  it('matches by levels[]', () => {
    expect(
      entryMatches(hit(), { region: 'aus', levels: [1, 2, 3] }),
    ).toBe(true);
    expect(entryMatches(hit(), { region: 'aus', levels: [4, 5] })).toBe(
      false,
    );
  });

  it('matches by levelRange', () => {
    expect(
      entryMatches(hit(), { region: 'aus', levelRange: [1, 3] }),
    ).toBe(true);
    expect(
      entryMatches(hit(), { region: 'aus', levelRange: [3, 5] }),
    ).toBe(false);
  });

  it('matches syllableCountEq and syllableCountRange', () => {
    expect(
      entryMatches(hit(), { region: 'aus', syllableCountEq: 1 }),
    ).toBe(true);
    expect(
      entryMatches(hit({ syllableCount: 3 }), {
        region: 'aus',
        syllableCountRange: [2, 4],
      }),
    ).toBe(true);
  });

  it('graphemesAllowed: passes only when every grapheme is in the set', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: ['c', 'a', 't'],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesAllowed: ['c', 'a'], // missing 't'
      }),
    ).toBe(false);
  });

  it('graphemesRequired: passes when at least one required is present', () => {
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['c'],
      }),
    ).toBe(true);
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['sh'],
      }),
    ).toBe(false);
  });

  it('phonemesAllowed + Required: "c making /k/" case', () => {
    // cat: c/k, a/æ, t/t
    expect(
      entryMatches(hit(), {
        region: 'aus',
        graphemesRequired: ['c'],
        phonemesRequired: ['k'],
      }),
    ).toBe(true);

    // city: c/s, i/ɪ, t/t, y/i — has 'c' but no /k/
    const city: WordHit = {
      word: 'city',
      region: 'aus',
      level: 4,
      syllableCount: 2,
      graphemes: [
        { g: 'c', p: 's' },
        { g: 'i', p: 'ɪ' },
        { g: 't', p: 't' },
        { g: 'y', p: 'i' },
      ],
    };
    expect(
      entryMatches(city, {
        region: 'aus',
        graphemesRequired: ['c'],
        phonemesRequired: ['k'],
      }),
    ).toBe(false);
  });

  it('excludes Tier-1-only words from Tier-2 filters', () => {
    const tier1: WordHit = {
      word: 'cat',
      region: 'aus',
      level: 2,
      syllableCount: 1,
      // no graphemes
    };
    expect(
      entryMatches(tier1, {
        region: 'aus',
        graphemesAllowed: ['c', 'a', 't'],
      }),
    ).toBe(false);
    expect(entryMatches(tier1, { region: 'aus', level: 2 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn test src/data/words/filter.test.ts`
Expected: fails — `entryMatches` not exported.

- [ ] **Step 3: Implement `entryMatches`**

```ts
// src/data/words/filter.ts
import type { WordFilter, WordHit } from './types';

const inRange = (
  n: number,
  [min, max]: readonly [number, number],
): boolean => n >= min && n <= max;

export const entryMatches = (
  hit: WordHit,
  filter: WordFilter,
): boolean => {
  if (hit.region !== filter.region) return false;

  if (filter.level !== undefined && hit.level !== filter.level)
    return false;
  if (filter.levels && !filter.levels.includes(hit.level)) return false;
  if (filter.levelRange && !inRange(hit.level, filter.levelRange))
    return false;

  if (
    filter.syllableCountEq !== undefined &&
    hit.syllableCount !== filter.syllableCountEq
  )
    return false;
  if (
    filter.syllableCountRange &&
    !inRange(hit.syllableCount, filter.syllableCountRange)
  )
    return false;

  const tier2Active =
    filter.graphemesAllowed !== undefined ||
    filter.graphemesRequired !== undefined ||
    filter.phonemesAllowed !== undefined ||
    filter.phonemesRequired !== undefined;

  if (tier2Active && !hit.graphemes) return false;

  if (hit.graphemes) {
    if (filter.graphemesAllowed) {
      const allowed = new Set(filter.graphemesAllowed);
      if (!hit.graphemes.every((g) => allowed.has(g.g))) return false;
    }
    if (filter.graphemesRequired) {
      const required = new Set(filter.graphemesRequired);
      if (!hit.graphemes.some((g) => required.has(g.g))) return false;
    }
    if (filter.phonemesAllowed) {
      const allowed = new Set(filter.phonemesAllowed);
      if (!hit.graphemes.every((g) => allowed.has(g.p))) return false;
    }
    if (filter.phonemesRequired) {
      const required = new Set(filter.phonemesRequired);
      if (!hit.graphemes.some((g) => required.has(g.p))) return false;
    }
  }

  return true;
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/filter.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/filter.ts src/data/words/filter.test.ts
git commit -m "feat(words): add entryMatches pure filter predicate"
```

---

### Task 11 — Filter: async `filterWords` with two-file join + AUS fallback

**Files:**

- Modify: `src/data/words/filter.ts`
- Modify: `src/data/words/filter.test.ts`

- [ ] **Step 1: Append failing integration tests**

```ts
// append to src/data/words/filter.test.ts
import { afterEach, beforeEach } from 'vitest';
import { __resetChunkCacheForTests, filterWords } from './filter';

describe('filterWords (integration against seeded chunks)', () => {
  beforeEach(() => __resetChunkCacheForTests());
  afterEach(() => __resetChunkCacheForTests());

  it('returns AUS level 1 hits', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits.length).toBeGreaterThan(0);
    for (const hit of result.hits) {
      expect(hit.level).toBe(1);
      expect(hit.region).toBe('aus');
    }
    expect(result.usedFallback).toBeUndefined();
  });

  it('joins WordCore + CurriculumEntry (hit has syllableCount)', async () => {
    const result = await filterWords({ region: 'aus', level: 1 });
    expect(result.hits[0]!.syllableCount).toBeGreaterThanOrEqual(1);
  });

  it('Tier-2 filter excludes Tier-1-only words', async () => {
    const result = await filterWords({
      region: 'aus',
      levels: [1, 2],
      graphemesAllowed: [
        's',
        'a',
        't',
        'p',
        'i',
        'n',
        'm',
        'd',
        'g',
        'o',
      ],
    });
    for (const hit of result.hits) {
      // Every grapheme must be in the allowed set
      for (const g of hit.graphemes ?? []) {
        expect([
          's',
          'a',
          't',
          'p',
          'i',
          'n',
          'm',
          'd',
          'g',
          'o',
        ]).toContain(g.g);
      }
    }
  });

  it('falls back to AUS when UK has no data', async () => {
    const result = await filterWords({ region: 'uk', level: 1 });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.usedFallback).toEqual({ from: 'uk', to: 'aus' });
  });

  it('respects fallbackToAus: false', async () => {
    const result = await filterWords({
      region: 'uk',
      level: 1,
      fallbackToAus: false,
    });
    expect(result.hits).toHaveLength(0);
    expect(result.usedFallback).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `yarn test src/data/words/filter.test.ts`
Expected: fails — `filterWords` not exported.

- [ ] **Step 3: Implement `filterWords` + cache + AUS fallback**

Append to `src/data/words/filter.ts`:

```ts
import type {
  CurriculumEntry,
  FilterResult,
  Region,
  WordCore,
  WordHit,
} from './types';
import { ALL_REGIONS } from './levels';

const coreLoaders = import.meta.glob<{ default: WordCore[] }>(
  './core/level*.json',
);
const ausLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/aus/level*.json',
);
const ukLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/uk/level*.json',
);
const usLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/us/level*.json',
);
const brLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  './curriculum/br/level*.json',
);

const loadersForRegion = (
  region: Region,
): Record<string, () => Promise<{ default: CurriculumEntry[] }>> => {
  switch (region) {
    case 'aus':
      return ausLoaders;
    case 'uk':
      return ukLoaders;
    case 'us':
      return usLoaders;
    case 'br':
      return brLoaders;
  }
};

let coreCache: Map<string, WordCore> | null = null;
const curriculumCache: Partial<Record<Region, CurriculumEntry[]>> = {};

export const __resetChunkCacheForTests = (): void => {
  coreCache = null;
  for (const r of ALL_REGIONS) delete curriculumCache[r];
};

const loadCore = async (): Promise<Map<string, WordCore>> => {
  if (coreCache) return coreCache;
  const map = new Map<string, WordCore>();
  const chunks = await Promise.all(
    Object.values(coreLoaders).map((load) => load()),
  );
  for (const chunk of chunks) {
    for (const entry of chunk.default) map.set(entry.word, entry);
  }
  coreCache = map;
  return map;
};

const loadCurriculum = async (
  region: Region,
): Promise<CurriculumEntry[]> => {
  if (curriculumCache[region]) return curriculumCache[region]!;
  const chunks = await Promise.all(
    Object.values(loadersForRegion(region)).map((load) => load()),
  );
  const flat = chunks.flatMap((c) => c.default);
  curriculumCache[region] = flat;
  return flat;
};

const joinHits = (
  curriculum: CurriculumEntry[],
  core: Map<string, WordCore>,
  region: Region,
): WordHit[] =>
  curriculum.flatMap((entry) => {
    const c = core.get(entry.word);
    if (!c) return [];
    return [
      {
        word: entry.word,
        region,
        level: entry.level,
        syllableCount: c.syllableCount,
        syllables: c.syllables,
        variants: c.variants,
        ipa: entry.ipa || undefined,
        graphemes: entry.graphemes,
      } as WordHit,
    ];
  });

export const filterWords = async (
  filter: WordFilter,
): Promise<FilterResult> => {
  const core = await loadCore();
  const curriculum = await loadCurriculum(filter.region);
  const hits = joinHits(curriculum, core, filter.region).filter((h) =>
    entryMatches(h, filter),
  );

  if (
    hits.length > 0 ||
    filter.region === 'aus' ||
    filter.fallbackToAus === false
  ) {
    return { hits };
  }

  const ausCurriculum = await loadCurriculum('aus');
  const ausHits = joinHits(ausCurriculum, core, 'aus').filter((h) =>
    entryMatches(h, { ...filter, region: 'aus' }),
  );
  return {
    hits: ausHits,
    usedFallback: { from: filter.region, to: 'aus' },
  };
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/filter.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/filter.ts src/data/words/filter.test.ts
git commit -m "feat(words): add filterWords with two-file join + AUS fallback"
```

---

### Task 12 — Adapter `toWordSpellRound`

**Files:**

- Create: `src/data/words/adapters.ts`
- Create: `src/data/words/adapters.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/data/words/adapters.test.ts
import { describe, expect, it } from 'vitest';
import { toWordSpellRound } from './adapters';
import type { WordHit } from './types';

describe('toWordSpellRound', () => {
  const base: WordHit = {
    word: 'cat',
    region: 'aus',
    level: 2,
    syllableCount: 1,
  };

  it('uses syllables joined by - when present', () => {
    const round = toWordSpellRound({
      ...base,
      word: 'sunset',
      syllables: ['sun', 'set'],
      syllableCount: 2,
    });
    expect(round.word).toBe('sun-set');
  });

  it('falls back to raw word when no syllables', () => {
    expect(toWordSpellRound(base).word).toBe('cat');
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `yarn test src/data/words/adapters.test.ts`
Expected: fails.

- [ ] **Step 3: Implement**

```ts
// src/data/words/adapters.ts
import type { WordHit } from './types';
import type { WordSpellRound } from '@/games/word-spell/types';

export const toWordSpellRound = (hit: WordHit): WordSpellRound => ({
  word: hit.syllables ? hit.syllables.join('-') : hit.word,
});
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/adapters.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/adapters.ts src/data/words/adapters.test.ts
git commit -m "feat(words): add toWordSpellRound adapter"
```

---

### Task 13 — Public API re-exports

**Files:**

- Create: `src/data/words/index.ts`

- [ ] **Step 1: Write `index.ts`**

```ts
// src/data/words/index.ts
export type {
  Region,
  Grapheme,
  WordCore,
  CurriculumEntry,
  WordHit,
  WordFilter,
  FilterResult,
  WordSpellSource,
  ValidationError,
} from './types';
export type { LevelGraphemeUnit } from './levels';
export {
  ALL_REGIONS,
  LEVEL_LABELS,
  GRAPHEMES_BY_LEVEL,
  cumulativeGraphemes,
  graphemePool,
} from './levels';
export {
  PHONEME_CODE_TO_IPA,
  IPA_TO_PHONEME_CODE,
} from './phoneme-codes';
export {
  makeWordCore,
  makeGraphemes,
  makeCurriculumEntry,
  validateEntry,
} from './builders';
export {
  upsertCurriculumEntry,
  removeCurriculumEntry,
  upsertWordCore,
  removeWordCore,
} from './writer';
export {
  entryMatches,
  filterWords,
  __resetChunkCacheForTests,
} from './filter';
export { toWordSpellRound } from './adapters';
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/index.ts
git commit -m "feat(words): re-export public API"
```

---

### Task 14 — Update `WordSpellConfig`

**Files:**

- Modify: `src/games/word-spell/types.ts`

- [ ] **Step 1: Edit `types.ts`**

Replace the existing `WordSpellConfig` interface (keeping all other fields
and the `wordSpellConfigFields` array untouched):

```ts
import type { WordSpellSource } from '@/data/words';

export interface WordSpellConfig extends AnswerGameConfig {
  component: 'WordSpell';
  mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
  /** @default 'letter' */
  tileUnit: 'letter' | 'syllable' | 'word';
  /** Explicit hand-authored rounds. Wins over `source` when both are present. */
  rounds?: WordSpellRound[];
  /** Library-driven rounds. Resolved at WordSpell mount time. */
  source?: WordSpellSource;
}
```

Keep the existing `GapDefinition`, `WordSpellRound`, and `wordSpellConfigFields`
exports untouched.

- [ ] **Step 2: Typecheck — expected to fail**

Run: `yarn typecheck`
Expected: fails. Many callers access `config.rounds.length` or
`config.rounds[i]` directly and now see `rounds` as possibly undefined.
**Leave this broken on purpose** — Tasks 15 + 16 fix it by introducing a
resolved rounds layer. Do not silence errors. Do not commit yet.

---

### Task 15 — `useLibraryRounds` hook + tests

**Files:**

- Create: `src/games/word-spell/useLibraryRounds.ts`
- Create: `src/games/word-spell/useLibraryRounds.test.tsx`

- [ ] **Step 1: Write failing hook tests**

```tsx
// src/games/word-spell/useLibraryRounds.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLibraryRounds } from './useLibraryRounds';
import type { WordSpellConfig } from './types';
import { __resetChunkCacheForTests } from '@/data/words';

const baseConfig: WordSpellConfig = {
  gameId: 'test',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: true,
  ttsEnabled: false,
  mode: 'picture',
  tileUnit: 'letter',
};

afterEach(() => __resetChunkCacheForTests());

describe('useLibraryRounds', () => {
  it('returns explicit rounds synchronously when source is absent', () => {
    const rounds = [{ word: 'cat' }, { word: 'dog' }];
    const { result } = renderHook(() =>
      useLibraryRounds({ ...baseConfig, rounds }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rounds).toBe(rounds);
  });

  it('returns empty rounds when neither rounds nor source is set', () => {
    const { result } = renderHook(() => useLibraryRounds(baseConfig));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.rounds).toEqual([]);
  });

  it('resolves library rounds from a filter when source is set', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rounds).toHaveLength(3);
    for (const r of result.current.rounds) {
      expect(r.word).toBeDefined();
    }
  });

  it('respects explicit source.limit over totalRounds', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 10,
      source: {
        type: 'word-library',
        filter: { region: 'aus', level: 1 },
        limit: 2,
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.rounds).toHaveLength(2);
  });

  it('surfaces usedFallback when the filter falls back to AUS', async () => {
    const config: WordSpellConfig = {
      ...baseConfig,
      totalRounds: 3,
      source: {
        type: 'word-library',
        filter: { region: 'uk', level: 1 },
      },
    };
    const { result } = renderHook(() => useLibraryRounds(config));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.usedFallback).toEqual({
      from: 'uk',
      to: 'aus',
    });
  });
});
```

- [ ] **Step 2: Run tests — expected to fail**

Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx`
Expected: fails — module missing.

- [ ] **Step 3: Implement the hook**

```ts
// src/games/word-spell/useLibraryRounds.ts
import { useEffect, useState } from 'react';
import { filterWords, toWordSpellRound } from '@/data/words';
import type { Region } from '@/data/words';
import type { WordSpellConfig, WordSpellRound } from './types';

interface LibraryRoundsState {
  rounds: WordSpellRound[];
  isLoading: boolean;
  usedFallback?: { from: Region; to: 'aus' };
}

const initialStateFor = (
  config: WordSpellConfig,
): LibraryRoundsState => {
  if (config.source) return { rounds: [], isLoading: true };
  return { rounds: config.rounds ?? [], isLoading: false };
};

export const useLibraryRounds = (
  config: WordSpellConfig,
): LibraryRoundsState => {
  const [state, setState] = useState<LibraryRoundsState>(() =>
    initialStateFor(config),
  );

  useEffect(() => {
    if (config.rounds && config.rounds.length > 0) {
      setState({ rounds: config.rounds, isLoading: false });
      return;
    }
    if (!config.source) {
      setState({ rounds: [], isLoading: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true }));

    void (async () => {
      const result = await filterWords(config.source!.filter);
      if (cancelled) return;
      const limit =
        config.source!.limit ??
        config.totalRounds ??
        result.hits.length;
      const picked = result.hits.slice(0, limit).map(toWordSpellRound);
      setState({
        rounds: picked,
        isLoading: false,
        usedFallback: result.usedFallback,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [config.rounds, config.source, config.totalRounds]);

  return state;
};
```

- [ ] **Step 4: Run hook tests**

Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx`
Expected: all green.

- [ ] **Step 5: Do NOT commit yet — move to Task 16.**

---

### Task 16 — Wire `useLibraryRounds` into `WordSpell`

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

- [ ] **Step 1: Replace the top-level `WordSpell` export**

Keep `WordSpellSession` and the helper functions (`segmentsForWord`,
`buildTilesAndZones`) unchanged. Replace the exported `WordSpell` arrow
function (currently at line 235):

```tsx
export const WordSpell = ({
  config,
  initialState,
  sessionId,
  seed,
}: WordSpellProps) => {
  const { rounds: resolvedRounds, isLoading } =
    useLibraryRounds(config);

  const resolvedConfig = useMemo<WordSpellConfig>(
    () => ({ ...config, rounds: resolvedRounds }),
    [config, resolvedRounds],
  );

  const roundsInOrder = resolvedConfig.roundsInOrder === true;
  const [sessionEpoch, setSessionEpoch] = useState(0);

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    return buildRoundOrder(resolvedRounds.length, roundsInOrder, seed);
  }, [resolvedRounds.length, roundsInOrder, seed, sessionEpoch]);

  const firstConfigIndex = roundOrder[0];
  const round0 =
    firstConfigIndex === undefined
      ? undefined
      : resolvedRounds[firstConfigIndex];
  const roundWord = round0?.word.trim() ? round0.word : '';

  const { tiles, zones } = useMemo(() => {
    if (!roundWord)
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };

    if (round0?.gaps && round0.gaps.length > 0) {
      return buildSentenceGapRound(round0.gaps);
    }

    return buildTilesAndZones(roundWord, resolvedConfig.tileUnit);
  }, [roundWord, resolvedConfig.tileUnit, round0]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: resolvedConfig.gameId,
      inputMethod: resolvedConfig.inputMethod,
      wrongTileBehavior: resolvedConfig.wrongTileBehavior,
      tileBankMode: resolvedConfig.tileBankMode,
      distractorCount: resolvedConfig.distractorCount,
      totalRounds: resolvedRounds.length,
      roundsInOrder: resolvedConfig.roundsInOrder,
      ttsEnabled: resolvedConfig.ttsEnabled,
      touchKeyboardInputMode: 'text',
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction:
        resolvedConfig.mode === 'scramble' ||
        resolvedConfig.mode === 'sentence-gap'
          ? 'free-swap'
          : 'ordered',
    }),
    [
      resolvedConfig.gameId,
      resolvedConfig.inputMethod,
      resolvedConfig.wrongTileBehavior,
      resolvedConfig.tileBankMode,
      resolvedConfig.distractorCount,
      resolvedRounds.length,
      resolvedConfig.roundsInOrder,
      resolvedConfig.ttsEnabled,
      resolvedConfig.mode,
      tiles,
      zones,
    ],
  );

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[200px] w-full items-center justify-center text-foreground"
      >
        Loading words…
      </div>
    );
  }

  if (!round0) return null;

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <WordSpellSession
        wordSpellConfig={resolvedConfig}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
};
```

- [ ] **Step 2: Add the import**

At the top of `src/games/word-spell/WordSpell/WordSpell.tsx`, add:

```ts
import { useLibraryRounds } from '../useLibraryRounds';
```

- [ ] **Step 3: Typecheck**

Run: `yarn typecheck`
Expected: passes.

- [ ] **Step 4: Run existing WordSpell tests**

Run: `yarn test src/games/word-spell/`
Expected: legacy `WordSpell.test.tsx` passes unchanged (hand-authored
`rounds` path short-circuits the hook). New `useLibraryRounds.test.tsx`
passes.

- [ ] **Step 5: Commit Tasks 14 + 15 + 16 together**

```bash
git add \
  src/games/word-spell/types.ts \
  src/games/word-spell/useLibraryRounds.ts \
  src/games/word-spell/useLibraryRounds.test.tsx \
  src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat(word-spell): resolve rounds from word library filter"
```

---

### Task 17 — `LibrarySourced` Storybook story

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.stories.tsx`

- [ ] **Step 1: Append a new story**

Below the last existing story export:

```tsx
export const LibrarySourced: Story = {
  args: {
    config: {
      gameId: 'word-spell-library-sourced',
      component: 'WordSpell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 4,
      roundsInOrder: true,
      ttsEnabled: false,
      mode: 'recall',
      tileUnit: 'letter',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          levels: [1, 2],
          syllableCountEq: 1,
        },
      },
    },
  },
};
```

- [ ] **Step 2: Start Storybook + run story tests**

Run `yarn storybook` in one terminal.
Run: `yarn test:storybook --url http://localhost:6006`
Expected: `LibrarySourced` story renders — brief loading state then 4 tiles
in the bank drawn from AUS levels 1–2.

If dev-server is unavailable in the environment, skip this step and
document the skip in the commit: `SKIP_STORYBOOK=1` when pushing.

- [ ] **Step 3: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.stories.tsx
git commit -m "feat(word-spell): add library-sourced story"
```

---

### Task 18 — Final gate

**Files:** none.

- [ ] **Step 1: Lint**

Run: `yarn lint`
Expected: passes.

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: passes.

- [ ] **Step 3: Unit tests**

Run: `yarn test`
Expected: all 556+ existing tests plus the new phonics-library suite pass.

- [ ] **Step 4: Storybook interaction tests (optional pre-push)**

Run: `yarn storybook` in one terminal, then `yarn test:storybook` in
another.
Expected: passes, including the new `LibrarySourced` story.

- [ ] **Step 5: VR tests (optional)**

If WordSpell's VR suite flags the new loading state as a diff, decide
whether the flicker is expected. If yes, run `yarn test:vr:update`, commit
updated baselines, then push. If no, investigate before pushing.

- [ ] **Step 6: Confirm with user before pushing.**

Push requires the user's explicit go-ahead per project memory. Do not
force-push. Do not skip hooks unless the user authorizes a specific
`SKIP_*` flag with a documented reason.

---

## Post-implementation notes

- **P2 unlocks the Tier 2 enrichment backlog.** The ~650 codegen-flagged
  entries in `2026-04-11-phonics-word-library_codegen-review.md` are all
  authored as Tier 1 only (graphemes split structurally, but `ipa` is empty
  and phonemes are `''`). P2's Storybook form is the natural place to walk
  through this list and fill in the IPA + phonemes.
- **P3 adds `WordSpellSource = { type: 'word-bag', bagId }`.** The
  `WordSpellSource` discriminated union type in `src/games/word-spell/types.ts`
  already anticipates this — P3 extends the union and the `useLibraryRounds`
  hook's `useEffect` gains a second branch.
- **UK/US/BR curricula stay empty until hand-seeded via P2.** AUS fallback
  covers the gap during that period.
