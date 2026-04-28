# Word Authoring (Make Up New Words) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add curator-only authoring of new words inside `WordLibraryExplorer` with IndexedDB drafts, portable export, and a Node CLI that merges drafts into canonical curriculum JSON.

**Architecture:** Five new browser modules under `src/data/words/authoring/` (engine, aligner, draftStore, AuthoringPanel, DraftsPanel) + one Node CLI under `scripts/` (`words-import.ts`). RitaJS is lazy-loaded. Drafts persist in a dedicated IndexedDB database (`basekill-word-drafts`). The existing `filter.ts` merges shipped + draft results at read time and tags each `WordHit` with `provenance`. Import loop is one-way manual: export JSON → transfer to dev machine → `yarn words:import` → PR.

**Tech Stack:** React + TypeScript, Vitest + React Testing Library, `idb` (IndexedDB wrapper), `rita` (lazy), `uuid` v7, `zod` (import validation), `fake-indexeddb` (tests), Storybook + Playwright VR.

**Spec reference:** [`docs/superpowers/specs/2026-04-23-word-authoring-design.md`](../specs/2026-04-23-word-authoring-design.md).

---

## File Structure

```text
src/data/words/
├── authoring/
│   ├── arpabet-to-ipa.ts
│   ├── arpabet-to-ipa.test.ts
│   ├── engine.ts                  // RitaJS adapter (lazy-imported)
│   ├── engine.test.ts
│   ├── aligner.ts                 // greedy g→p aligner (corpus-learned)
│   ├── aligner.test.ts
│   ├── draftStore.ts              // IndexedDB wrapper via `idb`
│   ├── draftStore.test.ts
│   ├── exportSchema.ts            // Zod schema shared with CLI
│   ├── suggestLevel.ts            // grapheme → level heuristic
│   ├── suggestLevel.test.ts
│   ├── AuthoringPanel.tsx         // modal / full-screen authoring UI
│   ├── AuthoringPanel.test.tsx
│   ├── AuthoringPanel.stories.tsx
│   ├── DraftsPanel.tsx
│   ├── DraftsPanel.test.tsx
│   ├── DraftsPanel.stories.tsx
│   └── index.ts                   // barrel
├── filter.ts                      // extended: merges shipped + drafts
├── types.ts                       // + DraftEntry, Provenance, WordHit.draftId
└── WordLibraryExplorer.tsx        // + CTA, + New word, Drafts(N), badge

scripts/
├── words-import.ts                // CLI (reads export JSON, writes core + curriculum)
└── words-import.test.mts          // .mts so vitest picks it up (see Task 28)
```

---

## Task 1: Install dependencies and extend types

**Files:**

- Modify: `package.json`
- Modify: `src/data/words/types.ts`
- Test: `src/data/words/types.test.ts` (new — type-only compile checks)

- [ ] **Step 1: Add runtime dependencies**

Run:

```bash
yarn add rita idb uuid zod
yarn add -D @types/uuid
```

Expected: `package.json` + `yarn.lock` updated. No code changes yet.

- [ ] **Step 2: Write failing type test**

Create `src/data/words/types.test.ts`:

```ts
import { describe, expectTypeOf, it } from 'vitest';
import type { DraftEntry, Provenance, WordHit } from './types';

describe('types', () => {
  it('DraftEntry has required fields', () => {
    expectTypeOf<DraftEntry>().toHaveProperty('id');
    expectTypeOf<DraftEntry>().toHaveProperty('word');
    expectTypeOf<DraftEntry>().toHaveProperty('region');
    expectTypeOf<DraftEntry>().toHaveProperty('level');
    expectTypeOf<DraftEntry>().toHaveProperty('ipa');
    expectTypeOf<DraftEntry>().toHaveProperty('syllables');
    expectTypeOf<DraftEntry>().toHaveProperty('graphemes');
    expectTypeOf<DraftEntry>().toHaveProperty('ritaKnown');
    expectTypeOf<DraftEntry>().toHaveProperty('createdAt');
    expectTypeOf<DraftEntry>().toHaveProperty('updatedAt');
  });

  it('Provenance is a string union', () => {
    expectTypeOf<Provenance>().toEqualTypeOf<'shipped' | 'draft'>();
  });

  it('WordHit has optional provenance + draftId', () => {
    expectTypeOf<WordHit>().toHaveProperty('provenance');
    expectTypeOf<WordHit>().toHaveProperty('draftId');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/data/words/types.test.ts`
Expected: FAIL — `DraftEntry` / `Provenance` unknown.

- [ ] **Step 4: Extend `types.ts`**

Append to `src/data/words/types.ts`:

```ts
export type Provenance = 'shipped' | 'draft';

export interface DraftEntry {
  id: string;
  word: string;
  region: 'aus';
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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

Modify `WordHit` (in the same file):

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
  provenance: Provenance;
  draftId?: string;
}
```

- [ ] **Step 5: Run typecheck + unit tests**

Run: `yarn typecheck && yarn test src/data/words/types.test.ts`
Expected: PASS.

> **Fallout:** adding a required `provenance` field to `WordHit` will cause type errors wherever `WordHit` is constructed. Fix in the same commit: in `filter.ts` `joinHits()` set `provenance: 'shipped'`.

- [ ] **Step 6: Fix `joinHits()` in `filter.ts`**

Edit `src/data/words/filter.ts` line ~141 — inside the spread, add `provenance: 'shipped' as const`.

- [ ] **Step 7: Run full typecheck**

Run: `yarn typecheck`
Expected: PASS (zero errors).

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock src/data/words/types.ts src/data/words/types.test.ts src/data/words/filter.ts
git commit -m "feat(words): add DraftEntry + Provenance types and dependencies"
```

---

## Task 2: ARPABET → IPA conversion map

**Files:**

- Create: `src/data/words/authoring/arpabet-to-ipa.ts`
- Test: `src/data/words/authoring/arpabet-to-ipa.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/arpabet-to-ipa.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { arpabetToIpa, arpabetsToPhonemes } from './arpabet-to-ipa';

describe('arpabetToIpa', () => {
  it('maps known ARPABET codes to IPA', () => {
    expect(arpabetToIpa('AH')).toBe('ʌ');
    expect(arpabetToIpa('UH')).toBe('ʊ');
    expect(arpabetToIpa('IH')).toBe('ɪ');
    expect(arpabetToIpa('NG')).toBe('ŋ');
    expect(arpabetToIpa('P')).toBe('p');
  });

  it('strips stress markers 0/1/2', () => {
    expect(arpabetToIpa('AH0')).toBe('ʌ');
    expect(arpabetToIpa('AH1')).toBe('ʌ');
    expect(arpabetToIpa('IH2')).toBe('ɪ');
  });

  it('returns empty string for unknown codes', () => {
    expect(arpabetToIpa('XX')).toBe('');
  });

  it('parses a RitaJS "phones" string', () => {
    // "putting" → "p-uh1 t-ih-ng"
    expect(arpabetsToPhonemes('p-uh1 t-ih-ng')).toEqual([
      'p',
      'ʊ',
      't',
      'ɪ',
      'ŋ',
    ]);
  });

  it('ignores empty segments in phones string', () => {
    expect(arpabetsToPhonemes('')).toEqual([]);
    expect(arpabetsToPhonemes('  -  ')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/words/authoring/arpabet-to-ipa.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the map**

Create `src/data/words/authoring/arpabet-to-ipa.ts`:

```ts
const MAP: Record<string, string> = {
  AA: 'ɑ',
  AE: 'æ',
  AH: 'ʌ',
  AO: 'ɔ',
  AW: 'aʊ',
  AY: 'aɪ',
  B: 'b',
  CH: 'tʃ',
  D: 'd',
  DH: 'ð',
  EH: 'e',
  ER: 'ɜ',
  EY: 'eɪ',
  F: 'f',
  G: 'g',
  HH: 'h',
  IH: 'ɪ',
  IY: 'iː',
  JH: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  NG: 'ŋ',
  OW: 'oʊ',
  OY: 'ɔɪ',
  P: 'p',
  R: 'r',
  S: 's',
  SH: 'ʃ',
  T: 't',
  TH: 'θ',
  UH: 'ʊ',
  UW: 'uː',
  V: 'v',
  W: 'w',
  Y: 'j',
  Z: 'z',
  ZH: 'ʒ',
};

export const arpabetToIpa = (code: string): string => {
  const stripped = code.replace(/[012]/g, '').toUpperCase();
  return MAP[stripped] ?? '';
};

/** Parse a RitaJS phones string like "p-uh1 t-ih-ng" into ordered IPA phonemes. */
export const arpabetsToPhonemes = (phones: string): string[] =>
  phones
    .split(/[\s-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => arpabetToIpa(s))
    .filter((s) => s.length > 0);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/data/words/authoring/arpabet-to-ipa.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/arpabet-to-ipa.ts src/data/words/authoring/arpabet-to-ipa.test.ts
git commit -m "feat(authoring): ARPABET to IPA conversion map"
```

---

## Task 3: RitaJS engine adapter (`engine.ts`)

**Files:**

- Create: `src/data/words/authoring/engine.ts`
- Test: `src/data/words/authoring/engine.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/engine.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('rita', () => {
  const db: Record<
    string,
    { phones: string; syllables: string } | undefined
  > = {
    putting: { phones: 'p-uh1 t-ih-ng', syllables: 'p-uh/t-ih-ng' },
    cat: { phones: 'k-ae1 t', syllables: 'k-ae-t' },
  };
  return {
    RiTa: {
      isKnownWord: (w: string) => db[w] !== undefined,
      phones: (w: string) => db[w]?.phones ?? '',
      syllables: (w: string) => db[w]?.syllables ?? '',
    },
  };
});

import { generateBreakdown } from './engine';

describe('generateBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns IPA + phonemes for a known word', async () => {
    const b = await generateBreakdown('putting');
    expect(b.ritaKnown).toBe(true);
    expect(b.phonemes).toEqual(['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    expect(b.ipa).toBe('pʊtɪŋ');
  });

  it('returns empty fields for an unknown word', async () => {
    const b = await generateBreakdown('qxz');
    expect(b).toEqual({
      word: 'qxz',
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown: false,
    });
  });

  it('normalises input to lowercase', async () => {
    const b = await generateBreakdown('  CAT  ');
    expect(b.ritaKnown).toBe(true);
    expect(b.word).toBe('cat');
    expect(b.phonemes).toEqual(['k', 'æ', 't']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/words/authoring/engine.test.ts`
Expected: FAIL — `./engine` module not found.

- [ ] **Step 3: Implement engine**

Create `src/data/words/authoring/engine.ts`:

```ts
import { arpabetsToPhonemes } from './arpabet-to-ipa';

export interface Breakdown {
  word: string;
  ipa: string;
  syllables: string[];
  phonemes: string[];
  ritaKnown: boolean;
}

export const generateBreakdown = async (
  raw: string,
): Promise<Breakdown> => {
  const word = raw.trim().toLowerCase();
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
  const phonemes = arpabetsToPhonemes(phonesStr);
  const ipa = phonemes.join('');
  return {
    word,
    ipa,
    phonemes,
    syllables: [], // filled in Task 7 by aligner; kept empty here for pure phoneme-only breakdown
    ritaKnown: true,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/data/words/authoring/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/engine.ts src/data/words/authoring/engine.test.ts
git commit -m "feat(authoring): RitaJS engine adapter with lazy import"
```

---

## Task 4: Aligner — corpus frequency table

**Files:**

- Create: `src/data/words/authoring/aligner.ts`
- Test: `src/data/words/authoring/aligner.test.ts`

Build the frequency table from shipped curriculum on module init. This is the data the greedy matcher consults.

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/aligner.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { __resetAlignerForTests, buildFrequencyTable } from './aligner';
import type { CurriculumEntry } from '../types';

describe('buildFrequencyTable', () => {
  it('tallies grapheme→phoneme pairs from curriculum', () => {
    const corpus: CurriculumEntry[] = [
      {
        word: 'sat',
        level: 1,
        ipa: 'sæt',
        graphemes: [
          { g: 's', p: 's' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      },
      {
        word: 'cat',
        level: 1,
        ipa: 'kæt',
        graphemes: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      },
    ];
    const table = buildFrequencyTable(corpus);
    expect(table.gpFreq.get('a')?.get('æ')).toBe(2);
    expect(table.gpFreq.get('t')?.get('t')).toBe(2);
    expect(table.gpFreq.get('s')?.get('s')).toBe(1);
    expect(table.gpFreq.get('c')?.get('k')).toBe(1);
  });

  it('collects multi-letter graphemes', () => {
    const corpus: CurriculumEntry[] = [
      {
        word: 'ship',
        level: 4,
        ipa: 'ʃɪp',
        graphemes: [
          { g: 'sh', p: 'ʃ' },
          { g: 'i', p: 'ɪ' },
          { g: 'p', p: 'p' },
        ],
      },
    ];
    const table = buildFrequencyTable(corpus);
    expect(table.multiLetter.has('sh')).toBe(true);
    expect(table.multiLetter.has('i')).toBe(false); // single-letter excluded
  });
});

describe('aligner reset', () => {
  it('__resetAlignerForTests exists for test isolation', () => {
    expect(typeof __resetAlignerForTests).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the frequency builder**

Create `src/data/words/authoring/aligner.ts`:

```ts
import type { CurriculumEntry, Grapheme } from '../types';

export interface FrequencyTable {
  /** grapheme → phoneme → count */
  gpFreq: Map<string, Map<string, number>>;
  /** set of grapheme strings with length > 1 (e.g. 'sh', 'ing') */
  multiLetter: Set<string>;
  /** max count per phoneme, used to normalise confidence */
  maxPerPhoneme: Map<string, number>;
}

export const buildFrequencyTable = (
  corpus: readonly CurriculumEntry[],
): FrequencyTable => {
  const gpFreq = new Map<string, Map<string, number>>();
  const multiLetter = new Set<string>();
  const maxPerPhoneme = new Map<string, number>();

  for (const entry of corpus) {
    for (const gram of entry.graphemes) {
      const { g, p } = gram;
      const inner = gpFreq.get(g) ?? new Map<string, number>();
      const next = (inner.get(p) ?? 0) + 1;
      inner.set(p, next);
      gpFreq.set(g, inner);
      if (g.length > 1) multiLetter.add(g);
      maxPerPhoneme.set(p, Math.max(maxPerPhoneme.get(p) ?? 0, next));
    }
  }

  return { gpFreq, multiLetter, maxPerPhoneme };
};

let cachedTable: FrequencyTable | null = null;

export const __resetAlignerForTests = (): void => {
  cachedTable = null;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/aligner.ts src/data/words/authoring/aligner.test.ts
git commit -m "feat(authoring): aligner frequency table builder"
```

---

## Task 5: Aligner — greedy matcher core

**Files:**

- Modify: `src/data/words/authoring/aligner.ts`
- Modify: `src/data/words/authoring/aligner.test.ts`

- [ ] **Step 1: Append failing tests for `alignGreedy`**

Append to `aligner.test.ts`:

```ts
import { alignGreedy } from './aligner';

describe('alignGreedy', () => {
  const table = buildFrequencyTable([
    {
      word: 'sat',
      level: 1,
      ipa: 'sæt',
      graphemes: [
        { g: 's', p: 's' },
        { g: 'a', p: 'æ' },
        { g: 't', p: 't' },
      ],
    },
    {
      word: 'ship',
      level: 4,
      ipa: 'ʃɪp',
      graphemes: [
        { g: 'sh', p: 'ʃ' },
        { g: 'i', p: 'ɪ' },
        { g: 'p', p: 'p' },
      ],
    },
    {
      word: 'putting',
      level: 3,
      ipa: 'pʊtɪŋ',
      graphemes: [
        { g: 'p', p: 'p' },
        { g: 'u', p: 'ʊ' },
        { g: 'tt', p: 't' },
        { g: 'ing', p: 'ɪŋ' },
      ],
    },
  ]);

  it('aligns a simple word', () => {
    const out = alignGreedy('sat', ['s', 'æ', 't'], table);
    expect(out.map((g) => g.g)).toEqual(['s', 'a', 't']);
    expect(out.map((g) => g.p)).toEqual(['s', 'æ', 't']);
  });

  it('prefers longest known multi-letter grapheme', () => {
    const out = alignGreedy('ship', ['ʃ', 'ɪ', 'p'], table);
    expect(out.map((g) => g.g)).toEqual(['sh', 'i', 'p']);
  });

  it('assigns high confidence to corpus-frequent mappings', () => {
    const out = alignGreedy('sat', ['s', 'æ', 't'], table);
    for (const g of out)
      expect(g.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('assigns low confidence to unseen mappings', () => {
    const out = alignGreedy('zq', ['z', 'k'], table); // z→k unseen
    const last = out[out.length - 1];
    expect(last?.confidence).toBeLessThan(0.5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: FAIL — `alignGreedy` not exported.

- [ ] **Step 3: Implement greedy matcher**

Append to `src/data/words/authoring/aligner.ts`:

```ts
export interface AlignedGrapheme extends Grapheme {
  /** 0–1; lower = aligner less confident. UI flags <0.5 in amber. */
  confidence: number;
}

const MAX_GRAPHEME_LEN = 4;

const candidateGraphemes = (
  word: string,
  letterIdx: number,
  table: FrequencyTable,
): string[] => {
  const candidates = new Set<string>();
  const maxLen = Math.min(MAX_GRAPHEME_LEN, word.length - letterIdx);
  for (let len = maxLen; len >= 1; len -= 1) {
    const slice = word.slice(letterIdx, letterIdx + len);
    if (len === 1 || table.multiLetter.has(slice)) {
      candidates.add(slice);
    }
  }
  return [...candidates];
};

const scorePair = (
  g: string,
  p: string,
  table: FrequencyTable,
): number => {
  const count = table.gpFreq.get(g)?.get(p) ?? 0;
  const max = table.maxPerPhoneme.get(p) ?? 0;
  if (count === 0 || max === 0) return 0;
  return count / max;
};

export const alignGreedy = (
  word: string,
  phonemes: readonly string[],
  table: FrequencyTable,
): AlignedGrapheme[] => {
  const result: AlignedGrapheme[] = [];
  let letterIdx = 0;
  let phonemeIdx = 0;

  while (letterIdx < word.length && phonemeIdx < phonemes.length) {
    const phoneme = phonemes[phonemeIdx] ?? '';
    const cands = candidateGraphemes(word, letterIdx, table);
    let best: { g: string; score: number } = {
      g: cands[0] ?? '',
      score: 0,
    };
    for (const g of cands) {
      const s = scorePair(g, phoneme, table);
      if (s > best.score) best = { g, score: s };
    }
    // If no seen mapping, fall back to longest candidate with low confidence.
    const chosen =
      best.score > 0
        ? best.g
        : (cands.sort((a, b) => b.length - a.length)[0] ?? '');
    const confidence = best.score > 0 ? best.score : 0.2;
    result.push({ g: chosen, p: phoneme, confidence });
    letterIdx += chosen.length;
    phonemeIdx += 1;
  }

  // Silent-letter absorb: if letters remain but phonemes are done,
  // append the trailing letters to the last emitted grapheme.
  if (letterIdx < word.length && result.length > 0) {
    const tail = word.slice(letterIdx);
    const last = result[result.length - 1];
    if (last) {
      result[result.length - 1] = {
        ...last,
        g: last.g + tail,
        confidence: Math.min(last.confidence, 0.4),
      };
    }
  }

  return result;
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/aligner.ts src/data/words/authoring/aligner.test.ts
git commit -m "feat(authoring): greedy grapheme-to-phoneme aligner"
```

---

## Task 6: Aligner — corpus-loader entry point + golden fixtures

**Files:**

- Modify: `src/data/words/authoring/aligner.ts`
- Modify: `src/data/words/authoring/aligner.test.ts`

Wire `alignGreedy` to a public `align()` that lazy-loads the shipped curriculum via the same loader `filter.ts` uses, and verify against a golden fixture set of existing shipped words.

- [ ] **Step 1: Append failing fixture test**

Append to `aligner.test.ts`:

```ts
import { align, __primeAlignerForTests } from './aligner';

describe('align (golden fixtures)', () => {
  const fixtures: Array<{
    word: string;
    phonemes: string[];
    expectedG: string[];
  }> = [
    {
      word: 'sat',
      phonemes: ['s', 'æ', 't'],
      expectedG: ['s', 'a', 't'],
    },
    {
      word: 'ship',
      phonemes: ['ʃ', 'ɪ', 'p'],
      expectedG: ['sh', 'i', 'p'],
    },
    {
      word: 'putting',
      phonemes: ['p', 'ʊ', 't', 'ɪ', 'ŋ'],
      expectedG: ['p', 'u', 'tt', 'ing'],
    },
  ];

  beforeEach(() => {
    __resetAlignerForTests();
    __primeAlignerForTests([
      {
        word: 'sat',
        level: 1,
        ipa: 'sæt',
        graphemes: [
          { g: 's', p: 's' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      },
      {
        word: 'ship',
        level: 4,
        ipa: 'ʃɪp',
        graphemes: [
          { g: 'sh', p: 'ʃ' },
          { g: 'i', p: 'ɪ' },
          { g: 'p', p: 'p' },
        ],
      },
      {
        word: 'putting',
        level: 3,
        ipa: 'pʊtɪŋ',
        graphemes: [
          { g: 'p', p: 'p' },
          { g: 'u', p: 'ʊ' },
          { g: 'tt', p: 't' },
          { g: 'ing', p: 'ɪŋ' },
        ],
      },
    ]);
  });

  for (const fx of fixtures) {
    it(`reproduces shipped alignment for "${fx.word}"`, async () => {
      const out = await align(fx.word, fx.phonemes);
      expect(out.map((g) => g.g)).toEqual(fx.expectedG);
    });
  }
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: FAIL — `align` / `__primeAlignerForTests` not exported.

- [ ] **Step 3: Add async `align()` + test-priming seam**

Append to `src/data/words/authoring/aligner.ts`:

```ts
import { loadAusCurriculumForAligner } from './aligner-corpus';

export const align = async (
  word: string,
  phonemes: readonly string[],
): Promise<AlignedGrapheme[]> => {
  if (!cachedTable) {
    const corpus = await loadAusCurriculumForAligner();
    cachedTable = buildFrequencyTable(corpus);
  }
  return alignGreedy(word, phonemes, cachedTable);
};

export const __primeAlignerForTests = (
  corpus: readonly CurriculumEntry[],
): void => {
  cachedTable = buildFrequencyTable(corpus);
};
```

- [ ] **Step 4: Create the corpus loader**

Create `src/data/words/authoring/aligner-corpus.ts`:

```ts
import type { CurriculumEntry } from '../types';

// Statically import AUS curriculum chunks (small; eagerly bundled).
// RitaJS is the heavy part and is loaded lazily from engine.ts.
import level1 from '../curriculum/aus/level1.json';
import level2 from '../curriculum/aus/level2.json';
import level3 from '../curriculum/aus/level3.json';
import level4 from '../curriculum/aus/level4.json';
import level5 from '../curriculum/aus/level5.json';
import level6 from '../curriculum/aus/level6.json';
import level7 from '../curriculum/aus/level7.json';
import level8 from '../curriculum/aus/level8.json';

export const loadAusCurriculumForAligner = async (): Promise<
  readonly CurriculumEntry[]
> => {
  return [
    ...(level1 as CurriculumEntry[]),
    ...(level2 as CurriculumEntry[]),
    ...(level3 as CurriculumEntry[]),
    ...(level4 as CurriculumEntry[]),
    ...(level5 as CurriculumEntry[]),
    ...(level6 as CurriculumEntry[]),
    ...(level7 as CurriculumEntry[]),
    ...(level8 as CurriculumEntry[]),
  ];
};
```

- [ ] **Step 5: Run tests**

Run: `yarn test src/data/words/authoring/aligner.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/authoring/aligner.ts src/data/words/authoring/aligner-corpus.ts src/data/words/authoring/aligner.test.ts
git commit -m "feat(authoring): aligner public API with lazy corpus init"
```

---

## Task 7: Level suggestion heuristic (`suggestLevel.ts`)

**Files:**

- Create: `src/data/words/authoring/suggestLevel.ts`
- Test: `src/data/words/authoring/suggestLevel.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/suggestLevel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { suggestLevel } from './suggestLevel';

describe('suggestLevel', () => {
  it('returns lowest level when only L1 graphemes used', () => {
    const res = suggestLevel([
      { g: 's', p: 's' },
      { g: 'a', p: 'æ' },
      { g: 't', p: 't' },
    ]);
    expect(res.level).toBe(1);
    expect(res.reason).toContain('L1');
  });

  it('uses highest grapheme level among the breakdown', () => {
    // 'sh' is L4
    const res = suggestLevel([
      { g: 's', p: 's' },
      { g: 'h', p: 'h' }, // h is L3
      { g: 'sh', p: 'ʃ' },
    ]);
    expect(res.level).toBe(4);
    expect(res.reason).toContain('sh');
  });

  it('falls back to level 8 for graphemes not in any level', () => {
    const res = suggestLevel([{ g: 'xz', p: 'ks' }]);
    expect(res.level).toBe(8);
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/suggestLevel.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/data/words/authoring/suggestLevel.ts`:

```ts
import { GRAPHEMES_BY_LEVEL } from '../levels';
import type { Grapheme } from '../types';

const lookupLevel = (g: string): number | null => {
  for (let lvl = 1; lvl <= 8; lvl += 1) {
    const units = GRAPHEMES_BY_LEVEL[lvl];
    if (!units) continue;
    if (units.some((u) => u.g === g)) return lvl;
  }
  return null;
};

export interface LevelSuggestion {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  reason: string;
}

export const suggestLevel = (
  graphemes: readonly Grapheme[],
): LevelSuggestion => {
  let top: { g: string; level: number } = { g: '', level: 1 };
  let allMatched = true;
  for (const gram of graphemes) {
    const lvl = lookupLevel(gram.g);
    if (lvl === null) {
      allMatched = false;
      continue;
    }
    if (lvl > top.level) top = { g: gram.g, level: lvl };
  }
  const level = (
    allMatched ? top.level : 8
  ) as LevelSuggestion['level'];
  const reason = allMatched
    ? `suggested L${level} — highest grapheme used: ${(top.g || graphemes[0]?.g) ?? ''}`
    : `suggested L8 — contains graphemes outside the level inventory`;
  return { level, reason };
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/suggestLevel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/suggestLevel.ts src/data/words/authoring/suggestLevel.test.ts
git commit -m "feat(authoring): level suggestion from grapheme breakdown"
```

---

## Task 8: Export schema (shared between browser + CLI)

**Files:**

- Create: `src/data/words/authoring/exportSchema.ts`
- Test: `src/data/words/authoring/exportSchema.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/exportSchema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { exportFileSchema } from './exportSchema';

const valid = {
  version: 1,
  exportedAt: '2026-04-23T22:14:00.000Z',
  drafts: [
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
      createdAt: '2026-04-23T21:55:00.000Z',
      updatedAt: '2026-04-23T22:13:42.000Z',
    },
  ],
};

describe('exportFileSchema', () => {
  it('accepts a valid export file', () => {
    expect(exportFileSchema.parse(valid)).toEqual(valid);
  });

  it('rejects wrong version', () => {
    expect(() =>
      exportFileSchema.parse({ ...valid, version: 2 }),
    ).toThrow();
  });

  it('rejects non-aus region (v1 lock)', () => {
    const bad = {
      ...valid,
      drafts: [{ ...valid.drafts[0], region: 'us' }],
    };
    expect(() => exportFileSchema.parse(bad)).toThrow();
  });

  it('rejects syllables whose join does not equal word', () => {
    const bad = {
      ...valid,
      drafts: [{ ...valid.drafts[0], syllables: ['put', 'xng'] }],
    };
    expect(() => exportFileSchema.parse(bad)).toThrow(/syllables/);
  });

  it('rejects level outside 1..8', () => {
    const bad = {
      ...valid,
      drafts: [{ ...valid.drafts[0], level: 9 }],
    };
    expect(() => exportFileSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/exportSchema.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/data/words/authoring/exportSchema.ts`:

```ts
import { z } from 'zod';

const graphemeSchema = z.object({
  g: z.string().min(1),
  p: z.string().min(1),
  span: z.tuple([z.number().int(), z.number().int()]).optional(),
});

const draftExportSchema = z
  .object({
    word: z
      .string()
      .regex(/^[a-z]+$/, 'word must be lowercase letters only'),
    region: z.literal('aus'),
    level: z.number().int().min(1).max(8) as z.ZodType<
      1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
    >,
    ipa: z.string().min(1),
    syllables: z.array(z.string().min(1)),
    syllableCount: z.number().int().positive(),
    graphemes: z.array(graphemeSchema).min(1),
    variants: z.array(z.string().min(1)).optional(),
    ritaKnown: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .refine((d) => d.syllables.join('') === d.word, {
    message: 'syllables must concatenate to word',
    path: ['syllables'],
  })
  .refine((d) => d.syllables.length === d.syllableCount, {
    message: 'syllableCount must equal syllables.length',
    path: ['syllableCount'],
  });

export const exportFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  drafts: z.array(draftExportSchema),
});

export type DraftExport = z.infer<typeof draftExportSchema>;
export type ExportFile = z.infer<typeof exportFileSchema>;
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/exportSchema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/exportSchema.ts src/data/words/authoring/exportSchema.test.ts
git commit -m "feat(authoring): export file Zod schema"
```

---

## Task 9: Draft store — open + create

**Files:**

- Create: `src/data/words/authoring/draftStore.ts`
- Test: `src/data/words/authoring/draftStore.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/draftStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import {
  DB_NAME,
  createDraft,
  listDrafts,
  openDraftDB,
} from './draftStore';

describe('draftStore — open + create', () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it('opens the database at the current version', async () => {
    const db = await openDraftDB();
    expect(db.name).toBe(DB_NAME);
    expect(db.version).toBe(1);
    expect(db.objectStoreNames.contains('drafts')).toBe(true);
    db.close();
  });

  it('creates a draft with generated id + timestamps', async () => {
    const draft = await createDraft({
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
    expect(draft.id).toMatch(/^[0-9a-f-]{20,}$/i);
    expect(draft.createdAt).toEqual(draft.updatedAt);
    const all = await listDrafts({ region: 'aus' });
    expect(all).toHaveLength(1);
    expect(all[0]?.word).toBe('putting');
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/draftStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement open + create + list**

Create `src/data/words/authoring/draftStore.ts`:

```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { v7 as uuidv7 } from 'uuid';
import type { DraftEntry, Grapheme } from '../types';

export const DB_NAME = 'basekill-word-drafts';
export const DB_VERSION = 1;
export const STORE = 'drafts';

interface DraftDBSchema extends DBSchema {
  drafts: {
    key: string;
    value: DraftEntry;
    indexes: {
      byRegionWord: [string, string];
      byRegionLevel: [string, number];
    };
  };
}

export const openDraftDB = (): Promise<IDBPDatabase<DraftDBSchema>> =>
  openDB<DraftDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('byRegionWord', ['region', 'word'], {
        unique: true,
      });
      store.createIndex('byRegionLevel', ['region', 'level']);
    },
  });

export interface CreateDraftInput {
  word: string;
  region: 'aus';
  level: DraftEntry['level'];
  ipa: string;
  syllables: string[];
  syllableCount: number;
  graphemes: Grapheme[];
  variants?: string[];
  ritaKnown: boolean;
}

export const createDraft = async (
  input: CreateDraftInput,
): Promise<DraftEntry> => {
  const now = new Date().toISOString();
  const draft: DraftEntry = {
    id: uuidv7(),
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  const db = await openDraftDB();
  try {
    await db.add(STORE, draft);
  } finally {
    db.close();
  }
  return draft;
};

export const listDrafts = async (
  opts: { region: 'aus' } = { region: 'aus' },
): Promise<DraftEntry[]> => {
  const db = await openDraftDB();
  try {
    const all = await db.getAll(STORE);
    return all.filter((d) => d.region === opts.region);
  } finally {
    db.close();
  }
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/draftStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/draftStore.ts src/data/words/authoring/draftStore.test.ts
git commit -m "feat(authoring): draft store open + create + list"
```

---

## Task 10: Draft store — update, delete, export

**Files:**

- Modify: `src/data/words/authoring/draftStore.ts`
- Modify: `src/data/words/authoring/draftStore.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `draftStore.test.ts`:

```ts
import {
  deleteDraft,
  exportDrafts,
  findDraftByWord,
  updateDraft,
} from './draftStore';

describe('draftStore — update/delete/export', () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it('rejects duplicate [region, word] on create', async () => {
    const base = {
      word: 'cat',
      region: 'aus' as const,
      level: 1 as const,
      ipa: 'kæt',
      syllables: ['cat'],
      syllableCount: 1,
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a', p: 'æ' },
        { g: 't', p: 't' },
      ],
      ritaKnown: true,
    };
    await createDraft(base);
    await expect(createDraft(base)).rejects.toThrow();
  });

  it('updates an existing draft and bumps updatedAt', async () => {
    const d = await createDraft({
      word: 'cat',
      region: 'aus',
      level: 1,
      ipa: 'kæt',
      syllables: ['cat'],
      syllableCount: 1,
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a', p: 'æ' },
        { g: 't', p: 't' },
      ],
      ritaKnown: true,
    });
    const old = d.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const next = await updateDraft(d.id, { ipa: 'kæːt' });
    expect(next.ipa).toBe('kæːt');
    expect(next.updatedAt > old).toBe(true);
  });

  it('deletes a draft', async () => {
    const d = await createDraft({
      word: 'cat',
      region: 'aus',
      level: 1,
      ipa: 'kæt',
      syllables: ['cat'],
      syllableCount: 1,
      graphemes: [{ g: 'cat', p: 'kæt' }],
      ritaKnown: true,
    });
    await deleteDraft(d.id);
    const all = await listDrafts({ region: 'aus' });
    expect(all).toHaveLength(0);
  });

  it('findDraftByWord returns a draft or null', async () => {
    expect(await findDraftByWord('aus', 'cat')).toBeNull();
    await createDraft({
      word: 'cat',
      region: 'aus',
      level: 1,
      ipa: 'kæt',
      syllables: ['cat'],
      syllableCount: 1,
      graphemes: [{ g: 'cat', p: 'kæt' }],
      ritaKnown: true,
    });
    const found = await findDraftByWord('aus', 'cat');
    expect(found?.word).toBe('cat');
  });

  it('exportDrafts returns validated file shape without ids', async () => {
    await createDraft({
      word: 'cat',
      region: 'aus',
      level: 1,
      ipa: 'kæt',
      syllables: ['cat'],
      syllableCount: 1,
      graphemes: [
        { g: 'c', p: 'k' },
        { g: 'a', p: 'æ' },
        { g: 't', p: 't' },
      ],
      ritaKnown: true,
    });
    const out = await exportDrafts();
    expect(out.version).toBe(1);
    expect(out.drafts).toHaveLength(1);
    expect(Object.keys(out.drafts[0] ?? {})).not.toContain('id');
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/draftStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Append to `src/data/words/authoring/draftStore.ts`:

```ts
import { exportFileSchema, type ExportFile } from './exportSchema';

export const findDraftByWord = async (
  region: 'aus',
  word: string,
): Promise<DraftEntry | null> => {
  const db = await openDraftDB();
  try {
    const idx = db.transaction(STORE).store.index('byRegionWord');
    const hit = await idx.get([region, word]);
    return hit ?? null;
  } finally {
    db.close();
  }
};

export const updateDraft = async (
  id: string,
  patch: Partial<
    Omit<DraftEntry, 'id' | 'region' | 'createdAt' | 'updatedAt'>
  >,
): Promise<DraftEntry> => {
  const db = await openDraftDB();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const existing = await tx.store.get(id);
    if (!existing) throw new Error(`Draft ${id} not found`);
    const next: DraftEntry = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await tx.store.put(next);
    await tx.done;
    return next;
  } finally {
    db.close();
  }
};

export const deleteDraft = async (id: string): Promise<void> => {
  const db = await openDraftDB();
  try {
    await db.delete(STORE, id);
  } finally {
    db.close();
  }
};

export const exportDrafts = async (): Promise<ExportFile> => {
  const drafts = await listDrafts({ region: 'aus' });
  const stripped = drafts.map(({ id: _ignored, ...rest }) => rest);
  const payload = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    drafts: stripped,
  };
  return exportFileSchema.parse(payload);
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/draftStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/draftStore.ts src/data/words/authoring/draftStore.test.ts
git commit -m "feat(authoring): draft store update/delete/export"
```

---

## Task 11: Filter — merge drafts into search results

**Files:**

- Modify: `src/data/words/filter.ts`
- Modify: `src/data/words/filter.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `src/data/words/filter.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import {
  DB_NAME as DRAFT_DB,
  createDraft,
} from './authoring/draftStore';

describe('filterWords — drafts merge', () => {
  beforeEach(async () => {
    await deleteDB(DRAFT_DB);
    __resetChunkCacheForTests();
  });

  it('returns drafts alongside shipped words, tagged by provenance', async () => {
    await createDraft({
      word: 'zzzfakedraft',
      region: 'aus',
      level: 1,
      ipa: 'zzz',
      syllables: ['zzz', 'fake', 'draft'],
      syllableCount: 3,
      graphemes: [{ g: 'zzzfakedraft', p: 'zzz' }],
      ritaKnown: false,
    });
    const res = await filterWords({ region: 'aus', level: 1 });
    const draftHit = res.hits.find((h) => h.word === 'zzzfakedraft');
    expect(draftHit).toBeDefined();
    expect(draftHit?.provenance).toBe('draft');
    expect(draftHit?.draftId).toBeDefined();
    const shippedHit = res.hits.find((h) => h.provenance === 'shipped');
    expect(shippedHit).toBeDefined();
  });

  it('applies level/syllableCount filters to drafts too', async () => {
    await createDraft({
      word: 'zzzfakedraft',
      region: 'aus',
      level: 5,
      ipa: 'zzz',
      syllables: ['zzz'],
      syllableCount: 1,
      graphemes: [{ g: 'zzzfakedraft', p: 'zzz' }],
      ritaKnown: false,
    });
    const res = await filterWords({ region: 'aus', level: 1 });
    expect(
      res.hits.find((h) => h.word === 'zzzfakedraft'),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/filter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Modify `filter.ts`**

In `src/data/words/filter.ts`:

1. Add imports at the top:

```ts
import { listDrafts } from './authoring/draftStore';
import type { DraftEntry } from './types';
```

1. Add a helper below `joinHits()`:

```ts
const draftsToHits = (drafts: readonly DraftEntry[]): WordHit[] =>
  drafts.map((d) => ({
    word: d.word,
    region: d.region,
    level: d.level,
    syllableCount: d.syllableCount,
    syllables: d.syllables,
    variants: d.variants,
    ipa: d.ipa,
    graphemes: d.graphemes,
    provenance: 'draft' as const,
    draftId: d.id,
  }));
```

1. In `filterWords`, after computing `hits`:

```ts
const drafts =
  filter.region === 'aus' ? await listDrafts({ region: 'aus' }) : [];
const draftHits = draftsToHits(drafts).filter((h) =>
  entryMatches(h, filter),
);
const merged = [...hits, ...draftHits].sort((a, b) =>
  a.word.localeCompare(b.word),
);
```

1. Replace the `return { hits }` early-return with `return { hits: merged }`, and include draft hits in the fallback check: if `merged.length > 0` short-circuit. Final function:

```ts
export const filterWords = async (
  filter: WordFilter,
): Promise<FilterResult> => {
  const core = await loadCore();
  const curriculum = await loadCurriculum(filter.region);
  const shippedHits = joinHits(curriculum, core, filter.region).filter(
    (h) => entryMatches(h, filter),
  );

  const drafts =
    filter.region === 'aus' ? await listDrafts({ region: 'aus' }) : [];
  const draftHits = draftsToHits(drafts).filter((h) =>
    entryMatches(h, filter),
  );
  const merged = [...shippedHits, ...draftHits].sort((a, b) =>
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
  const ausShipped = joinHits(ausCurriculum, core, 'aus').filter((h) =>
    entryMatches(h, { ...filter, region: 'aus' }),
  );
  const ausDrafts = draftsToHits(
    await listDrafts({ region: 'aus' }),
  ).filter((h) => entryMatches(h, { ...filter, region: 'aus' }));
  const ausMerged = [...ausShipped, ...ausDrafts].sort((a, b) =>
    a.word.localeCompare(b.word),
  );
  return {
    hits: ausMerged,
    usedFallback: { from: filter.region, to: 'aus' },
  };
};
```

- [ ] **Step 4: Run unit tests**

Run: `yarn test src/data/words/filter.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full unit + typecheck**

Run: `yarn typecheck && yarn test src/data/words`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/filter.ts src/data/words/filter.test.ts
git commit -m "feat(words): merge drafts into filter results with provenance tag"
```

---

## Task 12: Barrel file for authoring

**Files:**

- Create: `src/data/words/authoring/index.ts`

- [ ] **Step 1: Write the barrel**

Create `src/data/words/authoring/index.ts`:

```ts
export { generateBreakdown, type Breakdown } from './engine';
export { align, type AlignedGrapheme } from './aligner';
export { suggestLevel, type LevelSuggestion } from './suggestLevel';
export {
  createDraft,
  deleteDraft,
  exportDrafts,
  findDraftByWord,
  listDrafts,
  updateDraft,
  type CreateDraftInput,
} from './draftStore';
export { exportFileSchema, type ExportFile } from './exportSchema';
```

- [ ] **Step 2: Typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/authoring/index.ts
git commit -m "chore(authoring): barrel file"
```

---

## Task 13: AuthoringPanel — scaffold (modal open/close)

**Files:**

- Create: `src/data/words/authoring/AuthoringPanel.tsx`
- Create: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/data/words/authoring/AuthoringPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { AuthoringPanel } from './AuthoringPanel';

describe('AuthoringPanel — scaffold', () => {
  it('renders title + close button when open', () => {
    render(
      <AuthoringPanel
        open
        initialWord=""
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /close/i }),
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AuthoringPanel
        open={false}
        initialWord=""
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <AuthoringPanel
        open
        initialWord=""
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /close/i }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement scaffold**

Create `src/data/words/authoring/AuthoringPanel.tsx`:

```tsx
import { useId } from 'react';
import { Button } from '#/components/ui/button';

export interface AuthoringPanelProps {
  open: boolean;
  initialWord: string;
  onClose: () => void;
  onSaved: (draftId: string) => void;
}

export const AuthoringPanel = ({
  open,
  initialWord: _initialWord,
  onClose,
  onSaved: _onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
    >
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        <h2 id={titleId} className="text-xl font-semibold">
          Make up a word
        </h2>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): AuthoringPanel scaffold"
```

---

## Task 14: AuthoringPanel — word field + debounced engine call

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Append failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
import { act } from '@testing-library/react';

vi.mock('./engine', () => ({
  generateBreakdown: vi.fn(async (w: string) => ({
    word: w,
    ipa: w === 'cat' ? 'kæt' : '',
    phonemes: w === 'cat' ? ['k', 'æ', 't'] : [],
    syllables: [],
    ritaKnown: w === 'cat',
  })),
}));

describe('AuthoringPanel — word field', () => {
  it('pre-fills word field from initialWord', () => {
    render(
      <AuthoringPanel
        open
        initialWord="putting"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(
      (screen.getByLabelText(/word/i) as HTMLInputElement).value,
    ).toBe('putting');
  });

  it('shows IPA after debounce', async () => {
    vi.useFakeTimers();
    render(
      <AuthoringPanel
        open
        initialWord=""
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/word/i);
    await userEvent.type(input, 'cat', {
      advanceTimers: vi.advanceTimersByTime,
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(await screen.findByDisplayValue('kæt')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Wire word field + debounced engine**

Rewrite `src/data/words/authoring/AuthoringPanel.tsx`:

```tsx
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { generateBreakdown, type Breakdown } from './engine';

const DEBOUNCE_MS = 400;

export interface AuthoringPanelProps {
  open: boolean;
  initialWord: string;
  onClose: () => void;
  onSaved: (draftId: string) => void;
}

export const AuthoringPanel = ({
  open,
  initialWord,
  onClose,
  onSaved: _onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  const wordId = useId();
  const ipaId = useId();
  const [word, setWord] = useState(initialWord);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runEngine = useCallback((raw: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (raw.trim() === '') {
        setBreakdown(null);
        return;
      }
      const b = await generateBreakdown(raw);
      setBreakdown(b);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (open) runEngine(initialWord);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, initialWord, runEngine]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
    >
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        <h2 id={titleId} className="text-xl font-semibold">
          Make up a word
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor={wordId}>Word</Label>
            <Input
              id={wordId}
              value={word}
              onChange={(e) => {
                setWord(e.target.value);
                runEngine(e.target.value);
              }}
            />
          </div>

          <div>
            <Label htmlFor={ipaId}>IPA</Label>
            <Input
              id={ipaId}
              value={breakdown?.ipa ?? ''}
              onChange={() => undefined}
              readOnly
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): word field with debounced engine call"
```

---

## Task 15: AuthoringPanel — unknown-word banner + editable IPA

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Append failing tests**

Append to `AuthoringPanel.test.tsx`:

```tsx
describe('AuthoringPanel — unknown-word handling', () => {
  it('shows banner + dictionary link when RitaJS does not know the word', async () => {
    vi.useFakeTimers();
    render(
      <AuthoringPanel
        open
        initialWord="qxz"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(
      await screen.findByText(/RitaJS doesn't know/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /dictionary\.com/i }),
    ).toHaveAttribute('href', 'https://www.dictionary.com/browse/qxz');
    vi.useRealTimers();
  });

  it('IPA field is editable when rita-unknown', async () => {
    vi.useFakeTimers();
    render(
      <AuthoringPanel
        open
        initialWord="qxz"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const ipa = (await screen.findByLabelText(
      /IPA/i,
    )) as HTMLInputElement;
    expect(ipa.readOnly).toBe(false);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Add banner + controllable IPA**

In `AuthoringPanel.tsx`, add an `ipaOverride` state, make the IPA input editable when `!breakdown?.ritaKnown`, and render the banner.

Insert below the word-field `<div>`:

```tsx
{
  breakdown && !breakdown.ritaKnown ? (
    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      RitaJS doesn't know <strong>{breakdown.word}</strong>. Look it up
      →{' '}
      <a
        className="underline"
        target="_blank"
        rel="noreferrer"
        href={`https://www.dictionary.com/browse/${encodeURIComponent(breakdown.word)}`}
      >
        Open in dictionary.com
      </a>
    </div>
  ) : null;
}
```

Replace the IPA input with:

```tsx
const [ipaOverride, setIpaOverride] = useState('');
// …inside effect when breakdown updates, reset override if rita known:
useEffect(() => {
  if (breakdown?.ritaKnown) setIpaOverride('');
}, [breakdown]);

// …and the input:
<Input
  id={ipaId}
  value={breakdown?.ritaKnown ? breakdown.ipa : ipaOverride}
  onChange={(e) => setIpaOverride(e.target.value)}
  readOnly={breakdown?.ritaKnown ?? false}
/>;
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): unknown-word banner + editable IPA"
```

---

## Task 16: AuthoringPanel — grapheme breakdown + level suggestion

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Append failing tests**

Append to `AuthoringPanel.test.tsx`:

```tsx
import { align, __primeAlignerForTests } from './aligner';

describe('AuthoringPanel — breakdown + level', () => {
  it('renders grapheme chips for a rita-known word', async () => {
    vi.useFakeTimers();
    __primeAlignerForTests([
      {
        word: 'cat',
        level: 1,
        ipa: 'kæt',
        graphemes: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      },
    ]);
    render(
      <AuthoringPanel
        open
        initialWord="cat"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(await screen.findByText('c')).toBeInTheDocument();
    expect(await screen.findByText('a')).toBeInTheDocument();
    expect(await screen.findByText('t')).toBeInTheDocument();
    // level suggestion shown
    expect(
      await screen.findByText(/suggested L1/i),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Wire aligner + suggestLevel**

In `AuthoringPanel.tsx`, add state for `graphemes` and `levelSuggestion`. After engine resolves, call `align(word, breakdown.phonemes)` and `suggestLevel(graphemes)`. Render:

```tsx
import { align, type AlignedGrapheme } from './aligner';
import { suggestLevel, type LevelSuggestion } from './suggestLevel';

// state
const [graphemes, setGraphemes] = useState<AlignedGrapheme[]>([]);
const [levelSuggestion, setLevelSuggestion] =
  useState<LevelSuggestion | null>(null);

// effect after breakdown resolves (inside runEngine's async work):
if (b.ritaKnown && b.phonemes.length > 0) {
  const aligned = await align(b.word, b.phonemes);
  setGraphemes(aligned);
  setLevelSuggestion(suggestLevel(aligned));
} else {
  setGraphemes([]);
  setLevelSuggestion(null);
}
```

Render chips + suggestion near the bottom of the modal body:

```tsx
{
  graphemes.length > 0 ? (
    <div>
      <Label>Grapheme breakdown</Label>
      <div className="flex flex-wrap gap-2" role="list">
        {graphemes.map((g, i) => (
          <div
            key={`${g.g}-${i}`}
            role="listitem"
            className={`rounded-md border px-2 py-1 text-center ${
              g.confidence < 0.5 ? 'border-amber-500' : 'border-input'
            }`}
          >
            <div className="text-sm font-medium">{g.g}</div>
            <div className="text-xs text-muted-foreground">{g.p}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null;
}
{
  levelSuggestion ? (
    <p className="text-xs text-muted-foreground">
      {levelSuggestion.reason}
    </p>
  ) : null;
}
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): grapheme chips + level suggestion"
```

---

## Task 17: AuthoringPanel — save flow + duplicate guard

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Append failing tests**

Append to `AuthoringPanel.test.tsx`:

```tsx
import { deleteDB } from 'idb';
import { DB_NAME as DRAFT_DB, listDrafts } from './draftStore';

beforeEach(async () => {
  await deleteDB(DRAFT_DB);
});

describe('AuthoringPanel — save', () => {
  it('Save is disabled when word collides with a shipped word', async () => {
    vi.useFakeTimers();
    render(
      <AuthoringPanel
        open
        initialWord="cat"
        onClose={vi.fn()}
        onSaved={vi.fn()}
        shippedWords={new Set(['cat'])}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const save = await screen.findByRole('button', { name: /save/i });
    expect(save).toBeDisabled();
    expect(
      screen.getByText(/already exists in shipped data/i),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Save persists a draft and calls onSaved', async () => {
    vi.useFakeTimers();
    __primeAlignerForTests([
      {
        word: 'cat',
        level: 1,
        ipa: 'kæt',
        graphemes: [
          { g: 'c', p: 'k' },
          { g: 'a', p: 'æ' },
          { g: 't', p: 't' },
        ],
      },
    ]);
    const onSaved = vi.fn();
    render(
      <AuthoringPanel
        open
        initialWord="cat"
        onClose={vi.fn()}
        onSaved={onSaved}
        shippedWords={new Set()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const save = await screen.findByRole('button', { name: /save/i });
    await userEvent.click(save);
    await vi.waitFor(async () => {
      expect(onSaved).toHaveBeenCalled();
      expect(await listDrafts({ region: 'aus' })).toHaveLength(1);
    });
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement save**

Update `AuthoringPanelProps` with `shippedWords: ReadonlySet<string>`. Implement the save button:

```tsx
import { createDraft } from './draftStore';
// …
const word = wordInput.trim().toLowerCase();
const duplicate = shippedWords.has(word);
const ipaValue = breakdown?.ritaKnown ? breakdown.ipa : ipaOverride;
const saveDisabled =
  duplicate ||
  word.length === 0 ||
  ipaValue.length === 0 ||
  graphemes.length === 0 ||
  !levelSuggestion;

const handleSave = async () => {
  if (saveDisabled || !levelSuggestion) return;
  const draft = await createDraft({
    word,
    region: 'aus',
    level: levelSuggestion.level,
    ipa: ipaValue,
    syllables: [word], // v1 fallback; syllable UI in a future iteration
    syllableCount: 1,
    graphemes,
    ritaKnown: breakdown?.ritaKnown ?? false,
  });
  onSaved(draft.id);
};
```

Render:

```tsx
{
  duplicate ? (
    <p className="text-xs text-destructive">
      <strong>{word}</strong> already exists in shipped data.
    </p>
  ) : null;
}
<Button type="button" onClick={handleSave} disabled={saveDisabled}>
  Save draft
</Button>;
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): save draft with duplicate guard"
```

---

## Task 18: AuthoringPanel — ESC closes + focus return (a11y)

**Files:**

- Modify: `src/data/words/authoring/AuthoringPanel.tsx`
- Modify: `src/data/words/authoring/AuthoringPanel.test.tsx`

- [ ] **Step 1: Append failing test**

Append to `AuthoringPanel.test.tsx`:

```tsx
describe('AuthoringPanel — a11y', () => {
  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <AuthoringPanel
        open
        initialWord=""
        onClose={onClose}
        onSaved={vi.fn()}
        shippedWords={new Set()}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Add ESC listener**

In `AuthoringPanel.tsx`, add:

```tsx
useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [open, onClose]);
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/AuthoringPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.tsx src/data/words/authoring/AuthoringPanel.test.tsx
git commit -m "feat(authoring): close panel on Escape"
```

---

## Task 19: DraftsPanel — list / delete / export

**Files:**

- Create: `src/data/words/authoring/DraftsPanel.tsx`
- Create: `src/data/words/authoring/DraftsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/data/words/authoring/DraftsPanel.test.tsx`:

```tsx
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDB } from 'idb';
import {
  DB_NAME as DRAFT_DB,
  createDraft,
  listDrafts,
} from './draftStore';
import { DraftsPanel } from './DraftsPanel';

const makeDraft = async (word: string) =>
  createDraft({
    word,
    region: 'aus',
    level: 1,
    ipa: word,
    syllables: [word],
    syllableCount: 1,
    graphemes: [{ g: word, p: word }],
    ritaKnown: false,
  });

describe('DraftsPanel', () => {
  beforeEach(async () => {
    await deleteDB(DRAFT_DB);
  });

  it('lists drafts with delete + export controls', async () => {
    await makeDraft('foo');
    await makeDraft('bar');
    render(<DraftsPanel onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('foo')).toBeInTheDocument();
      expect(screen.getByText('bar')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /export drafts/i }),
    ).toBeEnabled();
  });

  it('delete removes a draft', async () => {
    await makeDraft('foo');
    render(<DraftsPanel onClose={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByText('foo')).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete foo/i }),
    );
    await waitFor(async () =>
      expect(await listDrafts({ region: 'aus' })).toHaveLength(0),
    );
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/authoring/DraftsPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/data/words/authoring/DraftsPanel.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Button } from '#/components/ui/button';
import { deleteDraft, exportDrafts, listDrafts } from './draftStore';
import type { DraftEntry } from '../types';

export interface DraftsPanelProps {
  onClose: () => void;
}

export const DraftsPanel = ({ onClose }: DraftsPanelProps) => {
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const refresh = useCallback(async () => {
    setDrafts(await listDrafts({ region: 'aus' }));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleExport = async () => {
    const file = await exportDrafts();
    const blob = new Blob([JSON.stringify(file, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `wordlib-export-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="drafts-panel-title" className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 id="drafts-panel-title" className="text-lg font-semibold">
          Drafts ({drafts.length})
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleExport}
            disabled={drafts.length === 0}
          >
            Export drafts ({drafts.length})
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </header>
      <ul className="space-y-2">
        {drafts.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-md border p-2"
          >
            <span className="font-medium">{d.word}</span>
            <span className="text-xs text-muted-foreground">
              L{d.level} · {new Date(d.updatedAt).toLocaleString()}
            </span>
            <Button
              type="button"
              variant="ghost"
              aria-label={`delete ${d.word}`}
              onClick={async () => {
                await deleteDraft(d.id);
                await refresh();
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words/authoring/DraftsPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/authoring/DraftsPanel.tsx src/data/words/authoring/DraftsPanel.test.tsx
git commit -m "feat(authoring): DraftsPanel with list/delete/export"
```

---

## Task 20: WordLibraryExplorer — mount panels + entry points

**Files:**

- Modify: `src/data/words/WordLibraryExplorer.tsx`
- Modify: `src/data/words/WordLibraryExplorer.test.ts` (new integration test — rename to `.tsx` if the file tests DOM; otherwise add a sibling `.tsx` test)

**Goal:** render a `+ New word` button beside the search input, an empty-state CTA when the query returns no hits, and a `Drafts (N)` link that opens `DraftsPanel`.

- [ ] **Step 1: Locate the search header + empty-state render point**

Run: `grep -n "query\|search\|Input" src/data/words/WordLibraryExplorer.tsx | head -40`
Expected: shows ~line 158 (query state) and wherever results are rendered.

- [ ] **Step 2: Write a failing integration test**

Create `src/data/words/WordLibraryExplorer.authoring.test.tsx`:

```tsx
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { deleteDB } from 'idb';
import { DB_NAME as DRAFT_DB } from './authoring/draftStore';
import { WordLibraryExplorer } from './WordLibraryExplorer';

describe('WordLibraryExplorer — authoring entry points', () => {
  beforeEach(async () => {
    await deleteDB(DRAFT_DB);
  });

  it('renders a "+ New word" button next to the search input', async () => {
    render(<WordLibraryExplorer />);
    expect(
      await screen.findByRole('button', { name: /new word/i }),
    ).toBeInTheDocument();
  });

  it('opens the authoring panel when "+ New word" is clicked', async () => {
    render(<WordLibraryExplorer />);
    await userEvent.click(
      await screen.findByRole('button', { name: /new word/i }),
    );
    expect(
      await screen.findByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run — should fail**

Run: `yarn test src/data/words/WordLibraryExplorer.authoring.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Mount authoring state in the explorer**

Inside `WordLibraryExplorer.tsx`, near the other `useState` hooks for search:

```tsx
import { AuthoringPanel } from './authoring/AuthoringPanel';
import { DraftsPanel } from './authoring/DraftsPanel';
import { listDrafts } from './authoring/draftStore';
// …
const [authoringOpen, setAuthoringOpen] = useState(false);
const [draftsOpen, setDraftsOpen] = useState(false);
const [authoringInitial, setAuthoringInitial] = useState('');
const [shippedWords, setShippedWords] = useState<ReadonlySet<string>>(
  new Set(),
);
const [draftCount, setDraftCount] = useState(0);

useEffect(() => {
  let cancelled = false;
  const refresh = async () => {
    const drafts = await listDrafts({ region: 'aus' });
    if (!cancelled) setDraftCount(drafts.length);
  };
  void refresh();
  return () => {
    cancelled = true;
  };
}, [authoringOpen, draftsOpen]);
```

Derive `shippedWords` from the current `FilterResult.hits`:

```tsx
// when results load:
setShippedWords(
  new Set(
    result.hits
      .filter((h) => h.provenance === 'shipped')
      .map((h) => h.word),
  ),
);
```

Render the button near the search `<Input>`:

```tsx
<Button
  type="button"
  onClick={() => {
    setAuthoringInitial(query);
    setAuthoringOpen(true);
  }}
>
  + New word
</Button>;
{
  draftCount > 0 ? (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setDraftsOpen(true)}
    >
      Drafts ({draftCount})
    </Button>
  ) : null;
}
```

At the root of the return:

```tsx
<AuthoringPanel
  open={authoringOpen}
  initialWord={authoringInitial}
  shippedWords={shippedWords}
  onClose={() => setAuthoringOpen(false)}
  onSaved={() => setAuthoringOpen(false)}
/>;
{
  draftsOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Drafts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        <DraftsPanel onClose={() => setDraftsOpen(false)} />
      </div>
    </div>
  ) : null;
}
```

- [ ] **Step 5: Run tests**

Run: `yarn test src/data/words/WordLibraryExplorer.authoring.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/words/WordLibraryExplorer.tsx src/data/words/WordLibraryExplorer.authoring.test.tsx
git commit -m "feat(explorer): mount authoring + drafts panels with entry points"
```

---

## Task 21: WordLibraryExplorer — empty-state CTA + draft badge

**Files:**

- Modify: `src/data/words/WordLibraryExplorer.tsx`
- Modify: `src/data/words/WordLibraryExplorer.authoring.test.tsx`

- [ ] **Step 1: Append failing tests**

Append to `WordLibraryExplorer.authoring.test.tsx`:

```tsx
describe('WordLibraryExplorer — empty-state CTA + badge', () => {
  it('shows CTA when query returns no results', async () => {
    render(<WordLibraryExplorer />);
    await userEvent.type(
      await screen.findByLabelText(/search/i),
      'qxzqxz',
    );
    expect(
      await screen.findByText(/Make up this word/i),
    ).toBeInTheDocument();
  });

  it('clicking CTA opens authoring with the typed word', async () => {
    render(<WordLibraryExplorer />);
    await userEvent.type(
      await screen.findByLabelText(/search/i),
      'qxzqxz',
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /make up this word/i }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: /make up a word/i,
    });
    expect(
      (dialog.querySelector('input[name="word"]') ??
        dialog.querySelector('input')) as HTMLInputElement | null,
    )?.toHaveValue('qxzqxz');
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test src/data/words/WordLibraryExplorer.authoring.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Render CTA + badge**

Where the empty result is rendered in `WordLibraryExplorer.tsx`, replace the placeholder with:

```tsx
{
  filteredHits.length === 0 ? (
    <div className="py-8 text-center">
      <p>
        No matches for <strong>{query}</strong>.
      </p>
      <Button
        type="button"
        className="mt-2"
        onClick={() => {
          setAuthoringInitial(query);
          setAuthoringOpen(true);
        }}
      >
        ✨ Make up this word?
      </Button>
    </div>
  ) : null;
}
```

In the `ResultCard` (or equivalent hit renderer), add a badge:

```tsx
{
  hit.provenance === 'draft' ? (
    <span className="ml-2 rounded bg-amber-500/20 px-1.5 text-xs">
      ✏️ draft (unsynced)
    </span>
  ) : (
    <span className="ml-2 rounded bg-emerald-500/20 px-1.5 text-xs">
      📚 shipped
    </span>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `yarn test src/data/words`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/WordLibraryExplorer.tsx src/data/words/WordLibraryExplorer.authoring.test.tsx
git commit -m "feat(explorer): empty-state CTA + draft/shipped badge"
```

---

## Task 22: Storybook stories

**Files:**

- Create: `src/data/words/authoring/AuthoringPanel.stories.tsx`
- Create: `src/data/words/authoring/DraftsPanel.stories.tsx`

- [ ] **Step 1: AuthoringPanel stories**

Per CLAUDE.md / write-storybook skill, use **one Default Playground** with argTypes. Create `AuthoringPanel.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { AuthoringPanel } from './AuthoringPanel';

const meta = {
  title: 'Data/Words/AuthoringPanel',
  component: AuthoringPanel,
  args: {
    open: true,
    initialWord: 'putting',
    shippedWords: new Set<string>(),
    onClose: fn(),
    onSaved: fn(),
  },
  argTypes: {
    open: { control: 'boolean' },
    initialWord: { control: 'text' },
  },
} satisfies Meta<typeof AuthoringPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

- [ ] **Step 2: DraftsPanel stories**

Create `DraftsPanel.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { DraftsPanel } from './DraftsPanel';

const meta = {
  title: 'Data/Words/DraftsPanel',
  component: DraftsPanel,
  args: { onClose: fn() },
} satisfies Meta<typeof DraftsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

- [ ] **Step 3: Run Storybook build**

Run: `yarn build-storybook`
Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/words/authoring/AuthoringPanel.stories.tsx src/data/words/authoring/DraftsPanel.stories.tsx
git commit -m "docs(storybook): AuthoringPanel + DraftsPanel stories"
```

---

## Task 23: Visual regression baselines

**Files:**

- Create/modify: `e2e/vr/authoring.spec.ts` (or whatever the existing pattern is)

- [ ] **Step 1: Check existing VR spec pattern**

Run: `ls e2e/vr && head -40 e2e/vr/*.spec.ts | head -80`
Expected: note the existing VR spec structure.

- [ ] **Step 2: Add VR spec**

Create `e2e/vr/authoring.spec.ts` following the repo pattern (mobile + desktop viewports) targeting the two Storybook URLs `?path=/story/data-words-authoringpanel--default` and `?path=/story/data-words-draftspanel--default`. Copy the structure from a neighbouring spec; only `storyId` values change.

- [ ] **Step 3: Generate baselines with Docker**

Run: `yarn test:vr:update`
Expected: new baseline PNGs written under `e2e/vr/*.spec.ts-snapshots/`.

- [ ] **Step 4: Verify baselines**

Run: `yarn test:vr`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/vr/authoring.spec.ts e2e/vr/authoring.spec.ts-snapshots
git commit -m "test(vr): baselines for AuthoringPanel + DraftsPanel"
```

---

## Task 24: CLI — scaffolding + schema validation

**Files:**

- Create: `scripts/words-import.ts`
- Create: `scripts/words-import.test.mts`
- Modify: `package.json` (add `words:import` script)

- [ ] **Step 1: Write failing test**

Create `scripts/words-import.test.mts`:

```ts
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importExportFile } from './words-import.js';

const tmp = () => mkdtempSync(path.join(tmpdir(), 'words-import-'));

const setupRepo = (root: string) => {
  for (const dir of [
    'src/data/words/core',
    'src/data/words/curriculum/aus',
  ]) {
    mkdirSync(path.join(root, dir), { recursive: true });
  }
  for (let l = 1; l <= 8; l += 1) {
    writeFileSync(
      path.join(root, `src/data/words/core/level${l}.json`),
      '[]\n',
    );
    writeFileSync(
      path.join(root, `src/data/words/curriculum/aus/level${l}.json`),
      '[]\n',
    );
  }
};

describe('words-import', () => {
  it('merges a valid export into core + curriculum JSON', () => {
    const root = tmp();
    setupRepo(root);
    const exportFile = {
      version: 1,
      exportedAt: '2026-04-23T00:00:00.000Z',
      drafts: [
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
          createdAt: '2026-04-23T00:00:00.000Z',
          updatedAt: '2026-04-23T00:00:00.000Z',
        },
      ],
    };
    const filePath = path.join(root, 'e.json');
    writeFileSync(filePath, JSON.stringify(exportFile));
    const result = importExportFile(filePath, { repoRoot: root });
    expect(result.imported).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    const core3 = JSON.parse(
      readFileSync(
        path.join(root, 'src/data/words/core/level3.json'),
        'utf8',
      ),
    );
    expect(core3).toEqual([
      { word: 'putting', syllableCount: 2, syllables: ['put', 'ting'] },
    ]);
    const curr3 = JSON.parse(
      readFileSync(
        path.join(root, 'src/data/words/curriculum/aus/level3.json'),
        'utf8',
      ),
    );
    expect(curr3[0]).toMatchObject({
      word: 'putting',
      level: 3,
      ipa: 'pʊtɪŋ',
    });
  });

  it('rejects entries that duplicate a shipped word', () => {
    const root = tmp();
    setupRepo(root);
    writeFileSync(
      path.join(root, 'src/data/words/core/level3.json'),
      JSON.stringify(
        [
          {
            word: 'putting',
            syllableCount: 2,
            syllables: ['put', 'ting'],
          },
        ],
        null,
        2,
      ) + '\n',
    );
    const exportFile = {
      version: 1,
      exportedAt: '2026-04-23T00:00:00.000Z',
      drafts: [
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
          createdAt: '2026-04-23T00:00:00.000Z',
          updatedAt: '2026-04-23T00:00:00.000Z',
        },
      ],
    };
    const filePath = path.join(root, 'e.json');
    writeFileSync(filePath, JSON.stringify(exportFile));
    const result = importExportFile(filePath, { repoRoot: root });
    expect(result.imported).toHaveLength(0);
    expect(result.skipped[0]?.reason).toMatch(/already exists/);
  });

  it('preserves alphabetical sort when merging', () => {
    const root = tmp();
    setupRepo(root);
    writeFileSync(
      path.join(root, 'src/data/words/core/level1.json'),
      JSON.stringify(
        [
          { word: 'an', syllableCount: 1 },
          { word: 'at', syllableCount: 1 },
        ],
        null,
        2,
      ) + '\n',
    );
    writeFileSync(
      path.join(root, 'src/data/words/curriculum/aus/level1.json'),
      JSON.stringify(
        [
          {
            word: 'an',
            level: 1,
            ipa: 'æn',
            graphemes: [
              { g: 'a', p: 'æ' },
              { g: 'n', p: 'n' },
            ],
          },
          {
            word: 'at',
            level: 1,
            ipa: 'æt',
            graphemes: [
              { g: 'a', p: 'æ' },
              { g: 't', p: 't' },
            ],
          },
        ],
        null,
        2,
      ) + '\n',
    );
    const exportFile = {
      version: 1,
      exportedAt: '2026-04-23T00:00:00.000Z',
      drafts: [
        {
          word: 'as',
          region: 'aus',
          level: 1,
          ipa: 'æs',
          syllables: ['as'],
          syllableCount: 1,
          graphemes: [
            { g: 'a', p: 'æ' },
            { g: 's', p: 's' },
          ],
          ritaKnown: true,
          createdAt: '2026-04-23T00:00:00.000Z',
          updatedAt: '2026-04-23T00:00:00.000Z',
        },
      ],
    };
    const filePath = path.join(root, 'e.json');
    writeFileSync(filePath, JSON.stringify(exportFile));
    importExportFile(filePath, { repoRoot: root });
    const core1 = JSON.parse(
      readFileSync(
        path.join(root, 'src/data/words/core/level1.json'),
        'utf8',
      ),
    );
    expect(core1.map((c: { word: string }) => c.word)).toEqual([
      'an',
      'as',
      'at',
    ]);
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `yarn test scripts/words-import.test.mts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the CLI**

Create `scripts/words-import.ts`:

```ts
#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { exportFileSchema } from '../src/data/words/authoring/exportSchema';
import type {
  CurriculumEntry,
  Grapheme,
  WordCore,
} from '../src/data/words/types';

type DraftExport = z.infer<typeof exportFileSchema>['drafts'][number];

export interface ImportSummary {
  imported: Array<{ word: string; level: number }>;
  skipped: Array<{ word: string; reason: string }>;
}

export interface ImportOptions {
  repoRoot?: string;
}

const defaultRepoRoot = () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
};

const corePath = (repoRoot: string, level: number) =>
  path.join(repoRoot, `src/data/words/core/level${level}.json`);

const curriculumPath = (repoRoot: string, level: number) =>
  path.join(
    repoRoot,
    `src/data/words/curriculum/aus/level${level}.json`,
  );

const readJson = <T>(filePath: string): T =>
  JSON.parse(readFileSync(filePath, 'utf8')) as T;

const writeJson = (filePath: string, data: unknown): void => {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
};

const toCore = (d: DraftExport): WordCore => ({
  word: d.word,
  syllableCount: d.syllableCount,
  syllables: d.syllables,
  ...(d.variants ? { variants: d.variants } : {}),
});

const toCurriculumEntry = (d: DraftExport): CurriculumEntry => ({
  word: d.word,
  level: d.level,
  ipa: d.ipa,
  graphemes: d.graphemes as Grapheme[],
});

const wordExistsInCore = (
  repoRoot: string,
  word: string,
): number | null => {
  for (let l = 1; l <= 8; l += 1) {
    const entries = readJson<WordCore[]>(corePath(repoRoot, l));
    if (entries.some((e) => e.word === word)) return l;
  }
  return null;
};

export const importExportFile = (
  exportFilePath: string,
  { repoRoot = defaultRepoRoot() }: ImportOptions = {},
): ImportSummary => {
  const raw = readJson<unknown>(exportFilePath);
  const parsed = exportFileSchema.parse(raw);
  const summary: ImportSummary = { imported: [], skipped: [] };

  for (const draft of parsed.drafts) {
    const existingLevel = wordExistsInCore(repoRoot, draft.word);
    if (existingLevel !== null) {
      summary.skipped.push({
        word: draft.word,
        reason: `already exists in core/level${existingLevel}.json`,
      });
      continue;
    }

    const corePathN = corePath(repoRoot, draft.level);
    const curriculumPathN = curriculumPath(repoRoot, draft.level);
    const coreArr = readJson<WordCore[]>(corePathN);
    const currArr = readJson<CurriculumEntry[]>(curriculumPathN);

    coreArr.push(toCore(draft));
    coreArr.sort((a, b) => a.word.localeCompare(b.word));
    currArr.push(toCurriculumEntry(draft));
    currArr.sort((a, b) => a.word.localeCompare(b.word));

    writeJson(corePathN, coreArr);
    writeJson(curriculumPathN, currArr);

    summary.imported.push({ word: draft.word, level: draft.level });
  }

  return summary;
};

const main = () => {
  const [, , arg] = process.argv;
  if (!arg) {
    console.error('Usage: yarn words:import <path-to-export.json>');
    process.exit(2);
  }
  try {
    const summary = importExportFile(arg);
    for (const { word, level } of summary.imported) {
      console.log(
        `✓ ${word} → core/level${level}.json, curriculum/aus/level${level}.json`,
      );
    }
    for (const { word, reason } of summary.skipped) {
      console.log(`⚠ ${word} skipped: ${reason}`);
    }
    console.log(
      `\nImported ${summary.imported.length} of ${summary.imported.length + summary.skipped.length} entries. Review with \`git diff\` before committing.`,
    );
    process.exit(
      summary.skipped.length > 0 && summary.imported.length === 0
        ? 1
        : 0,
    );
  } catch (err) {
    console.error('words-import failed:', err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

- [ ] **Step 4: Update `package.json` scripts**

Edit `package.json` `scripts`:

```json
"words:import": "tsx scripts/words-import.ts"
```

- [ ] **Step 5: Update vitest include glob**

In `vitest.config.ts`, extend `test.include` to pick up `.test.mts` files under `scripts/`:

```ts
include: [
  'src/**/*.test.{ts,tsx}',
  'scripts/**/*.test.mjs',
  'scripts/**/*.test.mts',
],
```

- [ ] **Step 6: Run tests**

Run: `yarn test scripts/words-import.test.mts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/words-import.ts scripts/words-import.test.mts package.json vitest.config.ts
git commit -m "feat(cli): yarn words:import merges drafts into curriculum JSON"
```

---

## Task 25: Fix Storybook + VR + E2E fallout, full pre-push

**Files:**

- Various (determined by running the suite)

- [ ] **Step 1: Run the whole suite**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: PASS. If not, fix the specific failures.

- [ ] **Step 2: Storybook test runner**

Run: `yarn build-storybook && yarn test:storybook`
Expected: PASS.

- [ ] **Step 3: VR (Docker)**

Run: `yarn test:vr`
Expected: PASS with the new baselines from Task 23. If any existing baseline diffs (e.g., explorer header layout changed with the `+ New word` button), inspect the diff PNGs, confirm the change is intentional, and `yarn test:vr:update`.

- [ ] **Step 4: E2E smoke**

Run: `yarn test:e2e`
Expected: PASS. If the new explorer layout broke an existing E2E, fix the selector.

- [ ] **Step 5: Commit any baseline / selector fixes**

```bash
git add <paths>
git commit -m "test(words): refresh baselines for authoring header"
```

---

## Task 26: Docs — architecture + README notes

**Files:**

- Modify: any `.mdx` doc co-located with touched state (none expected — authoring doesn't live under `src/components/answer-game/` or `src/lib/game-engine/`)
- Consider a README snippet under `docs/`

- [ ] **Step 1: Scan for required MDX updates**

Run: `grep -rln "answer-game\|game-engine" src/data/words/`
Expected: no hits (authoring is outside the architecture-docs scope). If anything surfaces, run `/update-architecture-docs`.

- [ ] **Step 2: Add CLI usage note**

Create or append to `docs/authoring.md`:

```markdown
# Word authoring

Curators can make up new words inside `WordLibraryExplorer`. Drafts live in IndexedDB (`basekill-word-drafts`). To bring them into the canonical corpus:

1. Click **Export drafts** in the drafts panel.
2. Transfer the JSON file to a dev machine with this repo checked out.
3. Run `yarn words:import <path-to-export.json>`.
4. Review with `git diff`, commit, and open a PR.

See [`docs/superpowers/specs/2026-04-23-word-authoring-design.md`](./superpowers/specs/2026-04-23-word-authoring-design.md) for the full design.
```

- [ ] **Step 3: Format markdown**

Run: `yarn fix:md && yarn lint:md`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/authoring.md
git commit -m "docs: word-authoring curator workflow"
```

---

## Task 27: Final push + PR

- [ ] **Step 1: Verify branch is clean and rebased**

Run: `git status && git fetch origin master && git log --oneline origin/master ^HEAD | head`
Expected: clean tree, 0 commits behind.

- [ ] **Step 2: Run the full pre-push locally**

Run: `yarn typecheck && yarn lint && yarn test && yarn test:vr && yarn build`
Expected: all PASS.

- [ ] **Step 3: Push**

Run: `git push -u origin feat/word-authoring`
Expected: push succeeds (pre-push hook runs, all green).

- [ ] **Step 4: Open PR**

Run:

```bash
gh pr create --title "feat(words): word authoring (make-up new words)" --body "$(cat <<'EOF'
## Summary

- Curator-only authoring inside `WordLibraryExplorer` with IndexedDB drafts
- RitaJS-powered engine + greedy aligner + level suggestion
- `yarn words:import <file>` CLI merges drafts into `core/` + `curriculum/aus/` JSON

Implements the design in [`docs/superpowers/specs/2026-04-23-word-authoring-design.md`](../blob/feat/word-authoring/docs/superpowers/specs/2026-04-23-word-authoring-design.md).

## Test plan

- [ ] Open `WordLibraryExplorer`; search for a missing word → CTA appears
- [ ] Click CTA; RitaJS pre-fills IPA + graphemes for a known word ("putting")
- [ ] Unknown word ("qxzqxz") shows the dictionary.com banner
- [ ] Save draft → toast + draft badge in search results
- [ ] Export drafts → JSON file downloads
- [ ] `yarn words:import <file>` merges into `core/levelN.json` and `curriculum/aus/levelN.json`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Share with user.

---

## Self-Review Checklist

- [x] **Spec coverage**
  - §3 User flow → Tasks 13–21
  - §4 Architecture → Tasks 2–10 (engine/aligner/draftStore), Task 24 (CLI)
  - §5 Data model → Task 1 (types), Task 9 (IDB schema), Task 8 + Task 10 (export shape)
  - §6 Aligner → Tasks 4–6
  - §7 CLI → Task 24
  - §8 UI affordances → Tasks 13–21
  - §9 Testing → integrated into every task; Storybook (22); VR (23)
  - §9.3 Out of scope honoured — no syllable-letter split UI beyond fallback (Task 17 saves `syllables: [word]`); tracked as follow-up in spec §6.3
- [x] **Placeholder scan** — every code step shows concrete code; no "TBD"
- [x] **Type consistency** — `DraftEntry`, `Breakdown`, `AlignedGrapheme`, `LevelSuggestion`, `ExportFile` names used identically throughout; `createDraft`, `listDrafts`, `updateDraft`, `deleteDraft`, `exportDrafts`, `findDraftByWord` kept consistent

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-word-authoring.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration.
2. **Inline Execution** — run tasks in this session with batch checkpoints.

Which approach?
