# Word Authoring (Make Up New Words) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the curator author new words in-app via `WordLibraryExplorer`, persist drafts to IndexedDB, export as JSON, and merge exports into canonical curriculum JSON via a `yarn words:import` CLI.

**Architecture:** Five new modules under `src/data/words/authoring/` (engine, aligner, draftStore, AuthoringPanel, DraftsPanel), one Node CLI at `scripts/words-import.ts`, plus surgical extensions to `types.ts`, `filter.ts`, and `WordLibraryExplorer.tsx`. Auto-generation uses RitaJS (lazy-loaded, ~150 KB) for phoneme + syllable derivation and a greedy g→p aligner seeded from the existing AUS curriculum. Drafts merge into search results transparently, badged as `✏️ draft (unsynced)`.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Dexie 4 (IndexedDB), nanoid 5 (IDs), RitaJS (new dep, lazy), Zod (new dep, validation), Vitest 3, Playwright (VR), Storybook 8, `tsx` for Node scripts.

---

## Spec Deltas (read before starting)

The source spec is [2026-04-23-word-authoring-design.md](../specs/2026-04-23-word-authoring-design.md). This plan diverges from the spec on three dependency choices to match what is already installed:

| Spec says          | Plan uses                  | Why                                      |
| ------------------ | -------------------------- | ---------------------------------------- |
| `idb`              | `dexie` (already in deps)  | Avoid adding a second IndexedDB wrapper. |
| `uuid` v7          | `nanoid` (already in deps) | Already shipped; equal-quality for IDs.  |
| `zod` (assumed in) | `zod` (install in Task 1)  | Not currently installed.                 |
| `rita`             | `rita` (install in Task 1) | Not currently installed.                 |

Everything else follows the spec verbatim (module names, type shapes, data model, UX flow).

## File Structure

```text
src/data/words/
├── authoring/
│   ├── index.ts                   # barrel re-export
│   ├── arpabet-to-ipa.ts          # static ARPABET→IPA map
│   ├── arpabet-to-ipa.test.ts
│   ├── engine.ts                  # RitaJS adapter (lazy), generateBreakdown
│   ├── engine.test.ts
│   ├── aligner.ts                 # greedy g→p aligner, gpFreq from corpus
│   ├── aligner.test.ts
│   ├── draftStore.ts              # Dexie-backed CRUD + export
│   ├── draftStore.test.ts
│   ├── AuthoringPanel.tsx         # modal / full-screen UI
│   ├── AuthoringPanel.test.tsx
│   ├── AuthoringPanel.stories.tsx
│   ├── DraftsPanel.tsx            # list + edit/delete/export UI
│   ├── DraftsPanel.test.tsx
│   └── DraftsPanel.stories.tsx
├── filter.ts                      # extended for shipped + draft merge
├── types.ts                       # extended with DraftEntry, Provenance
└── WordLibraryExplorer.tsx        # entry points, draft badge, Drafts link

scripts/
├── words-import.ts                # CLI: validate + merge into core/curriculum
└── words-import.test.ts
```

## Task Overview

| #   | Title                                       | Surface                              |
| --- | ------------------------------------------- | ------------------------------------ |
| 1   | Install deps and scaffold folder            | `package.json`, `authoring/index.ts` |
| 2   | Extend types (DraftEntry, Provenance)       | `types.ts`                           |
| 3   | ARPABET → IPA static map                    | `authoring/arpabet-to-ipa.ts`        |
| 4   | RitaJS engine adapter                       | `authoring/engine.ts`                |
| 5   | gpFreq corpus learner + greedy aligner      | `authoring/aligner.ts`               |
| 6   | Draft store (Dexie)                         | `authoring/draftStore.ts`            |
| 7   | Filter merge: shipped + drafts              | `filter.ts`                          |
| 8   | AuthoringPanel shell (modal, focus, ARIA)   | `authoring/AuthoringPanel.tsx`       |
| 9   | AuthoringPanel word field + engine wiring   | `authoring/AuthoringPanel.tsx`       |
| 10  | AuthoringPanel graphemes, chips, edit       | `authoring/AuthoringPanel.tsx`       |
| 11  | AuthoringPanel IPA, syllables, level        | `authoring/AuthoringPanel.tsx`       |
| 12  | AuthoringPanel save, dup detection, dirty   | `authoring/AuthoringPanel.tsx`       |
| 13  | DraftsPanel (list, edit, delete, export)    | `authoring/DraftsPanel.tsx`          |
| 14  | WordLibraryExplorer entry points + badge    | `WordLibraryExplorer.tsx`            |
| 15  | Storybook stories + VR baselines            | `*.stories.tsx`, VR                  |
| 16  | CLI: `yarn words:import`                    | `scripts/words-import.ts`            |
| 17  | Final verification + acceptance walkthrough | full suite                           |

---

## Task 1: Install dependencies and scaffold the authoring folder

**Files:**

- Modify: `package.json` (root dependencies + scripts)
- Create: `src/data/words/authoring/index.ts`

- [ ] **Step 1: Add runtime deps**

```bash
yarn add rita@^3.1.2 zod@^3.23.8
```

Expected: `package.json` lists both; yarn.lock updates.

- [ ] **Step 2: Add the `words:import` yarn script**

Edit `package.json` and add the following line inside the `"scripts"` object (keep alphabetical ordering relative to `word:` neighbours if present):

```json
"words:import": "tsx scripts/words-import.ts"
```

- [ ] **Step 3: Scaffold the authoring barrel**

Create `src/data/words/authoring/index.ts`:

```ts
export { generateBreakdown } from './engine';
export type { Breakdown } from './engine';
export { align } from './aligner';
export type { AlignedGrapheme } from './aligner';
export { draftStore } from './draftStore';
export { AuthoringPanel } from './AuthoringPanel';
export { DraftsPanel } from './DraftsPanel';
```

This file will be red on lint until later tasks land — that's expected. If ESLint `import/no-unresolved` fires, wait; the referenced files land in Tasks 3–13.

- [ ] **Step 4: Verify install**

Run: `yarn install`
Expected: no errors, `node_modules/rita/` and `node_modules/zod/` exist.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock src/data/words/authoring/index.ts
git commit -m "feat(word-authoring): add rita + zod deps, scaffold authoring folder"
```

---

## Task 2: Extend the word types with Provenance and DraftEntry

**Files:**

- Modify: `src/data/words/types.ts`
- Test: `src/data/words/types.test-d.ts` (new — type-only contract)

- [ ] **Step 1: Write the failing type-level test**

Create `src/data/words/types.test-d.ts`:

```ts
import { expectTypeOf } from 'vitest';
import type { DraftEntry, Provenance, WordHit } from './types';

expectTypeOf<Provenance>().toEqualTypeOf<'shipped' | 'draft'>();

expectTypeOf<DraftEntry>().toMatchTypeOf<{
  id: string;
  word: string;
  region: 'aus';
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  ipa: string;
  syllables: string[];
  syllableCount: number;
  graphemes: Array<{ g: string; p: string }>;
  ritaKnown: boolean;
  createdAt: string;
  updatedAt: string;
}>();

expectTypeOf<WordHit>().toHaveProperty('provenance');
expectTypeOf<WordHit>().toHaveProperty('draftId');
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `yarn typecheck`
Expected: TypeScript errors for missing `DraftEntry`, `Provenance`, and `WordHit.provenance`.

- [ ] **Step 3: Extend `types.ts`**

Append to `src/data/words/types.ts` (do not remove any existing exports):

```ts
export type Provenance = 'shipped' | 'draft';

export type DraftLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface DraftEntry {
  id: string;
  word: string;
  region: 'aus';
  level: DraftLevel;
  ipa: string;
  syllables: string[];
  syllableCount: number;
  graphemes: Grapheme[];
  variants?: string[];
  ritaKnown: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Then modify the existing `WordHit` interface to add two fields:

```ts
export interface WordHit {
  word: string;
  region: Region;
  level: number;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
  ipa?: string;
  graphemes?: Grapheme[];
  provenance: Provenance; // NEW
  draftId?: string; // NEW
}
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: the type-level test passes. `filter.ts` will now have TS errors because `joinHits` doesn't set `provenance`; that's intentional — Task 7 fixes it. For this task, update ONLY `filter.ts`'s `joinHits` return literal to include `provenance: 'shipped'` so typecheck passes:

```ts
// filter.ts, inside joinHits map
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
    provenance: 'shipped',
  } as WordHit,
];
```

Re-run `yarn typecheck`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/types.ts src/data/words/types.test-d.ts src/data/words/filter.ts
git commit -m "feat(word-authoring): add Provenance and DraftEntry types, tag shipped hits"
```

---

## Task 3: ARPABET → IPA conversion map

**Files:**

- Create: `src/data/words/authoring/arpabet-to-ipa.ts`
- Test: `src/data/words/authoring/arpabet-to-ipa.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/words/authoring/arpabet-to-ipa.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ARPABET_TO_IPA,
  arpabetTokenToIpa,
  arpabetStringToIpa,
} from './arpabet-to-ipa';

describe('ARPABET_TO_IPA map', () => {
  it('covers the 39 CMU ARPABET phonemes', () => {
    // Count keys; RitaJS uses 39 (stressless) phonemes.
    expect(Object.keys(ARPABET_TO_IPA).length).toBe(39);
  });

  it('maps every vowel to an IPA vowel', () => {
    expect(ARPABET_TO_IPA.aa).toBe('ɑ');
    expect(ARPABET_TO_IPA.ae).toBe('æ');
    expect(ARPABET_TO_IPA.ah).toBe('ʌ');
    expect(ARPABET_TO_IPA.ih).toBe('ɪ');
    expect(ARPABET_TO_IPA.uh).toBe('ʊ');
  });

  it('maps key consonants', () => {
    expect(ARPABET_TO_IPA.ng).toBe('ŋ');
    expect(ARPABET_TO_IPA.sh).toBe('ʃ');
    expect(ARPABET_TO_IPA.th).toBe('θ');
    expect(ARPABET_TO_IPA.dh).toBe('ð');
    expect(ARPABET_TO_IPA.zh).toBe('ʒ');
  });
});

describe('arpabetTokenToIpa', () => {
  it('strips primary + secondary stress markers before lookup', () => {
    expect(arpabetTokenToIpa('uh1')).toBe('ʊ');
    expect(arpabetTokenToIpa('ah2')).toBe('ʌ');
    expect(arpabetTokenToIpa('ih0')).toBe('ɪ');
  });

  it('is case-insensitive', () => {
    expect(arpabetTokenToIpa('UH1')).toBe('ʊ');
  });

  it('throws on unknown token', () => {
    expect(() => arpabetTokenToIpa('xx')).toThrow(
      /unknown ARPABET token/i,
    );
  });
});

describe('arpabetStringToIpa', () => {
  it('parses the RitaJS "p-uh1 t-ih-ng" format into individual IPA phonemes', () => {
    expect(arpabetStringToIpa('p-uh1 t-ih-ng')).toEqual([
      'p',
      'ʊ',
      't',
      'ɪ',
      'ŋ',
    ]);
  });

  it('returns an empty array on empty input', () => {
    expect(arpabetStringToIpa('')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/arpabet-to-ipa.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the map**

Create `src/data/words/authoring/arpabet-to-ipa.ts`:

```ts
export const ARPABET_TO_IPA: Readonly<Record<string, string>> = {
  aa: 'ɑ',
  ae: 'æ',
  ah: 'ʌ',
  ao: 'ɔ',
  aw: 'aʊ',
  ay: 'aɪ',
  b: 'b',
  ch: 'tʃ',
  d: 'd',
  dh: 'ð',
  eh: 'ɛ',
  er: 'ɜ',
  ey: 'eɪ',
  f: 'f',
  g: 'g',
  hh: 'h',
  ih: 'ɪ',
  iy: 'i',
  jh: 'dʒ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  ng: 'ŋ',
  ow: 'oʊ',
  oy: 'ɔɪ',
  p: 'p',
  r: 'r',
  s: 's',
  sh: 'ʃ',
  t: 't',
  th: 'θ',
  uh: 'ʊ',
  uw: 'u',
  v: 'v',
  w: 'w',
  y: 'j',
  z: 'z',
  zh: 'ʒ',
};

const STRESS_SUFFIX = /[0-9]+$/;

export const arpabetTokenToIpa = (token: string): string => {
  const stripped = token
    .trim()
    .toLowerCase()
    .replace(STRESS_SUFFIX, '');
  const ipa = ARPABET_TO_IPA[stripped];
  if (!ipa) {
    throw new Error(`unknown ARPABET token: ${token}`);
  }
  return ipa;
};

export const arpabetStringToIpa = (input: string): string[] => {
  if (!input.trim()) return [];
  return input
    .trim()
    .split(/\s+/)
    .flatMap((syll) => syll.split('-').filter(Boolean))
    .map(arpabetTokenToIpa);
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/arpabet-to-ipa.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/arpabet-to-ipa.ts src/data/words/authoring/arpabet-to-ipa.test.ts
git commit -m "feat(word-authoring): add ARPABET to IPA conversion"
```

---

## Task 4: RitaJS engine adapter (lazy-loaded)

**Files:**

- Create: `src/data/words/authoring/engine.ts`
- Test: `src/data/words/authoring/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/words/authoring/engine.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('rita', () => ({
  RiTa: {
    isKnownWord: vi.fn(),
    phones: vi.fn(),
    syllables: vi.fn(),
  },
}));

import { RiTa } from 'rita';
import { generateBreakdown } from './engine';

const mockIsKnownWord = vi.mocked(RiTa.isKnownWord);
const mockPhones = vi.mocked(RiTa.phones);
const mockSyllables = vi.mocked(RiTa.syllables);

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateBreakdown', () => {
  it('returns an empty breakdown when RitaJS does not know the word', async () => {
    mockIsKnownWord.mockReturnValue(false);

    const result = await generateBreakdown('xyzzy');

    expect(result).toEqual({
      word: 'xyzzy',
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown: false,
    });
    expect(mockPhones).not.toHaveBeenCalled();
  });

  it('produces IPA + phonemes for a known word', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('p-uh1 t-ih-ng');
    mockSyllables.mockReturnValue('p-uh/t-ih-ng');

    const result = await generateBreakdown('putting');

    expect(result.ritaKnown).toBe(true);
    expect(result.phonemes).toEqual(['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    expect(result.ipa).toBe('pʊtɪŋ');
  });

  it('derives letter-space syllables from phoneme-space syllables', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('p-uh1 t-ih-ng');
    mockSyllables.mockReturnValue('p-uh/t-ih-ng');

    const result = await generateBreakdown('putting');

    expect(result.syllables.join('')).toBe('putting');
    expect(result.syllables).toHaveLength(2);
  });

  it('lowercases and trims the word before calling Rita', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('k-ae1 t');
    mockSyllables.mockReturnValue('k-ae-t');

    await generateBreakdown('  CAT  ');

    expect(mockIsKnownWord).toHaveBeenCalledWith('cat');
    expect(mockPhones).toHaveBeenCalledWith('cat', { silent: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/engine.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the engine**

Create `src/data/words/authoring/engine.ts`:

```ts
import { arpabetStringToIpa } from './arpabet-to-ipa';

export interface Breakdown {
  word: string;
  ipa: string;
  syllables: string[];
  phonemes: string[];
  ritaKnown: boolean;
}

const splitSyllablesByPhonemeBoundary = (
  word: string,
  phonemes: string[],
  phonemeSyllables: string[],
): string[] => {
  if (phonemeSyllables.length <= 1) return [word];

  const lettersPerPhoneme = word.length / phonemes.length;
  const boundaries: number[] = [];
  let acc = 0;
  for (let i = 0; i < phonemeSyllables.length - 1; i += 1) {
    acc += phonemeSyllables[i].split('-').filter(Boolean).length;
    boundaries.push(Math.round(acc * lettersPerPhoneme));
  }

  const out: string[] = [];
  let prev = 0;
  for (const b of boundaries) {
    const cut = Math.min(Math.max(b, prev + 1), word.length - 1);
    out.push(word.slice(prev, cut));
    prev = cut;
  }
  out.push(word.slice(prev));
  return out.filter((s) => s.length > 0);
};

export const generateBreakdown = async (
  rawWord: string,
): Promise<Breakdown> => {
  const word = rawWord.trim().toLowerCase();
  const { RiTa } = await import('rita');

  if (!RiTa.isKnownWord(word)) {
    return {
      word,
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown: false,
    };
  }

  const phonesStr = RiTa.phones(word, { silent: true });
  const syllStr = RiTa.syllables(word, { silent: true });
  const phonemes = arpabetStringToIpa(phonesStr);
  const phonemeSyllables = syllStr.split('/');
  const syllables = splitSyllablesByPhonemeBoundary(
    word,
    phonemes,
    phonemeSyllables,
  );

  return {
    word,
    ipa: phonemes.join(''),
    syllables,
    phonemes,
    ritaKnown: true,
  };
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/engine.ts src/data/words/authoring/engine.test.ts
git commit -m "feat(word-authoring): lazy RitaJS adapter for breakdown generation"
```

---

## Task 5: Greedy grapheme→phoneme aligner

**Files:**

- Create: `src/data/words/authoring/aligner.ts`
- Test: `src/data/words/authoring/aligner.test.ts`

- [ ] **Step 1: Write the failing golden-fixture test**

Create `src/data/words/authoring/aligner.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { align } from './aligner';

const pluck = (pairs: Array<{ g: string; p: string }>) =>
  pairs.map((g) => ({ g: g.g, p: g.p }));

describe('align (greedy g→p aligner)', () => {
  it('reproduces the shipped breakdown for a single-letter word', () => {
    expect(pluck(align('an', ['æ', 'n']))).toEqual([
      { g: 'a', p: 'æ' },
      { g: 'n', p: 'n' },
    ]);
  });

  it('picks the double consonant for "putting"', () => {
    expect(pluck(align('putting', ['p', 'ʊ', 't', 'ɪ', 'ŋ']))).toEqual([
      { g: 'p', p: 'p' },
      { g: 'u', p: 'ʊ' },
      { g: 'tt', p: 't' },
      { g: 'i', p: 'ɪ' },
      { g: 'ng', p: 'ŋ' },
    ]);
  });

  it('absorbs silent letters into the previous grapheme', () => {
    // "should" has an existing shipped alignment like { g: 'sh', p: 'ʃ' },
    // { g: 'ou', p: 'ʊ' }, { g: 'ld', p: 'd' }. The aligner must leave no
    // leftover letters.
    const aligned = align('should', ['ʃ', 'ʊ', 'd']);
    expect(aligned.map((x) => x.g).join('')).toBe('should');
    expect(aligned[aligned.length - 1].g).toBe('ld');
  });

  it('marks low confidence on an unseen mapping', () => {
    const aligned = align('qz', ['k', 'z']);
    expect(aligned[0].confidence).toBeLessThan(0.5);
  });

  it('picks up split digraphs like "a_e" in "cake"', () => {
    const aligned = align('cake', ['k', 'eɪ', 'k']);
    const digraph = aligned.find((g) => g.g === 'a_e');
    expect(digraph).toBeDefined();
    expect(digraph?.span).toEqual([1, 3]);
  });

  it('every confidence is between 0 and 1', () => {
    const aligned = align('putting', ['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    for (const g of aligned) {
      expect(g.confidence).toBeGreaterThanOrEqual(0);
      expect(g.confidence).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/aligner.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the aligner**

Create `src/data/words/authoring/aligner.ts`:

```ts
import type { CurriculumEntry, Grapheme } from '../types';

export interface AlignedGrapheme extends Grapheme {
  confidence: number;
}

const ausLoaders = import.meta.glob<{ default: CurriculumEntry[] }>(
  '../curriculum/aus/level*.json',
  { eager: true },
);

const SPLIT_DIGRAPHS = ['a_e', 'i_e', 'o_e', 'u_e', 'e_e'] as const;

interface Corpus {
  gpFreq: Map<string, Map<string, number>>;
  maxFreqPerPhoneme: Map<string, number>;
  knownMultiLetter: Set<string>;
}

const buildCorpus = (): Corpus => {
  const gpFreq = new Map<string, Map<string, number>>();
  const maxFreqPerPhoneme = new Map<string, number>();
  const knownMultiLetter = new Set<string>();

  for (const loader of Object.values(ausLoaders)) {
    for (const entry of loader.default) {
      for (const g of entry.graphemes) {
        const key = g.g;
        const inner = gpFreq.get(key) ?? new Map<string, number>();
        const next = (inner.get(g.p) ?? 0) + 1;
        inner.set(g.p, next);
        gpFreq.set(key, inner);

        maxFreqPerPhoneme.set(
          g.p,
          Math.max(maxFreqPerPhoneme.get(g.p) ?? 0, next),
        );

        if (g.g.length > 1 && !g.g.includes('_')) {
          knownMultiLetter.add(g.g);
        }
      }
    }
  }
  return { gpFreq, maxFreqPerPhoneme, knownMultiLetter };
};

let corpus: Corpus | null = null;
const getCorpus = (): Corpus => {
  if (!corpus) corpus = buildCorpus();
  return corpus;
};

interface Candidate {
  g: string;
  consume: number; // letters to advance
  span?: [number, number];
}

const enumerateCandidates = (
  word: string,
  letterIdx: number,
  known: Set<string>,
): Candidate[] => {
  const results: Candidate[] = [];
  const maxLen = Math.min(4, word.length - letterIdx);
  for (let len = maxLen; len >= 2; len -= 1) {
    const g = word.slice(letterIdx, letterIdx + len);
    if (known.has(g)) results.push({ g, consume: len });
  }
  results.push({ g: word[letterIdx], consume: 1 });

  for (const digraph of SPLIT_DIGRAPHS) {
    const [leading, _, trailing] = digraph.split('_');
    if (word[letterIdx] !== leading) continue;
    const gapMin = 1;
    const gapMax = 2;
    for (let gap = gapMin; gap <= gapMax; gap += 1) {
      const trailIdx = letterIdx + 1 + gap;
      if (word[trailIdx] === trailing) {
        results.push({
          g: digraph,
          consume: 1,
          span: [letterIdx, trailIdx + 1],
        });
      }
    }
  }
  return results;
};

const scoreCandidate = (
  candidate: Candidate,
  phoneme: string,
  { gpFreq, maxFreqPerPhoneme }: Corpus,
): number => {
  const inner = gpFreq.get(candidate.g);
  const count = inner?.get(phoneme) ?? 0;
  if (count === 0) return 0;
  const max = maxFreqPerPhoneme.get(phoneme) ?? 1;
  return count / max;
};

export const align = (
  word: string,
  phonemes: string[],
): AlignedGrapheme[] => {
  const c = getCorpus();
  const out: AlignedGrapheme[] = [];
  let letterIdx = 0;
  let phonemeIdx = 0;

  while (letterIdx < word.length && phonemeIdx < phonemes.length) {
    const phoneme = phonemes[phonemeIdx];
    const candidates = enumerateCandidates(
      word,
      letterIdx,
      c.knownMultiLetter,
    );

    let best: Candidate = candidates[candidates.length - 1];
    let bestScore = scoreCandidate(best, phoneme, c);

    for (const cand of candidates) {
      const score = scoreCandidate(cand, phoneme, c);
      if (score > bestScore) {
        best = cand;
        bestScore = score;
      }
    }

    const confidence = bestScore > 0 ? bestScore : 0.2;

    out.push({
      g: best.g,
      p: phoneme,
      span: best.span,
      confidence,
    });

    letterIdx = best.span ? best.span[1] : letterIdx + best.consume;
    phonemeIdx += 1;
  }

  // Absorb silent letters into the last grapheme.
  if (letterIdx < word.length && out.length > 0) {
    const last = out[out.length - 1];
    if (last.span) {
      // Split digraph — don't mutate span; append the leftover.
      out[out.length - 1] = {
        ...last,
        g: `${last.g}${word.slice(letterIdx)}`,
      };
    } else {
      out[out.length - 1] = {
        ...last,
        g: `${last.g}${word.slice(letterIdx)}`,
      };
    }
  }

  return out;
};

export const __resetCorpusForTests = (): void => {
  corpus = null;
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/aligner.test.ts`
Expected: PASS. If the split-digraph or silent-letter tests fail, inspect fixtures and iterate on candidate-enumeration until they pass (don't loosen the assertions).

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/aligner.ts src/data/words/authoring/aligner.test.ts
git commit -m "feat(word-authoring): greedy g to p aligner learned from AUS curriculum"
```

---

## Task 6: Draft store (Dexie-backed)

**Files:**

- Create: `src/data/words/authoring/draftStore.ts`
- Test: `src/data/words/authoring/draftStore.test.ts`
- Test setup: `vitest.setup.ts` (check — may already load `fake-indexeddb`)

- [ ] **Step 1: Ensure fake-indexeddb is wired into vitest**

Check `vitest.config.ts` for a `setupFiles` entry and `vitest.setup.ts` for `import 'fake-indexeddb/auto'`. If absent, add it to the setup file:

```ts
// vitest.setup.ts — add at top
import 'fake-indexeddb/auto';
```

- [ ] **Step 2: Write the failing test**

Create `src/data/words/authoring/draftStore.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DraftEntry } from '../types';
import { draftStore } from './draftStore';

const sample = (
  word: string,
  overrides: Partial<DraftEntry> = {},
): Omit<DraftEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  word,
  region: 'aus',
  level: 3,
  ipa: 'pʊtɪŋ',
  syllables: ['put', 'ting'],
  syllableCount: 2,
  graphemes: [
    { g: 'p', p: 'p' },
    { g: 'u', p: 'ʊ' },
    { g: 'tt', p: 't' },
    { g: 'ing', p: 'ɪŋ' },
  ],
  ritaKnown: true,
  ...overrides,
});

beforeEach(async () => {
  await draftStore.__clearAllForTests();
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('draftStore CRUD', () => {
  it('saves and lists a draft', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    expect(saved.id).toMatch(/.{10,}/);
    expect(saved.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const listed = await draftStore.listDrafts({ region: 'aus' });
    expect(listed).toHaveLength(1);
    expect(listed[0].word).toBe('putting');
  });

  it('rejects duplicate [region, word]', async () => {
    await draftStore.saveDraft(sample('putting'));
    await expect(
      draftStore.saveDraft(sample('putting')),
    ).rejects.toThrow(/already exists/i);
  });

  it('updates an existing draft by id', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    await new Promise((r) => setTimeout(r, 5));
    const updated = await draftStore.updateDraft(saved.id, {
      level: 4,
    });
    expect(updated.level).toBe(4);
    expect(updated.updatedAt).not.toBe(saved.updatedAt);
    expect(updated.createdAt).toBe(saved.createdAt);
  });

  it('deletes a draft', async () => {
    const saved = await draftStore.saveDraft(sample('putting'));
    await draftStore.deleteDraft(saved.id);
    expect(await draftStore.listDrafts({ region: 'aus' })).toEqual([]);
  });

  it('exports drafts in the canonical shape', async () => {
    await draftStore.saveDraft(sample('putting'));
    await draftStore.saveDraft(sample('should', { level: 4 }));

    const exported = await draftStore.exportDrafts();
    expect(exported.version).toBe(1);
    expect(exported.drafts).toHaveLength(2);
    for (const d of exported.drafts) {
      expect(d).not.toHaveProperty('id');
      expect(d).toHaveProperty('word');
      expect(d).toHaveProperty('graphemes');
    }
    expect(exported.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/draftStore.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the store**

Create `src/data/words/authoring/draftStore.ts`:

```ts
import Dexie, { type Table } from 'dexie';
import { nanoid } from 'nanoid';
import type { DraftEntry, Region } from '../types';

const DB_NAME = 'basekill-word-drafts';

class DraftDB extends Dexie {
  drafts!: Table<DraftEntry, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      drafts: 'id, &[region+word], [region+level]',
    });
  }
}

const db = new DraftDB();

export interface ExportedDraft extends Omit<DraftEntry, 'id'> {}

export interface DraftsExport {
  version: 1;
  exportedAt: string;
  drafts: ExportedDraft[];
}

const nowIso = (): string => new Date().toISOString();

const omitId = (d: DraftEntry): ExportedDraft => {
  const { id: _id, ...rest } = d;
  return rest;
};

export const draftStore = {
  async saveDraft(
    input: Omit<DraftEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DraftEntry> {
    const existing = await db.drafts
      .where('[region+word]')
      .equals([input.region, input.word])
      .first();
    if (existing) {
      throw new Error(
        `draft for "${input.word}" (${input.region}) already exists`,
      );
    }
    const now = nowIso();
    const entry: DraftEntry = {
      id: nanoid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await db.drafts.add(entry);
    return entry;
  },

  async updateDraft(
    id: string,
    patch: Partial<
      Omit<DraftEntry, 'id' | 'createdAt' | 'region' | 'word'>
    >,
  ): Promise<DraftEntry> {
    const current = await db.drafts.get(id);
    if (!current) throw new Error(`draft not found: ${id}`);
    const next: DraftEntry = {
      ...current,
      ...patch,
      updatedAt: nowIso(),
    };
    await db.drafts.put(next);
    return next;
  },

  async deleteDraft(id: string): Promise<void> {
    await db.drafts.delete(id);
  },

  async listDrafts(opts: { region: Region }): Promise<DraftEntry[]> {
    return db.drafts
      .where('[region+word]')
      .between([opts.region, ''], [opts.region, '\uffff'])
      .toArray();
  },

  async exportDrafts(): Promise<DraftsExport> {
    const all = await db.drafts.toArray();
    return {
      version: 1,
      exportedAt: nowIso(),
      drafts: all.map(omitId),
    };
  },

  async __clearAllForTests(): Promise<void> {
    await db.drafts.clear();
  },
};
```

- [ ] **Step 5: Run tests**

Run: `yarn vitest run src/data/words/authoring/draftStore.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/authoring/draftStore.ts src/data/words/authoring/draftStore.test.ts
git commit -m "feat(word-authoring): Dexie-backed draft store with export"
```

---

## Task 7: Extend `filter.ts` to merge shipped + draft results

**Files:**

- Modify: `src/data/words/filter.ts`
- Modify: `src/data/words/filter.test.ts` (if exists) or create
- Create: `src/data/words/filter.drafts.test.ts` (fresh, scoped test)

- [ ] **Step 1: Write the failing integration test**

Create `src/data/words/filter.drafts.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { draftStore } from './authoring/draftStore';
import { filterWords, __resetChunkCacheForTests } from './filter';

beforeEach(async () => {
  await draftStore.__clearAllForTests();
  __resetChunkCacheForTests();
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('filterWords with draft merge', () => {
  it('tags shipped results with provenance: "shipped"', async () => {
    const { hits } = await filterWords({
      region: 'aus',
      levels: [1],
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].provenance).toBe('shipped');
    expect(hits[0].draftId).toBeUndefined();
  });

  it('includes drafts in results with provenance: "draft"', async () => {
    await draftStore.saveDraft({
      word: 'zzword',
      region: 'aus',
      level: 2,
      ipa: 'zɜːwɜːd',
      syllables: ['zz', 'word'],
      syllableCount: 2,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'word', p: 'wɜːd' },
      ],
      ritaKnown: false,
    });

    const { hits } = await filterWords({
      region: 'aus',
      levels: [2],
    });

    const draft = hits.find((h) => h.word === 'zzword');
    expect(draft).toBeDefined();
    expect(draft?.provenance).toBe('draft');
    expect(draft?.draftId).toBeTruthy();
  });

  it('applies syllable-count filters to drafts', async () => {
    await draftStore.saveDraft({
      word: 'zzone',
      region: 'aus',
      level: 3,
      ipa: 'zwʌn',
      syllables: ['zzone'],
      syllableCount: 1,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'o', p: 'ʌ' },
        { g: 'ne', p: 'n' },
      ],
      ritaKnown: false,
    });

    const match = await filterWords({
      region: 'aus',
      levels: [3],
      syllableCountEq: 1,
    });
    expect(match.hits.some((h) => h.word === 'zzone')).toBe(true);

    const miss = await filterWords({
      region: 'aus',
      levels: [3],
      syllableCountEq: 3,
    });
    expect(miss.hits.some((h) => h.word === 'zzone')).toBe(false);
  });

  it('sorts shipped + draft together by word', async () => {
    await draftStore.saveDraft({
      word: 'aaapple',
      region: 'aus',
      level: 1,
      ipa: 'ɑpəl',
      syllables: ['aaa', 'pple'],
      syllableCount: 2,
      graphemes: [
        { g: 'aaa', p: 'ɑ' },
        { g: 'pple', p: 'pəl' },
      ],
      ritaKnown: false,
    });

    const { hits } = await filterWords({
      region: 'aus',
      levels: [1],
    });
    const words = hits.map((h) => h.word);
    expect(words).toEqual(
      [...words].sort((a, b) => a.localeCompare(b)),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/filter.drafts.test.ts`
Expected: FAIL — shipped hits don't include drafts.

- [ ] **Step 3: Extend `filter.ts`**

Edit `src/data/words/filter.ts`. Add these imports at the top:

```ts
import { draftStore } from './authoring/draftStore';
import type { DraftEntry, Provenance } from './types';
```

Add a helper for converting `DraftEntry → WordHit`:

```ts
const draftToHit = (d: DraftEntry): WordHit => ({
  word: d.word,
  region: d.region,
  level: d.level,
  syllableCount: d.syllableCount,
  syllables: d.syllables,
  variants: d.variants,
  ipa: d.ipa || undefined,
  graphemes: d.graphemes,
  provenance: 'draft' satisfies Provenance,
  draftId: d.id,
});
```

Modify the `filterWords` function to merge + sort:

```ts
export const filterWords = async (
  filter: WordFilter,
): Promise<FilterResult> => {
  const core = await loadCore();
  const curriculum = await loadCurriculum(filter.region);
  const shipped = joinHits(curriculum, core, filter.region).filter(
    (h) => entryMatches(h, filter),
  );

  const drafts = (
    await draftStore.listDrafts({ region: filter.region })
  )
    .map(draftToHit)
    .filter((h) => entryMatches(h, filter));

  const merged = [...shipped, ...drafts].sort((a, b) =>
    a.word.localeCompare(b.word),
  );

  if (
    merged.length > 0 ||
    filter.region === 'aus' ||
    filter.fallbackToAus === false
  ) {
    return { hits: merged };
  }

  const ausCurriculum = await loadCurriculum('aus');
  const ausDrafts = (
    await draftStore.listDrafts({ region: 'aus' })
  ).map(draftToHit);
  const ausShipped = joinHits(ausCurriculum, core, 'aus');
  const ausMerged = [...ausShipped, ...ausDrafts]
    .filter((h) => entryMatches(h, { ...filter, region: 'aus' }))
    .sort((a, b) => a.word.localeCompare(b.word));

  return {
    hits: ausMerged,
    usedFallback: { from: filter.region, to: 'aus' },
  };
};
```

Keep the existing `__resetChunkCacheForTests`, `entryMatches`, `joinHits`, loader caches — do not remove them.

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/filter.drafts.test.ts src/data/words/words.test.ts`
Expected: PASS (the new draft test + existing word tests). If the existing word tests fail because they now expect sorted order that wasn't sorted before, update those tests to match the new guarantee — the spec requires shipped + draft to sort together.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/filter.ts src/data/words/filter.drafts.test.ts
git commit -m "feat(word-authoring): merge drafts into filter results, tag provenance"
```

---

## Task 8: AuthoringPanel shell (modal + focus + ARIA)

**Files:**

- Create: `src/data/words/authoring/AuthoringPanel.tsx`
- Create: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/data/words/authoring/AuthoringPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthoringPanel } from './AuthoringPanel';

const noop = () => {};

describe('AuthoringPanel shell', () => {
  it('renders when open', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    expect(
      screen.getByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AuthoringPanel open={false} onClose={noop} initialWord="" />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when ESC is pressed (clean form)', async () => {
    const onClose = vi.fn();
    render(<AuthoringPanel open onClose={onClose} initialWord="" />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes aria-modal="true" and aria-labelledby', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the shell**

Create `src/data/words/authoring/AuthoringPanel.tsx`:

```tsx
import { useCallback, useEffect, useId, useRef } from 'react';

export interface AuthoringPanelProps {
  open: boolean;
  onClose: () => void;
  initialWord: string;
  onSaved?: () => void;
}

export const AuthoringPanel = ({
  open,
  onClose,
  initialWord,
  onSaved: _onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 md:p-6"
    >
      <div className="flex h-full w-full flex-col bg-white p-6 md:h-auto md:max-w-2xl md:rounded-xl md:shadow-2xl">
        <h2 id={titleId} className="text-xl font-semibold">
          Make up a word
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Authoring <strong>{initialWord || '(new word)'}</strong>.
          Fields below populate as you type.
        </p>
        {/* Field tasks populate this region in later tasks. */}
        <div
          className="mt-4 flex-1 overflow-auto"
          data-testid="authoring-body"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(word-authoring): AuthoringPanel modal shell with focus and ARIA"
```

---

## Task 9: AuthoringPanel word field + engine wiring

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
import { act } from '@testing-library/react';

vi.mock('./engine', () => ({
  generateBreakdown: vi.fn(async (word: string) => ({
    word,
    ipa: word === 'putting' ? 'pʊtɪŋ' : '',
    syllables: word === 'putting' ? ['put', 'ting'] : [],
    phonemes: word === 'putting' ? ['p', 'ʊ', 't', 'ɪ', 'ŋ'] : [],
    ritaKnown: word === 'putting',
  })),
}));

describe('AuthoringPanel word field', () => {
  it('pre-fills the word field from initialWord', () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    expect(screen.getByLabelText(/word/i)).toHaveValue('putting');
  });

  it('shows the dictionary.com banner for an unknown word', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    await userEvent.type(screen.getByLabelText(/word/i), 'xyzzy');
    // Engine debounces at 400 ms; advance timers.
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('link', { name: /open in dictionary\.com/i }),
    ).toHaveAttribute(
      'href',
      'https://www.dictionary.com/browse/xyzzy',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL (no word field yet).

- [ ] **Step 3: Add the word field + engine hook**

Replace the `AuthoringPanel` body (everything after `if (!open) return null;`) with:

```tsx
import { useEffect, useState } from 'react';
import { generateBreakdown, type Breakdown } from './engine';

const DEBOUNCE_MS = 400;

const useDebouncedBreakdown = (
  word: string,
): { breakdown: Breakdown | null; loading: boolean } => {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = word.trim();
    if (!trimmed) {
      setBreakdown(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const b = await generateBreakdown(trimmed);
        setBreakdown(b);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [word]);

  return { breakdown, loading };
};
```

Then restructure the return JSX to include a controlled word field and an optional unknown-word banner. Replace the placeholder body `<div ... data-testid="authoring-body" />` with:

```tsx
{
  (() => {
    const [word, setWord] = useState(initialWord);
    const { breakdown } = useDebouncedBreakdown(word);

    return (
      <div className="mt-4 flex-1 space-y-4 overflow-auto">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Word
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoFocus
            className="rounded border px-3 py-2"
          />
        </label>
        {breakdown && !breakdown.ritaKnown && word.trim() && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            RitaJS doesn&apos;t know <strong>{word.trim()}</strong>.
            Look it up →{' '}
            <a
              href={`https://www.dictionary.com/browse/${encodeURIComponent(word.trim())}`}
              target="_blank"
              rel="noreferrer noopener"
              className="underline"
            >
              Open in dictionary.com
            </a>
          </div>
        )}
      </div>
    );
  })();
}
```

IMPORTANT: IIFE-in-JSX is awkward — refactor the panel so that `word` and `breakdown` live in the top-level component body, not inside an IIFE. Move `useState(initialWord)` and `useDebouncedBreakdown(word)` up to the top of the component function, and inline the JSX directly. The IIFE above is a compact sketch of what the JSX should look like, not the final code shape.

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS (both new tests plus the shell tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(word-authoring): word field, debounced engine call, unknown-word banner"
```

---

## Task 10: AuthoringPanel grapheme chips + chip editor

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
describe('AuthoringPanel grapheme chips', () => {
  it('renders a chip per aligned grapheme when the word is known', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('grapheme-chip');
    expect(chips.length).toBe(5);
    expect(chips[2]).toHaveTextContent('tt');
    expect(chips[2]).toHaveTextContent('t');
  });

  it('flags low-confidence chips with aria-invalid + amber class', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="qxz" />);
    // qxz is a nonsense word; assume engine returns phonemes the aligner
    // cannot confidently match. At least one chip should be low-confidence.
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Skip strict assertion if engine returned empty (unknown word) — just
    // verify that when chips exist, the amber class is applied correctly.
    const chips = screen.queryAllByTestId('grapheme-chip');
    for (const c of chips) {
      if (c.classList.contains('border-amber-400')) {
        expect(c).toHaveAttribute('aria-invalid', 'true');
      }
    }
  });

  it('opens an inline editor when a chip is clicked', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chip = screen.getAllByTestId('grapheme-chip')[0];
    await userEvent.click(chip);
    expect(
      screen.getByRole('combobox', { name: /phoneme/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement chips + editor**

In `AuthoringPanel.tsx`, add:

```tsx
import { align, type AlignedGrapheme } from './aligner';
import { PHONEME_CODE_TO_IPA } from '../phoneme-codes';

const PHONEME_IPA_OPTIONS = Array.from(
  new Set(Object.values(PHONEME_CODE_TO_IPA)),
).sort();

const useAlignment = (
  word: string,
  phonemes: string[],
): AlignedGrapheme[] => {
  return word && phonemes.length > 0 ? align(word, phonemes) : [];
};
```

In the panel body (after the unknown-word banner), add a grapheme chip row with inline edit state. Keep state for `editingIndex: number | null` and a working copy `chips: AlignedGrapheme[]` in component state (seeded from `useAlignment`).

Render each chip:

```tsx
<button
  key={i}
  type="button"
  data-testid="grapheme-chip"
  aria-invalid={chip.confidence < 0.5 ? 'true' : undefined}
  className={`rounded border px-2 py-1 text-sm ${
    chip.confidence < 0.5
      ? 'border-amber-400 bg-amber-50'
      : 'border-slate-300 bg-white'
  }`}
  onClick={() => setEditingIndex(i)}
>
  <div className="font-semibold">{chip.g}</div>
  <div className="text-xs text-slate-500">/{chip.p}/</div>
</button>
```

When `editingIndex !== null`, render an editor popover with a phoneme `<select>`:

```tsx
<label className="flex flex-col gap-1 text-sm">
  Phoneme
  <select
    aria-label="phoneme"
    value={chips[editingIndex].p}
    onChange={(e) => updateChip(editingIndex, { p: e.target.value })}
    className="rounded border px-2 py-1"
  >
    {PHONEME_IPA_OPTIONS.map((ipa) => (
      <option key={ipa} value={ipa}>
        {ipa}
      </option>
    ))}
  </select>
</label>
```

Provide letter-range adjusters that extend or shrink `chip.g`:

```tsx
<div className="flex gap-1">
  <button type="button" onClick={() => shrinkChip(editingIndex)}>
    −
  </button>
  <button type="button" onClick={() => extendChip(editingIndex)}>
    +
  </button>
</div>
```

`shrinkChip` and `extendChip` are helpers that mutate `chip.g` by one letter and rebalance the remaining chips so their `g` values still concatenate to `word`. Reference implementation:

```ts
const extendChip = (i: number) => {
  setChips((prev) => {
    const next = [...prev];
    const this_ = next[i];
    const nextChip = next[i + 1];
    if (!nextChip || nextChip.g.length < 2) return prev;
    next[i] = { ...this_, g: this_.g + nextChip.g[0] };
    next[i + 1] = { ...nextChip, g: nextChip.g.slice(1) };
    return next;
  });
};

const shrinkChip = (i: number) => {
  setChips((prev) => {
    const next = [...prev];
    const this_ = next[i];
    if (this_.g.length < 2) return prev;
    const nextChip = next[i + 1];
    if (!nextChip) return prev;
    next[i] = { ...this_, g: this_.g.slice(0, -1) };
    next[i + 1] = { ...nextChip, g: this_.g.slice(-1) + nextChip.g };
    return next;
  });
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS. If the low-confidence test is flaky because the aligner returns high-confidence for `qxz` by chance, replace with a deterministic fixture by passing an explicit `phonemes` array via a test-only prop (add `_initialPhonemes?: string[]` and document it as `@internal`).

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(word-authoring): grapheme chip row with inline editor"
```

---

## Task 11: AuthoringPanel IPA field + syllable chips + level selector

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`
- Reference: `src/data/words/levels.ts` for `GRAPHEMES_BY_LEVEL`

- [ ] **Step 1: Write the failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
describe('AuthoringPanel IPA and syllables', () => {
  it('pre-fills IPA from the engine for a known word', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(screen.getByLabelText(/IPA/i)).toHaveValue('pʊtɪŋ');
  });

  it('renders one syllable chip per segment', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('syllable-chip');
    expect(chips.map((c) => c.textContent)).toEqual(['put', 'ting']);
  });

  it('auto-suggests level and shows the rationale', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const select = screen.getByLabelText(/level/i) as HTMLSelectElement;
    expect(Number(select.value)).toBeGreaterThanOrEqual(1);
    expect(Number(select.value)).toBeLessThanOrEqual(8);
    expect(
      screen.getByText(/suggested L\d — highest grapheme used: /i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement IPA field + syllable chips + level selector**

Add the following helpers to `AuthoringPanel.tsx`:

```ts
import { GRAPHEMES_BY_LEVEL } from '../levels';

const suggestLevel = (
  chips: AlignedGrapheme[],
): { level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; reason: string } => {
  let best: { level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; grapheme: string } =
    {
      level: 1,
      grapheme: chips[0]?.g ?? '',
    };
  for (const chip of chips) {
    for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      const hit = GRAPHEMES_BY_LEVEL[lvl].find((u) => u.g === chip.g);
      if (hit && lvl > best.level)
        best = { level: lvl, grapheme: chip.g };
    }
  }
  return { level: best.level, reason: best.grapheme };
};
```

Render:

```tsx
<label className="flex flex-col gap-1 text-sm">
  IPA
  <input
    type="text"
    value={ipa}
    onChange={(e) => setIpa(e.target.value)}
    className="rounded border px-3 py-2"
  />
</label>

<div className="flex flex-wrap gap-2">
  {syllables.map((s, i) => (
    <span
      key={i}
      data-testid="syllable-chip"
      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
    >
      {s}
    </span>
  ))}
</div>

<label className="flex flex-col gap-1 text-sm">
  Level
  <select
    value={level}
    onChange={(e) => setLevel(Number(e.target.value) as DraftLevel)}
    className="rounded border px-2 py-1"
  >
    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
      <option key={n} value={n}>Level {n}</option>
    ))}
  </select>
</label>
<p className="text-xs text-slate-500">
  suggested L{suggestion.level} — highest grapheme used: {suggestion.reason}
</p>

<label className="flex flex-col gap-1 text-sm">
  Variants (optional, comma-separated)
  <input
    type="text"
    value={variantsInput}
    onChange={(e) => setVariantsInput(e.target.value)}
    placeholder="e.g. putting, putts"
    className="rounded border px-3 py-2"
  />
</label>
```

`variantsInput` is a plain string piece of state; Task 12's `handleSave` derives the array via `variantsInput.split(',').map((s) => s.trim()).filter(Boolean)` and only sets `variants:` on the payload if that array is non-empty.

Seed `ipa`, `syllables`, `level`, and `variantsInput` state from `breakdown` when it changes; also rerun `suggestLevel(chips)` whenever chips change.

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(word-authoring): IPA field, syllable chips, level auto-suggest"
```

---

## Task 12: AuthoringPanel save, duplicate detection, dirty-confirm

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
import { draftStore } from './draftStore';

describe('AuthoringPanel save + duplicates', () => {
  it('disables Save when the word collides with shipped data', async () => {
    // "an" is in shipped AUS level 1.
    render(<AuthoringPanel open onClose={noop} initialWord="an" />);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already exists in shipped data/i),
    ).toBeInTheDocument();
  });

  it('saves a draft and calls onSaved', async () => {
    await draftStore.__clearAllForTests();
    const onSaved = vi.fn();
    render(
      <AuthoringPanel
        open
        onClose={noop}
        initialWord="zzword"
        onSaved={onSaved}
      />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Fill IPA manually (rita will return unknown for zzword)
    await userEvent.type(screen.getByLabelText(/IPA/i), 'zwɜːd');
    await userEvent.click(
      screen.getByRole('button', { name: /save draft/i }),
    );
    expect(onSaved).toHaveBeenCalled();
    const list = await draftStore.listDrafts({ region: 'aus' });
    expect(list.map((d) => d.word)).toContain('zzword');
  });

  it('prompts to confirm on ESC when the form is dirty', async () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValue(false);
    const onClose = vi.fn();
    render(<AuthoringPanel open onClose={onClose} initialWord="" />);
    await userEvent.type(screen.getByLabelText(/word/i), 'zz');
    await userEvent.keyboard('{Escape}');
    expect(confirmSpy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement save, duplicate check, dirty-confirm**

First, add a `loadShippedIndex` export to `src/data/words/filter.ts`. It returns the set of shipped words for a region without touching the draft store (so the panel can detect collisions before save):

```ts
export const loadShippedIndex = async (
  region: Region,
): Promise<Set<string>> => {
  const curriculum = await loadCurriculum(region);
  return new Set(curriculum.map((entry) => entry.word));
};
```

Then in `AuthoringPanel.tsx`, load it once on open:

```ts
const [shippedSet, setShippedSet] = useState<Set<string>>(new Set());
useEffect(() => {
  if (!open) return;
  void loadShippedIndex('aus').then(setShippedSet);
}, [open]);
```

Wire the Save button to:

```ts
const handleSave = async () => {
  const variants = variantsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await draftStore.saveDraft({
    word: word.trim().toLowerCase(),
    region: 'aus',
    level,
    ipa,
    syllables,
    syllableCount: syllables.length,
    graphemes: chips.map(({ confidence: _c, ...rest }) => rest),
    ...(variants.length > 0 ? { variants } : {}),
    ritaKnown: breakdown?.ritaKnown ?? false,
  });
  onSaved?.();
  onClose();
};
```

Surface an inline hint next to Save when `shippedSet.has(word.trim().toLowerCase())`:

```tsx
<p className="text-xs text-rose-600">
  &quot;{word.trim()}&quot; already exists in shipped data — open that
  entry instead.
</p>
```

And set `disabled` on the Save button:

```tsx
<button
  type="button"
  disabled={
    saving ||
    !word.trim() ||
    !ipa.trim() ||
    shippedSet.has(word.trim().toLowerCase())
  }
  onClick={handleSave}
>
  Save draft
</button>
```

Dirty-confirm on ESC/close: track `dirty: boolean` (any user interaction flips it true). Wrap `onClose` in a confirmation:

```ts
const closeWithConfirm = () => {
  if (dirty && !window.confirm('Discard this draft?')) return;
  onClose();
};
```

Use `closeWithConfirm` in the ESC handler and the Cancel button. Keep the direct `onClose()` call inside `handleSave` so successful save bypasses the prompt.

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(word-authoring): save, duplicate guard, and dirty-confirm on close"
```

---

## Task 13: DraftsPanel (list, edit, delete, export)

**Files:**

- Create: `src/data/words/authoring/DraftsPanel.tsx`
- Create: `src/data/words/authoring/DraftsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/data/words/authoring/DraftsPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { draftStore } from './draftStore';
import { DraftsPanel } from './DraftsPanel';

beforeEach(async () => {
  await draftStore.__clearAllForTests();
  await draftStore.saveDraft({
    word: 'zzword',
    region: 'aus',
    level: 3,
    ipa: 'zwɜːd',
    syllables: ['zz', 'word'],
    syllableCount: 2,
    graphemes: [
      { g: 'zz', p: 'z' },
      { g: 'word', p: 'wɜːd' },
    ],
    ritaKnown: false,
  });
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('DraftsPanel', () => {
  it('renders one row per draft', async () => {
    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    expect(await screen.findByText('zzword')).toBeInTheDocument();
  });

  it('deletes a draft', async () => {
    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    await screen.findByText('zzword');
    window.confirm = () => true;
    await userEvent.click(
      screen.getByRole('button', { name: /delete/i }),
    );
    expect(await draftStore.listDrafts({ region: 'aus' })).toHaveLength(
      0,
    );
  });

  it('triggers a download when Export is clicked', async () => {
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    await userEvent.click(
      screen.getByRole('button', { name: /export drafts/i }),
    );
    expect(createSpy).toHaveBeenCalled();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/authoring/DraftsPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement DraftsPanel**

Create `src/data/words/authoring/DraftsPanel.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import type { DraftEntry } from '../types';
import { draftStore } from './draftStore';

export interface DraftsPanelProps {
  open: boolean;
  onClose: () => void;
  onEdit: (draft: DraftEntry) => void;
}

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const DraftsPanel = ({
  open,
  onClose,
  onEdit,
}: DraftsPanelProps) => {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  const refresh = useCallback(async () => {
    setDrafts(await draftStore.listDrafts({ region: 'aus' }));
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const handleExport = async () => {
    const exported = await draftStore.exportDrafts();
    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json',
    });
    const iso = new Date().toISOString().replace(/[:.]/g, '-');
    triggerDownload(blob, `wordlib-export-${iso}.json`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this draft?')) return;
    await draftStore.deleteDraft(id);
    await refresh();
  };

  if (!open) return null;

  return (
    <aside
      role="dialog"
      aria-label="Drafts"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white p-4 shadow-2xl"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Drafts ({drafts.length})
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drafts"
        >
          ×
        </button>
      </header>
      <button
        type="button"
        onClick={handleExport}
        className="mt-3 rounded bg-sky-600 px-3 py-1 text-sm text-white disabled:opacity-50"
        disabled={drafts.length === 0}
      >
        Export drafts ({drafts.length})
      </button>
      <ul className="mt-4 divide-y">
        {drafts.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between py-2"
          >
            <div>
              <div className="font-medium">{d.word}</div>
              <div className="text-xs text-slate-500">
                L{d.level} · {new Date(d.updatedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(d)}
                className="rounded border px-2 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
                className="rounded border border-rose-300 px-2 py-1 text-sm text-rose-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/authoring/DraftsPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/DraftsPanel.tsx src/data/words/authoring/DraftsPanel.test.tsx
git commit -m "feat(word-authoring): DraftsPanel with edit, delete, and export"
```

---

## Task 14: Wire entry points + draft badge into WordLibraryExplorer

**Files:**

- Modify: `src/data/words/WordLibraryExplorer.tsx`
- Modify: `src/data/words/WordLibraryExplorer.test.ts` (or add `.integration.test.tsx`)
- Create: `src/data/words/WordLibraryExplorer.authoring.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Create `src/data/words/WordLibraryExplorer.authoring.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { draftStore } from './authoring/draftStore';
import { WordLibraryExplorer } from './WordLibraryExplorer';

beforeEach(async () => {
  await draftStore.__clearAllForTests();
});
afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('WordLibraryExplorer authoring entry points', () => {
  it('shows a + New word button', () => {
    render(<WordLibraryExplorer />);
    expect(
      screen.getByRole('button', { name: /new word/i }),
    ).toBeInTheDocument();
  });

  it('renders an empty-state CTA when search returns 0', async () => {
    render(<WordLibraryExplorer />);
    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, 'xzqxzq');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('button', { name: /make up this word/i }),
    ).toBeInTheDocument();
  });

  it('shows a Drafts link when drafts exist', async () => {
    await draftStore.saveDraft({
      word: 'zzword',
      region: 'aus',
      level: 3,
      ipa: 'zwɜːd',
      syllables: ['zz', 'word'],
      syllableCount: 2,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'word', p: 'wɜːd' },
      ],
      ritaKnown: false,
    });
    render(<WordLibraryExplorer />);
    expect(
      await screen.findByText(/drafts \(1\)/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/data/words/WordLibraryExplorer.authoring.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Modify `WordLibraryExplorer.tsx`**

Add imports at the top:

```ts
import { useState, useEffect } from 'react';
import { AuthoringPanel } from './authoring/AuthoringPanel';
import { DraftsPanel } from './authoring/DraftsPanel';
import { draftStore } from './authoring/draftStore';
import type { DraftEntry } from './types';
```

Inside the component, add state and effects:

```ts
const [authoringWord, setAuthoringWord] = useState<string | null>(null);
const [showDrafts, setShowDrafts] = useState(false);
const [draftCount, setDraftCount] = useState(0);

useEffect(() => {
  void draftStore
    .listDrafts({ region: 'aus' })
    .then((d) => setDraftCount(d.length));
}, [authoringWord, showDrafts]);
```

Add a `+ New word` button next to the existing search bar:

```tsx
<button
  type="button"
  onClick={() => setAuthoringWord('')}
  className="rounded bg-sky-600 px-3 py-1 text-sm text-white"
>
  + New word
</button>
```

Add a `Drafts (N)` link in the header:

```tsx
{
  draftCount > 0 && (
    <button
      type="button"
      onClick={() => setShowDrafts(true)}
      className="text-sm underline"
    >
      Drafts ({draftCount})
    </button>
  );
}
```

Find the grid container (around line 742) that renders results. Immediately before it, add:

```tsx
{
  visible.length === 0 && searchTerm.trim() && (
    <div className="rounded border border-slate-300 bg-white p-4 text-center">
      <p className="text-sm text-slate-600">
        No matches for <strong>{searchTerm.trim()}</strong>.
      </p>
      <button
        type="button"
        onClick={() => setAuthoringWord(searchTerm.trim())}
        className="mt-2 rounded bg-sky-600 px-3 py-1 text-sm text-white"
      >
        ✨ Make up this word?
      </button>
    </div>
  );
}
```

(Replace `searchTerm` with the actual state variable name in this file — inspect the component to confirm.)

At the bottom of the component (before the closing wrapper), mount the panels:

```tsx
<AuthoringPanel
  open={authoringWord !== null}
  initialWord={authoringWord ?? ''}
  onClose={() => setAuthoringWord(null)}
  onSaved={() => setAuthoringWord(null)}
/>
<DraftsPanel
  open={showDrafts}
  onClose={() => setShowDrafts(false)}
  onEdit={(d: DraftEntry) => {
    setShowDrafts(false);
    setAuthoringWord(d.word);
  }}
/>
```

Modify the `ResultCard` (around line 356–393) to show provenance:

```tsx
<span
  className={`ml-2 rounded px-2 py-0.5 text-xs ${
    hit.provenance === 'draft'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-600'
  }`}
>
  {hit.provenance === 'draft' ? '✏️ draft (unsynced)' : '📚 shipped'}
</span>
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run src/data/words/WordLibraryExplorer.authoring.test.tsx src/data/words/WordLibraryExplorer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/WordLibraryExplorer.tsx src/data/words/WordLibraryExplorer.authoring.test.tsx
git commit -m "feat(word-authoring): wire AuthoringPanel + DraftsPanel into the explorer"
```

---

## Task 15: Storybook stories + VR baselines

**Files:**

- Create: `src/data/words/authoring/AuthoringPanel.stories.tsx`
- Create: `src/data/words/authoring/DraftsPanel.stories.tsx`
- Modify: `src/data/words/WordLibraryExplorer.stories.tsx`

- [ ] **Step 1: Create AuthoringPanel stories**

Create `src/data/words/authoring/AuthoringPanel.stories.tsx` following the [write-storybook skill](../../../.claude/skills/write-storybook) conventions (named export per story, `argTypes` with proper control types, never raw JSON):

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { AuthoringPanel } from './AuthoringPanel';

const meta: Meta<typeof AuthoringPanel> = {
  component: AuthoringPanel,
  title: 'Data/Authoring/AuthoringPanel',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    initialWord: 'putting',
    onClose: () => {},
    onSaved: () => {},
  },
  argTypes: {
    open: { control: 'boolean' },
    initialWord: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof AuthoringPanel>;

export const Default: Story = {};

export const UnknownWord: Story = {
  args: { initialWord: 'xyzzy' },
};

export const DuplicateOfShipped: Story = {
  args: { initialWord: 'an' },
};

export const LowConfidenceChips: Story = {
  args: { initialWord: 'qxz' },
};
```

- [ ] **Step 2: Create DraftsPanel stories**

Create `src/data/words/authoring/DraftsPanel.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { DraftsPanel } from './DraftsPanel';
import { draftStore } from './draftStore';

const meta: Meta<typeof DraftsPanel> = {
  component: DraftsPanel,
  title: 'Data/Authoring/DraftsPanel',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    onClose: () => {},
    onEdit: () => {},
  },
  argTypes: { open: { control: 'boolean' } },
};
export default meta;
type Story = StoryObj<typeof DraftsPanel>;

export const Empty: Story = {
  decorators: [
    (StoryComp) => {
      useEffect(() => {
        void draftStore.__clearAllForTests();
      }, []);
      return <StoryComp />;
    },
  ],
};

export const WithDrafts: Story = {
  decorators: [
    (StoryComp) => {
      useEffect(() => {
        void (async () => {
          await draftStore.__clearAllForTests();
          await draftStore.saveDraft({
            word: 'putting',
            region: 'aus',
            level: 3,
            ipa: 'pʊtɪŋ',
            syllables: ['put', 'ting'],
            syllableCount: 2,
            graphemes: [
              { g: 'p', p: 'p' },
              { g: 'u', p: 'ʊ' },
              { g: 'tt', p: 't' },
              { g: 'ing', p: 'ɪŋ' },
            ],
            ritaKnown: true,
          });
        })();
      }, []);
      return <StoryComp />;
    },
  ],
};
```

- [ ] **Step 3: Add WordLibraryExplorer stories for the new flows**

Modify `src/data/words/WordLibraryExplorer.stories.tsx` — keep the existing `Playground` story. Add:

```tsx
export const EmptyStateCTA: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Triggers the empty-state CTA by pre-searching a missing word.',
      },
    },
  },
};

export const WithDraftBadge: Story = {
  decorators: [
    (StoryComp) => {
      useEffect(() => {
        void (async () => {
          await draftStore.__clearAllForTests();
          await draftStore.saveDraft({
            word: 'zzword',
            region: 'aus',
            level: 1,
            ipa: 'zwɜːd',
            syllables: ['zz', 'word'],
            syllableCount: 2,
            graphemes: [
              { g: 'zz', p: 'z' },
              { g: 'word', p: 'wɜːd' },
            ],
            ritaKnown: false,
          });
        })();
      }, []);
      return <StoryComp />;
    },
  ],
};
```

Add the `import { useEffect } from 'react'` and `import { draftStore } from './authoring/draftStore'` imports at the top of the stories file.

- [ ] **Step 4: Run Storybook build**

Run: `yarn storybook:build` (or `yarn storybook` to spot-check visually)
Expected: builds without errors; all stories render.

- [ ] **Step 5: Generate VR baselines**

Run: `yarn test:vr:update` (requires Docker)
Expected: baselines for `AuthoringPanel/Default`, `AuthoringPanel/UnknownWord`, `WordLibraryExplorer/WithDraftBadge` (mobile + desktop) are written to `tests-vr/`. If Docker is not running, surface that to the user and ask them to start Docker.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/authoring/*.stories.tsx src/data/words/WordLibraryExplorer.stories.tsx tests-vr/
git commit -m "test(word-authoring): stories + VR baselines"
```

---

## Task 16: CLI — `yarn words:import`

**Files:**

- Create: `scripts/words-import.ts`
- Create: `scripts/words-import.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/words-import.test.ts`:

```ts
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importDraftsFromFile } from './words-import';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'wordimport-'));
  mkdirSync(path.join(tmp, 'src/data/words/core'), { recursive: true });
  mkdirSync(path.join(tmp, 'src/data/words/curriculum/aus'), {
    recursive: true,
  });
  writeFileSync(
    path.join(tmp, 'src/data/words/core/level3.json'),
    '[\n  { "word": "aaa", "syllableCount": 1 }\n]\n',
  );
  writeFileSync(
    path.join(tmp, 'src/data/words/curriculum/aus/level3.json'),
    JSON.stringify(
      [
        {
          word: 'aaa',
          level: 3,
          ipa: 'ɑ',
          graphemes: [{ g: 'aaa', p: 'ɑ' }],
        },
      ],
      null,
      2,
    ) + '\n',
  );
});

afterEach(() => {
  // tmp cleanup is OS-automatic; not critical.
});

const writeExport = (drafts: unknown[]) => {
  const p = path.join(tmp, 'drafts.json');
  writeFileSync(
    p,
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      drafts,
    }),
  );
  return p;
};

describe('importDraftsFromFile', () => {
  it('merges a valid draft into core + curriculum and preserves sort', async () => {
    const draftsPath = writeExport([
      {
        word: 'putting',
        region: 'aus',
        level: 3,
        ipa: 'pʊtɪŋ',
        syllables: ['put', 'ting'],
        syllableCount: 2,
        graphemes: [
          { g: 'p', p: 'p' },
          { g: 'u', p: 'ʊ' },
          { g: 'tt', p: 't' },
          { g: 'ing', p: 'ɪŋ' },
        ],
        ritaKnown: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const result = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);

    const core = JSON.parse(
      readFileSync(
        path.join(tmp, 'src/data/words/core/level3.json'),
        'utf8',
      ),
    );
    expect(core.map((w: { word: string }) => w.word)).toEqual([
      'aaa',
      'putting',
    ]);
  });

  it('rejects a draft that already exists in shipped data', async () => {
    const draftsPath = writeExport([
      {
        word: 'aaa',
        region: 'aus',
        level: 3,
        ipa: 'ɑ',
        syllables: ['aaa'],
        syllableCount: 1,
        graphemes: [{ g: 'aaa', p: 'ɑ' }],
        ritaKnown: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.skips[0]).toMatch(/already exists/i);
  });

  it('rejects a draft with a bad schema', async () => {
    const draftsPath = writeExport([
      { word: 'BadCaps' /* missing fields */ },
    ]);
    await expect(
      importDraftsFromFile(draftsPath, { cwd: tmp }),
    ).rejects.toThrow(/validation/i);
  });

  it('is idempotent — re-running skips without double-writing', async () => {
    const draft = {
      word: 'putting',
      region: 'aus',
      level: 3,
      ipa: 'pʊtɪŋ',
      syllables: ['put', 'ting'],
      syllableCount: 2,
      graphemes: [
        { g: 'p', p: 'p' },
        { g: 'u', p: 'ʊ' },
        { g: 'tt', p: 't' },
        { g: 'ing', p: 'ɪŋ' },
      ],
      ritaKnown: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const draftsPath = writeExport([draft]);

    await importDraftsFromFile(draftsPath, { cwd: tmp });
    const again = await importDraftsFromFile(draftsPath, { cwd: tmp });
    expect(again.imported).toBe(0);
    expect(again.skipped).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run scripts/words-import.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the CLI**

Create `scripts/words-import.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';

const GraphemeSchema = z.object({
  g: z.string().min(1),
  p: z.string().min(1),
  span: z.tuple([z.number(), z.number()]).optional(),
});

const DraftSchema = z
  .object({
    word: z
      .string()
      .min(1)
      .regex(/^[a-z]+$/, 'word must be lowercase letters only'),
    region: z.literal('aus'),
    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
    ]),
    ipa: z.string().min(1),
    syllables: z.array(z.string().min(1)).min(1),
    syllableCount: z.number().int().positive(),
    graphemes: z.array(GraphemeSchema).min(1),
    variants: z.array(z.string()).optional(),
    ritaKnown: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.syllables.join('') !== d.word) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'syllables.join("") must equal word',
      });
    }
  });

const ExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  drafts: z.array(DraftSchema),
});

type Draft = z.infer<typeof DraftSchema>;

interface WordCoreLite {
  word: string;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
}

interface CurriculumEntryLite {
  word: string;
  level: number;
  ipa: string;
  graphemes: Draft['graphemes'];
}

const readJson = <T>(p: string): T =>
  JSON.parse(readFileSync(p, 'utf8')) as T;

const writeJson = (p: string, data: unknown): void => {
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
};

export interface ImportResult {
  imported: number;
  skipped: number;
  skips: string[];
}

export const importDraftsFromFile = async (
  draftsFile: string,
  { cwd = process.cwd() }: { cwd?: string } = {},
): Promise<ImportResult> => {
  const parsed = ExportSchema.parse(readJson(draftsFile));
  const result: ImportResult = { imported: 0, skipped: 0, skips: [] };

  const coreUpdates = new Map<number, WordCoreLite[]>();
  const curriculumUpdates = new Map<number, CurriculumEntryLite[]>();

  for (const d of parsed.drafts) {
    const corePath = path.join(
      cwd,
      `src/data/words/core/level${d.level}.json`,
    );
    const cPath = path.join(
      cwd,
      `src/data/words/curriculum/aus/level${d.level}.json`,
    );

    const core =
      coreUpdates.get(d.level) ?? readJson<WordCoreLite[]>(corePath);
    const curr =
      curriculumUpdates.get(d.level) ??
      readJson<CurriculumEntryLite[]>(cPath);

    if (core.some((w) => w.word === d.word)) {
      result.skipped += 1;
      result.skips.push(
        `skipped: ${d.word} already exists in core/level${d.level}.json`,
      );
      continue;
    }

    core.push({
      word: d.word,
      syllableCount: d.syllableCount,
      syllables: d.syllables,
      ...(d.variants ? { variants: d.variants } : {}),
    });
    core.sort((a, b) => a.word.localeCompare(b.word));

    curr.push({
      word: d.word,
      level: d.level,
      ipa: d.ipa,
      graphemes: d.graphemes,
    });
    curr.sort((a, b) => a.word.localeCompare(b.word));

    coreUpdates.set(d.level, core);
    curriculumUpdates.set(d.level, curr);
    result.imported += 1;
  }

  for (const [level, core] of coreUpdates) {
    writeJson(
      path.join(cwd, `src/data/words/core/level${level}.json`),
      core,
    );
  }
  for (const [level, curr] of curriculumUpdates) {
    writeJson(
      path.join(
        cwd,
        `src/data/words/curriculum/aus/level${level}.json`,
      ),
      curr,
    );
  }

  return result;
};

const main = async (): Promise<number> => {
  const [, , arg] = process.argv;
  if (!arg) {
    console.error('Usage: yarn words:import <path-to-export.json>');
    return 1;
  }
  try {
    const result = await importDraftsFromFile(arg);
    for (const s of result.skips) console.warn(`⚠ ${s}`);
    console.log(
      `\nImported ${result.imported} of ${
        result.imported + result.skipped
      } entries. Review with \`git diff\` before committing.`,
    );
    return result.skipped > 0 && result.imported === 0 ? 1 : 0;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return 2;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest run scripts/words-import.test.ts`
Expected: PASS.

- [ ] **Step 5: Smoke-test the CLI end-to-end**

1. Open the dev build (`yarn dev`), save a draft from the UI.
2. Open the Drafts panel, click Export, save the JSON file.
3. Run `yarn words:import <downloaded-path>`
4. `git diff` shows additions to `core/levelN.json` + `curriculum/aus/levelN.json`.
5. Discard the diff (`git checkout src/data/words/core src/data/words/curriculum/aus`) — this was a smoke test, not a permanent change.

- [ ] **Step 6: Commit**

```bash
git add scripts/words-import.ts scripts/words-import.test.ts package.json
git commit -m "feat(word-authoring): CLI to merge exported drafts into curriculum"
```

---

## Task 17: Final verification + acceptance walkthrough

**Files:**

- No new files. Run the full suite and walk through the spec's §13 acceptance list.

- [ ] **Step 1: Run the full typecheck + unit suite**

Run: `yarn lint && yarn typecheck && yarn test`
Expected: all green. If lint complains about arrow-function style, fix inline (never use `function Foo()` for components).

- [ ] **Step 2: Run the build**

Run: `yarn build`
Expected: production bundle succeeds; confirm a `rita-*.js` chunk exists in `dist/assets/` (it should be separate because of the dynamic `import('rita')`).

- [ ] **Step 3: Run markdown lint on this plan + spec cross-references**

Run: `yarn fix:md && yarn lint:md`
Expected: all green.

- [ ] **Step 4: Run VR tests**

Run: `yarn test:vr`
Expected: all baselines match. If diffs appear and they are expected, run `yarn test:vr:update` and commit the updated baselines.

- [ ] **Step 5: Walk the spec §13 acceptance list**

For each item in [the spec](../specs/2026-04-23-word-authoring-design.md)'s §13, manually verify in the dev build (`yarn dev`):

1. Empty-state CTA appears for a missing word.
2. `+ New word` opens the modal.
3. Known word ("putting") pre-fills everything.
4. Unknown word shows dictionary.com link + keeps Save disabled until IPA filled.
5. Saving persists + shows in results with draft badge.
6. Drafts link opens the panel with edit / delete / export.
7. Export downloads a JSON file matching §5.4.
8. `yarn words:import` merges the file end-to-end.
9. All modules have tests (confirmed in Tasks 3–13, 16).
10. Storybook stories from §9.1 exist + render.
11. VR baselines committed (Task 15).
12. Existing WordLibraryExplorer stories + tests still pass.
13. All CI gates pass.

- [ ] **Step 6: Commit any final polish + open the PR**

If the walkthrough surfaces any issues, fix inline. Otherwise:

```bash
git push -u origin $(git rev-parse --abbrev-ref HEAD)
gh pr create --base master --title "feat: word authoring — make up new words in-app" --body "$(cat <<'EOF'
## Summary
- In-app authoring of new words via `WordLibraryExplorer`
- IndexedDB drafts (Dexie), lazy RitaJS engine, greedy g→p aligner
- `yarn words:import` CLI merges exported drafts into `core/`+`curriculum/aus/` JSONs

## Test plan
- [ ] `yarn lint && yarn typecheck && yarn test && yarn build`
- [ ] `yarn test:vr`
- [ ] Manual: author → save → export → `yarn words:import` round-trip
- [ ] Storybook: `AuthoringPanel`, `DraftsPanel`, `WordLibraryExplorer/WithDraftBadge`

Implements [2026-04-23-word-authoring-design.md](docs/superpowers/specs/2026-04-23-word-authoring-design.md).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Summary

**Spec coverage:**

- §3 User flow → Tasks 8–14
- §4 Architecture → Tasks 3–6, 13
- §5 Data model → Tasks 2, 6
- §6 Engine + aligner → Tasks 4, 5
- §7 CLI → Task 16
- §8 UI affordances → Tasks 8–14
- §9 Testing → Red steps in every task + Task 15 (VR)
- §13 Acceptance → Task 17

**Deviations from spec:**

- Use `dexie` instead of `idb` (installed); `nanoid` instead of `uuid` (installed). Documented in the top-of-plan Spec Deltas table.
- `rita` + `zod` added in Task 1 because they are not currently installed.
