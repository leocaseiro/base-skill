# SortNumbers Skip & Distractor Config Design

## Overview

Extend the SortNumbers game configuration to support structured skip modes (count by Ns,
random, or consecutive) and configurable distractor sources (random, gaps-only, or
full-range). This replaces the boolean `allowSkips` field with two discriminated unions
that make invalid combinations impossible at the type level.

## Types

### SkipConfig (replaces `allowSkips: boolean`)

```ts
type SkipConfig =
  | { mode: 'random' }
  | { mode: 'consecutive' }
  | { mode: 'by'; step: number; start: 'range-min' | 'random' };
```

- `random` — picks `quantity` numbers randomly from the range (current `allowSkips: true`
  behavior)
- `consecutive` — picks a consecutive run of `quantity` numbers from a random start within
  the range (current `allowSkips: false` behavior)
- `by` — steps through the range by `step`, starting at `range.min` or a random valid
  position. A valid start is any value where `start + (quantity - 1) * step <= range.max`.

### DistractorConfig (new; only used when `tileBankMode === 'distractors'`)

```ts
type DistractorConfig =
  | { source: 'random'; count: number }
  | { source: 'gaps-only'; count: number | 'all' }
  | { source: 'full-range'; count: number | 'all' };
```

- `random` — picks extra tiles randomly from the range, excluding the correct sequence
  (current distractor behavior)
- `gaps-only` — pool is the numbers skipped over between sequence values (e.g. sequence
  2,4,6 → gap pool is 1,3,5,7)
- `full-range` — pool is all numbers in range not in the sequence
- `count: number` — pick that many from the pool randomly
- `count: 'all'` — include the entire pool as distractor tiles

### Updated `SortNumbersConfig`

```ts
interface SortNumbersConfig extends AnswerGameConfig {
  component: 'SortNumbers';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  distractors: DistractorConfig;
  rounds: SortNumbersRound[];
}
```

`allowSkips: boolean` is removed. `tileBankMode` and `distractorCount` on
`SortNumbersConfig` are replaced by the `distractors` union (though `tileBankMode` on the
base `AnswerGameConfig` remains for `'exact'` mode — when `tileBankMode === 'exact'`, the
`distractors` field is ignored).

## Round Generation (`build-sort-round.ts`)

### Updated `GenerateOptions`

```ts
interface GenerateOptions {
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  totalRounds: number;
}
```

### `generateSortRounds` branching

- `mode: 'consecutive'` — existing logic (random start, `quantity` consecutive numbers)
- `mode: 'random'` — existing `allowSkips` logic (random pick from pool, no repeats)
- `mode: 'by'` — enumerate all valid starting points where
  `start + (quantity - 1) * step <= range.max`, then pick one randomly (if
  `start === 'random'`) or use `range.min` (if `start === 'range-min'`). Build sequence as
  `[start, start + step, start + 2*step, ...]`.

### Distractor tile building

A new helper `buildDistractorPool(sequence, range, config: DistractorConfig): number[]`
computes the pool of candidate distractor numbers, then applies `count`:

- `source: 'random'` — pool = all range numbers not in sequence; pick `count` randomly
- `source: 'gaps-only'` — pool = numbers between consecutive sequence values (exclusive);
  if `count === 'all'` include all, else pick `count` randomly
- `source: 'full-range'` — pool = all range numbers not in sequence; if `count === 'all'`
  include all, else pick `count` randomly

`buildSortRound` is extended to accept an optional `DistractorConfig` and append distractor
tiles to the shuffled tile bank when provided and `tileBankMode === 'distractors'`.

## Config Fields (`types.ts`)

### New `ConfigField` types (in `config-fields.ts`)

```ts
| {
    type: 'nested-select';
    key: string;
    subKey: string;
    label: string;
    options: { value: string; label: string }[];
  }
| {
    type: 'nested-select-or-number';
    key: string;
    subKey: string;
    label: string;
    min: number;
    max: number;
  }
```

All existing and new field types gain an optional:

```ts
visibleWhen?: { key: string; subKey?: string; value: unknown };
```

`ConfigFormFields` skips rendering a field when its `visibleWhen` condition is not met by
the current config value.

### `sortNumbersConfigFields` additions

```ts
// Skip mode
{ type: 'nested-select', key: 'skip', subKey: 'mode', label: 'Skip mode',
  options: ['random', 'consecutive', 'by'] }

// Shown only when skip.mode === 'by'
{ type: 'nested-number', key: 'skip', subKey: 'step', label: 'Skip step',
  min: 2, max: 100,
  visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' } }

{ type: 'nested-select', key: 'skip', subKey: 'start', label: 'Skip start',
  options: ['range-min', 'random'],
  visibleWhen: { key: 'skip', subKey: 'mode', value: 'by' } }

// Distractor source (shown when tileBankMode === 'distractors')
{ type: 'nested-select', key: 'distractors', subKey: 'source',
  label: 'Distractor source',
  options: ['random', 'gaps-only', 'full-range'],
  visibleWhen: { key: 'tileBankMode', value: 'distractors' } }

// Distractor count
{ type: 'nested-select-or-number', key: 'distractors', subKey: 'count',
  label: 'Distractor count', min: 1, max: 20,
  visibleWhen: { key: 'tileBankMode', value: 'distractors' } }
```

The existing `allowSkips` checkbox entry is removed.

## ConfigFormFields renderer (`ConfigFormFields.tsx`)

- Add `nested-select` rendering branch: reads `(config[key] as obj)[subKey]`, writes back
  a spread of the nested object
- Add `nested-select-or-number` rendering branch: a select with an `'all'` option plus a
  number input shown when the current value is numeric
- Apply `visibleWhen` check before rendering any field: if the field has `visibleWhen` and
  `config[key][subKey?] !== value`, skip it

## Error Handling & Edge Cases

- If `mode: 'by'` and no valid start exists (e.g. `step * (quantity - 1) > range.max -
range.min`), fall back to `mode: 'consecutive'` for that round and log a warning.
- If distractor pool is smaller than requested `count`, include the full pool without
  error.
- Existing stored configs using `allowSkips: true/false` must be migrated: `true` →
  `{ mode: 'random' }`, `false` → `{ mode: 'consecutive' }`. A migration utility or
  default fallback in the config loader handles this.

## Testing

- Unit tests for `generateSortRounds` covering all three skip modes, including edge cases
  (step too large, start fixed vs random)
- Unit tests for `buildDistractorPool` covering all three sources and both count variants
- Updated Storybook stories for `SortNumbers` with `mode: 'by'` + each distractor source
- `ConfigFormFields` unit tests for `nested-select`, `nested-select-or-number`, and
  `visibleWhen` conditional rendering
