# Consolidate Word and Emoji Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed optional `emoji` and `image` fields into curriculum JSON so picture mode uses library-sourced rounds instead of a hardcoded 8-word pool.

**Architecture:** Add `emoji?` and `image?` to the type chain (`CurriculumEntry` → `WordHit` → `WordSpellRound`), add `hasVisual` filtering, tag 7 existing curriculum entries with emojis and add "mum" as the 8th entry, then invert the picture-mode invariant in `resolveWordSpellConfig` to use a library source with `hasVisual: true` instead of a hardcoded round pool. Remove the hardcoded pool entirely.

**Tech Stack:** TypeScript, Vitest, React (hook tests via `@testing-library/react`)

**Spec:** `docs/brainstorms/2026-05-01-consolidate-word-emoji-requirements.md`

---

## File Map

| Action | File                                                          | Responsibility                                                                                         |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Modify | `src/data/words/types.ts`                                     | Add `emoji?`, `image?` to `CurriculumEntry`, `WordHit`, `DraftEntry`; add `hasVisual?` to `WordFilter` |
| Modify | `src/data/words/filter.ts:30-86`                              | Add `hasVisual` predicate to `entryMatches`                                                            |
| Modify | `src/data/words/filter.ts:156-190`                            | Propagate `emoji`/`image` in `draftToHit` and `joinHits`                                               |
| Modify | `src/data/words/adapters.ts:4-6`                              | Map `emoji`/`image` from `WordHit` through to `WordSpellRound`                                         |
| Modify | `src/data/words/seen-words.ts:26-44`                          | Add `hasVisual` to `filterSignature`                                                                   |
| Modify | `src/data/words/curriculum/aus/level1.json`                   | Add `emoji` to `ant`, `pin` entries                                                                    |
| Modify | `src/data/words/curriculum/aus/level2.json`                   | Add `emoji` to `can`, `cat`, `dog`, `sad`, `sun`; add `mum` entry                                      |
| Modify | `src/data/words/core/level2.json`                             | Add `mum` `WordCore` entry                                                                             |
| Modify | `src/routes/$locale/_app/game/$gameId.tsx:83-298`             | Invert picture-mode invariant, remove `WORD_SPELL_ROUND_POOL` and `sliceWordSpellRounds`               |
| Modify | `src/games/word-spell/useLibraryRounds.ts:65-87`              | Zero-results fallback when `hasVisual` returns nothing                                                 |
| Modify | `src/data/words/filter.test.ts`                               | Tests for `hasVisual` filtering and emoji propagation                                                  |
| Modify | `src/data/words/adapters.test.ts`                             | Tests for emoji/image mapping                                                                          |
| Modify | `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts` | Update picture-mode tests                                                                              |
| Modify | `src/routes/$locale/_app/game/mode-default-invariant.test.ts` | Update picture-mode invariant assertions                                                               |
| Modify | `src/games/word-spell/useLibraryRounds.test.tsx`              | Test hasVisual fallback and emoji propagation                                                          |

---

### Task 1: Add emoji/image fields to CurriculumEntry, WordHit, DraftEntry (R1, R2, R3)

**Files:**

- Modify: `src/data/words/types.ts:18-23` (CurriculumEntry)
- Modify: `src/data/words/types.ts:29-42` (DraftEntry)
- Modify: `src/data/words/types.ts:44-55` (WordHit)

- [ ] **Step 1: Add `emoji?` and `image?` to `CurriculumEntry`**

In `src/data/words/types.ts`, add two optional fields after the `graphemes` field:

```typescript
export interface CurriculumEntry {
  word: string;
  level: number;
  ipa: string;
  graphemes: Grapheme[];
  emoji?: string;
  image?: string;
}
```

- [ ] **Step 2: Add `emoji?` and `image?` to `DraftEntry`**

In `src/data/words/types.ts`, add two optional fields after `variants?`:

```typescript
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
  emoji?: string;
  image?: string;
  ritaKnown: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Add `emoji?` and `image?` to `WordHit`**

In `src/data/words/types.ts`, add two optional fields after `graphemes?`:

```typescript
export interface WordHit {
  word: string;
  region: Region;
  level: number;
  syllableCount: number;
  syllables?: string[];
  variants?: string[];
  ipa?: string;
  graphemes?: Grapheme[];
  emoji?: string;
  image?: string;
  provenance: Provenance;
  draftId?: string;
}
```

- [ ] **Step 4: Run typecheck to verify no regressions**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && yarn typecheck`

Expected: PASS — all new fields are optional so no existing code breaks.

- [ ] **Step 5: Commit**

```bash
git add src/data/words/types.ts
git commit -m "feat(words): add optional emoji/image fields to CurriculumEntry, WordHit, DraftEntry (#277)"
```

---

### Task 2: Add `hasVisual` to WordFilter and filterSignature (R7)

**Files:**

- Modify: `src/data/words/types.ts:62-74` (WordFilter)
- Modify: `src/data/words/seen-words.ts:26-44` (filterSignature)
- Modify: `src/data/words/filter.ts:30-86` (entryMatches)
- Test: `src/data/words/filter.test.ts`

- [ ] **Step 1: Add `hasVisual?` to `WordFilter` type**

In `src/data/words/types.ts`, add `hasVisual?` after `fallbackToAus?`:

```typescript
export interface WordFilter {
  region: Region;
  level?: number;
  levels?: number[];
  levelRange?: [number, number];
  syllableCountEq?: number;
  syllableCountRange?: [number, number];
  graphemesAllowed?: GraphemePairFilter[];
  graphemesRequired?: GraphemePairFilter[];
  phonemesAllowed?: string[];
  phonemesRequired?: string[];
  fallbackToAus?: boolean;
  hasVisual?: boolean;
}
```

- [ ] **Step 2: Add `hasVisual` to `filterSignature`**

In `src/data/words/seen-words.ts:26-44`, add a `hasVisual` part to the signature array:

```typescript
export const filterSignature = (filter: WordFilter): string => {
  const parts: string[] = [
    `region=${filter.region}`,
    `level=${filter.level ?? ''}`,
    `levels=${sortedCsv(filter.levels?.map(String))}`,
    `levelRange=${filter.levelRange ? filter.levelRange.join('-') : ''}`,
    `syllableCountEq=${filter.syllableCountEq ?? ''}`,
    `syllableCountRange=${
      filter.syllableCountRange
        ? filter.syllableCountRange.join('-')
        : ''
    }`,
    `phonemesAllowed=${sortedCsv(filter.phonemesAllowed)}`,
    `phonemesRequired=${sortedCsv(filter.phonemesRequired)}`,
    `graphemesAllowed=${sortedPairsCsv(filter.graphemesAllowed)}`,
    `graphemesRequired=${sortedPairsCsv(filter.graphemesRequired)}`,
    `hasVisual=${filter.hasVisual ?? ''}`,
  ];
  return parts.join('|');
};
```

- [ ] **Step 3: Write failing tests for `hasVisual` in `entryMatches`**

In `src/data/words/filter.test.ts`, add these tests inside the `entryMatches` describe block:

```typescript
it('hasVisual: passes when emoji is set and hasVisual is true', () => {
  expect(
    entryMatches(hit({ emoji: '🐱' }), {
      region: 'aus',
      hasVisual: true,
    }),
  ).toBe(true);
});

it('hasVisual: passes when image is set and hasVisual is true', () => {
  expect(
    entryMatches(hit({ image: '/img/cat.svg' }), {
      region: 'aus',
      hasVisual: true,
    }),
  ).toBe(true);
});

it('hasVisual: rejects when neither emoji nor image is set', () => {
  expect(entryMatches(hit(), { region: 'aus', hasVisual: true })).toBe(
    false,
  );
});

it('hasVisual: omitted → no visual filtering', () => {
  expect(entryMatches(hit(), { region: 'aus' })).toBe(true);
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/filter.test.ts`

Expected: 1 test FAIL — `hasVisual: rejects when neither emoji nor image is set` fails because `entryMatches` doesn't check `hasVisual` yet, so it returns `true` for entries without emoji/image. The other three tests pass (two because the hit has emoji/image which doesn't falsify the current implementation, one because `hasVisual` is omitted).

- [ ] **Step 5: Implement `hasVisual` filtering in `entryMatches`**

In `src/data/words/filter.ts:30-86`, add the `hasVisual` check after the region check and before level checks:

```typescript
export const entryMatches = (
  hit: WordHit,
  filter: WordFilter,
): boolean => {
  if (hit.region !== filter.region) return false;

  if (filter.hasVisual && !hit.emoji && !hit.image) return false;

  if (filter.level !== undefined && hit.level !== filter.level)
    return false;
  // ... rest unchanged
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/filter.test.ts`

Expected: ALL PASS

- [ ] **Step 7: Update hardcoded filterSignature strings in useLibraryRounds.test.tsx**

Adding `hasVisual` to `filterSignature` changes the output format. Two existing tests in `src/games/word-spell/useLibraryRounds.test.tsx` (lines 161 and 183) hardcode the old signature string. Update both occurrences from:

```
'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired='
```

to:

```
'region=aus|level=1|levels=|levelRange=|syllableCountEq=|syllableCountRange=|phonemesAllowed=|phonemesRequired=|graphemesAllowed=|graphemesRequired=|hasVisual='
```

- [ ] **Step 8: Commit**

```bash
git add src/data/words/types.ts src/data/words/filter.ts src/data/words/filter.test.ts src/data/words/seen-words.ts src/games/word-spell/useLibraryRounds.test.tsx
git commit -m "feat(words): add hasVisual filtering to WordFilter and entryMatches (#277)"
```

---

### Task 3: Propagate emoji/image in joinHits and draftToHit (R2)

**Files:**

- Modify: `src/data/words/filter.ts:156-190` (draftToHit, joinHits)
- Test: `src/data/words/filter.test.ts`

- [ ] **Step 1: Write a failing integration test for emoji propagation**

In `src/data/words/filter.test.ts`, add a new test inside the `filterWords (integration against seeded chunks)` describe block. This test depends on Task 5's data changes (emoji in curriculum JSON). Mark it as skipped for now — Task 5 will un-skip it after the data is committed:

```typescript
it.skip('propagates emoji from curriculum entry into WordHit', async () => {
  const result = await filterWords({
    region: 'aus',
    hasVisual: true,
  });
  const cat = result.hits.find((h) => h.word === 'cat');
  expect(cat).toBeDefined();
  expect(cat!.emoji).toBe('🐱');
});
```

- [ ] **Step 2: Update `draftToHit` to propagate emoji/image**

In `src/data/words/filter.ts:156-167`, add `emoji` and `image` to the returned object:

```typescript
const draftToHit = (d: DraftEntry): WordHit => ({
  word: d.word,
  region: d.region,
  level: d.level,
  syllableCount: d.syllableCount,
  syllables: d.syllables,
  variants: d.variants,
  ipa: d.ipa || undefined,
  graphemes: d.graphemes,
  emoji: d.emoji,
  image: d.image,
  provenance: 'draft' satisfies Provenance,
  draftId: d.id,
});
```

- [ ] **Step 3: Update `joinHits` to propagate emoji/image**

In `src/data/words/filter.ts:169-190`, add `emoji` and `image` to the returned `WordHit`:

```typescript
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
        emoji: entry.emoji,
        image: entry.image,
        provenance: 'shipped',
      } as WordHit,
    ];
  });
```

- [ ] **Step 4: Run typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && yarn typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/words/filter.ts src/data/words/filter.test.ts
git commit -m "feat(words): propagate emoji/image through joinHits and draftToHit (#277)"
```

---

### Task 4: Map emoji/image in toWordSpellRound adapter (R4)

**Files:**

- Modify: `src/data/words/adapters.ts:4-6`
- Test: `src/data/words/adapters.test.ts`

- [ ] **Step 1: Write failing tests for emoji/image mapping**

In `src/data/words/adapters.test.ts`, add these tests inside the existing `toWordSpellRound` describe block:

```typescript
it('maps emoji from WordHit to WordSpellRound', () => {
  const round = toWordSpellRound({ ...base, emoji: '🐱' });
  expect(round.emoji).toBe('🐱');
});

it('maps image from WordHit to WordSpellRound', () => {
  const round = toWordSpellRound({ ...base, image: '/img/cat.svg' });
  expect(round.image).toBe('/img/cat.svg');
});

it('omits emoji and image when not set on WordHit', () => {
  const round = toWordSpellRound(base);
  expect(round.emoji).toBeUndefined();
  expect(round.image).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/adapters.test.ts`

Expected: FAIL — `maps emoji from WordHit` and `maps image from WordHit` fail because `toWordSpellRound` only maps `word`.

- [ ] **Step 3: Update `toWordSpellRound` to map emoji and image**

In `src/data/words/adapters.ts:4-6`:

```typescript
export const toWordSpellRound = (hit: WordHit): WordSpellRound => ({
  word: hit.word,
  emoji: hit.emoji,
  image: hit.image,
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/adapters.test.ts`

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/words/adapters.ts src/data/words/adapters.test.ts
git commit -m "feat(words): map emoji/image through toWordSpellRound adapter (#277)"
```

---

### Task 5: Add emoji fields to curriculum JSON entries (R5)

**Files:**

- Modify: `src/data/words/curriculum/aus/level1.json` (ant, pin)
- Modify: `src/data/words/curriculum/aus/level2.json` (can, cat, dog, sad, sun)

- [ ] **Step 1: Add emoji to "ant" in `aus/level1.json`**

In `src/data/words/curriculum/aus/level1.json`, find the "ant" entry (starts around line 17) and add `"emoji": "🐜"` after the `"graphemes"` array:

```json
{
  "word": "ant",
  "level": 1,
  "ipa": "ænt",
  "graphemes": [
    { "g": "a", "p": "æ" },
    { "g": "n", "p": "n" },
    { "g": "t", "p": "t" }
  ],
  "emoji": "🐜"
}
```

- [ ] **Step 2: Add emoji to "pin" in `aus/level1.json`**

Find the "pin" entry (starts around line 379) and add `"emoji": "📌"`:

```json
{
  "word": "pin",
  "level": 1,
  "ipa": "pɪn",
  "graphemes": [
    { "g": "p", "p": "p" },
    { "g": "i", "p": "ɪ" },
    { "g": "n", "p": "n" }
  ],
  "emoji": "📌"
}
```

- [ ] **Step 3: Add emoji to "can" in `aus/level2.json`**

Find the "can" entry (line 3) and add `"emoji": "🥫"`:

```json
{
  "word": "can",
  "level": 2,
  "ipa": "kæn",
  "graphemes": [
    { "g": "c", "p": "k" },
    { "g": "a", "p": "æ" },
    { "g": "n", "p": "n" }
  ],
  "emoji": "🥫"
}
```

- [ ] **Step 4: Add emoji to "cat" in `aus/level2.json`**

Find the "cat" entry (line 40) and add `"emoji": "🐱"`:

```json
{
  "word": "cat",
  "level": 2,
  "ipa": "kæt",
  "graphemes": [
    { "g": "c", "p": "k" },
    { "g": "a", "p": "æ" },
    { "g": "t", "p": "t" }
  ],
  "emoji": "🐱"
}
```

- [ ] **Step 5: Add emoji to "dog" in `aus/level2.json`**

Find the "dog" entry (line 193) and add `"emoji": "🐶"`:

```json
{
  "word": "dog",
  "level": 2,
  "ipa": "dɒg",
  "graphemes": [
    { "g": "d", "p": "d" },
    { "g": "o", "p": "ɒ" },
    { "g": "g", "p": "g" }
  ],
  "emoji": "🐶"
}
```

- [ ] **Step 6: Add emoji to "sad" in `aus/level2.json`**

Find the "sad" entry (line 777) and add `"emoji": "☹️"`:

```json
{
  "word": "sad",
  "level": 2,
  "ipa": "sæd",
  "graphemes": [
    { "g": "s", "p": "s" },
    { "g": "a", "p": "æ" },
    { "g": "d", "p": "d" }
  ],
  "emoji": "☹️"
}
```

- [ ] **Step 7: Add emoji to "sun" in `aus/level2.json`**

Find the "sun" entry (line 877) and add `"emoji": "☀️"`:

```json
{
  "word": "sun",
  "level": 2,
  "ipa": "sʌn",
  "graphemes": [
    { "g": "s", "p": "s" },
    { "g": "u", "p": "ʌ" },
    { "g": "n", "p": "n" }
  ],
  "emoji": "☀️"
}
```

- [ ] **Step 8: Run existing curriculum invariant tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/curriculum-invariant.test.ts`

Expected: PASS — the invariant only checks word/level/ipa/graphemes fields.

- [ ] **Step 9: Un-skip the integration test from Task 3 and run it**

In `src/data/words/filter.test.ts`, change `it.skip('propagates emoji from curriculum entry into WordHit'` to `it('propagates emoji from curriculum entry into WordHit'` (remove the `.skip`).

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/filter.test.ts`

Expected: ALL PASS — the `propagates emoji from curriculum entry into WordHit` test now passes because "cat" has an emoji in the curriculum JSON.

- [ ] **Step 10: Commit**

```bash
git add src/data/words/curriculum/aus/level1.json src/data/words/curriculum/aus/level2.json
git commit -m "feat(words): add emoji fields to 7 existing curriculum entries (#277)"
```

---

### Task 6: Add "mum" to curriculum and core data (R6)

**Files:**

- Modify: `src/data/words/core/level2.json`
- Modify: `src/data/words/curriculum/aus/level2.json`

**Critical invariant:** `joinHits` joins curriculum entries against core entries by word. If the `WordCore` entry for "mum" is missing from `core/level2.json`, the curriculum entry will be silently discarded by `joinHits`. Both files must be updated.

- [ ] **Step 1: Add "mum" to `core/level2.json`**

In `src/data/words/core/level2.json`, add a new entry in alphabetical order (after "met", before "mop"):

```json
{
  "word": "mum",
  "syllableCount": 1
}
```

The file is sorted alphabetically by word. Insert after the `"met"` entry and before the `"mop"` entry.

- [ ] **Step 2: Add "mum" to `aus/level2.json`**

In `src/data/words/curriculum/aus/level2.json`, add a new entry in alphabetical order (after "mug", before "net"):

```json
{
  "word": "mum",
  "level": 2,
  "ipa": "mʌm",
  "graphemes": [
    { "g": "m", "p": "m" },
    { "g": "u", "p": "ʌ" },
    { "g": "m", "p": "m" }
  ],
  "emoji": "🤱"
}
```

Insert after the `"mug"` entry and before the `"net"` entry.

- [ ] **Step 3: Run curriculum invariant and filter tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/data/words/curriculum-invariant.test.ts src/data/words/filter.test.ts src/data/words/levels-vs-data-invariant.test.ts`

Expected: ALL PASS — "mum" uses graphemes `m` and `u` which are in level 2's grapheme pool.

- [ ] **Step 4: Commit**

```bash
git add src/data/words/core/level2.json src/data/words/curriculum/aus/level2.json
git commit -m "feat(words): add mum to curriculum and core data with emoji (#277)"
```

---

### Task 7: Invert picture-mode invariant in resolveWordSpellConfig (R8, R9)

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx:83-298`
- Test: `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts`
- Test: `src/routes/$locale/_app/game/mode-default-invariant.test.ts`

This is the largest task. The picture-mode invariant currently says "picture → rounds defined, source undefined". It must change to "picture default → source with hasVisual:true, rounds undefined" while still honoring saved configs that have explicit rounds.

- [ ] **Step 1: Update `mode-default-invariant.test.ts` — change `assertPictureInvariant`**

The old picture invariant asserted `rounds` defined and `source` undefined. The new invariant asserts `source` defined with `hasVisual: true` and `rounds` undefined (for default configs). Update the helper and affected tests:

```typescript
import { describe, expect, it } from 'vitest';
import { resolveWordSpellConfig } from './$gameId';
import type { WordSpellConfig } from '@/games/word-spell/types';

const assertRecallInvariant = (cfg: WordSpellConfig) => {
  expect(cfg.mode).toBe('recall');
  expect(cfg.source).toBeDefined();
  expect(cfg.source?.type).toBe('word-library');
  expect(cfg.rounds).toBeUndefined();
};

const assertPictureInvariant = (cfg: WordSpellConfig) => {
  expect(cfg.mode).toBe('picture');
  expect(cfg.source).toBeDefined();
  expect(cfg.source?.type).toBe('word-library');
  expect(cfg.source?.filter.hasVisual).toBe(true);
  expect(cfg.rounds).toBeUndefined();
};

describe('mode-default invariant', () => {
  it('null saved config → recall + library, no emoji', () => {
    assertRecallInvariant(resolveWordSpellConfig(null));
  });

  it('saved with only mode=recall → recall + library', () => {
    assertRecallInvariant(
      resolveWordSpellConfig({
        component: 'WordSpell',
        configMode: 'advanced',
        mode: 'recall',
      }),
    );
  });

  it('saved with only mode=picture → picture + source with hasVisual', () => {
    assertPictureInvariant(
      resolveWordSpellConfig({
        component: 'WordSpell',
        configMode: 'advanced',
        mode: 'picture',
      }),
    );
  });

  it('saved with mode=recall + leaked rounds → rounds dropped', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'recall',
      rounds: [{ word: 'cat', emoji: '🐱' }],
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: [{ g: 's', p: 's' }],
          phonemesRequired: ['s'],
        },
      },
    });
    assertRecallInvariant(cfg);
  });

  it('saved with mode=picture + explicit rounds → honors saved rounds', () => {
    const rounds = [{ word: 'cat', emoji: '🐱' }];
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      rounds,
    });
    expect(cfg.mode).toBe('picture');
    expect(cfg.rounds).toEqual(rounds);
    expect(cfg.source).toBeUndefined();
  });

  it('saved with mode=picture + rounds + leaked source → honors rounds, drops source', () => {
    const rounds = [{ word: 'cat', emoji: '🐱' }];
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      rounds,
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: [{ g: 's', p: 's' }],
        },
      },
    });
    expect(cfg.mode).toBe('picture');
    expect(cfg.rounds).toEqual(rounds);
    expect(cfg.source).toBeUndefined();
  });

  it('simple-mode saved config always resolves to recall + library', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'simple',
      selectedUnits: [{ g: 's', p: 's' }],
      region: 'aus',
      inputMethod: 'drag',
    });
    assertRecallInvariant(cfg);
  });
});
```

- [ ] **Step 2: Update `resolveWordSpellConfig.test.ts` — update picture-mode assertions**

Find the test `'preserves picture mode + emoji rounds when saved.mode === "picture"'` (line 54) and update it:

```typescript
it('returns library-sourced picture mode with hasVisual when saved.mode === "picture"', () => {
  const saved = {
    component: 'WordSpell',
    configMode: 'advanced',
    mode: 'picture',
    totalRounds: 4,
  };

  const resolved = resolveWordSpellConfig(saved);

  expect(resolved.mode).toBe('picture');
  expect(resolved.source?.type).toBe('word-library');
  expect(resolved.source?.filter.hasVisual).toBe(true);
  expect(resolved.rounds).toBeUndefined();
  expect(resolved.totalRounds).toBe(4);
});
```

Find the test `'drops source when picture mode is explicitly chosen'` (line 189) and update it:

```typescript
it('uses source with hasVisual when picture mode is chosen, dropping any leaked source', () => {
  const saved = {
    component: 'WordSpell',
    configMode: 'advanced',
    mode: 'picture',
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        graphemesAllowed: [{ g: 's', p: 's' }],
      },
    },
    totalRounds: 4,
  };

  const resolved = resolveWordSpellConfig(saved);

  expect(resolved.source?.filter.hasVisual).toBe(true);
  expect(resolved.rounds).toBeUndefined();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts src/routes/\$locale/_app/game/mode-default-invariant.test.ts`

Expected: Multiple FAIL — the old implementation still returns rounds + no source for picture mode.

- [ ] **Step 4: Remove `WORD_SPELL_ROUND_POOL` and `sliceWordSpellRounds`**

In `src/routes/$locale/_app/game/$gameId.tsx`, delete lines 83-97 entirely (the `WORD_SPELL_ROUND_POOL` array and `sliceWordSpellRounds` function). These are no longer needed.

- [ ] **Step 5: Update `DEFAULT_PICTURE_CONFIG` to use source with hasVisual**

Replace the old `DEFAULT_PICTURE_CONFIG` (lines 123-135) with:

```typescript
const DEFAULT_PICTURE_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 8,
  roundsInOrder: true,
  ttsEnabled: true,
  mode: 'picture',
  tileUnit: 'letter',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      hasVisual: true,
    },
  },
};
```

- [ ] **Step 6: Rewrite the picture-mode branch of `resolveWordSpellConfig`**

Replace the picture-mode branch (lines 286-298) with:

```typescript
// mode === 'picture' (or 'sentence-gap' — treat as picture for default fallback)
// picture with explicit rounds ⇒ honor them, drop source
if (Array.isArray(merged.rounds) && merged.rounds.length > 0) {
  const { source: _ignored, ...rest } = merged;
  return rest as WordSpellConfig;
}
// picture without explicit rounds ⇒ source with hasVisual, drop rounds
const picture = { ...merged };
if (picture.rounds) {
  delete picture.rounds;
}
if (!picture.source) {
  picture.source = {
    type: 'word-library',
    filter: { region: 'aus', hasVisual: true },
  };
} else {
  picture.source = {
    ...picture.source,
    filter: { ...picture.source.filter, hasVisual: true },
  };
}
return picture;
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts src/routes/\$locale/_app/game/mode-default-invariant.test.ts`

Expected: ALL PASS

- [ ] **Step 8: Run typecheck to catch any remaining references to removed code**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && yarn typecheck`

Expected: PASS — if any file still references `WORD_SPELL_ROUND_POOL` or `sliceWordSpellRounds`, the typecheck will fail and you must remove those references.

- [ ] **Step 9: Commit**

```bash
git add src/routes/\$locale/_app/game/\$gameId.tsx src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts src/routes/\$locale/_app/game/mode-default-invariant.test.ts
git commit -m "feat(word-spell): invert picture-mode invariant to library-sourced rounds, remove hardcoded pool (#277)"
```

---

### Task 8: Zero-results fallback for hasVisual filtering (R8 fallback)

**Files:**

- Modify: `src/games/word-spell/useLibraryRounds.ts:65-87`
- Test: `src/games/word-spell/useLibraryRounds.test.tsx`

When `hasVisual: true` in the filter returns zero hits, the game must fall back to audio-only (recall-like) rounds by retrying without `hasVisual`.

- [ ] **Step 1: Write a failing test for hasVisual zero-results fallback**

In `src/games/word-spell/useLibraryRounds.test.tsx`, add this test inside the `useLibraryRounds` describe block:

```typescript
it('falls back to non-visual rounds when hasVisual filter returns zero hits', async () => {
  const config: WordSpellConfig = {
    ...baseConfig,
    mode: 'picture',
    totalRounds: 3,
    source: {
      type: 'word-library',
      // Level 8 has no emoji-tagged words → zero visual hits → fallback triggers
      filter: { region: 'aus', level: 8, hasVisual: true },
    },
  };
  const { result } = renderHook(() =>
    useLibraryRounds(config, undefined, store),
  );
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  // Fallback retried without hasVisual, so we get level 8 words without emoji
  expect(result.current.rounds.length).toBeGreaterThan(0);
  expect(result.current.rounds.some((r) => !r.emoji && !r.image)).toBe(
    true,
  );
});

it('returns visual rounds when hasVisual filter matches enough words', async () => {
  const config: WordSpellConfig = {
    ...baseConfig,
    mode: 'picture',
    totalRounds: 2,
    source: {
      type: 'word-library',
      filter: { region: 'aus', hasVisual: true },
    },
  };
  const { result } = renderHook(() =>
    useLibraryRounds(config, undefined, store),
  );
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.rounds).toHaveLength(2);
  for (const r of result.current.rounds) {
    expect(r.emoji ?? r.image).toBeDefined();
  }
});
```

- [ ] **Step 2: Run tests to verify the fallback test fails**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/games/word-spell/useLibraryRounds.test.tsx`

Expected: At least the zero-results fallback scenario exposes a problem — when `hasVisual: true` is set for a level with few/no visual words, the hook returns zero or too few rounds.

- [ ] **Step 3: Implement fallback in `useLibraryRounds`**

In `src/games/word-spell/useLibraryRounds.ts`, update the async function inside the `useEffect` (around lines 65-87). After getting initial results, if they're empty and the filter had `hasVisual`, retry without it:

```typescript
void (async () => {
  let activeFilter = source.filter;
  let result = await filterWords(activeFilter);
  if (cancellation.isCancelled) return;

  if (result.hits.length === 0 && source.filter.hasVisual) {
    const { hasVisual: _, ...fallbackFilter } = source.filter;
    activeFilter = fallbackFilter;
    result = await filterWords(activeFilter);
    if (cancellation.isCancelled) return;
  }

  const limit = source.limit ?? config.totalRounds;
  const picked = config.roundsInOrder
    ? result.hits.slice(0, limit)
    : await pickWithRecycling(
        result.hits,
        limit,
        filterSignature(activeFilter),
        store,
        seed,
      );
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- isCancelled may be set to true by cleanup between awaits
  if (cancellation.isCancelled) return;

  setState({
    rounds: picked.map((hit) => toWordSpellRound(hit)),
    isLoading: false,
    usedFallback: result.usedFallback,
  });
})();
```

- [ ] **Step 4: Run all useLibraryRounds tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run src/games/word-spell/useLibraryRounds.test.tsx`

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/useLibraryRounds.ts src/games/word-spell/useLibraryRounds.test.tsx
git commit -m "feat(word-spell): add hasVisual zero-results fallback in useLibraryRounds (#277)"
```

---

### Task 9: Full regression test suite

**Files:** None — verification only.

- [ ] **Step 1: Run the full unit test suite**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && npx vitest run`

Expected: ALL PASS

- [ ] **Step 2: Run typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && yarn typecheck`

Expected: PASS

- [ ] **Step 3: Run lint**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/issue-277-consolidate-word-emoji && yarn lint`

Expected: PASS

- [ ] **Step 4: Verify no references to removed code remain**

Run: `grep -rn 'WORD_SPELL_ROUND_POOL\|sliceWordSpellRounds' src/`

Expected: No output — all references to the hardcoded pool are gone.

---

## Spec Coverage Matrix

| Requirement                            | Task(s)                    | Acceptance Example |
| -------------------------------------- | -------------------------- | ------------------ |
| R1 — CurriculumEntry emoji/image       | Task 1                     | AE3                |
| R2 — WordHit emoji/image propagation   | Task 3                     | AE3                |
| R3 — DraftEntry emoji/image            | Task 1                     | —                  |
| R4 — toWordSpellRound maps emoji/image | Task 4                     | AE1                |
| R5 — Existing 7 words get emoji        | Task 5                     | AE1                |
| R6 — "mum" added to curriculum + core  | Task 6                     | —                  |
| R7 — hasVisual filter                  | Task 2                     | AE2                |
| R8 — Picture mode uses library source  | Task 7                     | AE1                |
| R8 — Saved explicit rounds honored     | Task 7 (Step 1, test case) | —                  |
| R8 — Zero-results fallback             | Task 8                     | —                  |
| R9 — Remove hardcoded pool             | Task 7 (Step 4)            | —                  |

## Outstanding Questions Resolved

- **"mum" IPA/graphemes:** `/mʌm/` with graphemes `m/m`, `u/ʌ`, `m/m`. This follows the same pattern as existing level 2 words with the `ʌ` vowel (e.g. "mug" = `m/m`, `u/ʌ`, `g/g`).
- **Default picture-mode filter scope:** Pull from all levels with visuals (no level/grapheme constraint). The default `WordFilter` uses `region: 'aus'` and `hasVisual: true` with no level restriction, so any curriculum word tagged with emoji or image across any level is included.

## Known Limitations

- **Region hardcoded to `aus`:** The default picture-mode filter and `DEFAULT_PICTURE_CONFIG` hardcode `region: 'aus'`. This mirrors the existing behavior (the hardcoded pool was also aus-only), but means adding picture-mode words for other regions requires a code change to the default filter, not just a data edit. Multi-region picture-mode support is out of scope for this pass — when other regions are introduced, the default should derive region from the user's locale or a config setting.
