# WordSpell Levels-and-Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Level 3+ in WordSpell, bring Advanced form to parity with Simple
(Level + Phonemes + `distractorCount`), make `recall` and random rounds the
defaults, remove the unused `scramble` mode, and lock the bug class out with
parameterized regression tests.

**Architecture:** Extract Level/Phonemes UI into a shared `WordSpellLibrarySource`
sub-component used by both Simple and Advanced. Wire it into Advanced via a
new optional `getAdvancedHeaderRenderer` hook on the config-fields registry —
other games are unaffected. Cumulative-phoneme handling moves from
`GRAPHEMES_BY_LEVEL[level]` to the existing `cumulativeGraphemes(level)`
helper so library queries return playable word counts at every level.

**Tech Stack:** React + TypeScript (named exports only — `react/function-component-definition`),
Vitest + Testing Library + userEvent, Vite, TanStack Router, existing
`config-fields` registry, existing `buildRoundOrder` (already accepts a `seed`
parameter — no engine changes needed).

**Spec:** `docs/superpowers/specs/2026-04-28-wordspell-levels-defaults-design.md`

---

## Pre-flight

Before any task: verify you're on the right branch and worktree.

```bash
git rev-parse --abbrev-ref HEAD   # → feat/wordspell-levels-defaults
pwd                                # → .../worktrees/feat-wordspell-levels-defaults
```

If either is wrong, stop and ask — do not commit on master.

---

## Task 1: Cumulative-graphemes helper unit test (defensive lock-in)

The `cumulativeGraphemes(level)` helper is already correct in the codebase
(`src/data/words/levels.ts:130-144`). This task locks the contract with a
direct unit test so any future edit that breaks cumulativity fails fast.

**Files:**

- Create: `src/data/words/levels.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest';
import { cumulativeGraphemes, GRAPHEMES_BY_LEVEL } from './levels';

describe('cumulativeGraphemes', () => {
  it('returns only level-1 units at level 1', () => {
    const units = cumulativeGraphemes(1);
    const level1 = GRAPHEMES_BY_LEVEL[1] ?? [];
    expect(units).toHaveLength(level1.length);
  });

  it('includes phonemes from levels 1..N at level 3', () => {
    const phonemes = new Set(cumulativeGraphemes(3).map((u) => u.p));
    expect(phonemes.has('s')).toBe(true); // level 1
    expect(phonemes.has('m')).toBe(true); // level 2
    expect(phonemes.has('b')).toBe(true); // level 3
  });

  it('dedupes by grapheme+phoneme key', () => {
    const units = cumulativeGraphemes(8);
    const keys = units.map((u) => `${u.g}|${u.p}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves introduction order — level-1 units come first', () => {
    const units = cumulativeGraphemes(3);
    const firstLevel1Index = units.findIndex((u) =>
      (GRAPHEMES_BY_LEVEL[1] ?? []).some(
        (l1) => l1.g === u.g && l1.p === u.p,
      ),
    );
    expect(firstLevel1Index).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `yarn vitest run src/data/words/levels.test.ts`
Expected: 4 passing tests.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/levels.test.ts
git commit -m "test: lock in cumulativeGraphemes helper contract"
```

---

## Task 2: Curriculum invariant test (data contract)

Parameterized over every `(region, level)`. With cumulative phonemes
populated from `cumulativeGraphemes(level)`, every level must yield at least
`MIN_PLAYABLE_HITS = 4` words. This test passes against the current data —
its job is to fail loudly if anyone (a) ships a curriculum file with a level
that has no playable words, (b) tightens the filter logic in a way that drops
valid content, or (c) breaks the cumulativity helper.

**Files:**

- Create: `src/data/words/curriculum-invariant.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest';
import { filterWords } from './filter';
import { ALL_REGIONS, cumulativeGraphemes } from './levels';

const MIN_PLAYABLE_HITS = 4;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('curriculum invariant: every level has playable defaults', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L${level}: cumulative phonemes yield ≥ ${MIN_PLAYABLE_HITS} words`, async () => {
        const phonemesAllowed = [
          ...new Set(cumulativeGraphemes(level).map((u) => u.p)),
        ];
        const result = await filterWords({
          region,
          level,
          phonemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(
          MIN_PLAYABLE_HITS,
        );
      });
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `yarn vitest run src/data/words/curriculum-invariant.test.ts`
Expected: 32 passing tests (4 regions × 8 levels). The AUS branch is the
shipping curriculum; UK/US/BR fall back to AUS in `filterWords` when their
own curriculum is empty, so they should still meet the threshold.

If a non-AUS region returns < 4 hits even with fallback, narrow the test to
AUS and treat the others as deferred. **Do not weaken `MIN_PLAYABLE_HITS`
below 4.**

- [ ] **Step 3: Commit**

```bash
git add src/data/words/curriculum-invariant.test.ts
git commit -m "test: parameterized curriculum invariant — every (region, level) is playable"
```

---

## Task 3: Failing form-emits-playable test (TDD red for the bug)

Per CLAUDE.md, every bug fix needs a failing test first. This test simulates
the user picking each level in the form and asserts the emitted
`source.filter` produces ≥ 1 hit from `filterWords`. It will **fail** for
levels 3+ on the current code, demonstrating the bug.

**Files:**

- Create: `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import { filterWords } from '@/data/words';

type SourceConfig = {
  source?: {
    type: 'word-library';
    filter: {
      region: string;
      level: number;
      phonemesAllowed?: string[];
    };
  };
};

const Harness = ({
  initialLevel,
  onConfigRef,
}: {
  initialLevel: number;
  onConfigRef: (cfg: Record<string, unknown>) => void;
}) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
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
    it(`level ${level}: switching to it produces ≥ 1 hit`, async () => {
      const user = userEvent.setup();
      let captured: Record<string, unknown> = {};
      render(
        <Harness
          initialLevel={1}
          onConfigRef={(c) => {
            captured = c;
          }}
        />,
      );

      // Pick the target level via the level select
      await user.selectOptions(
        screen.getByLabelText(/level/i),
        String(level),
      );

      const source = captured.source as SourceConfig['source'];
      expect(source).toBeDefined();
      const result = await filterWords(source!.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }
});
```

- [ ] **Step 2: Run the test and verify it fails for levels 3+**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`
Expected:

- Level 1, 2: pass
- Level 3+: **FAIL** with `expected 0 to be greater than 0`

This is the bug captured. Do not commit yet — TDD red phase.

---

## Task 4: Apply the cumulative-phonemes fix (TDD green)

Replace `GRAPHEMES_BY_LEVEL[level]` with `cumulativeGraphemes(level)` in two
spots in the form. The chip strip and the default `phonemesAllowed` both
become cumulative.

**Files:**

- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`

- [ ] **Step 1: Update the import**

Edit `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`:

Replace:

```ts
import { GRAPHEMES_BY_LEVEL } from '@/data/words/levels';
```

with:

```ts
import { cumulativeGraphemes } from '@/data/words/levels';
```

Also update the `LEVEL_OPTIONS` constant — it currently reads from
`GRAPHEMES_BY_LEVEL`. Replace:

```ts
const LEVEL_OPTIONS = Object.keys(GRAPHEMES_BY_LEVEL).map((n) => ({
  value: n,
  label: `Level ${n}`,
}));
```

with:

```ts
const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: String(n),
  label: `Level ${n}`,
}));
```

- [ ] **Step 2: Use cumulative in the chip pool**

Replace:

```ts
const unitsAtLevel = GRAPHEMES_BY_LEVEL[level] ?? [];
```

with:

```ts
const unitsAtLevel = cumulativeGraphemes(level);
```

- [ ] **Step 3: Use cumulative inside `setLevel`**

Replace:

```ts
const setLevel = (n: number) => {
  const available = [
    ...new Set((GRAPHEMES_BY_LEVEL[n] ?? []).map((u) => u.p)),
  ];
  onChange({
    ...config,
    source: {
      type: 'word-library',
      filter: {
        ...(source?.filter ?? { region: 'aus' }),
        level: n,
        phonemesAllowed: available,
      },
    },
  });
};
```

with:

```ts
const setLevel = (n: number) => {
  const available = [
    ...new Set(cumulativeGraphemes(n).map((u) => u.p)),
  ];
  onChange({
    ...config,
    source: {
      type: 'word-library',
      filter: {
        ...(source?.filter ?? { region: 'aus' }),
        level: n,
        phonemesAllowed: available,
      },
    },
  });
};
```

- [ ] **Step 4: Run the form-emits-playable test — should now pass for all levels**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`
Expected: 8 passing tests.

- [ ] **Step 5: Run the full WordSpellSimpleConfigForm test suite**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm`
Expected: all tests pass. The existing `'shows a chip per phoneme at the current level'`
test asserts level-2 chips (`m /m/`, `d /d/`) are present — both still appear
in the cumulative set, so it stays green.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/WordSpellSimpleConfigForm/
git commit -m "fix(word-spell): use cumulative phonemes so Level 3+ produces playable words

Closes the Level 3+ regression: filterWords requires every grapheme of a
candidate word to map to a phoneme in phonemesAllowed, but the form was only
loading the phonemes introduced at level N. Switching to cumulativeGraphemes(N)
makes phonemes from levels 1..N all addressable, matching what the curriculum
words actually use."
```

---

## Task 5: Extract `WordSpellLibrarySource` sub-component

Move the Level select + Phonemes chip strip out of `WordSpellSimpleConfigForm`
into a reusable component. The Simple form keeps the Input Method picker and
delegates the library source UI to the new component.

**Files:**

- Create: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`
- Create: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`
- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`

- [ ] **Step 1: Create the sub-component**

Create `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`:

```tsx
import type { JSX } from 'react';
import { CellSelect } from '@/components/config/CellSelect';
import { ChipStrip } from '@/components/config/ChipStrip';
import { cumulativeGraphemes } from '@/data/words/levels';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: String(n),
  label: `Level ${n}`,
}));

export const WordSpellLibrarySource = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const source =
    typeof config.source === 'object' && config.source !== null
      ? (config.source as {
          type: 'word-library';
          filter: {
            region: string;
            level: number;
            phonemesAllowed?: string[];
          };
        })
      : undefined;
  const level =
    typeof source?.filter.level === 'number' ? source.filter.level : 1;

  const unitsAtLevel = cumulativeGraphemes(level);
  const phonemeToGraphemes = new Map<string, string[]>();
  for (const u of unitsAtLevel) {
    const existing = phonemeToGraphemes.get(u.p);
    if (existing) {
      existing.push(u.g);
    } else {
      phonemeToGraphemes.set(u.p, [u.g]);
    }
  }
  const allPhonemesAtLevel = [...phonemeToGraphemes.keys()];
  const phonemesAllowed =
    source?.filter.phonemesAllowed ?? allPhonemesAtLevel;
  const chips = allPhonemesAtLevel.map((p) => ({
    value: p,
    label: `${(phonemeToGraphemes.get(p) ?? []).join(', ')} /${p}/`,
  }));

  const setLevel = (n: number) => {
    const available = [
      ...new Set(cumulativeGraphemes(n).map((u) => u.p)),
    ];
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          ...(source?.filter ?? { region: 'aus' }),
          level: n,
          phonemesAllowed: available,
        },
      },
    });
  };

  const setPhonemes = (next: string[]) => {
    onChange({
      ...config,
      source: {
        type: 'word-library',
        filter: {
          ...(source?.filter ?? { region: 'aus' }),
          level,
          phonemesAllowed: next,
        },
      },
    });
  };

  const invalid = phonemesAllowed.length === 0;

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted-foreground">
        Level
        <CellSelect
          label="Level"
          value={String(level)}
          options={LEVEL_OPTIONS}
          onChange={(v) => setLevel(Number(v))}
        />
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Sounds at this level (tap to toggle)
        </div>
        <div className="mt-2">
          <ChipStrip
            chips={chips}
            selected={phonemesAllowed}
            mode="toggleable"
            onChange={setPhonemes}
          />
        </div>
        {invalid && (
          <p className="mt-2 text-xs text-destructive">
            Pick at least one sound to play.
          </p>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create the sub-component test**

Create `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';

const Harness = ({ initialLevel }: { initialLevel: number }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
  });
  return (
    <WordSpellLibrarySource config={config} onChange={setConfig} />
  );
};

describe('WordSpellLibrarySource', () => {
  it('shows the Level select', () => {
    render(<Harness initialLevel={1} />);
    expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
  });

  it('shows cumulative phoneme chips at level 3', () => {
    render(<Harness initialLevel={3} />);
    // Level 1 phoneme — must appear because cumulative
    expect(
      screen.getByRole('button', { name: /s \/s\//i }),
    ).toBeInTheDocument();
    // Level 3 phoneme
    expect(
      screen.getByRole('button', { name: /b \/b\//i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when phonemesAllowed is empty', () => {
    const { container } = render(<Harness initialLevel={2} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('toggles a phoneme via aria-pressed when a chip is tapped', async () => {
    const user = userEvent.setup();
    render(<Harness initialLevel={2} />);
    const chip = screen.getByRole('button', { name: /m \/m\//i });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 3: Run sub-component tests**

Run: `yarn vitest run src/games/word-spell/WordSpellLibrarySource`
Expected: 4 passing tests.

- [ ] **Step 4: Update the Simple form to delegate to the sub-component**

Replace the contents of
`src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`
with:

```tsx
import type { JSX } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { WordSpellLibrarySource } from '../WordSpellLibrarySource/WordSpellLibrarySource';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const WordSpellSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const inputMethod =
    config.inputMethod === 'type' || config.inputMethod === 'both'
      ? config.inputMethod
      : 'drag';

  return (
    <div className="flex flex-col gap-4">
      <WordSpellLibrarySource config={config} onChange={onChange} />
      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />
    </div>
  );
};
```

- [ ] **Step 5: Run all WordSpellSimpleConfigForm tests + the form-emits-playable test**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm src/games/word-spell/WordSpellLibrarySource`
Expected: all pass. (The existing `data-invalid` test on the form's
`firstElementChild` still passes because the wrapping div still carries that
attribute via the sub-component's root.)

If the existing form test for `data-invalid` fails because the attribute is
now on a nested element, update it to query the sub-component's container
instead — but try the run first and let it tell you.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/WordSpellLibrarySource/ src/games/word-spell/WordSpellSimpleConfigForm/
git commit -m "refactor(word-spell): extract WordSpellLibrarySource sub-component

Carved the Level + Phonemes UI out of WordSpellSimpleConfigForm into a
reusable component so the Advanced modal can reuse the exact same UI for
parity (added in the next commit). Behaviour is unchanged."
```

---

## Task 6: Wire `WordSpellLibrarySource` into Advanced via a registry hook

Add a third lookup to the config-fields registry — an optional renderer
shown above the standard `ConfigFormFields` in the Advanced modal. Word-spell
returns the new sub-component; other games leave it unset.

**Files:**

- Modify: `src/games/config-fields-registry.ts`
- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`

- [ ] **Step 1: Add the registry hook**

Edit `src/games/config-fields-registry.ts`. Add to the imports:

```ts
import { WordSpellLibrarySource } from './word-spell/WordSpellLibrarySource/WordSpellLibrarySource';
```

Append at the end of the file (after `getSimpleConfigFormRenderer`):

```ts
export const getAdvancedHeaderRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell': {
      return WordSpellLibrarySource;
    }
    default: {
      return undefined;
    }
  }
};
```

- [ ] **Step 2: Render the header in AdvancedConfigModal**

Edit `src/components/AdvancedConfigModal.tsx`:

Replace:

```ts
import { getAdvancedConfigFields } from '@/games/config-fields-registry';
```

with:

```ts
import {
  getAdvancedConfigFields,
  getAdvancedHeaderRenderer,
} from '@/games/config-fields-registry';
```

Inside the component, just below `const fields = getAdvancedConfigFields(gameId);`,
add:

```ts
const HeaderRenderer = getAdvancedHeaderRenderer(gameId);
```

Then in the JSX, just before `<ConfigFormFields ... />` (currently at line 236
of the file), insert:

```tsx
{
  HeaderRenderer && (
    <HeaderRenderer config={config} onChange={setConfig} />
  );
}
```

- [ ] **Step 3: Add a test that Advanced shows Level for word-spell**

Edit `src/components/AdvancedConfigModal.test.tsx`. Append a new `it` block
inside the existing `describe('AdvancedConfigModal', ...)`:

```tsx
it('renders the Level select for word-spell games', () => {
  render(
    <AdvancedConfigModal
      open
      onOpenChange={() => {}}
      gameId="word-spell"
      mode={{ kind: 'default' }}
      config={{
        source: {
          type: 'word-library',
          filter: { region: 'aus', level: 2, phonemesAllowed: [] },
        },
      }}
      onCancel={() => {}}
      onSaveNew={vi.fn()}
    />,
    { wrapper },
  );
  expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
});

it('does not render the Level select for non-word-spell games', () => {
  render(
    <AdvancedConfigModal
      open
      onOpenChange={() => {}}
      gameId="sort-numbers"
      mode={{ kind: 'default' }}
      config={{}}
      onCancel={() => {}}
      onSaveNew={vi.fn()}
    />,
    { wrapper },
  );
  expect(screen.queryByLabelText(/level/i)).toBeNull();
});
```

- [ ] **Step 4: Run the Advanced modal tests**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: existing 3 tests + 2 new tests = 5 passing.

- [ ] **Step 5: Commit**

```bash
git add src/games/config-fields-registry.ts src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(word-spell): expose Level + Phonemes in the Advanced modal

Adds an optional getAdvancedHeaderRenderer registry hook. Word-spell
returns the WordSpellLibrarySource component, which renders above the
standard ConfigFormFields. Other games are unaffected (hook returns
undefined for them)."
```

---

## Task 7: Add `distractorCount` to WordSpell Advanced fields

The only `AnswerGameConfig` field WordSpell's Advanced was missing.
NumberMatch already exposes it the same way.

**Files:**

- Modify: `src/games/word-spell/types.ts`

- [ ] **Step 1: Add the field**

Edit `src/games/word-spell/types.ts`. In `wordSpellConfigFields`, insert this
field after the `tileBankMode` block (line 67 in the current file):

```ts
{
  type: 'number',
  key: 'distractorCount',
  label: 'Distractor count',
  min: 1,
  max: 10,
  visibleWhen: { key: 'tileBankMode', value: 'distractors' },
},
```

- [ ] **Step 2: Add a test that the field appears only with distractor mode**

Edit `src/components/AdvancedConfigModal.test.tsx`. Append:

```tsx
it('reveals distractorCount when WordSpell tileBankMode is distractors', () => {
  render(
    <AdvancedConfigModal
      open
      onOpenChange={() => {}}
      gameId="word-spell"
      mode={{ kind: 'default' }}
      config={{ tileBankMode: 'distractors', distractorCount: 3 }}
      onCancel={() => {}}
      onSaveNew={vi.fn()}
    />,
    { wrapper },
  );
  expect(
    screen.getByLabelText(/distractor count/i),
  ).toBeInTheDocument();
});

it('hides distractorCount when WordSpell tileBankMode is exact', () => {
  render(
    <AdvancedConfigModal
      open
      onOpenChange={() => {}}
      gameId="word-spell"
      mode={{ kind: 'default' }}
      config={{ tileBankMode: 'exact' }}
      onCancel={() => {}}
      onSaveNew={vi.fn()}
    />,
    { wrapper },
  );
  expect(screen.queryByLabelText(/distractor count/i)).toBeNull();
});
```

- [ ] **Step 3: Run the tests**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: 7 passing tests.

- [ ] **Step 4: Commit**

```bash
git add src/games/word-spell/types.ts src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(word-spell): expose distractorCount in Advanced modal

Visible only when tileBankMode is distractors. Mirrors how NumberMatch
exposes the same field."
```

---

## Task 8: Default mode = `recall`

Change both the no-config fallback and the simple-mode resolver to land on
`recall`. Library-sourced rounds have no images today, so `picture` mode
silently degrades — `recall` is the synthetic-phonics target the curriculum
is built for.

**Files:**

- Modify: `src/games/word-spell/resolve-simple-config.ts`
- Modify: `src/games/word-spell/resolve-simple-config.test.ts`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Update the simple-mode resolver default**

Edit `src/games/word-spell/resolve-simple-config.ts`. Replace:

```ts
mode: 'scramble',
```

with:

```ts
mode: 'recall',
```

- [ ] **Step 2: Update the simple-config test**

Edit `src/games/word-spell/resolve-simple-config.test.ts`. Find the
assertion `expect(full.mode).toBe('scramble')` and replace with:

```ts
expect(full.mode).toBe('recall');
```

- [ ] **Step 3: Update the no-config fallback default**

Edit `src/routes/$locale/_app/game/$gameId.tsx`. In `DEFAULT_WORD_SPELL_CONFIG`
(around line 96), replace:

```ts
mode: 'picture',
```

with:

```ts
mode: 'recall',
```

- [ ] **Step 4: Run the affected suites**

Run: `yarn vitest run src/games/word-spell src/routes/$locale/_app/game/resolveWordSpellConfig.test.ts`
Expected: all pass.

If `useLibraryRounds.test.tsx` or `WordSpell.test.tsx` had assertions that
hardcoded `mode: 'picture'` for a default scenario, update those assertions
to `mode: 'recall'` — but only if they describe **the default**. Tests that
explicitly target picture mode (e.g. "picture mode shows the emoji") stay on
`picture`.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/resolve-simple-config.ts src/games/word-spell/resolve-simple-config.test.ts src/routes/$locale/_app/game/\$gameId.tsx
git commit -m "feat(word-spell): default to recall mode

Library-sourced rounds have no images, so the previous picture default
silently degraded. recall is the mode the synthetic-phonics curriculum is
designed for and is what the player actually experiences when no images are
attached."
```

---

## Task 9: Default `roundsInOrder = false`

The shuffler (`buildRoundOrder`) already accepts a `seed` parameter and
WordSpell stories that need stability already pass either `roundsInOrder: true`
or `seed="storybook"`. So flipping the default is safe — it only affects the
no-config route launch path, which isn't VR-tested. E2E tests in CI either
pass an explicit config or don't depend on round ordering.

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 1: Flip the default**

Edit `src/routes/$locale/_app/game/$gameId.tsx`. In `DEFAULT_WORD_SPELL_CONFIG`,
replace:

```ts
// Deterministic order by default. `buildRoundOrder` shuffles when this is
// false using a nanoid-based seed (crypto.getRandomValues) which VR tests
// cannot pin, causing baseline drift. Users can still opt into shuffling
// via the settings panel.
roundsInOrder: true,
```

with:

```ts
roundsInOrder: false,
```

(Drop the comment too — it described the old reasoning and is no longer
accurate. Storybook scenes that need determinism already opt into it
explicitly.)

- [ ] **Step 2: Run the route test + WordSpell tests**

Run: `yarn vitest run src/routes/$locale/_app/game src/games/word-spell`
Expected: all pass. The existing `resolveWordSpellConfig.test.ts` asserts
`expect(resolved.roundsInOrder).toBe(false)` for the simple-mode case — that
keeps passing. The advanced-mode case in the same test file asserts on
`rounds.length`, not order, so it's unaffected.

- [ ] **Step 3: Commit**

```bash
git add src/routes/$locale/_app/game/\$gameId.tsx
git commit -m "feat(word-spell): random rounds by default

Stories that need pinned ordering already pass roundsInOrder: true or seed
explicitly. The route default is the only thing that flips, and the route
isn't covered by VR baselines."
```

---

## Task 10: Remove the unused `scramble` mode

Drop the union member, the mode-select option, the slot-interaction branch,
and the `ScrambleMode` story.

**Files:**

- Modify: `src/games/word-spell/types.ts`
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.stories.tsx`

- [ ] **Step 1: Drop `scramble` from the union and select options**

Edit `src/games/word-spell/types.ts`.

Replace:

```ts
mode: 'picture' | 'scramble' | 'recall' | 'sentence-gap';
```

with:

```ts
mode: 'picture' | 'recall' | 'sentence-gap';
```

In `wordSpellConfigFields`, in the `mode` select options, delete the line:

```ts
{ value: 'scramble', label: 'scramble' },
```

- [ ] **Step 2: Simplify slot-interaction in WordSpell.tsx**

Edit `src/games/word-spell/WordSpell/WordSpell.tsx`. Lines 505-509 currently:

```ts
slotInteraction:
  resolvedConfig.mode === 'scramble' ||
  resolvedConfig.mode === 'sentence-gap'
    ? 'free-swap'
    : 'ordered',
```

Replace with:

```ts
slotInteraction:
  resolvedConfig.mode === 'sentence-gap' ? 'free-swap' : 'ordered',
```

- [ ] **Step 3: Delete the ScrambleMode story**

Edit `src/games/word-spell/WordSpell/WordSpell.stories.tsx`. Remove the
entire block (around lines 48-50):

```ts
export const ScrambleMode: Story = {
  args: { config: { ...baseConfig, mode: 'scramble' } },
};
```

- [ ] **Step 4: Run typecheck**

Run: `yarn typecheck`
Expected: no errors. If TypeScript reports any remaining `'scramble'`
reference, search and remove it:

```bash
grep -rn "'scramble'" src/
```

- [ ] **Step 5: Run all WordSpell tests**

Run: `yarn vitest run src/games/word-spell src/components/AdvancedConfigModal`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/
git commit -m "refactor(word-spell): remove unused scramble mode

Was never used in any user-facing flow. Slot-interaction simplifies to
sentence-gap → free-swap, everything else → ordered."
```

---

## Task 11: Final verification

Run every gate that pre-push will run, plus a manual smoke check.

- [ ] **Step 1: Full lint + typecheck**

Run: `yarn lint && yarn typecheck`
Expected: both pass with no errors.

- [ ] **Step 2: Full unit-test suite**

Run: `yarn test`
Expected: all suites pass.

- [ ] **Step 3: Markdown checks for the spec + plan**

Run: `yarn lint:md && npx prettier --check 'docs/superpowers/**/*.md'`
Expected: 0 errors.

- [ ] **Step 4: Manual smoke test in dev server**

Run: `yarn dev`
Open the app and:

1. Launch WordSpell with no custom config — confirm it lands on `recall`
   mode, plays in random order, draws words from level 1 cumulatively.
2. Open the Advanced modal for WordSpell — confirm Level select and Phoneme
   chips appear at the top, plus the existing fields, plus
   `distractorCount` (visible when you toggle `tileBankMode` to
   `distractors`).
3. Switch to Level 3 in the Simple form — confirm chips for /s/, /æ/, /m/,
   /b/, etc. all appear and that the game produces non-empty rounds.
4. Confirm there's no `scramble` option in the mode dropdown.

If any of these fail, fix and add a regression test before continuing.

- [ ] **Step 5: Push and update the existing PR**

```bash
git push
```

The PR (#212) auto-updates with the new commits.

---

## Self-Review Checklist

After running the plan end-to-end, confirm:

- [ ] **Spec coverage** — every spec section maps to a task above: - "Fix Level 3+" → Tasks 3 + 4 - "Advanced ⊇ Simple" — Level + Phonemes → Tasks 5 + 6 - "Advanced ⊇ Simple" — distractorCount → Task 7 - "Default mode = recall" → Task 8 - "Random by default + VR" → Task 9 (no VR change needed; verified
      stories already opt-in to determinism) - "Remove scramble" → Task 10 - "Curriculum invariant test" → Task 2 - "Form-emits-playable test" → Tasks 3 + 4 - "Cumulative-helper unit test" → Task 1
- [ ] **No placeholders** — every step shows the actual code or command.
- [ ] **Type consistency** — `WordSpellLibrarySource`, `getAdvancedHeaderRenderer`,
      and `cumulativeGraphemes` are spelled identically in every task that
      references them.
- [ ] **Commits per task** — each task produces one or two focused commits,
      never a monolithic "do everything" commit.

## Open Questions Resolved Inline

- **Seed-injection point** (deferred from spec): no change needed.
  `buildRoundOrder` already accepts a `seed`, and stories that need
  stability already pass it. The default flip in Task 9 only affects the
  no-config route, which isn't VR-tested.
- **Migration for old `scramble` configs**: no migration. Pre-launch / dev-
  only data is throwaway per the spec's non-goals.
