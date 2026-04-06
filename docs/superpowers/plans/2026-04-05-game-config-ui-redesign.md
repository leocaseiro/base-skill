# Game Config UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate game config editing from a floating gameplay overlay to (a) expandable bookmark chips on the homepage and (b) a collapsible settings section on the instructions screen, while adding bookmark colors, game descriptions, and last-config snapshotting.

**Architecture:** Foundation types and utilities first, then DB schema change, then UI leaf components (`GameNameChip`, `SavedConfigChip`, `ConfigFormFields`), then composite updates (`GameCard`, `SaveConfigDialog`, `InstructionsOverlay`), and finally wiring in the route components. Each task is independently testable and committable.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, RxDB (IndexedDB), react-i18next, Vitest + Testing Library.

---

## File Map

| Action | Path |
| --- | --- |
| Create | `src/lib/config-fields.ts` |
| Create | `src/lib/bookmark-colors.ts` |
| Create | `src/lib/config-tags.ts` |
| Create | `src/lib/config-tags.test.ts` |
| Create | `src/games/config-fields-registry.ts` |
| Create | `src/components/ConfigFormFields.tsx` |
| Create | `src/components/ConfigFormFields.test.tsx` |
| Create | `src/components/GameNameChip.tsx` |
| Create | `src/components/GameNameChip.test.tsx` |
| Create | `src/components/SavedConfigChip.tsx` |
| Create | `src/components/SavedConfigChip.test.tsx` |
| Modify | `src/db/schemas/saved_game_configs.ts` |
| Modify | `src/db/create-database.ts` |
| Modify | `src/db/hooks/useSavedConfigs.ts` |
| Modify | `src/db/hooks/useSavedConfigs.test.tsx` |
| Modify | `src/games/word-spell/types.ts` |
| Modify | `src/games/number-match/types.ts` |
| Modify | `src/games/sort-numbers/types.ts` |
| Modify | `src/games/registry.ts` |
| Modify | `src/lib/i18n/locales/en/games.json` |
| Modify | `src/lib/i18n/locales/pt-BR/games.json` |
| Modify | `src/lib/i18n/locales/en/common.json` |
| Modify | `src/lib/i18n/locales/pt-BR/common.json` |
| Modify | `src/components/GameCard.tsx` |
| Modify | `src/components/GameCard.test.tsx` |
| Modify | `src/components/SaveConfigDialog.tsx` |
| Modify | `src/components/GameGrid.tsx` |
| Modify | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx` |
| Modify | `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` |
| Modify | `src/games/word-spell/WordSpell/WordSpell.tsx` |
| Modify | `src/games/word-spell/WordSpell/WordSpell.test.tsx` |
| Modify | `src/games/number-match/NumberMatch/NumberMatch.tsx` |
| Modify | `src/games/number-match/NumberMatch/NumberMatch.test.tsx` |
| Modify | `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` |
| Modify | `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx` |
| Modify | `src/routes/$locale/_app/game/$gameId.tsx` |
| Modify | `src/routes/$locale/_app/index.tsx` |

---

## Task 1: Foundation — `ConfigField`, `BookmarkColor`, `configToTags`

**Files:**
- Create: `src/lib/config-fields.ts`
- Create: `src/lib/bookmark-colors.ts`
- Create: `src/lib/config-tags.ts`
- Create: `src/lib/config-tags.test.ts`

- [ ] **Step 1.1: Create `src/lib/config-fields.ts`**

```ts
// src/lib/config-fields.ts
export type ConfigField =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | { type: 'number'; key: string; label: string; min: number; max: number }
  | { type: 'checkbox'; key: string; label: string };
```

- [ ] **Step 1.2: Create `src/lib/bookmark-colors.ts`**

```ts
// src/lib/bookmark-colors.ts
export const BOOKMARK_COLOR_KEYS = [
  'indigo', 'teal', 'rose', 'amber', 'sky', 'lime',
  'purple', 'orange', 'pink', 'emerald', 'slate', 'cyan',
] as const;

export type BookmarkColorKey = (typeof BOOKMARK_COLOR_KEYS)[number];

export type ColorTokens = {
  bg: string;
  border: string;
  tagBg: string;
  tagText: string;
  playBg: string;
  headerText: string;
};

export const BOOKMARK_COLORS: Record<BookmarkColorKey, ColorTokens> = {
  indigo:  { bg: '#eef2ff', border: '#c7d2fe', tagBg: '#e0e7ff', tagText: '#3730a3', playBg: '#6366f1', headerText: '#3730a3' },
  teal:    { bg: '#f0fdfa', border: '#99f6e4', tagBg: '#ccfbf1', tagText: '#0f766e', playBg: '#14b8a6', headerText: '#0f766e' },
  rose:    { bg: '#fff1f2', border: '#fecdd3', tagBg: '#ffe4e6', tagText: '#9f1239', playBg: '#f43f5e', headerText: '#9f1239' },
  amber:   { bg: '#fffbeb', border: '#fde68a', tagBg: '#fef9c3', tagText: '#92400e', playBg: '#f59e0b', headerText: '#92400e' },
  sky:     { bg: '#f0f9ff', border: '#bae6fd', tagBg: '#e0f2fe', tagText: '#0c4a6e', playBg: '#0ea5e9', headerText: '#0c4a6e' },
  lime:    { bg: '#f7fee7', border: '#d9f99d', tagBg: '#ecfccb', tagText: '#3a5c00', playBg: '#84cc16', headerText: '#3a5c00' },
  purple:  { bg: '#faf5ff', border: '#e9d5ff', tagBg: '#f3e8ff', tagText: '#5b21b6', playBg: '#a855f7', headerText: '#5b21b6' },
  orange:  { bg: '#fff7ed', border: '#fed7aa', tagBg: '#ffedd5', tagText: '#7c2d12', playBg: '#f97316', headerText: '#7c2d12' },
  pink:    { bg: '#fdf2f8', border: '#fbcfe8', tagBg: '#fce7f3', tagText: '#831843', playBg: '#ec4899', headerText: '#831843' },
  emerald: { bg: '#ecfdf5', border: '#a7f3d0', tagBg: '#d1fae5', tagText: '#065f46', playBg: '#10b981', headerText: '#065f46' },
  slate:   { bg: '#f8fafc', border: '#cbd5e1', tagBg: '#f1f5f9', tagText: '#1e293b', playBg: '#64748b', headerText: '#1e293b' },
  cyan:    { bg: '#ecfeff', border: '#a5f3fc', tagBg: '#cffafe', tagText: '#164e63', playBg: '#06b6d4', headerText: '#164e63' },
};

export const DEFAULT_BOOKMARK_COLOR: BookmarkColorKey = 'indigo';
```

- [ ] **Step 1.3: Write the failing test for `configToTags`**

```ts
// src/lib/config-tags.test.ts
import { describe, expect, it } from 'vitest';
import { configToTags } from './config-tags';

describe('configToTags', () => {
  it('returns inputMethod as-is', () => {
    expect(configToTags({ inputMethod: 'drag' })).toContain('drag');
  });

  it('formats totalRounds with "rounds" suffix', () => {
    expect(configToTags({ totalRounds: 8 })).toContain('8 rounds');
  });

  it('returns "TTS on" when ttsEnabled is true', () => {
    expect(configToTags({ ttsEnabled: true })).toContain('TTS on');
  });

  it('omits ttsEnabled tag when false', () => {
    expect(configToTags({ ttsEnabled: false })).not.toContain('TTS on');
  });

  it('caps output at 4 tags', () => {
    const config = {
      inputMethod: 'drag',
      totalRounds: 8,
      mode: 'picture',
      tileUnit: 'letter',
      ttsEnabled: true,
    };
    expect(configToTags(config).length).toBeLessThanOrEqual(4);
  });

  it('ignores unknown keys', () => {
    expect(configToTags({ unknownKey: 'foo' })).toEqual([]);
  });
});
```

- [ ] **Step 1.4: Run test to verify it fails**

```bash
yarn test src/lib/config-tags.test.ts
```

Expected: FAIL with "Cannot find module './config-tags'"

- [ ] **Step 1.5: Create `src/lib/config-tags.ts`**

```ts
// src/lib/config-tags.ts
type Formatter = (v: unknown) => string | null;

const KEY_FORMATTERS: [string, Formatter][] = [
  ['inputMethod',  (v) => String(v)],
  ['mode',         (v) => String(v)],
  ['tileUnit',     (v) => String(v)],
  ['direction',    (v) => String(v)],
  ['totalRounds',  (v) => `${String(v)} rounds`],
  ['ttsEnabled',   (v) => v === true ? 'TTS on' : null],
];

export const configToTags = (config: Record<string, unknown>): string[] => {
  const tags: string[] = [];
  for (const [key, format] of KEY_FORMATTERS) {
    if (key in config) {
      const result = format(config[key]);
      if (result !== null) tags.push(result);
    }
    if (tags.length === 4) break;
  }
  return tags;
};
```

- [ ] **Step 1.6: Run test to verify it passes**

```bash
yarn test src/lib/config-tags.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 1.7: Commit**

```bash
git add src/lib/config-fields.ts src/lib/bookmark-colors.ts src/lib/config-tags.ts src/lib/config-tags.test.ts
git commit -m "feat: add ConfigField type, bookmark color palette, and configToTags utility"
```

---

## Task 2: DB Schema — add `color` to `SavedGameConfigDoc` + `updateConfig` hook method

**Files:**
- Modify: `src/db/schemas/saved_game_configs.ts`
- Modify: `src/db/create-database.ts`
- Modify: `src/db/hooks/useSavedConfigs.ts`
- Modify: `src/db/hooks/useSavedConfigs.test.tsx`

- [ ] **Step 2.1: Write failing tests for new `useSavedConfigs` behaviour**

Add these tests to the end of the `describe` block in `src/db/hooks/useSavedConfigs.test.tsx`:

```ts
it('save() stores the provided color on the doc', async () => {
  const { result } = renderHook(() => useSavedConfigsReady(), {
    wrapper: makeWrapper(db),
  });
  await waitFor(() => expect(result.current.isReady).toBe(true));
  await act(async () => {
    await result.current.save({
      gameId: 'word-spell',
      name: 'Teal Mode',
      config: {},
      color: 'teal',
    });
  });
  await waitFor(() =>
    expect(result.current.savedConfigs).toHaveLength(1),
  );
  expect(result.current.savedConfigs[0]!.color).toBe('teal');
});

it('updateConfig() patches config and optionally renames', async () => {
  const { result } = renderHook(() => useSavedConfigsReady(), {
    wrapper: makeWrapper(db),
  });
  await waitFor(() => expect(result.current.isReady).toBe(true));
  await act(async () => {
    await result.current.save({
      gameId: 'word-spell',
      name: 'Easy Mode',
      config: { totalRounds: 5 },
      color: 'indigo',
    });
  });
  await waitFor(() =>
    expect(result.current.savedConfigs).toHaveLength(1),
  );
  const id = result.current.savedConfigs[0]!.id;
  await act(async () => {
    await result.current.updateConfig(id, { totalRounds: 8 }, 'Easy Mode v2');
  });
  await waitFor(() =>
    expect(result.current.savedConfigs[0]?.name).toBe('Easy Mode v2'),
  );
  expect(result.current.savedConfigs[0]?.config).toEqual({ totalRounds: 8 });
});

it('updateConfig() throws when new name already exists for same gameId', async () => {
  const { result } = renderHook(() => useSavedConfigsReady(), {
    wrapper: makeWrapper(db),
  });
  await waitFor(() => expect(result.current.isReady).toBe(true));
  await act(async () => {
    await result.current.save({ gameId: 'word-spell', name: 'A', config: {}, color: 'indigo' });
    await result.current.save({ gameId: 'word-spell', name: 'B', config: {}, color: 'teal' });
  });
  await waitFor(() =>
    expect(result.current.savedConfigs).toHaveLength(2),
  );
  const idA = result.current.savedConfigs[0]!.id;
  await expect(
    act(async () => {
      await result.current.updateConfig(idA, {}, 'B');
    }),
  ).rejects.toThrow('already exists');
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
yarn test src/db/hooks/useSavedConfigs.test.tsx
```

Expected: the 3 new tests FAIL (save has no `color` param; `updateConfig` is not defined)

- [ ] **Step 2.3: Update `src/db/schemas/saved_game_configs.ts`**

```ts
import type { RxJsonSchema } from 'rxdb';

export type SavedGameConfigDoc = {
  id: string;
  profileId: string;
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  color: string;
};

export const savedGameConfigsSchema: RxJsonSchema<SavedGameConfigDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    gameId: { type: 'string', maxLength: 64 },
    name: { type: 'string', maxLength: 128 },
    config: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    color: { type: 'string', maxLength: 32 },
  },
  required: ['id', 'profileId', 'gameId', 'name', 'config', 'createdAt', 'color'],
  additionalProperties: false,
};
```

- [ ] **Step 2.4: Add migration strategy in `src/db/create-database.ts`**

Replace the `saved_game_configs` entry in `COLLECTIONS`:

```ts
saved_game_configs: {
  schema: savedGameConfigsSchema,
  migrationStrategies: {
    1: (oldDoc: Record<string, unknown>) => ({
      ...oldDoc,
      color: 'indigo',
    }),
  },
},
```

- [ ] **Step 2.5: Update `src/db/hooks/useSavedConfigs.ts`**

Change `SaveInput` to include `color`, update `save()`, and add `updateConfig()`:

```ts
// Change SaveInput type:
type SaveInput = {
  gameId: string;
  name: string;
  config: Record<string, unknown>;
  color: string;
};

// Change UseSavedConfigsResult to add updateConfig:
type UseSavedConfigsResult = {
  savedConfigs: SavedGameConfigDoc[];
  gameIdsWithConfigs: Set<string>;
  getByGameId: (gameId: string) => SavedGameConfigDoc[];
  save: (input: SaveInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  updateConfig: (
    id: string,
    config: Record<string, unknown>,
    name?: string,
  ) => Promise<void>;
  persistLastSessionConfig: (
    gameId: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
};
```

In the `save` function body, add `color` to the inserted doc:

```ts
const doc: SavedGameConfigDoc = {
  id: nanoid(21),
  profileId: ANONYMOUS_PROFILE_ID,
  gameId,
  name: trimmed,
  config,
  color,
  createdAt: new Date().toISOString(),
};
```

Add the `updateConfig` implementation before the `return` statement:

```ts
const updateConfig = useCallback(
  async (
    id: string,
    config: Record<string, unknown>,
    name?: string,
  ): Promise<void> => {
    if (!db) return;
    const doc = await db.saved_game_configs.findOne(id).exec();
    if (!doc) return;
    const patch: Partial<SavedGameConfigDoc> = { config };
    if (name !== undefined) {
      const trimmed = name.trim();
      const namesForGame = savedConfigs
        .filter((d) => d.gameId === doc.gameId && d.id !== id)
        .map((d) => d.name);
      if (namesForGame.includes(trimmed)) {
        throw new Error(
          `A saved config named "${trimmed}" already exists for this game`,
        );
      }
      patch.name = trimmed;
    }
    await doc.incrementalPatch(patch);
  },
  [db, savedConfigs],
);
```

Add `updateConfig` to the returned object.

- [ ] **Step 2.6: Run tests to verify they pass**

```bash
yarn test src/db/hooks/useSavedConfigs.test.tsx
```

Expected: all tests PASS

- [ ] **Step 2.7: Commit**

```bash
git add src/db/schemas/saved_game_configs.ts src/db/create-database.ts src/db/hooks/useSavedConfigs.ts src/db/hooks/useSavedConfigs.test.tsx
git commit -m "feat(db): add color field to saved_game_configs, add updateConfig hook method"
```

---

## Task 3: Game `configFields` exports + registry lookup

**Files:**
- Modify: `src/games/word-spell/types.ts`
- Modify: `src/games/number-match/types.ts`
- Modify: `src/games/sort-numbers/types.ts`
- Create: `src/games/config-fields-registry.ts`

- [ ] **Step 3.1: Add `wordSpellConfigFields` to `src/games/word-spell/types.ts`**

Append after the existing type definitions:

```ts
import type { ConfigField } from '@/lib/config-fields';

export const wordSpellConfigFields: ConfigField[] = [
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
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'picture', label: 'picture' },
      { value: 'scramble', label: 'scramble' },
      { value: 'recall', label: 'recall' },
      { value: 'sentence-gap', label: 'sentence-gap' },
    ],
  },
  {
    type: 'select',
    key: 'tileUnit',
    label: 'Tile unit',
    options: [
      { value: 'letter', label: 'letter' },
      { value: 'syllable', label: 'syllable' },
      { value: 'word', label: 'word' },
    ],
  },
  { type: 'number', key: 'totalRounds', label: 'Total rounds', min: 1, max: 8 },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
```

- [ ] **Step 3.2: Add `numberMatchConfigFields` to `src/games/number-match/types.ts`**

Append after the existing type definitions:

```ts
import type { ConfigField } from '@/lib/config-fields';

export const numberMatchConfigFields: ConfigField[] = [
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
    key: 'mode',
    label: 'Mode',
    options: [
      { value: 'numeral-to-group', label: 'numeral → group' },
      { value: 'group-to-numeral', label: 'group → numeral' },
      { value: 'numeral-to-word', label: 'numeral → word' },
      { value: 'word-to-numeral', label: 'word → numeral' },
    ],
  },
  {
    type: 'select',
    key: 'tileStyle',
    label: 'Tile style',
    options: [
      { value: 'dots', label: 'dots' },
      { value: 'objects', label: 'objects' },
      { value: 'fingers', label: 'fingers' },
    ],
  },
  { type: 'number', key: 'totalRounds', label: 'Total rounds', min: 1, max: 50 },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
```

- [ ] **Step 3.3: Add `sortNumbersConfigFields` to `src/games/sort-numbers/types.ts`**

Append after the existing type definitions:

```ts
import type { ConfigField } from '@/lib/config-fields';

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
    key: 'direction',
    label: 'Direction',
    options: [
      { value: 'ascending', label: 'ascending' },
      { value: 'descending', label: 'descending' },
    ],
  },
  { type: 'number', key: 'quantity', label: 'Quantity', min: 2, max: 8 },
  { type: 'number', key: 'totalRounds', label: 'Total rounds', min: 1, max: 30 },
  { type: 'checkbox', key: 'allowSkips', label: 'Allow skips' },
  { type: 'checkbox', key: 'roundsInOrder', label: 'Rounds in order' },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];
```

- [ ] **Step 3.4: Create `src/games/config-fields-registry.ts`**

```ts
// src/games/config-fields-registry.ts
import type { ConfigField } from '@/lib/config-fields';
import { numberMatchConfigFields } from './number-match/types';
import { sortNumbersConfigFields } from './sort-numbers/types';
import { wordSpellConfigFields } from './word-spell/types';

export const getConfigFields = (gameId: string): ConfigField[] => {
  switch (gameId) {
    case 'word-spell':    return wordSpellConfigFields;
    case 'number-match':  return numberMatchConfigFields;
    case 'sort-numbers':  return sortNumbersConfigFields;
    default:              return [];
  }
};
```

- [ ] **Step 3.5: Run TypeScript check**

```bash
yarn typecheck
```

Expected: no new errors

- [ ] **Step 3.6: Commit**

```bash
git add src/games/word-spell/types.ts src/games/number-match/types.ts src/games/sort-numbers/types.ts src/games/config-fields-registry.ts
git commit -m "feat: export configFields from each game, add getConfigFields registry"
```

---

## Task 4: `ConfigFormFields` — shared form renderer

**Files:**
- Create: `src/components/ConfigFormFields.tsx`
- Create: `src/components/ConfigFormFields.test.tsx`

- [ ] **Step 4.1: Write the failing test**

```tsx
// src/components/ConfigFormFields.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfigFormFields } from './ConfigFormFields';
import type { ConfigField } from '@/lib/config-fields';

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
  { type: 'number', key: 'totalRounds', label: 'Total rounds', min: 1, max: 10 },
  { type: 'checkbox', key: 'ttsEnabled', label: 'TTS enabled' },
];

const config: Record<string, unknown> = {
  inputMethod: 'drag',
  totalRounds: 5,
  ttsEnabled: true,
};

describe('ConfigFormFields', () => {
  it('renders a label and select for select fields', () => {
    render(
      <ConfigFormFields fields={fields} config={config} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Input method' })).toHaveValue('drag');
  });

  it('renders a label and number input for number fields', () => {
    render(
      <ConfigFormFields fields={fields} config={config} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText('Total rounds')).toHaveValue(5);
  });

  it('renders a checkbox for checkbox fields', () => {
    render(
      <ConfigFormFields fields={fields} config={config} onChange={vi.fn()} />,
    );
    expect(screen.getByRole('checkbox', { name: 'TTS enabled' })).toBeChecked();
  });

  it('calls onChange with updated config when select changes', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields fields={fields} config={config} onChange={onChange} />,
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Input method' }),
      'type',
    );
    expect(onChange).toHaveBeenCalledWith({ ...config, inputMethod: 'type' });
  });

  it('calls onChange with updated config when checkbox toggles', async () => {
    const onChange = vi.fn();
    render(
      <ConfigFormFields fields={fields} config={config} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'TTS enabled' }));
    expect(onChange).toHaveBeenCalledWith({ ...config, ttsEnabled: false });
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
yarn test src/components/ConfigFormFields.test.tsx
```

Expected: FAIL with "Cannot find module './ConfigFormFields'"

- [ ] **Step 4.3: Create `src/components/ConfigFormFields.tsx`**

```tsx
// src/components/ConfigFormFields.tsx
import type { JSX } from 'react';
import type { ConfigField } from '@/lib/config-fields';

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
                onChange({ ...config, [field.key]: Number(e.target.value) })
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

- [ ] **Step 4.4: Run test to verify it passes**

```bash
yarn test src/components/ConfigFormFields.test.tsx
```

Expected: all 5 tests PASS

- [ ] **Step 4.5: Commit**

```bash
git add src/components/ConfigFormFields.tsx src/components/ConfigFormFields.test.tsx
git commit -m "feat: add ConfigFormFields shared form renderer"
```

---

## Task 5: `GameNameChip` — display-only identity chip

**Files:**
- Create: `src/components/GameNameChip.tsx`
- Create: `src/components/GameNameChip.test.tsx`

- [ ] **Step 5.1: Write the failing test**

```tsx
// src/components/GameNameChip.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameNameChip } from './GameNameChip';

describe('GameNameChip', () => {
  it('renders the game title', () => {
    render(<GameNameChip title="Word Spell" />);
    expect(screen.getByText('Word Spell')).toBeInTheDocument();
  });

  it('renders bookmarkName badge when provided', () => {
    render(
      <GameNameChip title="Word Spell" bookmarkName="Easy Mode" />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('renders subject badge when no bookmarkName', () => {
    render(<GameNameChip title="Word Spell" subject="reading" />);
    expect(screen.getByText('reading')).toBeInTheDocument();
  });

  it('does not render subject badge when bookmarkName is present', () => {
    render(
      <GameNameChip
        title="Word Spell"
        bookmarkName="Easy Mode"
        subject="reading"
      />,
    );
    expect(screen.queryByText('reading')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
yarn test src/components/GameNameChip.test.tsx
```

Expected: FAIL with "Cannot find module './GameNameChip'"

- [ ] **Step 5.3: Create `src/components/GameNameChip.tsx`**

```tsx
// src/components/GameNameChip.tsx
import type { JSX } from 'react';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';

type GameNameChipProps = {
  title: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
};

export const GameNameChip = ({
  title,
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
}: GameNameChipProps): JSX.Element => {
  const colors = bookmarkName
    ? BOOKMARK_COLORS[bookmarkColor]
    : BOOKMARK_COLORS.slate;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: colors.border }}
    >
      <div
        className="flex min-h-12 items-center gap-2 px-3"
        style={{ background: colors.tagBg }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: colors.headerText }}
        >
          {title}
        </span>
        {bookmarkName && (
          <span
            className="rounded px-2 py-0.5 text-xs font-semibold"
            style={{ background: colors.tagBg, color: colors.headerText, border: `1px solid ${colors.border}` }}
          >
            {bookmarkName}
          </span>
        )}
        {!bookmarkName && subject && (
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground"
            style={{ background: colors.bg }}
          >
            {subject}
          </span>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 5.4: Run test to verify it passes**

```bash
yarn test src/components/GameNameChip.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 5.5: Commit**

```bash
git add src/components/GameNameChip.tsx src/components/GameNameChip.test.tsx
git commit -m "feat: add GameNameChip display-only identity chip"
```

---

## Task 6: `SavedConfigChip` — expandable bookmark chip with inline form

**Files:**
- Create: `src/components/SavedConfigChip.tsx`
- Create: `src/components/SavedConfigChip.test.tsx`

- [ ] **Step 6.1: Write the failing tests**

```tsx
// src/components/SavedConfigChip.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SavedConfigChip } from './SavedConfigChip';
import type { ConfigField } from '@/lib/config-fields';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';

const mockDoc: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: { inputMethod: 'drag', totalRounds: 8, mode: 'picture' },
  createdAt: '2026-01-01T00:00:00.000Z',
  color: 'teal',
};

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
];

describe('SavedConfigChip', () => {
  it('renders the bookmark name', () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('renders config summary tags in collapsed state', () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('drag')).toBeInTheDocument();
  });

  it('calls onPlay with doc id when play button is clicked', async () => {
    const onPlay = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={onPlay}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /play easy mode/i }));
    expect(onPlay).toHaveBeenCalledWith('cfg-1');
  });

  it('calls onDelete with doc id when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete easy mode/i }));
    expect(onDelete).toHaveBeenCalledWith('cfg-1');
  });

  it('expands to show the form when name button is clicked', async () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /expand easy mode/i }));
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
  });

  it('calls onSave with updated name and config when Save is clicked', async () => {
    const onSave = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /expand easy mode/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledWith(
      'cfg-1',
      expect.objectContaining({ inputMethod: 'drag' }),
      'Easy Mode',
    );
  });

  it('collapses without saving when Cancel is clicked', async () => {
    const onSave = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /expand easy mode/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Input method')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6.2: Run test to verify it fails**

```bash
yarn test src/components/SavedConfigChip.test.tsx
```

Expected: FAIL with "Cannot find module './SavedConfigChip'"

- [ ] **Step 6.3: Create `src/components/SavedConfigChip.tsx`**

```tsx
// src/components/SavedConfigChip.tsx
import { useState } from 'react';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import { configToTags } from '@/lib/config-tags';

type SavedConfigChipProps = {
  doc: SavedGameConfigDoc;
  configFields: ConfigField[];
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (
    id: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
};

export const SavedConfigChip = ({
  doc,
  configFields,
  onPlay,
  onDelete,
  onSave,
}: SavedConfigChipProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [editConfig, setEditConfig] = useState(doc.config);
  const [editName, setEditName] = useState(doc.name);

  const colorKey = (doc.color as BookmarkColorKey) ?? DEFAULT_BOOKMARK_COLOR;
  const colors = BOOKMARK_COLORS[colorKey];
  const tags = configToTags(doc.config);

  const handleCancel = () => {
    setEditConfig(doc.config);
    setEditName(doc.name);
    setExpanded(false);
  };

  const handleSave = async () => {
    await onSave(doc.id, editConfig, editName);
    setExpanded(false);
  };

  return (
    <div
      className="overflow-hidden rounded-xl border-2"
      style={{
        borderColor: expanded ? colors.playBg : colors.border,
        boxShadow: expanded ? `0 0 0 3px ${colors.bg}` : undefined,
      }}
    >
      {/* Header row */}
      <div
        className="flex min-h-12 items-stretch"
        style={{ background: expanded ? colors.playBg : colors.tagBg }}
      >
        <button
          type="button"
          aria-label={`Expand ${doc.name}`}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-12 flex-1 items-center gap-2 px-3 text-left"
        >
          <span
            className="text-sm font-semibold"
            style={{ color: expanded ? 'white' : colors.headerText }}
          >
            {doc.name}
          </span>
          <span
            className="ml-auto text-xs"
            style={{ color: expanded ? 'rgba(255,255,255,0.7)' : colors.tagText }}
          >
            {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Play ${doc.name}`}
          onClick={() => onPlay(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center text-sm text-white"
          style={{ background: colors.playBg }}
        >
          ▶
        </button>
        <button
          type="button"
          aria-label={`Delete ${doc.name}`}
          onClick={() => onDelete(doc.id)}
          className="flex min-h-12 w-12 items-center justify-center border-l border-destructive/20 text-sm text-destructive"
          style={{ background: 'rgb(254 226 226)' }}
        >
          ✕
        </button>
      </div>

      {/* Collapsed: config summary tags */}
      {!expanded && (
        <div
          className="flex flex-wrap gap-1 px-3 pb-2 pt-1"
          style={{ background: colors.bg }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{ background: colors.tagBg, color: colors.tagText }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: inline form */}
      {expanded && (
        <div className="flex flex-col gap-3 p-3" style={{ background: colors.bg }}>
          <ConfigFormFields
            fields={configFields}
            config={editConfig}
            onChange={setEditConfig}
          />
          <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
            Bookmark name
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Save"
              onClick={() => void handleSave()}
              className="h-12 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Save
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={handleCancel}
              className="h-12 flex-1 rounded-xl border border-input bg-background text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 6.4: Run test to verify it passes**

```bash
yarn test src/components/SavedConfigChip.test.tsx
```

Expected: all 7 tests PASS

- [ ] **Step 6.5: Commit**

```bash
git add src/components/SavedConfigChip.tsx src/components/SavedConfigChip.test.tsx
git commit -m "feat: add SavedConfigChip expandable bookmark chip with inline form"
```

---

## Task 7: `GameCard` + i18n + `SaveConfigDialog` updates

**Files:**
- Modify: `src/games/registry.ts`
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`
- Modify: `src/lib/i18n/locales/en/common.json`
- Modify: `src/lib/i18n/locales/pt-BR/common.json`
- Modify: `src/components/GameCard.tsx`
- Modify: `src/components/GameCard.test.tsx`
- Modify: `src/components/SaveConfigDialog.tsx`
- Modify: `src/components/GameGrid.tsx`

- [ ] **Step 7.1: Add `descriptionKey` to `src/games/registry.ts`**

```ts
export type GameCatalogEntry = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  levels: GameLevel[];
  subject: GameSubject;
};

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    id: 'word-spell',
    titleKey: 'word-spell',
    descriptionKey: 'word-spell-description',
    levels: ['PK', 'K', '1'],
    subject: 'reading',
  },
  {
    id: 'number-match',
    titleKey: 'number-match',
    descriptionKey: 'number-match-description',
    levels: ['1', '2'],
    subject: 'math',
  },
  {
    id: 'sort-numbers',
    titleKey: 'sort-numbers',
    descriptionKey: 'sort-numbers-description',
    levels: ['K', '1', '2'],
    subject: 'math',
  },
];
```

- [ ] **Step 7.2: Add description strings to `src/lib/i18n/locales/en/games.json`**

Add after the existing game title keys:

```json
"word-spell-description": "Drag letter tiles to spell the word shown in the picture.",
"number-match-description": "Match numerals to groups by dragging tiles to the right place.",
"sort-numbers-description": "Put the numbers in order from smallest to biggest — or biggest to smallest."
```

- [ ] **Step 7.3: Add description strings to `src/lib/i18n/locales/pt-BR/games.json`**

Add the same keys with Portuguese translations:

```json
"word-spell-description": "Arraste as letras para soletrar a palavra mostrada na imagem.",
"number-match-description": "Combine numerais com grupos arrastando as peças para o lugar certo.",
"sort-numbers-description": "Coloque os números em ordem do menor para o maior — ou do maior para o menor."
```

- [ ] **Step 7.4: Add new common i18n keys to `src/lib/i18n/locales/en/common.json`**

Inside the `saveConfig` object, add:

```json
"colorLabel": "Colour",
"update": "Update \"{{name}}\"",
"saveAsNew": "Save as new bookmark…",
"saveBookmarkLabel": "Save as bookmark",
"saveBookmarkPlaceholder": "e.g. Easy Mode"
```

- [ ] **Step 7.5: Add the same keys to `src/lib/i18n/locales/pt-BR/common.json`**

```json
"colorLabel": "Cor",
"update": "Actualizar \"{{name}}\"",
"saveAsNew": "Salvar como novo favorito…",
"saveBookmarkLabel": "Salvar como favorito",
"saveBookmarkPlaceholder": "ex: Modo Fácil"
```

- [ ] **Step 7.6: Update `src/components/SaveConfigDialog.tsx`**

Replace the entire file:

```tsx
// src/components/SaveConfigDialog.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  BOOKMARK_COLOR_KEYS,
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';

type SaveConfigDialogProps = {
  open: boolean;
  suggestedName: string;
  existingNames: string[];
  onSave: (name: string, color: BookmarkColorKey) => void;
  onCancel: () => void;
};

export const SaveConfigDialog = ({
  open,
  suggestedName,
  existingNames,
  onSave,
  onCancel,
}: SaveConfigDialogProps) => {
  const { t } = useTranslation('common');
  const [name, setName] = useState(suggestedName);
  const [color, setColor] = useState<BookmarkColorKey>(DEFAULT_BOOKMARK_COLOR);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('saveConfig.errorEmpty'));
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError(t('saveConfig.errorDuplicate', { name: trimmed }));
      return;
    }
    onSave(trimmed, color);
  };

  if (!open) return null;

  const previewColors = BOOKMARK_COLORS[color];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('saveConfig.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t('saveConfig.placeholder')}
              aria-label={t('saveConfig.nameLabel')}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">
              {t('saveConfig.colorLabel')}
            </span>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              role="group"
              aria-label={t('saveConfig.colorLabel')}
            >
              {BOOKMARK_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key)}
                  className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: BOOKMARK_COLORS[key].playBg,
                    borderColor:
                      color === key ? BOOKMARK_COLORS[key].playBg : 'transparent',
                    outline:
                      color === key
                        ? `3px solid white`
                        : undefined,
                    outlineOffset: color === key ? '-5px' : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Preview
            </span>
            <div
              className="inline-flex overflow-hidden rounded-lg border"
              style={{ borderColor: previewColors.border }}
            >
              <div
                className="px-3 py-2 text-sm font-semibold"
                style={{
                  background: previewColors.tagBg,
                  color: previewColors.headerText,
                }}
              >
                {name || t('saveConfig.placeholder')}
              </div>
              <div
                className="flex w-10 items-center justify-center text-sm text-white"
                style={{ background: previewColors.playBg }}
              >
                ▶
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('saveConfig.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('saveConfig.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 7.7: Update `src/components/GameCard.tsx`**

Replace the entire file:

```tsx
// src/components/GameCard.tsx
import { BookmarkIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { GameCatalogEntry } from '@/games/registry';
import { getConfigFields } from '@/games/config-fields-registry';
import { SaveConfigDialog } from '@/components/SaveConfigDialog';
import { SavedConfigChip } from '@/components/SavedConfigChip';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';

type GameCardProps = {
  entry: GameCatalogEntry;
  savedConfigs: SavedGameConfigDoc[];
  onSaveConfig: (gameId: string, name: string, color: BookmarkColorKey) => Promise<void>;
  onRemoveConfig: (configId: string) => Promise<void>;
  onUpdateConfig: (
    configId: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
  onPlay: (gameId: string) => void;
  onPlayWithConfig: (gameId: string, configId: string) => void;
};

const suggestConfigName = (
  gameTitle: string,
  existingNames: string[],
): string => {
  if (!existingNames.includes(gameTitle)) return gameTitle;
  let n = 2;
  while (existingNames.includes(`${gameTitle} #${n}`)) n++;
  return `${gameTitle} #${n}`;
};

export const GameCard = ({
  entry,
  savedConfigs,
  onSaveConfig,
  onRemoveConfig,
  onUpdateConfig,
  onPlay,
  onPlayWithConfig,
}: GameCardProps) => {
  const { t } = useTranslation('games');
  const { t: tCommon } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  const gameTitle = t(entry.titleKey);
  const description = t(entry.descriptionKey);
  const existingNames = savedConfigs.map((c) => c.name);
  const suggestedName = suggestConfigName(gameTitle, existingNames);
  const hasConfigs = savedConfigs.length > 0;
  const configFields = getConfigFields(entry.id);

  const handleSave = async (name: string, color: BookmarkColorKey) => {
    await onSaveConfig(entry.id, name, color);
    setDialogOpen(false);
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {gameTitle}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label={tCommon('saveConfig.title')}
              onClick={() => setDialogOpen(true)}
            >
              <BookmarkIcon
                size={16}
                className={hasConfigs ? 'fill-current' : ''}
              />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-snug">
            {description}
          </p>

          <div className="flex flex-wrap gap-1 pt-1">
            {entry.levels.map((level) => (
              <span
                key={level}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {tCommon(`levels.${level}`)}
              </span>
            ))}
          </div>

          {hasConfigs && (
            <div className="flex flex-col gap-2 pt-2">
              {savedConfigs.map((sc) => (
                <SavedConfigChip
                  key={sc.id}
                  doc={sc}
                  configFields={configFields}
                  onPlay={(id) => onPlayWithConfig(entry.id, id)}
                  onDelete={(id) => void onRemoveConfig(id)}
                  onSave={onUpdateConfig}
                />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Button className="w-full" onClick={() => onPlay(entry.id)}>
            {tCommon('play')}
          </Button>
        </CardContent>
      </Card>

      <SaveConfigDialog
        open={dialogOpen}
        suggestedName={suggestedName}
        existingNames={existingNames}
        onSave={(name, color) => void handleSave(name, color)}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
};
```

- [ ] **Step 7.8: Update `src/components/GameGrid.tsx`**

Add `onUpdateConfig` to `GameGridProps` and pass it down to `GameCard`:

```tsx
type GameGridProps = {
  entries: GameCatalogEntry[];
  savedConfigs: SavedGameConfigDoc[];
  onSaveConfig: (gameId: string, name: string, color: BookmarkColorKey) => Promise<void>;
  onRemoveConfig: (configId: string) => Promise<void>;
  onUpdateConfig: (
    configId: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
  onPlay: (gameId: string) => void;
  onPlayWithConfig: (gameId: string, configId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};
```

Add `import type { BookmarkColorKey } from '@/lib/bookmark-colors';` to imports.

Pass `onUpdateConfig={onUpdateConfig}` to `<GameCard>` in the render.

- [ ] **Step 7.9: Update `src/components/GameCard.test.tsx`**

Update the `mockConfig` to include `color`, update `mockEntry` to include `descriptionKey`, and add `onUpdateConfig={vi.fn()}` to every render call. Update the "calls onPlayWithConfig" test to use the new ▶ play button aria-label:

```tsx
const mockEntry: GameCatalogEntry = {
  id: 'word-spell',
  titleKey: 'word-spell',
  descriptionKey: 'word-spell-description',
  levels: ['1', '2'],
  subject: 'reading',
};

const mockConfig: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  color: 'indigo',
};
```

For every `render(...)` call, add `onUpdateConfig={vi.fn()}` to props.

Update the "calls onPlayWithConfig" test — clicking the chip now uses the ▶ play button:

```tsx
it('calls onPlayWithConfig when the play button on a config chip is clicked', async () => {
  const onPlayWithConfig = vi.fn();
  render(
    <GameCard
      entry={mockEntry}
      savedConfigs={[mockConfig]}
      onSaveConfig={vi.fn()}
      onRemoveConfig={vi.fn()}
      onUpdateConfig={vi.fn()}
      onPlay={vi.fn()}
      onPlayWithConfig={onPlayWithConfig}
    />,
    { wrapper },
  );
  await userEvent.click(
    screen.getByRole('button', { name: /play easy mode/i }),
  );
  expect(onPlayWithConfig).toHaveBeenCalledWith('word-spell', 'cfg-1');
});
```

- [ ] **Step 7.10: Run all tests**

```bash
yarn test src/components/GameCard.test.tsx src/components/SavedConfigChip.test.tsx
```

Expected: all tests PASS

- [ ] **Step 7.11: Commit**

```bash
git add src/games/registry.ts src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json src/lib/i18n/locales/en/common.json src/lib/i18n/locales/pt-BR/common.json src/components/GameCard.tsx src/components/GameCard.test.tsx src/components/SaveConfigDialog.tsx src/components/GameGrid.tsx
git commit -m "feat: add game descriptions, color picker to save dialog, SavedConfigChip in GameCard"
```

---

## Task 8: `InstructionsOverlay` redesign

**Files:**
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

- [ ] **Step 8.1: Write the failing tests**

Replace `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { ConfigField } from '@/lib/config-fields';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'instructions.lets-go': "Let's go!",
        'instructions.settings': '⚙️ Settings',
      };
      return map[key] ?? key;
    },
  }),
}));

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
];

const baseProps = {
  text: 'Drag the letters to spell the word.',
  onStart: vi.fn(),
  ttsEnabled: false,
  gameTitle: 'Word Spell',
  subject: 'reading' as const,
  config: { inputMethod: 'drag', totalRounds: 8, ttsEnabled: true },
  onConfigChange: vi.fn(),
  onSaveBookmark: vi.fn(),
  configFields: fields,
};

describe('InstructionsOverlay', () => {
  it('renders the game title chip', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(screen.getByText('Word Spell')).toBeInTheDocument();
  });

  it('renders instructions text', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(
      screen.getByText('Drag the letters to spell the word.'),
    ).toBeInTheDocument();
  });

  it('renders "Let\'s go!" button', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(
      screen.getByRole('button', { name: /let's go/i }),
    ).toBeInTheDocument();
  });

  it('calls onStart when "Let\'s go!" is clicked', async () => {
    const onStart = vi.fn();
    render(<InstructionsOverlay {...baseProps} onStart={onStart} />);
    await userEvent.click(screen.getByRole('button', { name: /let's go/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders settings chip collapsed by default', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(screen.queryByLabelText('Input method')).not.toBeInTheDocument();
  });

  it('expands settings chip when tapped', async () => {
    render(<InstructionsOverlay {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
  });

  it('renders bookmarkName in the chip when provided', () => {
    render(
      <InstructionsOverlay
        {...baseProps}
        bookmarkName="Easy Mode"
        bookmarkColor="teal"
      />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('shows "Save as bookmark" input when no bookmarkName', async () => {
    render(<InstructionsOverlay {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(
      screen.getByPlaceholderText(/e\.g\. easy mode/i),
    ).toBeInTheDocument();
  });

  it('shows Update and Save as new buttons when bookmarkName is provided', async () => {
    const onUpdateBookmark = vi.fn();
    render(
      <InstructionsOverlay
        {...baseProps}
        bookmarkName="Easy Mode"
        bookmarkColor="teal"
        onUpdateBookmark={onUpdateBookmark}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(
      screen.getByRole('button', { name: /update/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 8.2: Run tests to verify they fail**

```bash
yarn test src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: failures on new prop tests (gameTitle, bookmarkName, settings chip, etc.)

- [ ] **Step 8.3: Replace `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`**

```tsx
// src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { GameNameChip } from '@/components/GameNameChip';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import {
  BOOKMARK_COLORS,
  DEFAULT_BOOKMARK_COLOR,
} from '@/lib/bookmark-colors';
import type { ConfigField } from '@/lib/config-fields';
import { configToTags } from '@/lib/config-tags';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  bookmarkName?: string;
  bookmarkColor?: BookmarkColorKey;
  subject?: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveBookmark: (name: string, color: BookmarkColorKey) => Promise<void>;
  onUpdateBookmark?: (
    name: string,
    config: Record<string, unknown>,
  ) => Promise<void>;
  configFields: ConfigField[];
}

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  bookmarkName,
  bookmarkColor = DEFAULT_BOOKMARK_COLOR,
  subject,
  config,
  onConfigChange,
  onSaveBookmark,
  onUpdateBookmark,
  configFields,
}: InstructionsOverlayProps) => {
  const { t } = useTranslation('games');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => { cancelSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settingsColors = BOOKMARK_COLORS[bookmarkColor ?? DEFAULT_BOOKMARK_COLOR];
  const tags = configToTags(config);

  return (
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 flex flex-col items-center justify-start overflow-y-auto bg-background/95 px-5 py-8"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5">

        {/* 1. Game name chip */}
        <div className="w-full">
          <GameNameChip
            title={gameTitle}
            bookmarkName={bookmarkName}
            bookmarkColor={bookmarkColor}
            subject={subject}
          />
        </div>

        {/* 2. Instructions text */}
        <p className="max-w-xs text-center text-base font-semibold text-foreground leading-relaxed">
          {text}
        </p>

        {/* 3. Let's go button */}
        <button
          type="button"
          onClick={onStart}
          className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
        >
          {t('instructions.lets-go')}
        </button>

        {/* 4. Settings chip (collapsed by default) */}
        <div className="w-full overflow-hidden rounded-xl border border-border">
          {/* Settings header */}
          <button
            type="button"
            aria-label={t('instructions.settings')}
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex min-h-12 w-full items-center gap-2 bg-muted px-3 text-left"
            style={
              settingsOpen
                ? { background: settingsColors.playBg }
                : undefined
            }
          >
            <span
              className="flex-1 text-sm font-semibold"
              style={{ color: settingsOpen ? 'white' : undefined }}
            >
              {t('instructions.settings')}
            </span>
            <span
              className="text-xs"
              style={{ color: settingsOpen ? 'rgba(255,255,255,0.7)' : undefined }}
            >
              {settingsOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Collapsed: config summary tags */}
          {!settingsOpen && (
            <div className="flex flex-wrap gap-1 bg-muted/50 px-3 pb-2 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded: form + save actions */}
          {settingsOpen && (
            <div className="flex flex-col gap-3 bg-muted/30 p-3">
              <ConfigFormFields
                fields={configFields}
                config={config}
                onChange={onConfigChange}
              />

              <div className="border-t border-border pt-3 flex flex-col gap-2">
                {bookmarkName && onUpdateBookmark ? (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                      Bookmark name
                      <input
                        type="text"
                        defaultValue={bookmarkName}
                        id="instructions-bookmark-name"
                        className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Update ${bookmarkName}`}
                      onClick={() => {
                        const el = document.getElementById(
                          'instructions-bookmark-name',
                        ) as HTMLInputElement | null;
                        void onUpdateBookmark(
                          el?.value ?? bookmarkName,
                          config,
                        );
                      }}
                      className="h-12 w-full rounded-xl font-bold text-white text-sm"
                      style={{ background: settingsColors.playBg }}
                    >
                      {t('instructions.updateBookmark', {
                        name: bookmarkName,
                        defaultValue: `Update "${bookmarkName}"`,
                      })}
                    </button>
                    <button
                      type="button"
                      aria-label="Save as new bookmark"
                      onClick={() => setSettingsOpen(false)}
                      className="h-12 w-full rounded-xl border border-input bg-background text-sm font-semibold text-primary"
                    >
                      {t('instructions.saveAsNew', {
                        defaultValue: 'Save as new bookmark…',
                      })}
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col gap-1 text-sm font-semibold text-foreground">
                    {t('common:saveConfig.saveBookmarkLabel', {
                      defaultValue: 'Save as bookmark',
                    })}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBookmarkName}
                        onChange={(e) => setNewBookmarkName(e.target.value)}
                        placeholder="e.g. Easy Mode"
                        className="h-12 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Save bookmark"
                        onClick={() => {
                          if (newBookmarkName.trim()) {
                            void onSaveBookmark(
                              newBookmarkName.trim(),
                              DEFAULT_BOOKMARK_COLOR,
                            );
                            setNewBookmarkName('');
                          }
                        }}
                        className="h-12 w-12 flex-shrink-0 rounded-lg bg-primary text-lg text-primary-foreground"
                      >
                        🔖
                      </button>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 8.4: Add the missing i18n key `instructions.settings` to `en/games.json`**

Inside the `instructions` object:

```json
"settings": "⚙️ Settings"
```

Also add to `pt-BR/games.json`:

```json
"settings": "⚙️ Configurações"
```

- [ ] **Step 8.5: Run tests to verify they pass**

```bash
yarn test src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
```

Expected: all 9 tests PASS

- [ ] **Step 8.6: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
git commit -m "feat: redesign InstructionsOverlay with game chip, settings, bookmark save"
```

---

## Task 9: Lift instructions + remove config panels from game components and `$gameId.tsx`

**Files:**
- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`
- Modify: `src/games/word-spell/WordSpell/WordSpell.test.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`
- Modify: `src/games/number-match/NumberMatch/NumberMatch.test.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`
- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

- [ ] **Step 9.1: Remove `showInstructions` + `InstructionsOverlay` from `WordSpell.tsx`**

In `src/games/word-spell/WordSpell/WordSpell.tsx`:

1. Remove the `import { InstructionsOverlay }` line.
2. Remove the `const [showInstructions, setShowInstructions] = useState(true);` line.
3. Remove the entire `if (showInstructions) { return <InstructionsOverlay ... /> }` block.

The component should now render the game directly without checking instructions state.

- [ ] **Step 9.2: Remove `showInstructions` + `InstructionsOverlay` from `NumberMatch.tsx`**

In `src/games/number-match/NumberMatch/NumberMatch.tsx`, apply the same three removals as in Step 9.1.

- [ ] **Step 9.3: Remove `showInstructions` + `InstructionsOverlay` from `SortNumbers.tsx`**

In `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`, apply the same three removals as in Step 9.1.

- [ ] **Step 9.4: Update game component tests to remove instructions-screen assertions**

In each of the three `*.test.tsx` files (`WordSpell.test.tsx`, `NumberMatch.test.tsx`, `SortNumbers.test.tsx`):
- Remove any test that clicks "Let's go!" or checks for "instructions" overlay rendering.
- These tests will be covered by `InstructionsOverlay.test.tsx` already.

Run after each file:

```bash
yarn test src/games/word-spell/WordSpell/WordSpell.test.tsx
yarn test src/games/number-match/NumberMatch/NumberMatch.test.tsx
yarn test src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx
```

Expected: all remaining tests PASS

- [ ] **Step 9.5: Rewrite `$gameId.tsx` — remove config panels, add bookmark loader data, lift instructions**

Replace the relevant sections of `src/routes/$locale/_app/game/$gameId.tsx`.

**Add to imports:**
```ts
import { useTranslation } from 'react-i18next';
import { useSavedConfigs } from '@/db/hooks/useSavedConfigs';
import { wordSpellConfigFields } from '@/games/word-spell/types';
import { numberMatchConfigFields } from '@/games/number-match/types';
import { sortNumbersConfigFields } from '@/games/sort-numbers/types';
import { InstructionsOverlay } from '@/components/answer-game/InstructionsOverlay/InstructionsOverlay';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
```

**Update `GameRouteLoaderData`:**
```ts
interface GameRouteLoaderData {
  config: ResolvedGameConfig;
  initialLog: MoveLog | null;
  sessionId: string;
  meta: SessionMeta;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}
```

**Update the loader** to also fetch and return bookmark metadata:
```ts
let bookmarkId: string | null = null;
let bookmarkName: string | null = null;
let bookmarkColor: string | null = null;

if (deps.configId) {
  const savedDoc = await db.saved_game_configs
    .findOne(deps.configId)
    .exec();
  if (savedDoc) {
    gameSpecificConfig = savedDoc.config;
    bookmarkId = savedDoc.id;
    bookmarkName = savedDoc.name;
    bookmarkColor = savedDoc.color;
  }
} else {
  const lastDoc = await db.saved_game_configs
    .findOne(lastSessionSavedConfigId(gameId))
    .exec();
  if (lastDoc) gameSpecificConfig = lastDoc.config;
}

return { config, initialLog, sessionId, meta, gameSpecificConfig, bookmarkId, bookmarkName, bookmarkColor };
```

**Delete** the three `*ConfigPanel` components (`SortNumbersConfigPanel`, `WordSpellConfigPanel`, `NumberMatchConfigPanel`) entirely.

**Rewrite `WordSpellGameBody`:**

```tsx
const WordSpellGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveWordSpellConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => { setCfg(initial); }, [initial]);
  usePersistLastGameConfig(gameId, cfg as unknown as Record<string, unknown>);

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.word-spell')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('word-spell')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={(bookmarkColor as BookmarkColorKey) ?? undefined}
        subject="reading"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveWordSpellConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={wordSpellConfigFields}
      />
    );
  }

  return <WordSpell key={cfg.inputMethod} config={cfg} />;
};
```

**Rewrite `NumberMatchGameBody`** (same pattern):

```tsx
const NumberMatchGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveNumberMatchConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => { setCfg(initial); }, [initial]);
  usePersistLastGameConfig(gameId, cfg as unknown as Record<string, unknown>);

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.number-match')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('number-match')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={(bookmarkColor as BookmarkColorKey) ?? undefined}
        subject="math"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveNumberMatchConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={numberMatchConfigFields}
      />
    );
  }

  return <NumberMatch key={cfg.inputMethod} config={cfg} />;
};
```

**Rewrite `SortNumbersGameBody`** (same pattern):

```tsx
const SortNumbersGameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const { save, updateConfig } = useSavedConfigs();
  const initial = useMemo(
    () => resolveSortNumbersConfig(gameSpecificConfig),
    [gameSpecificConfig],
  );
  const [cfg, setCfg] = useState(initial);
  const [showInstructions, setShowInstructions] = useState(true);
  useEffect(() => { setCfg(initial); }, [initial]);
  usePersistLastGameConfig(gameId, cfg as unknown as Record<string, unknown>);

  if (showInstructions) {
    return (
      <InstructionsOverlay
        text={t('instructions.sort-numbers')}
        onStart={() => setShowInstructions(false)}
        ttsEnabled={cfg.ttsEnabled}
        gameTitle={t('sort-numbers')}
        bookmarkName={bookmarkName ?? undefined}
        bookmarkColor={(bookmarkColor as BookmarkColorKey) ?? undefined}
        subject="math"
        config={cfg as unknown as Record<string, unknown>}
        onConfigChange={(c) => setCfg(resolveSortNumbersConfig(c))}
        onSaveBookmark={async (name, color) => {
          await save({
            gameId,
            name,
            color,
            config: cfg as unknown as Record<string, unknown>,
          });
        }}
        onUpdateBookmark={
          bookmarkId
            ? async (name, config) => {
                await updateConfig(bookmarkId, config, name);
              }
            : undefined
        }
        configFields={sortNumbersConfigFields}
      />
    );
  }

  return <SortNumbers key={cfg.inputMethod} config={cfg} />;
};
```

**Update `GameBody`** to pass new props:

```tsx
const GameBody = ({
  gameId,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: {
  gameId: string;
  gameSpecificConfig: Record<string, unknown> | null;
  bookmarkId: string | null;
  bookmarkName: string | null;
  bookmarkColor: string | null;
}): JSX.Element => {
  if (gameId === 'sort-numbers') {
    return (
      <SortNumbersGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
  }
  if (gameId === 'word-spell') {
    return (
      <WordSpellGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
  }
  if (gameId === 'number-match') {
    return (
      <NumberMatchGameBody
        gameId={gameId}
        gameSpecificConfig={gameSpecificConfig}
        bookmarkId={bookmarkId}
        bookmarkName={bookmarkName}
        bookmarkColor={bookmarkColor}
      />
    );
  }
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Game not found</p>
    </div>
  );
};
```

**Update `GameRoute`** to pass the new props:

```tsx
export const GameRoute = ({
  config,
  initialLog,
  sessionId,
  meta,
  gameSpecificConfig,
  bookmarkId,
  bookmarkName,
  bookmarkColor,
}: GameRouteLoaderData): JSX.Element => (
  <GameShell
    config={config}
    moves={{}}
    initialState={meta.initialState}
    sessionId={sessionId}
    meta={meta}
    initialLog={initialLog ?? undefined}
  >
    <GameBody
      gameId={config.gameId}
      gameSpecificConfig={gameSpecificConfig}
      bookmarkId={bookmarkId}
      bookmarkName={bookmarkName}
      bookmarkColor={bookmarkColor}
    />
  </GameShell>
);
```

- [ ] **Step 9.6: Run TypeScript check**

```bash
yarn typecheck
```

Expected: no new errors

- [ ] **Step 9.7: Run full test suite**

```bash
yarn test
```

Expected: all tests PASS

- [ ] **Step 9.8: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx src/games/word-spell/WordSpell/WordSpell.test.tsx src/games/number-match/NumberMatch/NumberMatch.tsx src/games/number-match/NumberMatch/NumberMatch.test.tsx src/games/sort-numbers/SortNumbers/SortNumbers.tsx src/games/sort-numbers/SortNumbers/SortNumbers.test.tsx src/routes/$locale/_app/game/$gameId.tsx
git commit -m "feat: lift instructions to game bodies, remove config panels from gameplay"
```

---

## Task 10: `index.tsx` — snapshot last-played config on bookmark save

**Files:**
- Modify: `src/routes/$locale/_app/index.tsx`

- [ ] **Step 10.1: Update `handleSaveConfig` in `src/routes/$locale/_app/index.tsx`**

Add `updateConfig` to the `useSavedConfigs` destructure:

```ts
const { savedConfigs, gameIdsWithConfigs, save, remove, updateConfig } =
  useSavedConfigs();
```

Replace `handleSaveConfig`:

```ts
const handleSaveConfig = async (
  gameId: string,
  name: string,
  color: string,
): Promise<void> => {
  const db = await getOrCreateDatabase();
  const lastDoc = await db.saved_game_configs
    .findOne(lastSessionSavedConfigId(gameId))
    .exec();
  const lastConfig = lastDoc?.config ?? {};
  await save({ gameId, name, config: lastConfig, color: color as BookmarkColorKey });
};
```

Add `handleUpdateConfig` below it:

```ts
const handleUpdateConfig = async (
  configId: string,
  config: Record<string, unknown>,
  name: string,
): Promise<void> => {
  await updateConfig(configId, config, name);
};
```

Add missing imports at the top:

```ts
import { getOrCreateDatabase } from '@/db/create-database';
import { lastSessionSavedConfigId } from '@/db/last-session-game-config';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
```

Pass `onUpdateConfig={handleUpdateConfig}` to `<GameGrid>`.

- [ ] **Step 10.2: Run TypeScript check**

```bash
yarn typecheck
```

Expected: no errors

- [ ] **Step 10.3: Run full test suite**

```bash
yarn test
```

Expected: all tests PASS

- [ ] **Step 10.4: Commit**

```bash
git add src/routes/$locale/_app/index.tsx
git commit -m "feat: snapshot last-played config when saving a bookmark from homepage"
```

---

## Self-Review

After writing the plan, checking spec coverage:

| Spec requirement | Covered by task |
| --- | --- |
| Hide config panel during gameplay | Task 9 (remove `*ConfigPanel`) |
| GameCard: game description | Task 7 (descriptionKey + rendering) |
| GameCard: expandable bookmark chips with config tags | Task 6 + 7 |
| GameCard: inline edit form | Task 4 + 6 |
| Bookmark color (chosen at save time) | Task 1 + 2 + 7 |
| Save config snapshots last-played config | Task 10 |
| `configToTags` auto-generates summary | Task 1 |
| `ConfigField` / `configFields` per game | Task 3 |
| `config-fields-registry` lookup | Task 3 |
| `GameNameChip` display-only | Task 5 |
| `SavedConfigChip` component | Task 6 |
| `useSavedConfigs.updateConfig` | Task 2 |
| `SavedGameConfigDoc.color` + migration | Task 2 |
| `InstructionsOverlay` redesign | Task 8 |
| Instructions: GameNameChip → text → Let's go! → ⚙️ Settings | Task 8 |
| Settings: collapsed with tags, expandable with form | Task 8 |
| Settings: Update bookmark / Save as new / Save bookmark | Task 8 |
| Lift instructions out of game components | Task 9 |
| Bookmark metadata (id, name, color) in loader | Task 9 |
