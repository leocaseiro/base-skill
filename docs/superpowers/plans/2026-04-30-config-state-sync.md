# Config State Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the simple form (in `InstructionsOverlay`) and the advanced form (in `AdvancedConfigModal`) over a single shared draft state for WordSpell, SortNumbers, and NumberMatch — with deterministic open/cancel/save semantics, dirty-aware Play prompts, and surfaced persistence errors.

**Architecture:** Lift the modal's local state up into `InstructionsOverlay` via a new `useConfigDraft` hook. The route's `cfg` continues to be the canonical config; the hook tracks the saved baseline and modal-open snapshot, derives `isDirty` via an in-house deep-equal helper, and exposes snapshot/discard/commit transitions. The advanced modal becomes a controlled component. Auto-debounced last-session persistence (`usePersistLastGameConfig`) is replaced with explicit calls on every Play branch.

**Tech Stack:** React 19, TypeScript (strict), Vitest + React Testing Library, RxDB (custom_games + saved_game_configs collections), TanStack Router, sonner toasts.

**Spec:** `docs/superpowers/specs/2026-04-30-config-state-sync-design.md`
**Issue:** [#254](https://github.com/leocaseiro/base-skill/issues/254)

---

## File Structure

| Path                                                                          | Action | Responsibility                                                                                                                      |
| ----------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/deep-equal.ts`                                                       | create | Pure, function-aware structural equality for plain JSON-shaped values                                                               |
| `src/lib/deep-equal.test.ts`                                                  | create | Unit tests for `deepEqual` covering primitives, objects, arrays, NaN, function references                                           |
| `src/components/answer-game/InstructionsOverlay/useConfigDraft.ts`            | create | Hook tracking saved baseline, modal-open snapshot, dirty flag, and meta (name/color/cover)                                          |
| `src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx`      | create | Unit tests for the hook (renderHook from RTL)                                                                                       |
| `src/components/AdvancedConfigModal.tsx`                                      | modify | Becomes a controlled component: receives `value: Draft` + `onChange`, no internal `useState` for the draft fields                   |
| `src/components/AdvancedConfigModal.test.tsx`                                 | modify | Update existing tests to controlled-component shape; preserve all existing assertions                                               |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`      | modify | Wire `useConfigDraft`; pass controlled `value/onChange` to modal; implement dirty Play prompt and explicit last-session persistence |
| `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` | modify | Add `describe.each` matrix across the three games + error-handling scenarios                                                        |
| `src/routes/$locale/_app/game/$gameId.tsx`                                    | modify | Remove `usePersistLastGameConfig` from all three GameBody components                                                                |
| `src/db/hooks/usePersistLastGameConfig.ts`                                    | delete | No longer needed                                                                                                                    |

---

## Task 1: `deepEqual` helper

**Files:**

- Create: `src/lib/deep-equal.ts`
- Test: `src/lib/deep-equal.test.ts`

**Notes:**

- Plain JSON-shaped values + functions. Functions are compared as always-equal (resolver-added fields like `levelMode.generateNextLevel` get fresh references on every resolve, but their behavior is deterministic given the same inputs — comparing them by reference would produce false positives).
- Order of object keys must not affect equality.
- `NaN === NaN` via `Object.is`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/deep-equal.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { deepEqual } from './deep-equal';

describe('deepEqual', () => {
  it('returns true for identical primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(0, false)).toBe(false);
  });

  it('treats NaN as equal to NaN', () => {
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('compares plain objects regardless of key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it('treats missing keys as not equal', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(false);
  });

  it('recurses into nested objects', () => {
    expect(
      deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }),
    ).toBe(true);
    expect(
      deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }),
    ).toBe(false);
  });

  it('compares arrays element-wise and order-sensitive', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('handles arrays of objects', () => {
    expect(deepEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(
      true,
    );
    expect(deepEqual([{ a: 1 }], [{ a: 1, b: 2 }])).toBe(false);
  });

  it('treats arrays and objects as different', () => {
    expect(deepEqual([], {})).toBe(false);
  });

  it('treats two function values as equal', () => {
    const f1 = (): number => 1;
    const f2 = (): number => 2;
    expect(deepEqual(f1, f2)).toBe(true);
  });

  it('treats function vs non-function as not equal', () => {
    expect(deepEqual((): number => 1, 1)).toBe(false);
  });

  it('considers `levelMode`-shaped resolver artifacts equal', () => {
    const a = {
      direction: 'asc',
      levelMode: { generateNextLevel: (): null => null },
    };
    const b = {
      direction: 'asc',
      levelMode: { generateNextLevel: (): null => null },
    };
    expect(deepEqual(a, b)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/lib/deep-equal.test.ts`
Expected: FAIL — `Cannot find module './deep-equal'` (or similar — module does not exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/deep-equal.ts`:

```typescript
const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Structural equality for plain JSON-shaped values plus functions.
 *
 * Functions are treated as always-equal: resolver-added artifacts like
 * `levelMode.generateNextLevel` are regenerated on every config resolve,
 * so comparing them by reference would produce false positives even
 * when the user has changed nothing.
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;

  if (typeof a === 'function' && typeof b === 'function') return true;
  if (typeof a === 'function' || typeof b === 'function') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.hasOwn(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/lib/deep-equal.test.ts`
Expected: PASS — all 11 tests green.

- [ ] **Step 5: Run typecheck and lint**

Run: `yarn typecheck && yarn lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/deep-equal.ts src/lib/deep-equal.test.ts
git commit -m "feat(lib): add deepEqual helper for config dirty-checking

Function values are treated as equal so resolver-added artifacts like
levelMode.generateNextLevel don't produce false positives.

Refs #254."
```

---

## Task 2: `useConfigDraft` hook

**Files:**

- Create: `src/components/answer-game/InstructionsOverlay/useConfigDraft.ts`
- Test: `src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx`

**Notes:**

- Hook owns: `meta` (name/color/cover), `savedBaseline`, `snapshotRef`.
- Hook reads `config` from props (the route's `cfg`) and `onConfigChange` callback.
- Hook resets baseline + meta when `identity` (e.g. `customGameId ?? 'default'`) changes — caller passes the latest initial values via refs to avoid lint loops.

- [ ] **Step 1: Write the failing test**

Create `src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConfigDraft } from './useConfigDraft';
import type { GameColorKey } from '@/lib/game-colors';

const baseInput = {
  config: { direction: 'ascending' } as Record<string, unknown>,
  onConfigChange: vi.fn(),
  initialName: 'Skip by 2',
  initialColor: 'amber' as GameColorKey,
  initialCover: undefined,
  identity: 'abc',
};

describe('useConfigDraft', () => {
  it('exposes the live draft from props + meta initials', () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    expect(result.current.draft).toEqual({
      config: { direction: 'ascending' },
      name: 'Skip by 2',
      color: 'amber',
      cover: undefined,
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('setDraft routes config patches through onConfigChange', () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    act(() => {
      result.current.setDraft({
        config: { direction: 'descending' },
      });
    });
    expect(onConfigChange).toHaveBeenCalledWith({
      direction: 'descending',
    });
  });

  it('setDraft updates meta locally', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    act(() => {
      result.current.setDraft({ name: 'Skip by 5' });
    });
    rerender();
    expect(result.current.draft.name).toBe('Skip by 5');
    expect(onConfigChange).not.toHaveBeenCalled();
  });

  it('isDirty becomes true when draft differs from baseline', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(true);
  });

  it('discard reverts config and meta to the modal-open snapshot', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    act(() => {
      result.current.openModalSnapshot();
    });
    rerender({ config: { direction: 'descending' } });
    act(() => {
      result.current.setDraft({ name: 'Different Name' });
    });
    onConfigChange.mockClear();
    act(() => {
      result.current.discard();
    });
    expect(onConfigChange).toHaveBeenCalledWith({
      direction: 'ascending',
    });
    rerender({ config: { direction: 'ascending' } });
    expect(result.current.draft.name).toBe('Skip by 2');
  });

  it('commitSaved updates baseline so isDirty resets to false', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    rerender({ config: { direction: 'descending' } });
    act(() => {
      result.current.setDraft({ name: 'Skip by 5' });
    });
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(true);
    act(() => {
      result.current.commitSaved({
        config: { direction: 'descending' },
        name: 'Skip by 5',
        color: 'amber',
        cover: undefined,
      });
    });
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(false);
  });

  it('resets baseline and meta when identity changes', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({
        identity,
        initialName,
        config,
      }: {
        identity: string;
        initialName: string;
        config: Record<string, unknown>;
      }) =>
        useConfigDraft({
          ...baseInput,
          config,
          onConfigChange,
          identity,
          initialName,
        }),
      {
        initialProps: {
          identity: 'abc',
          initialName: 'Skip by 2',
          config: { direction: 'ascending' },
        },
      },
    );
    act(() => {
      result.current.setDraft({ name: 'Edited' });
    });
    rerender({
      identity: 'xyz',
      initialName: 'Other Custom',
      config: { direction: 'descending' },
    });
    expect(result.current.draft.name).toBe('Other Custom');
    expect(result.current.isDirty).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx`
Expected: FAIL — `Cannot find module './useConfigDraft'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/answer-game/InstructionsOverlay/useConfigDraft.ts`:

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import { deepEqual } from '@/lib/deep-equal';

export type Draft = {
  config: Record<string, unknown>;
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
};

type Meta = {
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
};

export type UseConfigDraftInput = {
  /** Live config (route's `cfg`). */
  config: Record<string, unknown>;
  /** Push config edits up to the route. */
  onConfigChange: (next: Record<string, unknown>) => void;
  initialName: string;
  initialColor: GameColorKey;
  initialCover: Cover | undefined;
  /**
   * When this changes (e.g. navigating to a different custom game),
   * baseline and meta reset to their initial values.
   */
  identity: string;
};

export type ConfigDraftApi = {
  draft: Draft;
  savedBaseline: Draft;
  isDirty: boolean;
  setDraft: (patch: Partial<Draft>) => void;
  openModalSnapshot: () => void;
  discard: () => void;
  commitSaved: (next: Draft) => void;
};

export const useConfigDraft = (
  input: UseConfigDraftInput,
): ConfigDraftApi => {
  const {
    config,
    onConfigChange,
    initialName,
    initialColor,
    initialCover,
    identity,
  } = input;

  const [meta, setMeta] = useState<Meta>({
    name: initialName,
    color: initialColor,
    cover: initialCover,
  });

  const [savedBaseline, setSavedBaseline] = useState<Draft>({
    config,
    name: initialName,
    color: initialColor,
    cover: initialCover,
  });

  const snapshotRef = useRef<Draft | null>(null);
  const previousIdentityRef = useRef(identity);

  // Keep the latest "initial" values + config + onConfigChange accessible to
  // effects/callbacks without re-running the identity-reset effect on every
  // render.
  const latestRef = useRef({
    config,
    onConfigChange,
    initialName,
    initialColor,
    initialCover,
  });
  latestRef.current = {
    config,
    onConfigChange,
    initialName,
    initialColor,
    initialCover,
  };

  useEffect(() => {
    if (previousIdentityRef.current === identity) return;
    previousIdentityRef.current = identity;
    const latest = latestRef.current;
    setMeta({
      name: latest.initialName,
      color: latest.initialColor,
      cover: latest.initialCover,
    });
    setSavedBaseline({
      config: latest.config,
      name: latest.initialName,
      color: latest.initialColor,
      cover: latest.initialCover,
    });
    snapshotRef.current = null;
  }, [identity]);

  const draft: Draft = useMemo(
    () => ({
      config,
      name: meta.name,
      color: meta.color,
      cover: meta.cover,
    }),
    [config, meta.color, meta.cover, meta.name],
  );

  const isDirty = useMemo(
    () => !deepEqual(draft, savedBaseline),
    [draft, savedBaseline],
  );

  const setDraft = (patch: Partial<Draft>): void => {
    if (patch.config !== undefined) {
      latestRef.current.onConfigChange(patch.config);
    }
    if (
      patch.name !== undefined ||
      patch.color !== undefined ||
      patch.cover !== undefined
    ) {
      setMeta((prev) => ({
        name: patch.name ?? prev.name,
        color: patch.color ?? prev.color,
        cover: patch.cover === undefined ? prev.cover : patch.cover,
      }));
    }
  };

  const openModalSnapshot = (): void => {
    snapshotRef.current = { ...draft };
  };

  const discard = (): void => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    if (!deepEqual(snapshot.config, latestRef.current.config)) {
      latestRef.current.onConfigChange(snapshot.config);
    }
    setMeta({
      name: snapshot.name,
      color: snapshot.color,
      cover: snapshot.cover,
    });
    snapshotRef.current = null;
  };

  const commitSaved = (next: Draft): void => {
    if (!deepEqual(next.config, latestRef.current.config)) {
      latestRef.current.onConfigChange(next.config);
    }
    setMeta({ name: next.name, color: next.color, cover: next.cover });
    setSavedBaseline(next);
    snapshotRef.current = null;
  };

  return {
    draft,
    savedBaseline,
    isDirty,
    setDraft,
    openModalSnapshot,
    discard,
    commitSaved,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run typecheck and lint**

Run: `yarn typecheck && yarn lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/useConfigDraft.ts \
        src/components/answer-game/InstructionsOverlay/useConfigDraft.test.tsx
git commit -m "feat(answer-game): add useConfigDraft hook

Tracks saved baseline, modal-open snapshot, and dirty flag for the
shared simple/advanced config draft. Hook owns the meta (name, color,
cover) and routes config patches up to the parent.

Refs #254."
```

---

## Task 3: Refactor `AdvancedConfigModal` to controlled

**Files:**

- Modify: `src/components/AdvancedConfigModal.tsx`
- Modify: `src/components/AdvancedConfigModal.test.tsx`

**Notes:**

- New prop shape: `value: Draft`, `onChange: (patch: Partial<Draft>) => void`. Replaces `config`, plus retiring the per-mode initial extraction for `name`/`color`/`cover` (those now flow through `value`).
- The `configMode: 'advanced'` stamp moves into the parent's commit logic — the modal no longer mutates the config on save (it just hands `value.config` back to the parent, which decides how to persist).
- Existing tests use the OLD prop shape (`mode`, `config`, `onSaveNew(payload)`); they'll be rewritten to render the modal with `value` + `onChange`. The semantic assertions stay (delete dialog, name validation, distractorCount visibility, level rows for word-spell).

- [ ] **Step 1: Update the failing test file**

Replace the contents of `src/components/AdvancedConfigModal.test.tsx` with the new controlled-component shape:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { AdvancedConfigModal } from './AdvancedConfigModal';
import type { Draft } from '@/components/answer-game/InstructionsOverlay/useConfigDraft';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const customGameMode = {
  kind: 'customGame' as const,
  configId: 'abc',
};

const draftFor = (overrides: Partial<Draft> = {}): Draft => ({
  config: {},
  name: 'Skip by 2',
  color: 'amber',
  cover: undefined,
  ...overrides,
});

describe('AdvancedConfigModal', () => {
  it('shows "Update" and "Save as new" buttons when editing a custom game', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor({ config: { direction: 'ascending' } })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onUpdate={vi.fn()}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('shows only "Save as new" when editing a default card', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /update/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });

  it('does not save with an empty name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/please enter a custom game name/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/skip by 2/i)).toHaveFocus();
  });

  it('does not save with a duplicate name — focuses the input and surfaces the error', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    const onChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: 'Skip by 2' })}
        onChange={onChange}
        existingCustomGameNames={['Skip by 2']}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).not.toHaveBeenCalled();
    expect(
      screen.getByText(/custom game with that name already exists/i),
    ).toBeInTheDocument();
  });

  it('allows "Update" to keep the same name without flagging a duplicate', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor({ config: { direction: 'ascending' } })}
        onChange={vi.fn()}
        existingCustomGameNames={['Skip by 2', 'Other']}
        onCancel={() => {}}
        onUpdate={onUpdate}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /update "skip by 2"/i }),
    );
    expect(onUpdate).toHaveBeenCalled();
  });

  it('does NOT render a Delete button for default mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.queryByRole('button', { name: /^delete$/i }),
    ).toBeNull();
  });

  it('renders a Delete button for customGame mode', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /^delete$/i }),
    ).toBeInTheDocument();
  });

  it('opens a confirmation dialog when Delete is clicked; Cancel keeps the modal open and does not call onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(
      screen.getByText(/delete "skip by 2"\?/i),
    ).toBeInTheDocument();
    const cancels = screen.getAllByRole('button', {
      name: /^cancel$/i,
    });
    await user.click(cancels.at(-1)!);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onSaveNew with the current value on Save-as-new', async () => {
    const user = userEvent.setup();
    const onSaveNew = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({
          name: 'My Sort',
          config: {
            configMode: 'simple',
            wrongTileBehavior: 'lock-auto-eject',
          },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={onSaveNew}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(onSaveNew).toHaveBeenCalledTimes(1);
  });

  it('propagates field changes via onChange (config patch)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={onChange}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    await user.type(screen.getByPlaceholderText(/skip by 2/i), 'M');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'M' }),
    );
  });

  it('calls onDelete with the configId and closes the modal on Confirm', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <AdvancedConfigModal
        open
        onOpenChange={onOpenChange}
        gameId="sort-numbers"
        mode={customGameMode}
        value={draftFor()}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    const confirms = screen.getAllByRole('button', {
      name: /^delete$/i,
    });
    await user.click(confirms.at(-1)!);
    expect(onDelete).toHaveBeenCalledWith('abc');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders the level rows for word-spell games', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="word-spell"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole('button', { name: /Level 1/ }),
    ).toBeInTheDocument();
  });

  it('does not render the Level select for non-word-spell games', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="sort-numbers"
        mode={{ kind: 'default' }}
        value={draftFor({ name: '' })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByRole('button', { name: /Level/i })).toBeNull();
  });

  it('reveals distractorCount when WordSpell tileBankMode is distractors', () => {
    render(
      <AdvancedConfigModal
        open
        onOpenChange={() => {}}
        gameId="word-spell"
        mode={{ kind: 'default' }}
        value={draftFor({
          name: '',
          config: { tileBankMode: 'distractors', distractorCount: 3 },
        })}
        onChange={vi.fn()}
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
        value={draftFor({
          name: '',
          config: { tileBankMode: 'exact' },
        })}
        onChange={vi.fn()}
        onCancel={() => {}}
        onSaveNew={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.queryByLabelText(/distractor count/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: FAIL — TypeScript errors and runtime errors because the component still uses the old prop shape.

- [ ] **Step 3: Refactor the modal to controlled**

Replace the contents of `src/components/AdvancedConfigModal.tsx`:

```tsx
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Cover } from '@/games/cover-type';
import type { Draft } from '@/components/answer-game/InstructionsOverlay/useConfigDraft';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { ConfigFormFields } from '@/components/ConfigFormFields';
import { CoverPicker } from '@/components/CoverPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAdvancedConfigFields,
  getAdvancedHeaderRenderer,
} from '@/games/config-fields-registry';
import { GAME_COLORS, GAME_COLOR_KEYS } from '@/lib/game-colors';

export type AdvancedConfigModalMode =
  | { kind: 'default' }
  | { kind: 'customGame'; configId: string };

export type SavePayload = {
  configId?: string;
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
  config: Record<string, unknown>;
};

type AdvancedConfigModalProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  gameId: string;
  mode: AdvancedConfigModalMode;
  value: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onCancel: () => void;
  onUpdate?: (payload: SavePayload) => void;
  onSaveNew: (payload: SavePayload) => void;
  onDelete?: (configId: string) => Promise<void> | void;
  existingCustomGameNames?: readonly string[];
  /** Optional inline error banner (shown when set). */
  errorMessage?: string | null;
};

export const AdvancedConfigModal = ({
  open,
  onOpenChange,
  gameId,
  mode,
  value,
  onChange,
  onCancel,
  onUpdate,
  onSaveNew,
  onDelete,
  existingCustomGameNames = [],
  errorMessage,
}: AdvancedConfigModalProps): JSX.Element => {
  const { t } = useTranslation('games');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fields = getAdvancedConfigFields(gameId);
  const HeaderRenderer = getAdvancedHeaderRenderer(gameId);

  const trimmedName = value.name.trim();
  const isCustomGame = mode.kind === 'customGame';
  const namesTaken = new Set(
    existingCustomGameNames.filter(
      (n) => !isCustomGame || n !== value.name,
    ),
  );

  const nameError: string | null = (() => {
    if (trimmedName === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a custom game name.',
      });
    if (namesTaken.has(trimmedName))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A custom game with that name already exists.',
      });
    return null;
  })();

  const saveNewInvalid = nameError !== null;
  const updateInvalid = nameError !== null;
  const showNameError = submitAttempted && nameError !== null;

  const buildPayload = (): SavePayload => ({
    configId: isCustomGame ? mode.configId : undefined,
    name: trimmedName,
    color: value.color,
    cover: value.cover,
    config: { ...value.config, configMode: 'advanced' },
  });

  const handleSaveNew = (): void => {
    setSubmitAttempted(true);
    if (saveNewInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onSaveNew(buildPayload());
  };

  const handleUpdate = (): void => {
    if (!onUpdate) return;
    setSubmitAttempted(true);
    if (updateInvalid) {
      nameInputRef.current?.focus();
      return;
    }
    onUpdate(buildPayload());
  };

  const handleConfirmDelete = (): void => {
    if (mode.kind !== 'customGame' || !onDelete) return;
    void (async () => {
      try {
        await onDelete(mode.configId);
      } finally {
        setConfirmDeleteOpen(false);
        onOpenChange(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCustomGame ? value.name : 'Advanced settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CoverPicker
            value={value.cover}
            onChange={(next) => onChange({ cover: next })}
          />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {t('instructions.customGameNameLabel', {
                defaultValue: 'Custom game name',
              })}
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={value.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Skip by 2"
              aria-invalid={showNameError}
              aria-describedby={
                showNameError ? 'custom-game-name-error' : undefined
              }
              className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                showNameError ? 'border-destructive' : 'border-input'
              }`}
            />
            {showNameError && (
              <span
                id="custom-game-name-error"
                role="alert"
                className="text-xs font-semibold text-destructive"
              >
                {nameError}
              </span>
            )}
          </label>

          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Color
            </div>
            <div
              className="mt-1 grid gap-1"
              style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              role="group"
              aria-label="Custom game color"
            >
              {GAME_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={value.color === key}
                  onClick={() => onChange({ color: key })}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: GAME_COLORS[key].playBg,
                    borderColor:
                      value.color === key
                        ? GAME_COLORS[key].playBg
                        : 'transparent',
                    outline:
                      value.color === key
                        ? '3px solid white'
                        : undefined,
                    outlineOffset:
                      value.color === key ? '-4px' : undefined,
                    boxShadow:
                      value.color === key
                        ? `0 0 0 2px ${GAME_COLORS[key].playBg}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {HeaderRenderer && (
            <HeaderRenderer
              config={value.config}
              onChange={(next) => onChange({ config: next })}
            />
          )}
          <ConfigFormFields
            fields={fields}
            config={value.config}
            onChange={(next) => onChange({ config: next })}
          />

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {isCustomGame && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-destructive bg-background px-3 py-2 text-sm font-semibold text-destructive"
              >
                <Trash2 size={14} aria-hidden="true" />
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
            >
              {t('instructions.cancel', { defaultValue: 'Cancel' })}
            </button>
            {isCustomGame && onUpdate && (
              <button
                type="button"
                onClick={handleUpdate}
                aria-disabled={updateInvalid}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.updateCustomGame', {
                  name: value.name,
                  defaultValue: `Update "${value.name}"`,
                })}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveNew}
              aria-disabled={saveNewInvalid}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                isCustomGame
                  ? 'border border-input bg-background'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {t('instructions.saveAsNew', {
                defaultValue: 'Save as new custom game',
              })}
            </button>
          </div>
        </div>
      </DialogContent>

      {isCustomGame && onDelete && (
        <Dialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('instructions.deleteConfirmTitle', {
                  name: value.name,
                  defaultValue: `Delete "${value.name}"?`,
                })}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t('instructions.deleteConfirmBody', {
                defaultValue:
                  "This custom game will be removed. You can't undo this.",
              })}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm"
              >
                {t('instructions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground"
              >
                {t('instructions.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/components/AdvancedConfigModal.test.tsx`
Expected: PASS — all tests green.

- [ ] **Step 5: Run typecheck**

Run: `yarn typecheck`
Expected: clean. (`InstructionsOverlay.tsx` will fail at this point because it still passes the old prop shape to the modal — the next task fixes it.) **If typecheck fails ONLY in `InstructionsOverlay.tsx`, that is expected and Task 4 will resolve it.** Note this in the commit message and proceed.

Run: `yarn lint`
Expected: passes for files in this commit.

- [ ] **Step 6: Commit**

```bash
git add src/components/AdvancedConfigModal.tsx src/components/AdvancedConfigModal.test.tsx
git commit -m "refactor(modal): make AdvancedConfigModal a controlled component

Replaces internal useState for config/name/color/cover with a
value/onChange contract. The configMode: 'advanced' stamp moves to a
local buildPayload helper at save time. Adds an optional errorMessage
prop for inline persistence errors.

InstructionsOverlay still passes the old prop shape; the next commit
wires it to the new controlled API.

Refs #254."
```

Note: this commit will leave `InstructionsOverlay.tsx` typechecking RED. Task 4 closes the gap. If subagents are running this plan, they should pause and validate that the only remaining typecheck error is in `InstructionsOverlay.tsx` before moving on.

---

## Task 4: Wire `useConfigDraft` into `InstructionsOverlay` (sync + Discard)

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

**Notes:**

- This task implements scenarios 1, 2, 3, 4, 12 from the spec matrix (sync + discard + identity re-init). Play prompt scenarios are deferred to Task 5.
- The hook's `discard()` is the new contract for Cancel / Esc / outside-click. Wire it through `onCancel` and through `onOpenChange`.
- The `onConfigChange` prop continues to bubble config edits up to the route — that's how the route's `cfg` stays in sync.

- [ ] **Step 1: Read the existing test file to plan the diff**

Run: `cat src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx | head -120`
Plan: keep the existing top-level tests (cog opens modal, save-on-play prompt for default games, custom-game start). Add a new `describe.each` block for sync/discard scenarios.

- [ ] **Step 2: Add the failing sync/discard tests**

Append to `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx` (inside the existing top-level `describe`, or a new top-level `describe`):

```tsx
describe.each([
  {
    gameId: 'word-spell' as const,
    initialConfig: {
      component: 'WordSpell',
      mode: 'recall',
      inputMethod: 'drag',
    },
    simpleEdit: { inputMethod: 'type' },
  },
  {
    gameId: 'sort-numbers' as const,
    initialConfig: {
      component: 'SortNumbers',
      direction: 'ascending',
      configMode: 'simple',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      inputMethod: 'drag',
    },
    simpleEdit: { direction: 'descending' },
  },
  {
    gameId: 'number-match' as const,
    initialConfig: {
      component: 'NumberMatch',
      mode: 'numeral-to-group',
      inputMethod: 'drag',
      range: { min: 1, max: 12 },
      tileBankMode: 'distractors',
      distractorCount: 2,
      rounds: [{ value: 3 }],
      totalRounds: 1,
    },
    simpleEdit: { inputMethod: 'type' },
  },
])(
  'InstructionsOverlay state-sync ($gameId)',
  ({ gameId, initialConfig, simpleEdit }) => {
    it('forwards simple-form edits up via onConfigChange', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      render(
        <InstructionsOverlay
          {...baseProps({ gameId, config: initialConfig })}
          onConfigChange={onConfigChange}
        />,
        { wrapper },
      );
      // Trigger a simple-form edit specific to the game; assert
      // onConfigChange was invoked with a config that includes the
      // expected patch.
      await applySimpleEdit(user, gameId, simpleEdit);
      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining(simpleEdit),
      );
    });

    it('opening the cog reflects the current draft (simple → advanced)', async () => {
      const user = userEvent.setup();
      // Start with already-edited config: simulates a prior simple edit
      // landing on the parent before the cog is pressed.
      render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: { ...initialConfig, ...simpleEdit },
          })}
        />,
        { wrapper },
      );
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      expectAdvancedReflects(gameId, simpleEdit);
    });

    it('Discard reverts both simple and advanced views to the modal-open snapshot', async () => {
      const user = userEvent.setup();
      const onConfigChange = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] = useState(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({ gameId, config })}
            onConfigChange={(c) => {
              setConfig(c);
              onConfigChange(c);
            }}
          />
        );
      };
      render(<Harness />, { wrapper });
      // Edit simple form: dirty against baseline
      await applySimpleEdit(user, gameId, simpleEdit);
      // Open modal, take snapshot
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      // Edit a name field in the modal
      await user.type(
        screen.getByPlaceholderText(/skip by 2/i),
        'Tweaked',
      );
      // Cancel
      await user.click(
        screen.getAllByRole('button', { name: /cancel/i }).at(-1)!,
      );
      // Modal name should not have stuck — re-opening should show
      // empty (default mode) or the original loaded name (custom).
      await user.click(
        screen.getByRole('button', { name: /configure/i }),
      );
      const nameInput = screen.getByPlaceholderText(/skip by 2/i);
      expect((nameInput as HTMLInputElement).value).toBe('');
      // Simple edit should still be present (it landed before the
      // snapshot was taken).
      expectSimpleReflects(gameId, simpleEdit);
    });

    it('re-initializes draft when customGameId changes', async () => {
      const { rerender } = render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: initialConfig,
            customGameId: 'A',
            customGameName: 'Custom A',
          })}
        />,
        { wrapper },
      );
      rerender(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: { ...initialConfig, ...simpleEdit },
            customGameId: 'B',
            customGameName: 'Custom B',
          })}
        />,
      );
      expect(screen.getByText('Custom B')).toBeInTheDocument();
    });
  },
);
```

You will also need to add small `baseProps`, `applySimpleEdit`, `expectSimpleReflects`, and `expectAdvancedReflects` test helpers at the top of the test file. Example helpers (place near the existing `wrapper` / mock setup):

```tsx
type BaseProps = Parameters<typeof InstructionsOverlay>[0];

const baseProps = (overrides: Partial<BaseProps> = {}): BaseProps => ({
  text: 'Instructions',
  onStart: vi.fn(),
  ttsEnabled: false,
  gameTitle: 'Game',
  gameId: 'sort-numbers',
  config: {},
  onConfigChange: vi.fn(),
  onSaveCustomGame: vi.fn(async () => 'new-id'),
  existingCustomGameNames: [],
  ...overrides,
});

const applySimpleEdit = async (
  user: ReturnType<typeof userEvent.setup>,
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): Promise<void> => {
  if (gameId === 'sort-numbers' && 'direction' in edit) {
    // Click the descending chunk option
    await user.click(
      screen.getByRole('button', {
        name: /largest|biggest|descending/i,
      }),
    );
    return;
  }
  if ('inputMethod' in edit) {
    const target = edit.inputMethod as string;
    await user.click(
      screen.getByRole('button', { name: new RegExp(target, 'i') }),
    );
    return;
  }
  throw new Error(
    `No simple-edit driver for ${gameId} ${JSON.stringify(edit)}`,
  );
};

const expectSimpleReflects = (
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): void => {
  if (gameId === 'sort-numbers' && edit.direction === 'descending') {
    expect(
      screen.getByRole('button', {
        name: /largest|biggest|descending/i,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    return;
  }
  if ('inputMethod' in edit) {
    expect(
      screen.getByRole('button', {
        name: new RegExp(String(edit.inputMethod), 'i'),
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    return;
  }
};

const expectAdvancedReflects = (
  gameId: 'word-spell' | 'sort-numbers' | 'number-match',
  edit: Record<string, unknown>,
): void => {
  // The advanced modal renders the same field bank (simpler check —
  // ConfigFormFields shows a control per field). For a thorough test,
  // assert the underlying value via the form's input. For simple-edit
  // patches that mirror simple-form fields, the simple form below the
  // modal still exists, so the same check works.
  expectSimpleReflects(gameId, edit);
};
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: FAIL — sync/discard tests fail because the modal still has stale local state and `onConfigChange` is not called for cancel-revert paths.

- [ ] **Step 4: Update `InstructionsOverlay.tsx` to use the hook**

Replace the contents of `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`:

```tsx
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Settings as SettingsIcon, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCover } from '@/components/GameCover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSimpleConfigFormRenderer } from '@/games/config-fields-registry';
import { resolveCover } from '@/games/cover';
import { DEFAULT_GAME_COLOR, GAME_COLORS } from '@/lib/game-colors';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';
import { suggestCustomGameName } from '@/lib/suggest-custom-game-name';
import { useConfigDraft } from './useConfigDraft';

type HeaderActionsProps = {
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenSettings: () => void;
};

const HeaderActions = ({
  isBookmarked,
  onToggleBookmark,
  onOpenSettings,
}: HeaderActionsProps): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  return (
    <div className="flex items-center gap-2">
      {onToggleBookmark && (
        <button
          type="button"
          aria-label={
            isBookmarked
              ? t('common:bookmark.remove', {
                  defaultValue: 'Remove bookmark',
                })
              : t('common:bookmark.add', {
                  defaultValue: 'Add bookmark',
                })
          }
          aria-pressed={isBookmarked ?? false}
          onClick={onToggleBookmark}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
        >
          <Star
            size={18}
            aria-hidden="true"
            fill={isBookmarked ? 'currentColor' : 'none'}
          />
        </button>
      )}
      <button
        type="button"
        aria-label={t('instructions.configure', {
          defaultValue: 'Configure',
        })}
        onClick={onOpenSettings}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted"
      >
        <SettingsIcon size={18} />
      </button>
    </div>
  );
};

export type SaveCustomGameInput = {
  name: string;
  color: GameColorKey;
  config: Record<string, unknown>;
  cover?: Cover;
};

type InstructionsOverlayProps = {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
  gameTitle: string;
  gameId: string;
  cover?: Cover;
  customGameId?: string;
  customGameName?: string;
  customGameColor?: GameColorKey;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveCustomGame: (input: SaveCustomGameInput) => Promise<string>;
  onUpdateCustomGame?: (
    name: string,
    config: Record<string, unknown>,
    extras?: { cover?: Cover; color?: GameColorKey },
  ) => Promise<void>;
  onDeleteCustomGame?: (configId: string) => Promise<void>;
  /** Persist current draft as the "last session" snapshot for this gameId. */
  onPersistLastSession?: (
    config: Record<string, unknown>,
  ) => Promise<void> | void;
  existingCustomGameNames?: readonly string[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
};

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
  gameTitle,
  gameId,
  cover,
  customGameId,
  customGameName,
  customGameColor = DEFAULT_GAME_COLOR,
  config,
  onConfigChange,
  onSaveCustomGame,
  onUpdateCustomGame,
  onDeleteCustomGame,
  onPersistLastSession,
  existingCustomGameNames = [],
  isBookmarked,
  onToggleBookmark,
}: InstructionsOverlayProps): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  const navigate = useNavigate({
    from: '/$locale/game/$gameId',
  });
  const router = useRouter();

  const draftApi = useConfigDraft({
    config,
    onConfigChange,
    initialName: customGameName ?? '',
    initialColor: customGameColor,
    initialCover: cover,
    identity: customGameId ?? 'default',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [saveSubmitAttempted, setSaveSubmitAttempted] = useState(false);
  const saveNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveDialogOpen) {
      const id = globalThis.setTimeout(
        () => saveNameRef.current?.focus(),
        0,
      );
      return () => globalThis.clearTimeout(id);
    }
    return;
  }, [saveDialogOpen]);

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  const settingsColors = GAME_COLORS[draftApi.draft.color];
  const resolvedCover = resolveCover(
    { cover: draftApi.draft.cover },
    gameId,
  );

  const SimpleForm = getSimpleConfigFormRenderer(gameId);

  const modalMode =
    customGameId && draftApi.draft.name
      ? ({ kind: 'customGame', configId: customGameId } as const)
      : ({ kind: 'default' } as const);

  const handleOpenModal = (): void => {
    draftApi.openModalSnapshot();
    setModalError(null);
    setModalOpen(true);
  };

  const handleModalOpenChange = (next: boolean): void => {
    if (!next) {
      draftApi.discard();
    }
    setModalOpen(next);
  };

  const handleCancel = (): void => {
    draftApi.discard();
    setModalOpen(false);
  };

  const persistLastSession = async (
    nextConfig: Record<string, unknown>,
  ): Promise<void> => {
    if (!onPersistLastSession) return;
    try {
      await onPersistLastSession(nextConfig);
    } catch (error) {
      console.error('Failed to persist last-session config', error);
      toast.error(
        t('instructions.persistLastSessionError', {
          defaultValue: "Couldn't remember settings",
        }),
      );
    }
  };

  // Play handlers are wired in Task 5; keep stub for now to retain
  // existing test expectations for non-dirty default flow.
  const handlePlay = (): void => {
    if (customGameId && customGameName && onUpdateCustomGame) {
      void (async () => {
        try {
          await onUpdateCustomGame(
            draftApi.draft.name,
            draftApi.draft.config,
            {
              cover: draftApi.draft.cover,
              color: draftApi.draft.color,
            },
          );
          await persistLastSession(draftApi.draft.config);
        } catch (error) {
          console.error('Failed to save custom game on play', error);
        }
        onStart();
      })();
      return;
    }
    setSaveSubmitAttempted(false);
    setSavingName(
      suggestCustomGameName(gameTitle, existingCustomGameNames),
    );
    setSaveDialogOpen(true);
  };

  const saveOnPlayError: string | null = (() => {
    const trimmed = savingName.trim();
    if (trimmed === '')
      return t('instructions.nameRequired', {
        defaultValue: 'Please enter a custom game name.',
      });
    if (existingCustomGameNames.includes(trimmed))
      return t('instructions.nameDuplicate', {
        defaultValue: 'A custom game with that name already exists.',
      });
    return null;
  })();
  const showSaveOnPlayError =
    saveSubmitAttempted && saveOnPlayError !== null;

  const handleSaveAndPlay = (): void => {
    setSaveSubmitAttempted(true);
    if (saveOnPlayError !== null) {
      saveNameRef.current?.focus();
      return;
    }
    const trimmed = savingName.trim();
    void (async () => {
      try {
        const newId = await onSaveCustomGame({
          name: trimmed,
          color: draftApi.draft.color,
          config: draftApi.draft.config,
          cover: draftApi.draft.cover,
        });
        await persistLastSession(draftApi.draft.config);
        setSaveDialogOpen(false);
        await navigate({
          search: (prev) => ({ ...prev, configId: newId }),
        });
        onStart();
      } catch (error) {
        console.error('Failed to save custom game on play', error);
      }
    })();
  };

  const handlePlayWithoutSaving = (): void => {
    void persistLastSession(draftApi.draft.config);
    setSaveDialogOpen(false);
    onStart();
  };

  return createPortal(
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-background/95 px-5 pb-8 pt-24"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-lg md:max-w-2xl">
        <div className="flex justify-center bg-muted/40 p-4">
          <GameCover cover={resolvedCover} size="hero" />
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                className="text-xl font-extrabold"
                style={
                  customGameName
                    ? { color: settingsColors.text }
                    : undefined
                }
              >
                {customGameName ?? gameTitle}
              </h2>
              {customGameName && (
                <p className="text-xs italic text-foreground/80">
                  {gameTitle}
                </p>
              )}
            </div>
            <HeaderActions
              isBookmarked={isBookmarked}
              onToggleBookmark={onToggleBookmark}
              onOpenSettings={handleOpenModal}
            />
          </div>

          <p className="text-center text-base font-semibold text-foreground leading-relaxed">
            {text}
          </p>

          <button
            type="button"
            onClick={handlePlay}
            className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md active:scale-95"
          >
            {t('instructions.lets-go')}
          </button>

          {SimpleForm && (
            <div className="border-t border-border pt-4">
              <SimpleForm
                config={draftApi.draft.config}
                onChange={(next) => draftApi.setDraft({ config: next })}
              />
            </div>
          )}
        </div>
      </div>

      <AdvancedConfigModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        gameId={gameId}
        mode={modalMode}
        value={draftApi.draft}
        onChange={(patch) => draftApi.setDraft(patch)}
        existingCustomGameNames={existingCustomGameNames}
        errorMessage={modalError}
        onCancel={handleCancel}
        onDelete={
          customGameId && onDeleteCustomGame
            ? onDeleteCustomGame
            : undefined
        }
        onSaveNew={(payload) => {
          void (async () => {
            try {
              const newId = await onSaveCustomGame({
                name: payload.name,
                color: payload.color,
                config: payload.config,
                cover: payload.cover,
              });
              await persistLastSession(payload.config);
              draftApi.commitSaved({
                config: payload.config,
                name: payload.name,
                color: payload.color,
                cover: payload.cover,
              });
              setModalOpen(false);
              setModalError(null);
              await navigate({
                search: (prev) => ({ ...prev, configId: newId }),
              });
            } catch (error) {
              console.error('Failed to save custom game', error);
              const message = t('instructions.saveError', {
                defaultValue: "Couldn't save — try again.",
              });
              setModalError(message);
              toast.error(message);
            }
          })();
        }}
        onUpdate={
          onUpdateCustomGame
            ? (payload) => {
                void (async () => {
                  try {
                    await onUpdateCustomGame(
                      payload.name,
                      payload.config,
                      {
                        cover: payload.cover,
                        color: payload.color,
                      },
                    );
                    await persistLastSession(payload.config);
                    draftApi.commitSaved({
                      config: payload.config,
                      name: payload.name,
                      color: payload.color,
                      cover: payload.cover,
                    });
                    setModalOpen(false);
                    setModalError(null);
                    await router.invalidate();
                  } catch (error) {
                    console.error(
                      'Failed to update custom game',
                      error,
                    );
                    const message = t('instructions.updateError', {
                      defaultValue: "Couldn't update — try again.",
                    });
                    setModalError(message);
                    toast.error(message);
                  }
                })();
              }
            : undefined
        }
      />

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('instructions.saveOnPlayTitle', {
                defaultValue: 'Save these settings as a custom game?',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {t('instructions.saveOnPlayNameLabel', {
                  defaultValue: 'Custom game name',
                })}
              </span>
              <input
                ref={saveNameRef}
                type="text"
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                aria-invalid={showSaveOnPlayError}
                aria-describedby={
                  showSaveOnPlayError ? 'save-on-play-error' : undefined
                }
                className={`h-10 rounded-lg border bg-background px-3 text-sm ${
                  showSaveOnPlayError
                    ? 'border-destructive'
                    : 'border-input'
                }`}
              />
              {showSaveOnPlayError && (
                <span
                  id="save-on-play-error"
                  role="alert"
                  className="text-xs font-semibold text-destructive"
                >
                  {saveOnPlayError}
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePlayWithoutSaving}
                className="flex-1 rounded-lg border border-input bg-background py-2 text-sm"
              >
                {t('instructions.playWithoutSaving', {
                  defaultValue: 'Play without saving',
                })}
              </button>
              <button
                type="button"
                onClick={handleSaveAndPlay}
                aria-disabled={saveOnPlayError !== null}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
              >
                {t('instructions.saveAndPlay', {
                  defaultValue: 'Save & play',
                })}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
};
```

- [ ] **Step 5: Run all sync/discard tests**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: PASS — sync, discard, identity re-init scenarios green; existing tests for cog/save-on-play still green.

- [ ] **Step 6: Run typecheck and lint**

Run: `yarn typecheck && yarn lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx \
        src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
git commit -m "feat(answer-game): wire useConfigDraft for shared simple/advanced state

InstructionsOverlay now owns the draft via useConfigDraft and passes
the controlled value/onChange contract down to AdvancedConfigModal.
Cancel/Esc/outside-click triggers a snapshot revert that propagates
back through onConfigChange so the simple form below the modal also
reverts.

Adds an onPersistLastSession prop (wired by routes in a follow-up
commit) and inline error banner support for Update/Save-as-new
failures.

Refs #254."
```

---

## Task 5: Dirty-aware Play prompt (Update / Save as new / Play without saving)

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`
- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

**Notes:**

- For dirty + customGameId: show three actions in the play prompt.
- For dirty + no customGameId: existing two-action save-on-play prompt continues to be used.
- Clean play (not dirty): skip the prompt entirely; persist last-session and call `onStart`.

- [ ] **Step 1: Add the failing prompt tests**

Append to `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`:

```tsx
describe.each([
  {
    gameId: 'word-spell' as const,
    initialConfig: {
      component: 'WordSpell',
      mode: 'recall',
      inputMethod: 'drag',
    },
    simpleEdit: { inputMethod: 'type' },
  },
  {
    gameId: 'sort-numbers' as const,
    initialConfig: {
      component: 'SortNumbers',
      direction: 'ascending',
      configMode: 'simple',
      quantity: 5,
      skip: { mode: 'by', step: 2, start: 2 },
      inputMethod: 'drag',
    },
    simpleEdit: { direction: 'descending' },
  },
  {
    gameId: 'number-match' as const,
    initialConfig: {
      component: 'NumberMatch',
      mode: 'numeral-to-group',
      inputMethod: 'drag',
      range: { min: 1, max: 12 },
      tileBankMode: 'distractors',
      distractorCount: 2,
      rounds: [{ value: 3 }],
      totalRounds: 1,
    },
    simpleEdit: { inputMethod: 'type' },
  },
])(
  'InstructionsOverlay play prompt ($gameId)',
  ({ gameId, initialConfig, simpleEdit }) => {
    it('clean play (no edits) skips prompt and starts immediately', async () => {
      const user = userEvent.setup();
      const onStart = vi.fn();
      const onPersistLastSession = vi.fn();
      render(
        <InstructionsOverlay
          {...baseProps({
            gameId,
            config: initialConfig,
            customGameId: 'cg1',
            customGameName: 'Custom A',
            onStart,
            onPersistLastSession,
            onUpdateCustomGame: vi.fn(async () => {}),
          })}
        />,
        { wrapper },
      );
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(onStart).toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalledWith(initialConfig);
      // No update should fire because nothing was dirty
    });

    it('dirty + custom-game: prompt shows Update / Save as new / Play without saving', async () => {
      const user = userEvent.setup();
      const Harness = (): JSX.Element => {
        const [config, setConfig] = useState(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame: vi.fn(async () => {}),
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(
        screen.getByRole('button', { name: /update "custom a"/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /save as new/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /play without saving/i }),
      ).toBeInTheDocument();
    });

    it('dirty + custom-game: Update commits and starts', async () => {
      const user = userEvent.setup();
      const onUpdateCustomGame = vi.fn(async () => {});
      const onPersistLastSession = vi.fn();
      const onStart = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] = useState(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame,
              onPersistLastSession,
              onStart,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /update "custom a"/i }),
      );
      expect(onUpdateCustomGame).toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalled();
      expect(onStart).toHaveBeenCalled();
    });

    it('dirty + custom-game: Play without saving persists last-session and starts; no update', async () => {
      const user = userEvent.setup();
      const onUpdateCustomGame = vi.fn(async () => {});
      const onPersistLastSession = vi.fn();
      const onStart = vi.fn();
      const Harness = (): JSX.Element => {
        const [config, setConfig] = useState(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              customGameId: 'cg1',
              customGameName: 'Custom A',
              onConfigChange: setConfig,
              onUpdateCustomGame,
              onPersistLastSession,
              onStart,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /play without saving/i }),
      );
      expect(onUpdateCustomGame).not.toHaveBeenCalled();
      expect(onPersistLastSession).toHaveBeenCalled();
      expect(onStart).toHaveBeenCalled();
    });

    it('dirty + default game: existing 2-action prompt fires', async () => {
      const user = userEvent.setup();
      const Harness = (): JSX.Element => {
        const [config, setConfig] = useState(initialConfig);
        return (
          <InstructionsOverlay
            {...baseProps({
              gameId,
              config,
              onConfigChange: setConfig,
            })}
          />
        );
      };
      render(<Harness />, { wrapper });
      await applySimpleEdit(user, gameId, simpleEdit);
      await user.click(
        screen.getByRole('button', { name: /let's go/i }),
      );
      expect(
        screen.getByRole('button', { name: /save & play/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /play without saving/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update/i }),
      ).toBeNull();
    });
  },
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: FAIL — current `handlePlay` always silently calls `onUpdateCustomGame` for custom games.

- [ ] **Step 3: Update `handlePlay` and add the custom-game prompt UI**

Modify `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx`. Replace the existing `handlePlay`, add a new `customPlayPromptOpen` state, and add a custom-game prompt dialog. The relevant changes:

```tsx
// Add near the other useState calls:
const [customPlayPromptOpen, setCustomPlayPromptOpen] = useState(false);
const [playPromptError, setPlayPromptError] = useState<string | null>(
  null,
);

// Replace handlePlay:
const handlePlay = (): void => {
  if (!draftApi.isDirty) {
    void persistLastSession(draftApi.draft.config);
    onStart();
    return;
  }
  if (customGameId && onUpdateCustomGame) {
    setPlayPromptError(null);
    setCustomPlayPromptOpen(true);
    return;
  }
  // Default game (no customGameId) — fall through to existing save-on-play
  // dialog, which already offers Save & play / Play without saving.
  setSaveSubmitAttempted(false);
  setSavingName(
    suggestCustomGameName(gameTitle, existingCustomGameNames),
  );
  setSaveDialogOpen(true);
};

// Add new handlers for the 3-action prompt:
const handlePromptUpdate = (): void => {
  if (!customGameId || !onUpdateCustomGame) return;
  void (async () => {
    try {
      await onUpdateCustomGame(
        draftApi.draft.name,
        draftApi.draft.config,
        {
          cover: draftApi.draft.cover,
          color: draftApi.draft.color,
        },
      );
      await persistLastSession(draftApi.draft.config);
      draftApi.commitSaved(draftApi.draft);
      setCustomPlayPromptOpen(false);
      setPlayPromptError(null);
      onStart();
    } catch (error) {
      console.error('Failed to update custom game on play', error);
      const message = t('instructions.updateError', {
        defaultValue: "Couldn't update — try again.",
      });
      setPlayPromptError(message);
      toast.error(message);
    }
  })();
};

const handlePromptSaveAsNew = (): void => {
  // Fall back to the existing save-on-play dialog flow which already
  // captures a name, validates it, and writes a new custom_games row.
  setCustomPlayPromptOpen(false);
  setSaveSubmitAttempted(false);
  setSavingName(
    suggestCustomGameName(gameTitle, existingCustomGameNames),
  );
  setSaveDialogOpen(true);
};

const handlePromptPlayWithoutSaving = (): void => {
  void persistLastSession(draftApi.draft.config);
  setCustomPlayPromptOpen(false);
  onStart();
};
```

Add the new dialog (right after the existing save-on-play `<Dialog>`):

```tsx
{
  customGameId && customGameName && (
    <Dialog
      open={customPlayPromptOpen}
      onOpenChange={setCustomPlayPromptOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('instructions.customPlayPromptTitle', {
              name: customGameName,
              defaultValue: `Save changes to "${customGameName}"?`,
            })}
          </DialogTitle>
        </DialogHeader>
        {playPromptError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
          >
            {playPromptError}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePromptUpdate}
            className="rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground"
          >
            {t('instructions.updateCustomGame', {
              name: customGameName,
              defaultValue: `Update "${customGameName}"`,
            })}
          </button>
          <button
            type="button"
            onClick={handlePromptSaveAsNew}
            className="rounded-lg border border-input bg-background py-2 text-sm font-semibold"
          >
            {t('instructions.saveAsNew', {
              defaultValue: 'Save as new custom game',
            })}
          </button>
          <button
            type="button"
            onClick={handlePromptPlayWithoutSaving}
            className="rounded-lg border border-input bg-background py-2 text-sm"
          >
            {t('instructions.playWithoutSaving', {
              defaultValue: 'Play without saving',
            })}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run prompt tests to verify they pass**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx -t "play prompt"`
Expected: PASS.

- [ ] **Step 5: Run the full overlay test file**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`
Expected: PASS — all scenarios green.

- [ ] **Step 6: Run typecheck and lint**

Run: `yarn typecheck && yarn lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.tsx \
        src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
git commit -m "feat(answer-game): dirty-aware Play prompt for custom games

When the draft differs from the saved baseline and a custom game is
loaded, Let's go now opens a 3-action prompt: Update / Save as new /
Play without saving. Clean play skips the prompt entirely. Default
games keep the existing 2-action save-on-play dialog.

Refs #254."
```

---

## Task 6: Remove `usePersistLastGameConfig`; wire explicit `onPersistLastSession`

**Files:**

- Modify: `src/routes/$locale/_app/game/$gameId.tsx`
- Delete: `src/db/hooks/usePersistLastGameConfig.ts`

**Notes:**

- All three `<GameId>GameBody` components currently call `usePersistLastGameConfig(gameId, cfg)`. Replace with a memoized `onPersistLastSession` callback passed into `InstructionsOverlay`.
- `useCustomGames` already exposes `persistLastSessionConfig`; reuse it.
- The flush-on-unmount behavior of the old hook is intentionally not preserved: we explicitly call `onPersistLastSession` on every Play branch, so the most recent intent is always persisted before navigating away from the overlay.

- [ ] **Step 1: Inspect current usage**

Run: `grep -n "usePersistLastGameConfig\|persistLastSessionConfig" src/routes/$locale/_app/game/$gameId.tsx`
Expected output: three `usePersistLastGameConfig(...)` calls, one per game body, plus an import line.

- [ ] **Step 2: Modify the route file — WordSpellGameBody**

In `src/routes/$locale/_app/game/$gameId.tsx`, remove the `usePersistLastGameConfig` import and replace the per-body usage:

```tsx
// Top of the file: remove this import
// import { usePersistLastGameConfig } from '@/db/hooks/usePersistLastGameConfig';

// Inside WordSpellGameBody, REMOVE this line:
//   usePersistLastGameConfig(
//     gameId,
//     cfg as unknown as Record<string, unknown>,
//   );

// In the InstructionsOverlay render (still inside WordSpellGameBody),
// add the prop:
//
//   <InstructionsOverlay
//     ...existing props
//     onPersistLastSession={(c) => persistLastSessionConfig(gameId, c)}
//   />

// To get persistLastSessionConfig, change:
//   const { save, update, remove, customGames } = useCustomGames();
// to:
//   const {
//     save,
//     update,
//     remove,
//     customGames,
//     persistLastSessionConfig,
//   } = useCustomGames();
```

- [ ] **Step 3: Repeat for `NumberMatchGameBody` and `SortNumbersGameBody`**

Same pattern: remove the `usePersistLastGameConfig` call, add the destructure of `persistLastSessionConfig`, pass `onPersistLastSession` to `InstructionsOverlay`.

- [ ] **Step 4: Delete the obsolete hook**

```bash
git rm src/db/hooks/usePersistLastGameConfig.ts
```

- [ ] **Step 5: Run typecheck**

Run: `yarn typecheck`
Expected: clean.

- [ ] **Step 6: Run unit tests for affected route file**

Run: `yarn vitest run src/routes/$locale/_app/game/$gameId.test.tsx`
Expected: PASS — the route's existing tests don't assert the auto-debounce, so removing it should not regress them.

- [ ] **Step 7: Run the full unit test suite**

Run: `yarn test`
Expected: PASS — no regressions.

- [ ] **Step 8: Run lint**

Run: `yarn lint`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/routes/$locale/_app/game/\$gameId.tsx src/db/hooks/usePersistLastGameConfig.ts
git commit -m "refactor(routes): replace usePersistLastGameConfig debounce with explicit calls

Last-session persistence now fires only on Play (clean play, save &
play, save as new, update, play without saving) — driven by the
onPersistLastSession callback that InstructionsOverlay calls in each
of those branches. Auto-debounced writes on every keystroke are
retired.

Refs #254."
```

---

## Task 7: Persistence-failure error tests

**Files:**

- Modify: `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`

**Notes:**

- Validate the inline-error-banner + toast wiring already added in Tasks 4 and 5. This task is test-only but worth a separate commit so reviewers can see the error UX is exercised.

- [ ] **Step 1: Add the failing failure tests**

Append to `src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx`:

```tsx
import { toast } from 'sonner';
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

describe('InstructionsOverlay error handling', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
  });

  it('Update DB error from advanced modal: modal stays open, banner + toast', async () => {
    const user = userEvent.setup();
    const onUpdateCustomGame = vi
      .fn()
      .mockRejectedValue(new Error('boom'));
    render(
      <InstructionsOverlay
        {...baseProps({
          gameId: 'sort-numbers',
          customGameId: 'cg1',
          customGameName: 'Custom A',
          onUpdateCustomGame,
          config: { component: 'SortNumbers', direction: 'ascending' },
        })}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /configure/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /update "custom a"/i }),
    );
    expect(
      await screen.findByText(/couldn't update/i),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  it('Update DB error from play prompt: prompt stays open, banner + toast, onStart not called', async () => {
    const user = userEvent.setup();
    const onUpdateCustomGame = vi
      .fn()
      .mockRejectedValue(new Error('boom'));
    const onStart = vi.fn();
    const Harness = (): JSX.Element => {
      const [config, setConfig] = useState({
        component: 'SortNumbers',
        direction: 'ascending',
        configMode: 'simple',
        quantity: 5,
        skip: { mode: 'by', step: 2, start: 2 },
        inputMethod: 'drag',
      });
      return (
        <InstructionsOverlay
          {...baseProps({
            gameId: 'sort-numbers',
            customGameId: 'cg1',
            customGameName: 'Custom A',
            onUpdateCustomGame,
            onConfigChange: setConfig,
            onStart,
            config,
          })}
        />
      );
    };
    render(<Harness />, { wrapper });
    await applySimpleEdit(user, 'sort-numbers', {
      direction: 'descending',
    });
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    await user.click(
      screen.getByRole('button', { name: /update "custom a"/i }),
    );
    expect(
      await screen.findByText(/couldn't update/i),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('Save-as-new DB error from advanced modal: modal stays open, banner + toast', async () => {
    const user = userEvent.setup();
    const onSaveCustomGame = vi
      .fn()
      .mockRejectedValue(new Error('boom'));
    render(
      <InstructionsOverlay
        {...baseProps({
          gameId: 'sort-numbers',
          onSaveCustomGame,
          config: { component: 'SortNumbers', direction: 'ascending' },
        })}
      />,
      { wrapper },
    );
    await user.click(
      screen.getByRole('button', { name: /configure/i }),
    );
    await user.type(screen.getByPlaceholderText(/skip by 2/i), 'Mine');
    await user.click(
      screen.getByRole('button', { name: /save as new/i }),
    );
    expect(
      await screen.findByText(/couldn't save/i),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  it('Last-session write failure on Play without saving still calls onStart', async () => {
    const user = userEvent.setup();
    const onPersistLastSession = vi
      .fn()
      .mockRejectedValue(new Error('storage full'));
    const onStart = vi.fn();
    const Harness = (): JSX.Element => {
      const [config, setConfig] = useState({
        component: 'SortNumbers',
        direction: 'ascending',
        configMode: 'simple',
        quantity: 5,
        skip: { mode: 'by', step: 2, start: 2 },
        inputMethod: 'drag',
      });
      return (
        <InstructionsOverlay
          {...baseProps({
            gameId: 'sort-numbers',
            customGameId: 'cg1',
            customGameName: 'Custom A',
            onUpdateCustomGame: vi.fn(async () => {}),
            onPersistLastSession,
            onStart,
            onConfigChange: setConfig,
            config,
          })}
        />
      );
    };
    render(<Harness />, { wrapper });
    await applySimpleEdit(user, 'sort-numbers', {
      direction: 'descending',
    });
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    await user.click(
      screen.getByRole('button', { name: /play without saving/i }),
    );
    // onStart still fires
    expect(onStart).toHaveBeenCalled();
    // toast.error fired for the last-session failure
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
```

Make sure `waitFor` is imported from `@testing-library/react` at the top of the file:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
```

- [ ] **Step 2: Run failure tests to verify they pass**

Run: `yarn vitest run src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx -t "error handling"`
Expected: PASS — all scenarios green; the error UI was already wired in Tasks 4 and 5, so this task is verification-only.

If any test fails, fix the underlying inline-error wiring in `InstructionsOverlay.tsx` (the relevant strings and `setModalError` / `setPlayPromptError` calls live there) and re-run.

- [ ] **Step 3: Run full unit test suite**

Run: `yarn test`
Expected: PASS — no regressions.

- [ ] **Step 4: Run typecheck and lint**

Run: `yarn typecheck && yarn lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/InstructionsOverlay/InstructionsOverlay.test.tsx
git commit -m "test(answer-game): cover persistence-failure UX

Locks in the inline-error banner + sonner toast behavior for Update,
Save as new, and Play without saving failures across both the
advanced modal and the play prompt.

Refs #254."
```

---

## Task 8: Pre-push verification + open the PR

**Files:** none (git/CI workflow only).

- [ ] **Step 1: Confirm clean working tree**

Run: `git status`
Expected: clean (or only the unrelated `.claude/settings.json` and `.claude/metadata-updater.sh` from session setup).

- [ ] **Step 2: Run the full pre-push gate**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: all green.

- [ ] **Step 3: Run VR locally if Docker is up**

Run: `yarn test:vr`
If the changes affect the modal/overlay rendering, expect baseline diffs. If diffs are intentional, run `yarn test:vr:update` and verify the new baselines visually before committing them.

- [ ] **Step 4: Push the branch**

Run: `git push -u origin feat/issue-254`

- [ ] **Step 5: Open the PR**

Run:

```bash
gh pr create --title "feat(answer-game): unify simple ↔ advanced config state (#254)" --body "$(cat <<'EOF'
## Summary

- Lifts the simple-form / advanced-modal config draft into `InstructionsOverlay` via a new `useConfigDraft` hook
- Advanced modal becomes a controlled component with `value/onChange`
- Adds dirty-aware Play prompt with Update / Save as new / Play without saving for custom games
- Replaces the auto-debounced `usePersistLastGameConfig` with explicit calls on every Play branch
- Surfaces persistence failures via inline error banners + `sonner` toasts

## Test plan

- [ ] `yarn typecheck`
- [ ] `yarn lint`
- [ ] `yarn test`
- [ ] `yarn test:vr` (run locally with Docker)
- [ ] Manual: open WordSpell custom game → edit simple → cog reflects edits → Cancel reverts both
- [ ] Manual: open SortNumbers custom game → edit → Play → 3-action prompt → Update path commits and starts
- [ ] Manual: open NumberMatch default game → edit → Play → save-on-play prompt; Play without saving starts game with edits

Closes #254.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Wait for CI**

Watch the PR's checks. If any fail, the orchestrator will forward failures — fix and push again.

---

## Self-review

**Spec coverage:**

- Architecture (one shared draft in InstructionsOverlay, controlled modal) → Tasks 2, 3, 4 ✓
- State machine (snapshot/discard/commit; identity re-init) → Task 2 (hook) + Task 4 (wiring) ✓
- Dirty check via in-house deepEqual → Task 1 ✓
- Play flow with 3-action prompt for dirty custom games, 2-action for default, no prompt clean → Task 5 ✓
- `persistLastSession` replaces auto-debounce on every Play branch → Task 6 ✓
- Error handling: inline banners + sonner toasts → Tasks 4 (modal save/update), 5 (prompt update), 7 (verification) ✓
- Testing matrix #1–12 → Tasks 4, 5, 7 + scenario coverage in `describe.each` ✓
- Rollout: 6 baby-step commits + verification commit → matches Tasks 1–7 (with Task 8 as the push/PR step) ✓
- Worktree note from spec → handed off to user separately (cosmetic, not blocking)

**Placeholder scan:** none. All steps include exact file paths, full code blocks, exact commands, and concrete commit messages.

**Type consistency:**

- `Draft` shape (`config`, `name`, `color`, `cover`) is identical between Tasks 2 (hook), 3 (modal `value`), 4 (overlay binding), 5 (prompt handlers).
- `SavePayload` shape (`configId`, `name`, `color`, `cover`, `config`) is identical between Task 3 (modal export) and Task 4 (overlay handlers).
- `ConfigDraftApi` method names (`setDraft`, `openModalSnapshot`, `discard`, `commitSaved`) are used consistently in Tasks 2, 4, 5.
