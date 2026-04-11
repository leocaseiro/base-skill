# Phonics Word Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only, lazy-loaded phonics word library (types, filter
API, ~100-word seed corpus, build-time invariants) plus a non-breaking
WordSpell integration that lets a config resolve rounds from a filter instead
of a hand-authored `rounds[]` array.

**Architecture:** New module at `src/data/words/` with six JSON chunk files
under `chunks/`, an async `filterWords()` API backed by `import.meta.glob` and
a module-level in-memory cache, a `toWordSpellRound()` adapter, and a
`useLibraryRounds()` hook that WordSpell mounts above its existing render
logic so the session code is untouched.

**Tech Stack:** TypeScript, React 19, Vite (`import.meta.glob`), Vitest, IPA
Unicode characters, existing WordSpell `AnswerGame` primitive.

**Spec:** [2026-04-11-phonics-word-library-design.md](../specs/2026-04-11-phonics-word-library-design.md)

---

## File Map

### New files

- `src/data/words/types.ts` — `Region`, `PhonemeByRegion`, `Grapheme`, `WordEntry`, `WordFilter` types
- `src/data/words/phases.ts` — per-region `PHASES` table
- `src/data/words/phoneme-codes.ts` — teacher-friendly phoneme code ↔ IPA map
- `src/data/words/filter.ts` — `entryMatches()` + async `filterWords()` + chunk cache
- `src/data/words/filter.test.ts` — unit tests for both
- `src/data/words/adapters.ts` — `toWordSpellRound()`
- `src/data/words/adapters.test.ts` — unit tests
- `src/data/words/words.test.ts` — build-time invariant harness over every chunk JSON
- `src/data/words/index.ts` — public API re-exports
- `src/data/words/chunks/core.json` — 40 Phase 2 CVC words
- `src/data/words/chunks/digraphs.json` — 20 consonant digraph words
- `src/data/words/chunks/long-vowels.json` — 15 vowel digraph/trigraph words
- `src/data/words/chunks/split-digraphs.json` — 10 magic-e words
- `src/data/words/chunks/multi-syllable.json` — 10 2–3-syllable words
- `src/data/words/chunks/regional.json` — 7 region-variant showcase words
- `src/games/word-spell/useLibraryRounds.ts` — hook that resolves `config.source` into `WordSpellRound[]`
- `src/games/word-spell/useLibraryRounds.test.tsx` — hook unit tests

### Modified files

- `src/games/word-spell/types.ts` — make `rounds` optional; add `source` field
- `src/games/word-spell/WordSpell/WordSpell.tsx` — mount `useLibraryRounds`, render loading state
- `src/games/word-spell/WordSpell/WordSpell.stories.tsx` — add `LibrarySourced` story

---

## Conventions

- **IPA is broad phonemic** (no narrow detail). Store symbols, not codes.
- **`syllables.join('') === word`** is the primary invariant. Enforced by `words.test.ts`.
- **`graphemes.map(g=>g.g).join('') === word`** is the second invariant. Also enforced.
- **Digraphs are one grapheme.** `ch` in `child` is `{ g: 'ch', p: 'tʃ' }`, not two entries.
- **Silent letters** get `p: ''` and still contribute to `word`/`syllables`.
- **`regions` omitted** means the entry is valid in all four regions.
- **Canonical `ipa` string** when all four regions pronounce the word identically; object form only when they differ.
- **Per-region phoneme in `graphemes[].p`** only for the specific phonemes that differ.
- **Every code file uses named exports** (no `export default`) per project convention in `eslint.config.js`.
- **Arrow-function React components** (`const X = () => {}`) per [CLAUDE.md](../../../CLAUDE.md).

---

## Steps

### Task 1 — Types module

**Files:**

- Create: `src/data/words/types.ts`

- [ ] **Step 1 — Create `types.ts`**

  ```ts
  // src/data/words/types.ts

  export type Region = 'aus' | 'uk' | 'us' | 'br';

  export const ALL_REGIONS: readonly Region[] = [
    'aus',
    'uk',
    'us',
    'br',
  ];

  export interface PhonemeByRegion {
    aus?: string;
    uk?: string;
    us?: string;
    br?: string;
  }

  export interface Grapheme {
    /** The letters this grapheme covers, e.g. 'c', 'ch', 'igh', 'a_e'. */
    g: string;
    /** Phoneme in IPA. String when identical across regions; object per region when not. Empty string for silent letters. */
    p: string | PhonemeByRegion;
    /** Start/end index in the surface word. Set only for split digraphs (a_e, i_e). */
    span?: [number, number];
  }

  export interface WordEntry {
    /** Canonical surface spelling. */
    word: string;
    /** Omitted = valid in all regions. */
    regions?: Region[];
    /** Linked alternate spellings, e.g. aluminium ↔ aluminum. Bidirectional. */
    variants?: string[];
    /** Syllable chunks. length === syllable count. join('') === word. */
    syllables: string[];
    /** Broad phonemic transcription. String when identical across regions. */
    ipa: string | Partial<Record<Region, string>>;
    /** Ordered grapheme → phoneme mapping. Concatenating `g` must equal `word`. */
    graphemes: Grapheme[];
    /** Per-region phase memberships, e.g. { uk: ['phase2'], aus: ['f.unit1'] }. */
    phases?: Partial<Record<Region, string[]>>;
    /** Freeform tags: 'cvc', 'animal', 'food'. */
    tags?: string[];
  }

  export interface WordFilter {
    /** Required. Entries not valid in this region are excluded. */
    region: Region;
    /** OR-match against entry.phases[region]. */
    phases?: string[];
    /** Single grapheme string, e.g. 'c' or 'ch'. */
    grapheme?: string;
    /** Single IPA phoneme symbol, e.g. 'ʃ' or 'k'. */
    phoneme?: string;
    syllablesEq?: number;
    syllablesMin?: number;
    syllablesMax?: number;
    /** OR-match. */
    tags?: string[];
  }
  ```

- [ ] **Step 2 — Typecheck**

  Run: `cd worktrees/feat-phonics-word-library && yarn typecheck`
  Expected: passes.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/data/words/types.ts
  git commit -m "feat(words): add word library types"
  ```

---

### Task 2 — Phases + phoneme codes + stub index

**Files:**

- Create: `src/data/words/phases.ts`
- Create: `src/data/words/phoneme-codes.ts`
- Create: `src/data/words/index.ts`

- [ ] **Step 1 — Create `phases.ts`**

  ```ts
  // src/data/words/phases.ts
  import type { Region } from './types';

  export interface PhaseDef {
    id: string;
    label: string;
    description?: string;
  }

  export const PHASES: Record<Region, PhaseDef[]> = {
    uk: [
      {
        id: 'phase2',
        label: 'Phase 2',
        description: 'SATPIN + mdgock + ckeur + hbffllss',
      },
      {
        id: 'phase3',
        label: 'Phase 3',
        description:
          'Consonant digraphs (ch sh th ng) + vowel digraphs',
      },
      {
        id: 'phase4',
        label: 'Phase 4',
        description: 'Consonant clusters with existing GPCs',
      },
      {
        id: 'phase5',
        label: 'Phase 5',
        description: 'Alternative spellings & split digraphs',
      },
    ],
    aus: [
      {
        id: 'f.unit1',
        label: 'Foundation Unit 1',
        description: 'SATPIN',
      },
      {
        id: 'f.unit2',
        label: 'Foundation Unit 2',
        description: 'mdgock',
      },
      {
        id: 'f.unit3',
        label: 'Foundation Unit 3',
        description: 'ckeur + hbffllss',
      },
      {
        id: 'f.unit4',
        label: 'Foundation Unit 4',
        description: 'jvwxyzzzqu + simple digraphs',
      },
      {
        id: 'f.unit5',
        label: 'Foundation Unit 5',
        description: 'ch sh th ng',
      },
      {
        id: 'f.unit6',
        label: 'Foundation Unit 6',
        description: 'ai ee oa',
      },
      {
        id: 'f.unit7',
        label: 'Foundation Unit 7',
        description: 'igh oo ar or',
      },
      {
        id: 'y1.unit1',
        label: 'Year 1 Unit 1',
        description: 'ur ow oi',
      },
      {
        id: 'y1.unit2',
        label: 'Year 1 Unit 2',
        description: 'Split digraphs a_e i_e o_e u_e',
      },
      {
        id: 'y1.unit3',
        label: 'Year 1 Unit 3',
        description: 'Multi-syllable CVC + compound words',
      },
    ],
    us: [
      {
        id: 'k.wk1',
        label: 'Kindergarten Week 1',
        description: 'Short vowel CVC (a)',
      },
      {
        id: 'k.wk4',
        label: 'Kindergarten Week 4',
        description: 'Short vowel CVC (i, o, u, e)',
      },
      {
        id: 'k.wk8',
        label: 'Kindergarten Week 8',
        description: 'Consonant digraphs',
      },
      {
        id: 'k.wk12',
        label: 'Kindergarten Week 12',
        description: 'Long-vowel digraphs',
      },
      {
        id: 'g1.wk4',
        label: 'Grade 1 Week 4',
        description: 'Split digraphs (silent e)',
      },
      {
        id: 'g1.wk8',
        label: 'Grade 1 Week 8',
        description: 'Multi-syllable words',
      },
    ],
    br: [
      {
        id: 'bncc.vogais',
        label: 'Vogais',
        description: 'BNCC — vogais orais',
      },
      {
        id: 'bncc.silabas-simples',
        label: 'Sílabas simples',
        description: 'BNCC — sílabas simples',
      },
      {
        id: 'bncc.digrafos',
        label: 'Dígrafos',
        description: 'BNCC — dígrafos ch lh nh rr ss',
      },
    ],
  };

  export const ALL_PHASE_IDS: ReadonlySet<string> = new Set(
    Object.values(PHASES).flatMap((defs) => defs.map((d) => `${d.id}`)),
  );

  export const isPhaseIdForRegion = (
    region: Region,
    phaseId: string,
  ): boolean => PHASES[region].some((d) => d.id === phaseId);
  ```

- [ ] **Step 2 — Create `phoneme-codes.ts`**

  ```ts
  // src/data/words/phoneme-codes.ts

  /**
   * Teacher-friendly code → IPA. Used by the (future) filter UI to show
   * human-readable labels. The data model never stores codes — only IPA.
   */
  export const PHONEME_CODE_TO_IPA: Record<string, string> = {
    // Consonants
    sh: 'ʃ',
    zh: 'ʒ',
    ch: 'tʃ',
    j: 'dʒ',
    ng: 'ŋ',
    th_voiceless: 'θ',
    th_voiced: 'ð',
    // Short vowels
    short_a: 'æ',
    short_e: 'ɛ',
    short_i: 'ɪ',
    short_o: 'ɒ',
    short_u: 'ʌ',
    schwa: 'ə',
    // Long vowels / diphthongs
    long_a: 'eɪ',
    long_e: 'iː',
    long_i: 'aɪ',
    long_o: 'əʊ',
    long_u: 'juː',
    oo_short: 'ʊ',
    oo_long: 'uː',
    ow: 'aʊ',
    oi: 'ɔɪ',
    // R-controlled
    ar: 'ɑː',
    or: 'ɔː',
    ur: 'ɜː',
    air: 'ɛə',
    ear: 'ɪə',
  };

  export const IPA_TO_PHONEME_CODE: Record<string, string> =
    Object.fromEntries(
      Object.entries(PHONEME_CODE_TO_IPA).map(([code, ipa]) => [
        ipa,
        code,
      ]),
    );
  ```

- [ ] **Step 3 — Create stub `index.ts`**

  ```ts
  // src/data/words/index.ts
  export type {
    Region,
    PhonemeByRegion,
    Grapheme,
    WordEntry,
    WordFilter,
  } from './types';
  export { ALL_REGIONS } from './types';
  export { PHASES, ALL_PHASE_IDS, isPhaseIdForRegion } from './phases';
  export type { PhaseDef } from './phases';
  export {
    PHONEME_CODE_TO_IPA,
    IPA_TO_PHONEME_CODE,
  } from './phoneme-codes';
  ```

- [ ] **Step 4 — Typecheck**

  Run: `yarn typecheck`
  Expected: passes.

- [ ] **Step 5 — Commit**

  ```bash
  git add src/data/words/phases.ts src/data/words/phoneme-codes.ts src/data/words/index.ts
  git commit -m "feat(words): add phases and phoneme code tables"
  ```

---

### Task 3 — `entryMatches` pure function + tests

**Files:**

- Create: `src/data/words/filter.ts` (partial — `entryMatches` only)
- Create: `src/data/words/filter.test.ts` (partial — `entryMatches` only)

- [ ] **Step 1 — Write `filter.test.ts` with failing tests for `entryMatches`**

  ```ts
  // src/data/words/filter.test.ts
  import { describe, expect, it } from 'vitest';
  import { entryMatches } from './filter';
  import type { WordEntry } from './types';

  const cat: WordEntry = {
    word: 'cat',
    syllables: ['cat'],
    ipa: '/kæt/',
    graphemes: [
      { g: 'c', p: 'k' },
      { g: 'a', p: 'æ' },
      { g: 't', p: 't' },
    ],
    phases: { uk: ['phase2'], aus: ['f.unit1'], us: ['k.wk1'] },
    tags: ['cvc', 'animal'],
  };

  const city: WordEntry = {
    word: 'city',
    syllables: ['ci', 'ty'],
    ipa: '/ˈsɪti/',
    graphemes: [
      { g: 'c', p: 's' },
      { g: 'i', p: 'ɪ' },
      { g: 't', p: 't' },
      { g: 'y', p: 'i' },
    ],
    phases: { uk: ['phase5'] },
  };

  const child: WordEntry = {
    word: 'child',
    syllables: ['child'],
    ipa: '/tʃaɪld/',
    graphemes: [
      { g: 'ch', p: 'tʃ' },
      { g: 'i', p: 'aɪ' },
      { g: 'l', p: 'l' },
      { g: 'd', p: 'd' },
    ],
    phases: { uk: ['phase3'] },
  };

  const aluminium: WordEntry = {
    word: 'aluminium',
    regions: ['aus', 'uk'],
    variants: ['aluminum'],
    syllables: ['al', 'u', 'min', 'i', 'um'],
    ipa: { aus: '/ˌæljəˈmɪniəm/', uk: '/ˌæljəˈmɪniəm/' },
    graphemes: [
      { g: 'a', p: 'æ' },
      { g: 'l', p: 'l' },
      { g: 'u', p: 'j' },
      { g: 'm', p: 'm' },
      { g: 'i', p: 'ɪ' },
      { g: 'n', p: 'n' },
      { g: 'i', p: 'i' },
      { g: 'u', p: 'ə' },
      { g: 'm', p: 'm' },
    ],
    phases: { uk: ['phase5'] },
  };

  describe('entryMatches', () => {
    describe('region', () => {
      it('includes entries with omitted regions for every region', () => {
        expect(entryMatches(cat, { region: 'aus' })).toBe(true);
        expect(entryMatches(cat, { region: 'uk' })).toBe(true);
        expect(entryMatches(cat, { region: 'us' })).toBe(true);
        expect(entryMatches(cat, { region: 'br' })).toBe(true);
      });

      it('excludes entries whose regions array lacks the selected region', () => {
        expect(entryMatches(aluminium, { region: 'us' })).toBe(false);
        expect(entryMatches(aluminium, { region: 'aus' })).toBe(true);
      });
    });

    describe('grapheme + phoneme', () => {
      it('matches when the same grapheme carries the requested phoneme', () => {
        expect(
          entryMatches(cat, {
            region: 'uk',
            grapheme: 'c',
            phoneme: 'k',
          }),
        ).toBe(true);
      });

      it('excludes when the grapheme is spelled differently even if phoneme matches', () => {
        expect(
          entryMatches(child, {
            region: 'uk',
            grapheme: 'c',
            phoneme: 'k',
          }),
        ).toBe(false);
      });

      it('excludes soft c from hard-c lessons', () => {
        expect(
          entryMatches(city, {
            region: 'uk',
            grapheme: 'c',
            phoneme: 'k',
          }),
        ).toBe(false);
      });

      it('matches phoneme-only regardless of grapheme spelling', () => {
        expect(entryMatches(cat, { region: 'uk', phoneme: 'k' })).toBe(
          true,
        );
        expect(
          entryMatches(child, { region: 'uk', phoneme: 'tʃ' }),
        ).toBe(true);
      });

      it('matches grapheme-only regardless of phoneme', () => {
        expect(
          entryMatches(city, { region: 'uk', grapheme: 'c' }),
        ).toBe(true);
      });
    });

    describe('syllables', () => {
      it('matches exact count', () => {
        expect(
          entryMatches(cat, { region: 'uk', syllablesEq: 1 }),
        ).toBe(true);
        expect(
          entryMatches(city, { region: 'uk', syllablesEq: 1 }),
        ).toBe(false);
        expect(
          entryMatches(city, { region: 'uk', syllablesEq: 2 }),
        ).toBe(true);
      });

      it('matches min/max range', () => {
        expect(
          entryMatches(aluminium, {
            region: 'uk',
            syllablesMin: 3,
            syllablesMax: 6,
          }),
        ).toBe(true);
        expect(
          entryMatches(cat, { region: 'uk', syllablesMin: 2 }),
        ).toBe(false);
      });
    });

    describe('phases', () => {
      it('matches against the selected region only', () => {
        expect(
          entryMatches(cat, { region: 'uk', phases: ['phase2'] }),
        ).toBe(true);
        expect(
          entryMatches(cat, { region: 'aus', phases: ['phase2'] }),
        ).toBe(false);
        expect(
          entryMatches(cat, { region: 'aus', phases: ['f.unit1'] }),
        ).toBe(true);
      });
    });

    describe('tags', () => {
      it('or-matches any tag intersection', () => {
        expect(
          entryMatches(cat, { region: 'uk', tags: ['animal'] }),
        ).toBe(true);
        expect(
          entryMatches(cat, { region: 'uk', tags: ['food'] }),
        ).toBe(false);
        expect(
          entryMatches(cat, { region: 'uk', tags: ['food', 'animal'] }),
        ).toBe(true);
      });
    });
  });
  ```

- [ ] **Step 2 — Run tests to confirm they fail**

  Run: `yarn test src/data/words/filter.test.ts`
  Expected: fails with "Cannot find module './filter'" or equivalent.

- [ ] **Step 3 — Create `filter.ts` with just `entryMatches`**

  ```ts
  // src/data/words/filter.ts
  import { ALL_REGIONS, type Region } from './types';
  import type { Grapheme, WordEntry, WordFilter } from './types';

  const resolvePhoneme = (g: Grapheme, region: Region): string => {
    if (typeof g.p === 'string') return g.p;
    return g.p[region] ?? '';
  };

  const entryRegions = (entry: WordEntry): readonly Region[] =>
    entry.regions ?? ALL_REGIONS;

  export const entryMatches = (
    entry: WordEntry,
    filter: WordFilter,
  ): boolean => {
    if (!entryRegions(entry).includes(filter.region)) return false;

    if (filter.syllablesEq !== undefined) {
      if (entry.syllables.length !== filter.syllablesEq) return false;
    }
    if (filter.syllablesMin !== undefined) {
      if (entry.syllables.length < filter.syllablesMin) return false;
    }
    if (filter.syllablesMax !== undefined) {
      if (entry.syllables.length > filter.syllablesMax) return false;
    }

    if (filter.phases && filter.phases.length > 0) {
      const entryPhases = entry.phases?.[filter.region] ?? [];
      const hit = filter.phases.some((p) => entryPhases.includes(p));
      if (!hit) return false;
    }

    if (filter.tags && filter.tags.length > 0) {
      const entryTags = entry.tags ?? [];
      const hit = filter.tags.some((t) => entryTags.includes(t));
      if (!hit) return false;
    }

    if (filter.grapheme !== undefined || filter.phoneme !== undefined) {
      const match = entry.graphemes.some((g) => {
        if (filter.grapheme !== undefined && g.g !== filter.grapheme) {
          return false;
        }
        if (filter.phoneme !== undefined) {
          if (resolvePhoneme(g, filter.region) !== filter.phoneme)
            return false;
        }
        return true;
      });
      if (!match) return false;
    }

    return true;
  };
  ```

- [ ] **Step 4 — Run tests to confirm they pass**

  Run: `yarn test src/data/words/filter.test.ts`
  Expected: all green.

- [ ] **Step 5 — Commit**

  ```bash
  git add src/data/words/filter.ts src/data/words/filter.test.ts
  git commit -m "feat(words): add entryMatches filter predicate"
  ```

---

### Task 4 — `toWordSpellRound` adapter + tests

**Files:**

- Create: `src/data/words/adapters.ts`
- Create: `src/data/words/adapters.test.ts`

- [ ] **Step 1 — Write failing adapter test**

  ```ts
  // src/data/words/adapters.test.ts
  import { describe, expect, it } from 'vitest';
  import { toWordSpellRound } from './adapters';
  import type { WordEntry } from './types';

  describe('toWordSpellRound', () => {
    it('joins syllables with dash so syllable mode splits correctly', () => {
      const entry: WordEntry = {
        word: 'sunset',
        syllables: ['sun', 'set'],
        ipa: '/ˈsʌnsɛt/',
        graphemes: [
          { g: 's', p: 's' },
          { g: 'u', p: 'ʌ' },
          { g: 'n', p: 'n' },
          { g: 's', p: 's' },
          { g: 'e', p: 'ɛ' },
          { g: 't', p: 't' },
        ],
      };
      expect(toWordSpellRound(entry)).toEqual({ word: 'sun-set' });
    });

    it('passes single-syllable words through without a dash', () => {
      const entry: WordEntry = {
        word: 'cat',
        syllables: ['cat'],
        ipa: '/kæt/',
        graphemes: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      };
      expect(toWordSpellRound(entry)).toEqual({ word: 'cat' });
    });
  });
  ```

- [ ] **Step 2 — Run test to confirm it fails**

  Run: `yarn test src/data/words/adapters.test.ts`
  Expected: fails with missing module.

- [ ] **Step 3 — Create `adapters.ts`**

  ```ts
  // src/data/words/adapters.ts
  import type { WordEntry } from './types';
  import type { WordSpellRound } from '@/games/word-spell/types';

  /**
   * Join syllables with '-' so WordSpell's existing syllable-mode split regex
   * at WordSpell.tsx renders chunks correctly. Letter mode strips the dash
   * via the same regex.
   */
  export const toWordSpellRound = (
    entry: WordEntry,
  ): WordSpellRound => ({
    word: entry.syllables.join('-'),
  });
  ```

- [ ] **Step 4 — Run tests**

  Run: `yarn test src/data/words/adapters.test.ts`
  Expected: green.

- [ ] **Step 5 — Re-export from `index.ts`**

  Append to `src/data/words/index.ts`:

  ```ts
  export { toWordSpellRound } from './adapters';
  ```

- [ ] **Step 6 — Commit**

  ```bash
  git add src/data/words/adapters.ts src/data/words/adapters.test.ts src/data/words/index.ts
  git commit -m "feat(words): add toWordSpellRound adapter"
  ```

---

### Task 5 — Chunk invariant harness (runs before any chunks exist)

**Files:**

- Create: `src/data/words/words.test.ts`
- Create: `src/data/words/chunks/.gitkeep` (empty placeholder so the dir exists)

- [ ] **Step 1 — Create empty chunks dir**

  ```bash
  mkdir -p src/data/words/chunks
  touch src/data/words/chunks/.gitkeep
  ```

- [ ] **Step 2 — Create `words.test.ts`**

  ```ts
  // src/data/words/words.test.ts
  import { readdirSync, readFileSync, existsSync } from 'node:fs';
  import { join } from 'node:path';
  import { describe, expect, it } from 'vitest';
  import { ALL_REGIONS, type Region } from './types';
  import type { Grapheme, WordEntry } from './types';
  import { PHASES } from './phases';

  const chunksDir = join(__dirname, 'chunks');

  const chunks = existsSync(chunksDir)
    ? readdirSync(chunksDir).filter((f) => f.endsWith('.json'))
    : [];

  const loadChunk = (file: string): WordEntry[] =>
    JSON.parse(
      readFileSync(join(chunksDir, file), 'utf-8'),
    ) as WordEntry[];

  const regionsOf = (entry: WordEntry): readonly Region[] =>
    entry.regions ?? ALL_REGIONS;

  // Gather every entry up front so cross-chunk checks (variants backlink,
  // duplicate surface spelling) can see everything.
  const everyEntry: Array<{ chunk: string; entry: WordEntry }> =
    chunks.flatMap((chunk) =>
      loadChunk(chunk).map((entry) => ({ chunk, entry })),
    );

  describe('word library chunks', () => {
    it('has at least one chunk once seeding begins', () => {
      // Intentionally permissive while the harness is scaffolding. Chunk
      // tasks flip this to toBeGreaterThan(0) once core.json lands.
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });

    describe.each(chunks)('chunk %s', (chunkFile) => {
      const entries = loadChunk(chunkFile);

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — syllables.join() === word',
        (_, entry) => {
          expect(entry.syllables.join('')).toBe(entry.word);
        },
      );

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — graphemes concatenate to word',
        (_, entry) => {
          expect(entry.graphemes.map((g) => g.g).join('')).toBe(
            entry.word,
          );
        },
      );

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — ipa object covers every region in regions',
        (_, entry) => {
          if (typeof entry.ipa === 'string') return;
          for (const region of regionsOf(entry)) {
            expect(entry.ipa[region]).toBeDefined();
          }
        },
      );

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — per-region grapheme phonemes cover every region',
        (_, entry) => {
          for (const g of entry.graphemes) {
            if (typeof g.p === 'string') continue;
            for (const region of regionsOf(entry)) {
              expect(g.p[region]).toBeDefined();
            }
          }
        },
      );

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — every phase id exists in phases.ts for its region',
        (_, entry) => {
          if (!entry.phases) return;
          for (const [region, ids] of Object.entries(entry.phases)) {
            const known = new Set(
              PHASES[region as Region].map((p) => p.id),
            );
            for (const id of ids ?? []) {
              expect(known.has(id)).toBe(true);
            }
          }
        },
      );

      it.each(entries.map((e) => [e.word, e] as const))(
        '"%s" — no grapheme spans a syllable boundary',
        (_, entry) => {
          // Build cumulative character indices of each syllable end.
          const boundaries = new Set<number>();
          let pos = 0;
          for (const s of entry.syllables) {
            pos += s.length;
            boundaries.add(pos);
          }

          let cursor = 0;
          for (const g of entry.graphemes) {
            const start = cursor;
            const end = cursor + g.g.replace('_', '').length; // split digraph uses '_' marker
            cursor = end;
            // A grapheme crosses a boundary if any boundary strictly lies
            // between start and end — exclusive of end (end == boundary is OK).
            for (const b of boundaries) {
              if (b > start && b < end) {
                throw new Error(
                  `grapheme '${g.g}' in '${entry.word}' crosses syllable boundary at index ${b}`,
                );
              }
            }
          }
        },
      );
    });

    describe('cross-chunk invariants', () => {
      it('variants links are bidirectional', () => {
        const bySpelling = new Map<string, WordEntry>();
        for (const { entry } of everyEntry)
          bySpelling.set(entry.word, entry);
        for (const { entry } of everyEntry) {
          for (const variant of entry.variants ?? []) {
            const other = bySpelling.get(variant);
            expect(
              other,
              `${entry.word}→${variant} variant missing`,
            ).toBeDefined();
            expect(
              other!.variants?.includes(entry.word),
              `${variant} does not link back to ${entry.word}`,
            ).toBe(true);
          }
        }
      });

      it('no duplicate word within overlapping region sets', () => {
        const seen = new Map<string, Set<Region>>();
        for (const { entry } of everyEntry) {
          const regions = new Set(regionsOf(entry));
          const prior = seen.get(entry.word);
          if (prior) {
            for (const r of regions) {
              expect(
                prior.has(r),
                `${entry.word} duplicated in region ${r}`,
              ).toBe(false);
            }
            for (const r of regions) prior.add(r);
          } else {
            seen.set(entry.word, new Set(regions));
          }
        }
      });
    });
  });
  ```

- [ ] **Step 3 — Run tests**

  Run: `yarn test src/data/words/words.test.ts`
  Expected: passes (zero chunks → zero per-chunk tests; cross-chunk checks
  iterate an empty list and also pass).

- [ ] **Step 4 — Commit**

  ```bash
  git add src/data/words/words.test.ts src/data/words/chunks/.gitkeep
  git commit -m "feat(words): add chunk invariant harness"
  ```

---

### Task 6 — Seed `core.json` (40 Phase 2 CVC words)

**Files:**

- Create: `src/data/words/chunks/core.json`
- Delete: `src/data/words/chunks/.gitkeep`

- [ ] **Step 1 — Create `core.json`**

  All 40 entries are single-syllable CVC/CVCC with single-letter graphemes.
  Default phases: `uk: ['phase2']`, `aus: ['f.unit1']` for SATPIN and
  `f.unit2`/`f.unit3` for later groups, `us: ['k.wk1']` for short-a,
  `k.wk4` for other short vowels. All `ipa` values are canonical strings
  (same in aus/uk/us; BR omitted from phases).

  ```json
  [
    {
      "word": "sat",
      "syllables": ["sat"],
      "ipa": "/sæt/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "pat",
      "syllables": ["pat"],
      "ipa": "/pæt/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "tap",
      "syllables": ["tap"],
      "ipa": "/tæp/",
      "graphemes": [
        { "g": "t", "p": "t" },
        { "g": "a", "p": "æ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "pin",
      "syllables": ["pin"],
      "ipa": "/pɪn/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "nip",
      "syllables": ["nip"],
      "ipa": "/nɪp/",
      "graphemes": [
        { "g": "n", "p": "n" },
        { "g": "i", "p": "ɪ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "tin",
      "syllables": ["tin"],
      "ipa": "/tɪn/",
      "graphemes": [
        { "g": "t", "p": "t" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit1"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "cat",
      "syllables": ["cat"],
      "ipa": "/kæt/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc", "animal"]
    },
    {
      "word": "mat",
      "syllables": ["mat"],
      "ipa": "/mæt/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "map",
      "syllables": ["map"],
      "ipa": "/mæp/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "a", "p": "æ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk1"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "dog",
      "syllables": ["dog"],
      "ipa": "/dɒɡ/",
      "graphemes": [
        { "g": "d", "p": "d" },
        { "g": "o", "p": "ɒ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc", "animal"]
    },
    {
      "word": "god",
      "syllables": ["god"],
      "ipa": "/ɡɒd/",
      "graphemes": [
        { "g": "g", "p": "ɡ" },
        { "g": "o", "p": "ɒ" },
        { "g": "d", "p": "d" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "got",
      "syllables": ["got"],
      "ipa": "/ɡɒt/",
      "graphemes": [
        { "g": "g", "p": "ɡ" },
        { "g": "o", "p": "ɒ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "cot",
      "syllables": ["cot"],
      "ipa": "/kɒt/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "o", "p": "ɒ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "kid",
      "syllables": ["kid"],
      "ipa": "/kɪd/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i", "p": "ɪ" },
        { "g": "d", "p": "d" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "kit",
      "syllables": ["kit"],
      "ipa": "/kɪt/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i", "p": "ɪ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit2"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "duck",
      "syllables": ["duck"],
      "ipa": "/dʌk/",
      "graphemes": [
        { "g": "d", "p": "d" },
        { "g": "u", "p": "ʌ" },
        { "g": "ck", "p": "k" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc", "animal"]
    },
    {
      "word": "sock",
      "syllables": ["sock"],
      "ipa": "/sɒk/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "o", "p": "ɒ" },
        { "g": "ck", "p": "k" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "pick",
      "syllables": ["pick"],
      "ipa": "/pɪk/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "i", "p": "ɪ" },
        { "g": "ck", "p": "k" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "bed",
      "syllables": ["bed"],
      "ipa": "/bɛd/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "e", "p": "ɛ" },
        { "g": "d", "p": "d" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "net",
      "syllables": ["net"],
      "ipa": "/nɛt/",
      "graphemes": [
        { "g": "n", "p": "n" },
        { "g": "e", "p": "ɛ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "peg",
      "syllables": ["peg"],
      "ipa": "/pɛɡ/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "e", "p": "ɛ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "sun",
      "syllables": ["sun"],
      "ipa": "/sʌn/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "u", "p": "ʌ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "run",
      "syllables": ["run"],
      "ipa": "/rʌn/",
      "graphemes": [
        { "g": "r", "p": "r" },
        { "g": "u", "p": "ʌ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "bun",
      "syllables": ["bun"],
      "ipa": "/bʌn/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "u", "p": "ʌ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc", "food"]
    },
    {
      "word": "hot",
      "syllables": ["hot"],
      "ipa": "/hɒt/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "o", "p": "ɒ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "big",
      "syllables": ["big"],
      "ipa": "/bɪɡ/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "i", "p": "ɪ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc"]
    },
    {
      "word": "fish",
      "syllables": ["fish"],
      "ipa": "/fɪʃ/",
      "graphemes": [
        { "g": "f", "p": "f" },
        { "g": "i", "p": "ɪ" },
        { "g": "sh", "p": "ʃ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc", "animal"]
    },
    {
      "word": "huff",
      "syllables": ["huff"],
      "ipa": "/hʌf/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "u", "p": "ʌ" },
        { "g": "ff", "p": "f" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "puff",
      "syllables": ["puff"],
      "ipa": "/pʌf/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "u", "p": "ʌ" },
        { "g": "ff", "p": "f" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "bell",
      "syllables": ["bell"],
      "ipa": "/bɛl/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "e", "p": "ɛ" },
        { "g": "ll", "p": "l" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "doll",
      "syllables": ["doll"],
      "ipa": "/dɒl/",
      "graphemes": [
        { "g": "d", "p": "d" },
        { "g": "o", "p": "ɒ" },
        { "g": "ll", "p": "l" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "kiss",
      "syllables": ["kiss"],
      "ipa": "/kɪs/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i", "p": "ɪ" },
        { "g": "ss", "p": "s" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "hug",
      "syllables": ["hug"],
      "ipa": "/hʌɡ/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "u", "p": "ʌ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "bug",
      "syllables": ["bug"],
      "ipa": "/bʌɡ/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "u", "p": "ʌ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit3"],
        "us": ["k.wk4"]
      },
      "tags": ["cvc", "animal"]
    },
    {
      "word": "jam",
      "syllables": ["jam"],
      "ipa": "/dʒæm/",
      "graphemes": [
        { "g": "j", "p": "dʒ" },
        { "g": "a", "p": "æ" },
        { "g": "m", "p": "m" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk1"]
      },
      "tags": ["food"]
    },
    {
      "word": "van",
      "syllables": ["van"],
      "ipa": "/væn/",
      "graphemes": [
        { "g": "v", "p": "v" },
        { "g": "a", "p": "æ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk1"]
      }
    },
    {
      "word": "wet",
      "syllables": ["wet"],
      "ipa": "/wɛt/",
      "graphemes": [
        { "g": "w", "p": "w" },
        { "g": "e", "p": "ɛ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "win",
      "syllables": ["win"],
      "ipa": "/wɪn/",
      "graphemes": [
        { "g": "w", "p": "w" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "box",
      "syllables": ["box"],
      "ipa": "/bɒks/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "o", "p": "ɒ" },
        { "g": "x", "p": "ks" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk4"]
      }
    },
    {
      "word": "zip",
      "syllables": ["zip"],
      "ipa": "/zɪp/",
      "graphemes": [
        { "g": "z", "p": "z" },
        { "g": "i", "p": "ɪ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase2"],
        "aus": ["f.unit4"],
        "us": ["k.wk4"]
      }
    }
  ]
  ```

- [ ] **Step 2 — Delete the `.gitkeep`**

  ```bash
  rm src/data/words/chunks/.gitkeep
  ```

- [ ] **Step 3 — Run chunk invariants**

  Run: `yarn test src/data/words/words.test.ts`
  Expected: all 40 entries pass every invariant. If any fail, fix the offending
  entry (check `syllables.join() === word`, grapheme concatenation, phase ids).

- [ ] **Step 4 — Commit**

  ```bash
  git add src/data/words/chunks/core.json src/data/words/chunks/.gitkeep
  git commit -m "feat(words): seed core.json with 40 Phase 2 CVC words"
  ```

---

### Task 7 — Async `filterWords()` + integration test

**Files:**

- Modify: `src/data/words/filter.ts` (append `filterWords` + cache)
- Modify: `src/data/words/filter.test.ts` (append integration tests)
- Modify: `src/data/words/index.ts` (export `filterWords`)

- [ ] **Step 1 — Append `filterWords` to `filter.ts`**

  Add below the existing `entryMatches` export:

  ```ts
  type ChunkModule = { default: WordEntry[] } | WordEntry[];

  const chunkLoaders = import.meta.glob<ChunkModule>('./chunks/*.json');

  const chunkCache = new Map<string, WordEntry[]>();
  const ALL_KEY = '__all__';

  const resolveChunk = (mod: ChunkModule): WordEntry[] =>
    Array.isArray(mod) ? mod : mod.default;

  export const loadAllChunks = async (): Promise<WordEntry[]> => {
    const cached = chunkCache.get(ALL_KEY);
    if (cached) return cached;

    const loaded = await Promise.all(
      Object.entries(chunkLoaders).map(async ([path, load]) => {
        const mod = await load();
        const entries = resolveChunk(mod);
        chunkCache.set(path, entries);
        return entries;
      }),
    );
    const flat = loaded.flat();
    chunkCache.set(ALL_KEY, flat);
    return flat;
  };

  export const filterWords = async (
    filter: WordFilter,
  ): Promise<WordEntry[]> => {
    const all = await loadAllChunks();
    return all.filter((entry) => entryMatches(entry, filter));
  };

  /** Test-only: drop the chunk cache between tests. */
  export const __resetChunkCacheForTests = (): void => {
    chunkCache.clear();
  };
  ```

- [ ] **Step 2 — Append integration tests to `filter.test.ts`**

  ```ts
  import {
    filterWords,
    loadAllChunks,
    __resetChunkCacheForTests,
  } from './filter';
  import { beforeEach } from 'vitest';

  describe('filterWords (integration against real chunks)', () => {
    beforeEach(() => {
      __resetChunkCacheForTests();
    });

    it('loads core.json and returns 1-syllable CVC words for aus', async () => {
      const results = await filterWords({
        region: 'aus',
        syllablesEq: 1,
      });
      expect(results.length).toBeGreaterThan(10);
      for (const entry of results) {
        expect(entry.syllables.length).toBe(1);
      }
    });

    it('grapheme "c" + phoneme "k" returns cat/cot but not city or child', async () => {
      const results = await filterWords({
        region: 'uk',
        grapheme: 'c',
        phoneme: 'k',
      });
      const words = results.map((e) => e.word);
      expect(words).toContain('cat');
      expect(words).toContain('cot');
      expect(words).not.toContain('city');
      expect(words).not.toContain('child');
    });

    it('UK phase2 filter returns core entries', async () => {
      const results = await filterWords({
        region: 'uk',
        phases: ['phase2'],
      });
      expect(results.length).toBeGreaterThan(30);
    });

    it('caches between calls — second call returns the same array reference', async () => {
      const first = await loadAllChunks();
      const second = await loadAllChunks();
      expect(second).toBe(first);
    });
  });
  ```

- [ ] **Step 3 — Run tests**

  Run: `yarn test src/data/words/filter.test.ts`
  Expected: all green. The cache test confirms `loadAllChunks()` short-circuits
  on repeat calls.

- [ ] **Step 4 — Export `filterWords` + `loadAllChunks` from `index.ts`**

  Append to `src/data/words/index.ts`:

  ```ts
  export { filterWords, loadAllChunks } from './filter';
  ```

- [ ] **Step 5 — Commit**

  ```bash
  git add src/data/words/filter.ts src/data/words/filter.test.ts src/data/words/index.ts
  git commit -m "feat(words): add async filterWords with chunk cache"
  ```

---

### Task 8 — Seed `digraphs.json` (20 consonant digraph words)

**Files:**

- Create: `src/data/words/chunks/digraphs.json`

- [ ] **Step 1 — Create `digraphs.json`**

  20 entries covering `ch`, `sh`, `th` (voiceless + voiced), `ng`. All
  single-syllable. Phases: `uk: ['phase3']`, `aus: ['f.unit5']`,
  `us: ['k.wk8']` unless noted otherwise.

  ```json
  [
    {
      "word": "chat",
      "syllables": ["chat"],
      "ipa": "/tʃæt/",
      "graphemes": [
        { "g": "ch", "p": "tʃ" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "chop",
      "syllables": ["chop"],
      "ipa": "/tʃɒp/",
      "graphemes": [
        { "g": "ch", "p": "tʃ" },
        { "g": "o", "p": "ɒ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "chin",
      "syllables": ["chin"],
      "ipa": "/tʃɪn/",
      "graphemes": [
        { "g": "ch", "p": "tʃ" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "rich",
      "syllables": ["rich"],
      "ipa": "/rɪtʃ/",
      "graphemes": [
        { "g": "r", "p": "r" },
        { "g": "i", "p": "ɪ" },
        { "g": "ch", "p": "tʃ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "much",
      "syllables": ["much"],
      "ipa": "/mʌtʃ/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "u", "p": "ʌ" },
        { "g": "ch", "p": "tʃ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "ship",
      "syllables": ["ship"],
      "ipa": "/ʃɪp/",
      "graphemes": [
        { "g": "sh", "p": "ʃ" },
        { "g": "i", "p": "ɪ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "shop",
      "syllables": ["shop"],
      "ipa": "/ʃɒp/",
      "graphemes": [
        { "g": "sh", "p": "ʃ" },
        { "g": "o", "p": "ɒ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "shed",
      "syllables": ["shed"],
      "ipa": "/ʃɛd/",
      "graphemes": [
        { "g": "sh", "p": "ʃ" },
        { "g": "e", "p": "ɛ" },
        { "g": "d", "p": "d" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "dish",
      "syllables": ["dish"],
      "ipa": "/dɪʃ/",
      "graphemes": [
        { "g": "d", "p": "d" },
        { "g": "i", "p": "ɪ" },
        { "g": "sh", "p": "ʃ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "wish",
      "syllables": ["wish"],
      "ipa": "/wɪʃ/",
      "graphemes": [
        { "g": "w", "p": "w" },
        { "g": "i", "p": "ɪ" },
        { "g": "sh", "p": "ʃ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "thin",
      "syllables": ["thin"],
      "ipa": "/θɪn/",
      "graphemes": [
        { "g": "th", "p": "θ" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "thick",
      "syllables": ["thick"],
      "ipa": "/θɪk/",
      "graphemes": [
        { "g": "th", "p": "θ" },
        { "g": "i", "p": "ɪ" },
        { "g": "ck", "p": "k" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "moth",
      "syllables": ["moth"],
      "ipa": "/mɒθ/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "o", "p": "ɒ" },
        { "g": "th", "p": "θ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "bath",
      "syllables": ["bath"],
      "ipa": { "aus": "/baːθ/", "uk": "/bɑːθ/", "us": "/bæθ/" },
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "a", "p": { "aus": "aː", "uk": "ɑː", "us": "æ" } },
        { "g": "th", "p": "θ" }
      ],
      "regions": ["aus", "uk", "us"],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "this",
      "syllables": ["this"],
      "ipa": "/ðɪs/",
      "graphemes": [
        { "g": "th", "p": "ð" },
        { "g": "i", "p": "ɪ" },
        { "g": "s", "p": "s" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "that",
      "syllables": ["that"],
      "ipa": "/ðæt/",
      "graphemes": [
        { "g": "th", "p": "ð" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "ring",
      "syllables": ["ring"],
      "ipa": "/rɪŋ/",
      "graphemes": [
        { "g": "r", "p": "r" },
        { "g": "i", "p": "ɪ" },
        { "g": "ng", "p": "ŋ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "king",
      "syllables": ["king"],
      "ipa": "/kɪŋ/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i", "p": "ɪ" },
        { "g": "ng", "p": "ŋ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "song",
      "syllables": ["song"],
      "ipa": "/sɒŋ/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "o", "p": "ɒ" },
        { "g": "ng", "p": "ŋ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    },
    {
      "word": "long",
      "syllables": ["long"],
      "ipa": "/lɒŋ/",
      "graphemes": [
        { "g": "l", "p": "l" },
        { "g": "o", "p": "ɒ" },
        { "g": "ng", "p": "ŋ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit5"],
        "us": ["k.wk8"]
      }
    }
  ]
  ```

- [ ] **Step 2 — Run invariants + filter integration test**

  Run: `yarn test src/data/words/`
  Expected: all green. The `bath` entry exercises per-region phonemes inside
  graphemes.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/data/words/chunks/digraphs.json
  git commit -m "feat(words): seed digraphs.json with 20 consonant digraph words"
  ```

---

### Task 9 — Seed `long-vowels.json` (15 vowel digraph/trigraph words)

**Files:**

- Create: `src/data/words/chunks/long-vowels.json`

- [ ] **Step 1 — Create `long-vowels.json`**

  15 entries covering `ai`, `ee`, `oa`, `igh`, `oo` (both long and short),
  `ar`, `or`, `ur`, `ow` (as in cow), `oi`. All single-syllable. Phases:
  `uk: ['phase3']`, `aus: ['f.unit6']` or `f.unit7`, `us: ['k.wk12']`.

  ```json
  [
    {
      "word": "rain",
      "syllables": ["rain"],
      "ipa": "/reɪn/",
      "graphemes": [
        { "g": "r", "p": "r" },
        { "g": "ai", "p": "eɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "pain",
      "syllables": ["pain"],
      "ipa": "/peɪn/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "ai", "p": "eɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "feet",
      "syllables": ["feet"],
      "ipa": "/fiːt/",
      "graphemes": [
        { "g": "f", "p": "f" },
        { "g": "ee", "p": "iː" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "seed",
      "syllables": ["seed"],
      "ipa": "/siːd/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "ee", "p": "iː" },
        { "g": "d", "p": "d" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "boat",
      "syllables": ["boat"],
      "ipa": "/bəʊt/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "oa", "p": "əʊ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "coat",
      "syllables": ["coat"],
      "ipa": "/kəʊt/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "oa", "p": "əʊ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit6"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "night",
      "syllables": ["night"],
      "ipa": "/naɪt/",
      "graphemes": [
        { "g": "n", "p": "n" },
        { "g": "igh", "p": "aɪ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "light",
      "syllables": ["light"],
      "ipa": "/laɪt/",
      "graphemes": [
        { "g": "l", "p": "l" },
        { "g": "igh", "p": "aɪ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "cool",
      "syllables": ["cool"],
      "ipa": "/kuːl/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "oo", "p": "uː" },
        { "g": "l", "p": "l" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "book",
      "syllables": ["book"],
      "ipa": "/bʊk/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "oo", "p": "ʊ" },
        { "g": "k", "p": "k" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "car",
      "syllables": ["car"],
      "ipa": { "aus": "/kaː/", "uk": "/kɑː/", "us": "/kɑːr/" },
      "regions": ["aus", "uk", "us"],
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "ar", "p": { "aus": "aː", "uk": "ɑː", "us": "ɑːr" } }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "fork",
      "syllables": ["fork"],
      "ipa": { "aus": "/foːk/", "uk": "/fɔːk/", "us": "/fɔːrk/" },
      "regions": ["aus", "uk", "us"],
      "graphemes": [
        { "g": "f", "p": "f" },
        { "g": "or", "p": { "aus": "oː", "uk": "ɔː", "us": "ɔːr" } },
        { "g": "k", "p": "k" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["f.unit7"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "fur",
      "syllables": ["fur"],
      "ipa": { "aus": "/fɜː/", "uk": "/fɜː/", "us": "/fɜːr/" },
      "regions": ["aus", "uk", "us"],
      "graphemes": [
        { "g": "f", "p": "f" },
        { "g": "ur", "p": { "aus": "ɜː", "uk": "ɜː", "us": "ɜːr" } }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["y1.unit1"],
        "us": ["k.wk12"]
      }
    },
    {
      "word": "cow",
      "syllables": ["cow"],
      "ipa": "/kaʊ/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "ow", "p": "aʊ" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["y1.unit1"],
        "us": ["k.wk12"]
      },
      "tags": ["animal"]
    },
    {
      "word": "coin",
      "syllables": ["coin"],
      "ipa": "/kɔɪn/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "oi", "p": "ɔɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase3"],
        "aus": ["y1.unit1"],
        "us": ["k.wk12"]
      }
    }
  ]
  ```

- [ ] **Step 2 — Run tests**

  Run: `yarn test src/data/words/`
  Expected: green. `car`, `fork`, `fur` exercise non-rhotic vs rhotic
  per-region phonemes.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/data/words/chunks/long-vowels.json
  git commit -m "feat(words): seed long-vowels.json with 15 vowel digraph words"
  ```

---

### Task 10 — Seed `split-digraphs.json` (10 magic-e words)

**Files:**

- Create: `src/data/words/chunks/split-digraphs.json`

- [ ] **Step 1 — Create `split-digraphs.json`**

  10 single-syllable entries with a silent final `e` and a split-digraph
  grapheme (`a_e`, `i_e`, `o_e`, `u_e`). Phases: `uk: ['phase5']`,
  `aus: ['y1.unit2']`, `us: ['g1.wk4']`. `span` is `[start, end]` indices
  into the surface word.

  ```json
  [
    {
      "word": "cake",
      "syllables": ["cake"],
      "ipa": "/keɪk/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "a_e", "p": "eɪ", "span": [1, 4] },
        { "g": "k", "p": "k" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      },
      "tags": ["food"]
    },
    {
      "word": "name",
      "syllables": ["name"],
      "ipa": "/neɪm/",
      "graphemes": [
        { "g": "n", "p": "n" },
        { "g": "a_e", "p": "eɪ", "span": [1, 4] },
        { "g": "m", "p": "m" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "gate",
      "syllables": ["gate"],
      "ipa": "/ɡeɪt/",
      "graphemes": [
        { "g": "g", "p": "ɡ" },
        { "g": "a_e", "p": "eɪ", "span": [1, 4] },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "kite",
      "syllables": ["kite"],
      "ipa": "/kaɪt/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i_e", "p": "aɪ", "span": [1, 4] },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "time",
      "syllables": ["time"],
      "ipa": "/taɪm/",
      "graphemes": [
        { "g": "t", "p": "t" },
        { "g": "i_e", "p": "aɪ", "span": [1, 4] },
        { "g": "m", "p": "m" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "bike",
      "syllables": ["bike"],
      "ipa": "/baɪk/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "i_e", "p": "aɪ", "span": [1, 4] },
        { "g": "k", "p": "k" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "bone",
      "syllables": ["bone"],
      "ipa": "/bəʊn/",
      "graphemes": [
        { "g": "b", "p": "b" },
        { "g": "o_e", "p": "əʊ", "span": [1, 4] },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "home",
      "syllables": ["home"],
      "ipa": "/həʊm/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "o_e", "p": "əʊ", "span": [1, 4] },
        { "g": "m", "p": "m" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "cube",
      "syllables": ["cube"],
      "ipa": "/kjuːb/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "u_e", "p": "juː", "span": [1, 4] },
        { "g": "b", "p": "b" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    },
    {
      "word": "tune",
      "syllables": ["tune"],
      "ipa": "/tjuːn/",
      "graphemes": [
        { "g": "t", "p": "t" },
        { "g": "u_e", "p": "juː", "span": [1, 4] },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit2"],
        "us": ["g1.wk4"]
      }
    }
  ]
  ```

  > **Note on `span` + invariant test.** The grapheme-boundary test in
  > `words.test.ts` strips `_` from `g.g.replace('_', '')` before length math,
  > which means `a_e` contributes two characters to the cursor (the `a` and the
  > `e`). Combined with the intermediate consonant grapheme between them, the
  > cursor will drift — so for split digraphs, the concatenation invariant
  > (`graphemes.map(g=>g.g).join('')`) also needs to tolerate `_`. The plan's
  > harness already does the `_` strip; verify by running the test and confirm
  > the split-digraph entries pass. If they don't, update `words.test.ts` so
  > the join check also strips `_`:

  ```ts
  expect(
    entry.graphemes.map((g) => g.g.replace('_', '')).join(''),
  ).toBe(entry.word);
  ```

- [ ] **Step 2 — Run tests**

  Run: `yarn test src/data/words/`
  Expected: green. If split-digraph entries fail the concatenation invariant,
  apply the `replace('_', '')` fix above to `words.test.ts` in the same
  commit.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/data/words/chunks/split-digraphs.json src/data/words/words.test.ts
  git commit -m "feat(words): seed split-digraphs.json with 10 magic-e words"
  ```

---

### Task 11 — Seed `multi-syllable.json` (10 2–3 syllable words)

**Files:**

- Create: `src/data/words/chunks/multi-syllable.json`

- [ ] **Step 1 — Create `multi-syllable.json`**

  10 multi-syllable K–Y2 vocabulary entries. Phases: `uk: ['phase4']` or
  `phase5`, `aus: ['y1.unit3']`, `us: ['g1.wk8']`.

  ```json
  [
    {
      "word": "sunset",
      "syllables": ["sun", "set"],
      "ipa": "/ˈsʌnsɛt/",
      "graphemes": [
        { "g": "s", "p": "s" },
        { "g": "u", "p": "ʌ" },
        { "g": "n", "p": "n" },
        { "g": "s", "p": "s" },
        { "g": "e", "p": "ɛ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      }
    },
    {
      "word": "catnap",
      "syllables": ["cat", "nap"],
      "ipa": "/ˈkætnæp/",
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "a", "p": "æ" },
        { "g": "t", "p": "t" },
        { "g": "n", "p": "n" },
        { "g": "a", "p": "æ" },
        { "g": "p", "p": "p" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      }
    },
    {
      "word": "hotdog",
      "syllables": ["hot", "dog"],
      "ipa": "/ˈhɒtdɒɡ/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "o", "p": "ɒ" },
        { "g": "t", "p": "t" },
        { "g": "d", "p": "d" },
        { "g": "o", "p": "ɒ" },
        { "g": "g", "p": "ɡ" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["food"]
    },
    {
      "word": "rabbit",
      "syllables": ["rab", "bit"],
      "ipa": "/ˈræbɪt/",
      "graphemes": [
        { "g": "r", "p": "r" },
        { "g": "a", "p": "æ" },
        { "g": "b", "p": "b" },
        { "g": "b", "p": "" },
        { "g": "i", "p": "ɪ" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["animal"]
    },
    {
      "word": "chicken",
      "syllables": ["chick", "en"],
      "ipa": "/ˈtʃɪkɪn/",
      "graphemes": [
        { "g": "ch", "p": "tʃ" },
        { "g": "i", "p": "ɪ" },
        { "g": "ck", "p": "k" },
        { "g": "e", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["animal", "food"]
    },
    {
      "word": "kitten",
      "syllables": ["kit", "ten"],
      "ipa": "/ˈkɪtɪn/",
      "graphemes": [
        { "g": "k", "p": "k" },
        { "g": "i", "p": "ɪ" },
        { "g": "t", "p": "t" },
        { "g": "t", "p": "" },
        { "g": "e", "p": "ɪ" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["animal"]
    },
    {
      "word": "garden",
      "syllables": ["gar", "den"],
      "ipa": {
        "aus": "/ˈɡaːdən/",
        "uk": "/ˈɡɑːdən/",
        "us": "/ˈɡɑːrdən/"
      },
      "regions": ["aus", "uk", "us"],
      "graphemes": [
        { "g": "g", "p": "ɡ" },
        { "g": "ar", "p": { "aus": "aː", "uk": "ɑː", "us": "ɑːr" } },
        { "g": "d", "p": "d" },
        { "g": "e", "p": "ə" },
        { "g": "n", "p": "n" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      }
    },
    {
      "word": "picnic",
      "syllables": ["pic", "nic"],
      "ipa": "/ˈpɪknɪk/",
      "graphemes": [
        { "g": "p", "p": "p" },
        { "g": "i", "p": "ɪ" },
        { "g": "c", "p": "k" },
        { "g": "n", "p": "n" },
        { "g": "i", "p": "ɪ" },
        { "g": "c", "p": "k" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      }
    },
    {
      "word": "hello",
      "syllables": ["hel", "lo"],
      "ipa": "/həˈləʊ/",
      "graphemes": [
        { "g": "h", "p": "h" },
        { "g": "e", "p": "ə" },
        { "g": "l", "p": "l" },
        { "g": "l", "p": "" },
        { "g": "o", "p": "əʊ" }
      ],
      "phases": {
        "uk": ["phase4"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      }
    },
    {
      "word": "elephant",
      "syllables": ["el", "e", "phant"],
      "ipa": "/ˈɛlɪfənt/",
      "graphemes": [
        { "g": "e", "p": "ɛ" },
        { "g": "l", "p": "l" },
        { "g": "e", "p": "ɪ" },
        { "g": "ph", "p": "f" },
        { "g": "a", "p": "ə" },
        { "g": "n", "p": "n" },
        { "g": "t", "p": "t" }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["animal"]
    }
  ]
  ```

- [ ] **Step 2 — Run tests**

  Run: `yarn test src/data/words/`
  Expected: green.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/data/words/chunks/multi-syllable.json
  git commit -m "feat(words): seed multi-syllable.json with 10 2-3 syllable words"
  ```

---

### Task 12 — Seed `regional.json` (7 region-variant showcase words)

**Files:**

- Create: `src/data/words/chunks/regional.json`

- [ ] **Step 1 — Create `regional.json`**

  5 distinct entries (with 2 pairs sharing the `regional` theme): `tomato`
  (Case A — same spelling, different sound), `aluminium`/`aluminum` (Case B —
  different spelling, linked variants), `colour`/`color` (Case B). Total
  entries: 5 logical items → 7 JSON objects once variants are expanded.

  ```json
  [
    {
      "word": "tomato",
      "syllables": ["to", "ma", "to"],
      "regions": ["aus", "uk", "us"],
      "ipa": {
        "aus": "/təˈmɑːtəʊ/",
        "uk": "/təˈmɑːtəʊ/",
        "us": "/təˈmeɪtoʊ/"
      },
      "graphemes": [
        { "g": "t", "p": "t" },
        { "g": "o", "p": "ə" },
        { "g": "m", "p": "m" },
        { "g": "a", "p": { "aus": "ɑː", "uk": "ɑː", "us": "eɪ" } },
        { "g": "t", "p": "t" },
        { "g": "o", "p": { "aus": "əʊ", "uk": "əʊ", "us": "oʊ" } }
      ],
      "phases": {
        "uk": ["phase5"],
        "aus": ["y1.unit3"],
        "us": ["g1.wk8"]
      },
      "tags": ["food", "regional"]
    },
    {
      "word": "aluminium",
      "syllables": ["al", "u", "min", "i", "um"],
      "regions": ["aus", "uk"],
      "variants": ["aluminum"],
      "ipa": {
        "aus": "/ˌæljəˈmɪniəm/",
        "uk": "/ˌæljəˈmɪniəm/"
      },
      "graphemes": [
        { "g": "a", "p": "æ" },
        { "g": "l", "p": "l" },
        { "g": "u", "p": "j" },
        { "g": "m", "p": "m" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" },
        { "g": "i", "p": "i" },
        { "g": "u", "p": "ə" },
        { "g": "m", "p": "m" }
      ],
      "phases": { "uk": ["phase5"], "aus": ["y1.unit3"] },
      "tags": ["regional"]
    },
    {
      "word": "aluminum",
      "syllables": ["a", "lu", "mi", "num"],
      "regions": ["us"],
      "variants": ["aluminium"],
      "ipa": { "us": "/əˈluːmɪnəm/" },
      "graphemes": [
        { "g": "a", "p": "ə" },
        { "g": "l", "p": "l" },
        { "g": "u", "p": "uː" },
        { "g": "m", "p": "m" },
        { "g": "i", "p": "ɪ" },
        { "g": "n", "p": "n" },
        { "g": "u", "p": "ə" },
        { "g": "m", "p": "m" }
      ],
      "phases": { "us": ["g1.wk8"] },
      "tags": ["regional"]
    },
    {
      "word": "colour",
      "syllables": ["col", "our"],
      "regions": ["aus", "uk"],
      "variants": ["color"],
      "ipa": {
        "aus": "/ˈkʌlə/",
        "uk": "/ˈkʌlə/"
      },
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "o", "p": "ʌ" },
        { "g": "l", "p": "l" },
        { "g": "our", "p": "ə" }
      ],
      "phases": { "uk": ["phase5"], "aus": ["y1.unit3"] },
      "tags": ["regional"]
    },
    {
      "word": "color",
      "syllables": ["col", "or"],
      "regions": ["us"],
      "variants": ["colour"],
      "ipa": { "us": "/ˈkʌlər/" },
      "graphemes": [
        { "g": "c", "p": "k" },
        { "g": "o", "p": "ʌ" },
        { "g": "l", "p": "l" },
        { "g": "or", "p": "ər" }
      ],
      "phases": { "us": ["g1.wk8"] },
      "tags": ["regional"]
    },
    {
      "word": "mum",
      "syllables": ["mum"],
      "regions": ["aus", "uk"],
      "variants": ["mom"],
      "ipa": "/mʌm/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "u", "p": "ʌ" },
        { "g": "m", "p": "m" }
      ],
      "phases": { "uk": ["phase2"], "aus": ["f.unit2"] },
      "tags": ["regional"]
    },
    {
      "word": "mom",
      "syllables": ["mom"],
      "regions": ["us"],
      "variants": ["mum"],
      "ipa": "/mɒm/",
      "graphemes": [
        { "g": "m", "p": "m" },
        { "g": "o", "p": "ɒ" },
        { "g": "m", "p": "m" }
      ],
      "phases": { "us": ["k.wk4"] },
      "tags": ["regional"]
    }
  ]
  ```

- [ ] **Step 2 — Run tests**

  Run: `yarn test src/data/words/`
  Expected: green. The cross-chunk `variants links are bidirectional` test now
  has real data to check and should pass for aluminium↔aluminum, colour↔color,
  mum↔mom.

- [ ] **Step 3 — Add a targeted filter test for region-variant exclusion**

  Append to `src/data/words/filter.test.ts`:

  ```ts
  describe('regional variants', () => {
    beforeEach(() => {
      __resetChunkCacheForTests();
    });

    it('AUS filter returns aluminium, not aluminum', async () => {
      const all = await filterWords({ region: 'aus' });
      const words = all.map((e) => e.word);
      expect(words).toContain('aluminium');
      expect(words).not.toContain('aluminum');
    });

    it('US filter returns aluminum and color, not aluminium or colour', async () => {
      const all = await filterWords({ region: 'us' });
      const words = all.map((e) => e.word);
      expect(words).toContain('aluminum');
      expect(words).toContain('color');
      expect(words).not.toContain('aluminium');
      expect(words).not.toContain('colour');
    });

    it('tomato pronunciation differs between regions but appears in all three', async () => {
      for (const region of ['aus', 'uk', 'us'] as const) {
        const all = await filterWords({ region });
        expect(all.map((e) => e.word)).toContain('tomato');
      }
    });
  });
  ```

- [ ] **Step 4 — Run tests**

  Run: `yarn test src/data/words/`
  Expected: green.

- [ ] **Step 5 — Commit**

  ```bash
  git add src/data/words/chunks/regional.json src/data/words/filter.test.ts
  git commit -m "feat(words): seed regional.json with variant-pair showcase"
  ```

---

### Task 13 — Add `source` field to `WordSpellConfig`

**Files:**

- Modify: `src/games/word-spell/types.ts`

- [ ] **Step 1 — Update `types.ts`**

  Replace the existing `WordSpellConfig` interface (keeping all other fields
  in the file untouched):

  ```ts
  import type { WordFilter } from '@/data/words';

  export interface WordSpellLibrarySource {
    type: 'word-library';
    filter: WordFilter;
    /** Max entries to materialise. Defaults to totalRounds. */
    limit?: number;
  }

  export interface WordSpellConfig extends AnswerGameConfig {
    component: 'WordSpell';
    mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
    /** @default 'letter' */
    tileUnit: 'letter' | 'syllable' | 'word';
    /** Explicit hand-authored rounds. Wins over `source` when both are present. */
    rounds?: WordSpellRound[];
    /** Library-driven rounds. Resolved at WordSpell mount time. */
    source?: WordSpellLibrarySource;
  }
  ```

- [ ] **Step 2 — Typecheck**

  Run: `yarn typecheck`
  Expected: fails. Many files access `config.rounds.length` or
  `config.rounds[i]` directly and now see `rounds` as possibly undefined.

  Leave this broken on purpose — Task 15 fixes it by introducing a resolved
  rounds layer. Do not silence errors; commit this step only after Task 15
  lands and typecheck passes.

- [ ] **Step 3 — Do NOT commit yet.** Move to Task 14.

---

### Task 14 — `useLibraryRounds` hook + tests

**Files:**

- Create: `src/games/word-spell/useLibraryRounds.ts`
- Create: `src/games/word-spell/useLibraryRounds.test.tsx`

- [ ] **Step 1 — Write failing hook tests**

  ```tsx
  // src/games/word-spell/useLibraryRounds.test.tsx
  import { act, renderHook, waitFor } from '@testing-library/react';
  import { afterEach, describe, expect, it, vi } from 'vitest';
  import { useLibraryRounds } from './useLibraryRounds';
  import type { WordSpellConfig } from './types';
  import { __resetChunkCacheForTests } from '@/data/words/filter';

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

  afterEach(() => {
    __resetChunkCacheForTests();
    vi.restoreAllMocks();
  });

  describe('useLibraryRounds', () => {
    it('returns explicit rounds synchronously when source is absent', () => {
      const rounds = [{ word: 'cat' }, { word: 'dog' }];
      const { result } = renderHook(() =>
        useLibraryRounds({ ...baseConfig, rounds }),
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.rounds).toBe(rounds);
    });

    it('returns empty rounds array when neither rounds nor source is set', () => {
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
          filter: { region: 'uk', syllablesEq: 1 },
        },
      };
      const { result } = renderHook(() => useLibraryRounds(config));
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 3 rounds because totalRounds=3 and limit is absent
      expect(result.current.rounds).toHaveLength(3);
      // Each round has `word` populated via toWordSpellRound
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
          filter: { region: 'uk', syllablesEq: 1 },
          limit: 2,
        },
      };
      const { result } = renderHook(() => useLibraryRounds(config));
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.rounds).toHaveLength(2);
    });
  });
  ```

- [ ] **Step 2 — Run test to confirm it fails**

  Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx`
  Expected: fails with missing module.

- [ ] **Step 3 — Create `useLibraryRounds.ts`**

  ```ts
  // src/games/word-spell/useLibraryRounds.ts
  import { useEffect, useState } from 'react';
  import { filterWords, toWordSpellRound } from '@/data/words';
  import type { WordSpellConfig, WordSpellRound } from './types';

  interface LibraryRoundsState {
    rounds: WordSpellRound[];
    isLoading: boolean;
  }

  const initialStateFor = (
    config: WordSpellConfig,
  ): LibraryRoundsState => {
    if (config.source) return { rounds: [], isLoading: true };
    return { rounds: config.rounds ?? [], isLoading: false };
  };

  /**
   * Resolves WordSpell rounds from either `config.rounds` (legacy, sync) or
   * `config.source` (library-driven, async). Explicit `rounds` wins over
   * `source` when both are present.
   */
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
        const entries = await filterWords(config.source!.filter);
        if (cancelled) return;
        const limit =
          config.source!.limit ?? config.totalRounds ?? entries.length;
        const picked = entries.slice(0, limit).map(toWordSpellRound);
        setState({ rounds: picked, isLoading: false });
      })();

      return () => {
        cancelled = true;
      };
    }, [config.rounds, config.source, config.totalRounds]);

    return state;
  };
  ```

- [ ] **Step 4 — Run tests**

  Run: `yarn test src/games/word-spell/useLibraryRounds.test.tsx`
  Expected: all green.

- [ ] **Step 5 — Do NOT commit yet.** Move to Task 15 — committing `types.ts`
      and the hook together keeps the branch building.

---

### Task 15 — Wire `useLibraryRounds` into `WordSpell`

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

- [ ] **Step 1 — Update `WordSpell.tsx`**

  Replace the top-level `WordSpell` function (the exported one, currently at
  line 235). Keep `WordSpellSession` and the helpers unchanged.

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
      return buildRoundOrder(
        resolvedRounds.length,
        roundsInOrder,
        seed,
      );
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

- [ ] **Step 2 — Add the import**

  At the top of `WordSpell.tsx`, add:

  ```ts
  import { useLibraryRounds } from '../useLibraryRounds';
  ```

- [ ] **Step 3 — Fix existing stories/tests that now need `rounds` field**

  The existing `baseConfig` in `WordSpell.stories.tsx` already provides
  `rounds: [...]` — it keeps working because the hook short-circuits when
  `config.rounds` is set. If typecheck flags other callers, fix them to match
  the new optional `rounds` signature.

  Run: `yarn typecheck`
  Expected: passes.

- [ ] **Step 4 — Run existing WordSpell tests**

  Run: `yarn test src/games/word-spell/`
  Expected: existing `WordSpell.test.tsx` passes unchanged (legacy path); new
  `useLibraryRounds.test.tsx` passes.

- [ ] **Step 5 — Commit Tasks 13 + 14 + 15 together**

  ```bash
  git add \
    src/games/word-spell/types.ts \
    src/games/word-spell/useLibraryRounds.ts \
    src/games/word-spell/useLibraryRounds.test.tsx \
    src/games/word-spell/WordSpell/WordSpell.tsx
  git commit -m "feat(word-spell): resolve rounds from word library filter"
  ```

---

### Task 16 — Add `LibrarySourced` Storybook story

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.stories.tsx`

- [ ] **Step 1 — Append story**

  Add below the existing `LockManualWrongTile` export:

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
            phases: ['f.unit1', 'f.unit2'],
            syllablesEq: 1,
          },
        },
      },
    },
  };
  ```

- [ ] **Step 2 — Run Storybook test suite**

  Start Storybook: `yarn storybook` (in a separate terminal) or use the
  `START_STORYBOOK=1` push flag later.

  Run: `yarn test:storybook --url http://localhost:6006`
  Expected: the new story renders, the loading state appears briefly, then
  4 tiles show up in the bank.

- [ ] **Step 3 — Commit**

  ```bash
  git add src/games/word-spell/WordSpell/WordSpell.stories.tsx
  git commit -m "feat(word-spell): add library-sourced story"
  ```

---

### Task 17 — Final gate

**Files:** none.

- [ ] **Step 1 — Lint**

  Run: `yarn lint`
  Expected: passes.

- [ ] **Step 2 — Typecheck**

  Run: `yarn typecheck`
  Expected: passes.

- [ ] **Step 3 — Unit tests**

  Run: `yarn test`
  Expected: passes. Watch for word library tests running against all chunk
  files.

- [ ] **Step 4 — Storybook tests (optional pre-push)**

  Run: `yarn storybook` in one terminal, then `yarn test:storybook` in
  another.
  Expected: passes, including the new `LibrarySourced` story.

- [ ] **Step 5 — VR tests (optional)**

  The WordSpell visual regression suite has an existing
  `word-spell-picture-mode` snapshot. The new story uses `recall` mode — no
  new baselines should be needed unless the loading state causes flicker. If
  baselines change unexpectedly, review the diffs manually before running
  `yarn test:vr:update`.

- [ ] **Step 6 — Confirm with user before pushing.** Push requires the user's
      explicit go-ahead per [feedback_confirm_before_push.md](../../../../.claude/projects/-Users-leocaseiro-Sites-base-skill/memory/feedback_confirm_before_push.md).

---

## Post-implementation notes

- **Filter UI** is the obvious follow-up — a dedicated plan should add
  `wordSpellConfigFields` entries for `source.filter.region`, `phases[]`,
  `grapheme`, `phoneme`, and the syllable range.
- **pt-BR seed** is also a follow-up. The data shape is ready; a separate
  plan hand-authors the first BNCC vogais / sílabas simples chunk.
- **Bulk import pipeline** is deferred until the corpus crosses ~500 words.
- **Algorithmic syllable splitting** is deferred — all seed chunks here are
  hand-authored.
- **RxDB-backed storage** is blocked on the two triggers in the spec § 5.2
  (corpus > ~1000 words with measured perf pain, or user-editable lists).
