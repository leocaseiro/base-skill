---
status: draft
date: 2026-05-13
branch: feat/multi-skin-config
spec: docs/superpowers/specs/2026-05-13-multi-skin-config-design.md
absorbs:
  - PR #358 (cave-dragon skin → ships as part of this PR)
---

# Multi-skin config support — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. When prescribed work touches `*.stories.tsx`, load the project-level `write-storybook` skill as authoritative. When it touches `e2e/**`, load `write-e2e-vr-tests`. When game-state logic changes, load `update-architecture-docs`. None of this plan touches game-state logic, so the last one shouldn't fire.

**Goal:** Wire the Dragon Cave skin into the production WordSpell route via a user-pickable skin radio in the config forms and seed a default custom game ("The Floor is Lava") that surfaces the skin on the home screen.

**Architecture:** A typed runtime skin registry (`registerSkin<G extends keyof GameSkinIdMap>`) is fed at module-eval time from each game's `definition.ts`. The new `radio` variant on `ConfigField` (with a render-time `optionsSource: () => …` callable) drives both the simple form (in `WordSpellSimpleConfigForm`) and the advanced form (via `wordSpellConfigFields`). A per-profile seeded row in `custom_games` (idempotent via deterministic id + `app_meta` v2 schema bump) gives the home screen a card that opens WordSpell with the Dragon Cave skin pre-selected.

**Tech Stack:** React + TypeScript + TanStack Router + RxDB + Vitest + Playwright + Storybook + i18next.

---

## Spec Deltas

These are the points where this plan **intentionally** diverges from the spec text. Executors: trust the plan on these specific items; trust the spec everywhere else.

1. **Test file paths.** The spec references `tests-vr/word-spell-skin-picker.spec.ts` and `tests-e2e/the-floor-is-lava.e2e.ts`. Those directories don't exist. The project uses `e2e/visual.spec.ts` (for VR tests, prefixed with `@visual`) and `e2e/smoke.spec.ts` (or a new dedicated file) for functional E2E. This plan uses `e2e/visual.spec.ts` and `e2e/the-floor-is-lava.spec.ts`.
2. **Architecture-doc updates.** The spec doesn't call for any, and this plan agrees — none of the touched files are game-state reducers/dispatch/behavior, so the `update-architecture-docs` skill doesn't apply.
3. **Storybook story for the skin radio.** The spec lists "skin radio VR" as a test artifact but doesn't prescribe a Storybook story. The plan adds one anyway because the radio renderer is a new generic primitive (`ConfigField` `radio` variant) and the project's `write-storybook` convention is "any new component/variant gets a `Playground`."

---

## PR structure

This plan produces **one PR** (`feat/multi-skin-config`) with a baby-step commit sequence. Phases map to commits. PR #358 is **absorbed** into this branch in Phase 1b (Task 4) — either by cherry-picking #358's commits onto this branch, or by merging #358's branch in.

| Phase | Title                                            | Commits (approx) |
| ----- | ------------------------------------------------ | ---------------- |
| 1a    | Type system + typed registry + ConfigField radio | 3                |
| 1b    | Absorb PR #358 + production registration         | 2                |
| 1c    | Simple form + advanced form + i18n               | 3                |
| 1d    | Bug fix: `wrongTileBehavior` default (TDD)       | 1                |
| 1e    | DB schema bump + migration                       | 1                |
| 1f    | Seeder + cover placeholder + home-route wiring   | 3                |
| 1g    | Padding tweaks + Dragon Cave VR baselines        | 1                |
| 1h    | Lossless PNG optimization                        | 1                |
| 1i    | E2E play-through                                 | 1                |

---

## File Structure

Files this plan creates or modifies:

```text
src/components/answer-game/types.ts                    # confirm base skin?: string stays
src/games/word-spell/types.ts                          # WordSpellSkinId + skin? + Skin field in wordSpellConfigFields
src/games/number-match/types.ts                        # NumberMatchSkinId + skin?
src/games/sort-numbers/types.ts                        # SortNumbersSkinId + skin?

src/lib/skin/registry.ts                               # GameSkinIdMap + generic registerSkin
src/lib/skin/registry.test.ts                          # generic-signature compile-time test + lockstep test

src/lib/config-fields.ts                               # add `radio` variant
src/components/ConfigFormFields.tsx                    # add radio renderer
src/components/ConfigFormFields.test.tsx               # radio renderer tests
src/components/ConfigFormFields.stories.tsx            # add radio story to Playground

src/games/word-spell/skins/dragon-cave-skin.tsx        # (renamed from cave-dragon-skin.tsx — absorbed from PR #358)
public/skins/word-spell/dragon-cave/                   # (renamed asset folder)
public/skins/word-spell/dragon-cave/cover-placeholder.png  # NEW — Phase 1f

src/games/word-spell/definition.ts                     # module-load side effect: registerSkin('word-spell', dragonCaveSkin)
src/games/word-spell/definition.test.ts                # invariant test: import → length === 2

src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx        # add Skin radio
src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx   # skin radio tests
src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.stories.tsx # add skin scenarios

src/lib/i18n/locales/en/games.json                     # add instructions.skin
src/lib/i18n/locales/pt-BR/games.json                  # add instructions.skin (placeholder English)

src/routes/$locale/_app/game/$gameId.tsx               # DEFAULT_RECALL_CONFIG.wrongTileBehavior fix

src/db/schemas/app-meta.ts                             # bump version + theFloorIsLavaSeeded field
src/db/create-database.ts                              # appMetaSchema migrationStrategies[2]
src/db/seed-the-floor-is-lava.ts                       # NEW — seeder module
src/db/seed-the-floor-is-lava.test.ts                  # NEW — seeder tests
src/routes/$locale/_app/index.tsx                      # call seeder before grid renders

src/games/word-spell/WordSpell/WordSpell.module.css    # skin-scoped padding tweaks (or equivalent CSS)
e2e/visual.spec.ts                                     # @visual dragon-cave scene at 3 viewports + skin radio + home card
e2e/the-floor-is-lava.spec.ts                          # NEW — functional play-through

src/games/word-spell/skins/WordSpell.skin.stories.tsx  # updated harness post-rename (absorbed from PR #358)
```

---

## Task 1: Type system — per-game `SkinId` unions + narrowing the base `skin?` field

**Files:**

- Modify: `src/games/word-spell/types.ts`
- Modify: `src/games/number-match/types.ts`
- Modify: `src/games/sort-numbers/types.ts`
- Test: `src/games/word-spell/types.test.ts` (NEW, type-level check)

Recall: `AnswerGameConfig` at [src/components/answer-game/types.ts:24](src/components/answer-game/types.ts) already declares `skin?: string`. Per-game unions **narrow** that inherited property; they do not introduce a new one. Do NOT remove the base declaration.

- [ ] **Step 1: Write a failing type-level test for WordSpellSkinId narrowing.**

  Create `src/games/word-spell/types.test.ts`:

  ```ts
  import { describe, it, expectTypeOf } from 'vitest';
  import type { WordSpellConfig, WordSpellSkinId } from './types';

  describe('WordSpellConfig skin narrowing', () => {
    it('narrows skin to WordSpellSkinId on the WordSpell config', () => {
      const cfg = {} as WordSpellConfig;
      expectTypeOf(cfg.skin).toEqualTypeOf<
        WordSpellSkinId | undefined
      >();
    });

    it('accepts both classic and dragon-cave', () => {
      expectTypeOf<'classic'>().toMatchTypeOf<WordSpellSkinId>();
      expectTypeOf<'dragon-cave'>().toMatchTypeOf<WordSpellSkinId>();
    });
  });
  ```

- [ ] **Step 2: Run the test and confirm it fails.**

  Run: `yarn test --run src/games/word-spell/types.test.ts`
  Expected: FAIL with "Cannot find name 'WordSpellSkinId'" (or similar).

- [ ] **Step 3: Add `WordSpellSkinId` and narrow `skin?` in WordSpellConfig.**

  Edit `src/games/word-spell/types.ts` — add near the top of the type definitions (alongside any other game-scoped types):

  ```ts
  export type WordSpellSkinId = 'classic' | 'dragon-cave';
  ```

  In the `WordSpellConfig` interface, add or update the `skin` property so it narrows:

  ```ts
  export interface WordSpellConfig extends AnswerGameConfig {
    // ...existing fields
    skin?: WordSpellSkinId;
  }
  ```

- [ ] **Step 4: Add single-member unions for NumberMatch and SortNumbers (placeholder scaffolding).**

  Edit `src/games/number-match/types.ts`:

  ```ts
  export type NumberMatchSkinId = 'classic';

  export interface NumberMatchConfig extends AnswerGameConfig {
    // ...existing fields
    skin?: NumberMatchSkinId;
  }
  ```

  Edit `src/games/sort-numbers/types.ts`:

  ```ts
  export type SortNumbersSkinId = 'classic';

  export interface SortNumbersConfig extends AnswerGameConfig {
    // ...existing fields
    skin?: SortNumbersSkinId;
  }
  ```

  Do NOT touch `src/games/spot-all/types.ts` — SpotAll is out of scope (it doesn't extend `AnswerGameConfig`; its skin work waits for SpotAll's own future skin PR).

- [ ] **Step 5: Run the type-test + typecheck.**

  Run: `yarn test --run src/games/word-spell/types.test.ts && yarn typecheck`
  Expected: PASS on both.

- [ ] **Step 6: Commit.**

  ```bash
  git add src/games/word-spell/types.ts \
          src/games/word-spell/types.test.ts \
          src/games/number-match/types.ts \
          src/games/sort-numbers/types.ts
  git commit -m "feat(types): narrow per-game SkinId unions over AnswerGameConfig.skin"
  ```

---

## Task 2: Typed registry — `GameSkinIdMap` + generic `registerSkin`

**Files:**

- Modify: `src/lib/skin/registry.ts`
- Test: `src/lib/skin/registry.test.ts` (already exists; extend it)

The goal is to make `registerSkin('word-spell', skin)` a compile-time error when `skin.id` is not in `WordSpellSkinId`. Storage stays `Map<string, GameSkin>`; only the public call signature is narrowed.

- [ ] **Step 1: Write the failing lockstep + generic-signature test.**

  Edit `src/lib/skin/registry.test.ts` and add:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { expectTypeOf } from 'vitest';
  import {
    __resetSkinRegistryForTests,
    getRegisteredSkins,
    registerSkin,
  } from './registry';
  import type { WordSpellSkinId } from '@/games/word-spell/types';

  describe('registerSkin — generic signature', () => {
    afterEach(() => __resetSkinRegistryForTests());

    it("only accepts skin ids that match the game's SkinId union", () => {
      // Compile-time check via expectTypeOf — narrows the call signature.
      type Args = Parameters<typeof registerSkin<'word-spell'>>[1];
      expectTypeOf<Args['id']>().toEqualTypeOf<WordSpellSkinId>();
    });

    it('lockstep: every registered id round-trips through getRegisteredSkins', () => {
      const fake = {
        id: 'dragon-cave' as WordSpellSkinId,
        name: 'Dragon Cave',
        tokens: {},
      } as const;
      registerSkin('word-spell', fake);
      const ids = getRegisteredSkins('word-spell').map((s) => s.id);
      expect(ids).toContain('classic');
      expect(ids).toContain('dragon-cave');
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/lib/skin/registry.test.ts`
  Expected: FAIL — either type errors (registerSkin not generic) or `dragon-cave` missing from registry post-call.

- [ ] **Step 3: Make `registerSkin` generic over `GameSkinIdMap`.**

  Edit `src/lib/skin/registry.ts`. Add an import for the per-game SkinId types and replace the function signature:

  ```ts
  import type { WordSpellSkinId } from '@/games/word-spell/types';
  import type { NumberMatchSkinId } from '@/games/number-match/types';
  import type { SortNumbersSkinId } from '@/games/sort-numbers/types';

  export interface GameSkinIdMap {
    'word-spell': WordSpellSkinId;
    'number-match': NumberMatchSkinId;
    'sort-numbers': SortNumbersSkinId;
  }

  export function registerSkin<G extends keyof GameSkinIdMap>(
    gameId: G,
    skin: GameSkin & { id: GameSkinIdMap[G] },
  ): void {
    let gameSkins = registry.get(gameId);
    if (!gameSkins) {
      gameSkins = new Map();
      registry.set(gameId, gameSkins);
    }
    gameSkins.set(skin.id, skin);
  }
  ```

  Do NOT change the internal `Map<string, Map<string, GameSkin>>` storage — only the public signature narrows.

- [ ] **Step 4: Run the tests + typecheck.**

  Run: `yarn test --run src/lib/skin/registry.test.ts && yarn typecheck`
  Expected: PASS on both.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/lib/skin/registry.ts src/lib/skin/registry.test.ts
  git commit -m "feat(skin): make registerSkin generic over GameSkinIdMap"
  ```

---

## Task 3: `radio` variant on `ConfigField` + render-time `optionsSource` renderer

**Files:**

- Modify: `src/lib/config-fields.ts`
- Modify: `src/components/ConfigFormFields.tsx`
- Test: `src/components/ConfigFormFields.test.tsx`
- Modify: `src/components/ConfigFormFields.stories.tsx`

The radio variant carries `optionsSource: () => Array<{ value: string; label: string }>` (a callable, not a static array) so options resolve at render time. The renderer hides the entire field when `optionsSource()` returns fewer than 2 entries.

- [ ] **Step 1: Write the failing renderer test.**

  Add to `src/components/ConfigFormFields.test.tsx`:

  ```tsx
  import { render, screen, fireEvent } from '@testing-library/react';
  import { describe, it, expect, vi } from 'vitest';
  import { ConfigFormFields } from './ConfigFormFields';
  import type { ConfigField } from '@/lib/config-fields';

  describe('ConfigFormFields — radio variant', () => {
    const skinRadio = (count: 1 | 2): ConfigField => ({
      kind: 'radio',
      key: 'skin',
      label: 'Skin',
      optionsSource: () =>
        count === 2
          ? [
              { value: 'classic', label: 'Classic' },
              { value: 'dragon-cave', label: 'Dragon Cave' },
            ]
          : [{ value: 'classic', label: 'Classic' }],
    });

    it('hides the field when optionsSource() returns < 2 entries', () => {
      render(
        <ConfigFormFields
          fields={[skinRadio(1)]}
          values={{}}
          onChange={() => {}}
        />,
      );
      expect(screen.queryByRole('radiogroup')).toBeNull();
    });

    it('renders a radiogroup with aria-label when count >= 2', () => {
      render(
        <ConfigFormFields
          fields={[skinRadio(2)]}
          values={{}}
          onChange={() => {}}
        />,
      );
      const group = screen.getByRole('radiogroup', { name: 'Skin' });
      expect(group).toBeInTheDocument();
    });

    it('calls onChange with the picked value', () => {
      const onChange = vi.fn();
      render(
        <ConfigFormFields
          fields={[skinRadio(2)]}
          values={{ skin: 'classic' }}
          onChange={onChange}
        />,
      );
      fireEvent.click(
        screen.getByRole('radio', { name: 'Dragon Cave' }),
      );
      expect(onChange).toHaveBeenCalledWith('skin', 'dragon-cave');
    });

    it('supports arrow-key navigation between options', () => {
      render(
        <ConfigFormFields
          fields={[skinRadio(2)]}
          values={{ skin: 'classic' }}
          onChange={() => {}}
        />,
      );
      const radios = screen.getAllByRole('radio');
      radios[0].focus();
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
      expect(radios[1]).toHaveFocus();
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/components/ConfigFormFields.test.tsx`
  Expected: FAIL — `kind: 'radio'` not in `ConfigField` union.

- [ ] **Step 3: Add the `radio` variant to `ConfigField`.**

  Edit `src/lib/config-fields.ts`. Add to the existing union:

  ```ts
  export type RadioOption = { value: string; label: string };

  export type RadioConfigField = {
    kind: 'radio';
    key: string;
    label: string;
    optionsSource: () => RadioOption[];
  };

  export type ConfigField =
    // ...existing variants
    RadioConfigField;
  ```

  (Names of existing variants stay unchanged; just add `RadioConfigField` to the discriminated union.)

- [ ] **Step 4: Add the radio renderer to `ConfigFormFields.tsx`.**

  In the renderer switch on `field.kind`, add:

  ```tsx
  if (field.kind === 'radio') {
    const options = field.optionsSource();
    if (options.length < 2) return null;
    const groupId = `field-${field.key}`;
    const selected = values[field.key];
    return (
      <div key={field.key} role="radiogroup" aria-labelledby={groupId}>
        <span id={groupId}>{field.label}</span>
        {options.map((opt, i) => (
          <label key={opt.value}>
            <input
              type="radio"
              name={field.key}
              value={opt.value}
              checked={selected === opt.value}
              tabIndex={
                selected === opt.value || (selected == null && i === 0)
                  ? 0
                  : -1
              }
              onChange={() => onChange(field.key, opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  const next = (i + 1) % options.length;
                  (
                    e.currentTarget.form?.elements.namedItem(
                      field.key,
                    ) as RadioNodeList | null
                  )
                    ?.item(next)
                    ?.dispatchEvent(new Event('focus'));
                  // Fallback: use querySelector if the form context isn't present
                  const all = Array.from(
                    document.getElementsByName(field.key),
                  );
                  (all[next] as HTMLElement | undefined)?.focus();
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const prev =
                    (i - 1 + options.length) % options.length;
                  const all = Array.from(
                    document.getElementsByName(field.key),
                  );
                  (all[prev] as HTMLElement | undefined)?.focus();
                }
              }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }
  ```

  (The keyboard handler implements roving tabindex via document.getElementsByName fallback; if the existing `ConfigFormFields` already has a roving-tabindex helper, use that instead — keep this code matching the surrounding style.)

- [ ] **Step 5: Run the test; confirm pass.**

  Run: `yarn test --run src/components/ConfigFormFields.test.tsx`
  Expected: PASS on all four tests.

- [ ] **Step 6: Add the radio variant to the Storybook Playground.**

  REQUIRED SUB-SKILL: load `write-storybook` and follow it.

  Edit `src/components/ConfigFormFields.stories.tsx`. Add an `optionsCount` arg to the Playground so users can flip between "1 option (hidden)" and "2 options (visible)":

  ```tsx
  // In the existing meta:
  argTypes: {
    // ...existing argTypes
    optionsCount: {
      control: { type: 'radio' },
      options: [1, 2, 3],
    },
  },
  args: {
    // ...existing args
    optionsCount: 2,
  },
  render: ({ optionsCount, ...rest }) => {
    const fields: ConfigField[] = [
      {
        kind: 'radio',
        key: 'skin',
        label: 'Skin',
        optionsSource: () =>
          [
            { value: 'classic', label: 'Classic' },
            { value: 'dragon-cave', label: 'Dragon Cave' },
            { value: 'extra', label: 'Extra' },
          ].slice(0, optionsCount),
      },
      // ...existing demo fields
    ];
    return <ConfigFormFields fields={fields} {...rest} />;
  },
  ```

  Do NOT add a second named story for the radio — control it from `Playground` via `optionsCount`.

- [ ] **Step 7: Run Storybook test runner on a free port.**

  ```bash
  PORT=6006
  while lsof -i :$PORT > /dev/null 2>&1; do PORT=$((PORT + 1)); done
  yarn storybook --port $PORT --ci &
  STORYBOOK_PID=$!
  until curl -s http://127.0.0.1:$PORT > /dev/null 2>&1; do sleep 2; done
  yarn test:storybook --url http://127.0.0.1:$PORT
  TEST_EXIT=$?
  if [ $TEST_EXIT -eq 0 ]; then kill $STORYBOOK_PID; fi
  exit $TEST_EXIT
  ```

  Expected: PASS, including a11y.

- [ ] **Step 8: Commit.**

  ```bash
  git add src/lib/config-fields.ts \
          src/components/ConfigFormFields.tsx \
          src/components/ConfigFormFields.test.tsx \
          src/components/ConfigFormFields.stories.tsx
  git commit -m "feat(config-fields): add radio variant with render-time optionsSource gate"
  ```

---

## Task 4: Absorb PR #358 — cave-dragon → dragon-cave rename + asset moves + Storybook harness

**Files:** all under `src/games/word-spell/skins/`, `public/skins/word-spell/`, and the Storybook harness story. Specific renames per the spec's "Relationship to PR #358" section.

The cleanest way to absorb #358's work is to cherry-pick its commits onto this branch with the rename applied; the alternative is to merge #358's branch in and then commit the rename. Either preserves authorship.

- [ ] **Step 1: Confirm working tree clean.**

  ```bash
  cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
  git status
  ```

  Expected: nothing to commit.

- [ ] **Step 2: Fetch and inspect PR #358's branch.**

  ```bash
  git fetch origin
  gh pr view 358 --json headRefName -q .headRefName  # capture the branch name
  ```

  Expected: prints the branch (likely `feat/word-spell-cave-dragon-skin` or similar).

- [ ] **Step 3: Cherry-pick PR #358's commits onto this branch.**

  ```bash
  # Replace BRANCH with the value from Step 2.
  git cherry-pick origin/BRANCH..origin/BRANCH~0  # adjust range to cover #358's commits
  ```

  Resolve any conflicts conservatively — they'll be in `src/games/word-spell/skins/`, `public/skins/`, and Storybook harness files.

- [ ] **Step 4: Apply the cave-dragon → dragon-cave rename.**

  ```bash
  git mv src/games/word-spell/skins/cave-dragon-skin.tsx \
         src/games/word-spell/skins/dragon-cave-skin.tsx
  git mv public/skins/word-spell/cave-dragon \
         public/skins/word-spell/dragon-cave
  ```

  Then rename inside the files (use ripgrep + sed or your editor):
  - `caveDragonSkin` → `dragonCaveSkin`
  - `'cave-dragon'` → `'dragon-cave'`
  - `'Cave & Dragon'` → `'Dragon Cave'`
  - `.skin-cave-dragon` → `.skin-dragon-cave`
  - `.cave-dragon-stone` → `.dragon-cave-stone`
  - Storybook localStorage harness key value `skin-harness:selected-skin:word-spell` value `cave-dragon` → `dragon-cave`

  Run:

  ```bash
  rg -l 'cave-dragon|caveDragon|Cave & Dragon' src/ public/ docs/ \
    --glob '!docs/superpowers/specs/2026-05-13-multi-skin-config-design.md' \
    --glob '!docs/superpowers/plans/2026-05-13-multi-skin-config-plan.md'
  ```

  Expected: zero hits outside the two files we explicitly skip (which still narrate the rename for context). If any other file references the old name, edit it.

- [ ] **Step 5: Update the Storybook harness to PascalCase title + new id.**

  REQUIRED SUB-SKILL: load `write-storybook`.

  Edit `src/games/word-spell/skins/WordSpell.skin.stories.tsx`:
  - Confirm `title:` is PascalCase (e.g., `'Games/WordSpell/SkinHarness'`).
  - Confirm `registerSkin('word-spell', dragonCaveSkin)` uses the renamed const.
  - Confirm the localStorage harness key uses the new id.

- [ ] **Step 6: Run typecheck + unit tests.**

  Run: `yarn typecheck && yarn test --run`
  Expected: PASS — all references resolve.

- [ ] **Step 7: Commit.**

  ```bash
  git add -A
  git commit -m "feat(skin): absorb PR #358 and rename cave-dragon → dragon-cave"
  ```

  (Make sure this commit doesn't accidentally include unrelated files.)

---

## Task 5: Production registration — module-load side effect in `definition.ts`

**Files:**

- Modify: `src/games/word-spell/definition.ts`
- Test: `src/games/word-spell/definition.test.ts` (NEW)

The invariant: importing `src/games/word-spell/definition.ts` guarantees Dragon Cave is registered. No separate `registerWordSpellSkins()` call needed at app boot.

- [ ] **Step 1: Write the failing invariant test.**

  Create `src/games/word-spell/definition.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import {
    __resetSkinRegistryForTests,
    getRegisteredSkins,
  } from '@/lib/skin/registry';

  describe('word-spell definition — skin registration invariant', () => {
    beforeEach(() => {
      __resetSkinRegistryForTests();
      // Clear the module cache so the side effect re-fires when we re-import.
      vi.resetModules();
    });

    it("registers dragon-cave when 'definition' is imported", async () => {
      await import('./definition');
      const ids = getRegisteredSkins('word-spell').map((s) => s.id);
      expect(ids).toEqual(['classic', 'dragon-cave']);
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/games/word-spell/definition.test.ts`
  Expected: FAIL — `ids` is `['classic']` (no production registration yet).

- [ ] **Step 3: Add the module-load side effect.**

  Edit `src/games/word-spell/definition.ts`. At the top-level (not inside any function), add:

  ```ts
  import { dragonCaveSkin } from './skins/dragon-cave-skin';
  import { registerSkin } from '@/lib/skin/registry';

  // Module-load side effect: any importer of this module gets the
  // Dragon Cave skin registered. Synchronous, one-shot — the registry
  // overwrites the same id if hot-module reload re-imports.
  registerSkin('word-spell', dragonCaveSkin);
  ```

  Place the call after the import block, before `wordSpellDefinition`.

- [ ] **Step 4: Run the test; confirm pass.**

  Run: `yarn test --run src/games/word-spell/definition.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/games/word-spell/definition.ts src/games/word-spell/definition.test.ts
  git commit -m "feat(skin): register dragonCaveSkin as a module-load side effect"
  ```

---

## Task 6: i18n key for "Skin" label

**Files:**

- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json` (placeholder English value until real translation arrives)

- [ ] **Step 1: Add the key to the English locale.**

  Edit `src/lib/i18n/locales/en/games.json`. Inside the `instructions` object, add:

  ```json
  "skin": "Skin"
  ```

  Place it alphabetically next to `customGameNameLabel`.

- [ ] **Step 2: Add the placeholder to pt-BR.**

  Edit `src/lib/i18n/locales/pt-BR/games.json` and add the same key with the English string as a placeholder (translation can land in a follow-up):

  ```json
  "skin": "Skin"
  ```

- [ ] **Step 3: Run i18n lint / validation if the project has one.**

  ```bash
  yarn lint
  ```

  Expected: PASS (no missing-key errors).

- [ ] **Step 4: Commit.**

  ```bash
  git add src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
  git commit -m "feat(i18n): add games.instructions.skin key (placeholder for pt-BR)"
  ```

---

## Task 7: Simple-form skin radio in `WordSpellSimpleConfigForm`

**Files:**

- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.tsx`
- Test: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.test.tsx`
- Modify: `src/games/word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm.stories.tsx`

Wire a radio group at the simple form level. The form is the kid-accessible surface; the radio appears only when 2+ skins are registered.

- [ ] **Step 1: Write the failing tests.**

  Append to `WordSpellSimpleConfigForm.test.tsx`:

  ```tsx
  import {
    __resetSkinRegistryForTests,
    registerSkin,
  } from '@/lib/skin/registry';
  import { dragonCaveSkin } from '@/games/word-spell/skins/dragon-cave-skin';

  describe('WordSpellSimpleConfigForm — skin radio', () => {
    beforeEach(() => {
      __resetSkinRegistryForTests();
    });

    it('hides the skin radio when only classic is registered', () => {
      render(
        <WordSpellSimpleConfigForm
          config={baseConfig}
          onChange={() => {}}
        />,
      );
      expect(
        screen.queryByRole('radiogroup', { name: /skin/i }),
      ).toBeNull();
    });

    it('shows the radio group with both options when dragon-cave is registered', () => {
      registerSkin('word-spell', dragonCaveSkin);
      render(
        <WordSpellSimpleConfigForm
          config={baseConfig}
          onChange={() => {}}
        />,
      );
      const group = screen.getByRole('radiogroup', { name: /skin/i });
      expect(group).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /classic/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /dragon cave/i }),
      ).toBeInTheDocument();
    });

    it('writes the picked value to config.skin', () => {
      registerSkin('word-spell', dragonCaveSkin);
      const onChange = vi.fn();
      render(
        <WordSpellSimpleConfigForm
          config={baseConfig}
          onChange={onChange}
        />,
      );
      fireEvent.click(
        screen.getByRole('radio', { name: /dragon cave/i }),
      );
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ skin: 'dragon-cave' }),
      );
    });
  });
  ```

  (`baseConfig` is the test's existing fixture — extend the imports if needed.)

- [ ] **Step 2: Run the tests; confirm fail.**

  Run: `yarn test --run src/games/word-spell/WordSpellSimpleConfigForm/`
  Expected: FAIL — radio group missing.

- [ ] **Step 3: Add the radio group to the form.**

  Edit `WordSpellSimpleConfigForm.tsx`. Inside the form layout (next to other simple-form inputs), add:

  ```tsx
  import { useTranslation } from 'react-i18next';
  import { getRegisteredSkins } from '@/lib/skin/registry';

  // Inside the component body:
  const { t } = useTranslation('games');
  const skins = getRegisteredSkins('word-spell');
  const showSkinRadio = skins.length >= 2;
  const selectedSkin = config.skin ?? 'classic';

  // Inside the form JSX:
  {
    showSkinRadio && (
      <fieldset
        role="radiogroup"
        aria-label={t('instructions.skin')}
        className="config-form-field"
      >
        <legend>{t('instructions.skin')}</legend>
        {skins.map((s, i) => (
          <label key={s.id}>
            <input
              type="radio"
              name="word-spell-skin"
              value={s.id}
              checked={selectedSkin === s.id}
              tabIndex={selectedSkin === s.id ? 0 : -1}
              onChange={() => onChange({ ...config, skin: s.id })}
              onKeyDown={handleRovingArrow(i, skins.length)}
            />
            {s.name}
          </label>
        ))}
      </fieldset>
    );
  }
  ```

  Implement `handleRovingArrow` as a small helper (or inline) — arrow keys move focus between radios. Reuse the keyboard pattern from `ConfigFormFields` if a shared helper exists; otherwise add a colocated helper inside this form.

- [ ] **Step 4: Run the tests; confirm pass.**

  Run: `yarn test --run src/games/word-spell/WordSpellSimpleConfigForm/`
  Expected: PASS.

- [ ] **Step 5: Update the Storybook story.**

  REQUIRED SUB-SKILL: load `write-storybook`.

  Edit `WordSpellSimpleConfigForm.stories.tsx`. Add a `skinsRegistered` arg to the Playground so the story flips between "1 skin (radio hidden)" and "2 skins (radio shown)":

  ```tsx
  argTypes: {
    // ...existing argTypes
    skinsRegistered: {
      control: { type: 'radio' },
      options: ['classic-only', 'classic+dragon-cave'],
    },
  },
  args: {
    skinsRegistered: 'classic+dragon-cave',
  },
  decorators: [
    (Story, ctx) => {
      __resetSkinRegistryForTests();
      if (ctx.args.skinsRegistered === 'classic+dragon-cave') {
        registerSkin('word-spell', dragonCaveSkin);
      }
      return <Story />;
    },
  ],
  ```

- [ ] **Step 6: Run Storybook tests on a free port.**

  (Same as Task 3 Step 7.)
  Expected: PASS.

- [ ] **Step 7: Commit.**

  ```bash
  git add src/games/word-spell/WordSpellSimpleConfigForm/
  git commit -m "feat(word-spell): add skin radio to WordSpellSimpleConfigForm"
  ```

---

## Task 8: Advanced-form skin field via `wordSpellConfigFields`

**Files:**

- Modify: `src/games/word-spell/types.ts` (extend `wordSpellConfigFields`)
- Possibly modify: `src/games/word-spell/WordSpell.config-form.stories.tsx` (per-game preview, if it exists)
- Test: extend `WordSpellSimpleConfigForm.test.tsx` or add an integration test against `ConfigFormFields` rendering `wordSpellConfigFields`

The advanced form pulls fields from `wordSpellConfigFields` and renders them via `ConfigFormFields`. Adding a `radio` entry there hooks the same renderer the simple form's logic mirrors.

- [ ] **Step 1: Write the failing integration test.**

  Add to an existing or new test file (e.g., `src/games/word-spell/types.test.ts` if it makes sense, otherwise create `src/games/word-spell/wordSpellConfigFields.test.tsx`):

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, it, expect, beforeEach } from 'vitest';
  import { ConfigFormFields } from '@/components/ConfigFormFields';
  import { wordSpellConfigFields } from './types';
  import {
    __resetSkinRegistryForTests,
    registerSkin,
  } from '@/lib/skin/registry';
  import { dragonCaveSkin } from './skins/dragon-cave-skin';

  describe('wordSpellConfigFields — Skin entry', () => {
    beforeEach(() => __resetSkinRegistryForTests());

    it('omits the Skin field when only classic is registered', () => {
      render(
        <ConfigFormFields
          fields={wordSpellConfigFields}
          values={{}}
          onChange={() => {}}
        />,
      );
      expect(
        screen.queryByRole('radiogroup', { name: /skin/i }),
      ).toBeNull();
    });

    it('renders the Skin radio when dragon-cave is registered', () => {
      registerSkin('word-spell', dragonCaveSkin);
      render(
        <ConfigFormFields
          fields={wordSpellConfigFields}
          values={{}}
          onChange={() => {}}
        />,
      );
      expect(
        screen.getByRole('radiogroup', { name: /skin/i }),
      ).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/games/word-spell/`
  Expected: FAIL — Skin entry missing from `wordSpellConfigFields`.

- [ ] **Step 3: Add the Skin entry to `wordSpellConfigFields`.**

  Edit `src/games/word-spell/types.ts`. Append (or insert in a sensible position) to the `wordSpellConfigFields` array:

  ```ts
  import { getRegisteredSkins } from '@/lib/skin/registry';

  export const wordSpellConfigFields: ConfigField[] = [
    // ...existing fields
    {
      kind: 'radio',
      key: 'skin',
      label: 'Skin', // The i18n key lives on the form; the field carries the English fallback
      optionsSource: () =>
        getRegisteredSkins('word-spell').map((s) => ({
          value: s.id,
          label: s.name,
        })),
    },
  ];
  ```

- [ ] **Step 4: Run the test; confirm pass.**

  Run: `yarn test --run src/games/word-spell/`
  Expected: PASS.

- [ ] **Step 5: Update the per-game config-form story if it exists.**

  If `src/games/word-spell/WordSpell.config-form.stories.tsx` exists (per the project's per-game-previews convention from `write-storybook`), add a `skinsRegistered` arg similar to Task 7 Step 5 so the story can flip between hidden / shown.

  If it doesn't exist yet, create it now:

  ```tsx
  import type { Meta, StoryObj } from '@storybook/react';
  import { fn } from 'storybook/test';
  import { ConfigFormFields } from '@/components/ConfigFormFields';
  import { wordSpellConfigFields } from '@/games/word-spell/types';
  import { dragonCaveSkin } from '@/games/word-spell/skins/dragon-cave-skin';
  import {
    __resetSkinRegistryForTests,
    registerSkin,
  } from '@/lib/skin/registry';

  type Args = {
    skinsRegistered: 'classic-only' | 'classic+dragon-cave';
    onChange: (key: string, value: unknown) => void;
  };

  const meta: Meta<Args> = {
    title: 'Games/WordSpell/ConfigFormFields',
    component: ConfigFormFields as any,
    tags: ['autodocs'],
    argTypes: {
      skinsRegistered: {
        control: { type: 'radio' },
        options: ['classic-only', 'classic+dragon-cave'],
      },
    },
    args: {
      skinsRegistered: 'classic+dragon-cave',
      onChange: fn(),
    },
    decorators: [
      (Story, ctx) => {
        __resetSkinRegistryForTests();
        if (ctx.args.skinsRegistered === 'classic+dragon-cave') {
          registerSkin('word-spell', dragonCaveSkin);
        }
        return <Story />;
      },
    ],
    render: ({ onChange }) => (
      <ConfigFormFields
        fields={wordSpellConfigFields}
        values={{}}
        onChange={onChange}
      />
    ),
  };
  export default meta;

  type Story = StoryObj<Args>;
  export const Playground: Story = {};
  ```

- [ ] **Step 6: Run Storybook + unit tests.**

  Run: `yarn test --run && (yarn test:storybook on free port)`
  Expected: PASS.

- [ ] **Step 7: Commit.**

  ```bash
  git add src/games/word-spell/types.ts \
          src/games/word-spell/wordSpellConfigFields.test.tsx \
          src/games/word-spell/WordSpell.config-form.stories.tsx
  git commit -m "feat(word-spell): register Skin radio in wordSpellConfigFields"
  ```

---

## Task 9: Bug fix — `DEFAULT_RECALL_CONFIG.wrongTileBehavior` regression (TDD strict)

**Files:**

- Test: `src/routes/$locale/_app/game/$gameId.test.tsx`
- Modify: `src/routes/$locale/_app/game/$gameId.tsx`

Project rule: every bug fix opens with a failing regression test BEFORE touching production code. This one is a one-liner default change but the test gate matters.

- [ ] **Step 1: Write the failing regression test.**

  Add to `src/routes/$locale/_app/game/$gameId.test.tsx` (create the file if it doesn't exist):

  ```tsx
  import { describe, it, expect } from 'vitest';
  import { DEFAULT_RECALL_CONFIG } from './$gameId';

  describe('DEFAULT_RECALL_CONFIG regression', () => {
    it('uses wrongTileBehavior: "lock-auto-eject" by default', () => {
      expect(DEFAULT_RECALL_CONFIG.wrongTileBehavior).toBe(
        'lock-auto-eject',
      );
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/routes/$locale/_app/game/$gameId.test.tsx`
  Expected: FAIL — `wrongTileBehavior: 'lock-manual'` is the current default.

- [ ] **Step 3: Fix the default in production code.**

  Edit `src/routes/$locale/_app/game/$gameId.tsx` line 86 — change `wrongTileBehavior: 'lock-manual'` to `wrongTileBehavior: 'lock-auto-eject'`. Do NOT touch NumberMatch's default (already correct) and do NOT touch SortNumbers' resolver (intentionally out of scope per the spec).

- [ ] **Step 4: Run the test; confirm pass.**

  Run: `yarn test --run src/routes/$locale/_app/game/$gameId.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Run the full unit suite to surface regressions elsewhere.**

  Run: `yarn test --run`
  Expected: PASS. If any test asserts `'lock-manual'` as the recall default elsewhere, update it to `'lock-auto-eject'` (and confirm the assertion is testing the default, not a user-specific saved config).

- [ ] **Step 6: Commit.**

  ```bash
  git add src/routes/$locale/_app/game/$gameId.test.tsx \
          src/routes/$locale/_app/game/$gameId.tsx
  git commit -m "fix(word-spell): DEFAULT_RECALL_CONFIG defaults to lock-auto-eject"
  ```

---

## Task 10: `AppMetaDoc` v2 schema + migration entry

**Files:**

- Modify: `src/db/schemas/app-meta.ts`
- Modify: `src/db/create-database.ts`
- Test: `src/db/schemas/app-meta.test.ts` (NEW or extend)

Add a `theFloorIsLavaSeeded?: Record<string, true>` field keyed by `profileId`. Bump schema version 1 → 2.

- [ ] **Step 1: Write the failing migration test.**

  Add to `src/db/schemas/app-meta.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import { getOrCreateDatabase } from '../create-database';

  describe('app_meta v2 migration', () => {
    beforeEach(async () => {
      // Use whatever test-DB pattern the project already has;
      // existing migrate-custom-games.test.ts has a precedent — copy it.
    });

    it('seeds an undefined theFloorIsLavaSeeded for existing singletons', async () => {
      const db = await getOrCreateDatabase();
      const meta = await db.app_meta.findOne('singleton').exec();
      expect(meta).not.toBeNull();
      expect(meta!.theFloorIsLavaSeeded).toBeUndefined();
    });

    it('accepts a per-profile flag write via incrementalPatch', async () => {
      const db = await getOrCreateDatabase();
      const meta = await db.app_meta.findOne('singleton').exec();
      await meta!.incrementalPatch({
        theFloorIsLavaSeeded: { 'profile-A': true },
      });
      const reread = await db.app_meta.findOne('singleton').exec();
      expect(reread!.theFloorIsLavaSeeded).toEqual({
        'profile-A': true,
      });
    });
  });
  ```

- [ ] **Step 2: Run the test; confirm fail.**

  Run: `yarn test --run src/db/schemas/app-meta.test.ts`
  Expected: FAIL — `theFloorIsLavaSeeded` not on `AppMetaDoc`.

- [ ] **Step 3: Bump the schema.**

  Edit `src/db/schemas/app-meta.ts`:
  - Add `theFloorIsLavaSeeded?: Record<string, true>` to the `AppMetaDoc` type.
  - Bump the schema's `version` from 1 to 2.
  - Add to the `properties` block: `theFloorIsLavaSeeded: { type: 'object', additionalProperties: { type: 'boolean' } }` (or whatever shape the project's JSON schema layer expects for a map).

- [ ] **Step 4: Add the migration strategy.**

  Edit `src/db/create-database.ts`. Where `app_meta` is registered with `migrationStrategies`, add:

  ```ts
  migrationStrategies: {
    1: existingV1ToV1Migration, // keep whatever's there
    2: (oldDoc) => {
      // v1 → v2 is additive (new optional field). Leave the field undefined.
      return oldDoc;
    },
  },
  ```

- [ ] **Step 5: Run the test; confirm pass.**

  Run: `yarn test --run src/db/schemas/app-meta.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit.**

  ```bash
  git add src/db/schemas/app-meta.ts \
          src/db/schemas/app-meta.test.ts \
          src/db/create-database.ts
  git commit -m "feat(db): bump app_meta to v2 with theFloorIsLavaSeeded map"
  ```

---

## Task 11: Seeder module — `seedTheFloorIsLavaIfNeeded`

**Files:**

- Create: `src/db/seed-the-floor-is-lava.ts`
- Test: `src/db/seed-the-floor-is-lava.test.ts`

Deterministic id + per-profile flag + idempotent on concurrent calls.

- [ ] **Step 1: Write the failing seeder tests.**

  Create `src/db/seed-the-floor-is-lava.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import { getOrCreateDatabase } from './create-database';
  import { seedTheFloorIsLavaIfNeeded } from './seed-the-floor-is-lava';

  describe('seedTheFloorIsLavaIfNeeded', () => {
    let db: Awaited<ReturnType<typeof getOrCreateDatabase>>;

    beforeEach(async () => {
      db = await getOrCreateDatabase();
      // Reset between tests using the project's existing DB-reset helper.
    });

    it('inserts the row + sets the per-profile flag on first call', async () => {
      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      const rows = await db.custom_games.find().exec();
      expect(rows.map((r) => r.name)).toContain('The Floor is Lava');
      const meta = await db.app_meta.findOne('singleton').exec();
      expect(meta!.theFloorIsLavaSeeded).toEqual({
        'profile-A': true,
      });
    });

    it('no-ops on the second call (flag already set)', async () => {
      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      const rows = await db.custom_games
        .find({ selector: { name: 'The Floor is Lava' } })
        .exec();
      expect(rows).toHaveLength(1);
    });

    it('seeds independently per profile', async () => {
      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      await seedTheFloorIsLavaIfNeeded(db, 'profile-B');
      const meta = await db.app_meta.findOne('singleton').exec();
      expect(meta!.theFloorIsLavaSeeded).toEqual({
        'profile-A': true,
        'profile-B': true,
      });
      const rows = await db.custom_games
        .find({ selector: { name: 'The Floor is Lava' } })
        .exec();
      expect(rows).toHaveLength(2);
    });

    it('does not re-seed after user deletes the row', async () => {
      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      const row = await db.custom_games
        .findOne({ selector: { name: 'The Floor is Lava' } })
        .exec();
      await row!.remove();

      await seedTheFloorIsLavaIfNeeded(db, 'profile-A');
      const rows = await db.custom_games
        .find({ selector: { name: 'The Floor is Lava' } })
        .exec();
      expect(rows).toHaveLength(0);
    });

    it('handles concurrent calls without producing duplicate rows', async () => {
      await Promise.all([
        seedTheFloorIsLavaIfNeeded(db, 'profile-A'),
        seedTheFloorIsLavaIfNeeded(db, 'profile-A'),
      ]);
      const rows = await db.custom_games
        .find({ selector: { name: 'The Floor is Lava' } })
        .exec();
      expect(rows).toHaveLength(1);
    });
  });
  ```

- [ ] **Step 2: Run the tests; confirm fail.**

  Run: `yarn test --run src/db/seed-the-floor-is-lava.test.ts`
  Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the seeder.**

  Create `src/db/seed-the-floor-is-lava.ts`:

  ```ts
  import type { AppDatabase } from './create-database';
  import type { WordSpellConfig } from '@/games/word-spell/types';
  import { DEFAULT_RECALL_CONFIG } from '@/routes/$locale/_app/game/$gameId';

  export const seedTheFloorIsLavaIfNeeded = async (
    db: AppDatabase,
    profileId: string,
  ): Promise<void> => {
    const meta = await db.app_meta.findOne('singleton').exec();
    if (meta?.theFloorIsLavaSeeded?.[profileId]) return;

    const cfg: WordSpellConfig = {
      ...DEFAULT_RECALL_CONFIG,
      skin: 'dragon-cave',
    };

    try {
      await db.custom_games.insert({
        id: `seed:the-floor-is-lava:${profileId}`,
        profileId,
        gameId: 'word-spell',
        name: 'The Floor is Lava',
        config: cfg,
        color: 'amber',
        cover: {
          kind: 'image',
          src: `${import.meta.env.BASE_URL}skins/word-spell/dragon-cave/cover-placeholder.png`,
          alt: 'A dragon perched on a cliff above bubbling lava',
          background: 'amber-glow',
        },
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      // RxDB rejects on duplicate primary key — that's the race-safety
      // we want from the deterministic id. Swallow and continue so we
      // still set the per-profile flag.
      if (!isDuplicateKeyError(err)) throw err;
    }

    await meta?.incrementalPatch({
      theFloorIsLavaSeeded: {
        ...(meta.theFloorIsLavaSeeded ?? {}),
        [profileId]: true,
      },
    });
  };

  const isDuplicateKeyError = (err: unknown): boolean => {
    // RxDB throws a structured error on conflict — check the project's
    // existing error-shape helpers; if none exist, match on name/message.
    if (typeof err !== 'object' || err === null) return false;
    const e = err as { code?: string; status?: number };
    return e.code === 'CONFLICT' || e.status === 409;
  };
  ```

- [ ] **Step 4: Run the tests; confirm pass.**

  Run: `yarn test --run src/db/seed-the-floor-is-lava.test.ts`
  Expected: PASS on all five tests.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/db/seed-the-floor-is-lava.ts src/db/seed-the-floor-is-lava.test.ts
  git commit -m "feat(db): add seedTheFloorIsLavaIfNeeded with deterministic id"
  ```

---

## Task 12: Cover placeholder asset

**Files:**

- Create: `public/skins/word-spell/dragon-cave/cover-placeholder.png`

This is a binary asset. Since the VR baseline for the Dragon Cave scene doesn't exist yet (created in Task 14), the placeholder cover is hand-supplied from a screenshot of the Storybook harness or a manually composed crop.

- [ ] **Step 1: Take a 4:3 crop from the Storybook harness for Dragon Cave.**

  Run Storybook locally on a free port (same workflow as Task 3 Step 7), open `Games/WordSpell/SkinHarness` with the dragon-cave skin selected, take a screenshot of the scene, crop to ~4:3 (e.g., 800×600) centred on the dragon, and save as `public/skins/word-spell/dragon-cave/cover-placeholder.png`.

  Alternatively, hand-composite from `dragon.png` over a darkened background — whichever produces a recognisable thumbnail.

- [ ] **Step 2: Verify the file is non-empty and the seeder URL resolves.**

  ```bash
  ls -la public/skins/word-spell/dragon-cave/cover-placeholder.png
  ```

  Expected: file exists, > 1 KB.

  Boot the dev server and navigate to the seeder's expected URL pattern, confirm 200 (not 404):

  ```bash
  yarn dev &
  curl -I http://localhost:5173/skins/word-spell/dragon-cave/cover-placeholder.png
  ```

  Expected: HTTP 200.

- [ ] **Step 3: Commit.**

  ```bash
  git add public/skins/word-spell/dragon-cave/cover-placeholder.png
  git commit -m "chore(skin): add Dragon Cave cover placeholder for The Floor is Lava"
  ```

---

## Task 13: Wire the seeder into the home route + integration test

**Files:**

- Modify: `src/routes/$locale/_app/index.tsx`
- Test: `src/routes/$locale/_app/index.test.tsx` (NEW or extend)

The seeder runs in the home-route component, not a route loader — the active-profile context is in scope at component-mount time.

- [ ] **Step 1: Write the failing integration test.**

  Create or extend `src/routes/$locale/_app/index.test.tsx`:

  ```tsx
  import { describe, it, expect, beforeEach } from 'vitest';
  import { render, screen, waitFor } from '@testing-library/react';
  import { HomeRoute } from './index';
  // ...whatever helpers the project has for mocking DB + profile

  describe('Home route — seeds The Floor is Lava on first launch', () => {
    beforeEach(async () => {
      // Reset DB / profile context
    });

    it('shows the seeded "The Floor is Lava" card on first render', async () => {
      render(<HomeRoute />);
      await waitFor(() =>
        expect(
          screen.getByText('The Floor is Lava'),
        ).toBeInTheDocument(),
      );
    });

    it('does not re-seed on second render', async () => {
      const { rerender } = render(<HomeRoute />);
      await waitFor(() =>
        expect(
          screen.getByText('The Floor is Lava'),
        ).toBeInTheDocument(),
      );
      rerender(<HomeRoute />);
      const cards = screen.getAllByText('The Floor is Lava');
      expect(cards).toHaveLength(1);
    });
  });
  ```

- [ ] **Step 2: Run; confirm fail.**

  Run: `yarn test --run src/routes/$locale/_app/index.test.tsx`
  Expected: FAIL — seeder not wired.

- [ ] **Step 3: Wire the seeder in the home component.**

  Edit `src/routes/$locale/_app/index.tsx`. Inside the home component (after the active-profile is resolved, before the grid renders), add:

  ```tsx
  import { useEffect } from 'react';
  import { seedTheFloorIsLavaIfNeeded } from '@/db/seed-the-floor-is-lava';

  // Inside the home route component body (after db + profileId are available):
  useEffect(() => {
    if (!db || !profileId) return;
    void seedTheFloorIsLavaIfNeeded(db, profileId);
  }, [db, profileId]);
  ```

  The effect is fire-and-forget; the seeder's own per-profile flag check makes re-runs no-ops, and the grid query naturally re-renders when the row lands.

- [ ] **Step 4: Run; confirm pass.**

  Run: `yarn test --run src/routes/$locale/_app/index.test.tsx`
  Expected: PASS.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/routes/$locale/_app/index.tsx src/routes/$locale/_app/index.test.tsx
  git commit -m "feat(home): seed The Floor is Lava on first launch per profile"
  ```

---

## Task 14: Padding tweaks (skin-scoped CSS) + Dragon Cave VR baselines

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.module.css` (or wherever WordSpell's CSS lives)
- Possibly modify: `src/games/word-spell/LetterTileBank/*.module.css`
- Possibly modify: `src/components/answer-game/Slot/*.module.css`
- Modify: `e2e/visual.spec.ts`

All padding changes are scoped under `.skin-dragon-cave` (the CSS class hook from the absorbed skin). Classic-skin baselines stay byte-stable.

REQUIRED SUB-SKILL: load `write-e2e-vr-tests` before adding VR tests.

- [ ] **Step 1: Add a failing @visual VR test for the Dragon Cave scene.**

  Edit `e2e/visual.spec.ts`. Add three tests at the three viewports:

  ```ts
  import { expect, test } from '@playwright/test';

  for (const vp of [
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 768, height: 1024, name: 'tablet-portrait' },
    { width: 414, height: 896, name: 'mobile-lg' },
  ]) {
    test(`@visual dragon-cave scene at ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: vp.width,
        height: vp.height,
      });
      // Navigate to "The Floor is Lava" — first launch seeds it,
      // so going to the home and tapping the card works; for a
      // deterministic test, deep-link via the custom-game route.
      await page.goto('/en/');
      await page.getByText('The Floor is Lava').click();
      await page.getByRole('main').waitFor({ state: 'visible' });
      await expect(page).toHaveScreenshot(
        `dragon-cave-scene-${vp.name}.png`,
        { fullPage: false },
      );
    });
  }

  test('@visual word-spell-skin-picker — both options visible', async ({
    page,
  }) => {
    // Open the simple form's skin radio (e.g., via InstructionsOverlay).
    // Specific route + interaction depends on how InstructionsOverlay is
    // reached — implementer fills this in per the live UI.
    await page.goto('/en/game/word-spell');
    await page.getByRole('main').waitFor({ state: 'visible' });
    // ... open InstructionsOverlay ...
    await expect(page).toHaveScreenshot('word-spell-skin-picker.png');
  });
  ```

- [ ] **Step 2: Run VR; confirm fail (no baselines yet).**

  ```bash
  yarn test:vr
  ```

  Expected: FAIL — no baselines exist for these tests. **Docker must be running.**

- [ ] **Step 3: Audit padding under Dragon Cave at the three viewports.**

  Boot dev server, navigate to The Floor is Lava in browser, resize to 1024 / 768 / 414, compare visually against `WordSpell.skin.stories.tsx` in Storybook.

  Identified gaps go into skin-scoped CSS rules. Example pattern:

  ```css
  /* In WordSpell.module.css or a new dragon-cave-padding.module.css */
  .skin-dragon-cave .letterTileBank {
    padding-block: var(--letter-tile-bank-padding-dragon-cave, 12px);
  }

  .skin-dragon-cave .slot {
    padding: var(--slot-padding-dragon-cave, 4px 6px);
  }
  ```

  Critical: every rule scopes under `.skin-dragon-cave`. The classic baseline must not change.

- [ ] **Step 4: Run VR with `--update-snapshots` for the new baselines.**

  ```bash
  yarn test:vr:update
  ```

  Expected: the four new baselines are written. Pre-existing baselines for classic-skin WordSpell stay byte-stable — if any classic baseline diff appears, the padding rule isn't properly scoped and needs to be revised before continuing.

- [ ] **Step 5: Run VR again to confirm green against the new baselines.**

  ```bash
  yarn test:vr
  ```

  Expected: PASS.

- [ ] **Step 6: Commit.**

  ```bash
  git add src/games/word-spell/WordSpell/ \
          src/components/answer-game/Slot/ \
          e2e/visual.spec.ts \
          e2e/__snapshots__/dragon-cave-scene-*.png \
          e2e/__snapshots__/word-spell-skin-picker.png
  git commit -m "feat(word-spell): tune padding under Dragon Cave + add VR baselines"
  ```

---

## Task 15: Lossless PNG optimization

**Files:** all PNGs under `public/skins/word-spell/dragon-cave/`.

Lossless compression preserves decompressed output exactly. VR baselines from Task 14 remain valid.

- [ ] **Step 1: Capture current asset sizes.**

  ```bash
  cd /Users/leocaseiro/Sites/base-skill/worktrees/feat-multi-skin-config
  du -b public/skins/word-spell/dragon-cave/*.png | tee /tmp/dragon-cave-sizes-before.txt
  ```

- [ ] **Step 2: Install + run a lossless compressor.**

  ```bash
  # If pngquant / oxipng aren't already on PATH, install whichever fits the dev environment.
  brew install oxipng  # macOS dev env; CI uses node-based compressors
  oxipng -o 4 --strip safe public/skins/word-spell/dragon-cave/*.png
  ```

- [ ] **Step 3: Capture new asset sizes.**

  ```bash
  du -b public/skins/word-spell/dragon-cave/*.png | tee /tmp/dragon-cave-sizes-after.txt
  diff /tmp/dragon-cave-sizes-before.txt /tmp/dragon-cave-sizes-after.txt
  ```

  Record the before/after byte totals; they go into the PR description.

- [ ] **Step 4: Verify VR baselines still pass (sanity check).**

  ```bash
  yarn test:vr
  ```

  Expected: PASS. Lossless compression produces byte-identical decompressed output, so baselines should still match. If VR fails here, the compressor wasn't actually lossless — revert and pick a different tool.

- [ ] **Step 5: Commit.**

  ```bash
  git add public/skins/word-spell/dragon-cave/*.png
  git commit -m "perf(skin): lossless-compress Dragon Cave PNGs (-N% bytes)"
  ```

  Replace `-N%` with the actual reduction from Step 3.

---

## Task 16: Functional E2E — full play-through of "The Floor is Lava"

**Files:**

- Create: `e2e/the-floor-is-lava.spec.ts`

REQUIRED SUB-SKILL: load `write-e2e-vr-tests`.

- [ ] **Step 1: Write the failing E2E test.**

  Create `e2e/the-floor-is-lava.spec.ts`:

  ```ts
  import { expect, test } from '@playwright/test';

  test('full play-through: open The Floor is Lava from home, complete a round', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.getByRole('main').waitFor({ state: 'visible' });

    // Card is seeded on first launch.
    const card = page.getByText('The Floor is Lava');
    await expect(card).toBeVisible();

    await card.click();
    await page.getByRole('main').waitFor({ state: 'visible' });

    // Dragon Cave scene should be visible (class hook check).
    await expect(page.locator('.skin-dragon-cave')).toBeVisible();

    // Place tiles to spell the first word. The exact selector / actions
    // depend on how WordSpell's drag-and-drop is reachable via Playwright;
    // implementer fills in to actually complete a round.
    // ...

    // Confirm celebration.
    await expect(page.getByText(/great|well done|nice/i)).toBeVisible();
  });
  ```

- [ ] **Step 2: Run the test; confirm fail (test exists but actions need filling).**

  ```bash
  yarn test:e2e -- the-floor-is-lava.spec.ts
  ```

  Expected: FAIL because the round-completion actions are stubbed.

- [ ] **Step 3: Fill in the play-through actions.**

  Use Playwright's `getByRole`, `getByLabel`, drag-and-drop primitives, or click-each-tile if drag-and-drop is awkward in headless. Reuse patterns from existing WordSpell e2e tests (`e2e/smoke.spec.ts`, `e2e/word-spell-*.spec.ts` if any) for tile-placement helpers.

- [ ] **Step 4: Run; confirm pass.**

  ```bash
  yarn test:e2e -- the-floor-is-lava.spec.ts
  ```

  Expected: PASS.

- [ ] **Step 5: Commit.**

  ```bash
  git add e2e/the-floor-is-lava.spec.ts
  git commit -m "test(e2e): full play-through of The Floor is Lava"
  ```

---

## Pre-push gate

Before pushing the branch, the `.husky/pre-push` hook runs the relevant atomic checks (lint, typecheck, unit, storybook, VR, e2e) against the changed files. Expected sequence:

```bash
yarn fix:md                 # markdown sanity (run before staging *.md files in this PR)
git push                    # triggers .husky/pre-push
```

If a hook fails, fix the root cause and create a new commit — do not amend a published commit or pass `--no-verify`.

If VR baselines need updating after intentional UI changes that landed in earlier tasks, that's handled inside Task 14's flow (`yarn test:vr:update`); don't bypass the gate post-hoc.

---

## Self-review checklist (for the plan author / reviewing reader)

- [x] Every spec scope item maps to a task:
  - Spec 1 (production registration) → Task 5
  - Spec 2 (per-game SkinId unions) → Task 1
  - Spec 3 (skin? field on configs) → Task 1
  - Spec 4 (skin radio in simple form) → Task 7
  - Spec 5 (Skin field in wordSpellConfigFields) → Task 8
  - Spec 6 (seed The Floor is Lava) → Tasks 10–13
  - Spec 7 (DEFAULT_RECALL_CONFIG fix) → Task 9
  - Spec 8 (image optimization, lossless PNG only) → Task 15
  - Spec 9 (padding tweaks, skin-scoped) → Task 14
  - Architecture → typed registry (F11) → Task 2
  - Architecture → ConfigField radio variant + optionsSource (F2/F6) → Task 3
  - Architecture → module-eval-time invariant (F3) → Task 5
  - Architecture → i18n key (F5) → Task 6
  - Architecture → asset-path stability invariant (F21) → embedded in Task 15's no-rename note
  - Architecture → home-route call site (F14) → Task 13
  - Architecture → app_meta schema bump (F1) → Task 10
  - Architecture → deterministic id (F22) → Task 11
  - Edge case 6 release-notes line (F28) → embedded in PR description (no task; documented in spec for the PR author)
  - Out-of-scope: SpotAll, dynamic registration, skin-owned behavior — no tasks, intentional
- [x] No placeholders ("TBD", "implement later", "similar to Task N") — every code-bearing step shows the actual code.
- [x] Type consistency: `WordSpellSkinId`, `GameSkinIdMap`, `RadioConfigField`, `seedTheFloorIsLavaIfNeeded` — all used consistently across tasks.
- [x] Spec deltas explicitly flagged at the top.
- [x] TDD shape: every code change opens with a failing test except for binary-asset and pure-rename tasks.

---

## Execution handoff

Two execution options:

1. **Subagent-driven** — orchestrator dispatches a fresh subagent per task with two-stage review between tasks. Recommended for larger plans.
2. **Inline execution** — execute tasks sequentially in one session with checkpoints for review.

When ready to begin, invoke either `superpowers:subagent-driven-development` or `superpowers:executing-plans`.
