# Progress HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a default Progress HUD (bullet dots + `N/M` fraction + `LEVEL N`
label) auto-rendered at the top of every `AnswerGame`-based game, with
config-driven visibility flags and an optional skin component override.

**Architecture:** A small stateless `ProgressHUD` component reads round/level
state from `AnswerGameState` (via `useAnswerGameContext`) and a resolved flag
set. `AnswerGame` now takes an optional `skin` prop and auto-renders a
`ProgressHUDRoot` as its first child. `ProgressHUDRoot` chooses between
`skin.ProgressHUD` (if provided) and the default component. Skins restyle the
default through `--skin-hud-*` CSS custom properties on the game container.

**Tech Stack:** React 19, TypeScript strict, Tailwind v4, Vitest + React
Testing Library, Storybook, Playwright visual regression.

---

## Reference Material

- Spec: `docs/superpowers/specs/2026-04-15-progress-hud-design.md`
- Existing skin system: `docs/superpowers/specs/2026-04-13-game-skin-system-design.md`
- Existing level system: `src/games/level-system.mdx`
- Existing patterns to mirror:
  - `src/components/answer-game/ScoreAnimation/ScoreAnimation.tsx` (small
    presentation component)
  - `src/lib/skin/classic-skin.ts` (adding new `--skin-*` tokens)
  - `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` (how games pass skin
    into AnswerGame today)

## File Structure

Files created or modified in this plan:

**Created**

- `src/components/answer-game/ProgressHUD/ProgressHUD.tsx` — presentation
  component. Receives props, renders dots / fraction / level label. No
  context access — pure render.
- `src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx` — unit tests
  for the default component.
- `src/components/answer-game/ProgressHUD/ProgressHUDRoot.tsx` — wrapper
  that pulls state from context, resolves flags via `resolveHudFlags`, and
  picks `skin.ProgressHUD` vs default.
- `src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx` —
  integration tests for the wrapper.
- `src/components/answer-game/ProgressHUD/resolve-hud-flags.ts` — pure
  helper merging config overrides with mode-based defaults.
- `src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts` — unit
  tests for the helper.
- `src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx` —
  Storybook stories covering all flag combinations + level mode growth.

**Modified**

- `src/components/answer-game/types.ts` — add `hud?: HudConfig` field to
  `AnswerGameConfig`, plus `ProgressHUDProps` and `HudConfig` type exports.
- `src/lib/skin/game-skin.ts` — add optional `ProgressHUD` render slot.
- `src/lib/skin/classic-skin.ts` — add `--skin-hud-*` default tokens.
- `src/components/answer-game/AnswerGame/AnswerGame.tsx` — accept optional
  `skin` prop; mount `ProgressHUDRoot` as first child.
- `src/components/answer-game/AnswerGame/AnswerGame.test.tsx` — cover the
  new skin prop + HUD auto-render.
- `src/games/word-spell/WordSpell/WordSpell.tsx` — pass `skin` to
  `<AnswerGame>`.
- `src/games/number-match/NumberMatch/NumberMatch.tsx` — pass `skin` to
  `<AnswerGame>`.
- `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` — pass `skin` to
  `<AnswerGame>`.
- `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx` and the
  equivalent VR story files (one per game) — add HUD-covering VR cases.
- `src/components/answer-game/AnswerGame/AnswerGame.reference.mdx` — add
  `ProgressHUDRoot` to the context/consumers map.
- `src/components/answer-game/AnswerGame/AnswerGame.flows.mdx` — add the
  HUD render step to the game mount flow.

---

## Task 1: Add `HudConfig`, `ProgressHUDProps`, and `AnswerGameConfig.hud`

**Files:**

- Modify: `src/components/answer-game/types.ts`

**Why:** Other tasks depend on the types being in place. No behavior change
yet — only type surface.

- [ ] **Step 1: Add the types**

Open `src/components/answer-game/types.ts` and add at the end of the file:

```ts
export interface HudConfig {
  /** Bullet row, one dot per round (classic) or per level (level mode). */
  showDots?: boolean;
  /** "3/5" label; auto-hides when totalRounds is null. */
  showFraction?: boolean;
  /** "LEVEL N" label; most useful with level mode. */
  showLevel?: boolean;
}

export interface ProgressHUDProps {
  /** 0-based index of the current round. */
  roundIndex: number;
  /** Total rounds in the session; null for unbounded level mode. */
  totalRounds: number | null;
  /** 0-based index of the current level; 0 when levelMode is off. */
  levelIndex: number;
  /** Whether the game uses levelMode. */
  isLevelMode: boolean;
  /** Lifecycle phase — enables pop/celebration animations on transition. */
  phase: AnswerGamePhase;
  /** Resolved visibility flags after merging defaults + config. */
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}
```

In the existing `AnswerGameConfig` interface (lines 1-53 of the file), add
this field just before the closing `}`:

```ts
  /** Controls which HUD elements render. Each flag is independent. */
  hud?: HudConfig;
```

- [ ] **Step 2: Run typecheck**

Run: `yarn typecheck`
Expected: exit 0. No other file references the new types yet, so this is a
pure addition.

- [ ] **Step 3: Commit**

```bash
git add src/components/answer-game/types.ts
git commit -m "feat(progress-hud): add HudConfig and ProgressHUDProps types"
```

---

## Task 2: `resolveHudFlags` helper (TDD)

**Files:**

- Create: `src/components/answer-game/ProgressHUD/resolve-hud-flags.ts`
- Test: `src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts`

**Why:** Flag resolution needs to merge partial config with mode-based
defaults. Isolating it in a pure function keeps `ProgressHUDRoot` trivial and
gives a clear TDD target.

- [ ] **Step 1: Write the failing tests**

Create `src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveHudFlags } from './resolve-hud-flags';

describe('resolveHudFlags', () => {
  it('returns dots + fraction + no level for classic mode with no config', () => {
    expect(resolveHudFlags(undefined, false)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: false,
    });
  });

  it('returns dots + level + no fraction for level mode with no config', () => {
    expect(resolveHudFlags(undefined, true)).toEqual({
      showDots: true,
      showFraction: false,
      showLevel: true,
    });
  });

  it('merges partial config on top of classic defaults', () => {
    expect(resolveHudFlags({ showLevel: true }, false)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: true,
    });
  });

  it('merges partial config on top of level-mode defaults', () => {
    expect(resolveHudFlags({ showFraction: true }, true)).toEqual({
      showDots: true,
      showFraction: true,
      showLevel: true,
    });
  });

  it('respects explicit false to disable a default-on flag', () => {
    expect(resolveHudFlags({ showDots: false }, false)).toEqual({
      showDots: false,
      showFraction: true,
      showLevel: false,
    });
  });

  it('returns all false when every flag is explicitly off', () => {
    expect(
      resolveHudFlags(
        { showDots: false, showFraction: false, showLevel: false },
        false,
      ),
    ).toEqual({
      showDots: false,
      showFraction: false,
      showLevel: false,
    });
  });
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts`
Expected: FAIL — "Cannot find module './resolve-hud-flags'".

- [ ] **Step 3: Implement `resolveHudFlags`**

Create `src/components/answer-game/ProgressHUD/resolve-hud-flags.ts`:

```ts
import type { HudConfig } from '../types';

export interface ResolvedHudFlags {
  showDots: boolean;
  showFraction: boolean;
  showLevel: boolean;
}

export const resolveHudFlags = (
  config: HudConfig | undefined,
  isLevelMode: boolean,
): ResolvedHudFlags => {
  const defaults: ResolvedHudFlags = isLevelMode
    ? { showDots: true, showFraction: false, showLevel: true }
    : { showDots: true, showFraction: true, showLevel: false };

  return {
    showDots: config?.showDots ?? defaults.showDots,
    showFraction: config?.showFraction ?? defaults.showFraction,
    showLevel: config?.showLevel ?? defaults.showLevel,
  };
};
```

- [ ] **Step 4: Run the test and see it pass**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/ProgressHUD/resolve-hud-flags.ts \
        src/components/answer-game/ProgressHUD/resolve-hud-flags.test.ts
git commit -m "feat(progress-hud): resolve HUD flags from config + mode"
```

---

## Task 3: Add `ProgressHUD` slot to `GameSkin` + classic tokens

**Files:**

- Modify: `src/lib/skin/game-skin.ts`
- Modify: `src/lib/skin/classic-skin.ts`

**Why:** Skins need the contract extension so a skin can replace the HUD; the
classic skin needs sensible `--skin-hud-*` defaults so the HUD renders out of
the box.

- [ ] **Step 1: Extend `GameSkin`**

In `src/lib/skin/game-skin.ts`, add this import at the top (if not already
imported):

```ts
import type { ProgressHUDProps } from '@/components/answer-game/types';
```

Then, inside the `GameSkin` interface, add this field in the "Optional Render
Slots" block — place it after `LevelCompleteOverlay`:

```ts
  /**
   * Replaces the default ProgressHUD rendered at the top of the game
   * container. Always mounts when provided, regardless of `config.hud`
   * flag state.
   */
  ProgressHUD?: ComponentType<ProgressHUDProps>;
```

- [ ] **Step 2: Add classic tokens**

In `src/lib/skin/classic-skin.ts`, append these entries inside the `tokens`
object (just before the closing `}` of the `tokens` map):

```ts
    // ── HUD tokens ────────────────────────────────────────────────
    '--skin-hud-bg': 'transparent',
    '--skin-hud-gap': '0.5rem',
    '--skin-hud-padding': '0.25rem 0.75rem',
    '--skin-hud-radius': '9999px',
    '--skin-hud-dot-size': '0.875rem',
    '--skin-hud-dot-fill': 'var(--bs-success)',
    '--skin-hud-dot-empty': 'var(--bs-surface)',
    '--skin-hud-dot-border': 'var(--bs-border)',
    '--skin-hud-fraction-color': 'var(--bs-foreground)',
    '--skin-hud-fraction-sep-color': 'var(--skin-hud-dot-fill)',
    '--skin-hud-level-color': 'var(--bs-primary)',
```

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/skin/game-skin.ts src/lib/skin/classic-skin.ts
git commit -m "feat(progress-hud): add ProgressHUD slot + classic tokens"
```

---

## Task 4: Default `ProgressHUD` component (TDD)

**Files:**

- Create: `src/components/answer-game/ProgressHUD/ProgressHUD.tsx`
- Test: `src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx`

**Why:** Stateless presentation component — the core of the feature. Tests
cover every branch of the rendering logic.

- [ ] **Step 1: Write the failing tests**

Create `src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressHUD } from './ProgressHUD';
import type { ProgressHUDProps } from '../types';

const baseProps: ProgressHUDProps = {
  roundIndex: 0,
  totalRounds: 5,
  levelIndex: 0,
  isLevelMode: false,
  phase: 'playing',
  showDots: true,
  showFraction: true,
  showLevel: false,
};

describe('ProgressHUD', () => {
  it('renders one dot per totalRounds in classic mode', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(5);
  });

  it('marks earlier dots done, current dot current, later dots todo', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots[0]).toHaveAttribute('data-state', 'done');
    expect(dots[1]).toHaveAttribute('data-state', 'done');
    expect(dots[2]).toHaveAttribute('data-state', 'current');
    expect(dots[3]).toHaveAttribute('data-state', 'todo');
    expect(dots[4]).toHaveAttribute('data-state', 'todo');
  });

  it('renders fraction "3/5" when showFraction and totalRounds are set', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('hides fraction when totalRounds is null', () => {
    render(
      <ProgressHUD {...baseProps} totalRounds={null} showFraction />,
    );
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('renders "LEVEL 3" when showLevel is true', () => {
    render(<ProgressHUD {...baseProps} showLevel levelIndex={2} />);
    expect(screen.getByText(/LEVEL 3/)).toBeInTheDocument();
  });

  it('renders null when every flag is false', () => {
    const { container } = render(
      <ProgressHUD
        {...baseProps}
        showDots={false}
        showFraction={false}
        showLevel={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('uses levelIndex+1 dots in level mode, with levelIndex filled', () => {
    render(
      <ProgressHUD
        {...baseProps}
        isLevelMode
        totalRounds={null}
        levelIndex={2}
        showFraction={false}
        showLevel
      />,
    );
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('data-state', 'done');
    expect(dots[1]).toHaveAttribute('data-state', 'done');
    expect(dots[2]).toHaveAttribute('data-state', 'current');
  });

  it('marks the container with data-phase for phase-driven animations', () => {
    const { container } = render(
      <ProgressHUD {...baseProps} phase="round-complete" />,
    );
    expect(container.firstChild).toHaveAttribute(
      'data-phase',
      'round-complete',
    );
  });
});
```

- [ ] **Step 2: Run tests and see them fail**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx`
Expected: FAIL — "Cannot find module './ProgressHUD'".

- [ ] **Step 3: Implement the component**

Create `src/components/answer-game/ProgressHUD/ProgressHUD.tsx`:

```tsx
import type { ProgressHUDProps } from '../types';

export const ProgressHUD = ({
  roundIndex,
  totalRounds,
  levelIndex,
  isLevelMode,
  phase,
  showDots,
  showFraction,
  showLevel,
}: ProgressHUDProps) => {
  if (!showDots && !showFraction && !showLevel) return null;

  const dotCount = isLevelMode ? levelIndex + 1 : (totalRounds ?? 0);
  const filledIndex = isLevelMode ? levelIndex : roundIndex;
  const canShowFraction = showFraction && totalRounds !== null;

  return (
    <div
      className="skin-hud flex items-center gap-[var(--skin-hud-gap)] rounded-[var(--skin-hud-radius)] bg-[var(--skin-hud-bg)] px-[0.75rem] py-[0.25rem]"
      data-phase={phase}
    >
      {showLevel ? (
        <span
          className="skin-hud__level font-extrabold tracking-widest text-[color:var(--skin-hud-level-color)]"
          aria-live="polite"
        >
          LEVEL {levelIndex + 1}
        </span>
      ) : null}
      {showDots ? (
        <ol
          className="skin-hud__dots flex items-center gap-[var(--skin-hud-gap)]"
          aria-label="round progress"
        >
          {Array.from({ length: dotCount }).map((_, i) => (
            <li
              key={i}
              className="skin-hud__dot block size-[var(--skin-hud-dot-size)] rounded-full border border-[color:var(--skin-hud-dot-border)]"
              data-state={
                i < filledIndex
                  ? 'done'
                  : i === filledIndex
                    ? 'current'
                    : 'todo'
              }
            />
          ))}
        </ol>
      ) : null}
      {canShowFraction ? (
        <span
          className="skin-hud__fraction font-extrabold text-[color:var(--skin-hud-fraction-color)]"
          aria-live="polite"
        >
          {roundIndex + 1}
          <span className="skin-hud__fraction-sep mx-0.5 text-[color:var(--skin-hud-fraction-sep-color)]">
            /
          </span>
          {totalRounds}
        </span>
      ) : null}
    </div>
  );
};
```

- [ ] **Step 4: Add CSS for dot fill states**

Append the following to the nearest shared stylesheet that skin tokens use
today. Search for where `--skin-correct-color` is consumed to find it — if
the project does not already have a shared `skin.css` for skin-token-driven
rules, add them inline via Tailwind arbitrary-variant classes on the `<li>`
instead. The simplest working approach:

Edit `src/components/answer-game/ProgressHUD/ProgressHUD.tsx` and replace the
`<li>` line with:

```tsx
<li
  key={i}
  className="skin-hud__dot block size-[var(--skin-hud-dot-size)] rounded-full border border-[color:var(--skin-hud-dot-border)] data-[state=done]:bg-[color:var(--skin-hud-dot-fill)] data-[state=current]:bg-[color:var(--skin-hud-dot-fill)] data-[state=current]:ring-4 data-[state=current]:ring-[color:var(--skin-hud-dot-fill)]/25 data-[state=todo]:bg-[color:var(--skin-hud-dot-empty)] motion-safe:data-[state=current]:data-[phase=round-complete]:animate-pulse"
  data-state={
    i < filledIndex ? 'done' : i === filledIndex ? 'current' : 'todo'
  }
/>
```

(No new CSS file needed — Tailwind `data-[...]` variant + CSS vars handle
the state styling.)

- [ ] **Step 5: Run tests and see them pass**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx`
Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/answer-game/ProgressHUD/ProgressHUD.tsx \
        src/components/answer-game/ProgressHUD/ProgressHUD.test.tsx
git commit -m "feat(progress-hud): default ProgressHUD component"
```

---

## Task 5: `ProgressHUDRoot` wrapper (TDD)

**Files:**

- Create: `src/components/answer-game/ProgressHUD/ProgressHUDRoot.tsx`
- Test: `src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx`

**Why:** Isolates context access and the skin-vs-default decision so
`ProgressHUD` stays pure. Skin override always mounts when provided — this is
the escape hatch called out in the spec.

- [ ] **Step 1: Write the failing tests**

Create `src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProgressHUDRoot } from './ProgressHUDRoot';
import { AnswerGameStateContext } from '../AnswerGameProvider';
import type {
  AnswerGameConfig,
  AnswerGameState,
  ProgressHUDProps,
} from '../types';
import type { GameSkin } from '@/lib/skin';

const makeState = (
  overrides: Partial<AnswerGameState> = {},
): AnswerGameState => ({
  config: {
    gameId: 'test',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 5,
    ttsEnabled: false,
    initialTiles: [],
    initialZones: [],
  } satisfies AnswerGameConfig,
  allTiles: [],
  bankTileIds: [],
  zones: [],
  activeSlotIndex: 0,
  dragActiveTileId: null,
  dragHoverZoneIndex: null,
  dragHoverBankTileId: null,
  phase: 'playing',
  roundIndex: 0,
  retryCount: 0,
  levelIndex: 0,
  isLevelMode: false,
  ...overrides,
});

const renderWithState = (state: AnswerGameState, skin?: GameSkin) =>
  render(
    <AnswerGameStateContext.Provider value={state}>
      <ProgressHUDRoot skin={skin} />
    </AnswerGameStateContext.Provider>,
  );

describe('ProgressHUDRoot', () => {
  it('renders the default HUD with classic defaults', () => {
    renderWithState(makeState({ roundIndex: 1 }));
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(5);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders level label when game is in level mode', () => {
    renderWithState(
      makeState({
        isLevelMode: true,
        levelIndex: 2,
        config: {
          gameId: 'sort',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 1,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
        },
      }),
    );
    expect(screen.getByText(/LEVEL 3/)).toBeInTheDocument();
  });

  it('respects config.hud overrides', () => {
    renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: true,
            showLevel: false,
          },
        },
      }),
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('mounts skin.ProgressHUD when provided, receiving the props', () => {
    const SkinHud = vi.fn<(p: ProgressHUDProps) => JSX.Element | null>(
      () => <div data-testid="custom-hud" />,
    );
    const skin: GameSkin = {
      id: 'custom',
      name: 'Custom',
      tokens: {},
      ProgressHUD: SkinHud as unknown as GameSkin['ProgressHUD'],
    };
    renderWithState(makeState({ roundIndex: 1 }), skin);
    expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
    expect(SkinHud).toHaveBeenCalledWith(
      expect.objectContaining({
        roundIndex: 1,
        totalRounds: 5,
        showDots: true,
        showFraction: true,
        showLevel: false,
      }),
      undefined,
    );
  });

  it('still mounts skin.ProgressHUD when all flags are false', () => {
    const SkinHud = vi.fn(() => <div data-testid="custom-hud" />);
    const skin: GameSkin = {
      id: 'custom',
      name: 'Custom',
      tokens: {},
      ProgressHUD: SkinHud as unknown as GameSkin['ProgressHUD'],
    };
    renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: false,
            showLevel: false,
          },
        },
      }),
      skin,
    );
    expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
  });

  it('returns null when no skin override AND all flags are false', () => {
    const { container } = renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: false,
            showLevel: false,
          },
        },
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run tests and see them fail**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx`
Expected: FAIL — "Cannot find module './ProgressHUDRoot'".

- [ ] **Step 3: Implement the wrapper**

Create `src/components/answer-game/ProgressHUD/ProgressHUDRoot.tsx`:

```tsx
import { ProgressHUD } from './ProgressHUD';
import { resolveHudFlags } from './resolve-hud-flags';
import { useAnswerGameContext } from '../useAnswerGameContext';
import type { ProgressHUDProps } from '../types';
import type { GameSkin } from '@/lib/skin';

interface ProgressHUDRootProps {
  skin?: GameSkin;
}

export const ProgressHUDRoot = ({ skin }: ProgressHUDRootProps) => {
  const { config, phase, roundIndex, levelIndex, isLevelMode } =
    useAnswerGameContext();

  const flags = resolveHudFlags(config.hud, isLevelMode);

  const props: ProgressHUDProps = {
    roundIndex,
    totalRounds: isLevelMode ? null : config.totalRounds,
    levelIndex,
    isLevelMode,
    phase,
    ...flags,
  };

  if (skin?.ProgressHUD) {
    const SkinHud = skin.ProgressHUD;
    return <SkinHud {...props} />;
  }

  return <ProgressHUD {...props} />;
};
```

- [ ] **Step 4: Run tests and see them pass**

Run: `yarn vitest run src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/ProgressHUD/ProgressHUDRoot.tsx \
        src/components/answer-game/ProgressHUD/ProgressHUDRoot.test.tsx
git commit -m "feat(progress-hud): ProgressHUDRoot with skin override"
```

---

## Task 6: Wire HUD into `AnswerGame` (TDD)

**Files:**

- Modify: `src/components/answer-game/AnswerGame/AnswerGame.tsx`
- Modify: `src/components/answer-game/AnswerGame/AnswerGame.test.tsx`

**Why:** `AnswerGame` auto-renders the HUD as its first child. Games will
pass the `skin` down (Tasks 7–9).

- [ ] **Step 1: Write the failing test**

Open `src/components/answer-game/AnswerGame/AnswerGame.test.tsx`. Add this
test at the bottom of the existing `describe` block:

```tsx
import { resolveHudFlags } from '../ProgressHUD/resolve-hud-flags';

it('auto-renders ProgressHUD as the first child of the game container', () => {
  const config: AnswerGameConfig = {
    gameId: 'test',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    ttsEnabled: false,
    initialTiles: [],
    initialZones: [],
  };

  render(
    <AnswerGame config={config}>
      <div data-testid="game-body">body</div>
    </AnswerGame>,
  );

  const dots = screen.getAllByRole('listitem');
  expect(dots).toHaveLength(3);
  expect(screen.getByTestId('game-body')).toBeInTheDocument();
});

it('renders skin.ProgressHUD when a skin prop is passed', () => {
  const SkinHud = () => <div data-testid="custom-hud" />;
  const skin = {
    id: 'x',
    name: 'X',
    tokens: {},
    ProgressHUD: SkinHud,
  } as const;
  const config: AnswerGameConfig = {
    gameId: 'test',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 3,
    ttsEnabled: false,
    initialTiles: [],
    initialZones: [],
  };

  render(
    <AnswerGame config={config} skin={skin}>
      <div />
    </AnswerGame>,
  );

  expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});

// Import at the top of the file if not already present:
// (resolveHudFlags import only needed if the existing tests will use it;
// remove this line if unused.)
void resolveHudFlags;
```

If `AnswerGameConfig`, `render`, `screen`, or `AnswerGame` are not already
imported at the top of the test file, add those imports. Check the existing
imports in the file before adding new ones.

- [ ] **Step 2: Run the tests and see them fail**

Run: `yarn vitest run src/components/answer-game/AnswerGame/AnswerGame.test.tsx`
Expected: FAIL — "listitem" role not found (HUD not yet rendered).

- [ ] **Step 3: Implement `skin` prop + HUD mount**

Replace the contents of
`src/components/answer-game/AnswerGame/AnswerGame.tsx` with:

```tsx
import { AnswerGameProvider } from '../AnswerGameProvider';
import { ProgressHUDRoot } from '../ProgressHUD/ProgressHUDRoot';
import type { AnswerGameConfig, AnswerGameDraftState } from '../types';
import type { GameSkin } from '@/lib/skin';
import type { ReactNode } from 'react';

interface AnswerGameProps {
  config: AnswerGameConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  /**
   * Optional skin. Enables HUD override (`skin.ProgressHUD`) and is
   * consumed by the default HUD for token access via the container's
   * inline style. When omitted, the default HUD renders with classic
   * tokens from the root.
   */
  skin?: GameSkin;
  children: ReactNode;
}

const AnswerGameRoot = ({
  config,
  initialState,
  sessionId,
  skin,
  children,
}: AnswerGameProps) => (
  <AnswerGameProvider
    config={config}
    initialState={initialState}
    sessionId={sessionId}
  >
    <div className="flex min-h-0 w-full flex-col items-center">
      <ProgressHUDRoot skin={skin} />
      {children}
    </div>
  </AnswerGameProvider>
);

const Question = ({ children }: { children?: ReactNode }) => (
  <div className="game-question-zone flex flex-col items-center gap-4 px-4 py-6">
    {children}
  </div>
);

const Answer = ({ children }: { children?: ReactNode }) => (
  <div className="game-answer-zone flex flex-wrap justify-center gap-2 px-4 py-4">
    {children}
  </div>
);

const Choices = ({ children }: { children?: ReactNode }) => (
  <div className="game-choices-zone flex flex-wrap justify-center gap-3 px-4 py-4">
    {children}
  </div>
);

export const AnswerGame = Object.assign(AnswerGameRoot, {
  Question,
  Answer,
  Choices,
});
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `yarn vitest run src/components/answer-game/AnswerGame/AnswerGame.test.tsx`
Expected: PASS — existing tests still pass, two new tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/answer-game/AnswerGame/AnswerGame.tsx \
        src/components/answer-game/AnswerGame/AnswerGame.test.tsx
git commit -m "feat(progress-hud): auto-render HUD from AnswerGame"
```

---

## Task 7: Pass `skin` from WordSpell

**Files:**

- Modify: `src/games/word-spell/WordSpell/WordSpell.tsx`

**Why:** Wires the existing `skin` resolved by `useGameSkin('word-spell', …)`
into `AnswerGame` so a custom `skin.ProgressHUD` (when available) takes over.

- [ ] **Step 1: Locate the `<AnswerGame>` tag in `WordSpell.tsx`**

It is at the end of the `WordSpell` component (around line 376 in the
current file):

```tsx
<AnswerGame
  key={sessionEpoch}
  config={answerGameConfig}
  initialState={sessionEpoch === 0 ? initialState : undefined}
  sessionId={sessionId}
>
```

- [ ] **Step 2: Add the `skin` prop**

Change it to:

```tsx
<AnswerGame
  key={sessionEpoch}
  config={answerGameConfig}
  initialState={sessionEpoch === 0 ? initialState : undefined}
  sessionId={sessionId}
  skin={skin}
>
```

- [ ] **Step 3: Run WordSpell tests**

Run: `yarn vitest run src/games/word-spell`
Expected: PASS — no regressions. Existing tests don't assert HUD presence,
so they keep passing; new HUD renders silently.

- [ ] **Step 4: Commit**

```bash
git add src/games/word-spell/WordSpell/WordSpell.tsx
git commit -m "feat(progress-hud): pass skin to AnswerGame in WordSpell"
```

---

## Task 8: Pass `skin` from NumberMatch

**Files:**

- Modify: `src/games/number-match/NumberMatch/NumberMatch.tsx`

**Why:** Same wiring as WordSpell.

- [ ] **Step 1: Find the `<AnswerGame>` tag**

In `src/games/number-match/NumberMatch/NumberMatch.tsx`, locate the
`<AnswerGame>` tag (search for "AnswerGame" in the file).

- [ ] **Step 2: Add the `skin` prop**

Add `skin={skin}` to the `<AnswerGame>` tag, mirroring WordSpell's change.
The variable name already exists in the file (from `useGameSkin(...)` above);
confirm before adding by reading the file if unsure.

- [ ] **Step 3: Run NumberMatch tests**

Run: `yarn vitest run src/games/number-match`
Expected: PASS — no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/games/number-match/NumberMatch/NumberMatch.tsx
git commit -m "feat(progress-hud): pass skin to AnswerGame in NumberMatch"
```

---

## Task 9: Pass `skin` from SortNumbers

**Files:**

- Modify: `src/games/sort-numbers/SortNumbers/SortNumbers.tsx`

**Why:** Same wiring. SortNumbers is the level-mode case — the HUD will
default to `LEVEL N` + growing dots without any config change.

- [ ] **Step 1: Find the `<AnswerGame>` tag**

In `src/games/sort-numbers/SortNumbers/SortNumbers.tsx` (around line 359).

- [ ] **Step 2: Add the `skin` prop**

Change:

```tsx
<AnswerGame
  key={sessionEpoch}
  config={answerGameConfig}
  initialState={sessionEpoch === 0 ? initialState : undefined}
  sessionId={sessionId}
>
```

To:

```tsx
<AnswerGame
  key={sessionEpoch}
  config={answerGameConfig}
  initialState={sessionEpoch === 0 ? initialState : undefined}
  sessionId={sessionId}
  skin={skin}
>
```

- [ ] **Step 3: Run SortNumbers tests**

Run: `yarn vitest run src/games/sort-numbers`
Expected: PASS — no regressions.

- [ ] **Step 4: Run full unit suite to make sure nothing else regressed**

Run: `yarn vitest run`
Expected: PASS — entire suite is green.

- [ ] **Step 5: Commit**

```bash
git add src/games/sort-numbers/SortNumbers/SortNumbers.tsx
git commit -m "feat(progress-hud): pass skin to AnswerGame in SortNumbers"
```

---

## Task 10: Storybook stories for `ProgressHUD`

**Files:**

- Create: `src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx`

**Why:** Covers every flag combination and level-mode growth, gives designers
a sandbox, and unblocks VR coverage in Task 11.

- [ ] **Step 1: Create the stories file**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressHUD } from './ProgressHUD';

const meta: Meta<typeof ProgressHUD> = {
  component: ProgressHUD,
  title: 'answer-game/ProgressHUD',
  parameters: { layout: 'centered' },
  args: {
    roundIndex: 2,
    totalRounds: 5,
    levelIndex: 0,
    isLevelMode: false,
    phase: 'playing',
    showDots: true,
    showFraction: true,
    showLevel: false,
  },
};

export default meta;
type Story = StoryObj<typeof ProgressHUD>;

export const Classic_Round3Of5: Story = {};

export const Classic_LastRound: Story = {
  args: { roundIndex: 4, totalRounds: 5 },
};

export const DotsOnly: Story = {
  args: { showFraction: false, showLevel: false },
};

export const FractionOnly: Story = {
  args: { showDots: false, showLevel: false },
};

export const LevelMode_Level3: Story = {
  args: {
    isLevelMode: true,
    totalRounds: null,
    levelIndex: 2,
    showFraction: false,
    showLevel: true,
  },
};

export const LevelMode_Level10: Story = {
  args: {
    isLevelMode: true,
    totalRounds: null,
    levelIndex: 9,
    showFraction: false,
    showLevel: true,
  },
};

export const Mixed_LevelPlusFraction: Story = {
  args: {
    isLevelMode: true,
    totalRounds: 5,
    levelIndex: 2,
    showFraction: true,
    showLevel: true,
  },
};

export const RoundCompletePhase: Story = {
  args: { phase: 'round-complete' },
};

export const AllFlagsOff: Story = {
  args: { showDots: false, showFraction: false, showLevel: false },
};
```

- [ ] **Step 2: Start Storybook and eyeball**

Run: `yarn storybook`
Open the stories under `answer-game/ProgressHUD` and confirm each renders as
expected. Kill the server with Ctrl-C when done.

- [ ] **Step 3: Run Storybook test-runner**

Run: `yarn test:storybook`
Expected: PASS — the test-runner mounts every story headlessly.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/ProgressHUD/ProgressHUD.stories.tsx
git commit -m "feat(progress-hud): storybook coverage for HUD variants"
```

---

## Task 11: Visual regression coverage

**Files:**

- Modify: existing VR story files for WordSpell, NumberMatch, SortNumbers

**Why:** Spec §3 requires VR for classic rounds, level-mode level growth,
level-complete pop, and a mixed level+fraction config.

- [ ] **Step 1: Find the current VR stories per game**

Run the following to locate them:

Check: `src/games/word-spell/WordSpell/WordSpell.skin.stories.tsx`

Search for any `.skin.stories.tsx` or `.vr.stories.tsx` in `src/games/` with
`Glob`. Confirm per-game VR story file paths before editing.

- [ ] **Step 2: Add HUD-focused stories**

For WordSpell (`WordSpell.skin.stories.tsx`): add stories representing round
2 of 5 and round 5 of 5 using the existing resolved-config pattern already
used in that file.

For SortNumbers: add stories representing level 1, level 3, level 10, and a
level-complete phase snapshot. Use the existing level-generator mocks or
hand-rolled `initialState` to jump the state forward.

For the mixed case: add a SortNumbers story with `config.hud = { showDots:
true, showFraction: true, showLevel: true }` and a capped `maxLevels: 5`.

If writing fresh stories is blocked because the existing VR file has no
obvious pattern for jumping to "round 5 of 5", add an `initialState` that
constructs the needed `AnswerGameDraftState` — reuse the pattern from
`AnswerGameProvider.test.tsx`.

- [ ] **Step 3: Update VR baselines locally (Docker required)**

Confirm Docker is running, then:

Run: `yarn test:vr:update`
Expected: new baseline PNGs emitted for each new story. Review the PNGs
visually before committing.

- [ ] **Step 4: Re-run `yarn test:vr` to confirm parity**

Run: `yarn test:vr`
Expected: PASS — no diffs.

- [ ] **Step 5: Commit**

```bash
git add src/games tests   # adjust paths to whichever story files and snapshot directories were updated
git commit -m "test(progress-hud): VR coverage for HUD across games"
```

---

## Task 12: Update architecture docs

**Files:**

- Modify: `src/components/answer-game/AnswerGame/AnswerGame.reference.mdx`
- Modify: `src/components/answer-game/AnswerGame/AnswerGame.flows.mdx`

**Why:** `CLAUDE.md` requires co-located `.mdx` docs to be updated in the
same PR when `src/components/answer-game/` changes.

- [ ] **Step 1: Add ProgressHUDRoot to the reference table**

Open `AnswerGame.reference.mdx`. Under the component/consumers section
(search for `useAnswerGameContext`), add a row noting that
`ProgressHUDRoot` reads `config.hud`, `phase`, `roundIndex`, `levelIndex`,
`isLevelMode`, and `config.totalRounds`.

- [ ] **Step 2: Add the HUD render step to the flows doc**

Open `AnswerGame.flows.mdx`. Under the game-mount flow, add a note that
`AnswerGame` renders `ProgressHUDRoot` as the first child of its outer
container, and that the root decides between `skin.ProgressHUD` and the
default component using `resolveHudFlags`.

- [ ] **Step 3: Run markdown fix + lint**

Run: `yarn fix:md && yarn lint:md`
Expected: exit 0, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/answer-game/AnswerGame/AnswerGame.reference.mdx \
        src/components/answer-game/AnswerGame/AnswerGame.flows.mdx
git commit -m "docs(progress-hud): architecture docs for HUD"
```

---

## Task 13: Full gate + PR

- [ ] **Step 1: Run the full local suite**

Run these in order, fixing anything that fails before moving on:

```bash
yarn typecheck
yarn lint
yarn vitest run
yarn test:storybook
yarn test:vr   # Docker required
```

Expected: all exit 0.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin feat-progress-hud
```

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base master --title "feat(progress-hud): HUD for WordSpell / NumberMatch / SortNumbers" --body "$(cat <<'EOF'
## Summary

- Ships the Progress HUD spec'd in `docs/superpowers/specs/2026-04-15-progress-hud-design.md`
- Default component renders dots + fraction + level label; config flags are composable
- Skin slot `GameSkin.ProgressHUD` can replace the default; `--skin-hud-*` tokens restyle it

## Test plan

- [ ] Unit: `yarn vitest run src/components/answer-game/ProgressHUD`
- [ ] Storybook: `yarn test:storybook`
- [ ] VR: `yarn test:vr` (Docker required)
- [ ] Manual smoke: play WordSpell / NumberMatch / SortNumbers in dev,
      confirm HUD updates round-by-round and level-by-level

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return the PR URL to the user**

---

## Deferred / Future Work (not in this plan)

- **RoundHeader** (per-round descriptor like "Ascending · 1→10") — separate
  spec, tracked in the design doc's Future Work section.
- **Persistent progress** (writes to `progress` collection on `game:end`).
- **Session-recorder wiring** for the AnswerGame path.
- **Adaptive difficulty** (PRD §8).

These are explicitly NOT part of this plan — they belong to future specs.
