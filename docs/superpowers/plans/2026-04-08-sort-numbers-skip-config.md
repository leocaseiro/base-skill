# SortNumbers Skip & Distractor Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boolean `allowSkips` field on `SortNumbersConfig` with structured `SkipConfig` and `DistractorConfig` discriminated unions, update round generation, and add new config form field types to the UI.

**Architecture:** The change is layered: types first, then pure logic (round generation), then integration (component + route), then UI renderer. Each layer is independently testable. The form renderer gains two new field types (`nested-select`, `nested-select-or-number`) plus a `visibleWhen` conditional display mechanism.

**Tech Stack:** TypeScript discriminated unions, Vitest unit tests, React (const components), Tailwind CSS, Storybook 8, TanStack Router, `@testing-library/react`

---

## File Map

| File                                                         | Action | Responsibility                                                                                      |
| ------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------- |
| `src/lib/config-fields.ts`                                   | Modify | Add `nested-select`, `nested-select-or-number` variants; add optional `visibleWhen` to all variants |
| `src/games/sort-numbers/types.ts`                            | Modify | Add `SkipConfig`, `DistractorConfig`; update `SortNumbersConfig`; update `sortNumbersConfigFields`  |
| `src/games/sort-numbers/build-sort-round.ts`                 | Modify | Update `GenerateOptions`, `generateSortRounds`; add `buildDistractorPool`; extend `buildSortRound`  |
| `src/games/sort-numbers/build-sort-round.test.ts`            | Modify | Update existing tests; add tests for new modes and `buildDistractorPool`                            |
| `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`         | Modify | Pass distractor config to `buildSortRound` when `tileBankMode === 'distractors'`                    |
| `src/routes/$locale/_app/game/$gameId.tsx`                   | Modify | Update default config, resolve function, add migration from `allowSkips: boolean`                   |
| `src/components/ConfigFormFields.tsx`                        | Modify | Add `nested-select`, `nested-select-or-number` renderers; add `visibleWhen` gate                    |
| `src/components/ConfigFormFields.test.tsx`                   | Modify | Add tests for new renderers and `visibleWhen`                                                       |
| `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx` | Create | Stories for `mode: 'by'` and each distractor source                                                 |
| `src/components/ConfigFormFields.stories.tsx`                | Modify | Add story showcasing `nested-select` and `nested-select-or-number`                                  |

---

## Task 1: Extend `ConfigField` type with new variants and `visibleWhen`

**Files:**

- Modify: `src/lib/config-fields.ts`

This is purely additive — no existing code breaks.

- [ ] **Step 1: Replace the file content**

```ts
// src/lib/config-fields.ts
export type VisibleWhen = {
  key: string;
  subKey?: string;
  value: unknown;
};

export type ConfigField =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'number';
      key: string;
      label: string;
      min: number;
      max: number;
      visibleWhen?: VisibleWhen;
    }
  | {
      /** A number field that reads/writes from a nested object: config[key][subKey] */
      type: 'nested-number';
      key: string;
      subKey: string;
      label: string;
      min: number;
      max: number;
      visibleWhen?: VisibleWhen;
    }
  | {
      /** A select that reads/writes from a nested object: config[key][subKey] */
      type: 'nested-select';
      key: string;
      subKey: string;
      label: string;
      options: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
  | {
      /**
       * A hybrid field: a type-selector ('all' | 'number') plus a number input
       * when the current value is numeric. Reads/writes config[key][subKey].
       */
      type: 'nested-select-or-number';
      key: string;
      subKey: string;
      label: string;
      min: number;
      max: number;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'checkbox';
      key: string;
      label: string;
      visibleWhen?: VisibleWhen;
    };
```

- [ ] **Step 2: Run typecheck to confirm no regressions**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn typecheck`

Expected: no errors (change is additive)

- [ ] **Step 3: Commit**

```bash
cd worktrees/feat/sort-numbers-skip-config
git add src/lib/config-fields.ts
git commit -m "feat(config-fields): add nested-select, nested-select-or-number variants with visibleWhen"
```

---

## Task 2: Update `SortNumbersConfig` types

**Files:**

- Modify: `src/games/sort-numbers/types.ts`

> **Note:** After this task TypeScript will report errors in `build-sort-round.ts` and
> `src/routes/$locale/_app/game/$gameId.tsx` because they still use `allowSkips`. Do not
> commit until Tasks 3 and 4 are also complete.

- [ ] **Step 1: Replace the file content**

```ts
// src/games/sort-numbers/types.ts
import type { AnswerGameConfig } from '@/components/answer-game/types';
import type { ConfigField } from '@/lib/config-fields';

export type SkipConfig =
  | { mode: 'random' }
  | { mode: 'consecutive' }
  | { mode: 'by'; step: number; start: 'range-min' | 'random' };

export type DistractorConfig =
  | { source: 'random'; count: number }
  | { source: 'gaps-only'; count: number | 'all' }
  | { source: 'full-range'; count: number | 'all' };

export interface SortNumbersConfig extends AnswerGameConfig {
  component: 'SortNumbers';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  /** How many numbers to sort per round */
  quantity: number;
  skip: SkipConfig;
  distractors: DistractorConfig;
  rounds: SortNumbersRound[];
}

export interface SortNumbersRound {
  sequence: number[];
}

export const sortNumbersConfigFields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
      { value: 'both', label: 'both' },
    ],
  },
  {
    type: 'select',
    key: 'wrongTileBehavior',
    label: 'Wrong tile behaviour',
    options: [
      { value: 'reject', label: 'reject' },
      { value: 'lock-manual', label: 'lock-manual' },
      { value: 'lock-auto-eject', label: 'lock-auto-eject' },
    ],
  },
  {
    type: 'select',
    key: 'tileBankMode',
    label: 'Tile bank mode',
    options: [
      { value: 'exact', label: 'exact' },
      { value: 'distractors', label: 'distractors' },
    ],
  },
  {
    type: 'number',
    key: 'totalRounds',
    label: 'Total rounds',
    min: 1,
    max: 30,
  },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  {
    type: 'select',
    key: 'direction',
    label: 'Direction',
    options: [
      { value: 'ascending', label: 'ascending' },
      { value: 'descending', label: 'descending' },
    ],
  },
  {
    type: 'number',
    key: 'quantity',
    label: 'Quantity',
    min: 2,
    max: 8,
  },
  {
    type: 'nested-number',
    key: 'range',
    subKey: 'min',
    label: 'Range min',
    min: 1,
    max: 999,
  },
  {
    type: 'nested-number',
    key: 'range',
    subKey: 'max',
    label: 'Range max',
    min: 1,
    max: 999,
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'mode',
    label: 'Skip mode',
    options: [
      { value: 'random', label: 'random' },
      { value: 'consecutive', label: 'consecutive' },
      { value: 'by', label: 'by' },
    ],
  },
  {
    type: 'nested-number',
    key: 'skip',
    subKey: 'step',
    label: 'Skip step',
    min: 2,
    max: 100,
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'start',
    label: 'Skip start',
    options: [
      { value: 'range-min', label: 'range-min' },
      { value: 'random', label: 'random' },
    ],
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'distractors',
    subKey: 'source',
    label: 'Distractor source',
    options: [
      { value: 'random', label: 'random' },
      { value: 'gaps-only', label: 'gaps-only' },
      { value: 'full-range', label: 'full-range' },
    ],
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  {
    type: 'nested-select-or-number',
    key: 'distractors',
    subKey: 'count',
    label: 'Distractor count',
    min: 1,
    max: 20,
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
```

---

## Task 3: Update `build-sort-round.ts` (TDD)

**Files:**

- Modify: `src/games/sort-numbers/build-sort-round.test.ts`
- Modify: `src/games/sort-numbers/build-sort-round.ts`

> Still part of the Tasks 2–4 commit group — do not commit until Task 4 is also complete.

- [ ] **Step 1: Add failing tests to `build-sort-round.test.ts`**

Replace the entire file with:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildDistractorPool,
  buildSortRound,
  generateSortRounds,
} from './build-sort-round';

describe('buildSortRound', () => {
  it('creates zones in ascending order for ascending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'ascending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['1', '2', '3']);
  });

  it('creates zones in descending order for descending direction', () => {
    const { zones } = buildSortRound([3, 1, 2], 'descending');
    expect(zones.map((z) => z.expectedValue)).toEqual(['3', '2', '1']);
  });

  it('creates tiles with all sequence numbers', () => {
    const { tiles } = buildSortRound([1, 2, 3], 'ascending');
    expect(tiles.map((t) => t.value).toSorted()).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(tiles).toHaveLength(3);
  });

  it('each tile has a unique id', () => {
    const { tiles } = buildSortRound([1, 2, 3], 'ascending');
    const ids = tiles.map((t) => t.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('appends distractor tiles when distractorConfig is provided', () => {
    const { tiles } = buildSortRound([2, 4, 6], 'ascending', {
      config: { source: 'full-range', count: 2 },
      range: { min: 1, max: 10 },
    });
    // 3 sequence tiles + 2 distractor tiles
    expect(tiles).toHaveLength(5);
  });

  it('distractor tiles are not part of the zones expectedValue set', () => {
    const { tiles, zones } = buildSortRound([2, 4, 6], 'ascending', {
      config: { source: 'full-range', count: 2 },
      range: { min: 1, max: 10 },
    });
    const expectedValues = new Set(zones.map((z) => z.expectedValue));
    const extraTiles = tiles.filter(
      (t) => !expectedValues.has(t.value),
    );
    expect(extraTiles).toHaveLength(2);
  });
});

describe('generateSortRounds', () => {
  it('mode consecutive generates consecutive sequences', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 10 },
      quantity: 3,
      skip: { mode: 'consecutive' },
      totalRounds: 2,
    });
    expect(rounds).toHaveLength(2);
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(3);
      const diffs = round.sequence
        .slice(1)
        .map((n, i) => n - (round.sequence[i] ?? 0));
      expect(diffs.every((d) => d === 1)).toBe(true);
    }
  });

  it('mode random generates sequences of correct length within range', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 4,
      skip: { mode: 'random' },
      totalRounds: 3,
    });
    expect(rounds).toHaveLength(3);
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(4);
      for (const n of round.sequence) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(20);
      }
    }
  });

  it('mode random all numbers in a round are unique', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 5,
      skip: { mode: 'random' },
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(new Set(seq).size).toBe(seq.length);
  });

  it('mode by with start range-min generates fixed-step sequence from range.min', () => {
    const rounds = generateSortRounds({
      range: { min: 2, max: 20 },
      quantity: 4,
      skip: { mode: 'by', step: 3, start: 'range-min' },
      totalRounds: 1,
    });
    expect(rounds[0]?.sequence).toEqual([2, 5, 8, 11]);
  });

  it('mode by with start random generates valid fixed-step sequence', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 20 },
      quantity: 3,
      skip: { mode: 'by', step: 5, start: 'random' },
      totalRounds: 5,
    });
    for (const round of rounds) {
      expect(round.sequence).toHaveLength(3);
      const diffs = round.sequence
        .slice(1)
        .map((n, i) => n - (round.sequence[i] ?? 0));
      expect(diffs.every((d) => d === 5)).toBe(true);
      expect(round.sequence[0]).toBeGreaterThanOrEqual(1);
      expect(
        round.sequence[round.sequence.length - 1],
      ).toBeLessThanOrEqual(20);
    }
  });

  it('mode by falls back to consecutive when step is too large', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 5 },
      quantity: 3,
      skip: { mode: 'by', step: 10, start: 'range-min' },
      totalRounds: 1,
    });
    // step * (quantity - 1) = 20 > range.max - range.min = 4 → fallback to consecutive
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(3);
    const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
    expect(diffs.every((d) => d === 1)).toBe(true);
  });

  it('mode consecutive handles quantity larger than range size', () => {
    const rounds = generateSortRounds({
      range: { min: 1, max: 3 },
      quantity: 5,
      skip: { mode: 'consecutive' },
      totalRounds: 1,
    });
    const seq = rounds[0]?.sequence ?? [];
    expect(seq).toHaveLength(3); // clamped to range size
    for (const n of seq) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });
});

describe('buildDistractorPool', () => {
  it('source random returns count numbers not in sequence', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 10 },
      { source: 'random', count: 3 },
    );
    expect(pool).toHaveLength(3);
    for (const n of pool) {
      expect([2, 4, 6]).not.toContain(n);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('source gaps-only count all returns numbers between consecutive sequence values', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 8 },
      { source: 'gaps-only', count: 'all' },
    );
    // Between 2 and 4: 3. Between 4 and 6: 5.
    expect(pool.sort((a, b) => a - b)).toEqual([3, 5]);
  });

  it('source gaps-only count number returns that many from gaps', () => {
    const pool = buildDistractorPool(
      [2, 5, 8],
      { min: 1, max: 10 },
      { source: 'gaps-only', count: 2 },
    );
    // Gaps: between 2 and 5: 3,4. Between 5 and 8: 6,7.
    expect(pool).toHaveLength(2);
    for (const n of pool) {
      expect([3, 4, 6, 7]).toContain(n);
    }
  });

  it('source full-range count all returns all non-sequence numbers in range', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 8 },
      { source: 'full-range', count: 'all' },
    );
    expect(pool.sort((a, b) => a - b)).toEqual([1, 3, 5, 7, 8]);
  });

  it('source full-range count number returns that many', () => {
    const pool = buildDistractorPool(
      [2, 4, 6],
      { min: 1, max: 10 },
      { source: 'full-range', count: 3 },
    );
    expect(pool).toHaveLength(3);
    for (const n of pool) {
      expect([2, 4, 6]).not.toContain(n);
    }
  });

  it('returns full pool when count exceeds pool size', () => {
    const pool = buildDistractorPool(
      [1, 2, 3, 4, 5],
      { min: 1, max: 6 },
      { source: 'random', count: 10 },
    );
    // Only 1 number in range not in sequence: 6
    expect(pool).toEqual([6]);
  });
});
```

- [ ] **Step 2: Run tests to see them fail**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test --reporter=verbose src/games/sort-numbers/build-sort-round.test.ts`

Expected: test file fails to compile because `GenerateOptions` still has `allowSkips`

- [ ] **Step 3: Replace `build-sort-round.ts`**

```ts
// src/games/sort-numbers/build-sort-round.ts
import { nanoid } from 'nanoid';
import type {
  DistractorConfig,
  SkipConfig,
  SortNumbersRound,
} from './types';
import type {
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';

export function buildDistractorPool(
  sequence: number[],
  range: { min: number; max: number },
  config: DistractorConfig,
): number[] {
  const seqSet = new Set(sequence);

  let pool: number[];

  if (config.source === 'gaps-only') {
    pool = [];
    const sorted = [...sequence].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      for (
        let n = (sorted[i] ?? 0) + 1;
        n < (sorted[i + 1] ?? 0);
        n++
      ) {
        pool.push(n);
      }
    }
  } else {
    // 'random' and 'full-range' both use all range numbers not in sequence
    pool = Array.from(
      { length: range.max - range.min + 1 },
      (_, i) => range.min + i,
    ).filter((n) => !seqSet.has(n));
  }

  if (config.count === 'all') return pool;

  // Pick `count` randomly from pool (Fisher-Yates partial)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, Math.min(config.count, shuffled.length));
}

export function buildSortRound(
  numbers: number[],
  direction: 'ascending' | 'descending',
  distractors?: {
    config: DistractorConfig;
    range: { min: number; max: number };
  },
): { tiles: TileItem[]; zones: AnswerZone[] } {
  const sorted = numbers.toSorted((a, b) =>
    direction === 'ascending' ? a - b : b - a,
  );

  const zones: AnswerZone[] = sorted.map((n, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: String(n),
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));

  const allNumbers = distractors
    ? [
        ...numbers,
        ...buildDistractorPool(
          numbers,
          distractors.range,
          distractors.config,
        ),
      ]
    : [...numbers];

  // Shuffle tiles (Fisher-Yates)
  for (let i = allNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allNumbers[i], allNumbers[j]] = [allNumbers[j]!, allNumbers[i]!];
  }

  const tiles: TileItem[] = allNumbers.map((n) => ({
    id: nanoid(),
    label: String(n),
    value: String(n),
  }));

  return { tiles, zones };
}

function generateConsecutiveRound(
  range: { min: number; max: number },
  quantity: number,
): SortNumbersRound {
  const rangeSize = range.max - range.min + 1;
  if (quantity > rangeSize) {
    return {
      sequence: Array.from(
        { length: rangeSize },
        (_, i) => range.min + i,
      ),
    };
  }
  const maxStart = range.max - quantity + 1;
  const start =
    Math.floor(Math.random() * (maxStart - range.min + 1)) + range.min;
  return {
    sequence: Array.from({ length: quantity }, (_, i) => start + i),
  };
}

interface GenerateOptions {
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  totalRounds: number;
}

export function generateSortRounds(
  options: GenerateOptions,
): SortNumbersRound[] {
  const { range, quantity, skip, totalRounds } = options;

  return Array.from({ length: totalRounds }, () => {
    if (skip.mode === 'random') {
      const pool = Array.from(
        { length: range.max - range.min + 1 },
        (_, i) => range.min + i,
      );
      const available = [...pool];
      const picked: number[] = [];
      for (let i = 0; i < quantity && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        picked.push(available[idx]!);
        available.splice(idx, 1);
      }
      return { sequence: picked };
    }

    if (skip.mode === 'by') {
      const { step, start } = skip;
      const maxPossibleStart = range.max - (quantity - 1) * step;

      if (maxPossibleStart < range.min) {
        // No valid starting point — fall back to consecutive
        console.warn(
          `generateSortRounds: mode 'by' step=${step} quantity=${quantity} exceeds range [${range.min},${range.max}]; falling back to consecutive`,
        );
        return generateConsecutiveRound(range, quantity);
      }

      if (start === 'range-min') {
        return {
          sequence: Array.from(
            { length: quantity },
            (_, i) => range.min + i * step,
          ),
        };
      }

      // start === 'random': pick a random valid start
      const validStarts = Array.from(
        { length: maxPossibleStart - range.min + 1 },
        (_, i) => range.min + i,
      );
      const picked =
        validStarts[Math.floor(Math.random() * validStarts.length)] ??
        range.min;
      return {
        sequence: Array.from(
          { length: quantity },
          (_, i) => picked + i * step,
        ),
      };
    }

    // mode === 'consecutive'
    return generateConsecutiveRound(range, quantity);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test --reporter=verbose src/games/sort-numbers/build-sort-round.test.ts`

Expected: all tests pass

---

## Task 4: Fix callers of `generateSortRounds` and `buildSortRound`

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

After these changes, TypeScript should be clean. Then commit Tasks 2–4 together.

- [ ] **Step 1: Update `SortNumbers.tsx` — pass distractor config to `buildSortRound`**

In `SortNumbersSession` (around line 95), update the `buildSortRound` call inside the effect:

```ts
const distractor =
  sortNumbersConfig.tileBankMode === 'distractors'
    ? {
        config: sortNumbersConfig.distractors,
        range: sortNumbersConfig.range,
      }
    : undefined;

const { tiles: nextTiles, zones: nextZones } = buildSortRound(
  nextRound.sequence,
  sortNumbersConfig.direction,
  distractor,
);
```

In `SortNumbers` (around line 183), update the `buildSortRound` call inside `useMemo`:

```ts
const distractor =
  config.tileBankMode === 'distractors'
    ? { config: config.distractors, range: config.range }
    : undefined;
return buildSortRound(round0.sequence, config.direction, distractor);
```

- [ ] **Step 2: Update `$gameId.tsx` — `makeDefaultSortNumbersConfig`**

Replace the `makeDefaultSortNumbersConfig` function (around line 141):

```ts
const makeDefaultSortNumbersConfig = (): SortNumbersConfig => ({
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 8,
  roundsInOrder: false,
  ttsEnabled: true,
  direction: 'ascending',
  range: { min: 11, max: 99 },
  quantity: 6,
  skip: { mode: 'random' },
  distractors: { source: 'random', count: 2 },
  rounds: generateSortRounds({
    range: { min: 11, max: 99 },
    quantity: 6,
    skip: { mode: 'random' },
    totalRounds: 8,
  }),
});
```

- [ ] **Step 3: Update `$gameId.tsx` — `resolveSortNumbersConfig` with migration**

Replace the `resolveSortNumbersConfig` function (around line 215):

```ts
const resolveSortNumbersConfig = (
  saved: Record<string, unknown> | null,
): SortNumbersConfig => {
  const base = makeDefaultSortNumbersConfig();
  if (!saved || saved.component !== 'SortNumbers') return base;

  // Migrate legacy allowSkips: boolean → skip: SkipConfig
  let migratedSaved = saved;
  if (!saved.skip && typeof saved.allowSkips === 'boolean') {
    migratedSaved = {
      ...saved,
      skip: saved.allowSkips
        ? { mode: 'random' }
        : { mode: 'consecutive' },
    };
  }

  const merged: SortNumbersConfig = {
    ...base,
    ...(migratedSaved as Partial<SortNumbersConfig>),
    gameId: 'sort-numbers',
    component: 'SortNumbers',
  };

  const tr = Math.max(1, merged.totalRounds);
  merged.totalRounds = tr;

  const roundsStale =
    Array.isArray(merged.rounds) &&
    merged.rounds.some(
      (r) =>
        r.sequence.length !== merged.quantity ||
        r.sequence.some(
          (v) => v < merged.range.min || v > merged.range.max,
        ),
    );

  if (
    !Array.isArray(merged.rounds) ||
    merged.rounds.length === 0 ||
    merged.rounds.length !== tr ||
    roundsStale
  ) {
    merged.rounds = generateSortRounds({
      range: merged.range,
      quantity: merged.quantity,
      skip: merged.skip,
      totalRounds: tr,
    });
  }

  return merged;
};
```

- [ ] **Step 4: Run typecheck**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn typecheck`

Expected: no errors

- [ ] **Step 5: Run all unit tests**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test`

Expected: all tests pass

- [ ] **Step 6: Commit Tasks 2–4 together**

```bash
cd worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/types.ts \
        src/games/sort-numbers/build-sort-round.ts \
        src/games/sort-numbers/build-sort-round.test.ts \
        src/games/sort-numbers/SortNumbers/SortNumbers.tsx \
        src/routes/\$locale/_app/game/\$gameId.tsx
git commit -m "feat(sort-numbers): replace allowSkips with SkipConfig + DistractorConfig"
```

---

## Task 5: Add `nested-select`, `nested-select-or-number`, and `visibleWhen` to `ConfigFormFields` (TDD)

**Files:**

- Modify: `src/components/ConfigFormFields.test.tsx`
- Modify: `src/components/ConfigFormFields.tsx`

- [ ] **Step 1: Add failing tests to `ConfigFormFields.test.tsx`**

Append these `describe` blocks after the existing tests (keep all existing tests intact):

```tsx
describe('nested-select fields', () => {
  it('renders a select for nested-select fields', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'skip',
        subKey: 'mode',
        label: 'Skip mode',
        options: [
          { value: 'random', label: 'random' },
          { value: 'consecutive', label: 'consecutive' },
          { value: 'by', label: 'by' },
        ],
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ skip: { mode: 'random' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip mode' }),
    ).toHaveValue('random');
  });

  it('calls onChange preserving other nested keys when nested-select changes', async () => {
    const onChange = vi.fn();
    const fields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'skip',
        subKey: 'mode',
        label: 'Skip mode',
        options: [
          { value: 'random', label: 'random' },
          { value: 'by', label: 'by' },
        ],
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ skip: { mode: 'random', step: 3 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip mode' }),
      'by',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 3 },
    });
  });
});

describe('nested-select-or-number fields', () => {
  it('renders type selector and number input when value is numeric', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ distractors: { source: 'random', count: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
    ).toHaveValue('number');
    expect(
      screen.getByRole('spinbutton', {
        name: 'Distractor count value',
      }),
    ).toHaveValue(3);
  });

  it('hides number input and shows all in type selector when value is all', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ distractors: { source: 'gaps-only', count: 'all' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
    ).toHaveValue('all');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('switches to all when type selector changes to all', async () => {
    const onChange = vi.fn();
    const fields: ConfigField[] = [
      {
        type: 'nested-select-or-number',
        key: 'distractors',
        subKey: 'count',
        label: 'Distractor count',
        min: 1,
        max: 20,
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ distractors: { count: 3 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Distractor count type' }),
      'all',
    );
    expect(onChange).toHaveBeenCalledWith({
      distractors: { count: 'all' },
    });
  });
});

describe('visibleWhen', () => {
  it('hides a field when nested visibleWhen condition is not met', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-number',
        key: 'skip',
        subKey: 'step',
        label: 'Skip step',
        min: 2,
        max: 100,
        visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ skip: { mode: 'random', step: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByLabelText('Skip step'),
    ).not.toBeInTheDocument();
  });

  it('shows a field when nested visibleWhen condition is met', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-number',
        key: 'skip',
        subKey: 'step',
        label: 'Skip step',
        min: 2,
        max: 100,
        visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{ skip: { mode: 'by', step: 3 } }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Skip step')).toBeInTheDocument();
  });

  it('hides a field based on top-level key visibleWhen', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'distractors',
        subKey: 'source',
        label: 'Distractor source',
        options: [{ value: 'random', label: 'random' }],
        visibleWhen: { key: 'tileBankMode', value: 'distractors' },
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{
          tileBankMode: 'exact',
          distractors: { source: 'random' },
        }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('combobox', { name: 'Distractor source' }),
    ).not.toBeInTheDocument();
  });

  it('shows a field when top-level key visibleWhen condition is met', () => {
    const fields: ConfigField[] = [
      {
        type: 'nested-select',
        key: 'distractors',
        subKey: 'source',
        label: 'Distractor source',
        options: [{ value: 'random', label: 'random' }],
        visibleWhen: { key: 'tileBankMode', value: 'distractors' },
      },
    ];
    render(
      <ConfigFormFields
        fields={fields}
        config={{
          tileBankMode: 'distractors',
          distractors: { source: 'random' },
        }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Distractor source' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test --reporter=verbose src/components/ConfigFormFields.test.tsx`

Expected: new `describe` blocks fail with "Unable to find role"

- [ ] **Step 3: Replace `ConfigFormFields.tsx`**

```tsx
// src/components/ConfigFormFields.tsx
import type { ConfigField, VisibleWhen } from '@/lib/config-fields';
import type { JSX } from 'react';

const isFieldVisible = (
  field: ConfigField,
  config: Record<string, unknown>,
): boolean => {
  const vw: VisibleWhen | undefined =
    'visibleWhen' in field ? field.visibleWhen : undefined;
  if (!vw) return true;
  const { key, subKey, value } = vw;
  const configValue = subKey
    ? (config[key] as Record<string, unknown> | undefined)?.[subKey]
    : config[key];
  return configValue === value;
};

type ConfigFormFieldsProps = {
  fields: ConfigField[];
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const ConfigFormFields = ({
  fields,
  config,
  onChange,
}: ConfigFormFieldsProps): JSX.Element => (
  <div className="flex flex-col gap-3">
    {fields.map((field) => {
      if (!isFieldVisible(field, config)) return null;

      if (field.type === 'select') {
        return (
          <label
            key={field.key}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <select
              aria-label={field.label}
              value={String(config[field.key] ?? '')}
              onChange={(e) =>
                onChange({ ...config, [field.key]: e.target.value })
              }
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        );
      }

      if (field.type === 'nested-select') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        return (
          <label
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <select
              aria-label={field.label}
              value={String(nested?.[field.subKey] ?? '')}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: {
                    ...nested,
                    [field.subKey]: e.target.value,
                  },
                })
              }
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        );
      }

      if (field.type === 'nested-select-or-number') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        const currentValue = nested?.[field.subKey];
        const isAll = currentValue === 'all';
        return (
          <div
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            <span>{field.label}</span>
            <div className="flex gap-2">
              <select
                aria-label={`${field.label} type`}
                value={isAll ? 'all' : 'number'}
                onChange={(e) => {
                  const next =
                    e.target.value === 'all' ? 'all' : field.min;
                  onChange({
                    ...config,
                    [field.key]: { ...nested, [field.subKey]: next },
                  });
                }}
                className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="number">number</option>
                <option value="all">all</option>
              </select>
              {!isAll && (
                <input
                  type="number"
                  aria-label={`${field.label} value`}
                  value={Number(currentValue ?? field.min)}
                  min={field.min}
                  max={field.max}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      [field.key]: {
                        ...nested,
                        [field.subKey]: Number(e.target.value),
                      },
                    })
                  }
                  className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
                />
              )}
            </div>
          </div>
        );
      }

      if (field.type === 'nested-number') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        return (
          <label
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <input
              type="number"
              aria-label={field.label}
              value={Number(nested?.[field.subKey] ?? field.min)}
              min={field.min}
              max={field.max}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: {
                    ...nested,
                    [field.subKey]: Number(e.target.value),
                  },
                })
              }
              className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
        );
      }

      if (field.type === 'number') {
        return (
          <label
            key={field.key}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <input
              type="number"
              aria-label={field.label}
              value={Number(config[field.key] ?? field.min)}
              min={field.min}
              max={field.max}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: Number(e.target.value),
                })
              }
              className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
        );
      }

      // checkbox
      return (
        <label
          key={field.key}
          className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground"
        >
          <input
            type="checkbox"
            aria-label={field.label}
            checked={Boolean(config[field.key])}
            onChange={(e) =>
              onChange({ ...config, [field.key]: e.target.checked })
            }
            className="h-5 w-5 accent-primary"
          />
          {field.label}
        </label>
      );
    })}
  </div>
);
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test --reporter=verbose src/components/ConfigFormFields.test.tsx`

Expected: all tests pass (including original tests)

- [ ] **Step 5: Run typecheck**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn typecheck`

Expected: no errors

- [ ] **Step 6: Commit**

```bash
cd worktrees/feat/sort-numbers-skip-config
git add src/components/ConfigFormFields.tsx src/components/ConfigFormFields.test.tsx
git commit -m "feat(ConfigFormFields): add nested-select, nested-select-or-number, and visibleWhen support"
```

---

## Task 6: Stories

**Files:**

- Create: `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`
- Modify: `src/components/ConfigFormFields.stories.tsx`

- [ ] **Step 1: Create `SortNumbers.stories.tsx`**

```tsx
// src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
import { withDb } from '../../../../.storybook/decorators/withDb';
import { withRouter } from '../../../../.storybook/decorators/withRouter';
import { SortNumbers } from './SortNumbers';
import type { SortNumbersConfig } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const baseConfig: SortNumbersConfig = {
  gameId: 'sort-numbers',
  component: 'SortNumbers',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  tileBankMode: 'exact',
  totalRounds: 3,
  roundsInOrder: false,
  ttsEnabled: false,
  direction: 'ascending',
  range: { min: 2, max: 20 },
  quantity: 4,
  skip: { mode: 'consecutive' },
  distractors: { source: 'random', count: 2 },
  rounds: [
    { sequence: [3, 4, 5, 6] },
    { sequence: [7, 8, 9, 10] },
    { sequence: [11, 12, 13, 14] },
  ],
};

const meta: Meta<typeof SortNumbers> = {
  component: SortNumbers,
  tags: ['autodocs'],
  decorators: [withDb, withRouter],
  args: { config: baseConfig },
};
export default meta;

type Story = StoryObj<typeof SortNumbers>;

export const Consecutive: Story = {};

export const SkipByStepRangeMin: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'by', step: 3, start: 'range-min' },
      rounds: [
        { sequence: [2, 5, 8, 11] },
        { sequence: [2, 5, 8, 11] },
        { sequence: [2, 5, 8, 11] },
      ],
    },
  },
};

export const SkipRandom: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'random' },
      rounds: [
        { sequence: [2, 7, 12, 18] },
        { sequence: [3, 6, 11, 15] },
        { sequence: [4, 9, 14, 20] },
      ],
    },
  },
};

export const DistractorsRandom: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: { source: 'random', count: 3 },
    },
  },
};

export const DistractorsGapsOnly: Story = {
  args: {
    config: {
      ...baseConfig,
      skip: { mode: 'by', step: 2, start: 'range-min' },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 'all' },
      rounds: [
        { sequence: [2, 4, 6, 8] },
        { sequence: [2, 4, 6, 8] },
        { sequence: [2, 4, 6, 8] },
      ],
    },
  },
};

export const DistractorsFullRange: Story = {
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: { source: 'full-range', count: 4 },
    },
  },
};
```

- [ ] **Step 2: Update `ConfigFormFields.stories.tsx` — add a story with all new field types**

Add these exports after the existing `AllFieldTypesDark` story:

```tsx
const sortFields: ConfigField[] = [
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'mode',
    label: 'Skip mode',
    options: [
      { value: 'random', label: 'random' },
      { value: 'consecutive', label: 'consecutive' },
      { value: 'by', label: 'by' },
    ],
  },
  {
    type: 'nested-number',
    key: 'skip',
    subKey: 'step',
    label: 'Skip step',
    min: 2,
    max: 100,
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'nested-select',
    key: 'skip',
    subKey: 'start',
    label: 'Skip start',
    options: [
      { value: 'range-min', label: 'range-min' },
      { value: 'random', label: 'random' },
    ],
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
  {
    type: 'select',
    key: 'tileBankMode',
    label: 'Tile bank mode',
    options: [
      { value: 'exact', label: 'exact' },
      { value: 'distractors', label: 'distractors' },
    ],
  },
  {
    type: 'nested-select',
    key: 'distractors',
    subKey: 'source',
    label: 'Distractor source',
    options: [
      { value: 'random', label: 'random' },
      { value: 'gaps-only', label: 'gaps-only' },
      { value: 'full-range', label: 'full-range' },
    ],
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
  {
    type: 'nested-select-or-number',
    key: 'distractors',
    subKey: 'count',
    label: 'Distractor count',
    min: 1,
    max: 20,
    visibleWhen: { key: 'tileBankMode', value: 'distractors' },
  },
];

export const SortNumbersFieldsExact: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'random' },
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 2 },
    },
  },
};

export const SortNumbersFieldsByMode: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'by', step: 5, start: 'range-min' },
      tileBankMode: 'exact',
      distractors: { source: 'random', count: 2 },
    },
  },
};

export const SortNumbersFieldsDistractors: Story = {
  args: {
    fields: sortFields,
    config: {
      skip: { mode: 'random' },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 3 },
    },
  },
};
```

- [ ] **Step 3: Run typecheck**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn typecheck`

Expected: no errors

- [ ] **Step 4: Run all tests**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn test`

Expected: all tests pass

- [ ] **Step 5: Run markdown lint**

Run: `cd worktrees/feat/sort-numbers-skip-config && yarn fix:md`

Expected: plan file and any modified md files pass lint

- [ ] **Step 6: Commit**

```bash
cd worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx \
        src/components/ConfigFormFields.stories.tsx \
        docs/superpowers/plans/2026-04-08-sort-numbers-skip-config.md
git commit -m "feat(sort-numbers): add stories for skip modes and distractor configs"
```
