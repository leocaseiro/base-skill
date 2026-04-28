# WordSpell Cumulative Tile Pool + Y Phoneme Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-29-wordspell-cumulative-y-filter-design.md`

**Goal:** Replace PR #219's disjoint chip-filter contract with a two-layer model — cumulative `graphemesAllowed` (so kids always have the tiles they need) + `phonemesRequired` Y filter (so easy pure-prior-level words drop out automatically). Add group-click level headers to replace native checkboxes, unify Simple and Advanced renderings, and split `DEFAULT_WORD_SPELL_CONFIG` so recall mode never carries the picture-mode emoji pool.

**Architecture:** Selection state stays as `selectedUnits: LevelGraphemeUnit[]` (PR #219 shape, unchanged). Pure helpers in `level-unit-selection.ts` derive header state and unit-level lookups. `resolveSimpleConfig` derives a `WordFilter` with `graphemesAllowed = cumulativeGraphemes(maxLevel).map(g)` and `phonemesRequired = uniquePhonemes(selectedUnits)`. The UI is a single `WordSpellLibrarySource` component used by both Simple form and Advanced modal slot — chips with clickable level headers (no native `<input type="checkbox">`). A new `WordPreviewBar` queries `filterWords` live below the picker. The route handler splits `DEFAULT_WORD_SPELL_CONFIG` into `DEFAULT_RECALL_CONFIG` (library source, no rounds) and `DEFAULT_PICTURE_CONFIG` (emoji rounds, no source) and `resolveWordSpellConfig` enforces the invariant.

**Tech Stack:** TypeScript, React 18, Vitest + React Testing Library, RxDB (for the unchanged migration from PR #219 spec), Storybook 8 (for VR baselines).

---

## File structure

### Files to create

| Path                                                          | Purpose                                                                                   |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/games/word-spell/useFilteredWords.ts`                    | Async hook around `filterWords` with cancellation + cache                                 |
| `src/games/word-spell/useFilteredWords.test.tsx`              | Hook unit tests                                                                           |
| `src/games/word-spell/WordPreviewBar/WordPreviewBar.tsx`      | Live word preview bar (mirrors SortNumbers pattern)                                       |
| `src/games/word-spell/WordPreviewBar/WordPreviewBar.test.tsx` | Component tests                                                                           |
| `src/routes/$locale/_app/game/mode-default-invariant.test.ts` | Asserts recall ⇒ source ∧ no rounds, picture ⇒ rounds ∧ no source, across every flip path |

### Files to modify

| Path                                                                            | What changes                                                                                                                |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/games/word-spell/level-unit-selection.ts`                                  | Add `unitLevel`, `headerStateForLevel`; keep existing helpers                                                               |
| `src/games/word-spell/level-unit-selection.test.ts`                             | Add tests for new helpers                                                                                                   |
| `src/games/word-spell/resolve-simple-config.ts`                                 | Switch from `phonemesAllowed` to `phonemesRequired`; cumulative `graphemesAllowed`                                          |
| `src/games/word-spell/resolve-simple-config.test.ts`                            | Update assertions; add Y-filter test cases                                                                                  |
| `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`        | Drop variant prop; replace native `<input type="checkbox">` with clickable `<button>` header; render `WordPreviewBar`       |
| `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`   | Test group-click headers; assert no native checkboxes                                                                       |
| `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx` | Drive new chip UI; assert cumulative `graphemesAllowed` + `phonemesRequired`                                                |
| `src/games/config-fields-registry.tsx`                                          | Drop `variant="checkbox-tree"` from `WordSpellAdvancedHeader`                                                               |
| `src/data/words/curriculum-invariant.test.ts`                                   | Add Y-filter invariants (single-chip selection at any level yields a non-empty pool)                                        |
| `src/routes/$locale/_app/game/$gameId.tsx`                                      | Split `DEFAULT_WORD_SPELL_CONFIG` into `DEFAULT_RECALL_CONFIG` + `DEFAULT_PICTURE_CONFIG`; rewrite `resolveWordSpellConfig` |
| `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts`                   | Update existing tests for the new defaults; add invariant assertions                                                        |

### Files NOT touched

- `src/data/words/levels.ts` — `cumulativeGraphemes` already exists and is the right shape
- `src/data/words/filter.ts` — `entryMatches` already supports both `graphemesAllowed` (every) and `phonemesRequired` (some)
- `src/db/migrations/word-spell-multi-level.ts` — migration from PR #219 spec is unchanged
- `src/db/schemas/saved_game_configs.ts` and `src/db/schemas/custom_games.ts` — schema bumps already in PR #219

---

## Working environment

You are on `feat/issue-216` in the worktree at `/Users/leocaseiro/.worktrees/base-skill/bs-4`. All commands run from there.

```bash
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
git status # should show clean tree on feat/issue-216
```

Before starting, pull the latest:

```bash
git pull --ff-only origin feat/issue-216
```

---

## Phase 1 — Pure helpers

### Task 1: Add `unitLevel(unit)` helper

Looks up the introduction level of a `(grapheme, phoneme)` pair against `GRAPHEMES_BY_LEVEL`. Returns `undefined` if the unit is not in the curriculum (never happens in practice but keeps the function total).

**Files:**

- Modify: `src/games/word-spell/level-unit-selection.ts`
- Test: `src/games/word-spell/level-unit-selection.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/games/word-spell/level-unit-selection.test.ts`:

```ts
describe('unitLevel', () => {
  it('returns 1 for L1 unit { g: "s", p: "s" }', () => {
    expect(unitLevel({ g: 's', p: 's' })).toBe(1);
  });

  it('returns 4 for L4 unit { g: "sh", p: "ʃ" }', () => {
    expect(unitLevel({ g: 'sh', p: 'ʃ' })).toBe(4);
  });

  it('distinguishes same-grapheme-different-phoneme units across levels', () => {
    expect(unitLevel({ g: 'c', p: 'k' })).toBe(2);
    expect(unitLevel({ g: 'c', p: 's' })).toBe(4);
  });

  it('returns undefined for an unknown unit', () => {
    expect(unitLevel({ g: 'qq', p: 'qq' })).toBeUndefined();
  });
});
```

Add the import at the top of the test file:

```ts
import {
  defaultSelection,
  toggleLevel,
  toggleUnit,
  triStateForLevel,
  unitLevel, // ← new
} from './level-unit-selection';
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
yarn vitest run src/games/word-spell/level-unit-selection.test.ts -t unitLevel
```

Expected: 4 tests fail with `unitLevel is not a function` (or TypeScript error before run).

- [ ] **Step 3: Implement `unitLevel`**

Append to `src/games/word-spell/level-unit-selection.ts`:

```ts
export const unitLevel = (
  unit: LevelGraphemeUnit,
): number | undefined => {
  for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
    const units = unitsAt(lvl);
    if (units.some((u) => sameUnit(u, unit))) return lvl;
  }
  return undefined;
};
```

- [ ] **Step 4: Run test to verify pass**

```bash
yarn vitest run src/games/word-spell/level-unit-selection.test.ts
```

Expected: all tests pass (existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/level-unit-selection.ts src/games/word-spell/level-unit-selection.test.ts
git commit -m "feat(word-spell): add unitLevel helper for level lookup"
```

---

### Task 2: Add `headerStateForLevel` helper

Returns a richer descriptor for the level row's header. Replaces the binary `triStateForLevel` for the new UI's needs but keeps `triStateForLevel` exported as a deprecated alias until callers migrate (Task 14 removes it).

**Files:**

- Modify: `src/games/word-spell/level-unit-selection.ts`
- Test: `src/games/word-spell/level-unit-selection.test.ts`

- [ ] **Step 1: Write failing tests**

Append to the test file:

```ts
import type { LevelHeaderState } from './level-unit-selection';

describe('headerStateForLevel', () => {
  const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []) as LevelGraphemeUnit[];
  const L4 = (GRAPHEMES_BY_LEVEL[4] ?? []) as LevelGraphemeUnit[];

  it('returns "all-on" with counts when every L1 unit is selected and maxLevel >= 1', () => {
    const state = headerStateForLevel(1, [...L1], 1);
    expect(state.kind).toBe('all-on');
    expect(state).toMatchObject({ count: L1.length, total: L1.length });
  });

  it('returns "partial" with counts when some chips are on', () => {
    const state = headerStateForLevel(1, [L1[0]!, L1[1]!], 1);
    expect(state.kind).toBe('partial');
    expect(state).toMatchObject({ count: 2, total: L1.length });
  });

  it('returns "tiles-only" when level <= maxLevel but no chips are ticked at this level', () => {
    const sh = L4.find((u) => u.g === 'sh' && u.p === 'ʃ')!;
    const state = headerStateForLevel(2, [sh], 4);
    expect(state.kind).toBe('tiles-only');
    expect(state).toMatchObject({
      total: GRAPHEMES_BY_LEVEL[2]!.length,
    });
  });

  it('returns "not-in-scope" when level > maxLevel', () => {
    const state = headerStateForLevel(5, [...L1], 1);
    expect(state.kind).toBe('not-in-scope');
    expect(state).toMatchObject({
      total: GRAPHEMES_BY_LEVEL[5]!.length,
    });
  });
});
```

Add to the existing import of `level-unit-selection`:

```ts
import {
  defaultSelection,
  headerStateForLevel, // ← new
  toggleLevel,
  toggleUnit,
  triStateForLevel,
  unitLevel,
} from './level-unit-selection';
```

- [ ] **Step 2: Run test to verify failure**

```bash
yarn vitest run src/games/word-spell/level-unit-selection.test.ts -t headerStateForLevel
```

Expected: TypeScript compile error or runtime "headerStateForLevel is not a function".

- [ ] **Step 3: Implement `headerStateForLevel`**

Append to `src/games/word-spell/level-unit-selection.ts`:

```ts
export type LevelHeaderState =
  | { kind: 'all-on'; count: number; total: number }
  | { kind: 'partial'; count: number; total: number }
  | { kind: 'tiles-only'; total: number }
  | { kind: 'not-in-scope'; total: number };

export const headerStateForLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
  maxLevel: number,
): LevelHeaderState => {
  const units = unitsAt(level);
  const total = units.length;
  const count = units.filter((u) =>
    selected.some((s) => sameUnit(s, u)),
  ).length;

  if (count === total && total > 0)
    return { kind: 'all-on', count, total };
  if (count > 0) return { kind: 'partial', count, total };
  if (level <= maxLevel) return { kind: 'tiles-only', total };
  return { kind: 'not-in-scope', total };
};
```

- [ ] **Step 4: Run test to verify pass**

```bash
yarn vitest run src/games/word-spell/level-unit-selection.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/level-unit-selection.ts src/games/word-spell/level-unit-selection.test.ts
git commit -m "feat(word-spell): add headerStateForLevel for new chip-row header"
```

---

## Phase 2 — Filter derivation

### Task 3: Rewrite `resolveSimpleConfig` for cumulative + Y filter

Switch from `phonemesAllowed` (every-must-fit) to `phonemesRequired` (at-least-one-matches), and make `graphemesAllowed` cumulative through `maxLevel(selectedUnits)` so single-chip selections still produce playable words.

**Files:**

- Modify: `src/games/word-spell/resolve-simple-config.ts`
- Test: `src/games/word-spell/resolve-simple-config.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the `describe('resolveSimpleConfig', ...)` block in `src/games/word-spell/resolve-simple-config.test.ts` with:

```ts
describe('resolveSimpleConfig', () => {
  it('resolves recall mode + region from selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: L1,
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.mode).toBe('recall');
    expect(full.source?.filter.region).toBe('aus');
  });

  it('derives cumulative graphemesAllowed from maxLevel of selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [{ g: 'sh', p: 'ʃ' }], // L4 unit
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    // Cumulative L1..L4 includes s, a, t, p, i, n (L1) plus sh
    expect(allowed.has('s')).toBe(true);
    expect(allowed.has('a')).toBe(true);
    expect(allowed.has('i')).toBe(true);
    expect(allowed.has('p')).toBe(true);
    expect(allowed.has('sh')).toBe(true);
    // Anything from L5+ must NOT leak in
    expect(allowed.has('ai')).toBe(false);
  });

  it('derives phonemesRequired (Y filter) from selected unit phonemes', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [{ g: 'sh', p: 'ʃ' }],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.phonemesRequired).toEqual(['ʃ']);
    // phonemesAllowed should NOT be present — would over-constrain
    expect(full.source?.filter.phonemesAllowed).toBeUndefined();
  });

  it('dedupes phonemes when multiple units share a phoneme', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      // L2 has c, k, ck — all teaching /k/
      selectedUnits: [
        { g: 'c', p: 'k' },
        { g: 'k', p: 'k' },
        { g: 'ck', p: 'k' },
      ],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.phonemesRequired).toEqual(['k']);
  });

  it('falls back to L1 default when selectedUnits is empty', () => {
    const simple = {
      configMode: 'simple',
      selectedUnits: [],
      region: 'aus',
      inputMethod: 'drag',
    } as WordSpellSimpleConfig;
    const full = resolveSimpleConfig(simple);
    // maxLevel = 1, graphemesAllowed = L1 graphemes, phonemesRequired = []
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    expect(allowed.has('s')).toBe(true);
    expect(allowed.has('m')).toBe(false);
    expect(full.source?.filter.phonemesRequired).toEqual([]);
  });

  it('handles legacy { level, phonemesAllowed } shape via fallback', () => {
    const legacy = {
      configMode: 'simple',
      level: 2,
      phonemesAllowed: ['s', 'm'],
      region: 'aus',
      inputMethod: 'drag',
    } as unknown as WordSpellSimpleConfig;
    const full = resolveSimpleConfig(legacy);
    expect(full.source?.filter.phonemesRequired).toContain('s');
    expect(full.source?.filter.phonemesRequired).toContain('m');
    // graphemesAllowed should be cumulative L1..L2
    const allowed = new Set(full.source?.filter.graphemesAllowed);
    expect(allowed.has('s')).toBe(true); // L1
    expect(allowed.has('a')).toBe(true); // L1
    expect(allowed.has('m')).toBe(true); // L2
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
yarn vitest run src/games/word-spell/resolve-simple-config.test.ts
```

Expected: 4-5 of the 6 new tests fail (the cumulative + phonemesRequired ones).

- [ ] **Step 3: Rewrite `resolveSimpleConfig`**

Replace the contents of `src/games/word-spell/resolve-simple-config.ts` with:

```ts
import { defaultSelection, unitLevel } from './level-unit-selection';
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL, cumulativeGraphemes } from '@/data/words';

const uniquePhonemes = (
  units: readonly LevelGraphemeUnit[],
): string[] => [...new Set(units.map((u) => u.p))];

const maxLevelOf = (units: readonly LevelGraphemeUnit[]): number => {
  if (units.length === 0) return 1;
  let max = 1;
  for (const u of units) {
    const lvl = unitLevel(u);
    if (lvl !== undefined && lvl > max) max = lvl;
  }
  return max;
};

const cumulativeGraphemeForms = (level: number): string[] => [
  ...new Set(cumulativeGraphemes(level).map((u) => u.g)),
];

const unitsFromLegacy = (
  raw: Record<string, unknown>,
): LevelGraphemeUnit[] => {
  if (
    typeof raw.level !== 'number' ||
    !Array.isArray(raw.phonemesAllowed)
  )
    return defaultSelection();
  const out: LevelGraphemeUnit[] = [];
  for (let lvl = 1; lvl <= raw.level; lvl++) {
    for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
      if ((raw.phonemesAllowed as string[]).includes(u.p)) out.push(u);
    }
  }
  return out.length > 0 ? out : defaultSelection();
};

export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => {
  const raw = simple as unknown as Record<string, unknown>;
  const units = Array.isArray(raw.selectedUnits)
    ? (raw.selectedUnits as LevelGraphemeUnit[])
    : unitsFromLegacy(raw);
  const region =
    typeof raw.region === 'string' ? (raw.region as 'aus') : 'aus';

  const maxLevel = maxLevelOf(units);
  const graphemesAllowed = cumulativeGraphemeForms(maxLevel);
  const phonemesRequired = uniquePhonemes(units);

  return {
    gameId: 'word-spell',
    component: 'WordSpell',
    configMode: 'simple',
    mode: 'recall',
    tileUnit: 'letter',
    inputMethod: simple.inputMethod,
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 4,
    tileBankMode: 'exact',
    source: {
      type: 'word-library',
      filter: {
        region,
        graphemesAllowed,
        phonemesRequired,
      },
    },
  };
};

export const advancedToSimple = (
  config: WordSpellConfig,
): WordSpellSimpleConfig => {
  const filter = config.source?.filter;
  const region = filter?.region ?? 'aus';

  if (
    typeof filter?.level === 'number' &&
    Array.isArray(filter.phonemesAllowed)
  ) {
    const out: LevelGraphemeUnit[] = [];
    for (let lvl = 1; lvl <= filter.level; lvl++) {
      for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
        if (filter.phonemesAllowed.includes(u.p)) {
          out.push(u);
        }
      }
    }
    return {
      configMode: 'simple',
      selectedUnits: out,
      region,
      inputMethod: config.inputMethod,
    };
  }

  return {
    configMode: 'simple',
    selectedUnits: defaultSelection(),
    region,
    inputMethod: config.inputMethod,
  };
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
yarn vitest run src/games/word-spell/resolve-simple-config.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Confirm `WordFilter` type accepts `phonemesRequired`**

```bash
grep -n "phonemesRequired" src/data/words/types.ts src/data/words/filter.ts
```

Expected: at least 2-3 hits in `filter.ts` (`entryMatches` already implements it). If `types.ts` doesn't define it, this is a bug — but it should be there from before PR #219.

- [ ] **Step 6: Run full TypeScript check**

```bash
yarn typecheck
```

Expected: green. (If a downstream caller of `source.filter.phonemesAllowed` breaks, fix it as part of this task — likely none exist since `phonemesAllowed` was only set in `resolveSimpleConfig`.)

- [ ] **Step 7: Commit**

```bash
git add src/games/word-spell/resolve-simple-config.ts src/games/word-spell/resolve-simple-config.test.ts
git commit -m "feat(word-spell): cumulative graphemesAllowed + phonemesRequired Y filter

Replaces the disjoint phonemesAllowed model where picking a single chip
yielded zero playable words because prior-level graphemes weren't in the
allowed set. New derivation:

- graphemesAllowed = cumulative L1..max(level of selected unit) — every
  word's graphemes must fit (every-semantics)
- phonemesRequired = unique phonemes of selected units — word must
  contain at least one (some-semantics, the Y filter)

Net effect: 'Level 4 + only sh' now plays ship/shop/shed/fish/dish (not
zero); easy pure-prior-level words like sit/sat/mad/red are dropped
unless the user explicitly ticks an L1/L2 chip."
```

---

## Phase 3 — Preview infrastructure

### Task 4: Add `useFilteredWords` hook

Async wrapper around `filterWords`. Cancels in-flight queries on signature change. No debounce — chip toggles are user-paced.

**Files:**

- Create: `src/games/word-spell/useFilteredWords.ts`
- Test: `src/games/word-spell/useFilteredWords.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/games/word-spell/useFilteredWords.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useFilteredWords } from './useFilteredWords';
import { __resetChunkCacheForTests } from '@/data/words';

afterEach(() => {
  __resetChunkCacheForTests();
});

describe('useFilteredWords', () => {
  it('returns isLoading=true on first render and resolves to hits', async () => {
    const { result } = renderHook(() =>
      useFilteredWords({
        region: 'aus',
        graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
        phonemesRequired: ['s'],
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hits.length).toBeGreaterThan(0);
  });

  it('reruns when filter signature changes', async () => {
    const { result, rerender } = renderHook(
      ({ phonemesRequired }) =>
        useFilteredWords({
          region: 'aus',
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
          phonemesRequired,
        }),
      { initialProps: { phonemesRequired: ['s'] } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const firstCount = result.current.hits.length;

    rerender({ phonemesRequired: ['t'] });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Different phoneme → different (likely smaller or different) result set
    const secondCount = result.current.hits.length;
    expect(secondCount).toBeGreaterThan(0);
    // Don't assert direction — just that it actually re-queried
    expect(result.current.hits.some((h) => h.word.includes('t'))).toBe(
      true,
    );
  });

  it('returns empty hits when filter excludes everything', async () => {
    const { result } = renderHook(() =>
      useFilteredWords({
        region: 'aus',
        graphemesAllowed: ['s'],
        phonemesRequired: ['xx_nonexistent'],
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
yarn vitest run src/games/word-spell/useFilteredWords.test.tsx
```

Expected: TypeScript / module-not-found error.

- [ ] **Step 3: Implement `useFilteredWords`**

Create `src/games/word-spell/useFilteredWords.ts`:

```ts
import { useEffect, useState } from 'react';
import { filterWords } from '@/data/words';
import type { WordFilter, WordHit } from '@/data/words';

interface State {
  hits: WordHit[];
  isLoading: boolean;
}

export const useFilteredWords = (filter: WordFilter): State => {
  const [state, setState] = useState<State>({
    hits: [],
    isLoading: true,
  });

  // Stable signature — re-runs effect only when meaningful inputs change.
  // JSON.stringify is fine here because filters are small (≤ 50 keys).
  const signature = JSON.stringify(filter);

  useEffect(() => {
    let cancelled = false;
    setState((prev) =>
      prev.isLoading ? prev : { ...prev, isLoading: true },
    );

    void (async () => {
      const result = await filterWords(filter);
      if (cancelled) return;
      setState({ hits: result.hits, isLoading: false });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature replaces filter object identity
  }, [signature]);

  return state;
};
```

- [ ] **Step 4: Run test to verify pass**

```bash
yarn vitest run src/games/word-spell/useFilteredWords.test.tsx
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/useFilteredWords.ts src/games/word-spell/useFilteredWords.test.tsx
git commit -m "feat(word-spell): add useFilteredWords hook for live preview"
```

---

### Task 5: Add `WordPreviewBar` component

Renders the live word pool below the chip picker. SortNumbers-style `bg-muted` bar, truncated at 24 words.

**Files:**

- Create: `src/games/word-spell/WordPreviewBar/WordPreviewBar.tsx`
- Test: `src/games/word-spell/WordPreviewBar/WordPreviewBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/games/word-spell/WordPreviewBar/WordPreviewBar.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WordPreviewBar } from './WordPreviewBar';
import { __resetChunkCacheForTests } from '@/data/words';

afterEach(() => {
  __resetChunkCacheForTests();
});

describe('WordPreviewBar', () => {
  it('shows a "Loading…" hint initially', () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
          phonemesRequired: ['s'],
        }}
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the word list when filter resolves', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
          phonemesRequired: ['s'],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bar = screen.getByTestId('word-preview-bar');
    expect(bar.textContent).toMatch(/sit|sat|sap|sin/);
  });

  it('shows a "Pick at least one sound to play." message when no hits', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: ['s'],
          phonemesRequired: [],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(/pick at least one sound to play/i),
    ).toBeInTheDocument();
  });

  it('truncates long lists and shows the total count', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
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
            'c',
            'k',
            'ck',
            'e',
            'u',
            'r',
          ],
          phonemesRequired: [
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
            'k',
            'e',
            'u',
            'r',
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bar = screen.getByTestId('word-preview-bar');
    expect(bar.textContent).toMatch(/\(\d+ total\)/);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
yarn vitest run src/games/word-spell/WordPreviewBar/WordPreviewBar.test.tsx
```

Expected: module-not-found error.

- [ ] **Step 3: Implement `WordPreviewBar`**

Create `src/games/word-spell/WordPreviewBar/WordPreviewBar.tsx`:

```tsx
import { useFilteredWords } from '../useFilteredWords';
import type { WordFilter } from '@/data/words';
import type { JSX } from 'react';

const PREVIEW_LIMIT = 24;

type Props = {
  filter: WordFilter;
};

export const WordPreviewBar = ({ filter }: Props): JSX.Element => {
  const { hits, isLoading } = useFilteredWords(filter);

  const baseClass =
    'rounded-lg px-3 py-2 text-center font-mono text-sm bg-muted text-foreground';

  if (isLoading) {
    return (
      <div data-testid="word-preview-bar" className={baseClass}>
        Loading…
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div
        data-testid="word-preview-bar"
        className={`${baseClass} text-destructive`}
      >
        Pick at least one sound to play.
      </div>
    );
  }

  const preview = hits
    .slice(0, PREVIEW_LIMIT)
    .map((h) => h.word)
    .join(', ');
  const more =
    hits.length > PREVIEW_LIMIT ? `, … (${hits.length} total)` : '';

  return (
    <div data-testid="word-preview-bar" className={baseClass}>
      {preview}
      {more}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify pass**

```bash
yarn vitest run src/games/word-spell/WordPreviewBar/WordPreviewBar.test.tsx
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/WordPreviewBar/
git commit -m "feat(word-spell): add WordPreviewBar — live word preview"
```

---

## Phase 4 — UI rewrite

### Task 6: Rewrite `WordSpellLibrarySource` with group-click headers

Drop the `variant` prop. Replace native `<input type="checkbox">` with a clickable `<button>` header. Render `WordPreviewBar` below the chip rows.

**Files:**

- Modify: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`
- Modify: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`

- [ ] **Step 1: Rewrite the component test**

Replace the contents of `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import {
  GRAPHEMES_BY_LEVEL,
  __resetChunkCacheForTests,
} from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];
const L2 = [...(GRAPHEMES_BY_LEVEL[2] ?? [])];

const Harness = ({
  initial,
}: {
  initial: LevelGraphemeUnit[];
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    selectedUnits: initial,
    region: 'aus',
  });
  return (
    <WordSpellLibrarySource config={config} onChange={setConfig} />
  );
};

afterEach(() => {
  __resetChunkCacheForTests();
});

describe('WordSpellLibrarySource', () => {
  it('renders 8 level rows', () => {
    render(<Harness initial={L1} />);
    for (let n = 1; n <= 8; n++) {
      expect(
        screen.getByRole('button', { name: new RegExp(`Level ${n}`) }),
      ).toBeInTheDocument();
    }
  });

  it('uses no native <input type="checkbox"> (group-click only)', () => {
    const { container } = render(<Harness initial={L1} />);
    expect(
      container.querySelectorAll('input[type="checkbox"]'),
    ).toHaveLength(0);
  });

  it('marks the L1 header as all-on when every L1 unit is selected', () => {
    render(<Harness initial={L1} />);
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the L1 header as partial (mixed) when one L1 unit is missing', () => {
    render(<Harness initial={L1.slice(1)} />);
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('marks the L2 header as off when no L2 units are selected', () => {
    render(<Harness initial={L1} />);
    const l2 = screen.getByRole('button', { name: /Level 2/i });
    expect(l2).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking a level header toggles every chip in that row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const l2 = screen.getByRole('button', { name: /Level 2/i });
    await user.click(l2);
    expect(l2).toHaveAttribute('aria-pressed', 'true');
    // Every L2 chip should now be on
    for (const u of L2) {
      const chip = screen.getByRole('button', {
        name: new RegExp(String.raw`${u.g}.*\/${u.p}\/`, 'i'),
      });
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it('clicking a chip toggles just that unit and updates header to partial', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const firstL1Chip = screen.getByRole('button', {
      name: new RegExp(String.raw`^${L1[0]!.g} \/${L1[0]!.p}\/`, 'i'),
    });
    await user.click(firstL1Chip);
    expect(firstL1Chip).toHaveAttribute('aria-pressed', 'false');
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('renders L1 `s /s/` and L4 `c /s/` as independent chips', () => {
    render(<Harness initial={L1} />);
    const sL1 = screen.getByRole('button', { name: /^s \/s\//i });
    const cL4 = screen.getByRole('button', { name: /^c \/s\//i });
    expect(sL1).not.toBe(cL4);
  });

  it('flags data-invalid when selectedUnits is empty', () => {
    const { container } = render(<Harness initial={[]} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('renders a WordPreviewBar', () => {
    render(<Harness initial={L1} />);
    expect(screen.getByTestId('word-preview-bar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
yarn vitest run src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx
```

Expected: most assertions fail (currently the component renders native checkboxes and no preview bar).

- [ ] **Step 3: Rewrite the component**

Replace the contents of `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx` with:

```tsx
import {
  defaultSelection,
  headerStateForLevel,
  toggleLevel,
  toggleUnit,
  unitLevel,
} from '../level-unit-selection';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { WordPreviewBar } from '../WordPreviewBar/WordPreviewBar';
import type {
  LevelGraphemeUnit,
  Region,
  WordFilter,
} from '@/data/words';
import type { JSX } from 'react';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const readSelected = (
  config: Record<string, unknown>,
): LevelGraphemeUnit[] => {
  const raw = config.selectedUnits;
  return Array.isArray(raw)
    ? (raw as LevelGraphemeUnit[])
    : defaultSelection();
};

const readRegion = (config: Record<string, unknown>): Region =>
  typeof config.region === 'string' ? (config.region as Region) : 'aus';

const maxLevelOf = (units: readonly LevelGraphemeUnit[]): number => {
  if (units.length === 0) return 1;
  let max = 1;
  for (const u of units) {
    const lvl = unitLevel(u);
    if (lvl !== undefined && lvl > max) max = lvl;
  }
  return max;
};

const chipsForLevel = (
  level: number,
): { value: string; label: string; units: LevelGraphemeUnit[] }[] => {
  const byPhoneme = new Map<string, LevelGraphemeUnit[]>();
  for (const u of GRAPHEMES_BY_LEVEL[level] ?? []) {
    const existing = byPhoneme.get(u.p);
    if (existing) existing.push(u);
    else byPhoneme.set(u.p, [u]);
  }
  return [...byPhoneme.entries()].map(([p, units]) => ({
    value: `${level}|${p}`,
    label: `${units.map((u) => u.g).join(', ')} /${p}/`,
    units,
  }));
};

const headerAriaPressed = (
  state: ReturnType<typeof headerStateForLevel>,
): 'true' | 'false' | 'mixed' => {
  if (state.kind === 'all-on') return 'true';
  if (state.kind === 'partial') return 'mixed';
  return 'false';
};

const headerSubtitle = (
  state: ReturnType<typeof headerStateForLevel>,
): string => {
  switch (state.kind) {
    case 'all-on':
      return `${state.count} / ${state.total} sounds`;
    case 'partial':
      return `partial ${state.count} / ${state.total} sounds`;
    case 'tiles-only':
      return 'tiles only';
    case 'not-in-scope':
      return 'not in scope';
  }
};

const headerBgClass = (
  state: ReturnType<typeof headerStateForLevel>,
): string => {
  switch (state.kind) {
    case 'all-on':
      return 'bg-primary text-primary-foreground';
    case 'partial':
      return 'bg-primary/40 text-primary-foreground';
    case 'tiles-only':
      return 'bg-muted text-foreground/80';
    case 'not-in-scope':
      return 'bg-muted/40 text-foreground/50';
  }
};

const LevelRow = ({
  level,
  selected,
  maxLevel,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  maxLevel: number;
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const state = headerStateForLevel(level, selected, maxLevel);
  const chips = chipsForLevel(level);

  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);

  const handleHeader = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        state.kind === 'all-on' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (units: LevelGraphemeUnit[]) => {
    let acc = selected;
    for (const u of units) acc = toggleUnit(u, acc);
    onChange(acc);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleHeader}
        aria-pressed={headerAriaPressed(state)}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${headerBgClass(state)}`}
      >
        <span>Level {level}</span>
        <span className="text-xs font-normal opacity-80">
          {headerSubtitle(state)}
        </span>
      </button>

      <div className="flex flex-wrap gap-1">
        {chips.map((c) => {
          const on = c.units.every((u) => isUnitOn(u));
          const base = 'rounded-full px-2.5 py-1 text-xs font-bold';
          const cls = on
            ? `${base} bg-primary text-primary-foreground`
            : `${base} border border-border bg-muted text-foreground`;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => handleChip(c.units)}
              aria-pressed={on}
              aria-label={c.label}
              className={cls}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const buildPreviewFilter = (
  selected: LevelGraphemeUnit[],
  region: Region,
): WordFilter => {
  const resolved = resolveSimpleConfig({
    configMode: 'simple',
    selectedUnits: selected,
    region,
    inputMethod: 'drag',
  });
  return resolved.source!.filter;
};

export const WordSpellLibrarySource = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const selected = readSelected(config);
  const region = readRegion(config);
  const invalid = selected.length === 0;
  const maxLevel = maxLevelOf(selected);

  const setSelected = (next: LevelGraphemeUnit[]) => {
    onChange({ ...config, selectedUnits: next });
  };

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      {LEVELS.map((n) => (
        <LevelRow
          key={n}
          level={n}
          selected={selected}
          maxLevel={maxLevel}
          onChange={setSelected}
        />
      ))}
      <WordPreviewBar filter={buildPreviewFilter(selected, region)} />
      {invalid && (
        <p className="mt-2 text-xs text-destructive">
          Pick at least one sound to play.
        </p>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
yarn vitest run src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/WordSpellLibrarySource/
git commit -m "feat(word-spell): rewrite picker with group-click headers + preview bar

Replaces native <input type=checkbox> with a clickable <button> header
that bulk-toggles all chips in a row. Drops the variant prop — the
checkbox-tree rendering is gone; Simple form and Advanced modal slot
both render the same chip-based UI now. WordPreviewBar renders the
live word pool below the rows."
```

---

### Task 7: Drop variant prop in registry

**Files:**

- Modify: `src/games/config-fields-registry.tsx`

- [ ] **Step 1: Update `WordSpellAdvancedHeader`**

In `src/games/config-fields-registry.tsx`, replace lines 58-63:

```tsx
const WordSpellAdvancedHeader = (props: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => <WordSpellLibrarySource {...props} />;
```

(Removed the `variant="checkbox-tree"` prop since the component no longer accepts it.)

- [ ] **Step 2: Run typecheck**

```bash
yarn typecheck
```

Expected: green.

- [ ] **Step 3: Run all word-spell tests**

```bash
yarn vitest run src/games/word-spell/ src/games/config-fields-registry
```

Expected: green. (No tests directly target the registry, but Storybook component tests for Advanced may pick this up — if any fail, they're outdated; we'll review baselines in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add src/games/config-fields-registry.tsx
git commit -m "refactor(word-spell): drop variant prop from advanced header wrapper

The single WordSpellLibrarySource rendering is used by both Simple form
and Advanced modal slot now."
```

---

## Phase 5 — Mode-driven defaults

### Task 8: Split `DEFAULT_WORD_SPELL_CONFIG` and rewrite `resolveWordSpellConfig`

The biggest behavioural change in this phase: the saved-null and saved-without-mode paths now return library-source recall configs, not the emoji-pool picture configs.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Locate and read the current implementation**

```bash
grep -n "DEFAULT_WORD_SPELL_CONFIG\|resolveWordSpellConfig\|WORD_SPELL_ROUND_POOL\|sliceWordSpellRounds" src/routes/\$locale/_app/game/\$gameId.tsx | head -30
```

Verify lines roughly match what's described below — the file is large so line numbers may drift.

- [ ] **Step 2: Add the new imports to the top of the file**

Open `src/routes/$locale/_app/game/$gameId.tsx` and add these imports alongside the existing imports near the top of the file (the file already imports from `@/data/words` and `@/games/word-spell/...`, so add to those import statements rather than creating new ones):

```ts
import { cumulativeGraphemes } from '@/data/words';
import { defaultSelection } from '@/games/word-spell/level-unit-selection';
```

- [ ] **Step 3: Replace the default and resolver**

Locate the existing `DEFAULT_WORD_SPELL_CONFIG` (around line 96) and `resolveWordSpellConfig` (around line 191). Delete the `DEFAULT_WORD_SPELL_CONFIG` constant and replace `resolveWordSpellConfig` with this block. Place `DEFAULT_RECALL_CONFIG` and `DEFAULT_PICTURE_CONFIG` where `DEFAULT_WORD_SPELL_CONFIG` was:

```ts
const DEFAULT_RECALL_CONFIG: WordSpellConfig = {
  gameId: 'word-spell',
  component: 'WordSpell',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 4,
  roundsInOrder: false,
  ttsEnabled: true,
  mode: 'recall',
  tileUnit: 'letter',
  source: {
    type: 'word-library',
    filter: {
      region: 'aus',
      graphemesAllowed: [
        ...new Set(cumulativeGraphemes(1).map((u) => u.g)),
      ],
      phonemesRequired: defaultSelection().map((u) => u.p),
    },
  },
};

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
  rounds: sliceWordSpellRounds(8),
};

export const resolveWordSpellConfig = (
  saved: Record<string, unknown> | null,
): WordSpellConfig => {
  const mode =
    (saved as { mode?: unknown } | null)?.mode === 'picture'
      ? 'picture'
      : 'recall';
  const base =
    mode === 'picture' ? DEFAULT_PICTURE_CONFIG : DEFAULT_RECALL_CONFIG;
  const baseClone: WordSpellConfig = {
    ...base,
    rounds: base.rounds
      ? base.rounds.map((r) => ({ ...r }))
      : undefined,
    source: base.source
      ? { ...base.source, filter: { ...base.source.filter } }
      : undefined,
  };

  if (!saved || saved.component !== 'WordSpell') return baseClone;

  // Simple-mode: delegate to word-spell's library-source resolver.
  if (saved.configMode === 'simple') {
    const savedInput = saved.inputMethod;
    return resolveWordSpellSimpleConfig({
      configMode: 'simple',
      ...saved,
      inputMethod:
        savedInput === 'type' || savedInput === 'both'
          ? savedInput
          : 'drag',
    } as Parameters<typeof resolveWordSpellSimpleConfig>[0]);
  }

  // Advanced merge — start from mode-appropriate base, then layer saved
  // fields, then enforce the mode invariant.
  const merged: WordSpellConfig = {
    ...baseClone,
    ...(saved as Partial<WordSpellConfig>),
    gameId: 'word-spell',
    component: 'WordSpell',
  };

  // Mode invariant:
  // recall  ⇒ source defined ∧ rounds undefined
  // picture ⇒ rounds defined ∧ source undefined
  if (merged.mode === 'recall') {
    if (merged.rounds) {
      const { rounds: _ignored, ...rest } = merged;
      return rest as WordSpellConfig;
    }
    return merged;
  }

  // mode === 'picture' (or 'sentence-gap' — treat as picture for default fallback)
  const picture = { ...merged };
  if (picture.source) {
    delete picture.source;
  }
  if (!Array.isArray(picture.rounds) || picture.rounds.length === 0) {
    picture.rounds = sliceWordSpellRounds(8);
  }
  picture.totalRounds = Math.min(
    picture.rounds.length,
    WORD_SPELL_ROUND_POOL.length,
  );
  return picture;
};
```

Remove the now-unused `DEFAULT_WORD_SPELL_CONFIG` constant from the same file.

- [ ] **Step 4: Update existing test expectations**

Open `src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts`. Replace its contents with:

```ts
import { describe, expect, it } from 'vitest';
import { resolveWordSpellConfig } from './$gameId';

describe('resolveWordSpellConfig — mode-driven defaults', () => {
  it('preserves source and drops explicit rounds for simple-mode saved configs', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'simple',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 2,
          phonemesAllowed: ['s', 't'],
        },
      },
      inputMethod: 'drag',
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.configMode).toBe('simple');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.source?.filter.region).toBe('aus');
    // The simple resolver derives phonemesRequired (not phonemesAllowed) now
    expect(resolved.source?.filter.phonemesRequired).toContain('s');
    expect(resolved.source?.filter.phonemesRequired).toContain('t');
    expect(resolved.source?.filter.graphemesAllowed).toBeDefined();
    expect(resolved.rounds ?? []).toEqual([]);
    expect(resolved.roundsInOrder).toBe(false);
  });

  it('returns library-sourced recall when saved is null', () => {
    const resolved = resolveWordSpellConfig(null);
    expect(resolved.mode).toBe('recall');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.rounds).toBeUndefined();
  });

  it('returns library-sourced recall for an advanced saved config without mode', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.mode).toBe('recall');
    expect(resolved.source?.type).toBe('word-library');
    expect(resolved.rounds).toBeUndefined();
  });

  it('preserves picture mode + emoji rounds when saved.mode === "picture"', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.mode).toBe('picture');
    expect(resolved.rounds?.length).toBe(8); // base default = 8 emoji rounds
    expect(resolved.source).toBeUndefined();
  });

  it('drops explicit rounds when advanced saved config explicitly sets recall + source', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'recall',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
          phonemesRequired: ['s'],
        },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source).toEqual(saved.source);
    expect(resolved.rounds ?? []).toEqual([]);
  });

  it('drops source when picture mode is explicitly chosen', () => {
    const saved = {
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      source: {
        type: 'word-library',
        filter: { region: 'aus', graphemesAllowed: ['s'] },
      },
      totalRounds: 4,
    };

    const resolved = resolveWordSpellConfig(saved);

    expect(resolved.source).toBeUndefined();
    expect(resolved.rounds?.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
yarn vitest run src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 6: Run full word-spell suite + types**

```bash
yarn vitest run src/games/word-spell/ src/routes/\$locale/_app/game/ && yarn typecheck
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/routes/\$locale/_app/game/\$gameId.tsx src/routes/\$locale/_app/game/resolveWordSpellConfig.test.ts
git commit -m "feat(word-spell): mode-driven default config

Splits DEFAULT_WORD_SPELL_CONFIG into DEFAULT_RECALL_CONFIG (library
source, no rounds) and DEFAULT_PICTURE_CONFIG (emoji rounds, no
source). resolveWordSpellConfig now picks the appropriate base by the
saved config's mode (defaulting to 'recall') and enforces the
invariant: recall ⇒ source ∧ no rounds; picture ⇒ rounds ∧ no source.

Net effect: when saved is null or an advanced config without an
explicit mode field, the player gets library-driven recall words
instead of the cat/dog/sun emoji pool."
```

---

### Task 9: Add `mode-default-invariant.test.ts`

A focused test file that asserts the mode invariant for every flip path.

**Files:**

- Create: `src/routes/$locale/_app/game/mode-default-invariant.test.ts`

- [ ] **Step 1: Write the invariant test**

Create `src/routes/$locale/_app/game/mode-default-invariant.test.ts`:

```ts
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
  expect(cfg.rounds).toBeDefined();
  expect(cfg.rounds!.length).toBeGreaterThan(0);
  expect(cfg.source).toBeUndefined();
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

  it('saved with only mode=picture → picture + rounds, no source', () => {
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
          graphemesAllowed: ['s'],
          phonemesRequired: ['s'],
        },
      },
    });
    assertRecallInvariant(cfg);
  });

  it('saved with mode=picture + leaked source → source dropped', () => {
    const cfg = resolveWordSpellConfig({
      component: 'WordSpell',
      configMode: 'advanced',
      mode: 'picture',
      source: {
        type: 'word-library',
        filter: { region: 'aus', graphemesAllowed: ['s'] },
      },
      rounds: [{ word: 'cat', emoji: '🐱' }],
    });
    assertPictureInvariant(cfg);
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

- [ ] **Step 2: Run tests**

```bash
yarn vitest run src/routes/\$locale/_app/game/mode-default-invariant.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/\$locale/_app/game/mode-default-invariant.test.ts
git commit -m "test(word-spell): mode-default invariant covers every flip path"
```

---

## Phase 6 — Update existing tests

### Task 10: Rewrite `source-emits-playable.test.tsx`

Updated to assert the new contract: cumulative `graphemesAllowed` + `phonemesRequired`, plus the regression case "only L4 sh".

**Files:**

- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`

- [ ] **Step 1: Replace the test**

Replace the contents of `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import {
  GRAPHEMES_BY_LEVEL,
  __resetChunkCacheForTests,
  filterWords,
} from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

afterEach(() => {
  __resetChunkCacheForTests();
});

const Harness = ({
  initial,
  onConfigRef,
}: {
  initial: LevelGraphemeUnit[];
  onConfigRef: (cfg: Record<string, unknown>) => void;
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: initial,
    region: 'aus',
    inputMethod: 'drag',
  });
  onConfigRef(config);
  return (
    <WordSpellSimpleConfigForm
      config={config}
      onChange={(next) => {
        setConfig(next);
        onConfigRef(next);
      }}
    />
  );
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('Simple form emits playable source for every level', () => {
  for (const level of LEVELS) {
    it(`level ${level}: clicking its header produces ≥ 1 hit`, async () => {
      const user = userEvent.setup();
      let captured: Record<string, unknown> = {};
      render(
        <Harness
          initial={L1}
          onConfigRef={(c) => {
            captured = c;
          }}
        />,
      );

      if (level !== 1) {
        await user.click(
          screen.getByRole('button', {
            name: new RegExp(`Level ${level}`),
          }),
        );
      }

      const simple = captured as {
        configMode: 'simple';
        selectedUnits: LevelGraphemeUnit[];
        region: 'aus';
        inputMethod: 'drag';
      };
      const resolved = resolveSimpleConfig(simple);
      const result = await filterWords(resolved.source!.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }
});

describe('Simple form supports single-chip selections (cumulative graphemes regression)', () => {
  it('L4 + only sh → ≥ 4 hits (ship/shop/shed/fish/dish/...)', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> = {};
    render(
      <Harness
        initial={[]}
        onConfigRef={(c) => {
          captured = c;
        }}
      />,
    );

    const shChip = await screen.findByRole('button', {
      name: /^sh \/ʃ\//i,
    });
    await user.click(shChip);

    const simple = captured as {
      configMode: 'simple';
      selectedUnits: LevelGraphemeUnit[];
      region: 'aus';
      inputMethod: 'drag';
    };
    expect(simple.selectedUnits).toEqual([{ g: 'sh', p: 'ʃ' }]);

    const resolved = resolveSimpleConfig(simple);
    expect(resolved.source!.filter.phonemesRequired).toEqual(['ʃ']);

    const result = await filterWords(resolved.source!.filter);
    expect(result.hits.length).toBeGreaterThanOrEqual(4);
    expect(result.hits.some((h) => h.word === 'ship')).toBe(true);
  });

  it('L3 review (all L3 chips) drops easy L1/L2 words', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> = {};
    render(
      <Harness
        initial={[]}
        onConfigRef={(c) => {
          captured = c;
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Level 3/i }));

    const simple = captured as {
      configMode: 'simple';
      selectedUnits: LevelGraphemeUnit[];
      region: 'aus';
      inputMethod: 'drag';
    };
    const resolved = resolveSimpleConfig(simple);
    const result = await filterWords(resolved.source!.filter);

    // Words that don't use any L3 phoneme should NOT be in the result
    expect(result.hits.some((h) => h.word === 'sit')).toBe(false);
    expect(result.hits.some((h) => h.word === 'mad')).toBe(false);
    // Words that do use an L3 phoneme should be in the result
    expect(result.hits.some((h) => h.word === 'bat')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx
```

Expected: 8 + 2 = 10 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx
git commit -m "test(word-spell): assert cumulative + Y filter contract from form

The 8 per-level cases now drive the new chip UI (clickable headers
instead of native checkboxes). Two new regression cases:

- L4 + only sh emits a single chip and produces ≥ 4 hits, proving the
  cumulative-graphemes cascade works for single-chip selections.
- L3 review (all L3 chips) drops easy L1/L2 words like sit/mad while
  keeping L3-flavored words like bat."
```

---

### Task 11: Extend `curriculum-invariant.test.ts`

Add Y-filter invariants alongside the existing cumulative ones.

**Files:**

- Modify: `src/data/words/curriculum-invariant.test.ts`

- [ ] **Step 1: Append new test blocks**

Append to `src/data/words/curriculum-invariant.test.ts`:

```ts
const cumulativeGraphemes = (maxLevel: number) => {
  const out: { g: string; p: string }[] = [];
  for (let lvl = 1; lvl <= maxLevel; lvl++) {
    out.push(...(GRAPHEMES_BY_LEVEL[lvl] ?? []));
  }
  return out;
};

describe('curriculum invariant: cumulative graphemes + single-phoneme Y filter yields ≥ 1 hit per level', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      const units = GRAPHEMES_BY_LEVEL[level] ?? [];
      for (const unit of units) {
        it(`${region} L${level} chip ${unit.g} /${unit.p}/ → ≥ 1 hit`, async () => {
          const result = await filterWords({
            region,
            graphemesAllowed: [
              ...new Set(cumulativeGraphemes(level).map((u) => u.g)),
            ],
            phonemesRequired: [unit.p],
          });
          expect(
            result.hits.length,
            `Single-chip selection ${unit.g} /${unit.p}/ at L${level} should produce at least one playable word`,
          ).toBeGreaterThanOrEqual(1);
        });
      }
    }
  }
});

describe('curriculum invariant: cumulative + Y filter excludes pure-prior-level words', () => {
  for (const region of ALL_REGIONS) {
    for (const level of [3, 4, 5, 6, 7, 8] as const) {
      it(`${region} L${level} all chips → result excludes pure-L1-only words`, async () => {
        const phonemes = (GRAPHEMES_BY_LEVEL[level] ?? []).map(
          (u) => u.p,
        );
        const result = await filterWords({
          region,
          graphemesAllowed: [
            ...new Set(cumulativeGraphemes(level).map((u) => u.g)),
          ],
          phonemesRequired: [...new Set(phonemes)],
        });
        const l1Phonemes = new Set(
          (GRAPHEMES_BY_LEVEL[1] ?? []).map((u) => u.p),
        );
        for (const hit of result.hits) {
          const wordPhonemes = (hit.graphemes ?? []).map((g) => g.p);
          const usesAnyLNphoneme = wordPhonemes.some((p) =>
            phonemes.includes(p),
          );
          const usesOnlyL1 = wordPhonemes.every((p) =>
            l1Phonemes.has(p),
          );
          expect(
            usesAnyLNphoneme || !usesOnlyL1,
            `Word "${hit.word}" should either use an L${level} phoneme or have a non-L1 phoneme`,
          ).toBe(true);
        }
      });
    }
  }
});
```

- [ ] **Step 2: Run tests**

```bash
yarn vitest run src/data/words/curriculum-invariant.test.ts
```

Expected: all parameterised tests pass. The first new block adds ~70 cases (4 regions × ~17 chips total per region × 1 assertion); the second adds 24 (4 × 6).

If any specific chip fails, that's a curriculum-data gap — escalate before moving on.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/curriculum-invariant.test.ts
git commit -m "test(words): curriculum invariants for cumulative + Y filter

Adds two parameterised invariants:

1. Every single-chip selection at any (region, level) yields ≥ 1 hit
   with cumulative graphemesAllowed + single-phoneme phonemesRequired.
   Proves the cumulative-graphemes cascade keeps narrow selections
   playable.

2. For levels 3–8, picking all L_N chips excludes any word that uses
   only L1 phonemes. Proves the Y filter drops 'easy' pure-prior-level
   words automatically when the user is focused on a higher level."
```

---

## Phase 7 — Cleanup

### Task 12: Remove deprecated `triStateForLevel`

After all callers are off it.

**Files:**

- Modify: `src/games/word-spell/level-unit-selection.ts`
- Modify: `src/games/word-spell/level-unit-selection.test.ts`

- [ ] **Step 1: Verify no callers remain**

```bash
grep -rn "triStateForLevel" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "level-unit-selection.ts"
```

Expected: no output. If any non-test caller still imports it, fix that caller first (it should be migrated to `headerStateForLevel` from Task 6).

- [ ] **Step 2: Remove `triStateForLevel` and its `Tri` type**

In `src/games/word-spell/level-unit-selection.ts`, delete lines 4 (`export type Tri = ...`) and 14-26 (the `triStateForLevel` function). Leave `unitsAt`, `sameUnit`, `toggleLevel`, `toggleUnit`, `defaultSelection`, `unitLevel`, `headerStateForLevel`, `LevelHeaderState` intact.

- [ ] **Step 3: Remove the `triStateForLevel` block from the test**

In `src/games/word-spell/level-unit-selection.test.ts`, delete the `describe('triStateForLevel', ...)` block and remove the `triStateForLevel` and `Tri` imports.

- [ ] **Step 4: Run typecheck and tests**

```bash
yarn typecheck && yarn vitest run src/games/word-spell/
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/level-unit-selection.ts src/games/word-spell/level-unit-selection.test.ts
git commit -m "chore(word-spell): remove deprecated triStateForLevel

Replaced by headerStateForLevel which returns the richer 4-state
descriptor needed by the new chip-row header."
```

---

## Phase 8 — Manual QA and Storybook

### Task 13: Storybook baseline review and dev-server smoke test

This task does not produce an autocheckable artefact — it's a manual gate before opening the PR for the next round of review.

**Files:**

- Storybook baselines under `stories/` and `tests/visual/` (only if VR detects diffs)

- [ ] **Step 1: Run the visual regression suite**

If Docker is running:

```bash
cd /Users/leocaseiro/.worktrees/base-skill/bs-4
yarn test:vr 2>&1 | tail -30
```

If Docker is not available, skip with a note (`SKIP_VR=1` in PR description).

Expected affected stories (likely diffs):

- `WordSpellSimpleConfigForm` (chip row headers changed)
- `AdvancedConfigModal` with WordSpell header (variant prop dropped, preview bar added)
- Any WordSpell game story that snapshots the configurable side panel

- [ ] **Step 2: Review the diff PNGs**

```bash
ls tests/visual/__diff_output__/ 2>/dev/null
```

For each diff, read the expected/actual/diff PNGs (Read tool can render PNGs). If the visual change matches the spec (group-click headers, preview bar, no native checkboxes), update the baseline:

```bash
yarn test:vr:update
```

If a diff looks wrong, do NOT update — it's a regression to fix first.

- [ ] **Step 3: Smoke-test in dev server**

```bash
yarn dev
```

Open the URL printed in the terminal. Walk through these scenarios manually:

| Scenario                                    | Expected                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Open WordSpell with no saved config         | Lands on recall mode; preview shows L1 words (`sit, sat, tap, pin, ...`)    |
| Click "Level 4" header                      | All L4 chips become on; preview updates to include L4 sounds                |
| Untick all L4 chips except `sh`             | Preview shows `ship, shop, shed, fish, dish, ...`; no `chip, this, quack`   |
| Untick all chips                            | Preview shows "Pick at least one sound to play."                            |
| Tick `d, g, b, v` across L2/L3 only         | Preview shows `bad, big, dog, van, vet, bug, dad, ...`; no `sit, sat, mad`  |
| Open Advanced modal, switch mode → picture  | Picker hides; emoji rounds appear; switching back to recall restores picker |
| Save Custom Game with simple config, reload | Picker re-renders with the same chip selection; words match preview         |

- [ ] **Step 4: Commit any baseline updates**

```bash
git add tests/visual/ stories/
git commit -m "test(visual): update baselines for WordSpell picker rewrite

Affected stories: WordSpellSimpleConfigForm, AdvancedConfigModal with
WordSpell header. Changes: clickable level headers replace native
checkboxes; WordPreviewBar renders below the chip rows."
```

(Skip if no baseline updates were needed.)

- [ ] **Step 5: Push the branch**

```bash
git push origin feat/issue-216
```

This puts every commit from Phases 1-8 onto the existing PR #219.

---

## Final review checklist (before requesting human review of the PR)

- [ ] All tests green: `yarn test 2>&1 | tail -5`
- [ ] TypeScript clean: `yarn typecheck`
- [ ] Lint clean: `yarn lint`
- [ ] Pre-push gate green: `git push origin feat/issue-216` (already runs the gate)
- [ ] PR #219 description updated to reference the new spec/plan and the supersede markers on the prior ones
- [ ] Manual smoke test scenarios from Task 13 confirmed in dev server
- [ ] VR baselines reviewed and updated where appropriate

---

## Spec coverage map

| Spec section                         | Implemented in                                         |
| ------------------------------------ | ------------------------------------------------------ |
| Selection model (`selectedUnits`)    | Task 3 (resolve), unchanged data shape                 |
| Filter contract (cumulative + Y)     | Task 3                                                 |
| Group-click level header             | Task 6                                                 |
| Same component for Simple + Advanced | Tasks 6 + 7                                            |
| Mode-driven default split            | Task 8                                                 |
| Mode invariant enforcement           | Tasks 8 + 9                                            |
| Live word preview bar                | Tasks 4 + 5 + 6 (wiring)                               |
| Edge case: targeted struggle drill   | Task 10 (via single-chip case) and Task 13 (manual QA) |
| Empty-selection validation           | Task 6 + Task 5 (preview bar copy)                     |
| `triStateForLevel` removal           | Task 12                                                |
| Curriculum invariant extension       | Task 11                                                |
| Storybook baseline updates           | Task 13                                                |
| IndexedDB migration                  | Already in PR #219 (unchanged from prior spec)         |
