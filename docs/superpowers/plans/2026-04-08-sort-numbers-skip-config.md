# SortNumbers Skip & Distractor Config — Simple/Advanced Mode Plan

> _Renamed 2026-04-16: "bookmark" → "custom game". See `docs/superpowers/specs/2026-04-16-custom-games-and-bookmarks-design.md`._
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a simple/advanced config system to SortNumbers so teachers can configure skip-by sequences in 5 fields (simple mode) while retaining full control (advanced mode). Also fix the stale-rounds bug and support a fixed numeric start in skip-by mode.

**Architecture:** Three layers — (1) type + logic: extend `SkipConfig` with `start: number`, add `resolveSimpleConfig` pure function, extract and fix `isRoundsStale`; (2) generic UI: extend `nested-select-or-number` to support custom select options; (3) game-specific UI: create `SortNumbersConfigForm` with mode toggle and live preview, wire into `InstructionsOverlay` via a `renderConfigForm` prop.

**Tech Stack:** TypeScript, Vitest, React (const arrow components), Tailwind CSS, Storybook 8, `@testing-library/react`, `userEvent`

---

## File Map

| File                                                                          | Action | Responsibility                                                                                                   |
| ----------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/games/sort-numbers/types.ts`                                             | Modify | Add `start: number` to `SkipConfig`; add `configMode` to `SortNumbersConfig`; add `SortNumbersSimpleConfig` type |
| `src/games/sort-numbers/build-sort-round.ts`                                  | Modify | Handle `start: number` in `generateSortRounds`                                                                   |
| `src/games/sort-numbers/build-sort-round.test.ts`                             | Modify | Tests for numeric start (spec #9-11)                                                                             |
| `src/games/sort-numbers/is-rounds-stale.ts`                                   | Create | `isRoundsStale` with skip-pattern validation                                                                     |
| `src/games/sort-numbers/is-rounds-stale.test.ts`                              | Create | Tests for stale detection (spec #6-8)                                                                            |
| `src/lib/config-fields.ts`                                                    | Modify | Add optional `options` to `nested-select-or-number`                                                              |
| `src/components/ConfigFormFields.tsx`                                         | Modify | Handle custom options in `nested-select-or-number` renderer                                                      |
| `src/components/ConfigFormFields.test.tsx`                                    | Modify | Tests for custom options                                                                                         |
| `src/games/sort-numbers/resolve-simple-config.ts`                             | Create | `resolveSimpleConfig`, `canConvertToSimple`, `advancedToSimple`                                                  |
| `src/games/sort-numbers/resolve-simple-config.test.ts`                        | Create | Tests for resolver + conversion (spec #1-5)                                                                      |
| `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.tsx`      | Create | Mode toggle, simple fields, live preview, advanced delegation                                                    |
| `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx` | Create | Tests for form toggle, fields, preview                                                                           |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`      | Modify | Add optional `renderConfigForm` prop                                                                             |
| `src/routes/$locale/_app/game/$gameId.tsx`                                    | Modify | Wire `SortNumbersConfigForm`, update resolver for configMode + start:number, use `isRoundsStale`                 |
| `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`                  | Modify | Add stories (spec #12-15)                                                                                        |

---

## Task 1: Extend SkipConfig and SortNumbersConfig types

**Files:**

- Modify: `src/games/sort-numbers/types.ts`

- [ ] **Step 1: Add `start: number` to SkipConfig, `configMode` to SortNumbersConfig, and `SortNumbersSimpleConfig` type**

```ts
// In src/games/sort-numbers/types.ts

// Replace the existing SkipConfig type:
export type SkipConfig =
  | { mode: 'random' }
  | { mode: 'consecutive' }
  | {
      mode: 'by';
      step: number;
      start: 'range-min' | 'random' | number;
    };

// Add SortNumbersSimpleConfig type (after SkipConfig):
export type SortNumbersSimpleConfig = {
  configMode: 'simple';
  direction: 'ascending' | 'descending';
  start: number;
  step: number;
  quantity: number;
  distractors: boolean;
};

// Add configMode to SortNumbersConfig interface:
export interface SortNumbersConfig extends AnswerGameConfig {
  component: 'SortNumbers';
  configMode?: 'simple' | 'advanced';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  distractors: DistractorConfig;
  rounds: SortNumbersRound[];
}
```

- [ ] **Step 2: Update skip.start config field from `nested-select` to `nested-select-or-number` with custom options**

In the `sortNumbersConfigFields` array, replace the skip start field:

```ts
// Replace:
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

// With:
  {
    type: 'nested-select-or-number',
    key: 'skip',
    subKey: 'start',
    label: 'Skip start',
    min: 1,
    max: 999,
    options: [
      { value: 'range-min', label: 'range-min' },
      { value: 'random', label: 'random' },
    ],
    visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' },
  },
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx tsc --noEmit`

Expected: type errors in `build-sort-round.ts` (line ~164) where `start === 'range-min'` no longer narrows correctly since `start` can now be a `number`. This is expected — Task 2 fixes it. No other errors should appear.

- [ ] **Step 4: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/types.ts
git commit -m "feat(sort-numbers): extend SkipConfig with start:number, add configMode and SortNumbersSimpleConfig type"
```

---

## Task 2: Handle `start: number` in `generateSortRounds`

**Files:**

- Test: `src/games/sort-numbers/build-sort-round.test.ts`
- Modify: `src/games/sort-numbers/build-sort-round.ts`

- [ ] **Step 1: Write failing tests for numeric start**

Append to the `generateSortRounds` describe block in `build-sort-round.test.ts`:

```ts
it('mode by with numeric start generates sequence from that start', () => {
  const rounds = generateSortRounds({
    range: { min: 1, max: 10 },
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 2 },
    totalRounds: 1,
  });
  expect(rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
});

it('mode by with numeric start exceeding range falls back to consecutive', () => {
  const rounds = generateSortRounds({
    range: { min: 1, max: 10 },
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 3 },
    totalRounds: 1,
  });
  // 3+2*4=11 > 10 → fallback to consecutive
  const seq = rounds[0]?.sequence ?? [];
  expect(seq).toHaveLength(5);
  const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
  expect(diffs.every((d) => d === 1)).toBe(true);
});

it('mode by with numeric start outside range falls back to consecutive', () => {
  const rounds = generateSortRounds({
    range: { min: 5, max: 20 },
    quantity: 3,
    skip: { mode: 'by', step: 2, start: 1 },
    totalRounds: 1,
  });
  const seq = rounds[0]?.sequence ?? [];
  expect(seq).toHaveLength(3);
  const diffs = seq.slice(1).map((n, i) => n - (seq[i] ?? 0));
  expect(diffs.every((d) => d === 1)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/build-sort-round.test.ts`

Expected: 3 new tests FAIL (numeric start not handled yet).

- [ ] **Step 3: Implement numeric start handling in generateSortRounds**

In `build-sort-round.ts`, inside the `if (skip.mode === 'by')` block, replace the existing logic with:

```ts
if (skip.mode === 'by') {
  const { step, start } = skip;
  const maxPossibleStart = range.max - (quantity - 1) * step;

  if (maxPossibleStart < range.min) {
    console.warn(
      `generateSortRounds: mode 'by' step=${step} quantity=${quantity} exceeds range [${range.min},${range.max}]; falling back to consecutive`,
    );
    return generateConsecutiveRound(range, quantity);
  }

  if (typeof start === 'number') {
    const lastValue = start + (quantity - 1) * step;
    if (start < range.min || lastValue > range.max) {
      console.warn(
        `generateSortRounds: numeric start=${start} produces sequence outside range [${range.min},${range.max}]; falling back to consecutive`,
      );
      return generateConsecutiveRound(range, quantity);
    }
    return {
      sequence: Array.from(
        { length: quantity },
        (_, i) => start + i * step,
      ),
    };
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/build-sort-round.test.ts`

Expected: ALL tests PASS (existing + 3 new).

- [ ] **Step 5: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/build-sort-round.ts src/games/sort-numbers/build-sort-round.test.ts
git commit -m "feat(sort-numbers): support numeric start in generateSortRounds with range validation"
```

---

## Task 3: Extract and enhance `isRoundsStale`

**Files:**

- Create: `src/games/sort-numbers/is-rounds-stale.ts`
- Create: `src/games/sort-numbers/is-rounds-stale.test.ts`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Write failing tests for stale detection**

Create `src/games/sort-numbers/is-rounds-stale.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isRoundsStale } from './is-rounds-stale';
import type { SkipConfig, SortNumbersRound } from './types';

describe('isRoundsStale', () => {
  const makeRounds = (sequences: number[][]): SortNumbersRound[] =>
    sequences.map((sequence) => ({ sequence }));

  it('returns true when sequence length does not match quantity', () => {
    const rounds = makeRounds([[1, 2, 3]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });

  it('returns true when values are outside range', () => {
    const rounds = makeRounds([[1, 2, 3]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 5, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });

  it('returns false when rounds match consecutive pattern', () => {
    const rounds = makeRounds([[3, 4, 5]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(false);
  });

  it('returns true when consecutive rounds have skip changed to by step=2', () => {
    const rounds = makeRounds([[3, 4, 5, 6]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(true);
  });

  it('returns true when step-2 rounds have skip changed to step=3', () => {
    const rounds = makeRounds([[2, 4, 6, 8]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 3, start: 'range-min' },
      }),
    ).toBe(true);
  });

  it('returns false when rounds match current skip pattern step=2', () => {
    const rounds = makeRounds([[2, 4, 6, 8]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(false);
  });

  it('returns false for random mode when quantity and range match', () => {
    const rounds = makeRounds([[3, 7, 12, 18]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 4,
        range: { min: 1, max: 20 },
        skip: { mode: 'random' },
      }),
    ).toBe(false);
  });

  it('returns true when consecutive pattern does not match consecutive mode', () => {
    const rounds = makeRounds([[2, 4, 6]]);
    expect(
      isRoundsStale(rounds, {
        quantity: 3,
        range: { min: 1, max: 10 },
        skip: { mode: 'consecutive' },
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/is-rounds-stale.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `isRoundsStale`**

Create `src/games/sort-numbers/is-rounds-stale.ts`:

```ts
import type { SkipConfig, SortNumbersRound } from './types';

interface StaleCheckOptions {
  quantity: number;
  range: { min: number; max: number };
  skip: SkipConfig;
}

export const isRoundsStale = (
  rounds: SortNumbersRound[],
  options: StaleCheckOptions,
): boolean => {
  const { quantity, range, skip } = options;

  return rounds.some((r) => {
    // Check quantity
    if (r.sequence.length !== quantity) return true;

    // Check range
    if (r.sequence.some((v) => v < range.min || v > range.max))
      return true;

    // Check skip pattern
    if (skip.mode === 'by') {
      const sorted = [...r.sequence].toSorted((a, b) => a - b);
      const diffs = sorted.slice(1).map((n, i) => n - (sorted[i] ?? 0));
      if (!diffs.every((d) => d === skip.step)) return true;
    }

    if (skip.mode === 'consecutive') {
      const sorted = [...r.sequence].toSorted((a, b) => a - b);
      const diffs = sorted.slice(1).map((n, i) => n - (sorted[i] ?? 0));
      if (!diffs.every((d) => d === 1)) return true;
    }

    // mode 'random': quantity + range check is sufficient
    return false;
  });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/is-rounds-stale.test.ts`

Expected: ALL 8 tests PASS.

- [ ] **Step 5: Wire `isRoundsStale` into `resolveSortNumbersConfig` in the route file**

In `src/routes/$locale/_app/game/$gameId.tsx`, add the import:

```ts
import { isRoundsStale } from '@/games/sort-numbers/is-rounds-stale';
```

Replace the inline `roundsStale` logic (lines ~259-267) with:

```ts
const roundsStale =
  Array.isArray(merged.rounds) &&
  isRoundsStale(merged.rounds, {
    quantity: merged.quantity,
    range: merged.range,
    skip: merged.skip,
  });
```

- [ ] **Step 6: Typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx tsc --noEmit`

Expected: PASS (no errors).

- [ ] **Step 7: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/is-rounds-stale.ts src/games/sort-numbers/is-rounds-stale.test.ts src/routes/\$locale/_app/game/\$gameId.tsx
git commit -m "fix(sort-numbers): extract isRoundsStale with skip-pattern validation"
```

---

## Task 4: Extend `nested-select-or-number` with custom options

**Files:**

- Modify: `src/lib/config-fields.ts`
- Test: `src/components/ConfigFormFields.test.tsx`
- Modify: `src/components/ConfigFormFields.tsx`

- [ ] **Step 1: Add optional `options` property to `nested-select-or-number` ConfigField type**

In `src/lib/config-fields.ts`, update the `nested-select-or-number` variant:

```ts
  | {
      /**
       * A hybrid field: a select with string options plus a numeric input
       * when the current value is a number. Reads/writes config[key][subKey].
       *
       * When `options` is omitted, defaults to a single 'all' option
       * (backward compatible with the original all-or-number toggle).
       */
      type: 'nested-select-or-number';
      key: string;
      subKey: string;
      label: string;
      min: number;
      max: number;
      options?: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
```

- [ ] **Step 2: Write failing tests for custom options**

Append to `src/components/ConfigFormFields.test.tsx`:

```ts
describe('nested-select-or-number with custom options', () => {
  const customOptionsFields: ConfigField[] = [
    {
      type: 'nested-select-or-number',
      key: 'skip',
      subKey: 'start',
      label: 'Skip start',
      min: 1,
      max: 999,
      options: [
        { value: 'range-min', label: 'range-min' },
        { value: 'random', label: 'random' },
      ],
    },
  ];

  it('renders string option selected when value is a string from options', () => {
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 'range-min' } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip start type' }),
    ).toHaveValue('range-min');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('renders number option selected with input when value is a number', () => {
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 5 } }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Skip start type' }),
    ).toHaveValue('number');
    expect(
      screen.getByRole('spinbutton', { name: 'Skip start value' }),
    ).toHaveValue(5);
  });

  it('switches to number input when selecting number option', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 'range-min' } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip start type' }),
      'number',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 2, start: 1 },
    });
  });

  it('switches to string value when selecting a string option', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields
        fields={customOptionsFields}
        config={{ skip: { mode: 'by', step: 2, start: 5 } }}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Skip start type' }),
      'random',
    );
    expect(onChange).toHaveBeenCalledWith({
      skip: { mode: 'by', step: 2, start: 'random' },
    });
  });
});
```

- [ ] **Step 3: Run tests to verify the new tests fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/components/ConfigFormFields.test.tsx`

Expected: 4 new tests FAIL (custom options not handled yet). Existing tests should PASS.

- [ ] **Step 4: Implement custom options in `nested-select-or-number` renderer**

In `src/components/ConfigFormFields.tsx`, replace the `if (field.type === 'nested-select-or-number')` block:

```tsx
if (field.type === 'nested-select-or-number') {
  const nested = config[field.key] as
    | Record<string, unknown>
    | undefined;
  const currentValue = nested?.[field.subKey];
  const selectOptions = field.options ?? [
    { value: 'all', label: 'all' },
  ];
  const isStringOption =
    typeof currentValue === 'string' &&
    selectOptions.some((o) => o.value === currentValue);
  return (
    <div
      key={`${field.key}.${field.subKey}`}
      className="flex flex-col gap-1 text-sm font-semibold text-foreground"
    >
      <span>{field.label}</span>
      <div className="flex gap-2">
        <select
          aria-label={`${field.label} type`}
          value={isStringOption ? String(currentValue) : 'number'}
          onChange={(e) => {
            const val = e.target.value;
            const next = val === 'number' ? field.min : val;
            onChange({
              ...config,
              [field.key]: { ...nested, [field.subKey]: next },
            });
          }}
          className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value="number">number</option>
        </select>
        {!isStringOption && (
          <input
            type="number"
            aria-label={`${field.label} value`}
            value={
              typeof currentValue === 'number'
                ? currentValue
                : field.min
            }
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
```

- [ ] **Step 5: Run all ConfigFormFields tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/components/ConfigFormFields.test.tsx`

Expected: ALL tests PASS (existing + 4 new).

- [ ] **Step 6: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/lib/config-fields.ts src/components/ConfigFormFields.tsx src/components/ConfigFormFields.test.tsx
git commit -m "feat(config-form): support custom options in nested-select-or-number field type"
```

---

## Task 5: Create `resolveSimpleConfig` and conversion functions

**Files:**

- Create: `src/games/sort-numbers/resolve-simple-config.ts`
- Create: `src/games/sort-numbers/resolve-simple-config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/games/sort-numbers/resolve-simple-config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  canConvertToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';
import type { SortNumbersConfig } from './types';

describe('resolveSimpleConfig', () => {
  it('start=2, step=2, qty=5, distractors=false produces sequence [2,4,6,8,10] with 5 tiles exact mode', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
    expect(result.range).toEqual({ min: 2, max: 10 });
    expect(result.tileBankMode).toBe('exact');
    expect(result.skip).toEqual({ mode: 'by', step: 2, start: 2 });
    expect(result.configMode).toBe('simple');
  });

  it('start=2, step=2, qty=5, distractors=true produces gaps-only all distractors', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: true,
    });
    expect(result.rounds[0]?.sequence).toEqual([2, 4, 6, 8, 10]);
    expect(result.tileBankMode).toBe('distractors');
    expect(result.distractors).toEqual({
      source: 'gaps-only',
      count: 'all',
    });
  });

  it('start=5, step=3, qty=4, distractors=false produces sequence [5,8,11,14]', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 5,
      step: 3,
      quantity: 4,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([5, 8, 11, 14]);
    expect(result.range).toEqual({ min: 5, max: 14 });
    expect(result.quantity).toBe(4);
  });

  it('direction descending is passed through', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'descending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.direction).toBe('descending');
  });

  it('start=1, step=1, qty=5 (consecutive edge) produces [1,2,3,4,5]', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 1,
      step: 1,
      quantity: 5,
      distractors: false,
    });
    expect(result.rounds[0]?.sequence).toEqual([1, 2, 3, 4, 5]);
    expect(result.range).toEqual({ min: 1, max: 5 });
  });

  it('sets sensible defaults for non-editable AnswerGameConfig fields', () => {
    const result = resolveSimpleConfig({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
    expect(result.inputMethod).toBe('drag');
    expect(result.wrongTileBehavior).toBe('lock-manual');
    expect(result.ttsEnabled).toBe(true);
    expect(result.roundsInOrder).toBe(false);
    expect(result.totalRounds).toBe(1);
  });
});

describe('canConvertToSimple', () => {
  const base: SortNumbersConfig = {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
    direction: 'ascending',
    range: { min: 2, max: 10 },
    quantity: 5,
    skip: { mode: 'by', step: 2, start: 2 },
    distractors: { source: 'random', count: 2 },
    rounds: [{ sequence: [2, 4, 6, 8, 10] }],
  };

  it('returns true for skip by with numeric start and exact mode', () => {
    expect(canConvertToSimple(base)).toBe(true);
  });

  it('returns true for skip by with numeric start and gaps-only all distractors', () => {
    expect(
      canConvertToSimple({
        ...base,
        tileBankMode: 'distractors',
        distractors: { source: 'gaps-only', count: 'all' },
      }),
    ).toBe(true);
  });

  it('returns false for skip mode random', () => {
    expect(
      canConvertToSimple({
        ...base,
        skip: { mode: 'random' },
      }),
    ).toBe(false);
  });

  it('returns false for skip by with string start', () => {
    expect(
      canConvertToSimple({
        ...base,
        skip: { mode: 'by', step: 2, start: 'range-min' },
      }),
    ).toBe(false);
  });

  it('returns false for distractors with source random', () => {
    expect(
      canConvertToSimple({
        ...base,
        tileBankMode: 'distractors',
        distractors: { source: 'random', count: 3 },
      }),
    ).toBe(false);
  });
});

describe('advancedToSimple', () => {
  const convertibleConfig: SortNumbersConfig = {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    tileBankMode: 'exact',
    totalRounds: 1,
    ttsEnabled: true,
    direction: 'descending',
    range: { min: 3, max: 9 },
    quantity: 4,
    skip: { mode: 'by', step: 2, start: 3 },
    distractors: { source: 'random', count: 2 },
    rounds: [{ sequence: [3, 5, 7, 9] }],
  };

  it('extracts simple fields from a convertible config', () => {
    const simple = advancedToSimple(convertibleConfig);
    expect(simple).toEqual({
      configMode: 'simple',
      direction: 'descending',
      start: 3,
      step: 2,
      quantity: 4,
      distractors: false,
    });
  });

  it('returns defaults when config is not convertible', () => {
    const simple = advancedToSimple({
      ...convertibleConfig,
      skip: { mode: 'random' },
    });
    expect(simple).toEqual({
      configMode: 'simple',
      direction: 'ascending',
      start: 2,
      step: 2,
      quantity: 5,
      distractors: false,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/resolve-simple-config.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `resolveSimpleConfig`, `canConvertToSimple`, `advancedToSimple`**

Create `src/games/sort-numbers/resolve-simple-config.ts`:

```ts
import { generateSortRounds } from './build-sort-round';
import type {
  DistractorConfig,
  SkipConfig,
  SortNumbersConfig,
  SortNumbersSimpleConfig,
} from './types';

const SIMPLE_DEFAULTS: SortNumbersSimpleConfig = {
  configMode: 'simple',
  direction: 'ascending',
  start: 2,
  step: 2,
  quantity: 5,
  distractors: false,
};

export const resolveSimpleConfig = (
  simple: SortNumbersSimpleConfig,
): SortNumbersConfig => {
  const { direction, start, step, quantity, distractors } = simple;
  const range = { min: start, max: start + (quantity - 1) * step };
  const skip: SkipConfig = { mode: 'by', step, start };

  return {
    gameId: 'sort-numbers',
    component: 'SortNumbers',
    configMode: 'simple',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-manual',
    ttsEnabled: true,
    roundsInOrder: false,
    totalRounds: 1,
    direction,
    range,
    quantity,
    skip,
    tileBankMode: distractors ? 'distractors' : 'exact',
    distractors: distractors
      ? { source: 'gaps-only', count: 'all' }
      : { source: 'random', count: 2 },
    rounds: generateSortRounds({
      range,
      quantity,
      skip,
      totalRounds: 1,
    }),
  };
};

export const canConvertToSimple = (
  config: SortNumbersConfig,
): boolean => {
  if (config.skip.mode !== 'by') return false;
  if (typeof config.skip.start !== 'number') return false;
  if (config.tileBankMode === 'distractors') {
    const d = config.distractors as DistractorConfig;
    if (d.source !== 'gaps-only' || d.count !== 'all') return false;
  }
  return true;
};

export const advancedToSimple = (
  config: SortNumbersConfig,
): SortNumbersSimpleConfig => {
  if (!canConvertToSimple(config)) return { ...SIMPLE_DEFAULTS };
  const skip = config.skip as {
    mode: 'by';
    step: number;
    start: number;
  };
  return {
    configMode: 'simple',
    direction: config.direction,
    start: skip.start,
    step: skip.step,
    quantity: config.quantity,
    distractors: config.tileBankMode === 'distractors',
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/resolve-simple-config.test.ts`

Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/resolve-simple-config.ts src/games/sort-numbers/resolve-simple-config.test.ts
git commit -m "feat(sort-numbers): add resolveSimpleConfig pure function and conversion helpers"
```

---

## Task 6: Create `SortNumbersConfigForm` component

**Files:**

- Create: `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.tsx`
- Create: `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortNumbersConfigForm } from './SortNumbersConfigForm';

const simpleConfig: Record<string, unknown> = {
  configMode: 'simple',
  direction: 'ascending',
  quantity: 5,
  skip: { mode: 'by', step: 2, start: 2 },
  tileBankMode: 'exact',
  range: { min: 2, max: 10 },
  distractors: { source: 'random', count: 2 },
};

const advancedConfig: Record<string, unknown> = {
  configMode: 'advanced',
  direction: 'ascending',
  quantity: 6,
  skip: { mode: 'random' },
  tileBankMode: 'exact',
  range: { min: 11, max: 99 },
  distractors: { source: 'random', count: 2 },
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-manual',
  totalRounds: 8,
  ttsEnabled: true,
};

describe('SortNumbersConfigForm', () => {
  describe('simple mode', () => {
    it('renders simple mode fields and preview', () => {
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByRole('combobox', { name: 'Config mode' }),
      ).toHaveValue('simple');
      expect(
        screen.getByRole('combobox', { name: 'Direction' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', { name: 'Start' }),
      ).toHaveValue(2);
      expect(
        screen.getByRole('spinbutton', { name: 'Skip by' }),
      ).toHaveValue(2);
      expect(
        screen.getByRole('spinbutton', { name: 'Quantity' }),
      ).toHaveValue(5);
      expect(
        screen.getByRole('checkbox', { name: 'Distractors' }),
      ).not.toBeChecked();
    });

    it('shows live sequence preview', () => {
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByText('Sequence: 2, 4, 6, 8, 10'),
      ).toBeInTheDocument();
    });

    it('calls onChange with updated skip.start when Start changes', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      const input = screen.getByRole('spinbutton', { name: 'Start' });
      await userEvent.clear(input);
      await userEvent.type(input, '3');
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect((lastCall.skip as Record<string, unknown>).start).toBe(3);
    });

    it('calls onChange with updated tileBankMode when Distractors toggled', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      await userEvent.click(
        screen.getByRole('checkbox', { name: 'Distractors' }),
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.tileBankMode).toBe('distractors');
    });
  });

  describe('advanced mode', () => {
    it('renders advanced mode with ConfigFormFields', () => {
      render(
        <SortNumbersConfigForm
          config={advancedConfig}
          onChange={vi.fn()}
        />,
      );
      expect(
        screen.getByRole('combobox', { name: 'Config mode' }),
      ).toHaveValue('advanced');
      // Advanced mode renders the generic fields — check for one that
      // only appears in advanced mode
      expect(
        screen.getByRole('combobox', { name: 'Input method' }),
      ).toBeInTheDocument();
    });
  });

  describe('mode toggle', () => {
    it('switches from simple to advanced', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={simpleConfig}
          onChange={onChange}
        />,
      );
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Config mode' }),
        'advanced',
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.configMode).toBe('advanced');
    });

    it('switches from advanced to simple', async () => {
      const onChange = vi.fn();
      render(
        <SortNumbersConfigForm
          config={advancedConfig}
          onChange={onChange}
        />,
      );
      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Config mode' }),
        'simple',
      );
      const lastCall = onChange.mock.calls.at(-1)?.[0] as Record<
        string,
        unknown
      >;
      expect(lastCall.configMode).toBe('simple');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `SortNumbersConfigForm`**

Create `src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.tsx`:

```tsx
import { ConfigFormFields } from '@/components/ConfigFormFields';
import type { SortNumbersConfig } from '../types';
import { sortNumbersConfigFields } from '../types';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from '../resolve-simple-config';
import type { JSX } from 'react';

type SortNumbersConfigFormProps = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const SortNumbersConfigForm = ({
  config,
  onChange,
}: SortNumbersConfigFormProps): JSX.Element => {
  const isSimple = config.configMode === 'simple';

  const handleModeToggle = (mode: string) => {
    if (mode === 'simple') {
      const simple = advancedToSimple(
        config as unknown as SortNumbersConfig,
      );
      const resolved = resolveSimpleConfig(simple);
      onChange(resolved as unknown as Record<string, unknown>);
    } else {
      onChange({ ...config, configMode: 'advanced' });
    }
  };

  const modeSelect = (
    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
      Config mode
      <select
        aria-label="Config mode"
        value={isSimple ? 'simple' : 'advanced'}
        onChange={(e) => handleModeToggle(e.target.value)}
        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="simple">simple</option>
        <option value="advanced">advanced</option>
      </select>
    </label>
  );

  if (isSimple) {
    const skip = config.skip as
      | { step?: number; start?: number }
      | undefined;
    const start = typeof skip?.start === 'number' ? skip.start : 2;
    const step = typeof skip?.step === 'number' ? skip.step : 2;
    const quantity =
      typeof config.quantity === 'number' ? config.quantity : 5;
    const direction = (config.direction as string) ?? 'ascending';
    const distractors = config.tileBankMode === 'distractors';

    const sequence = Array.from(
      { length: quantity },
      (_, i) => start + i * step,
    );

    return (
      <div className="flex flex-col gap-3">
        {modeSelect}

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Direction
          <select
            aria-label="Direction"
            value={direction}
            onChange={(e) =>
              onChange({ ...config, direction: e.target.value })
            }
            className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="ascending">ascending</option>
            <option value="descending">descending</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Start
          <input
            type="number"
            aria-label="Start"
            value={start}
            min={1}
            onChange={(e) =>
              onChange({
                ...config,
                skip: {
                  ...(config.skip as Record<string, unknown>),
                  start: Number(e.target.value),
                },
              })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Skip by
          <input
            type="number"
            aria-label="Skip by"
            value={step}
            min={2}
            max={100}
            onChange={(e) =>
              onChange({
                ...config,
                skip: {
                  ...(config.skip as Record<string, unknown>),
                  step: Number(e.target.value),
                },
              })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
          Quantity
          <input
            type="number"
            aria-label="Quantity"
            value={quantity}
            min={2}
            max={8}
            onChange={(e) =>
              onChange({ ...config, quantity: Number(e.target.value) })
            }
            className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            aria-label="Distractors"
            checked={distractors}
            onChange={(e) =>
              onChange({
                ...config,
                tileBankMode: e.target.checked
                  ? 'distractors'
                  : 'exact',
                ...(e.target.checked
                  ? {
                      distractors: {
                        source: 'gaps-only',
                        count: 'all',
                      },
                    }
                  : {}),
              })
            }
            className="h-5 w-5 accent-primary"
          />
          Distractors
        </label>

        <p className="text-sm text-muted-foreground">
          Sequence: {sequence.join(', ')}
        </p>
      </div>
    );
  }

  // Advanced mode
  return (
    <div className="flex flex-col gap-3">
      {modeSelect}
      <ConfigFormFields
        fields={sortNumbersConfigFields}
        config={config}
        onChange={onChange}
      />
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx`

Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.tsx src/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm.test.tsx
git commit -m "feat(sort-numbers): add SortNumbersConfigForm with simple/advanced toggle and live preview"
```

---

## Task 7: Add `renderConfigForm` prop to InstructionsOverlay

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`

- [ ] **Step 1: Read the current InstructionsOverlay component**

Read `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` in full to identify the exact insertion points.

- [ ] **Step 2: Add `renderConfigForm` prop and use it in rendering**

Update the props type — make `configFields` optional and add `renderConfigForm`:

```ts
type InstructionsOverlayProps = {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  custom gameName?: string;
  custom gameColor?: Custom gameColorKey;
  subject: 'math' | 'reading';
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveCustom game?: (
    name: string,
    color: Custom gameColorKey,
  ) => Promise<void>;
  onUpdateCustom game?: (
    name: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  configFields?: ConfigField[];
  renderConfigForm?: (props: {
    config: Record<string, unknown>;
    onChange: (config: Record<string, unknown>) => void;
  }) => JSX.Element;
};
```

In the render body, replace the `ConfigFormFields` usage:

```tsx
{
  renderConfigForm ? (
    renderConfigForm({
      config,
      onChange: onConfigChange,
    })
  ) : configFields ? (
    <ConfigFormFields
      fields={configFields}
      config={config}
      onChange={onConfigChange}
    />
  ) : null;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx tsc --noEmit`

Expected: PASS. Existing callers pass `configFields` so they remain valid.

- [ ] **Step 4: Run InstructionsOverlay tests to verify no regression**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

Expected: ALL existing tests PASS (they pass `configFields`).

- [ ] **Step 5: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
git commit -m "feat(instructions-overlay): add renderConfigForm prop for custom config forms"
```

---

## Task 8: Integrate simple mode in game route

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of `$gameId.tsx`:

```ts
import { resolveSimpleConfig } from '@/games/sort-numbers/resolve-simple-config';
import { SortNumbersConfigForm } from '@/games/sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm';
```

- [ ] **Step 2: Update `makeDefaultSortNumbersConfig` to use simple mode**

Replace the existing `makeDefaultSortNumbersConfig`:

```ts
const makeDefaultSortNumbersConfig = (): SortNumbersConfig =>
  resolveSimpleConfig({
    configMode: 'simple',
    direction: 'ascending',
    start: 2,
    step: 2,
    quantity: 5,
    distractors: false,
  });
```

- [ ] **Step 3: Update `resolveSortNumbersConfig` to handle `configMode: 'simple'` and `start: number`**

Replace the entire `resolveSortNumbersConfig` function:

```ts
const resolveSortNumbersConfig = (
  saved: Record<string, unknown> | null,
): SortNumbersConfig => {
  const base = makeDefaultSortNumbersConfig();
  if (!saved || saved.component !== 'SortNumbers') return base;

  // Simple mode: resolve from 5 fields
  if (saved.configMode === 'simple') {
    const skip = saved.skip as
      | { step?: number; start?: number }
      | undefined;
    return resolveSimpleConfig({
      configMode: 'simple',
      direction:
        (saved.direction as 'ascending' | 'descending') ?? 'ascending',
      start: typeof skip?.start === 'number' ? skip.start : 2,
      step: typeof skip?.step === 'number' ? skip.step : 2,
      quantity: typeof saved.quantity === 'number' ? saved.quantity : 5,
      distractors: saved.tileBankMode === 'distractors',
    });
  }

  // Advanced mode (existing logic)
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

  // Existing saved configs without configMode are treated as advanced
  if (saved.configMode !== 'simple') {
    merged.configMode = 'advanced';
  }

  const tr = Math.max(1, merged.totalRounds);
  merged.totalRounds = tr;

  // Normalize skip: mode 'by' requires step and start.
  if (merged.skip.mode === 'by') {
    const partial = merged.skip as {
      mode: 'by';
      step?: number;
      start?: 'range-min' | 'random' | number;
    };
    merged.skip = {
      mode: 'by',
      step: typeof partial.step === 'number' ? partial.step : 2,
      start: partial.start ?? 'range-min',
    };
  }

  const roundsStale =
    Array.isArray(merged.rounds) &&
    isRoundsStale(merged.rounds, {
      quantity: merged.quantity,
      range: merged.range,
      skip: merged.skip,
    });

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

- [ ] **Step 4: Wire `SortNumbersConfigForm` into the SortNumbers game body**

In the `SortNumbersGameBody` component, replace the `configFields` prop on `InstructionsOverlay` with `renderConfigForm`. Find the `<InstructionsOverlay` JSX for SortNumbers and update:

```tsx
        // Remove:
        configFields={sortNumbersConfigFields}

        // Add:
        renderConfigForm={({ config: c, onChange: oc }) => (
          <SortNumbersConfigForm config={c} onChange={oc} />
        )}
```

Also remove the now-unused import of `sortNumbersConfigFields` from the route file (if no other code in the file uses it). Check whether `config-fields-registry.ts` still imports it (it does, so the export must remain in `types.ts`).

- [ ] **Step 5: Typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Run all unit tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx vitest run`

Expected: ALL tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/routes/\$locale/_app/game/\$gameId.tsx
git commit -m "feat(sort-numbers): integrate simple/advanced config mode in game route"
```

---

## Task 9: Add Storybook stories

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx`

- [ ] **Step 1: Add simple mode stories and advanced mode fixed-start story**

Append to the existing stories file:

```tsx
export const SimpleNoDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const SimpleWithDistractors: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'distractors',
      distractors: { source: 'gaps-only', count: 'all' },
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const SimpleDescending: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      range: { min: 2, max: 10 },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{ sequence: [2, 4, 6, 8, 10] }],
    },
  },
};

export const AdvancedWithFixedStart: Story = {
  args: {
    config: {
      ...baseConfig,
      configMode: 'advanced',
      skip: { mode: 'by', step: 2, start: 3 },
      range: { min: 1, max: 20 },
      rounds: [
        { sequence: [3, 5, 7, 9] },
        { sequence: [3, 5, 7, 9] },
        { sequence: [3, 5, 7, 9] },
      ],
    },
  },
};
```

- [ ] **Step 2: Typecheck stories**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config
git add src/games/sort-numbers/SortNumbers/SortNumbers.stories.tsx
git commit -m "feat(sort-numbers): add storybook stories for simple mode and fixed-start advanced mode"
```

---

## Task 10: Full verification

- [ ] **Step 1: Run lint**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && yarn lint`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && yarn typecheck`

Expected: PASS.

- [ ] **Step 3: Run all unit tests**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && yarn test`

Expected: ALL tests PASS.

- [ ] **Step 4: Run Storybook tests (if server available)**

Run: `cd /Users/leocaseiro/Sites/base-skill/worktrees/feat/sort-numbers-skip-config && START_STORYBOOK=1 yarn test:storybook`

Expected: PASS (or skip with documented justification).

- [ ] **Step 5: Fix any remaining issues and commit**

If any check fails, fix the issue, run the check again, and commit the fix.
