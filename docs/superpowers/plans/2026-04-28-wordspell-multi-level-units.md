# WordSpell Multi-Select Levels & Per-Unit Phoneme Toggles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md`

**Goal:** Replace WordSpell's single-Level Simple form with a disjoint
multi-level checkbox UI where each `(grapheme, phoneme)` unit is an
independent toggle, the level row checkbox is a derived tri-state preset,
and existing saved configs migrate cleanly via RxDB schema bumps.

**Architecture:** Pure helpers (`level-unit-selection.ts`) own the
selection-state derivations. The shared `WordSpellLibrarySource` component
renders two variants (`chips` for Simple, `checkbox-tree` for Advanced)
driven by the same data model. Persistence is `selectedUnits: { g, p }[]`.
Filter is phoneme-only — no level gate. Migration converts legacy `level +
phonemesAllowed` rows into `selectedUnits` on read.

**Tech Stack:** React + TypeScript (named exports only —
`react/function-component-definition`), Vitest + Testing Library +
userEvent, RxDB (with `migrationStrategies`), TanStack Router. The
`LevelGraphemeUnit` type is already exported from `@/data/words`.

**Required project skills (load before prescribing code in those areas):**

- `write-storybook` — if any task touches `*.stories.tsx`
- `write-e2e-vr-tests` — if any task touches `e2e/**` or VR baselines
- Markdown Authoring (CLAUDE.md §Markdown Authoring) — for the spec/plan
  edits

---

## Pre-flight

Before any task, verify the worktree state:

```bash
git rev-parse --abbrev-ref HEAD   # → feat/issue-216 (or a fresh branch off it)
pwd                                # → .../worktrees/<branch> (per CLAUDE.md)
git status --short                 # → no unstaged code changes; AO-injected
                                   #   .claude/settings.json + metadata-updater.sh
                                   #   are AO session machinery and must NOT
                                   #   be staged with feature commits.
```

If `pwd` is under `~/.worktrees/...`, that's an AO-spawned worktree at the
non-standard path — branch is fine, but avoid `git worktree move` mid-session.
Use `git add <specific-paths>` only — never `git add .` or `-A`.

PR #219 already shipped: `WordSpellLibrarySource` shell, `getAdvancedHeaderRenderer`
hook, `recall` default, scramble removal, `distractorCount` field, and
`levels.test.ts` (cumulative-graphemes contract). This plan rewrites the form
internals on top of that base.

---

## File Structure

**Create:**

- `src/games/word-spell/level-unit-selection.ts` — pure helpers
- `src/games/word-spell/level-unit-selection.test.ts` — helper unit tests
- `src/db/migrations/word-spell-multi-level.ts` — `migrateWordSpellConfig`
- `src/db/migrations/word-spell-multi-level.test.ts` — migration tests
- `src/db/migrations/word-spell-multi-level.collection.test.ts` —
  v2→v3 / v1→v2 round-trip tests for both collections

**Modify:**

- `src/games/word-spell/types.ts` — `WordSpellSimpleConfig.selectedUnits`
- `src/games/word-spell/resolve-simple-config.ts` — selectedUnits-aware,
  legacy coercion fallback
- `src/games/word-spell/resolve-simple-config.test.ts` — covers new shape
  and legacy coercion
- `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`
  — rewrite internals; add `variant` prop
- `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`
  — covers both variants
- `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`
  — drives the new widget
- `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx`
  — adapts to the new sub-component
- `src/data/words/curriculum-invariant.test.ts` — per-level (not cumulative)
- `src/games/config-fields-registry.ts` — Advanced wrapper passes
  `variant="checkbox-tree"`
- `src/db/schemas/saved_game_configs.ts` — `version: 3`
- `src/db/schemas/custom_games.ts` — `version: 2`
- `src/db/create-database.ts` — wire migration strategies

**Audit (no code change unless they break):**

- `src/games/word-spell/WordSpell/WordSpell.stories.tsx`
- `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx`
- `src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx`

---

## Task 1: Pure helpers — `level-unit-selection.ts`

These are the selection-state derivations the UI consumes. Pure functions,
trivially unit-testable.

**Files:**

- Create: `src/games/word-spell/level-unit-selection.ts`
- Create: `src/games/word-spell/level-unit-selection.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/games/word-spell/level-unit-selection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  defaultSelection,
  toggleLevel,
  toggleUnit,
  triStateForLevel,
} from './level-unit-selection';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []) as LevelGraphemeUnit[];
const L2 = (GRAPHEMES_BY_LEVEL[2] ?? []) as LevelGraphemeUnit[];

describe('triStateForLevel', () => {
  it('returns "unchecked" when no L1 units are selected', () => {
    expect(triStateForLevel(1, [])).toBe('unchecked');
  });

  it('returns "checked" when every L1 unit is selected', () => {
    expect(triStateForLevel(1, [...L1])).toBe('checked');
  });

  it('returns "indeterminate" when some L1 units are selected', () => {
    expect(triStateForLevel(1, [L1[0]!])).toBe('indeterminate');
  });

  it('treats other levels independently', () => {
    expect(triStateForLevel(2, [...L1])).toBe('unchecked');
  });
});

describe('toggleLevel', () => {
  it('adds every unit at the level when next="checked"', () => {
    const result = toggleLevel(1, [], 'checked');
    expect(result).toHaveLength(L1.length);
  });

  it('removes every unit at the level when next="unchecked"', () => {
    const result = toggleLevel(1, [...L1, ...L2], 'unchecked');
    expect(result).toEqual(L2);
  });

  it('does not duplicate units already in the selection', () => {
    const result = toggleLevel(1, [L1[0]!], 'checked');
    expect(result).toHaveLength(L1.length);
  });
});

describe('toggleUnit', () => {
  it('adds the unit when absent', () => {
    const u = L1[0]!;
    expect(toggleUnit(u, [])).toEqual([u]);
  });

  it('removes the unit when present', () => {
    const u = L1[0]!;
    expect(toggleUnit(u, [u])).toEqual([]);
  });

  it('treats (g, p) as the identity — different grapheme, same phoneme stay independent', () => {
    const sL1 = { g: 's', p: 's' } as LevelGraphemeUnit;
    const cL4 = { g: 'c', p: 's' } as LevelGraphemeUnit;
    const after = toggleUnit(cL4, [sL1]);
    expect(after).toContainEqual(sL1);
    expect(after).toContainEqual(cL4);
  });
});

describe('defaultSelection', () => {
  it('returns every unit at level 1', () => {
    expect(defaultSelection()).toEqual(L1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/games/word-spell/level-unit-selection.test.ts`
Expected: FAIL — `Cannot find module './level-unit-selection'`.

- [ ] **Step 3: Implement the helpers**

Create `src/games/word-spell/level-unit-selection.ts`:

```ts
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

export type Tri = 'checked' | 'unchecked' | 'indeterminate';

const sameUnit = (
  a: LevelGraphemeUnit,
  b: LevelGraphemeUnit,
): boolean => a.g === b.g && a.p === b.p;

const unitsAt = (level: number): LevelGraphemeUnit[] =>
  (GRAPHEMES_BY_LEVEL[level] ?? []) as LevelGraphemeUnit[];

export const triStateForLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
): Tri => {
  const units = unitsAt(level);
  if (units.length === 0) return 'unchecked';
  const onCount = units.filter((u) =>
    selected.some((s) => sameUnit(s, u)),
  ).length;
  if (onCount === 0) return 'unchecked';
  if (onCount === units.length) return 'checked';
  return 'indeterminate';
};

export const toggleLevel = (
  level: number,
  selected: readonly LevelGraphemeUnit[],
  next: 'checked' | 'unchecked',
): LevelGraphemeUnit[] => {
  const units = unitsAt(level);
  const withoutLevel = selected.filter(
    (s) => !units.some((u) => sameUnit(u, s)),
  );
  return next === 'checked'
    ? [...withoutLevel, ...units]
    : withoutLevel;
};

export const toggleUnit = (
  unit: LevelGraphemeUnit,
  selected: readonly LevelGraphemeUnit[],
): LevelGraphemeUnit[] => {
  const present = selected.some((s) => sameUnit(s, unit));
  return present
    ? selected.filter((s) => !sameUnit(s, unit))
    : [...selected, unit];
};

export const defaultSelection = (): LevelGraphemeUnit[] => unitsAt(1);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/games/word-spell/level-unit-selection.test.ts`
Expected: PASS — all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/games/word-spell/level-unit-selection.ts \
        src/games/word-spell/level-unit-selection.test.ts
git commit -m "feat(word-spell): pure helpers for multi-level unit selection

Adds triStateForLevel, toggleLevel, toggleUnit, defaultSelection — pure
functions that derive level-row tri-state and apply bulk/individual
toggles over a list of (grapheme, phoneme) units. The UI rewrite consumes
these in the next tasks."
```

---

## Task 2: Migration helper — `migrateWordSpellConfig`

Pure converter from legacy `{ level, phonemesAllowed }` (simple or full
config) to the new `selectedUnits` shape. Idempotent, gameId-scoped.

**Files:**

- Create: `src/db/migrations/word-spell-multi-level.ts`
- Create: `src/db/migrations/word-spell-multi-level.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/db/migrations/word-spell-multi-level.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { migrateWordSpellConfig } from './word-spell-multi-level';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

describe('migrateWordSpellConfig', () => {
  it('passes through non-WordSpell docs unchanged', () => {
    const doc = { gameId: 'sort-numbers', config: { foo: 1 } };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });

  it('passes through docs that already have selectedUnits', () => {
    const doc = {
      gameId: 'word-spell',
      config: { selectedUnits: [{ g: 's', p: 's' }] },
    };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });

  it('migrates the simple-config legacy shape', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: ['s', 'm'],
        inputMethod: 'drag',
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: { g: string; p: string }[] };
    };
    // Every (g, /s/) and (g, /m/) unit in L1..L2 must be present
    const expected = [
      ...(GRAPHEMES_BY_LEVEL[1] ?? []),
      ...(GRAPHEMES_BY_LEVEL[2] ?? []),
    ].filter((u) => u.p === 's' || u.p === 'm');
    expect(next.config.selectedUnits).toEqual(expected);
  });

  it('migrates the full-config source.filter legacy shape', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'advanced',
        source: {
          type: 'word-library',
          filter: {
            region: 'aus',
            level: 4,
            phonemesAllowed: ['s'],
          },
        },
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: { g: string; p: string }[] };
    };
    const units = next.config.selectedUnits;
    // Cross-level reach preserved: 's' at L1 AND 'c' at L4 (both teach /s/)
    expect(units).toContainEqual({ g: 's', p: 's' });
    expect(units).toContainEqual({ g: 'c', p: 's' });
  });

  it('returns empty selectedUnits when phonemesAllowed is empty', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: [],
        inputMethod: 'drag',
      },
    };
    const next = migrateWordSpellConfig(doc) as {
      config: { selectedUnits: unknown[] };
    };
    expect(next.config.selectedUnits).toEqual([]);
  });

  it('passes through hand-authored full configs (no source) unchanged', () => {
    const doc = {
      gameId: 'word-spell',
      config: {
        configMode: 'advanced',
        rounds: [{ word: 'cat' }],
      },
    };
    expect(migrateWordSpellConfig(doc)).toBe(doc);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/db/migrations/word-spell-multi-level.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the migration helper**

Create `src/db/migrations/word-spell-multi-level.ts`:

```ts
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

const buildSelectedUnits = (
  level: number,
  phonemesAllowed: readonly string[],
): LevelGraphemeUnit[] => {
  const out: LevelGraphemeUnit[] = [];
  for (let lvl = 1; lvl <= level; lvl++) {
    for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
      if (phonemesAllowed.includes(u.p)) out.push(u);
    }
  }
  return out;
};

export const migrateWordSpellConfig = (
  doc: Record<string, unknown>,
): Record<string, unknown> => {
  if (doc.gameId !== 'word-spell') return doc;

  const config = doc.config as Record<string, unknown> | undefined;
  if (!config) return doc;
  if (Array.isArray(config.selectedUnits)) return doc;

  if (
    config.configMode === 'simple' &&
    typeof config.level === 'number' &&
    Array.isArray(config.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          config.level,
          config.phonemesAllowed as string[],
        ),
      },
    };
  }

  const source = config.source as
    | { filter?: { level?: number; phonemesAllowed?: string[] } }
    | undefined;
  if (
    source?.filter &&
    typeof source.filter.level === 'number' &&
    Array.isArray(source.filter.phonemesAllowed)
  ) {
    return {
      ...doc,
      config: {
        ...config,
        selectedUnits: buildSelectedUnits(
          source.filter.level,
          source.filter.phonemesAllowed,
        ),
      },
    };
  }

  return doc;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/db/migrations/word-spell-multi-level.test.ts`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/word-spell-multi-level.ts \
        src/db/migrations/word-spell-multi-level.test.ts
git commit -m "feat(db): add migrateWordSpellConfig for legacy WordSpell shapes

Pure converter — given a saved_game_configs / custom_games doc, fills in
selectedUnits from the legacy {level, phonemesAllowed} (simple) or
source.filter.{level, phonemesAllowed} (full) fields. Idempotent;
non-WordSpell docs and hand-authored configs are passed through. Cross-
level phoneme reach preserved (e.g. /s/ via 's' at L1 AND 'c' at L4)."
```

---

## Task 3: Schema bumps + DB wiring + collection migration tests

Bump `saved_game_configs` to v3 and `custom_games` to v2. Wire
`migrateWordSpellConfig` into both collections via `migrationStrategies`.

**Files:**

- Modify: `src/db/schemas/saved_game_configs.ts`
- Modify: `src/db/schemas/custom_games.ts`
- Modify: `src/db/create-database.ts`
- Create: `src/db/migrations/word-spell-multi-level.collection.test.ts`

- [ ] **Step 1: Write the failing collection-level test**

Create `src/db/migrations/word-spell-multi-level.collection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '@/db/create-database';

describe('word-spell multi-level migration — collection round-trip', () => {
  it('migrates a legacy saved_game_configs simple-config doc on read', async () => {
    const db = await createTestDatabase();
    await db.saved_game_configs.insert({
      id: 'last:anonymous:word-spell',
      profileId: 'anonymous',
      gameId: 'word-spell',
      name: 'Last session',
      config: {
        configMode: 'simple',
        level: 2,
        phonemesAllowed: ['s', 'm'],
        inputMethod: 'drag',
      },
      createdAt: new Date().toISOString(),
      color: 'indigo',
    } as never);

    const doc = await db.saved_game_configs
      .findOne('last:anonymous:word-spell')
      .exec();
    const config = doc?.toJSON().config as Record<string, unknown>;
    expect(Array.isArray(config.selectedUnits)).toBe(true);
    expect(
      (config.selectedUnits as { p: string }[]).every(
        (u) => u.p === 's' || u.p === 'm',
      ),
    ).toBe(true);
  });

  it('migrates a legacy custom_games full-config doc on read', async () => {
    const db = await createTestDatabase();
    await db.custom_games.insert({
      id: 'cg-1',
      profileId: 'anonymous',
      gameId: 'word-spell',
      name: 'My WS',
      config: {
        configMode: 'advanced',
        source: {
          type: 'word-library',
          filter: {
            region: 'aus',
            level: 4,
            phonemesAllowed: ['s'],
          },
        },
      },
      createdAt: new Date().toISOString(),
      color: 'indigo',
    } as never);

    const doc = await db.custom_games.findOne('cg-1').exec();
    const config = doc?.toJSON().config as Record<string, unknown>;
    const units = config.selectedUnits as { g: string; p: string }[];
    expect(units).toContainEqual({ g: 's', p: 's' });
    expect(units).toContainEqual({ g: 'c', p: 's' });
  });
});
```

(`createTestDatabase` runs migrations automatically — it constructs the DB
at the latest schema version, so docs inserted under `as never` go through
migration on the next read. If the in-memory test storage doesn't run
migrations, the test will reveal it by failing here.)

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/db/migrations/word-spell-multi-level.collection.test.ts`
Expected: FAIL — `selectedUnits` is undefined because no migration is
wired yet.

- [ ] **Step 3: Bump schemas**

Edit `src/db/schemas/saved_game_configs.ts`. Replace:

```ts
export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> =
  {
    version: 2,
```

with:

```ts
export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> =
  {
    version: 3,
```

Edit `src/db/schemas/custom_games.ts`. Replace:

```ts
export const customGamesSchema: RxJsonSchema<CustomGameDoc> = {
  version: 1,
```

with:

```ts
export const customGamesSchema: RxJsonSchema<CustomGameDoc> = {
  version: 2,
```

- [ ] **Step 4: Wire migration strategies**

Edit `src/db/create-database.ts`. Add to the imports near the top:

```ts
import { migrateWordSpellConfig } from '@/db/migrations/word-spell-multi-level';
```

Update the `saved_game_configs` block:

```ts
saved_game_configs: {
  schema: savedGameConfigsSchema,
  migrationStrategies: {
    1: (oldDoc: Record<string, unknown>) => ({
      ...oldDoc,
      color: 'indigo',
    }),
    2: (oldDoc: Record<string, unknown>) => oldDoc,
    3: migrateWordSpellConfig,
  },
},
```

Update the `custom_games` block (currently `{ schema: customGamesSchema }`):

```ts
custom_games: {
  schema: customGamesSchema,
  migrationStrategies: {
    2: migrateWordSpellConfig,
  },
},
```

- [ ] **Step 5: Run the collection-level test**

Run: `yarn vitest run src/db/migrations/word-spell-multi-level.collection.test.ts`
Expected: PASS — `selectedUnits` is populated via the wired strategy.

- [ ] **Step 6: Run the broader DB suite to confirm no regression**

Run: `yarn vitest run src/db`
Expected: all DB tests pass; the existing `create-database.test.ts`,
`migrate-custom-games.test.ts`, and friends keep their counts.

- [ ] **Step 7: Commit**

```bash
git add src/db/schemas/saved_game_configs.ts \
        src/db/schemas/custom_games.ts \
        src/db/create-database.ts \
        src/db/migrations/word-spell-multi-level.collection.test.ts
git commit -m "feat(db): wire WordSpell multi-level migration into RxDB collections

saved_game_configs schema bumps v2→v3, custom_games schema bumps v1→v2;
migrateWordSpellConfig is the migration strategy for the new versions.
Existing player saves (incl. last:anonymous:word-spell) get selectedUnits
populated transparently on first read after upgrade."
```

---

## Task 4: `WordSpellSimpleConfig` type + `resolveSimpleConfig` legacy coercion

Update the simple-config type to carry `selectedUnits`. Make
`resolveSimpleConfig` derive `phonemesAllowed` and `graphemesAllowed` from
the units. Make `advancedToSimple` populate `selectedUnits` from a full
config's `source.filter`. Both functions accept legacy fields at read-time
as belt-and-suspenders for any doc that escaped the migration.

**Files:**

- Modify: `src/games/word-spell/types.ts`
- Modify: `src/games/word-spell/resolve-simple-config.ts`
- Modify: `src/games/word-spell/resolve-simple-config.test.ts`

- [ ] **Step 1: Update the type**

Edit `src/games/word-spell/types.ts`. Replace the existing
`WordSpellSimpleConfig`:

```ts
export type WordSpellSimpleConfig = {
  configMode: 'simple';
  level: number;
  phonemesAllowed: string[];
  inputMethod: 'drag' | 'type' | 'both';
};
```

with:

```ts
import type { LevelGraphemeUnit, Region } from '@/data/words';

export type WordSpellSimpleConfig = {
  configMode: 'simple';
  selectedUnits: LevelGraphemeUnit[];
  region: Region;
  inputMethod: 'drag' | 'type' | 'both';
};
```

Add the imports if not already present at the top of the file (the file
already imports from `@/data/words`; check and dedupe).

- [ ] **Step 2: Write the failing resolver tests**

Edit `src/games/word-spell/resolve-simple-config.test.ts`. Replace the file
with:

```ts
import { describe, expect, it } from 'vitest';
import {
  advancedToSimple,
  resolveSimpleConfig,
} from './resolve-simple-config';
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []).slice();

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

  it('derives phonemesAllowed and graphemesAllowed from selectedUnits', () => {
    const simple: WordSpellSimpleConfig = {
      configMode: 'simple',
      selectedUnits: [
        { g: 's', p: 's' },
        { g: 'a', p: 'æ' },
      ],
      region: 'aus',
      inputMethod: 'drag',
    };
    const full = resolveSimpleConfig(simple);
    expect(full.source?.filter.phonemesAllowed).toEqual(['s', 'æ']);
    expect(full.source?.filter.graphemesAllowed).toEqual(['s', 'a']);
  });
});

describe('advancedToSimple', () => {
  it('populates selectedUnits from source.filter.{level, phonemesAllowed}', () => {
    const config = {
      gameId: 'word-spell',
      component: 'WordSpell',
      mode: 'recall',
      tileUnit: 'letter',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-manual',
      ttsEnabled: true,
      roundsInOrder: false,
      totalRounds: 4,
      tileBankMode: 'exact',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          level: 1,
          phonemesAllowed: ['s'],
        },
      },
    } as WordSpellConfig;
    const simple = advancedToSimple(config);
    expect(simple.region).toBe('aus');
    expect(simple.selectedUnits).toEqual([{ g: 's', p: 's' }]);
  });

  it('falls back to L1 default when no source is present', () => {
    const config = {
      gameId: 'word-spell',
      component: 'WordSpell',
      mode: 'recall',
      tileUnit: 'letter',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-manual',
      ttsEnabled: true,
      roundsInOrder: false,
      totalRounds: 4,
      tileBankMode: 'exact',
    } as WordSpellConfig;
    const simple = advancedToSimple(config);
    expect(simple.selectedUnits).toEqual(L1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn vitest run src/games/word-spell/resolve-simple-config.test.ts`
Expected: FAIL — type errors and missing `graphemesAllowed`.

- [ ] **Step 4: Update the resolver**

Replace the contents of `src/games/word-spell/resolve-simple-config.ts`
with:

```ts
import { defaultSelection } from './level-unit-selection';
import type { WordSpellConfig, WordSpellSimpleConfig } from './types';
import type { LevelGraphemeUnit } from '@/data/words';

const phonemesOf = (units: readonly LevelGraphemeUnit[]): string[] => [
  ...new Set(units.map((u) => u.p)),
];

const graphemesOf = (units: readonly LevelGraphemeUnit[]): string[] => [
  ...new Set(units.map((u) => u.g)),
];

export const resolveSimpleConfig = (
  simple: WordSpellSimpleConfig,
): WordSpellConfig => ({
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
      region: simple.region,
      phonemesAllowed: phonemesOf(simple.selectedUnits),
      graphemesAllowed: graphemesOf(simple.selectedUnits),
    },
  },
});

export const advancedToSimple = (
  config: WordSpellConfig,
): WordSpellSimpleConfig => {
  const filter = config.source?.filter;
  const region = filter?.region ?? 'aus';

  // Prefer explicit selectedUnits if the saved config carries them
  // (post-migration shape). Otherwise derive from legacy
  // {level, phonemesAllowed} as a belt-and-suspenders fallback for any
  // doc that escaped the RxDB migration.
  const explicitUnits = (
    filter as { selectedUnits?: LevelGraphemeUnit[] }
  )?.selectedUnits;
  if (Array.isArray(explicitUnits) && explicitUnits.length > 0) {
    return {
      configMode: 'simple',
      selectedUnits: explicitUnits,
      region,
      inputMethod: config.inputMethod,
    };
  }

  if (
    typeof filter?.level === 'number' &&
    Array.isArray(filter.phonemesAllowed)
  ) {
    // Use the same conversion the migration uses, but inline to avoid a
    // dependency cycle between the resolver and the DB layer.
    const { GRAPHEMES_BY_LEVEL } = require('@/data/words') as {
      GRAPHEMES_BY_LEVEL: Record<
        number,
        LevelGraphemeUnit[] | undefined
      >;
    };
    const out: LevelGraphemeUnit[] = [];
    for (let lvl = 1; lvl <= filter.level; lvl++) {
      for (const u of GRAPHEMES_BY_LEVEL[lvl] ?? []) {
        if ((filter.phonemesAllowed as string[]).includes(u.p)) {
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

> Note: `require('@/data/words')` is used inside the function to avoid an
> import cycle between `resolve-simple-config.ts` and the migration layer.
> If TS or ESM tooling rejects `require`, replace with a top-level
> `import { GRAPHEMES_BY_LEVEL } from '@/data/words'` — the cycle warning
> is acceptable because both modules tree-shake the helper.

Also update the `WordSpellSource` filter type if it doesn't already have
`graphemesAllowed` exposed. Check `src/data/words/types.ts` — the
`WordFilter` type already has it (verified during brainstorm); if
`WordSpellSource.filter` derives from `WordFilter`, no change needed.

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn vitest run src/games/word-spell/resolve-simple-config.test.ts`
Expected: PASS — all 4 tests.

- [ ] **Step 6: Run the broader word-spell suite**

Run: `yarn vitest run src/games/word-spell`
Expected: PASS for `level-unit-selection`, `resolve-simple-config`. The
`WordSpellLibrarySource` and `WordSpellSimpleConfigForm` tests will fail
here because they still reference the old type — that's expected and
fixed by Tasks 5–7. Note the failures and continue.

- [ ] **Step 7: Commit**

```bash
git add src/games/word-spell/types.ts \
        src/games/word-spell/resolve-simple-config.ts \
        src/games/word-spell/resolve-simple-config.test.ts
git commit -m "feat(word-spell): WordSpellSimpleConfig stores selectedUnits

Replaces the legacy {level, phonemesAllowed} fields with a
LevelGraphemeUnit[] selectedUnits and a region field. resolveSimpleConfig
derives phonemesAllowed + graphemesAllowed from the units; advancedToSimple
prefers explicit selectedUnits, falls back to legacy {level,
phonemesAllowed}, falls back to L1 default."
```

---

## Task 5: `WordSpellLibrarySource` — `chips` variant rewrite

Rewrite the component internals to render multi-row chips. Each level row
has a tri-state checkbox + chip pills for that level's units. Selection
state is `selectedUnits`. The component continues to live in the registry
slot used by both Simple form and Advanced modal — Advanced's variant
swap comes in Task 7.

**Files:**

- Modify: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`
- Modify: `src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`

- [ ] **Step 1: Rewrite the test file**

Replace the contents of
`src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.test.tsx`
with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []).slice();

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

describe('WordSpellLibrarySource — chips variant (default)', () => {
  it('renders 8 level rows', () => {
    render(<Harness initial={L1} />);
    for (let n = 1; n <= 8; n++) {
      expect(screen.getByLabelText(`Level ${n}`)).toBeInTheDocument();
    }
  });

  it('shows the L1 row checkbox as checked when all L1 units are selected', () => {
    render(<Harness initial={L1} />);
    const cb = screen.getByLabelText('Level 1') as HTMLInputElement;
    expect(cb.checked).toBe(true);
    expect(cb.indeterminate).toBe(false);
  });

  it('shows the L1 row checkbox as indeterminate when one L1 unit is missing', () => {
    render(<Harness initial={L1.slice(1)} />);
    const cb = screen.getByLabelText('Level 1') as HTMLInputElement;
    expect(cb.indeterminate).toBe(true);
  });

  it('shows the L2 row checkbox as unchecked when no L2 units are selected', () => {
    render(<Harness initial={L1} />);
    const cb = screen.getByLabelText('Level 2') as HTMLInputElement;
    expect(cb.checked).toBe(false);
    expect(cb.indeterminate).toBe(false);
  });

  it('clicking a row checkbox toggles every chip in that row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const l2 = screen.getByLabelText('Level 2');
    await user.click(l2);
    // Now L2 should be checked; L2 chips should all be aria-pressed=true
    const l2Chips = (GRAPHEMES_BY_LEVEL[2] ?? []).map((u) =>
      screen.getByRole('button', {
        name: new RegExp(`${u.g} \\/${u.p}\\/`, 'i'),
      }),
    );
    for (const chip of l2Chips) {
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it('clicking an individual chip toggles just that unit and updates the row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const firstL1Chip = screen.getByRole('button', {
      name: new RegExp(`${L1[0]!.g} \\/${L1[0]!.p}\\/`, 'i'),
    });
    await user.click(firstL1Chip);
    expect(firstL1Chip).toHaveAttribute('aria-pressed', 'false');
    const l1 = screen.getByLabelText('Level 1') as HTMLInputElement;
    expect(l1.indeterminate).toBe(true);
  });

  it('renders L1 `s /s/` and L4 `c /s/` as independent chips', () => {
    render(<Harness initial={L1} />);
    const sL1 = screen.getByRole('button', { name: /s \/s\//i });
    const cL4 = screen.getByRole('button', { name: /c \/s\//i });
    expect(sL1).not.toBe(cL4);
  });

  it('flags data-invalid when selectedUnits is empty', () => {
    const { container } = render(<Harness initial={[]} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });
});
```

> The harness intentionally types `config` as `Record<string, unknown>` —
> the component's prop boundary takes that shape so we don't have to
> import `WordSpellSimpleConfig` here.

- [ ] **Step 2: Run the test to confirm it fails**

Run: `yarn vitest run src/games/word-spell/WordSpellLibrarySource`
Expected: FAIL — old chip layout doesn't render multi-row checkboxes /
labels.

- [ ] **Step 3: Replace the component implementation**

Replace the contents of
`src/games/word-spell/WordSpellLibrarySource/WordSpellLibrarySource.tsx`
with:

```tsx
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import {
  defaultSelection,
  toggleLevel,
  toggleUnit,
  triStateForLevel,
} from '../level-unit-selection';
import { ChipStrip } from '@/components/config/ChipStrip';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

export type LibrarySourceVariant = 'chips' | 'checkbox-tree';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  variant?: LibrarySourceVariant;
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

const chipsForLevel = (
  level: number,
): { value: string; label: string; units: LevelGraphemeUnit[] }[] => {
  // Collapse multiple graphemes that share the same phoneme at one level
  // into a single chip (e.g. L2 `c, k, ck /k/`).
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

const LevelRowChips = ({
  level,
  selected,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const tri = triStateForLevel(level, selected);
  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = tri === 'indeterminate';
  }, [tri]);

  const chips = chipsForLevel(level);
  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);
  const selectedChipValues = chips
    .filter((c) => c.units.every(isUnitOn))
    .map((c) => c.value);

  const handleRow = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        tri === 'checked' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (next: string[]) => {
    let acc = selected;
    for (const c of chips) {
      const wantOn = next.includes(c.value);
      const isOn = c.units.every(isUnitOn);
      if (wantOn !== isOn) {
        for (const u of c.units) acc = toggleUnit(u, acc);
      }
    }
    onChange(acc);
  };

  const dimmed = tri === 'unchecked';
  return (
    <div
      className={`flex flex-col gap-2 ${dimmed ? 'opacity-60' : ''}`.trim()}
    >
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          ref={cbRef}
          type="checkbox"
          checked={tri === 'checked'}
          onChange={handleRow}
          aria-label={`Level ${level}`}
        />
        Level {level}
      </label>
      <ChipStrip
        chips={chips.map(({ value, label }) => ({ value, label }))}
        selected={selectedChipValues}
        mode="toggleable"
        onChange={handleChip}
      />
    </div>
  );
};

const LevelRowCheckboxTree = ({
  level,
  selected,
  onChange,
}: {
  level: number;
  selected: LevelGraphemeUnit[];
  onChange: (next: LevelGraphemeUnit[]) => void;
}): JSX.Element => {
  const tri = triStateForLevel(level, selected);
  const cbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (cbRef.current)
      cbRef.current.indeterminate = tri === 'indeterminate';
  }, [tri]);

  const chips = chipsForLevel(level);
  const isUnitOn = (u: LevelGraphemeUnit): boolean =>
    selected.some((s) => s.g === u.g && s.p === u.p);

  const handleRow = () => {
    onChange(
      toggleLevel(
        level,
        selected,
        tri === 'checked' ? 'unchecked' : 'checked',
      ),
    );
  };

  const handleChip = (units: LevelGraphemeUnit[]) => {
    let acc = selected;
    for (const u of units) acc = toggleUnit(u, acc);
    onChange(acc);
  };

  return (
    <li>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          ref={cbRef}
          type="checkbox"
          checked={tri === 'checked'}
          onChange={handleRow}
          aria-label={`Level ${level}`}
        />
        Level {level}
      </label>
      <ul className="ml-6 mt-1 flex flex-col gap-1">
        {chips.map((c) => (
          <li key={c.value}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={c.units.every(isUnitOn)}
                onChange={() => handleChip(c.units)}
                aria-label={c.label}
              />
              {c.label}
            </label>
          </li>
        ))}
      </ul>
    </li>
  );
};

export const WordSpellLibrarySource = ({
  config,
  onChange,
  variant = 'chips',
}: Props): JSX.Element => {
  const selected = readSelected(config);
  const invalid = selected.length === 0;

  const setSelected = (next: LevelGraphemeUnit[]) => {
    onChange({ ...config, selectedUnits: next });
  };

  if (variant === 'checkbox-tree') {
    return (
      <div data-invalid={invalid ? 'true' : 'false'}>
        <ul className="flex flex-col gap-2">
          {LEVELS.map((n) => (
            <LevelRowCheckboxTree
              key={n}
              level={n}
              selected={selected}
              onChange={setSelected}
            />
          ))}
        </ul>
        {invalid && (
          <p className="mt-2 text-xs text-destructive">
            Pick at least one sound to play.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-invalid={invalid ? 'true' : 'false'}
    >
      {LEVELS.map((n) => (
        <LevelRowChips
          key={n}
          level={n}
          selected={selected}
          onChange={setSelected}
        />
      ))}
      {invalid && (
        <p className="mt-2 text-xs text-destructive">
          Pick at least one sound to play.
        </p>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run the chips-variant tests**

Run: `yarn vitest run src/games/word-spell/WordSpellLibrarySource`
Expected: PASS — all 8 tests in the chips suite.

- [ ] **Step 5: Run the simple-form tests (they consume this component)**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm`
Expected: the existing `WordSpellSimpleConfigForm.test.tsx` may fail
because the wrapping div structure changed — that's covered in Task 9.
For now, note the failures and continue.

- [ ] **Step 6: Commit**

```bash
git add src/games/word-spell/WordSpellLibrarySource/
git commit -m "feat(word-spell): rewrite WordSpellLibrarySource for multi-level units

Renders 8 level rows. Each row is a tri-state checkbox (state derived
from triStateForLevel) plus a chip strip of (grapheme, phoneme) units.
Multiple graphemes for one phoneme at the same level still collapse
into a single chip (e.g. L2 'c, k, ck /k/'). Cross-level same-phoneme
chips remain independent (L1 's /s/' vs L4 'c /s/').

Adds a 'variant' prop ('chips' | 'checkbox-tree') so the same data model
drives both the Simple-form chip UI and the Advanced-modal nested
checkbox list (wired up in the next commit)."
```

---

## Task 6: Wire `checkbox-tree` variant into Advanced via the registry

The component's `checkbox-tree` variant is already implemented in Task 5.
This task wires the `getAdvancedHeaderRenderer` registry slot to pass that
variant prop.

**Files:**

- Modify: `src/games/config-fields-registry.ts`

- [ ] **Step 1: Update the registry**

Edit `src/games/config-fields-registry.ts`. The current `getAdvancedHeaderRenderer`:

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

Replace with a wrapper that pins `variant="checkbox-tree"`:

```ts
import type { JSX } from 'react';

const WordSpellAdvancedHeader = (props: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => (
  <WordSpellLibrarySource {...props} variant="checkbox-tree" />
);

export const getAdvancedHeaderRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell': {
      return WordSpellAdvancedHeader;
    }
    default: {
      return undefined;
    }
  }
};
```

- [ ] **Step 2: Update the AdvancedConfigModal tests**

Edit `src/components/AdvancedConfigModal.test.tsx`. The two tests added in
PR #219 — `renders the Level select for word-spell games` and `does not
render the Level select for non-word-spell games` — use
`getByLabelText(/level/i)`. With the new widget, the Advanced modal
renders `Level 1`, `Level 2`, … checkboxes. Update the WordSpell test:

Find:

```tsx
it('renders the Level select for word-spell games', () => {
  ...
  expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
});
```

Replace with:

```tsx
it('renders Level rows (checkbox-tree) for word-spell games', () => {
  render(
    <AdvancedConfigModal
      open
      onOpenChange={() => {}}
      gameId="word-spell"
      mode={{ kind: 'default' }}
      config={{ selectedUnits: [] }}
      onCancel={() => {}}
      onSaveNew={vi.fn()}
    />,
    { wrapper },
  );
  expect(screen.getByLabelText(/level 1/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/level 8/i)).toBeInTheDocument();
});
```

The non-WordSpell test still passes — querying `/level 1/i` returns null
for `sort-numbers`. Leave it as-is.

- [ ] **Step 3: Run the modal tests**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: PASS — 15 tests (the new `level 1`/`level 8` assertions plus
the 13 existing).

- [ ] **Step 4: Commit**

```bash
git add src/games/config-fields-registry.ts \
        src/components/AdvancedConfigModal.test.tsx
git commit -m "feat(word-spell): Advanced modal renders the checkbox-tree variant

The shared WordSpellLibrarySource gets variant='checkbox-tree' through
a thin wrapper in the registry. Same data model, plain nested checkbox
list — no chip styling — fitting the Advanced modal's denser aesthetic."
```

---

## Task 7: Rewrite `curriculum-invariant.test.ts` (per-level, not cumulative)

The previous version asserted "cumulative phonemes for level N yield ≥ 4
hits". With the new model, each level is independently selectable, so the
invariant tightens: every level's units alone must yield ≥ 1 playable word
(when used as the _only_ `selectedUnits` for that filter).

**Files:**

- Modify: `src/data/words/curriculum-invariant.test.ts`

- [ ] **Step 1: Replace the test**

Replace the file's contents with:

```ts
import { describe, expect, it } from 'vitest';
import { filterWords } from './filter';
import { ALL_REGIONS, GRAPHEMES_BY_LEVEL } from './levels';

const MIN_PLAYABLE_HITS = 1;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('curriculum invariant: every level alone is playable', () => {
  for (const region of ALL_REGIONS) {
    for (const level of LEVELS) {
      it(`${region} L${level}: alone yields ≥ ${MIN_PLAYABLE_HITS} word(s)`, async () => {
        const units = GRAPHEMES_BY_LEVEL[level] ?? [];
        const phonemesAllowed = [...new Set(units.map((u) => u.p))];
        const graphemesAllowed = [...new Set(units.map((u) => u.g))];
        const result = await filterWords({
          region,
          phonemesAllowed,
          graphemesAllowed,
        });
        expect(result.hits.length).toBeGreaterThanOrEqual(
          MIN_PLAYABLE_HITS,
        );
      });
    }
  }
});
```

> The filter no longer takes `level`. It uses `phonemesAllowed +
graphemesAllowed` only — matches the spec's "filter contract — phoneme-only,
> no level gate." If `filterWords`'s implementation requires a `level` field
> for some indexing path, narrow the test to AUS only and add a follow-up
> issue to relax the indexing constraint.

- [ ] **Step 2: Run the test**

Run: `yarn vitest run src/data/words/curriculum-invariant.test.ts`
Expected: PASS — 32 tests (4 regions × 8 levels). If a level alone yields
0 hits in any region, that's a real curriculum gap — STOP and report.

- [ ] **Step 3: Commit**

```bash
git add src/data/words/curriculum-invariant.test.ts
git commit -m "test(word-spell): curriculum invariant — every level alone is playable

Replaces the cumulative-phoneme version. Each level is now independently
selectable, so the invariant tightens: a single-level selectedUnits must
still yield at least one filterable word in every shipping region."
```

---

## Task 8: Rewrite `source-emits-playable.test.tsx` (drives the new widget)

The previous version drove the old `<select>` Level picker. The new widget
uses checkbox rows. This test verifies the form, when configured with each
level alone, emits a `source.filter` that produces ≥ 1 hit.

**Files:**

- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`

- [ ] **Step 1: Replace the test**

Replace the file with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import { filterWords, GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit, Region } from '@/data/words';

type SourceConfig = {
  source?: {
    type: 'word-library';
    filter: {
      region: Region;
      phonemesAllowed?: string[];
      graphemesAllowed?: string[];
    };
  };
};

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

const buildSourceFromConfig = (
  cfg: Record<string, unknown>,
): SourceConfig['source'] => {
  const units = (cfg.selectedUnits as LevelGraphemeUnit[]) ?? [];
  return {
    type: 'word-library',
    filter: {
      region: 'aus',
      phonemesAllowed: [...new Set(units.map((u) => u.p))],
      graphemesAllowed: [...new Set(units.map((u) => u.g))],
    },
  };
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

describe('Simple form emits playable source — per-level checkbox', () => {
  for (const level of LEVELS) {
    it(`level ${level} alone produces ≥ 1 hit`, async () => {
      const user = userEvent.setup();
      let captured: Record<string, unknown> = {};
      // Start with everything off, then check just the target level
      render(
        <Harness
          initial={[]}
          onConfigRef={(c) => {
            captured = c;
          }}
        />,
      );
      await user.click(screen.getByLabelText(`Level ${level}`));
      const source = buildSourceFromConfig(captured);
      const result = await filterWords(source!.filter);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  }

  it('disjoint selection {L1, L2, L4} produces hits', async () => {
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
    await user.click(screen.getByLabelText('Level 1'));
    await user.click(screen.getByLabelText('Level 2'));
    await user.click(screen.getByLabelText('Level 4'));
    const source = buildSourceFromConfig(captured);
    const result = await filterWords(source!.filter);
    expect(result.hits.length).toBeGreaterThan(0);
  });
});

// Reference: ensures the harness state shape matches the production type
const _unused: LevelGraphemeUnit[] = GRAPHEMES_BY_LEVEL[1] ?? [];
void _unused;
```

- [ ] **Step 2: Run the test**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx`
Expected: PASS — 9 tests (8 single-level + 1 disjoint).

- [ ] **Step 3: Commit**

```bash
git add src/games/word-spell/WordSpellSimpleConfigForm/source-emits-playable.test.tsx
git commit -m "test(word-spell): source-emits-playable drives the multi-level widget

Toggles each level row's checkbox in turn (and a disjoint {L1,L2,L4}
combo) and asserts filterWords returns ≥ 1 hit. Replaces the previous
<select>-driven version."
```

---

## Task 9: Update `WordSpellSimpleConfigForm` test

The existing form test asserts on chip presence at "the current level"
which no longer makes sense (every level row renders all the time). Update
it to use the new model.

**Files:**

- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx`

- [ ] **Step 1: Rewrite the test**

Replace the file with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import type { LevelGraphemeUnit } from '@/data/words';

const L1 = (GRAPHEMES_BY_LEVEL[1] ?? []).slice();

const Harness = ({
  initial,
}: {
  initial: LevelGraphemeUnit[];
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: initial,
    region: 'aus',
    inputMethod: 'drag',
  });
  return (
    <WordSpellSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('WordSpellSimpleConfigForm', () => {
  it('shows L1 row with all chips on when initialised with L1', () => {
    render(<Harness initial={L1} />);
    const cb = screen.getByLabelText('Level 1') as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('flags data-invalid when selectedUnits is empty', () => {
    const { container } = render(<Harness initial={[]} />);
    // The wrapping div lives inside the simple form; the LibrarySource's
    // own data-invalid attr is what we look for.
    const invalid = container.querySelector('[data-invalid="true"]');
    expect(invalid).not.toBeNull();
  });

  it('renders the input-method picker', () => {
    render(<Harness initial={L1} />);
    expect(
      screen.getByRole('button', { name: /drag/i }),
    ).toBeInTheDocument();
  });

  it('toggling a chip updates aria-pressed', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const chip = screen.getByRole('button', {
      name: new RegExp(`${L1[0]!.g} \\/${L1[0]!.p}\\/`, 'i'),
    });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
});
```

- [ ] **Step 2: Run the test**

Run: `yarn vitest run src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 3: Run the full WordSpell suite to confirm no other regression**

Run: `yarn vitest run src/games/word-spell src/components/AdvancedConfigModal`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx
git commit -m "test(word-spell): adapt WordSpellSimpleConfigForm tests to multi-level UI"
```

---

## Task 10: Audit existing WordSpell stories

Confirm the three existing `*.stories.tsx` files still render correctly
under the new types. Most stories don't construct `WordSpellSimpleConfig`
directly — they pass full `WordSpellConfig` with explicit `rounds`. But
verify, because TypeScript will tell us.

**Required skill:** `write-storybook` — already loaded for plan-author
context. No new stories are added in this plan; we only audit.

**Files:**

- Audit: `src/games/word-spell/WordSpell/WordSpell.stories.tsx`
- Audit: `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx`
- Audit: `src/games/word-spell/LetterTileBank/LetterTileBank.stories.tsx`

- [ ] **Step 1: Run typecheck on the stories**

Run: `yarn typecheck`
Expected: 0 errors. If any story errors with `Property 'level' does not
exist on type 'WordSpellSimpleConfig'`, that story is constructing the
simple shape directly — update it to use `selectedUnits` (use
`defaultSelection()` from `level-unit-selection.ts`).

- [ ] **Step 2: Run Storybook tests for the affected components**

Find a free port (avoid colliding with another agent's Storybook):

```bash
PORT=6006
while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
yarn storybook --port $PORT --ci &
STORYBOOK_PID=$!
until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
yarn test:storybook --url http://127.0.0.1:$PORT
TEST_EXIT=$?
[ $TEST_EXIT -eq 0 ] && kill $STORYBOOK_PID
exit $TEST_EXIT
```

Expected: PASS. If a story fails because of the type change, fix it now
(typically a `selectedUnits: defaultSelection()` substitution where the
old `level + phonemesAllowed` was used) and re-run.

- [ ] **Step 3: Commit only if any story file was edited**

If no edits were needed, skip this step. Otherwise:

```bash
git add src/games/word-spell/**/*.stories.tsx
git commit -m "stories(word-spell): adapt to selectedUnits-shaped simple config"
```

---

## Task 11: Final verification — lint, typecheck, tests, manual smoke

**Files:** none (pre-push gate run).

- [ ] **Step 1: Full lint**

Run: `yarn lint`
Expected: PASS (eslint --max-warnings 0, knip).

- [ ] **Step 2: Full typecheck**

Run: `yarn typecheck`
Expected: PASS.

- [ ] **Step 3: Full unit suite**

Run: `yarn test`
Expected: PASS — every previous test count + the new ones from this plan.

- [ ] **Step 4: Markdown gate on the spec + plan**

Run: `yarn lint:md docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md`
Run: `npx prettier --check docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md`
Expected: 0 errors.

- [ ] **Step 5: VR baseline check**

The route default (`/en/game/word-spell`) still uses
`DEFAULT_WORD_SPELL_CONFIG` with `roundsInOrder: true` and explicit
`rounds`, so the existing `e2e/visual.spec.ts` baselines for the WordSpell
shell are unaffected by this work. Run:

```bash
yarn test:vr
```

Expected: PASS — no diffs. If diffs appear, review the diff PNGs;
intentional drift requires `yarn test:vr:update`. The Simple form and
Advanced modal aren't on a VR-tested route by default; if they are
covered by a story-based snapshot, that's caught by Task 10.

If Docker is unavailable, document the skip:

```bash
SKIP_VR=1 git push
# ... add a PR description note: "VR skipped — Docker unavailable; affected
# routes verified via storybook snapshots"
```

- [ ] **Step 6: Manual smoke test in the dev server**

Run: `yarn dev`. Open the app and verify:

1. `/en/game/word-spell` (no custom config) — game launches with the
   default 8 hand-authored rounds; no crash.
2. Open the WordSpell Simple form (via the catalog "Custom" entry or
   wherever it's exposed). Confirm:
   - First-time render: Level 1 is fully checked, all other levels
     unchecked.
   - Click Level 2 row → all L2 chips become aria-pressed=true; L2 row
     shows checked.
   - Click one chip in Level 2 → that chip toggles off; L2 row shows
     indeterminate.
   - Click Level 4 row → independent of Levels 1–3.
3. Open the Advanced modal for WordSpell. Confirm:
   - Nested checkbox tree appears at the top.
   - Toggling a leaf checkbox changes the parent level's tri-state.
   - The standard Advanced fields render below; `distractorCount`
     appears when `tileBankMode = distractors`.
4. Save a custom WordSpell config from Simple, reload, and confirm it
   restores with the same selection.
5. Pre-seed an old simple-shape config in IDB
   (`{ configMode: 'simple', level: 4, phonemesAllowed: ['s'] }`) for
   `last:anonymous:word-spell`, refresh, and confirm the form opens with
   the migrated `selectedUnits` (containing both `s /s/` from L1 and
   `c /s/` from L4) — no crash, no default-reset.

Document the smoke run in the PR description.

- [ ] **Step 7: Push**

```bash
git push
```

The pre-push gate runs lint → typecheck → unit → storybook → VR (if
Docker available) → e2e for affected files.

- [ ] **Step 8: Update PR description**

Edit PR #219's description (or open a fresh PR if Option 2 from the
earlier branch-cleanup discussion was chosen). Include:

- Link to spec
  (`docs/superpowers/specs/2026-04-28-wordspell-multi-level-units-design.md`)
- Link to plan
  (`docs/superpowers/plans/2026-04-28-wordspell-multi-level-units.md`)
- Test plan (the smoke checklist from Step 6)
- Migration notes — saved configs auto-upgrade on first read; no user
  action required
- Reference to issue #220 (play-again repeating sequence — separate
  follow-up)

---

## Self-Review Checklist

After running the plan end-to-end, confirm:

- [ ] **Spec coverage** — every spec section is implemented:
  - Selection model (`(g, p)` units, no migration loss) → Tasks 1, 4
  - Filter contract (phoneme-only, no level gate) → Tasks 4, 7, 8
  - UI Simple (chips) → Task 5
  - UI Advanced (checkbox-tree) → Tasks 5, 6
  - Defaults & persistence → Tasks 4, 11 (smoke)
  - Component shape (`variant` prop) → Tasks 5, 6
  - Testing strategy (4 layers) → Tasks 1, 5, 7, 8, 9
  - **IndexedDB migration** → Tasks 2, 3
- [ ] **No placeholders** — every step shows the actual code or command
- [ ] **Type consistency** — `LevelGraphemeUnit`, `selectedUnits`,
      `triStateForLevel`, `toggleLevel`, `toggleUnit`, `defaultSelection`,
      `migrateWordSpellConfig`, `LibrarySourceVariant` all spelled the
      same in every task
- [ ] **Commits per task** — each task produces one focused commit, never
      a monolithic "do everything"

## Open Questions Resolved Inline

- **Region field in `WordSpellSimpleConfig`** — added per the spec. The
  current resolver hardcodes `'aus'`; the migration helper preserves
  `region` from `source.filter` when present and defaults to `'aus'`
  otherwise. UI for changing region is out of scope.
- **`require('@/data/words')` inside `advancedToSimple`** — used to avoid
  an import cycle. If TS or ESM tooling rejects it, switch to a
  top-level import; the cycle is benign because both modules tree-shake.
- **Play-again repeating sequence** — issue #220, separate PR. The
  resume-desync E2E test is unaffected by this work because the route
  default still uses `roundsInOrder: true` (Task 9 from PR #219 was
  reverted).
