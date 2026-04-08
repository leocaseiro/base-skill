# SortNumbers Skip & Distractor Config Design (v2)

## Overview

Extend the SortNumbers game with a **simple/advanced config** system. Simple mode lets
teachers configure a skip-by sequence in 5 fields. Advanced mode provides full control.
Also fixes a stale-rounds bug where changing skip mode didn't regenerate rounds.

## Config Modes

### Simple Mode (new, default)

Teacher-friendly config with 5 fields. The system derives the full runtime config.

```ts
type SortNumbersSimpleConfig = {
  configMode: 'simple';
  direction: 'ascending' | 'descending';
  start: number; // first number in sequence
  step: number; // skip-by value (2 = count by 2s)
  quantity: number; // how many numbers to sort
  distractors: boolean; // fill gaps between sequence values
};
```

**Defaults**: direction='ascending', start=2, step=2, quantity=5, distractors=false

**Example**: start=2, step=2, quantity=5, distractors=true

- Sequence: 2, 4, 6, 8, 10
- Distractor pool (gaps): 3, 5, 7, 9
- Tile bank: 2, 3, 4, 5, 6, 7, 8, 9, 10 (shuffled)
- Direction controls zone ordering (ascending: 2,4,6,8,10 / descending: 10,8,6,4,2)

### Advanced Mode (existing, extended)

Full control over all config fields. Extends the existing config with a fixed-start option
for skip mode.

```ts
type SortNumbersAdvancedConfig = {
  configMode: 'advanced';
  direction: 'ascending' | 'descending';
  range: { min: number; max: number };
  quantity: number;
  skip: SkipConfig;
  distractors: DistractorConfig;
  // ...plus all existing AnswerGameConfig fields
};
```

### SkipConfig (updated)

```ts
type SkipConfig =
  | { mode: 'random' }
  | { mode: 'consecutive' }
  | {
      mode: 'by';
      step: number;
      start: 'range-min' | 'random' | number;
    };
```

Added `start: number` — a fixed starting value for the sequence.

### DistractorConfig (unchanged)

```ts
type DistractorConfig =
  | { source: 'random'; count: number | 'all' }
  | { source: 'gaps-only'; count: number | 'all' }
  | { source: 'full-range'; count: number | 'all' };
```

## Simple Mode Resolver

A pure function `resolveSimpleConfig` derives the full `SortNumbersConfig`:

| Simple field                | Derived runtime config                                               |
| --------------------------- | -------------------------------------------------------------------- |
| `start`, `step`, `quantity` | sequence: `[start, start+step, ..., start+(qty-1)*step]`             |
| `start`, `step`, `quantity` | range: `{ min: start, max: start + (qty-1) * step }`                 |
| `start`, `step`             | skip: `{ mode: 'by', step, start: startValue }`                      |
| `distractors: true`         | tileBankMode: 'distractors', `{ source: 'gaps-only', count: 'all' }` |
| `distractors: false`        | tileBankMode: 'exact'                                                |
| `direction`                 | passed through to zones ordering                                     |

Remaining `AnswerGameConfig` fields use sensible defaults:

- inputMethod: 'drag'
- wrongTileBehavior: 'lock-manual'
- ttsEnabled: true
- roundsInOrder: false
- totalRounds: 1

Rounds are always generated fresh from the 5 fields -- no stale check needed.

## Config Form UX

### Simple Mode Form (5 fields)

| Field       | Type                           | Default   | Constraints      |
| ----------- | ------------------------------ | --------- | ---------------- |
| Direction   | select: ascending / descending | ascending |                  |
| Start       | number input                   | 2         | min: 1           |
| Skip by     | number input                   | 2         | min: 2, max: 100 |
| Quantity    | number input                   | 5         | min: 2, max: 8   |
| Distractors | checkbox                       | off       |                  |

A live preview shows the sequence (e.g., "Sequence: 2, 4, 6, 8, 10").

### Mode Toggle

A toggle at the top switches between Simple and Advanced.

- **Simple to Advanced**: Resolver expands simple config into full advanced config so the
  teacher can tweak individual fields.
- **Advanced to Simple**: If the current advanced config can be expressed as simple
  (mode 'by', gaps-only or exact distractors), convert it. Otherwise reset to simple
  defaults.

### Advanced Mode Form

The existing form, unchanged, plus a new option for `skip.start` when `skip.mode === 'by'`:

- 'range-min' (existing)
- 'random' (existing)
- Fixed number input (new)

## Bug Fixes (Advanced Mode)

### Fix 1: Stale check validates skip pattern

Current `roundsStale` in `resolveSortNumbersConfig` only checks quantity + range. Add
skip-pattern validation:

- **mode 'by'**: sorted sequence diffs must all equal `step`
- **mode 'consecutive'**: sorted sequence diffs must all equal 1
- **mode 'random'**: no pattern check (quantity + range sufficient)

### Fix 2: `generateSortRounds` supports `start: number`

When `skip.start` is a number, the sequence starts at that exact value:
`[start, start+step, ..., start+(quantity-1)*step]`.

Validate that the sequence fits within range. Fall back to consecutive if not.

### Fix 3: Normalization defaults

When config form sends `skip: { mode: 'by' }` without `start`, default to
`start: 'range-min'` (existing behavior, unchanged).

## Error Handling

- If `mode: 'by'` and no valid start exists (`step * (quantity - 1) > range.max - range.min`),
  fall back to `mode: 'consecutive'` and log a warning.
- If distractor pool is smaller than requested `count`, include the full pool.
- Existing stored configs using `allowSkips: boolean` are migrated:
  `true` -> `{ mode: 'random' }`, `false` -> `{ mode: 'consecutive' }`.
- Existing stored configs without `configMode` are treated as advanced mode.

## Testing

### Unit tests: `resolveSimpleConfig`

| #   | Scenario                                  | Expected                                      |
| --- | ----------------------------------------- | --------------------------------------------- |
| 1   | start=2, step=2, qty=5, distractors=false | sequence [2,4,6,8,10], 5 tiles, exact mode    |
| 2   | start=2, step=2, qty=5, distractors=true  | sequence [2,4,6,8,10], tiles [2..10], 9 total |
| 3   | start=5, step=3, qty=4, distractors=false | sequence [5,8,11,14], 4 tiles                 |
| 4   | direction='descending'                    | zones ordered high to low                     |
| 5   | start=1, step=1, qty=5 (consecutive edge) | sequence [1,2,3,4,5], no gaps                 |

### Unit tests: stale check fix (advanced mode)

| #   | Scenario                                        | Expected           |
| --- | ----------------------------------------------- | ------------------ |
| 6   | Consecutive rounds, skip changed to 'by' step=2 | Stale, regenerated |
| 7   | Step-2 rounds, skip changed to step=3           | Stale, regenerated |
| 8   | Rounds match current skip pattern               | Not stale, kept    |

### Unit tests: `generateSortRounds` with `start: number`

| #   | Scenario                             | Expected                            |
| --- | ------------------------------------ | ----------------------------------- |
| 9   | start=2, step=2, qty=5, range {1,10} | [2,4,6,8,10]                        |
| 10  | start=3, step=2, qty=5, range {1,10} | Exceeds range, fallback consecutive |
| 11  | start outside range                  | Fallback consecutive                |

### Storybook stories

| #   | Story                  | Shows                     |
| --- | ---------------------- | ------------------------- |
| 12  | SimpleNoDistractors    | 5 tiles, skip by 2        |
| 13  | SimpleWithDistractors  | 9 tiles (sequence + gaps) |
| 14  | SimpleDescending       | zones in descending order |
| 15  | AdvancedWithFixedStart | advanced mode, start=3    |
